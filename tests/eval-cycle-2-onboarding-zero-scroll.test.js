'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const MerOnboarding = require('../onboarding-core.js');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'onboarding.js'), 'utf8');

test('evaluation cycle 2: onboarding popovers use dynamic density with no internal scrollbar', () => {
  assert.match(css, /\.onboarding-popover\s*\{[^}]*max-height:calc\(100dvh - 24px\);[^}]*overflow:hidden;/);
  assert.match(css, /\[data-ui="tour-popover"\]\s*\{[^}]*overflow:hidden;[^}]*overscroll-behavior:none;/);
  assert.doesNotMatch(css, /(?:\.onboarding-popover|\[data-ui="tour-popover"\])\s*\{[^}]*overflow-y\s*:\s*(?:auto|scroll)/);
  assert.match(ui, /function fitPopoverToViewport\(viewport\)/);
  assert.match(ui, /popover\.classList\.add\('is-condensed'\)/);
  assert.doesNotMatch(ui, /maxHeight:`\$\{layout\.popover\.height\}px`/);
});

test('evaluation cycle 2: compact actions and runtime progress match the audited five-step flow', () => {
  assert.equal(MerOnboarding.DEFAULT_STEPS.length, 5);
  assert.match(ui, /stepNumber \/ controller\.steps\.length \* 100/);
  assert.match(ui, /`Korak \$\{stepNumber\} od \$\{controller\.steps\.length\}`/);
  assert.match(css, /\.onboarding-actions\s*\{[^}]*align-items:center;[^}]*flex-direction:row;/);
});

test('evaluation cycle 2: module transitions retain the backdrop and expose sidebar context selectors', () => {
  const previewStart = ui.indexOf('function previewStep(step)');
  const renderStart = ui.indexOf('function render(', previewStart);
  const preview = ui.slice(previewStart, renderStart);
  assert.doesNotMatch(preview, /tour\.hidden\s*=|spotlight\.hidden|spotlight\.style\.opacity/);
  assert.match(preview, /if \(step\.view && typeof showView === 'function'\) showView\(step\.view\)/);
  assert.match(preview, /if \(mobileViewport\(\) && step\.openSidebar\) openSidebar\(\)/);
  MerOnboarding.DEFAULT_STEPS.forEach(step => assert.match(step.contextTarget, /^\.nav-item\[data-view="[a-z]+"\]$/));
});
