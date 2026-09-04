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

test('evaluation cycle 2: compact actions and runtime progress match the audited seven-step flow', () => {
  assert.equal(MerOnboarding.DEFAULT_STEPS.length, 7);
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

test('evaluation cycle 2: full-height category cards retain a readable tooltip lane on phones', () => {
  for (const width of [320, 375, 414, 768]) {
    const viewport = { left:0, top:0, width, height:667 };
    const layout = MerOnboarding.computeSpotlightLayout({
      viewport,
      targetRect:{ left:16, top:96, width:width - 32, height:820 },
      popoverSize:{ width:Math.min(350, width - 24), height:286 },
      preferredPlacement:'top', gap:14, padding:8, edge:12, allowPartialTarget:true
    });
    assert.equal(layout.popover.overlapsTarget, false, `${width}px has a dedicated tooltip lane`);
    assert.equal(layout.popover.height, 286, 'readable copy retains its natural height');
    assert.equal(layout.spotlight.partial, true, 'the full card target exposes its visible portion, not a border');
    assert.ok(layout.spotlight.height >= 80);
    assert.ok(layout.spotlight.top + layout.spotlight.height + 14 <= layout.popover.top);
    assert.ok(layout.popover.top + layout.popover.height <= viewport.height - 12);
  }
});

test('evaluation cycle 2: desktop keeps the entire category container highlighted when space allows', () => {
  const layout = MerOnboarding.computeSpotlightLayout({
    viewport:{ width:1366, height:768 },
    targetRect:{ left:278, top:302, width:1040, height:400 },
    popoverSize:{ width:350, height:250 },
    preferredPlacement:'top', gap:14, padding:8, edge:12
  });
  assert.equal(layout.popover.overlapsTarget, false);
  assert.equal(layout.spotlight.partial, undefined);
  assert.equal(layout.spotlight.height, 416);
  assert.equal(layout.spotlight.width, 1056);
});
