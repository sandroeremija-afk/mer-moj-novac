const test = require('node:test');
const assert = require('node:assert/strict');
const MerCore = require('../core.js');
const MerImport = require('../import-core.js');
const MerStateStore = require('../state-store.js');

function profile(label = 'Personal') {
  return {
    accountLabel:label,
    income:1000,
    bills:0,
    savingsTarget:0,
    guard:0,
    availableBalance:0,
    categories:[{ id:'food', limit:500, spent:0 }, { id:'other', limit:500, spent:0 }],
    incomeCategories:[{ id:'salary' }, { id:'otherIncome' }],
    transactions:[],
    goalBuckets:[],
    savingsEntries:[]
  };
}

test('evaluation cycle 1: all-time totals reject future and malformed records', () => {
  const records = [
    { id:'past-income', type:'income', amount:1000, date:'2026-08-24T09:00:00' },
    { id:'today-expense', type:'expense', amount:125.25, date:'2026-08-25T09:00:00' },
    { id:'future-expense', type:'expense', amount:9000, date:'2026-08-26T09:00:00' },
    { id:'invalid', type:'expense', amount:50, date:'2026-02-31' },
    null
  ];
  assert.deepEqual(MerCore.transactionTotals(records, 'all', '2026-08-25'), {
    income:1000,
    expenses:125.25,
    net:874.75,
    savingsRate:87.475,
    count:2
  });
  assert.deepEqual(MerCore.filterTransactions(records, 'all', 'invalid-reference'), []);
});
test('evaluation cycle 1: month-end recurrence clamps safely across leap years', () => {
  const rule = { enabled:true, day:31, startDate:'2024-01-31' };
  assert.equal(MerCore.nextOccurrence(rule, '2024-01-31'), '2024-02-29');
  assert.deepEqual(MerCore.occurrencesBetween(rule, '2024-01-30', '2024-04-30'), [
    '2024-01-31',
    '2024-02-29',
    '2024-03-31',
    '2024-04-30'
  ]);
  assert.equal(MerCore.nextOccurrence({ ...rule, startDate:'2024-02-31' }, '2024-01-01'), null);
  assert.deepEqual(MerCore.occurrencesBetween(rule, 'bad-date', '2024-12-31'), []);
});

test('evaluation cycle 1: damaged and oversized imports fail closed without partial writes', () => {
  const current = profile();
  const malformed = MerImport.parseCsvImport([
    'Date,Description,Amount,Type',
    '2026-02-31,Impossible date,10,Expense',
    '2026-08-25,,10,Expense',
    '2026-08-25,Konzum,not-a-number,Expense',
    '2026-08-25,Lidl,-25,Expense'
  ].join('\n'), current);
  assert.equal(malformed.reviewRows.length, 1);
  assert.equal(malformed.reviewRows[0].category, 'food');
  assert.equal(malformed.invalidRows.length, 3);

  const before = current.transactions.length;
  const committed = MerImport.commitImport(current, [null, {}, malformed.reviewRows[0]], 'bank\r\nstatement.csv');
  assert.equal(committed.imported.length, 1);
  assert.equal(committed.invalid, 1);
  assert.equal(current.transactions.length, before + 1);
  assert.doesNotMatch(current.transactions[0].source, /[\r\n]/);

  const oversized = MerImport.parseCsvImport('x'.repeat(MerImport.MAX_TEXT_LENGTH + 1), current);
  assert.equal(oversized.reviewRows.length, 0);
  assert.equal(oversized.invalidRows[0].reason, 'file-too-large');
});

test('evaluation cycle 1: duplicate imports are idempotent and invalid categories fall back safely', () => {
  const current = profile();
  const row = { type:'expense', name:'Konzum Centar', amount:42.75, date:'2026-08-25', category:'deleted-category' };
  const first = MerImport.commitImport(current, [row], 'history.csv');
  const second = MerImport.commitImport(current, [row], 'history.csv');
  assert.equal(first.imported.length, 1);
  assert.equal(first.imported[0].category, 'food');
  assert.equal(first.imported[0].needsReview, true);
  assert.equal(second.imported.length, 0);
  assert.equal(second.duplicates, 1);
});

test('evaluation cycle 1: rapid edits and date rollover produce one consistent reactive snapshot', () => {
  const state = MerCore.createAccountStore(profile('Personal'), profile('Business'));
  const store = MerStateStore.createStore(state, { referenceDate:'2026-08-25' });
  const revisions = [];
  const unsubscribe = store.subscribe(event => revisions.push(event.revision));
  for (let index = 0; index < 40; index += 1) {
    store.update('rapid-edit', (_root, active) => {
      active.transactions = [{
        id:'rapid',
        type:index % 2 ? 'expense' : 'income',
        amount:index + 0.25,
        category:index % 2 ? 'food' : 'salary',
        date:'2026-08-25T12:00:00'
      }];
    });
  }
  const snapshot = store.snapshot('personal');
  assert.equal(snapshot.revision, 40);
  assert.equal(snapshot.totals.expenses, 39.25);
  assert.equal(snapshot.totals.income, 0);
  assert.equal(snapshot.totals.net, -39.25);
  assert.deepEqual(revisions, Array.from({ length:40 }, (_, index) => index + 1));
  assert.equal(store.setReferenceDate('2026-08-26'), true);
  assert.equal(store.snapshot('personal', 'daily').totals.count, 0);
  assert.equal(store.setReferenceDate('not-a-date'), false);
  unsubscribe();
});

test('evaluation cycle 1: subscriber failure cannot desynchronize other subscribers or profiles', () => {
  const state = MerCore.createAccountStore(profile('Personal'), profile('Business'));
  const store = MerStateStore.createStore(state, { referenceDate:'2026-08-25' });
  const reports = [];
  const originalRuntime = globalThis.MerRuntime;
  globalThis.MerRuntime = { report:error => reports.push(error.message) };
  let healthyCalls = 0;
  store.subscribe(() => { throw new Error('isolated-listener'); });
  store.subscribe(() => { healthyCalls += 1; });
  store.update('personal-only', (_root, active) => active.transactions.push({ id:'p', type:'income', amount:75, category:'salary', date:'2026-08-25' }));
  assert.equal(healthyCalls, 1);
  assert.deepEqual(reports, ['isolated-listener']);
  assert.equal(store.snapshot('personal').totals.net, 75);
  assert.equal(store.snapshot('business').totals.net, 0);
  globalThis.MerRuntime = originalRuntime;
});
