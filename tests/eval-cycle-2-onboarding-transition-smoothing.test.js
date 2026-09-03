'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const MerOnboarding = require('../onboarding-core.js');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'onboarding.js'), 'utf8');

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
}

test('evaluation cycle 2: positioning never hides the spotlight backdrop', () => {
  assert.match(css, /\.onboarding-tour\.is-positioning \.onboarding-popover \{[^}]*opacity:0;[^}]*pointer-events:none;/);
  assert.doesNotMatch(css, /\.onboarding-tour\.is-positioning \.onboarding-spotlight/);
  assert.doesNotMatch(css, /\.onboarding-tour\.is-positioning[^{]*\{[^}]*transition:none/);
  assert.match(css, /\.onboarding-spotlight \{[\s\S]*?box-shadow:0 0 0 100vmax[\s\S]*?transition:left \.5s ease-in-out,top \.5s ease-in-out,width \.5s ease-in-out,height \.5s ease-in-out;/);
});

test('evaluation cycle 2: step changes keep the tour mounted while geometry is remeasured', () => {
  const previewStart = ui.indexOf('function previewStep(step)');
  const renderStart = ui.indexOf('function render(', previewStart);
  const preview = ui.slice(previewStart, renderStart);
  assert.match(preview, /positionSpotlight\(\)/);
  assert.match(preview, /requestAnimationFrame/);
  assert.doesNotMatch(preview, /tour\.hidden\s*=/);
  assert.doesNotMatch(preview, /spotlight\.style\.opacity|spotlight\.hidden/);
});

test('evaluation cycle 2: controller next and previous transitions preserve the open session', () => {
  const controller = MerOnboarding.createOnboardingController({ storage:new MemoryStorage(), userId:'smooth-tour-user' });
  const started = controller.start({ force:true });
  const next = controller.next();
  const previous = controller.previous();
  assert.equal(started.open, true);
  assert.equal(next.open, true);
  assert.equal(previous.open, true);
  assert.equal(started.stepIndex, 0);
  assert.equal(next.stepIndex, 1);
  assert.equal(previous.stepIndex, 0);
});

test('evaluation cycle 2: reduced-motion users retain a non-animated fallback', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.onboarding-spotlight,[\s\S]*?transition:none;/);
});

test('evaluation cycle 2: module changes expose a simultaneous visual sidebar context without meta copy', () => {
  assert.match(ui, /step\.contextTarget \? document\.querySelector\(step\.contextTarget\) : null/);
  assert.match(ui, /tour-context-active/);
  assert.match(ui, /renderContextSpotlight/);
  assert.match(ui, /contextSpotlight\.replaceChildren/);
  assert.match(css, /\.nav-item\.tour-context-active\s*\{/);
  assert.match(css, /\.onboarding-context-spotlight\s*\{/);
  assert.doesNotMatch(ui, /\$\('#onboardingEyebrow'\)|toLocaleUpperCase\(locale\(\)\)|dataset\.moduleContext/);
});
