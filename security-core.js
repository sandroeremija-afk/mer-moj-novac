(function exposeMerSecurity(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerSecurity = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerSecurity() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

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

  return { bytesToBase32, base32ToBytes, generateSecret, generateTotp, validateTotp, buildOtpAuthUri, generateRecoveryCodes, hashRecoveryCode, createEnrollment, consumeRecoveryCode };
});

