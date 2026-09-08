'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'recommendation-refresh.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const card = html.match(/<aside[^>]*id="savingsRecommendationCard"[\s\S]*?<\/aside>/)?.[0];

test('cycle 1: recommendation remains a single live card with its original strategy route', () => {
  assert.ok(card);
  assert.equal((html.match(/id="savingsRecommendationCard"/g) || []).length, 1);
  for (const id of ['coverageMonths', 'tipSavings']) {
    assert.equal((card.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1);
    assert.ok(app.includes(`$('#${id}').textContent`), `${id} remains driven by reactive render`);
  }
  assert.match(card, /data-open-savings-strategy[^>]*aria-controls="savingsStrategyModal"/);
  assert.match(card, /data-i18n="onTrackSave"[^>]*>[^<]*<\/span>&nbsp;<strong id="tipSavings"/);
  assert.equal((card.match(/<button/g) || []).length, 1);
});

test('cycle 1: dedicated visual layer creates room and hierarchy without script or state changes', () => {
  assert.match(css, /#savingsView #savingsRecommendationCard \{[^}]*gap: 12px;[^}]*padding: 20px;[^}]*overflow: visible;/);
  assert.match(css, /recommendation-stat strong \{[^}]*font-size: 1\.25rem;[^}]*overflow-wrap: anywhere;/);
  assert.match(css, /weekly-review-copy > p:last-child \{[^}]*font-size: \.875rem;[^}]*line-height: 1\.4;/);
  assert.match(css, /recommendation-action \{[^}]*position: static;[^}]*min-height: 44px;[^}]*margin: auto 0 0;/);
  assert.doesNotMatch(css, /position:\s*(?:absolute|fixed)|overflow-y:\s*(?:scroll|auto)/);
});
