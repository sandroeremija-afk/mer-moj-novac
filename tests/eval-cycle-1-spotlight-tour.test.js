'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const MerOnboarding = require('../onboarding-core.js');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'onboarding.js'), 'utf8');

test('evaluation cycle 1: onboarding steps describe real spotlight targets in a deliberate order', () => {
  assert.deepEqual(
    MerOnboarding.DEFAULT_STEPS.map(step => step.id),
    ['navigation', 'transaction', 'overview', 'budgets', 'savings', 'activity', 'insights', 'settings']
  );
  MerOnboarding.DEFAULT_STEPS.forEach(step => {
    assert.equal(typeof step.target, 'string', `${step.id} has a target selector`);
    assert.ok(step.target.length > 1, `${step.id} has a useful target selector`);
    assert.equal(typeof step.placement, 'string', `${step.id} declares popover placement`);
  });
  const transactionStep = MerOnboarding.DEFAULT_STEPS.find(step => step.id === 'transaction');
  assert.equal(transactionStep.target, '#sidebar .sidebar-transaction-button[data-open-transaction]');
  assert.equal(transactionStep.mobileTarget, '#sidebar .sidebar-transaction-button[data-open-transaction]');
  assert.equal(transactionStep.openSidebar, true, 'the sidebar is opened before the primary action is measured');
  assert.match(MerOnboarding.DEFAULT_STEPS.find(step => step.id === 'overview').target, /safe-panel|safeRing/);
  assert.match(MerOnboarding.DEFAULT_STEPS.find(step => step.id === 'settings').target, /openSettings/);
});

test('evaluation cycle 1: the text-heavy onboarding dialog is replaced by a compact spotlight surface', () => {
  assert.doesNotMatch(html, /<dialog[^>]+id="onboardingModal"/);
  for (const id of ['onboardingTour', 'onboardingSpotlight', 'onboardingPopover', 'onboardingTitle', 'onboardingBody', 'onboardingProgress', 'onboardingPrevious', 'onboardingNext', 'onboardingSkip']) {
    assert.match(html, new RegExp(`id="${id}"`), `${id} exists`);
  }
  assert.match(html, /id="onboardingTour"[^>]*hidden/);
  assert.match(html, /id="onboardingPopover"[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(html, /id="onboardingPopover"[^>]*aria-labelledby="onboardingTitle"[^>]*aria-describedby="onboardingBody"/);
});

test('evaluation cycle 1: spotlight geometry stays fixed and creates a true visual cutout', () => {
  assert.match(css, /\.onboarding-tour\s*\{[^}]*position\s*:\s*fixed[^}]*inset\s*:\s*0[^}]*z-index/);
  assert.match(css, /\.onboarding-spotlight\s*\{[^}]*position\s*:\s*fixed[^}]*box-shadow\s*:[^;}]*0\s+0\s+0\s+(?:9999px|100vmax)/);
  assert.match(css, /\.onboarding-popover\s*\{[^}]*position\s*:\s*fixed[^}]*max-width/);
  assert.match(css, /\.onboarding-popover[^}]*transition/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?onboarding/);
});

test('evaluation cycle 1: target and popover geometry react to scrolling, resizing and viewport changes', () => {
  assert.match(ui, /getBoundingClientRect\(\)/);
  assert.match(ui, /requestAnimationFrame/);
  assert.match(ui, /ResizeObserver/);
  assert.match(ui, /addEventListener\(['"]resize['"]/);
  assert.match(ui, /addEventListener\(['"]scroll['"]/);
  assert.match(ui, /visualViewport/);
  assert.match(ui, /scrollIntoView/);
  assert.match(ui, /Math\.(?:min|max)/, 'placement is clamped to the viewport');
});

test('evaluation cycle 1: smart placement keeps the popover outside feasible spotlight targets', () => {
  const viewport = { left:0, top:0, width:1366, height:768 };
  const layouts = [
    { targetRect:{ left:28, top:126, width:192, height:44 }, preferredPlacement:'right' },
    { targetRect:{ left:410, top:190, width:520, height:70 }, preferredPlacement:'bottom' },
    { targetRect:{ left:1010, top:300, width:240, height:52 }, preferredPlacement:'right' }
  ].map(input => MerOnboarding.computeSpotlightLayout({ ...input, viewport, popoverSize:{ width:350, height:280 }, gap:14, padding:8, edge:12 }));
  layouts.forEach(layout => assert.equal(layout.popover.overlapsTarget, false));

  const constrainedMobile = MerOnboarding.computeSpotlightLayout({
    viewport:{ left:0, top:0, width:375, height:667 },
    targetRect:{ left:16, top:298, width:343, height:60 },
    popoverSize:{ width:340, height:430 },
    preferredPlacement:'bottom', gap:14, padding:8, edge:12
  });
  assert.equal(constrainedMobile.popover.overlapsTarget, false, 'a short viewport constrains the scrollable popover instead of covering its target');
  assert.ok(constrainedMobile.popover.height < 430);
});

test('evaluation cycle 1: spotlight tour owns focus without making the application permanently inert', () => {
  assert.match(ui, /\.inert\s*=\s*true/);
  assert.match(ui, /\.inert\s*=\s*false/);
  assert.match(ui, /event\.key\s*!==\s*['"]Tab['"]|event\.key\s*===\s*['"]Tab['"]/);
  assert.match(ui, /event\.key\s*===\s*['"]Escape['"]|event\.key\s*!==\s*['"]Escape['"]/);
  assert.match(ui, /aria-describedby/);
  assert.match(ui, /focus\(\{\s*preventScroll\s*:\s*true\s*\}\)/);
});
