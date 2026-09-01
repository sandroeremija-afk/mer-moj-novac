'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const premium = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');

function functionBody(name, nextName) {
  const start = premium.indexOf(`function ${name}`);
  assert.ok(start >= 0, `${name} exists`);
  const end = nextName ? premium.indexOf(`function ${nextName}`, start) : premium.length;
  return premium.slice(start, end);
}

test('evaluation cycle 2: Insights exposes the four canonical timeframes in the intended order', () => {
  const start = html.indexOf('id="insightsFilters"');
  const end = html.indexOf('</div>', start);
  assert.ok(start >= 0 && end > start, 'Insights timeframe control exists');
  const filters = html.slice(start, end);
  const options = [...filters.matchAll(/<button\b([^>]*)data-timeframe="([^"]+)"([^>]*)data-i18n="([^"]+)"[^>]*>([^<]+)<\/button>/g)]
    .map(match => ({ attributes:`${match[1]}${match[3]}`, value:match[2], key:match[4], label:match[5] }));

  assert.match(filters, /role="group"/);
  assert.match(filters, /data-i18n-aria="reportTimeframe"/);
  assert.deepEqual(options.map(option => option.value), ['daily','monthly','ytd','all']);
  assert.deepEqual(options.map(option => option.key), ['daily','monthly','yearToDate','allTime']);
  assert.deepEqual(options.map(option => option.label), ['Danas','Ovaj mjesec','Ova godina','Sve ukupno']);
  assert.deepEqual(options.filter(option => /\bclass="[^"]*\bactive\b/.test(option.attributes)).map(option => option.value), ['monthly']);
  assert.match(app, /let insightsTimeframe = 'monthly'/);
  assert.match(app, /\$\$\('#insightsFilters \[data-timeframe\]'\)\.forEach\(button=>button\.addEventListener\('click',\(\)=>\{insightsTimeframe=button\.dataset\.timeframe;renderInsights\(\);\}\)\)/);
});

test('evaluation cycle 2: the Insights toolbar uses the requested export report copy', () => {
  const start = html.indexOf('id="insightsView"');
  const filters = html.indexOf('id="insightsFilters"', start);
  const heading = html.slice(start, filters);
  assert.match(heading, /data-export-insights[\s\S]*?data-i18n="exportInsightsReport">Izvoz izvještaja<\/span>/);
  assert.doesNotMatch(heading, /Izvezi izvješće|Izvezi izvještaj/);
  assert.match(app, /exportInsightsReport:'Izvoz izvještaja'/);
});

test('evaluation cycle 2: the exporter consumes one canonical report built from the active timeframe', () => {
  const body = functionBody('exportInsightsReportCsv', 'openGlobalImport');
  assert.match(body, /MerCore\.buildInsightsReport\(state\.transactions,insightsTimeframe,appReferenceDate\)/);
  assert.match(body, /report\.totals/);
  assert.match(body, /report\.transactionCount/);
  assert.match(body, /report\.categories/);
  assert.match(body, /report\.series/);
  assert.match(body, /\{daily:'daily',monthly:'monthly',ytd:'yearToDate',all:'allTime'\}\[insightsTimeframe\]/);
  assert.match(body, /insights-\$\{report\.timeframe\}\.csv/);
  assert.doesNotMatch(body, /transactionTotals\(state\.transactions,insightsTimeframe|filterTransactions\(state\.transactions,insightsTimeframe|categoryExpenseTotals\(state\.transactions,insightsTimeframe/);
  assert.match(premium, /\$\$\('\[data-export-insights\]'\)\.forEach\(button=>button\.addEventListener\('click',exportInsightsReportCsv\)\)/);
});

test('evaluation cycle 2: every Insights consumer follows the selected timeframe', () => {
  assert.match(app, /filterTransactions\(state\.transactions,insightsTimeframe,reference\)/);
  assert.match(app, /derivedTotals\(insightsTimeframe\)/);
  assert.match(app, /topExpenseCategory\(state\.transactions,insightsTimeframe,reference\)/);
  assert.match(app, /groupCashflow\(state\.transactions,insightsTimeframe,reference\)/);
  assert.match(app, /categoryExpenseTotals\(state\.transactions,insightsTimeframe,reference\)/);
  assert.match(app, /button\.dataset\.timeframe===insightsTimeframe[\s\S]*?aria-pressed/);
});
