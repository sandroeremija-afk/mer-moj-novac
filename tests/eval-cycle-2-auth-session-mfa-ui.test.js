'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const authUi = fs.readFileSync(path.join(root, 'auth-ui.js'), 'utf8');
const premium = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

test('evaluation cycle 2: MFA state and unlock proof are isolated by authenticated user and session', () => {
  assert.match(app, /appState\.mfaByUser\[userId\]/);
  assert.match(app, /appState\.mfaLegacyOwner=userId/);
  assert.match(app, /sessionCanOwnLegacyMfa\(session,userId\)/);
  assert.match(app, /MFA_UNLOCK_PROOF_KEY='mer-mfa-unlock-proof-v2'/);
  assert.match(app, /proof\.sessionId===sessionId&&proof\.userId===userId/);
  assert.match(app, /Number\(proof\.expiresAt\)>now/);
  assert.match(app, /sessionStorage\.removeItem\('mer-mfa-unlocked'\)/);
  assert.match(authUi, /MerMfaState\?\.activate\?\.\(session\)/);
  assert.match(authUi, /function showAuth\(\)[\s\S]*?MerMfaUnlock\?\.clear\?\.\(\)[\s\S]*?MerMfaState\?\.deactivate\?\.\(\)/);
});

test('evaluation cycle 2: session registry validation, heartbeat and MFA lock accessibility remain active', () => {
  assert.match(authUi, /function enforceActiveSession\(\{touch=false\}=\{\}\)/);
  assert.match(authUi, /event\.key===MerAuth\.SESSIONS_KEY\|\|event\.key===MerAuth\.USERS_KEY/);
  assert.match(authUi, /setInterval\(\(\)=>enforceActiveSession\(\{touch:true\}\),30000\)/);
  assert.match(authUi, /mfaLockScreen\.addEventListener\('keydown'[\s\S]*?event\.key!=='Tab'/);
  assert.match(authUi, /appShell\.inert = true/);
  assert.match(authUi, /mfaUnlockCode\.focus\(\{ preventScroll:true \}\)/);
  assert.match(html, /id="mfaLockScreen"[^>]*role="dialog"[^>]*aria-modal="true"[^>]*tabindex="-1"/);
  assert.match(css, /\.mfa-method-selector button\s*\{[^}]*min-height:44px/);
});

test('evaluation cycle 2: disabling SMS MFA requires its own expiring challenge or a recovery code', () => {
  assert.match(html, /id="sendMfaDisableSmsCode"/);
  assert.match(html, /id="mfaDisableSmsDelivery" role="status" aria-live="polite"/);
  assert.match(premium, /pendingSmsDisableChallenge=await MerSecurity\.createSmsChallenge\(appState\.mfa\.phoneNumber\)/);
  assert.match(premium, /verifyDisableMfaCode[\s\S]*?validateSmsChallenge\(pendingSmsDisableChallenge,code\)/);
  assert.match(premium, /disableMfa'[\s\S]*?verifyDisableMfaCode/);
  assert.doesNotMatch(premium, /sessionStorage\.(?:setItem|removeItem)\('mer-mfa-unlocked'/);
});

test('evaluation cycle 2: local security capabilities and password reset delivery are labeled honestly', () => {
  assert.match(html, /Lokalne sesije preglednika/);
  assert.match(premium, /Local browser sessions/);
  assert.match(premium, /local SMS demo adapter/i);
  assert.match(html, /stvarna e-pošta neće biti poslana/);
  assert.match(authUi, /no real email will be sent/i);
  assert.match(authUi, /passwordResetAction: 'Simulate request'/);
});
