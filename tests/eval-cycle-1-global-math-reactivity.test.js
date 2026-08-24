const test = require('node:test');
const assert = require('node:assert/strict');
const MerCore = require('../core.js');
const MerImport = require('../import-core.js');
const MerStateStore = require('../state-store.js');

function profile(label, balance = 1000) {
  return {
    accountLabel: label,
    income: 2_000_000,
    bills: 0,
    savingsTarget: 0,
    guard: 0,
    availableBalance: balance,
    categories: [{ id:'food', limit:1_000_000, spent:0 }, { id:'other', limit:1_000_000, spent:0 }],
    incomeCategories: [{ id:'salary' }, { id:'otherIncome' }],
    transactions: [
      { id:'salary', type:'income', name:'Salary', amount:1000, category:'salary', date:'2026-08-01T08:00:00' },
      { id:'market', type:'expense', name:'Market', amount:100, category:'food', date:'2026-08-02T08:00:00' }
    ],
    goalBuckets: [{ id:'reserve', target:5000, current:0, primary:true }],
    savingsEntries: [],
    recurring: []
  };
}

function setup() {
  const state = MerCore.createAccountStore(profile('personalAccount'), profile('businessAccount', 5000));
  return { state, store:MerStateStore.createStore(state,{referenceDate:'2026-08-20'}) };
}

test('evaluation cycle 1: high values and signed corrections cascade with cent precision', () => {
  const { state, store } = setup();
  const personal = state.accounts.personal;
  personal.transactions.push(
    { id:'high-income', type:'income', amount:1_000_000, category:'salary', date:'2026-08-20T09:00:00' },
    { id:'income-reversal', type:'income', amount:-1000, category:'salary', date:'2026-08-20T09:01:00' },
    { id:'high-expense', type:'expense', amount:999_999.99, category:'food', date:'2026-08-20T10:00:00' },
    { id:'refund', type:'expense', amount:-99.99, category:'food', date:'2026-08-20T10:01:00' }
  );
  store.commit('edge-transactions');

  assert.deepEqual(personal.derived.monthly, { income:1_000_000, expenses:1_000_000, net:0, savingsRate:0, count:6 });
  assert.equal(personal.spent, 1_000_000);
  assert.equal(personal.derived.monthlySavings, 0);
  assert.equal(personal.categories[0].spent, 1_000_000);
  assert.equal(personal.derived.categoryMetrics.food.percent, 100);
  assert.equal(personal.derived.categoryMetrics.food.level, 'red');
  assert.equal(personal.availableBalance, 100);
});

test('evaluation cycle 1: editing and deleting recompute every dependency from records, never deltas', () => {
  const { state, store } = setup();
  const personal = state.accounts.personal;
  const expense = personal.transactions.find(item=>item.id==='market');
  expense.amount = 500_000.01;
  expense.category = 'other';
  store.commit('transaction-edit');
  assert.equal(personal.derived.monthly.expenses, 500_000.01);
  assert.equal(personal.derived.monthlySavings, -499_000.01);
  assert.equal(personal.derived.categoryMetrics.food.spent, 0);
  assert.equal(personal.derived.categoryMetrics.other.spent, 500_000.01);
  assert.equal(personal.availableBalance, -498_900.01);

  personal.transactions = personal.transactions.filter(item=>item.id!=='market');
  store.commit('transaction-delete');
  assert.equal(personal.derived.monthly.expenses, 0);
  assert.equal(personal.derived.categoryMetrics.other.spent, 0);
  assert.equal(personal.availableBalance, 1100);
});

test('evaluation cycle 1: a bulk CSV commit triggers one exact store cascade', () => {
  const { state, store } = setup();
  const personal = state.accounts.personal;
  const csv = ['Date,Description,Amount,Type','2026-08-20,Freelance invoice,2500.25,Income','2026-08-20,Konzum,-300.10,Expense','2026-08-20,Taxi,-49.90,Expense'].join('\n');
  const staged = MerImport.parseCsvImport(csv, personal);
  assert.equal(staged.reviewRows.length, 3);
  const committed = MerImport.commitImport(personal, staged.reviewRows, 'bulk.csv');
  assert.equal(committed.imported.length, 3);
  store.commit('bulk-import');
  assert.equal(personal.derived.monthly.income, 3500.25);
  assert.equal(personal.derived.monthly.expenses, 450);
  assert.equal(personal.derived.monthly.net, 3050.25);
  assert.equal(personal.derived.monthlySavings, 3050.25);
  assert.equal(personal.derived.categorySpending.food, 400.1);
});

test('evaluation cycle 1: Personal recalculation never mutates Business math or charts', () => {
  const { state, store } = setup();
  const before = {
    transactions:JSON.stringify(state.accounts.business.transactions),
    monthly:{...state.accounts.business.derived.monthly},
    spending:{...state.accounts.business.derived.categorySpending},
    balance:state.accounts.business.availableBalance
  };
  state.accounts.personal.transactions.push({ id:'personal-only', type:'expense', amount:777, category:'food', date:'2026-08-20T12:00:00' });
  store.commit('personal-only');
  assert.equal(JSON.stringify(state.accounts.business.transactions), before.transactions);
  assert.deepEqual(state.accounts.business.derived.monthly, before.monthly);
  assert.deepEqual(state.accounts.business.derived.categorySpending, before.spending);
  assert.equal(state.accounts.business.availableBalance, before.balance);
  assert.equal(state.accounts.business.transactions.some(item=>item.id==='personal-only'), false);
});
