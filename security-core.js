(function exposeMerSecurity(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerSecurity = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerSecurity() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const MFA_METHODS = Object.freeze({ AUTHENTICATOR:'authenticator', SMS:'sms' });

  function normalizeMfaMethod(value) {
    const normalized = String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
    if (normalized === 'authenticator' || normalized === 'totp' || normalized === 'authenticatorapp') return MFA_METHODS.AUTHENTICATOR;
    if (normalized === 'sms' || normalized === 'textmessage') return MFA_METHODS.SMS;
    return null;
  }

  function normalizeSmsDestination(value) {
    const raw = String(value || '').trim().replace(/[\s().-]/g, '');
    const international = raw.startsWith('00') ? `+${raw.slice(2)}` : raw;
    if (!/^\+[1-9]\d{7,14}$/.test(international)) return '';
    return international;
  }

  function maskSmsDestination(value) {
    const normalized = normalizeSmsDestination(value);
    if (!normalized) return '';
    const visible = normalized.slice(-4);
    return `${normalized.slice(0, Math.min(4, normalized.length - 4))}${'•'.repeat(Math.max(2, normalized.length - visible.length - 4))}${visible}`;
  }

  function validIsoDate(value) {
    const timestamp = Date.parse(String(value || ''));
    return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
  }

  function createMfaMethodState(input = {}) {
    const source = input && typeof input === 'object' ? input : {};
    const inferredMethod = source.method || (source.secret ? MFA_METHODS.AUTHENTICATOR : source.phoneNumber || source.smsDestination ? MFA_METHODS.SMS : null);
    const method = normalizeMfaMethod(inferredMethod);
    const secret = method === MFA_METHODS.AUTHENTICATOR
      ? String(source.secret || '').toUpperCase().replace(/[^A-Z2-7]/g, '')
      : '';
    const phoneNumber = method === MFA_METHODS.SMS
      ? normalizeSmsDestination(source.phoneNumber || source.smsDestination)
      : '';
    const configured = method === MFA_METHODS.AUTHENTICATOR ? secret.length >= 16 : method === MFA_METHODS.SMS ? Boolean(phoneNumber) : false;
    const enabled = Boolean(source.enabled && configured);
    const enabledAt = enabled ? validIsoDate(source.enabledAt || source.verifiedAt) : null;
    const recoveryCodeHashes = Array.isArray(source.recoveryCodeHashes)
      ? source.recoveryCodeHashes.filter(hash => /^[a-f0-9]{64}$/i.test(String(hash)))
      : [];

    return {
      enabled,
      method,
      secret:method === MFA_METHODS.AUTHENTICATOR ? secret || null : null,
      phoneNumber:method === MFA_METHODS.SMS ? phoneNumber || null : null,
      phoneMasked:method === MFA_METHODS.SMS ? maskSmsDestination(phoneNumber) || null : null,
      recoveryCodeHashes,
      enabledAt,
      verifiedAt:enabledAt
    };
  }

  function randomNumericToken() {
    const upperBound = 0x100000000;
    const acceptedBound = Math.floor(upperBound / 1000000) * 1000000;
    const values = new Uint32Array(1);
    do { cryptoApi().getRandomValues(values); } while (values[0] >= acceptedBound);
    return String(values[0] % 1000000).padStart(6, '0');
  }

  function randomChallengeId() {
    const bytes = new Uint8Array(16);
    cryptoApi().getRandomValues(bytes);
    return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function hashSmsToken(challengeId, token) {
    const payload = `${String(challengeId || '')}:${String(token || '')}`;
    const digest = new Uint8Array(await cryptoApi().subtle.digest('SHA-256', new TextEncoder().encode(payload)));
    return [...digest].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function constantTimeTextEqual(first, second) {
    const left = String(first || '');
    const right = String(second || '');
    if (left.length !== right.length) return false;
    let difference = 0;
    for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
    return difference === 0;
  }

  async function createSmsChallenge(phoneNumber, timeMs = Date.now()) {
    const normalizedPhone = normalizeSmsDestination(phoneNumber);
    if (!normalizedPhone) throw new TypeError('INVALID_SMS_DESTINATION');
    const createdAt = Number(timeMs);
    if (!Number.isFinite(createdAt)) throw new TypeError('INVALID_CHALLENGE_TIME');
    const challengeId = randomChallengeId();
    const demoCode = randomNumericToken();
    return {
      method:MFA_METHODS.SMS,
      challengeId,
      maskedPhone:maskSmsDestination(normalizedPhone),
      codeHash:await hashSmsToken(challengeId, demoCode),
      createdAt,
      expiresAt:createdAt + 5 * 60 * 1000,
      delivery:'local-demo',
      demoCode
    };
  }

  async function validateSmsChallenge(challenge, token, timeMs = Date.now()) {
    const source = challenge && typeof challenge === 'object' ? challenge : {};
    const normalizedToken = String(token || '').replace(/\s/g, '');
    const timestamp = Number(timeMs);
    if (!/^\d{6}$/.test(normalizedToken) || !Number.isFinite(timestamp)) return false;
    if (!/^[a-f0-9]{32}$/i.test(String(source.challengeId || ''))) return false;
    if (!/^[a-f0-9]{64}$/i.test(String(source.codeHash || ''))) return false;
    if (!Number.isFinite(Number(source.expiresAt)) || timestamp >= Number(source.expiresAt)) return false;
    const candidateHash = await hashSmsToken(source.challengeId, normalizedToken);
    return constantTimeTextEqual(candidateHash, source.codeHash);
  }

  function bytesToBase32(bytes) {
    let bits = '';
    for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
    let result = '';
    for (let index = 0; index < bits.length; index += 5) {
      result += alphabet[Number.parseInt(bits.slice(index, index + 5).padEnd(5, '0'), 2)];
    }
    return result;
  }

  function base32ToBytes(value) {
    const normalized = String(value || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
    if (!normalized) throw new Error('Invalid Base32 secret');
    let bits = '';
    for (const character of normalized) {
      const index = alphabet.indexOf(character);
      if (index < 0) throw new Error('Invalid Base32 secret');
      bits += index.toString(2).padStart(5, '0');
    }
    const bytes = [];
    for (let index = 0; index + 8 <= bits.length; index += 8) bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
    return new Uint8Array(bytes);
  }

  function cryptoApi() {
    const api = globalThis.crypto;
    if (!api?.subtle || typeof api.getRandomValues !== 'function') throw new Error('Web Crypto is unavailable');
    return api;
  }

  function generateSecret(byteLength = 20) {
    const bytes = new Uint8Array(Math.max(16, Number(byteLength) || 20));
    cryptoApi().getRandomValues(bytes);
    return bytesToBase32(bytes);
  }

  function counterBytes(counter) {
    let value = BigInt(counter);
    const bytes = new Uint8Array(8);
    for (let index = 7; index >= 0; index -= 1) {
      bytes[index] = Number(value & 255n);
      value >>= 8n;
    }
    return bytes;
  }

  async function generateTotp(secret, timeMs = Date.now(), options = {}) {
    const period = Math.max(1, Number(options.period) || 30);
    const digits = Math.max(6, Math.min(8, Number(options.digits) || 6));
    const counter = Math.floor(Number(timeMs) / 1000 / period);
    const key = await cryptoApi().subtle.importKey('raw', base32ToBytes(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const digest = new Uint8Array(await cryptoApi().subtle.sign('HMAC', key, counterBytes(counter)));
    const offset = digest[digest.length - 1] & 15;
    const binary = ((digest[offset] & 127) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
    return String(binary % (10 ** digits)).padStart(digits, '0');
  }

  async function validateTotp(secret, token, timeMs = Date.now(), windowSteps = 1) {
    const normalized = String(token || '').replace(/\s/g, '');
    if (!/^\d{6}$/.test(normalized)) return false;
    for (let offset = -Math.abs(windowSteps); offset <= Math.abs(windowSteps); offset += 1) {
      if (await generateTotp(secret, Number(timeMs) + offset * 30000) === normalized) return true;
    }
    return false;
  }

  function buildOtpAuthUri(secret, accountName = 'user', issuer = 'mer Moj novac') {
    const label = `${issuer}:${accountName}`;
    return `otpauth://totp/${encodeURIComponent(label)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  }

  function generateRecoveryCodes(count = 10) {
    const codes = [];
    for (let index = 0; index < Math.max(1, count); index += 1) {
      const bytes = new Uint8Array(8);
      cryptoApi().getRandomValues(bytes);
      const raw = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
      codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`);
    }
    return codes;
  }

  async function hashRecoveryCode(code) {
    const normalized = String(code || '').toUpperCase().replace(/[^A-F0-9]/g, '');
    const digest = new Uint8Array(await cryptoApi().subtle.digest('SHA-256', new TextEncoder().encode(normalized)));
    return [...digest].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function createEnrollment(accountName) {
    const secret = generateSecret();
    const recoveryCodes = generateRecoveryCodes();
    const recoveryCodeHashes = await Promise.all(recoveryCodes.map(hashRecoveryCode));
    return { secret, uri: buildOtpAuthUri(secret, accountName), recoveryCodes, recoveryCodeHashes };
  }

  async function consumeRecoveryCode(code, storedHashes) {
    const hash = await hashRecoveryCode(code);
    const index = (storedHashes || []).indexOf(hash);
    if (index < 0) return { valid: false, remainingHashes: [...(storedHashes || [])] };
    const remainingHashes = [...storedHashes];
    remainingHashes.splice(index, 1);
    return { valid: true, remainingHashes };
  }

  return {
    MFA_METHODS,
    normalizeMfaMethod,
    normalizeSmsDestination,
    maskSmsDestination,
    createMfaMethodState,
    createSmsChallenge,
    validateSmsChallenge,
    bytesToBase32,
    base32ToBytes,
    generateSecret,
    generateTotp,
    validateTotp,
    buildOtpAuthUri,
    generateRecoveryCodes,
    hashRecoveryCode,
    createEnrollment,
    consumeRecoveryCode
  };
});
