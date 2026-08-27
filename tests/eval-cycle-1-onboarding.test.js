'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const MerOnboarding = require('../onboarding-core.js');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const authUi = fs.readFileSync(path.join(root, 'auth-ui.js'), 'utf8');
const onboardingUi = fs.readFileSync(path.join(root, 'onboarding.js'), 'utf8');

class MemoryStorage {
  constructor(seed = {}) { this.values = new Map(Object.entries(seed)); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
}

function clock(start = Date.parse('2026-08-27T08:00:00.000Z')) {
  let value = start;
  return {
    now: () => value,
    tick(milliseconds = 1000) { value += milliseconds; }
  };
}

function controller(storage, userId, timer = clock()) {
  return MerOnboarding.createOnboardingController({ storage, userId, now:timer.now });
}

test('evaluation cycle 1: the guided tour covers every core module and Settings', () => {
  assert.deepEqual(
    MerOnboarding.DEFAULT_STEPS.map(step => step.id),
    ['navigation', 'transaction', 'overview', 'budgets', 'savings', 'activity', 'insights', 'settings']
  );
  for (const step of MerOnboarding.DEFAULT_STEPS) {
    assert.equal(typeof step.titleKey, 'string');
    assert.equal(typeof step.bodyKey, 'string');
    assert.equal(typeof step.target, 'string');
    assert.equal(typeof step.placement, 'string');
  }
});

test('evaluation cycle 1: a first login launches once, walks in order and persists completion', () => {
  const storage = new MemoryStorage();
  const timer = clock();
  const firstSession = controller(storage, ' User-A ', timer);

  assert.equal(firstSession.shouldAutoStart(), true);
  let view = firstSession.start();
  assert.equal(view.open, true);
  assert.equal(view.stepIndex, 0);
  assert.equal(view.stepId, 'navigation');
  assert.ok(view.record.launchedAt);
  assert.equal(firstSession.shouldAutoStart(), false, 'opening the tour immediately consumes the one-time auto launch');

  for (const expected of ['transaction', 'overview', 'budgets', 'savings', 'activity', 'insights', 'settings']) {
    timer.tick();
    view = firstSession.next();
    assert.equal(view.stepId, expected);
  }
  timer.tick();
  view = firstSession.complete();
  assert.equal(view.open, false);
  assert.ok(view.record.completedAt);

  const reloadedSession = controller(storage, 'user-a', timer);
  assert.equal(reloadedSession.shouldAutoStart(), false);
  assert.equal(reloadedSession.snapshot().record.completedAt, view.record.completedAt);
  assert.equal(reloadedSession.start().open, false, 'an ordinary start cannot silently relaunch a completed tour');
  timer.tick();
  const manualRestart = reloadedSession.start({ force:true });
  assert.equal(manualRestart.open, true);
  assert.equal(manualRestart.stepId, 'navigation');
  assert.equal(manualRestart.record.completedAt, view.record.completedAt, 'manual replay never erases completion history');
});

test('evaluation cycle 1: dismissal prevents idle relaunch while Settings can manually restart', () => {
  const storage = new MemoryStorage();
  const timer = clock();
  const firstSession = controller(storage, 'user-dismiss', timer);

  firstSession.start();
  timer.tick();
  const dismissed = firstSession.dismiss();
  assert.equal(dismissed.open, false);
  assert.ok(dismissed.record.launchedAt);
  assert.ok(dismissed.record.dismissedAt);
  assert.equal(dismissed.record.completedAt, null);

  const afterReload = controller(storage, 'user-dismiss', timer);
  assert.equal(afterReload.shouldAutoStart(), false, 'X, backdrop or Skip must not create an idle auto-open loop');
  assert.equal(afterReload.start().open, false);

  timer.tick();
  const manual = afterReload.start({ force:true });
  assert.equal(manual.open, true);
  assert.equal(manual.stepId, 'navigation');
  assert.equal(manual.record.dismissedAt, dismissed.record.dismissedAt, 'manual restart preserves the audit record');
});

test('evaluation cycle 1: completion state is isolated per authenticated user', () => {
  const storage = new MemoryStorage();
  const timer = clock();
  const userA = controller(storage, 'user-a', timer);
  userA.start();
  userA.complete();

  const userB = controller(storage, 'user-b', timer);
  assert.equal(userB.shouldAutoStart(), true);
  assert.equal(controller(storage, 'user-a', timer).shouldAutoStart(), false);
  userB.start();
  userB.dismiss();

  const keys = [...storage.values.keys()].sort();
  assert.deepEqual(keys, ['mer-onboarding-v1:user-a', 'mer-onboarding-v1:user-b']);
  assert.notDeepEqual(storage.getItem(keys[0]), storage.getItem(keys[1]));
});

test('evaluation cycle 1: corrupt persistence fails safely without affecting another user', () => {
  const storage = new MemoryStorage({
    'mer-onboarding-v1:broken-user': '{not-json',
    'mer-onboarding-v1:finished-user': JSON.stringify({
      launchedAt:'2026-08-20T08:00:00.000Z',
      completedAt:'2026-08-20T08:05:00.000Z',
      dismissedAt:null
    })
  });
  assert.equal(controller(storage, 'broken-user').shouldAutoStart(), true);
  assert.equal(controller(storage, 'finished-user').shouldAutoStart(), false);
});

test('evaluation cycle 1: login, Settings and Help wire the controller into the real UI', () => {
  for (const id of ['onboardingTour', 'onboardingSpotlight', 'onboardingPopover', 'onboardingTitle', 'onboardingBody', 'onboardingProgress', 'onboardingPrevious', 'onboardingNext', 'onboardingSkip', 'restartOnboarding']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.doesNotMatch(html, /<dialog[^>]*id="onboardingModal"/);
  assert.match(html, /id="onboardingTour"[^>]*hidden/);
  assert.match(html, /id="onboardingPopover"[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(html, /id="onboardingPopover"[^>]*aria-labelledby="onboardingTitle"[^>]*aria-describedby="onboardingBody"/);
  assert.match(html, /id="onboardingProgress"[^>]*role="status"[^>]*aria-live="polite"/);

  const coreScript = html.search(/<script src="onboarding-core\.js(?:\?[^\"]*)?"><\/script>/);
  const uiScript = html.search(/<script src="onboarding\.js(?:\?[^\"]*)?"><\/script>/);
  const authScript = html.search(/<script src="auth-ui\.js(?:\?[^\"]*)?"><\/script>/);
  assert.ok(coreScript > 0 && coreScript < uiScript && uiScript < authScript);
  assert.match(authUi, /MerOnboardingUi\?\.onSessionStarted\(session\)/);
  assert.match(onboardingUi, /MerAuthProvider\?\.currentSession\?\.\(\)\?\.userId/);
  assert.match(onboardingUi, /restartOnboarding[^\n]*restartTourFrom/);
  assert.match(onboardingUi, /restart\(returnTarget = null\)[^}]*openTour\(\{ force:true, returnTarget \}\)/);
  assert.match(onboardingUi, /restartTourFrom[\s\S]*openTour\(\{\s*force:true/);
  assert.match(onboardingUi, /getBoundingClientRect\(\)/);
  assert.match(onboardingUi, /ResizeObserver/);
  assert.match(onboardingUi, /scrollIntoView/);
});

test('evaluation cycle 1: session auto-start is unforced, cached per user and has no idle reopen loop', () => {
  assert.match(onboardingUi, /function controllerFor\(session\)[\s\S]*controller\.snapshot\(\)\.userId/);
  assert.match(onboardingUi, /onSessionStarted\(session\)\s*\{[^}]*pendingSession\s*=\s*session[^}]*openTour\(\)/);
  assert.match(onboardingUi, /resume\(\)\s*\{[^}]*openTour\(\)/);
  assert.doesNotMatch(onboardingUi, /onSessionStarted[\s\S]{0,160}force\s*:\s*true/);
  assert.doesNotMatch(onboardingUi, /setInterval\s*\(/, 'onboarding never reopens from an idle polling loop');
});

test('evaluation cycle 1: duplicate session callbacks leave an active tour interactive', () => {
  assert.match(onboardingUi, /controller\s*=\s*controllerFor\(session\);\s*if \(!tour\.hidden && controller\.snapshot\(\)\.open\) return true;\s*const snapshot = controller\.start/);
});
