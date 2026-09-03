const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const premium = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

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
  assert.match(premium, /Aktivnost_Sve_Transakcije\.csv/);
  assert.match(premium, /Budzeti_Izvoz_\$\{croatianMonths[\s\S]*?\$\{year\}\.csv/);
  assert.match(premium, /Uvidi_Izvjestaj_\$\{/);
  assert.doesNotMatch(premium, /link\.download=['"]export\.(?:csv|json|pdf)['"]/);
});

test('evaluation cycle 2: number spinners are removed and savings history uses the shared thin scrollbar', () => {
  assert.match(css, /input\[type="number"\][\s\S]*?-moz-appearance:textfield/);
  assert.match(css, /input\[type="number"\]::-webkit-outer-spin-button[\s\S]*?-webkit-appearance:none/);
  assert.match(css, /\.savings-entry-list-all \{[\s\S]*?scrollbar-width:thin/);
  assert.match(css, /\.savings-entry-list-all::-webkit-scrollbar-thumb/);
  assert.match(html, /data-i18n="activityContinuous">Prikaži sve<\/button>/);
});
