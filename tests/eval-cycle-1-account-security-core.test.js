'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const MerAuth = require('../auth-core.js');

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

test('evaluation cycle 1: password changes validate input, persist only a fresh hash and revoke other sessions', async () => {
  const usersStorage = new MemoryStorage();
  const firstSessionStorage = new MemoryStorage();
  const secondSessionStorage = new MemoryStorage();
  let now = 1_800_000_000_000;
  const options = { usersStorage, now:() => now, sessionDurationMs:60_000 };
  const first = MerAuth.createLocalProvider({ ...options, sessionStorage:firstSessionStorage, sessionLabel:'Zagreb laptop' });
  const second = MerAuth.createLocalProvider({ ...options, sessionStorage:secondSessionStorage, sessionLabel:'Mobile browser' });
  const originalPassword = 'sigurna-lozinka-2026';
  const nextPassword = 'nova-sigurna-lozinka-2027';

  assert.equal((await first.register({ name:'Ana Horvat', email:'ana@example.com', password:originalPassword })).ok, true);
  assert.equal((await second.signIn({ email:'ana@example.com', password:originalPassword })).ok, true);
  assert.equal(first.listActiveSessions().length, 2);

  assert.deepEqual(await first.changePassword({ currentPassword:originalPassword, newPassword:'short', confirmPassword:'short' }), { ok:false, code:'WEAK_PASSWORD' });
  assert.deepEqual(await first.changePassword({ currentPassword:originalPassword, newPassword:nextPassword, confirmPassword:'different' }), { ok:false, code:'PASSWORD_MISMATCH' });
  assert.deepEqual(await first.changePassword({ currentPassword:'incorrect-current', newPassword:nextPassword, confirmPassword:nextPassword }), { ok:false, code:'INVALID_CURRENT_PASSWORD' });
  assert.deepEqual(await first.changePassword({ currentPassword:originalPassword, newPassword:originalPassword, confirmPassword:originalPassword }), { ok:false, code:'PASSWORD_REUSED' });

  const changed = await first.changePassword({ currentPassword:originalPassword, newPassword:nextPassword, confirmPassword:nextPassword });
  assert.equal(changed.ok, true);
  assert.equal(changed.revokedSessions, 1);
  assert.equal(first.listActiveSessions().length, 1);
  assert.equal(first.currentSession().sessionId, changed.session.sessionId);
  assert.equal(second.currentSession(), null, 'password rotation invalidates another active browser session');

  const persistedUsers = usersStorage.getItem(MerAuth.USERS_KEY);
  assert.doesNotMatch(persistedUsers, new RegExp(originalPassword));
  assert.doesNotMatch(persistedUsers, new RegExp(nextPassword));
  assert.match(persistedUsers, /passwordUpdatedAt/);

  const verifier = MerAuth.createLocalProvider({ ...options, sessionStorage:new MemoryStorage() });
  assert.equal((await verifier.signIn({ email:'ana@example.com', password:originalPassword })).ok, false);
  assert.equal((await verifier.signIn({ email:'ana@example.com', password:nextPassword })).ok, true);
  now += 60_001;
  assert.equal(first.currentSession(), null);
});

test('evaluation cycle 1: active session management is user-isolated and revocation is immediate', async () => {
  const usersStorage = new MemoryStorage();
  const alicePrimary = MerAuth.createLocalProvider({ usersStorage, sessionStorage:new MemoryStorage(), sessionLabel:'Alice laptop' });
  const aliceSecondary = MerAuth.createLocalProvider({ usersStorage, sessionStorage:new MemoryStorage(), sessionLabel:'Alice phone' });
  const bob = MerAuth.createLocalProvider({ usersStorage, sessionStorage:new MemoryStorage(), sessionLabel:'Bob laptop' });
  await alicePrimary.register({ name:'Alice User', email:'alice@example.com', password:'alice-password-2026' });
  const secondarySession = (await aliceSecondary.signIn({ email:'alice@example.com', password:'alice-password-2026' })).session;
  await bob.register({ name:'Bob User', email:'bob@example.com', password:'bob-password-2026' });

  assert.deepEqual(alicePrimary.listActiveSessions().map(session => session.label).sort(), ['Alice laptop', 'Alice phone']);
  assert.deepEqual(bob.listActiveSessions().map(session => session.label), ['Bob laptop']);
  assert.deepEqual(alicePrimary.revokeSession(secondarySession.sessionId), { ok:true, signedOut:false, sessionId:secondarySession.sessionId });
  assert.equal(aliceSecondary.currentSession(), null);
  assert.equal(bob.currentSession().email, 'bob@example.com', 'one account cannot revoke another account session');
  assert.deepEqual(alicePrimary.revokeSession(bob.currentSession().sessionId), { ok:false, code:'SESSION_NOT_FOUND' });

  await aliceSecondary.signIn({ email:'alice@example.com', password:'alice-password-2026' });
  assert.deepEqual(alicePrimary.revokeOtherSessions(), { ok:true, revoked:1 });
  assert.equal(aliceSecondary.currentSession(), null);
  assert.equal(bob.currentSession().email, 'bob@example.com');
});

test('evaluation cycle 1: legacy and demo sessions gain safe current-browser metadata', () => {
  const usersStorage = new MemoryStorage();
  const legacyStorage = new MemoryStorage();
  const now = 1_800_000_000_000;
  legacyStorage.setItem(MerAuth.SESSION_KEY, JSON.stringify({
    userId:'legacy-user',
    name:'Legacy User',
    email:'legacy@example.com',
    demo:false,
    issuedAt:now,
    expiresAt:now + 60_000
  }));
  const legacy = MerAuth.createLocalProvider({ usersStorage, sessionStorage:legacyStorage, now:() => now, sessionLabel:'Migrated browser' });
  const migrated = legacy.currentSession();
  assert.match(migrated.sessionId, /^session-/);
  assert.deepEqual(legacy.listActiveSessions().map(session => ({ label:session.label, current:session.current })), [{ label:'Migrated browser', current:true }]);

  const demo = MerAuth.createLocalProvider({ usersStorage:new MemoryStorage(), sessionStorage:new MemoryStorage(), now:() => now, sessionLabel:'Demo browser' });
  const demoSession = demo.startDemo('Sandro');
  assert.equal(demo.listActiveSessions()[0].demo, true);
  assert.deepEqual(demo.revokeSession(demoSession.sessionId), { ok:true, signedOut:true, sessionId:demoSession.sessionId });
  assert.equal(demo.currentSession(), null);
});
