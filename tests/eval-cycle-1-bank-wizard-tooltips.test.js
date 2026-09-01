'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const modal = html.slice(html.indexOf('id="connectedBanksModal"'), html.indexOf('</dialog>', html.indexOf('id="connectedBanksModal"')));

test('evaluation cycle 1: bank connection is a two-step alternate view instead of appended fields', () => {
  for (const id of ['bankConnectionsView','bankConnectForm','bankInstitutionStep','bankAccountStep','bankConnectionBack']) {
    assert.match(modal, new RegExp(`id="${id}"`));
  }
  assert.match(modal, /data-bank-step="institution"/);
  assert.match(modal, /data-bank-step="accounts"[^>]*hidden/);
  assert.match(app, /let bankConnectionStep = 'overview'/);
  assert.match(app, /function setBankConnectionStep\(step,\{focus=false\}=\{\}\)/);
  assert.match(app, /overview\.hidden=connecting;[\s\S]*form\.hidden=!connecting/);
  assert.match(app, /function selectBankProvider\(providerId\)[\s\S]*setBankConnectionStep\('accounts',\{focus:true\}\)/);
  const start = app.slice(app.indexOf('function startBankConnection()'), app.indexOf('async function syncBankConnection'));
  assert.doesNotMatch(start, /openBankSettings\(\)/);
  assert.match(start, /setBankConnectionStep\('institution',\{focus:true\}\)/);
});

test('evaluation cycle 1: bank action buttons expose exact accessible Croatian tooltip copy', () => {
  assert.match(app, /manualBankSyncTooltip:'Ručno sinkroniziraj transakcije'/);
  assert.match(app, /unlinkBankTooltip:'Prekini vezu s bankom'/);
  assert.match(app, /data-bank-tooltip-key="manualBankSyncTooltip"[^>]*title="\$\{t\('manualBankSyncTooltip'\)\}"[^>]*aria-label="\$\{t\('manualBankSyncTooltip'\)\}"/);
  assert.match(app, /data-bank-tooltip-key="unlinkBankTooltip"[^>]*title="\$\{t\('unlinkBankTooltip'\)\}"[^>]*aria-label="\$\{t\('unlinkBankTooltip'\)\}"/);
  assert.match(app, /function bindBankActionTooltips\(\)[\s\S]*addEventListener\('mouseenter'/);
  assert.match(app, /setTimeout\(\(\)=>\{longPressed=true;showBankActionTooltip\(trigger\);\},450\)/);
  assert.match(app, /addEventListener\('click',event=>\{if\(!longPressed\)return;event\.preventDefault\(\);event\.stopImmediatePropagation\(\)/);
});

test('evaluation cycle 1: transient demo token is cleared and never copied into a connection', () => {
  const connect = app.slice(app.indexOf('async function connectSelectedBankAccounts'), app.indexOf('function formatIsoDate'));
  assert.match(connect, /\$\('#bankApiToken'\)\.value=''/);
  assert.doesNotMatch(connect, /connection\.(?:apiToken|accessToken|credentials)\s*=/);
  assert.match(connect, /connection\.connectionAlias=/);
});
