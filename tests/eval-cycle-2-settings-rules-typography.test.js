const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const premium = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');

test('cycle 2: Rules presents an explicit, accessible If/Then builder', () => {
  const start = html.indexOf('data-settings-panel="automation"');
  const end = html.indexOf('</section>', start);
  const rules = html.slice(start, end);
  assert.match(rules, /class="rules-subtitle"[^>]*data-i18n="automationSubtitle"/);
  assert.match(rules, /class="rule-step-badge"[^>]*data-i18n="ruleIf"/);
  assert.match(rules, /class="rule-step-badge then"[^>]*data-i18n="ruleThen"/);
  assert.match(rules, /data-i18n="ruleIfContains"/);
  assert.match(rules, /data-i18n="ruleAssignCategory"/);
  assert.match(rules, /id="automationRuleList"[^>]*aria-live="polite"/);
});

test('cycle 2: empty Rules state explains the purpose with a practical Uber example', () => {
  assert.match(premium, /class="rules-empty-state"/);
  assert.match(premium, /t\('noRulesTitle'\)/);
  assert.match(premium, /t\('noRulesBody'\)/);
  assert.match(premium, /“Uber”/);
  assert.match(premium, /t\('transport'\)/);
  assert.match(premium, /automationSubtitle:'Automatski dodijelite kategorije uvezenim bankovnim transakcijama/);
});

test('cycle 2: Settings owns a larger legible type scale without changing global typography', () => {
  assert.match(css, /\.premium-settings > h2 \{[^}]*font-size:22px/);
  assert.match(css, /\.premium-settings \.settings-tabs button \{[^}]*font-size:12px/);
  assert.match(css, /\.premium-settings \.settings-pane-heading h3 \{[^}]*font-size:17px/);
  assert.match(css, /\.premium-settings \.settings-form-grid label,[\s\S]*font-size:12px/);
  assert.match(css, /\.premium-settings \.settings-form-grid select,[\s\S]*font-size:13px/);
  assert.match(css, /\.premium-settings \.settings-export strong \{[^}]*font-size:12px/);
});

test('cycle 2: desktop Settings remains bounded by 100dvh with no pane scrollbar', () => {
  assert.match(css, /\.premium-settings\[open\] \{[^}]*max-height:calc\(100dvh - 24px\)[^}]*overflow:hidden/);
  assert.match(css, /\.settings-pane\.active \{[^}]*overflow:visible/);
  assert.doesNotMatch(css, /\.settings-pane\.active[^}]*overflow-y:auto/);
  assert.match(css, /@media \(max-width: 540px\)[\s\S]*\.rule-builder \{ grid-template-columns:minmax\(0,1fr\); \}/);
});
