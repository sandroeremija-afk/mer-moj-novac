'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'ui-consistency.css'), 'utf8');
const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
const declarations = selector => {
  const start = rules.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `missing presentation selector: ${selector}`);
  return rules.slice(start + selector.length + 2, rules.indexOf('}', start));
};

test('cycle 2: proportional typography uses one shared scale without overriding financial fit-text geometry', () => {
  const tokens = declarations(':root');
  for (const [name, value] of Object.entries({page:'1.5rem', card:'1.125rem', body:'.875rem', label:'.875rem', caption:'.75rem', button:'.875rem'})) {
    assert.ok(tokens.includes(`--type-${name}:${value};`), `${name} has its shared size`);
  }
  assert.match(tokens, /--type-metric:clamp\(1\.25rem,2vw,1\.5rem\)/);
  assert.doesNotMatch(rules, /(?:safe-ring|category-donut|data-fit|circle-text|svg\s+text)[^{]*\{[^}]*font-size/);
  assert.doesNotMatch(rules, /(?:\*|\bstrong|\bb|\bspan)\s*\{[^}]*font-size[^;}]*!important/);
});

test('cycle 2: security headings, input labels and supporting copy follow explicit roles', () => {
  assert.match(rules, /#bankSettingsModal\.premium-settings :is\(\.settings-pane-heading h3,\.security-section-heading strong,\.security-subheading strong\)\s*\{[^}]*font-size:var\(--type-card\)/);
  assert.match(rules, /#bankSettingsModal\.premium-settings :is\(\.settings-form-grid label,\.security-form-grid label,[^}]*font-size:var\(--type-label\)[^}]*font-weight:400/);
  assert.match(rules, /#bankSettingsModal\.premium-settings :is\(\.security-card p,\.security-section-heading small,[^}]*font-size:var\(--type-caption\)/);
  assert.match(rules, /@media \(max-width:767px\)[\s\S]*input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\)[^}]*font-size:1rem/);
});

test('cycle 2: checkboxes stay white when off, on, mixed and disabled in both themes', () => {
  for (const state of ['', ':checked', ':indeterminate', ':disabled']) {
    assert.match(declarations(`html body input[type="checkbox"]${state}`), /background-color:#fff !important/);
  }
  assert.match(declarations('html body input[type="checkbox"]'), /appearance:none !important/);
  assert.match(declarations('html body input[type="checkbox"]'), /min-height:22px !important/);
  assert.match(declarations('html body input[type="checkbox"]:checked'), /background-image:url\("data:image\/svg\+xml,[^\n]+stroke='%23173b36'/);
  assert.match(declarations('html body input[type="checkbox"]:indeterminate'), /M5 10h10/);
  assert.match(declarations('html body input[type="checkbox"]:focus-visible'), /outline:3px solid #007da9 !important/);
  assert.match(declarations('html body input[type="checkbox"]:disabled'), /cursor:not-allowed/);
  assert.match(declarations('html body label:has(> input[type="checkbox"])'), /min-height:44px/);
});

test('cycle 2: roundup switch has a white track and distinct accent/position without state changes', () => {
  assert.match(declarations('#appShell .roundup-toggle > i'), /background:#fff/);
  assert.match(declarations('#appShell .roundup-toggle.active > i'), /background:#fff/);
  assert.match(declarations('#appShell .roundup-toggle.active > i::after'), /background:#007da9/);
  assert.match(declarations('#appShell .roundup-toggle.active > i::after'), /translateX\(12px\)/);
  assert.match(rules, /@media \(prefers-reduced-motion:reduce\)[\s\S]*roundup-toggle[^}]*transition:none/);
});

test('cycle 2: every scrollbar receives non-black themed paint without changing scroll ownership', () => {
  assert.match(declarations('html,html *'), /scrollbar-color:var\(--app-scroll-thumb\) var\(--app-scroll-track\) !important/);
  assert.match(declarations('[data-theme="dark"]'), /--app-scroll-thumb:#a7c0ca/);
  assert.match(rules, /html \*::-webkit-scrollbar-thumb\s*\{[^}]*background:var\(--app-scroll-thumb\) !important/);
  assert.match(rules, /html \*::-webkit-scrollbar-track\s*\{[^}]*background:var\(--app-scroll-track\) !important/);
  assert.doesNotMatch(rules, /(?:^|[;{])\s*(?:overflow(?:-[xy])?|max-height|height)\s*:[^;}]*hidden/);
  assert.doesNotMatch(rules, /scrollbar-width:none|::-webkit-scrollbar\s*\{[^}]*display:none/);
});

test('cycle 2: operating-system high contrast restores native checkbox affordances', () => {
  const accessible = rules.slice(rules.indexOf('@media (forced-colors:active)'));
  assert.match(accessible, /appearance:auto !important/);
  assert.match(accessible, /forced-color-adjust:auto/);
  assert.match(accessible, /background-color:Canvas !important/);
  assert.match(accessible, /background-image:none !important/);
  assert.match(accessible, /scrollbar-color:auto !important/);
});
