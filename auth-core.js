(function exposeMerAuth(root, factory) {
  const api = factory(root?.crypto || (typeof require === 'function' ? require('node:crypto').webcrypto : null));
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerAuth = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerAuth(cryptoApi) {
  const USERS_KEY = 'mer-auth-users-v1';
  const SESSION_KEY = 'mer-auth-session-v1';
  const ITERATIONS = 210000;
  const encoder = new TextEncoder();

  const normalizeEmail = value => String(value || '').trim().toLocaleLowerCase('en');
  const bytesToBase64 = bytes => {
    if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  };
  const base64ToBytes = value => {
    if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(value, 'base64'));
    return Uint8Array.from(atob(value), character => character.charCodeAt(0));
  };
  const readJson = (storage, key, fallback) => {
    try { return JSON.parse(storage?.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
  };
  const safeEqual = (first, second) => {
    if (first.length !== second.length) return false;
    let difference = 0;
    for (let index = 0; index < first.length; index += 1) difference |= first[index] ^ second[index];
    return difference === 0;
  };

  async function derivePassword(password, salt, iterations = ITERATIONS) {
    if (!cryptoApi?.subtle) throw new Error('Web Crypto is required');
    const key = await cryptoApi.subtle.importKey('raw', encoder.encode(String(password)), 'PBKDF2', false, ['deriveBits']);
    const bits = await cryptoApi.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
    return new Uint8Array(bits);
  }

  function createLocalProvider(options = {}) {
    const usersStorage = options.usersStorage || globalThis.localStorage;
    const sessionStorage = options.sessionStorage || globalThis.sessionStorage;
    const now = options.now || (() => Date.now());
    const sessionDurationMs = options.sessionDurationMs || 12 * 60 * 60 * 1000;
    const passwordResetHandler = options.passwordResetHandler || (async () => ({ delivery: 'local-demo' }));

    const users = () => readJson(usersStorage, USERS_KEY, []);
    const saveUsers = records => usersStorage.setItem(USERS_KEY, JSON.stringify(records));

    async function register({ name, email, password }) {
      const cleanName = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 70);
      const cleanEmail = normalizeEmail(email);
      if (cleanName.length < 2) return { ok: false, code: 'INVALID_NAME' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { ok: false, code: 'INVALID_EMAIL' };
      if (String(password || '').length < 10) return { ok: false, code: 'WEAK_PASSWORD' };
      const records = users();
      if (records.some(user => user.email === cleanEmail)) return { ok: false, code: 'EMAIL_EXISTS' };
      const salt = cryptoApi.getRandomValues(new Uint8Array(16));
      const passwordHash = await derivePassword(password, salt);
      const user = { id: `user-${now()}-${bytesToBase64(salt).replace(/[^a-z0-9]/gi, '').slice(0, 8)}`, name: cleanName, email: cleanEmail, salt: bytesToBase64(salt), passwordHash: bytesToBase64(passwordHash), iterations: ITERATIONS, createdAt: new Date(now()).toISOString() };
      records.push(user);
      saveUsers(records);
      return { ok: true, session: createSession(user, false) };
    }

    function createSession(user, demo) {
      const session = { userId: user.id, name: user.name, email: user.email, demo: Boolean(demo), issuedAt: now(), expiresAt: now() + sessionDurationMs };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return session;
    }

    async function signIn({ email, password }) {
      const user = users().find(record => record.email === normalizeEmail(email));
      if (!user) return { ok: false, code: 'INVALID_CREDENTIALS' };
      const candidate = await derivePassword(password, base64ToBytes(user.salt), user.iterations || ITERATIONS);
      if (!safeEqual(candidate, base64ToBytes(user.passwordHash))) return { ok: false, code: 'INVALID_CREDENTIALS' };
      return { ok: true, session: createSession(user, false) };
    }

    async function requestPasswordReset({ email }) {
      const cleanEmail = normalizeEmail(email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { ok: false, code: 'INVALID_EMAIL' };
      const user = users().find(record => record.email === cleanEmail);
      try {
        const result = await passwordResetHandler({ email: cleanEmail, userId: user?.id || null });
        return { ok: true, requestId: result?.requestId || null, delivery: result?.delivery || 'accepted' };
      } catch {
        return { ok: false, code: 'RESET_UNAVAILABLE' };
      }
    }

    function startDemo(name = 'Alex Morgan') {
      return createSession({ id: 'demo-user', name, email: 'demo@mer.local' }, true);
    }

    function currentSession() {
      const session = readJson(sessionStorage, SESSION_KEY, null);
      if (!session || !Number.isFinite(session.expiresAt) || session.expiresAt <= now()) {
        sessionStorage?.removeItem(SESSION_KEY);
        return null;
      }
      return { ...session };
    }

    function signOut() { sessionStorage?.removeItem(SESSION_KEY); }

    return { register, signIn, requestPasswordReset, signOut, startDemo, currentSession, normalizeEmail };
  }

  return { USERS_KEY, SESSION_KEY, ITERATIONS, derivePassword, createLocalProvider, normalizeEmail };
});
