const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const MerCore = require('../core.js');
const MerImport = require('../import-core.js');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');

function profile() {
  return {
    categories: [{ id: 'food' }, { id: 'transport' }, { id: 'other' }],
    incomeCategories: [{ id: 'salary' }, { id: 'freelance' }, { id: 'otherIncome' }],
    automationRules: [], transactions: [], availableBalance: 5000, savingsBalance: 0,
    goalBuckets: [{ id: 'personal-reserve', name: 'Reserve', target: 5000, current: 1000, primary: true }]
  };
}

test('Cycle 2: review engine stages more than 500 editable rows without data loss', () => {
  const rows = [['Date', 'Description', 'Amount', 'Type']];
  for (let index = 0; index < 600; index += 1) rows.push([`2026-08-${String(index % 28 + 1).padStart(2, '0')}`, `Merchant ${index}`, index % 17 === 0 ? 1000 + index : -(index + 1), index % 17 === 0 ? 'Income' : 'Expense']);
  const started = performance.now();
  const result = MerImport.parseRows(rows, profile());
  assert.equal(result.reviewRows.length, 600);
  assert.equal(result.invalidRows.length, 0);
  assert.ok(performance.now() - started < 1500);
  result.reviewRows[499].category = 'other';
  result.reviewRows[499].needsReview = false;
  assert.equal(result.reviewRows[499].name, 'Merchant 499');
});

test('Cycle 2: review edits commit only included rows and preserve corrected categories', () => {
  const target = profile();
  const result = MerImport.parseCsvImport('Date,Description,Amount,Type\n2026-08-18,Unknown A,-20,Expense\n2026-08-19,Unknown B,-30,Expense', target);
  result.reviewRows[0].category = 'food';
  result.reviewRows[0].needsReview = false;
  result.reviewRows[1].excluded = true;
  const committed = MerImport.commitImport(target, result.reviewRows, 'edited.csv');
  assert.equal(committed.imported.length, 1);
  assert.equal(committed.imported[0].category, 'food');
  assert.equal(committed.imported[0].needsReview, false);
});

test('Cycle 2: savings goal math updates only the selected bucket', () => {
  const personal = profile();
  personal.goalBuckets.push({ id: 'travel', name: 'Travel', target: 2000, current: 300 });
  const business = profile();
  business.goalBuckets[0].id = 'business-reserve';
  const result = MerCore.applySavingsContribution(personal, 'travel', 250);
  assert.equal(result.valid, true);
  assert.equal(personal.goalBuckets.find(goal => goal.id === 'travel').current, 550);
  assert.equal(personal.goalBuckets[0].current, 1000);
  assert.equal(business.goalBuckets[0].current, 1000);
  assert.equal(personal.savingsBalance, 1550);
});

test('Cycle 2: invalid goal values are rejected safely', () => {
  assert.equal(MerCore.validateSavingsGoal({ name: '', target: 100, current: 0 }).reason, 'missing-name');
  assert.equal(MerCore.validateSavingsGoal({ name: 'Trip', target: -1, current: 0 }).reason, 'invalid-target');
  assert.equal(MerCore.validateSavingsGoal({ name: 'Trip', target: 100, current: -2 }).reason, 'invalid-current');
  assert.equal(MerCore.validateSavingsGoal({ name: 'Trip', target: 100, current: 20, dueDate: 'not-a-date' }).reason, 'invalid-date');
});

test('Cycle 2: custom automation rules stay isolated to their profile', () => {
  const personal = profile();
  const business = profile();
  personal.automationRules.push({ id: 'personal-rule', keyword: 'Studio X', type: 'expense', category: 'food', enabled: true });
  business.automationRules.push({ id: 'business-rule', keyword: 'Studio X', type: 'expense', category: 'transport', enabled: true });
  assert.equal(MerCore.autoCategorizeBankTransaction({ description: 'Studio X charge', amount: -20 }, personal).category, 'food');
  assert.equal(MerCore.autoCategorizeBankTransaction({ description: 'Studio X charge', amount: -20 }, business).category, 'transport');
});

test('Cycle 2: settings UI exposes MFA, review pagination, privacy, export and goals', () => {
  ['mfaSetup','recoveryCodes','importReviewRows','importPrev','importNext','hideBalances','settingsExportJson','settingsExportAllCsv','goalBucketGrid','automationRuleForm'].forEach(id => assert.match(html, new RegExp(`id="${id}"`)));
  assert.match(script, /const importPageSize = 50/);
  assert.match(script, /MerSecurity\.validateTotp/);
  assert.match(script, /MerImport\.commitImport/);
});

test('Cycle 2: both Insights and Dashboard are re-rendered after premium state changes', () => {
  assert.match(script, /originalRenderAll\(\);renderPremium\(\)/);
  assert.match(script, /#overviewView \.goal-panel h2/);
  assert.match(html, /data-view-panel="insights"/);
});

