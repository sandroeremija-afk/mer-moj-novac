'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'onboarding.js'), 'utf8');
const tourCss = fs.readFileSync(path.join(root, 'security-tour.css'), 'utf8');

test('evaluation cycle 2: onboarding renders independent feature and context spotlights', () => {
  assert.match(html, /id="onboardingSpotlight"[\s\S]*id="onboardingContextSpotlight"[\s\S]*id="onboardingPopover"/);
  assert.match(ui, /function renderContextSpotlight\(targetRect, popoverRect, viewport\)/);
  assert.match(ui, /step\.contextTarget \? document\.querySelector\(step\.contextTarget\) : null/);
  assert.match(ui, /document\.createElement\('div'\)/);
  assert.doesNotMatch(ui, /content\.innerHTML = currentContextLink\.innerHTML/);
  assert.doesNotMatch(ui, /currentContextLink\.cloneNode\(true\)/);
  assert.match(ui, /renderBackdrop\(targetBounds, renderContextSpotlight/);
  assert.match(ui, /backdrop\.style\.clipPath = `path\(evenodd/);
  assert.match(tourCss, /\.onboarding-tour \.onboarding-context-spotlight \{ background:transparent;/);
  assert.match(css, /\.onboarding-context-spotlight\s*\{[^}]*pointer-events:none;[^}]*transition:/);
});

test('evaluation cycle 2: context highlight disappears cleanly when unavailable or closed', () => {
  assert.match(ui, /if \(!currentContextLink\) \{[\s\S]*?contextSpotlight\.classList\.remove\('is-visible', 'is-docked'\);[\s\S]*?contextSpotlight\.replaceChildren\(\);/);
  assert.match(ui, /function clearContextSpotlight\(\) \{[\s\S]*?contextSpotlight\.removeAttribute\('style'\);/);
  assert.match(ui, /function releaseTarget\(\{ preserveContext = false \} = \{\}\)/);
  assert.match(ui, /releaseTarget\(\{ preserveContext:Boolean\(step\.contextTarget\) \}\)/);
});

test('evaluation cycle 2: context geometry uses only the actual control and never a fabricated dock', () => {
  assert.match(ui, /if \(!linkIsVisible\) return null/);
  assert.match(ui, /overlaps\(exact, targetRect\) \|\| overlaps\(exact, popoverRect\)/);
  assert.doesNotMatch(ui, /docked:true|renderedContextLink|contextSpotlight\.replaceChildren\(content\)/);
  assert.match(tourCss, /\.onboarding-backdrop \{[^}]*transition:clip-path \.5s ease-in-out/);
});

test('evaluation cycle 2: popover has no visible uppercase context prefix or internal scrolling', () => {
  assert.doesNotMatch(html, /id="onboardingEyebrow"/);
  assert.doesNotMatch(ui, /\$\('#onboardingEyebrow'\)|toLocaleUpperCase\(locale\(\)\)|onboardingModuleContext|Trenutačni modul|TRENUTAČNI MODUL|dataset\.moduleContext/);
  assert.match(css, /\.onboarding-popover\s*\{[^}]*max-height:calc\(100dvh - 24px\);[^}]*overflow:hidden;/);
  assert.doesNotMatch(css, /\.onboarding-popover\s*\{[^}]*overflow-y\s*:\s*(?:auto|scroll)/);
});

test('evaluation cycle 2: nine-step static state keeps senior-friendly controls', () => {
  assert.match(html, /id="onboardingProgress"[^>]*>Korak 1 od 9<\/span>/);
  assert.match(css, /\.onboarding-progress-track i\s*\{[^}]*width:calc\(100% \/ 9\)/);
  assert.match(css, /\.onboarding-actions button \{[^}]*min-height:44px;[^}]*font-size:1rem;/);
  assert.match(css, /\.onboarding-popover h2 \{[^}]*font-size:1\.375rem/);
  assert.match(css, /\.onboarding-popover > p:not\(\.overline\) \{[^}]*font-size:1rem;[^}]*line-height:1\.6/);
});
