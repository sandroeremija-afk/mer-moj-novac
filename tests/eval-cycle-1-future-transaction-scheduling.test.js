const test = require('node:test');
const assert = require('node:assert/strict');

const MerCore = require('../core.js');
const MerAccounting = require('../accounting-core.js');
const MerImport = require('../import-core.js');
const MerStateStore = require('../state-store.js');

function profile(overrides = {}) {
  return {
    profileId:'personal',
    income:0,
    bills:0,
    savingsTarget:0,
    guard:0,
    financialOpeningBalance:0,
    availableBalance:0,
    categories:[{ id:'food', limit:1000, spent:0 }, { id:'other', limit:500, spent:0 }],
    incomeCategories:[{ id:'salary' }, { id:'otherIncome' }],
    goalBuckets:[{ id:'reserve', current:0, target:1000, primary:true, roundUpsEnabled:true }],
    savingsEntries:[],
    transactions:[],
    ...overrides
  };
}

test('evaluation cycle 1: future transactions persist as scheduled but stay outside every financial calculation', () => {
  const personal = profile({
    transactions:[
      { id:'income-now', type:'income', name:'Salary', amount:1000, category:'salary', date:'2026-08-10T09:00:00' },
      { id:'expense-now', type:'expense', name:'Konzum', amount:100, category:'food', date:'2026-08-15T12:00:00' },
      { id:'expense-future', type:'expense', name:'Future groceries', amount:500, category:'food', date:'2026-08-25T12:00:00' },
      { id:'income-future', type:'income', name:'Future bonus', amount:300, category:'salary', date:'2026-08-30T12:00:00' }
    ]
  });
  const state = { activeAccount:'personal', accounts:{ personal, business:profile({ profileId:'business' }) } };
  const store = MerStateStore.createStore(state, { referenceDate:'2026-08-20' });

  assert.equal(personal.transactions.find(item => item.id === 'expense-future').status, 'scheduled');
  assert.equal(personal.transactions.find(item => item.id === 'expense-future').scheduled, true);
  assert.equal(personal.transactions.find(item => item.id === 'expense-now').status, 'posted');
  assert.deepEqual(personal.derived.monthly, { income:1000, expenses:100, net:900, savingsRate:90, count:2 });
  assert.equal(personal.derived.availableBalance, 900);
  assert.equal(personal.derived.categorySpending.food, 100);
  assert.equal(personal.derived.spendingSeries[19].actual, 100);

  const insight = MerCore.buildInsightsReport(personal.transactions, 'monthly', '2026-08-20');
  assert.equal(insight.transactionCount, 2);
  assert.equal(insight.totals.net, 900);
  assert.equal(MerCore.topExpenseCategory(personal.transactions, 'monthly', '2026-08-20').amount, 100);
  assert.equal(MerCore.monthOverMonthExpenses(personal.transactions, '2026-08-20').current, 100);
  assert.deepEqual(MerAccounting.monthSeries(personal.transactions, '2026-08-20', 1), [
    { key:'2026-08', income:1000, expenses:100 }
  ]);

  assert.equal(store.setReferenceDate('2026-08-25'), true);
  assert.equal(personal.transactions.find(item => item.id === 'expense-future').status, 'posted');
  assert.equal(personal.transactions.find(item => item.id === 'expense-future').scheduled, false);
  assert.equal(personal.transactions.find(item => item.id === 'income-future').status, 'scheduled');
  assert.equal(personal.derived.monthly.expenses, 600);
  assert.equal(personal.derived.monthly.net, 400);
  assert.equal(personal.derived.categorySpending.food, 600);

  assert.equal(store.setReferenceDate('2026-08-30'), true);
  assert.equal(personal.transactions.find(item => item.id === 'income-future').status, 'posted');
  assert.equal(personal.derived.monthly.income, 1300);
  assert.equal(personal.derived.monthly.net, 700);
  assert.equal(personal.derived.availableBalance, 700);
});

test('evaluation cycle 1: imported future rows are tagged and become effective on their booking date', () => {
  const personal = profile();
  const rows = [
    { type:'expense', name:'Konzum scheduled', amount:45, category:'food', date:'2026-08-21', profileId:'personal' },
    { type:'income', name:'Salary booked', amount:900, category:'salary', date:'2026-08-20', profileId:'personal' }
  ];
  const result = MerImport.commitImport(personal, rows, 'zaba.csv', '2026-08-20');

  assert.equal(result.imported.length, 2);
  assert.equal(result.imported.find(item => item.name === 'Konzum scheduled').status, 'scheduled');
  assert.equal(result.imported.find(item => item.name === 'Salary booked').status, 'posted');
  assert.deepEqual(MerCore.transactionTotals(personal.transactions, 'all', '2026-08-20'), {
    income:900, expenses:0, net:900, savingsRate:100, count:1
  });

  MerStateStore.recalculateProfile(personal, '2026-08-21');
  assert.equal(result.imported.find(item => item.name === 'Konzum scheduled').status, 'posted');
  assert.equal(personal.derived.monthly.expenses, 45);
  assert.equal(personal.derived.monthly.net, 855);
});

test('evaluation cycle 1: future expenses cannot trigger round-ups before they become effective', () => {
  const personal = profile();
  const future = MerCore.updateTransactionSchedule({
    id:'future-card', type:'expense', name:'Future card purchase', amount:12.49,
    category:'food', date:'2026-08-21T12:00:00', sourceType:'manual'
  }, '2026-08-20');

  assert.equal(MerAccounting.applyRoundUp(personal, future, '2026-08-20'), null);
  assert.equal(personal.goalBuckets[0].current, 0);
  assert.equal(personal.savingsEntries.length, 0);

  const contribution = MerAccounting.applyRoundUp(personal, future, '2026-08-21');
  assert.ok(contribution);
  assert.equal(contribution.amount, 0.51);
  assert.equal(personal.goalBuckets[0].current, 0.51);
});

test('evaluation cycle 1: date eligibility is authoritative even when stored status is stale', () => {
  const future = { date:'2026-09-01T12:00:00', status:'posted' };
  const due = { date:'2026-08-20T12:00:00', status:'pending' };
  assert.equal(MerCore.isTransactionEffective(future, '2026-08-20'), false);
  assert.equal(MerCore.transactionStatusAt(future, '2026-08-20'), 'scheduled');
  assert.equal(MerCore.isTransactionEffective(due, '2026-08-20'), true);
  assert.equal(MerCore.transactionStatusAt(due, '2026-08-20'), 'posted');
  assert.equal(MerCore.transactionStatusAt({ date:'2026-02-30' }, '2026-08-20'), 'invalid');
  assert.equal(MerCore.transactionStatusAt(due, 'invalid-reference'), 'invalid');
  assert.equal(MerCore.isTransactionEffective(due, 'invalid-reference'), false);
});
