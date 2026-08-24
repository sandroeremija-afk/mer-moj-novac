const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

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

test('cycle 2: logo geometry is stable and theme-adaptive across auth and application states', () => {
  assert.match(css, /\.auth-hero-logo \{[^}]*width:91px[^}]*height:40\.44px/s);
  assert.match(css, /\.auth-card-logo \{[^}]*width:78px[^}]*height:34\.67px/s);
  assert.match(css, /\.header-logo \{[^}]*width:56px[^}]*height:24\.89px/s);
  assert.match(css, /\.settings-logo \{[^}]*width:62px[^}]*height:27\.56px/s);
  assert.match(css, /mer-logo\[tone="dark"\] \{ --logo-color:#fff; \}/);
  assert.match(css, /mer-logo\[tone="light"\],[\s\S]*--logo-color:#050706/);
  assert.match(css, /mer-logo:not\(:defined\)|mer-logo \{/);
  assert.match(html, /class="auth-card-logo" tone="theme"/);
  assert.match(html, /class="header-logo" tone="theme"/);
});
