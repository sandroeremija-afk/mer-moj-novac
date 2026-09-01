'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const MerSecurity = require('../security-core.js');

test('evaluation cycle 2: MFA method state migrates legacy TOTP and normalizes SMS metadata', () => {
  assert.equal(MerSecurity.normalizeMfaMethod('TOTP'), MerSecurity.MFA_METHODS.AUTHENTICATOR);
  assert.equal(MerSecurity.normalizeMfaMethod('Authenticator app'), MerSecurity.MFA_METHODS.AUTHENTICATOR);
  assert.equal(MerSecurity.normalizeMfaMethod('text-message'), MerSecurity.MFA_METHODS.SMS);
  assert.equal(MerSecurity.normalizeMfaMethod('email'), null);

  const legacyTotp = MerSecurity.createMfaMethodState({
    enabled:true,
    secret:'JBSWY3DPEHPK3PXP',
    enabledAt:'2026-09-01T12:00:00.000Z'
  });
  assert.equal(legacyTotp.method, 'authenticator');
  assert.equal(legacyTotp.enabled, true);
  assert.equal(legacyTotp.phoneNumber, null);

  const sms = MerSecurity.createMfaMethodState({
    enabled:true,
    method:'sms',
    phoneNumber:'+385 91 234 5678',
    verifiedAt:'2026-09-01T12:00:00.000Z'
  });
  assert.equal(sms.method, 'sms');
  assert.equal(sms.enabled, true);
  assert.equal(sms.phoneNumber, '+385912345678');
  assert.match(sms.phoneMasked, /5678$/);
  assert.equal(sms.secret, null);

  const invalidSms = MerSecurity.createMfaMethodState({ enabled:true, method:'sms', phoneNumber:'091 12' });
  assert.equal(invalidSms.method, 'sms');
  assert.equal(invalidSms.enabled, false);
  assert.equal(invalidSms.phoneNumber, null);
});

test('evaluation cycle 2: local SMS challenges are hashed, masked and expire after five minutes', async () => {
  const now = 1_800_000_000_000;
  const challenge = await MerSecurity.createSmsChallenge('+385 91 234 5678', now);
  assert.equal(challenge.method, 'sms');
  assert.equal(challenge.delivery, 'local-demo');
  assert.match(challenge.maskedPhone, /5678$/);
  assert.match(challenge.demoCode, /^\d{6}$/);
  assert.match(challenge.codeHash, /^[a-f0-9]{64}$/);
  assert.equal(challenge.expiresAt, now + 300_000);
  assert.equal('phoneNumber' in challenge, false, 'the challenge stores only a masked destination');
  assert.equal(challenge.codeHash.includes(challenge.demoCode), false);
  assert.equal(await MerSecurity.validateSmsChallenge(challenge, challenge.demoCode, now + 299_999), true);
  assert.equal(await MerSecurity.validateSmsChallenge(challenge, '000000' === challenge.demoCode ? '000001' : '000000', now + 1), false);
  assert.equal(await MerSecurity.validateSmsChallenge(challenge, challenge.demoCode, now + 300_000), false);
  await assert.rejects(() => MerSecurity.createSmsChallenge('not-a-phone', now), /INVALID_SMS_DESTINATION/);
});
