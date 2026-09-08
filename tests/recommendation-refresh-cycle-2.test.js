'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '..', 'recommendation-refresh.css'), 'utf8');

test('cycle 2: desktop top cards share a stretched track while preserving the bounded lower row', () => {
  assert.match(css, /grid-template-rows: auto clamp\(312px, 34dvh, 348px\) minmax\(0, 1fr\)/);
  assert.match(css, /\.savings-layout \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[^}]*align-items: stretch;/);
  assert.match(css, /\.savings-top-card \{ grid-column: span 2; height: 100%; \}/);
  assert.match(css, /max-height: 820px[\s\S]*?grid-template-rows: auto 300px minmax\(0, 1fr\)/);
});

test('cycle 2: mobile content flows naturally and values cannot create a horizontal scrollbar', () => {
  const phone = css.slice(css.indexOf('@media (max-width: 1024px)'));
  assert.match(phone, /savingsRecommendationCard \{[^}]*height: auto;[^}]*gap: 16px;[^}]*padding: 20px;[^}]*overflow: visible;/);
  assert.match(phone, /max-width: 414px[\s\S]*?recommendation-stat \{[^}]*grid-template-columns: 1fr;/);
  assert.match(phone, /recommendation-stat strong \{ text-align: left; \}/);
  assert.doesNotMatch(phone, /(?:max-)?height:\s*\d+(?:px|vh|dvh)|overflow:\s*hidden/);
});

test('cycle 2: both themes use shared brand and contrast tokens, with no dark text overrides', () => {
  assert.match(css, /\[data-theme="dark"\] #savingsView #savingsRecommendationCard/);
  assert.match(css, /var\(--blue\) 5%, var\(--panel\)/);
  assert.match(css, /var\(--green\) 6%, var\(--panel\)/);
  assert.doesNotMatch(css, /color:\s*#[0-9a-f]+/i);
});
