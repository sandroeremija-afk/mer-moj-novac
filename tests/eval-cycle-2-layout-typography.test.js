const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('cycle 2: Savings uses the fixed desktop viewport and natural mobile goal flow', () => {
  assert.match(css, /#savingsView \{[^}]*display:flex[^}]*flex-direction:column[^}]*overflow:hidden/s);
  assert.match(css, /@media \(min-width:1025px\) \{[\s\S]*?#savingsView > \.goal-buckets-panel \{[^}]*height:100%[^}]*overflow:visible/s);
  assert.match(css, /@media \(min-width:1025px\) \{[\s\S]*?#savingsView \{[^}]*grid-template-rows:auto clamp\(236px,31dvh,252px\) minmax\(0,1fr\)/s);
  assert.match(css, /#savingsView \.goal-bucket-grid \{[^}]*min-height:0[^}]*flex:1 1 auto/s);
  const desktopGoalRules = [...css.matchAll(/#savingsView \.goal-bucket-grid\s*\{([^}]*)\}/g)].map(match => match[1]);
  assert.ok(desktopGoalRules.every(rule => !/overflow-y\s*:\s*(?:auto|scroll)/.test(rule)));
  const phone = css.slice(css.lastIndexOf('@media (max-width:414px)'));
  assert.match(phone, /#savingsView \.goal-bucket-grid \{[^}]*max-height:none[^}]*overflow-y:visible/);
  assert.doesNotMatch(phone, /#savingsView \.goal-bucket-grid \{[^}]*overflow-y:auto/);
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

test('cycle 2: official logo geometry is stable and theme-adaptive in its two allowed locations', () => {
  assert.match(css, /\.brand-wordmark-image \{ width:132px; height:39\.78px; \}/);
  assert.match(css, /\.auth-brand-logo \{[^}]*width:clamp\(150px,17vw,228px\)[^}]*height:auto/);
  assert.match(css, /mer-logo\[variant="negative"\] \{ --logo-wordmark:#fff; \}/);
  assert.match(css, /mer-logo\[variant="positive"\],[\s\S]*--logo-wordmark:#040606/);
  assert.match(css, /mer-logo:not\(:defined\)|mer-logo \{/);
  assert.equal((html.match(/<mer-logo\b/g) || []).length, 2);
  assert.match(html, /class="auth-brand-logo" variant="negative"/);
  assert.match(html, /class="auth-brand-tagline"[^>]*data-auth-copy="heroTagline"/);
  assert.match(html, /class="brand-wordmark-image" variant="negative"/);
});
