'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_STEPS, createOnboardingController } = require('../onboarding-core.js');

function storage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return { getItem:key => values.get(key) || null, setItem:(key, value) => values.set(key, value) };
}

function atSettings(options = {}) {
  const controller = createOnboardingController({ storage:storage(), userId:'walkthrough', ...options });
  controller.start();
  for (let index = 0; index < 5; index += 1) controller.next();
  assert.equal(controller.snapshot().stepId, 'settings');
  return controller;
}

test('cycle 1: settings exposes preferences, password and MFA without adding main steps', () => {
  assert.equal(DEFAULT_STEPS.length, 7);
  const settings = DEFAULT_STEPS[5];
  assert.equal(settings.surface, 'settings');
  assert.deepEqual(settings.substeps.map(step => [step.id, step.target, step.settingsTab]), [
    ['general', '#settingsTourPreferences', 'general'],
    ['password', '#changePasswordForm', 'security'],
    ['mfa', '#settingsTourMfa', 'security']
  ]);
  for (const step of settings.substeps) {
    assert.equal(step.mobileTarget, step.target);
    assert.ok(step.copy.hr.description.length > 20);
    assert.ok(step.copy.en.description.length > 20);
    assert.doesNotMatch(step.copy.hr.title, /TRENUTAČNI MODUL/);
    assert.ok(Object.isFrozen(step));
  }
});

test('cycle 1: next traverses all settings sections before opening help', () => {
  const controller = atSettings();
  let state = controller.snapshot();
  assert.equal(state.stepIndex, 5);
  assert.equal(state.substepIndex, 0);
  assert.equal(state.substepCount, 3);
  assert.equal(state.substep.id, 'general');
  for (const [index, id] of [[1, 'password'], [2, 'mfa']]) {
    state = controller.next();
    assert.equal(state.stepIndex, 5);
    assert.equal(state.substepIndex, index);
    assert.equal(state.substep.id, id);
  }
  state = controller.next();
  assert.equal(state.stepId, 'help');
  assert.equal(state.substepIndex, 0);
  assert.equal(state.substepCount, 1);
  assert.equal(state.substep, null);
  assert.equal(state.step.contextTarget, undefined);
  assert.equal(state.step.surface, 'help');
});

test('cycle 1: back is symmetric across settings sections and modal boundaries', () => {
  const controller = atSettings();
  controller.next();
  controller.next();
  controller.next();
  assert.equal(controller.previous().substep.id, 'mfa');
  assert.equal(controller.previous().substep.id, 'password');
  assert.equal(controller.previous().substep.id, 'general');
  const insights = controller.previous();
  assert.equal(insights.stepId, 'insights');
  assert.equal(insights.substepIndex, 0);
  assert.equal(insights.step.target, '#insightsView');
  assert.equal(insights.step.contextTarget, '.nav-item[data-view="insights"]');
});

test('cycle 1: persisted settings position survives reload and manual restart resets it', () => {
  const shared = storage();
  const first = atSettings({ storage:shared });
  first.next();
  const loaded = createOnboardingController({ storage:shared, userId:'walkthrough' });
  assert.equal(loaded.snapshot().stepId, 'settings');
  assert.equal(loaded.snapshot().substepIndex, 1);
  assert.equal(loaded.snapshot().substep.id, 'password');
  assert.equal(loaded.shouldAutoStart(), false, 'reloading does not reopen settings without an explicit tour start');
  const restarted = loaded.start({ force:true });
  assert.equal(restarted.stepId, 'overview');
  assert.equal(restarted.substepIndex, 0);
});

test('cycle 1: dismissal locks state and does not auto-open settings again', () => {
  const controller = atSettings();
  controller.next();
  const dismissed = controller.dismiss();
  assert.equal(dismissed.open, false);
  assert.equal(controller.next().substep.id, 'password');
  assert.equal(controller.previous().substep.id, 'password');
  assert.equal(controller.start().open, false);
});

test('cycle 1: malformed and legacy persisted positions resolve to safe existing substeps', () => {
  for (const [position, expected] of [[undefined, 0], [-10, 0], [99, 2], [1.5, 1], ['invalid', 0]]) {
    const shared = storage({ 'mer-onboarding-v1:walkthrough':JSON.stringify({ currentStep:5, substepIndex:position }) });
    const controller = createOnboardingController({ storage:shared, userId:'walkthrough' });
    assert.equal(controller.snapshot().substepIndex, expected);
    assert.ok(controller.snapshot().substep.id);
  }
  for (const position of [-20, 100, 2.3, 'invalid']) {
    const shared = storage({ 'mer-onboarding-v1:walkthrough':JSON.stringify({ currentStep:position, substepIndex:99 }) });
    const state = createOnboardingController({ storage:shared, userId:'walkthrough' }).snapshot();
    assert.ok(state.step);
    assert.ok(Number.isInteger(state.stepIndex));
    assert.ok(state.substepIndex < state.substepCount);
  }
});

test('cycle 1: another user cannot inherit an open settings subsection', () => {
  const shared = storage();
  atSettings({ storage:shared, userId:'personal-user' }).next();
  const other = createOnboardingController({ storage:shared, userId:'business-user' });
  assert.equal(other.snapshot().stepId, 'overview');
  assert.equal(other.snapshot().substepIndex, 0);
  assert.equal(other.shouldAutoStart(), true);
});

test('cycle 1: custom steps retain ordinary single-step behavior and last-step substeps', () => {
  const controller = createOnboardingController({ storage:storage(), steps:['first', { id:'last', substeps:[{ id:'a' }, { id:'b' }] }] });
  controller.start();
  assert.equal(controller.next().substep.id, 'a');
  assert.equal(controller.next().substep.id, 'b');
  assert.equal(controller.next().substep.id, 'b');
  const finished = controller.complete();
  assert.equal(finished.open, false);
  assert.equal(finished.substep.id, 'b');
  assert.ok(finished.complete);
});

test('cycle 1: real settings tab selection updates and persists only the current substep', () => {
  const shared = storage();
  const controller = atSettings({ storage:shared });
  const selected = controller.selectSubstep(1);
  assert.equal(selected.stepId, 'settings');
  assert.equal(selected.stepIndex, 5);
  assert.equal(selected.substep.id, 'password');
  const reloaded = createOnboardingController({ storage:shared, userId:'walkthrough' });
  assert.equal(reloaded.snapshot().substepIndex, 1);
  assert.equal(controller.selectSubstep(0).substep.id, 'general');
});

test('cycle 1: direct substep selection clamps invalid indices and cannot move a closed tour', () => {
  const controller = atSettings();
  for (const [value, expected] of [[99, 2], [-1, 0], [1.9, 1], [NaN, 0], [Infinity, 0], ['invalid', 0]]) {
    const result = controller.selectSubstep(value);
    assert.equal(result.substepIndex, expected);
    assert.equal(result.stepId, 'settings');
  }
  controller.selectSubstep(1);
  const dismissed = controller.dismiss();
  assert.deepEqual(controller.selectSubstep(2), dismissed);
  controller.start({ force:true });
  assert.equal(controller.selectSubstep(99).substepIndex, 0, 'ordinary main steps have a single bounded position');
});
