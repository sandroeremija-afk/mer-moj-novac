'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {buildReport, toCsv} = require('../export-core.js');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const premium = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');
const exportUI = fs.readFileSync(path.join(root, 'export-ui.js'), 'utf8');

function fixture(context, timeframe = 'monthly') {
  return {
    context, timeframe, profileId:'personal', referenceDate:'2026-09-08', timezone:'Europe/Zagreb', currency:'EUR', language:'en',
    profile:{
      profileId:'personal', accountName:'Personal fixture',
      categories:[{id:'food', name:'Food', limit:100}, {id:'transport', name:'Transport', limit:70}],
      incomeCategories:[{id:'salary', name:'Salary'}],
      transactions:[
        {id:'salary', profileId:'personal', date:'2026-09-08T08:00:00+02:00', type:'income', categoryId:'salary', amount:750, currency:'EUR', name:'Salary', source:'Manual'},
        {id:'food', profileId:'personal', date:'2026-09-08T10:15:00+02:00', type:'expense', categoryId:'food', amount:20.50, currency:'EUR', name:'Groceries', source:'Auto: Bank'},
        {id:'refund', profileId:'personal', date:'2026-09-08', type:'expense', categoryId:'food', amount:-2.50, currency:'EUR', name:'Refund'},
        {id:'earlier', profileId:'personal', date:'2026-08-10', type:'expense', categoryId:'transport', amount:7, currency:'EUR'},
        {id:'future', profileId:'personal', date:'2026-09-10', type:'expense', categoryId:'food', amount:100, currency:'EUR'},
        {id:'business-only', profileId:'business', date:'2026-09-08', type:'income', amount:99999, currency:'EUR'}
      ]
    }
  };
}

test('evaluation cycle 2: Budget and Activity controls route to export selection instead of one-click downloads', () => {
  const budgetsStart = html.indexOf('id="budgetsView"');
  const budgetsEnd = html.indexOf('<section class="view"', budgetsStart);
  const budgets = html.slice(budgetsStart, budgetsEnd);
  assert.match(budgets, /<button type="button" class="secondary-button" data-export-budget/);
  assert.match(budgets, /data-i18n="budgetDataActions">Izvoz budžeta<\/span>/);
  assert.doesNotMatch(html, /id="budgetDataModal"|id="budgetExportCsv"/);
  assert.doesNotMatch(premium, /exportBudgetPlanCsv\(|exportActiveProfileCsv\(|exportInsightsReportCsv\(/);
  assert.match(html, /data-activity-transfer[\s\S]*?Uvoz \/ Izvoz/);
  assert.match(premium, /\$\$\('\[data-activity-transfer\]'\)\.forEach\(button=>button\.addEventListener\('click',\(\)=>window\.MerExportUI\?\.openActivityTransfer\(\)\)\)/);
  assert.match(exportUI, /el\('activityTransferExport'\)\.addEventListener\('click', \(\) => open\('activity', \{ fromActivity:true \}\)\)/);
  assert.match(exportUI, /bridge\(\)\.openImport\(\)/);
  assert.match(exportUI, /el\('exportBack'\)\.addEventListener\('click', openActivityTransfer\)/);
});

test('evaluation cycle 2: Activity exports every selected transaction with item-level audit fields', () => {
  const report = buildReport(fixture('activity', 'all'));
  const section = report.sections[0];
  assert.deepEqual(section.columns, ['Date', 'Time', 'Description', 'Type', 'Category', 'Amount', 'Currency', 'Status', 'Profile', 'Source', 'ID']);
  assert.equal(report.recordCount, 5, 'all-time includes each Personal transaction but rejects another profile');
  const item = Object.fromEntries(section.columns.map((field, i) => [field, section.rows.find(row => row.at(-1) === 'food')[i]]));
  assert.deepEqual(item, {Date:'2026-09-08', Time:'10:15', Description:'Groceries', Type:'Expenses', Category:'Food', Amount:'20.50', Currency:'EUR', Status:'Posted', Profile:'Personal fixture', Source:'Auto: Bank', ID:'food'});
  assert.equal(section.rows.find(row => row.at(-1) === 'future')[7], 'Scheduled', 'future items remain visible but clearly marked');
  assert.equal(report.summary.find(item => item.label === 'Net total').value, '€725.00', 'only posted expenses offset income');
});

test('evaluation cycle 2: Budget export groups limits and actual selected-period usage by category', () => {
  const options = fixture('budget');
  const untouched = JSON.stringify(options.profile);
  const report = buildReport(options);
  assert.deepEqual(report.sections[0].columns, ['Category', 'Current monthly limit', 'Expenses in selected period', 'Currency', 'Transaction count']);
  assert.deepEqual(report.sections[0].rows, [['Food', '100.00', '18.00', 'EUR', '2'], ['Transport', '70.00', '0.00', 'EUR', '0']]);
  assert.equal(report.summary[0].value, '€170.00');
  assert.equal(report.summary[1].value, '€18.00');
  assert.ok(report.notes.some(note => note.includes('current monthly settings, not historical limits')));
  assert.equal(JSON.stringify(options.profile), untouched, 'export neither edits budget limits nor mutates financial records');
});

test('evaluation cycle 2: Insights summaries and series follow the chosen export timeframe', () => {
  const daily = buildReport(fixture('insights', 'daily'));
  const yearly = buildReport(fixture('insights', 'ytd'));
  assert.equal(daily.period.start, '2026-09-08');
  assert.equal(daily.period.end, '2026-09-08');
  assert.equal(daily.recordCount, 3);
  assert.ok(daily.sections[0].rows.some(row => row[0] === '10:00' && row[2] === '20.50'));
  assert.deepEqual(daily.sections[1].rows, [['Food', '18.00', 'EUR']]);
  assert.ok(yearly.sections[0].rows.some(row => row[0] === '2026-08' && row[2] === '7.00'));
  assert.ok(yearly.sections[0].rows.some(row => row[0] === '2026-09' && row[1] === '750.00' && row[2] === '18.00'));
  assert.equal(yearly.summary.find(item => item.label === 'Net total').value, '€725.00');
  assert.match(yearly.filenameStem, /^Uvidi_Izvjestaj_Godina_2026_personal$/);
});

test('evaluation cycle 2: CSV user text stays formula-safe and negative numeric adjustments retain numeric precision', () => {
  const options = fixture('activity');
  options.profile.transactions = [{id:'injection', date:'2026-09-08', type:'expense', categoryId:'food', amount:-12.50, currency:'EUR', name:'=HYPERLINK("https://invalid.test")', source:'@danger'}];
  options.profile.categories[0].name = '+unsafe';
  const csv = toCsv(buildReport(options));
  assert.ok(csv.startsWith('\uFEFF'), 'UTF-8 BOM preserves Croatian text in spreadsheet software');
  assert.ok(csv.includes('"\'=HYPERLINK(""https://invalid.test"")"'));
  assert.ok(csv.includes('"\'+unsafe"'));
  assert.ok(csv.includes('"\'@danger"'));
  assert.ok(csv.includes('"-12.50"'));
  assert.ok(!csv.includes('"\'-12.50"'), 'numeric refunds must not be silently converted to literal text');
});
