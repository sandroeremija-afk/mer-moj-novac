'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

const savingsStart = html.indexOf('id="savingsView"');
const savingsEnd = html.indexOf('id="activityView"', savingsStart);
const savings = html.slice(savingsStart, savingsEnd);
const modalStart = html.indexOf('id="savingsDetailsModal"');
const modalEnd = html.indexOf('</dialog>', modalStart);
const modal = html.slice(modalStart, modalEnd);

test('evaluation cycle 2: Savings history chart is embedded once in the live module grid', () => {
  assert.equal((html.match(/id="contributionChart"/g) || []).length, 1);
  assert.match(savings, /class="panel contribution-panel savings-history-card"[\s\S]*?id="contributionChart"[\s\S]*?id="chartTotalSaved"/);
  assert.doesNotMatch(modal, /contributionChart|chartTotalSaved|yearSaved/);
  assert.match(css, /#savingsView > \.savings-history-card\s*\{[^}]*grid-column:1[^}]*grid-row:3/);
  assert.match(css, /#savingsView > \.goal-buckets-panel\s*\{[^}]*grid-column:2[^}]*grid-row:3/);
});

test('evaluation cycle 2: Sve uplate trigger opens a list-only profile-labelled deposit dialog', () => {
  assert.match(savings, /data-open-detail="savingsDetailsModal"[\s\S]*?href="#icon-list"[\s\S]*?data-i18n="allSavingsDeposits">Sve uplate/);
  assert.match(modal, /data-i18n="allSavingsDeposits">Sve uplate/);
  assert.match(modal, /id="savingsEntryList"/);
  assert.match(css, /\.savings-entry-list-all\s*\{[^}]*max-height:400px[^}]*overflow-y:auto/);
  assert.match(app, /function renderSavingsEntries\(\)[\s\S]*?state\.savingsEntries[\s\S]*?savings-entry-profile[\s\S]*?state\.accountLabel/);
  assert.match(app, /goal\?\.name\|\|t\('unknownSavingsGoal'\)/);
});

test('evaluation cycle 2: Insights keeps direct chart interactions without a redundant report button', () => {
  const insightsStart = html.indexOf('id="insightsView"');
  const insightsEnd = html.indexOf('</main>', insightsStart);
  const insights = html.slice(insightsStart, insightsEnd);
  assert.doesNotMatch(insights, /data-open-detail="insightsDetailsModal"/);
  assert.match(insights, /data-insight-detail=/);
});
