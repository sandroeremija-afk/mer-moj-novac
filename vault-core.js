(function exposeVault(root, factory) {
  const api = factory(root?.crypto || (typeof require === 'function' ? require('node:crypto').webcrypto : null));
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerVault = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createVaultApi(cryptoApi) {
  'use strict';
  const ITERATIONS = 600000;
  const IDLE_MS = 10 * 60 * 1000;
  const PREFIX = 'mer-vault-v1:';
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const failure = code => Object.assign(new Error(code), { code });
  const userKey = userId => {
    if (typeof userId !== 'string' || !userId || userId.length > 200) throw failure('INVALID_USER');
    return `${PREFIX}${encodeURIComponent(userId)}`;
  };
  const base64 = bytes => typeof Buffer !== 'undefined' ? Buffer.from(bytes).toString('base64') : btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
  const bytes = value => {
    if (typeof value !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw failure('INVALID_VAULT');
    return typeof Buffer !== 'undefined' ? new Uint8Array(Buffer.from(value, 'base64')) : Uint8Array.from(atob(value), character => character.charCodeAt(0));
  };
  const validatePassphrase = value => typeof value === 'string' && value.length >= 10 && value.length <= 256;
  async function deriveKey(passphrase, salt, iterations = ITERATIONS) {
    if (!cryptoApi?.subtle) throw failure('CRYPTO_UNAVAILABLE');
    if (!validatePassphrase(passphrase)) throw failure('WEAK_PASSPHRASE');
    const material = await cryptoApi.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return cryptoApi.subtle.deriveKey({ name:'PBKDF2', hash:'SHA-256', salt, iterations }, material, { name:'AES-GCM', length:256 }, false, ['encrypt','decrypt']);
  }
  function parseEnvelope(raw, userId) {
    let envelope;
    try { envelope = JSON.parse(raw); } catch { throw failure('INVALID_VAULT'); }
    if (envelope?.version !== 1 || envelope.userId !== userId || envelope.algorithm !== 'AES-256-GCM' || !Number.isInteger(envelope.iterations) || envelope.iterations < 210000 || envelope.iterations > 1000000 || typeof envelope.ciphertext !== 'string' || envelope.ciphertext.length > 24000000 || bytes(envelope.salt).length !== 16 || bytes(envelope.iv).length !== 12 || bytes(envelope.ciphertext).length < 16) throw failure('INVALID_VAULT');
    return envelope;
  }
  async function seal(key, serialized, userId, salt, iterations = ITERATIONS) {
    const iv = cryptoApi.getRandomValues(new Uint8Array(12));
    const ciphertext = await cryptoApi.subtle.encrypt({ name:'AES-GCM', iv, additionalData:encoder.encode(userKey(userId)), tagLength:128 }, key, encoder.encode(serialized));
    return { version:1, algorithm:'AES-256-GCM', userId, iterations, salt:base64(salt), iv:base64(iv), ciphertext:base64(new Uint8Array(ciphertext)), updatedAt:new Date().toISOString() };
  }
  async function unseal(key, envelope, userId) {
    try {
      const plaintext = await cryptoApi.subtle.decrypt({ name:'AES-GCM', iv:bytes(envelope.iv), additionalData:encoder.encode(userKey(userId)), tagLength:128 }, key, bytes(envelope.ciphertext));
      return JSON.parse(decoder.decode(plaintext));
    } catch { throw failure('VAULT_UNLOCK_FAILED'); }
  }
  function createVault({ storage = globalThis.localStorage, userId } = {}) {
    const storageKey = userKey(userId);
    let key = null, salt = null, iterations = ITERATIONS, accepting = false, queue = Promise.resolve();
    const enqueue = operation => {
      const next = queue.then(operation);
      queue = next.catch(() => {});
      return next;
    };
    const exists = () => Boolean(storage.getItem(storageKey));
    async function enable(passphrase, snapshot) {
      if (exists()) throw failure('VAULT_EXISTS');
      const serialized = JSON.stringify(snapshot);
      const nextSalt = cryptoApi.getRandomValues(new Uint8Array(16));
      const nextKey = await deriveKey(passphrase, nextSalt);
      const envelope = await seal(nextKey, serialized, userId, nextSalt);
      // Verify before discarding legacy plaintext; a quota error leaves the source intact.
      storage.setItem(storageKey, JSON.stringify(envelope));
      await unseal(nextKey, parseEnvelope(storage.getItem(storageKey), userId), userId);
      key = nextKey;salt = nextSalt;accepting = true;
      return JSON.parse(serialized);
    }
    async function unlock(passphrase) {
      const envelope = parseEnvelope(storage.getItem(storageKey), userId);
      const nextSalt = bytes(envelope.salt);
      const nextKey = await deriveKey(passphrase, nextSalt, envelope.iterations);
      const snapshot = await unseal(nextKey, envelope, userId);
      key = nextKey;salt = nextSalt;iterations = envelope.iterations;accepting = true;
      return snapshot;
    }
    function persist(snapshot) {
      if (!key || !accepting) return Promise.reject(failure('VAULT_LOCKED'));
      const serialized = JSON.stringify(snapshot), capturedKey = key, capturedSalt = salt;
      return enqueue(async () => {
        const envelope = await seal(capturedKey, serialized, userId, capturedSalt, iterations);
        storage.setItem(storageKey, JSON.stringify(envelope));
        return envelope.updatedAt;
      });
    }
    async function lock() { accepting = false;await queue;key = null;salt = null; }
    async function remove() { await lock();storage.removeItem(storageKey); }
    async function changePassphrase(nextPassphrase) {
      if (!key || !accepting) throw failure('VAULT_LOCKED');
      const capturedKey = key;
      accepting = false;
      try {
        await queue;
        const snapshot = await unseal(capturedKey, parseEnvelope(storage.getItem(storageKey), userId), userId);
        const nextSalt = cryptoApi.getRandomValues(new Uint8Array(16));
        const nextKey = await deriveKey(nextPassphrase, nextSalt);
        const envelope = await seal(nextKey, JSON.stringify(snapshot), userId, nextSalt);
        storage.setItem(storageKey, JSON.stringify(envelope));
        key = nextKey;salt = nextSalt;iterations = ITERATIONS;
      } finally { accepting = true; }
    }
    return { exists, enable, unlock, persist, lock, remove, changePassphrase, flush:() => queue, isUnlocked:() => Boolean(key && accepting), storageKey };
  }
  function createIdleClock({ now = () => Date.now(), timeoutMs = IDLE_MS, onLock = () => {}, lastActivity = now() } = {}) {
    if (!Number.isFinite(timeoutMs) || timeoutMs < 1) throw failure('INVALID_TIMEOUT');
    let last = Number(lastActivity), locked = false;
    function check(timestamp = now()) {
      if (locked) return true;
      // Clock rollback is also a lock condition; it must not extend the idle window.
      if (timestamp < last || timestamp - last >= timeoutMs) { locked = true;onLock(); }
      return locked;
    }
    function activity(timestamp = now()) {
      if (check(timestamp)) return false;
      last = timestamp;return true;
    }
    function reset(timestamp = now()) { locked = false;last = timestamp; }
    return { check, activity, reset, isLocked:() => locked, lastActivity:() => last };
  }
  const secretFields = new Set(['password','passwordhash','salt','secret','recoverycodes','recoverycodehashes','apikey','authorization','sessionid','session','sessions','auth','authentication','credentials','privatekey','encryptionkey','clientsecret','mfabyuser','mfa','mfalegacyowner']);
  const isSecretField = key => { const normalized=String(key).replace(/[_-]/g,'').toLowerCase();return secretFields.has(normalized)||normalized.endsWith('token'); };
  function scopeSnapshot(snapshot, userId) {
    const scoped = JSON.parse(JSON.stringify(snapshot));
    const userMfa = scoped.mfaByUser?.[userId];
    scoped.mfaByUser = userMfa ? {[userId]:userMfa} : {};
    scoped.mfa = userMfa || (scoped.mfaLegacyOwner === userId ? scoped.mfa || {} : {});
    if (scoped.mfaLegacyOwner !== userId) scoped.mfaLegacyOwner=null;
    return scoped;
  }
  function localUserKeys(storage,userId) {
    userKey(userId);
    const encoded=encodeURIComponent(userId),clean=String(userId).trim().toLowerCase().replace(/[^a-z0-9._@-]+/g,'-');
    const layoutScope=String(userId).trim().toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64);
    const keys=new Set([userKey(userId),`mer-cache-v1:${encoded}`,`mer-device-pin-v1:${encoded}`,`mer-onboarding-v1:${clean}`]);
    const prefixes=[`mer-layout-v1:${layoutScope}--personal:`,`mer-layout-v1:${layoutScope}--business:`];
    for(let index=0;index<Number(storage.length||0);index+=1){const key=storage.key(index);if(typeof key==='string'&&prefixes.some(prefix=>key.startsWith(prefix)))keys.add(key);}
    return [...keys];
  }
  function portableSnapshot(snapshot) {
    const clean = value => Array.isArray(value) ? value.map(clean) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).filter(([key]) => !isSecretField(key)).map(([key, entry]) => [key, clean(entry)])) : value;
    return { format:'mer-personal-data', version:1, exportedAt:new Date().toISOString(), data:clean(snapshot) };
  }
  return { ITERATIONS, IDLE_MS, PREFIX, userKey, validatePassphrase, deriveKey, parseEnvelope, createVault, createIdleClock, scopeSnapshot, localUserKeys, portableSnapshot };
});
