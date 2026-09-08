'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const premium = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');
const exportUI = fs.readFileSync(path.join(root, 'export-ui.js'), 'utf8');

test('cycle 1: Croatian budget action uses the requested copy', () => {
  assert.match(app, /budgetDataActions:'Izvoz budžeta'/);
  assert.match(html, /data-export-budget[\s\S]*data-i18n="budgetDataActions">Izvoz budžeta<\/span>/);
});

test('cycle 1: the budget entry opens a contextual export selection before any download', () => {
  assert.doesNotMatch(html, /id="budgetDataModal"|data-open-detail="budgetDataModal"/);
  assert.doesNotMatch(premium, /function exportBudgetPlanCsv|exportBudgetPlanCsv\(\)/);
  assert.match(premium, /\$\$\('\[data-export-budget\]'\)\.forEach\(button=>button\.addEventListener\('click',\(\)=>\{closeCardMenus\(\);window\.MerExportUI\?\.open\('budget'\);\}\)\)/);
  assert.match(exportUI, /exportDialog\.id = 'izvozModal'/);
  assert.match(exportUI, /el\('exportForm'\)\.addEventListener\('submit', download\)/);
  const start = exportUI.indexOf('function open(context, options = {})');
  const end = exportUI.indexOf('function openActivityTransfer()', start);
  assert.ok(start >= 0 && end > start);
  const open = exportUI.slice(start, end);
  assert.match(open, /renderPreview\(\)/);
  assert.match(open, /openModal[\s\S]*\(exportDialog\)/);
  assert.doesNotMatch(open, /anchor\.click|URL\.createObjectURL|downloadFile\(/);
  for (const timeframe of ['daily', 'monthly', 'custom-month', 'ytd', 'all']) {
    assert.ok(exportUI.includes(`<option value="${timeframe}">`), timeframe);
  }
  for (const format of ['csv', 'pdf', 'json']) assert.ok(exportUI.includes(`<option value="${format}">`), format);
  assert.match(exportUI, /Preuzmi datoteku/);
});
