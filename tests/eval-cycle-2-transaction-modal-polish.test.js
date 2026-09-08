const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const premium = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const exportUI = fs.readFileSync(path.join(root, 'export-ui.js'), 'utf8');
const {buildReport} = require('../export-core.js');

test('evaluation cycle 2: transaction modal switches copy and accepts a booking date', () => {
  assert.match(html, /id="transactionTitle"[^>]+data-i18n="addExpense">Dodaj trošak/);
  assert.match(html, /id="transactionDate" type="date" required/);
  assert.match(html, /id="transactionSubmit"[^>]+data-i18n="addExpenseSubmit">Dodaj trošak/);
  assert.match(app, /transactionType==='income'\?'addIncome':'addExpense'/);
  assert.match(app, /transactionType==='income'\?'addIncomeSubmit':'addExpenseSubmit'/);
  assert.match(app, /dateValue>appReferenceDate/);
  assert.match(app, /MerCore\.updateTransactionSchedule\(.*appReferenceDate\)/s);
  assert.match(app, /savedTransaction\.status==='scheduled'/);
});

test('evaluation cycle 2: import launched from transaction entry has an explicit Back path', () => {
  assert.match(html, /id="importTransactionBackWrap" hidden[\s\S]*?id="backToTransactionEntry"[\s\S]*?data-i18n="back">Natrag/);
  assert.match(premium, /openGlobalImport\(\{fromTransaction=false\}/);
  assert.match(premium, /function backToManualTransaction\(\)/);
  assert.match(premium, /button\.closest\('#transactionModal'\)/);
});

test('evaluation cycle 2: contextual Croatian export names are stable and descriptive', () => {
  const options = {profile:{transactions:[], categories:[], savingsEntries:[]}, profileId:'personal', referenceDate:'2026-09-08', currency:'EUR'};
  for (const [context, timeframe, month, expected] of [
    ['activity', 'all', undefined, 'Aktivnost_Transakcije_Sve_Ukupno_2026-09-08_personal'],
    ['budget', 'monthly', undefined, 'Budzeti_Izvoz_Mjesec_2026-09_personal'],
    ['insights', 'ytd', undefined, 'Uvidi_Izvjestaj_Godina_2026_personal'],
    ['savings', 'custom-month', '2026-08', 'Stednja_Uplate_Mjesec_2026-08_personal']
  ]) {
    const report = buildReport({...options, context, timeframe, month});
    assert.equal(report.filenameStem, expected);
    for (const format of ['csv', 'pdf', 'json']) assert.equal(`${report.filenameStem}.${format}`, `${expected}.${format}`);
  }
  assert.match(exportUI, /anchor\.download = `\$\{report\.filenameStem\}\.\$\{format\}`/);
  assert.doesNotMatch(premium, /link\.download=['"]export\.(?:csv|json|pdf)['"]/);
  assert.doesNotMatch(exportUI, /anchor\.download=['"]export\.(?:csv|json|pdf)['"]/);
});

test('evaluation cycle 2: number spinners are removed and savings history uses the shared thin scrollbar', () => {
  assert.match(css, /input\[type="number"\][\s\S]*?-moz-appearance:textfield/);
  assert.match(css, /input\[type="number"\]::-webkit-outer-spin-button[\s\S]*?-webkit-appearance:none/);
  assert.match(css, /\.savings-entry-list-all \{[\s\S]*?scrollbar-width:thin/);
  assert.match(css, /\.savings-entry-list-all::-webkit-scrollbar-thumb/);
  assert.match(html, /data-i18n="activityContinuous">Prikaži sve<\/button>/);
});
