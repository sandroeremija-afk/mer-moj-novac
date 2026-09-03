'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const premium = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');

function functionBody(name, nextName) {
  const start = premium.indexOf(`function ${name}`);
  assert.ok(start >= 0, `${name} exists`);
  const end = nextName ? premium.indexOf(`function ${nextName}`, start) : premium.length;
  return premium.slice(start, end);
}

test('evaluation cycle 2: Budget export is a one-click download with no intermediary dialog', () => {
  const budgetsStart = html.indexOf('id="budgetsView"');
  const budgetsEnd = html.indexOf('<section class="view"', budgetsStart);
  const budgets = html.slice(budgetsStart, budgetsEnd);
  assert.match(budgets, /<button type="button" class="secondary-button" data-export-budget>/);
  assert.match(budgets, /data-i18n="budgetDataActions">Izvoz budžeta<\/span>/);
  assert.doesNotMatch(budgets, /data-open-detail="budgetDataModal"|aria-haspopup="dialog"/);
  assert.doesNotMatch(html, /id="budgetDataModal"|id="budgetExportCsv"/);
  assert.match(premium, /\$\$\('\[data-export-budget\]'\)\.forEach\(button=>button\.addEventListener\('click',\(\)=>\{closeCardMenus\(\);exportBudgetPlanCsv\(\);\}\)\);/);
});

test('evaluation cycle 2: Activity exports every transaction with item-level audit fields', () => {
  const body = functionBody('exportActiveProfileCsv', 'exportBudgetPlanCsv');
  for (const field of ['ID','Timestamp','Description','Category','Amount','Currency','Source','Review status']) assert.ok(body.includes(field), `${field} is exported`);
  assert.match(body, /\(state\.transactions\|\|\[\]\)\.filter/);
  assert.match(body, /tx\.currency\|\|appState\.settings\.currency/);
  assert.match(body, /tx\.timestamp\|\|tx\.date/);
  assert.match(body, /tx\.needsReview/);
});

test('evaluation cycle 2: Budget export is category-grouped with plan metadata and totals', () => {
  const body = functionBody('exportBudgetPlanCsv', 'exportInsightsReportCsv');
  assert.match(body, /categoryExpenseTotals\(state\.transactions,'monthly',appReferenceDate\)/);
  assert.match(body, /state\.categories\|\|\[\]/);
  for (const field of ['Mjesečni plan budžeta','Mjesec','Ukupni limit','Ukupno potrošeno','Kategorija','Iskorištenost (%)']) assert.ok(body.includes(field), `${field} is exported`);
  assert.match(body, /categories\.forEach\(item=>rows\.push/);
});

test('evaluation cycle 2: Insights export is a timeframe-aware report for the active filter', () => {
  const body = functionBody('exportInsightsReportCsv', 'openGlobalImport');
  assert.match(body, /MerCore\.buildInsightsReport\(state\.transactions,insightsTimeframe,appReferenceDate\)/);
  for (const field of ['Satna raščlamba dana','Dnevni mjesečni pregled','Mjesečni godišnji pregled','Povijesni sažetak','Stopa štednje (%)','Udio troškova (%)']) assert.ok(body.includes(field), `${field} is exported`);
  assert.match(body, /timeframeLabel=t\(\{daily:'daily',monthly:'monthly',ytd:'yearToDate',all:'allTime'\}/);
  assert.match(body, /report\.series\.forEach/);
  assert.match(body, /report\.categories\.forEach/);
});

test('evaluation cycle 2: CSV user text is formula-safe while numeric values stay numeric', () => {
  assert.match(premium, /function safeCsvText\(value\)\{[^}]*\/\^\[=\+\\-@\\t\]\//);
  assert.match(premium, /function csvCell\(value\)\{[^}]*\[",\\r\\n\]/);
  assert.match(premium, /safeCsvText\(tx\.name\|\|''\)/);
  assert.match(premium, /Number\(tx\.amount\)\.toFixed\(2\)/);
});
