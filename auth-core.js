(function exposeMerAuth(root, factory) {
  const api = factory(root?.crypto || (typeof require === 'function' ? require('node:crypto').webcrypto : null));
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerAuth = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerAuth(cryptoApi) {
  const USERS_KEY = 'mer-auth-users-v1';
  const SESSION_KEY = 'mer-auth-session-v1';
  const SESSIONS_KEY = 'mer-auth-session-registry-v1';
  const ITERATIONS = 210000;
  const MIN_PASSWORD_LENGTH = 10;
  const MAX_PASSWORD_LENGTH = 256;
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
  const cleanSessionLabel = value => String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 60) || 'Current browser';

  function validatePassword(password) {
    const value = String(password || '');
    if (value.length < MIN_PASSWORD_LENGTH || value.length > MAX_PASSWORD_LENGTH) return { ok:false, code:'WEAK_PASSWORD' };
    return { ok:true, code:null };
  }

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
    const sessionLabel = cleanSessionLabel(options.sessionLabel);
    const passwordResetHandler = options.passwordResetHandler || (async () => ({ delivery: 'local-demo' }));

    const users = () => {
      const records = readJson(usersStorage, USERS_KEY, []);
      return Array.isArray(records) ? records : [];
    };
    const saveUsers = records => usersStorage.setItem(USERS_KEY, JSON.stringify(records));
    const sessionRecords = () => {
      const records = readJson(usersStorage, SESSIONS_KEY, null);
      return Array.isArray(records) ? records : null;
    };
    const saveSessionRecords = records => usersStorage?.setItem(SESSIONS_KEY, JSON.stringify(records));
    const newSessionId = () => {
      const bytes = cryptoApi.getRandomValues(new Uint8Array(18));
      return `session-${bytesToBase64(bytes).replace(/[^a-z0-9]/gi, '').slice(0, 24)}`;
    };
    const activeSessionRecords = (records = sessionRecords() || [], timestamp = now()) => {
      const seen = new Set();
      return records.reduce((active, record) => {
        if (!record || typeof record.id !== 'string' || !record.id || typeof record.userId !== 'string') return active;
        const expiresAt = Number(record.expiresAt);
        if (!Number.isFinite(expiresAt) || expiresAt <= timestamp || seen.has(record.id)) return active;
        seen.add(record.id);
        const issuedAt = Number(record.issuedAt);
        const lastActiveAt = Number(record.lastActiveAt);
        active.push({
          id:record.id,
          userId:record.userId,
          label:cleanSessionLabel(record.label),
          issuedAt:Number.isFinite(issuedAt) ? issuedAt : timestamp,
          lastActiveAt:Number.isFinite(lastActiveAt) ? lastActiveAt : Number.isFinite(issuedAt) ? issuedAt : timestamp,
          expiresAt,
          demo:Boolean(record.demo)
        });
        return active;
      }, []);
    };
    const recordForSession = session => ({
      id:session.sessionId,
      userId:session.userId,
      label:cleanSessionLabel(session.label || sessionLabel),
      issuedAt:Number(session.issuedAt),
      lastActiveAt:Number(session.lastActiveAt || session.issuedAt),
      expiresAt:Number(session.expiresAt),
      demo:Boolean(session.demo)
    });
    const registerSession = session => {
      const records = activeSessionRecords().filter(record => record.id !== session.sessionId);
      records.push(recordForSession(session));
      saveSessionRecords(records);
      return session;
    };
    const removeSessionRecord = sessionId => {
      if (!sessionId) return false;
      const existing = sessionRecords();
      if (!existing) return false;
      const next = activeSessionRecords(existing).filter(record => record.id !== sessionId);
      const changed = next.length !== activeSessionRecords(existing).length;
      saveSessionRecords(next);
      return changed;
    };

    async function register({ name, email, password }) {
      const cleanName = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 70);
      const cleanEmail = normalizeEmail(email);
      if (cleanName.length < 2) return { ok: false, code: 'INVALID_NAME' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { ok: false, code: 'INVALID_EMAIL' };
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.ok) return passwordValidation;
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
      const previous = readJson(sessionStorage, SESSION_KEY, null);
      if (previous?.sessionId) removeSessionRecord(previous.sessionId);
      const timestamp = now();
      const session = {
        sessionId:newSessionId(),
        userId:user.id,
        name:user.name,
        email:user.email,
        demo:Boolean(demo),
        label:sessionLabel,
        issuedAt:timestamp,
        lastActiveAt:timestamp,
        expiresAt:timestamp + sessionDurationMs
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      registerSession(session);
      return { ...session };
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
      let session = readJson(sessionStorage, SESSION_KEY, null);
      const timestamp = now();
      if (!session || typeof session.userId !== 'string' || !Number.isFinite(session.expiresAt) || session.expiresAt <= timestamp) {
        if (session?.sessionId) removeSessionRecord(session.sessionId);
        sessionStorage?.removeItem(SESSION_KEY);
        return null;
      }

      const registry = sessionRecords();
      if (!session.sessionId) {
        session = {
          ...session,
          sessionId:newSessionId(),
          label:cleanSessionLabel(session.label || sessionLabel),
          lastActiveAt:Number(session.lastActiveAt || session.issuedAt || timestamp)
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        registerSession(session);
      } else if (registry === null) {
        registerSession(session);
      } else {
        const active = activeSessionRecords(registry, timestamp);
        const registered = active.find(record => record.id === session.sessionId && record.userId === session.userId);
        if (!registered) {
          sessionStorage?.removeItem(SESSION_KEY);
          if (active.length !== registry.length) saveSessionRecords(active);
          return null;
        }
        if (active.length !== registry.length) saveSessionRecords(active);
      }
      return { ...session };
    }

    function listActiveSessions() {
      const current = currentSession();
      if (!current) return [];
      return activeSessionRecords()
        .filter(record => record.userId === current.userId)
        .sort((first, second) => second.lastActiveAt - first.lastActiveAt)
        .map(record => ({
          id:record.id,
          label:record.label,
          issuedAt:record.issuedAt,
          lastActiveAt:record.lastActiveAt,
          expiresAt:record.expiresAt,
          current:record.id === current.sessionId,
          demo:Boolean(record.demo)
        }));
    }

    function touchCurrentSession() {
      const session = currentSession();
      if (!session) return null;
      const timestamp = now();
      const next = { ...session, lastActiveAt:timestamp };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      const records = activeSessionRecords().map(record => record.id === next.sessionId ? recordForSession(next) : record);
      saveSessionRecords(records);
      return { ...next };
    }

    function revokeSession(sessionId) {
      const current = currentSession();
      if (!current) return { ok:false, code:'AUTH_REQUIRED' };
      const targetId = String(sessionId || '');
      const records = activeSessionRecords();
      const target = records.find(record => record.id === targetId && record.userId === current.userId);
      if (!target) return { ok:false, code:'SESSION_NOT_FOUND' };
      saveSessionRecords(records.filter(record => record.id !== targetId));
      const signedOut = targetId === current.sessionId;
      if (signedOut) sessionStorage?.removeItem(SESSION_KEY);
      return { ok:true, signedOut, sessionId:targetId };
    }

    function revokeOtherSessions() {
      const current = currentSession();
      if (!current) return { ok:false, code:'AUTH_REQUIRED', revoked:0 };
      const records = activeSessionRecords();
      const revoked = records.filter(record => record.userId === current.userId && record.id !== current.sessionId).length;
      saveSessionRecords(records.filter(record => record.userId !== current.userId || record.id === current.sessionId));
      return { ok:true, revoked };
    }

    async function changePassword({ currentPassword, newPassword, confirmPassword } = {}) {
      const session = currentSession();
      if (!session) return { ok:false, code:'AUTH_REQUIRED' };
      if (session.demo) return { ok:false, code:'DEMO_READ_ONLY' };
      if (String(newPassword || '') !== String(confirmPassword || '')) return { ok:false, code:'PASSWORD_MISMATCH' };
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.ok) return passwordValidation;

      const records = users();
      const userIndex = records.findIndex(record => record.id === session.userId);
      if (userIndex < 0) return { ok:false, code:'AUTH_REQUIRED' };
      const user = records[userIndex];
      const currentCandidate = await derivePassword(currentPassword, base64ToBytes(user.salt), user.iterations || ITERATIONS);
      if (!safeEqual(currentCandidate, base64ToBytes(user.passwordHash))) return { ok:false, code:'INVALID_CURRENT_PASSWORD' };
      if (String(currentPassword || '') === String(newPassword || '')) return { ok:false, code:'PASSWORD_REUSED' };

      const salt = cryptoApi.getRandomValues(new Uint8Array(16));
      const passwordHash = await derivePassword(newPassword, salt);
      const updatedUser = {
        ...user,
        salt:bytesToBase64(salt),
        passwordHash:bytesToBase64(passwordHash),
        iterations:ITERATIONS,
        passwordUpdatedAt:new Date(now()).toISOString()
      };
      records[userIndex] = updatedUser;
      saveUsers(records);

      const registry = activeSessionRecords();
      const revokedSessions = registry.filter(record => record.userId === user.id && record.id !== session.sessionId).length;
      saveSessionRecords(registry.filter(record => record.userId !== user.id));
      sessionStorage?.removeItem(SESSION_KEY);
      const nextSession = createSession(updatedUser, false);
      return { ok:true, session:nextSession, revokedSessions };
    }

    function signOut() {
      const session = readJson(sessionStorage, SESSION_KEY, null);
      if (session?.sessionId) removeSessionRecord(session.sessionId);
      sessionStorage?.removeItem(SESSION_KEY);
    }

    return {
      register,
      signIn,
      changePassword,
      requestPasswordReset,
      signOut,
      startDemo,
      currentSession,
      listActiveSessions,
      touchCurrentSession,
      revokeSession,
      revokeOtherSessions,
      normalizeEmail
    };
  }

  return {
    USERS_KEY,
    SESSION_KEY,
    SESSIONS_KEY,
    ITERATIONS,
    MIN_PASSWORD_LENGTH,
    MAX_PASSWORD_LENGTH,
    derivePassword,
    validatePassword,
    createLocalProvider,
    normalizeEmail
  };
});
