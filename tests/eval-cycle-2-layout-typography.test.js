const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

test('cycle 2: Savings uses the remaining fixed viewport without a nested scrollbar', () => {
  assert.match(css, /#savingsView \{[^}]*display:flex[^}]*flex-direction:column[^}]*overflow:hidden/s);
  assert.match(css, /#savingsView > \.goal-buckets-panel \{[^}]*flex:1 1 auto[^}]*overflow:hidden/s);
  assert.match(css, /#savingsView \.goal-bucket-grid \{[^}]*min-height:0[^}]*flex:1 1 auto/s);
  assert.doesNotMatch(css, /#savingsView[^}]*overflow-y\s*:\s*auto/);
  assert.match(css, /@media \(max-height:820px\) and \(min-width:801px\)/);
});

test('cycle 2: a semantic type scale standardizes page, card, body, label, caption, button and metric text', () => {
  for (const token of ['--type-page', '--type-card', '--type-body', '--type-label', '--type-caption', '--type-button', '--type-metric']) {
    assert.match(css, new RegExp(token.replace('--', '\\-\\-') + ':'));
  }
  assert.match(css, /\.module-heading \{ font-size:var\(--type-page\)/);
  assert.match(css, /\.panel-heading h2,[\s\S]*font-size:var\(--type-card\)/);
  assert.match(css, /\.summary-value \{ font-size:var\(--type-metric\)/);
  assert.match(css, /\.primary-button,[\s\S]*font-size:var\(--type-button\)/);
});

test('cycle 2: the outer document and every main application module remain viewport locked', () => {
  assert.match(css, /html, body \{[^}]*height:100%[^}]*overflow:hidden/s);
  assert.match(css, /\.app-shell \{[^}]*height:100dvh[^}]*overflow:hidden/s);
  assert.match(css, /\.main \{[^}]*height:100dvh[^}]*overflow:hidden/s);
  assert.match(css, /\.view \{[^}]*height:100%[^}]*overflow:hidden/s);
});

