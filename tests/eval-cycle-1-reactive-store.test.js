const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const MerCore = require('../core.js');
const MerStateStore = require('../state-store.js');

function profile(label, availableBalance = 1000) {
  return {
    accountLabel: label,
    income: 2000,
    bills: 500,
    savingsTarget: 200,
    guard: 0.1,
    spent: 999,
    availableBalance,
    categories: [
      { id: 'food', limit: 500, spent: 999 },
      { id: 'other', limit: 500, spent: 0 }
    ],
    incomeCategories: [{ id: 'salary' }],
    transactions: [
      { id: 'income-1', type: 'income', name: 'Salary', amount: 500, category: 'salary', date: '2026-08-01T08:00:00' },
      { id: 'expense-1', type: 'expense', name: 'Market', amount: 100, category: 'food', date: '2026-08-05T08:00:00' }
    ],
    goalBuckets: [{ id: 'reserve', name: 'Reserve', target: 5000, current: 200, primary: true }],
    savingsEntries: [],
    recurring: []
  };
}

function setup() {
  const state = MerCore.createAccountStore(profile('personalAccount'), profile('businessAccount', 5000), { activeAccount: 'personal' });
  return { state, store: MerStateStore.createStore(state, { referenceDate: '2026-08-20' }) };
}

test('cycle 1: store derives every dashboard and budget value from transactions on initialization', () => {
  const { state, store } = setup();
  const personal = state.accounts.personal;
  assert.equal(personal.spent, 100);
  assert.equal(personal.categories.find(category => category.id === 'food').spent, 100);
  assert.equal(personal.savingsBalance, 200);
  assert.equal(personal.savingsGoal, 5000);
  assert.equal(personal.availableBalance, 1000);
  assert.deepEqual(store.snapshot('personal').totals, { income: 500, expenses: 100, net: 400, savingsRate: 80, count: 2 });
});

test('cycle 1: adding a transaction synchronously updates totals, category progress and all subscribers', () => {
  const { state, store } = setup();
  const events = [];
  store.subscribe(event => events.push(event));
  state.accounts.personal.transactions.push({ id: 'expense-2', type: 'expense', name: 'Taxi', amount: 50, category: 'other', date: '2026-08-20T12:00:00' });
  store.commit('transaction-add');

  const personal = state.accounts.personal;
  assert.equal(events.length, 1);
  assert.equal(events[0].reason, 'transaction-add');
  assert.equal(personal.spent, 150);
  assert.equal(personal.categories.find(category => category.id === 'other').spent, 50);
  assert.equal(personal.availableBalance, 950);
  assert.equal(store.snapshot().totals.net, 350);
});

test('cycle 1: editing amount and category removes stale derived values before recalculation', () => {
  const { state, store } = setup();
  const transaction = state.accounts.personal.transactions.find(item => item.id === 'expense-1');
  transaction.amount = 180;
  transaction.category = 'other';
  store.commit('transaction-edit');

  assert.equal(state.accounts.personal.spent, 180);
  assert.equal(state.accounts.personal.categories.find(category => category.id === 'food').spent, 0);
  assert.equal(state.accounts.personal.categories.find(category => category.id === 'other').spent, 180);
  assert.equal(state.accounts.personal.availableBalance, 920);
});

test('cycle 1: deleting an entry immediately reverses every connected total', () => {
  const { state, store } = setup();
  state.accounts.personal.transactions = state.accounts.personal.transactions.filter(item => item.id !== 'expense-1');
  store.commit('transaction-delete');

  assert.equal(state.accounts.personal.spent, 0);
  assert.equal(state.accounts.personal.categories.find(category => category.id === 'food').spent, 0);
  assert.equal(state.accounts.personal.availableBalance, 1100);
  assert.equal(store.snapshot().totals.expenses, 0);
});

test('cycle 1: incomes and savings contributions react independently and update net balance', () => {
  const { state, store } = setup();
  state.accounts.personal.transactions.push({ id: 'income-2', type: 'income', name: 'Gift', amount: 250, category: 'salary', date: '2026-08-20T12:00:00' });
  state.accounts.personal.goalBuckets[0].current += 50;
  store.commit('income-and-savings');

  assert.equal(store.snapshot().totals.income, 750);
  assert.equal(store.snapshot().totals.expenses, 100);
  assert.equal(store.snapshot().totals.net, 650);
  assert.equal(state.accounts.personal.savingsBalance, 250);
  assert.equal(state.accounts.personal.availableBalance, 1200);
});

test('cycle 1: Personal mutations never bleed into Business and account switching is instantaneous', () => {
  const { state, store } = setup();
  const businessTransactions = JSON.stringify(state.accounts.business.transactions);
  const businessBalance = state.accounts.business.availableBalance;
  state.accounts.personal.transactions.push({ id: 'personal-only', type: 'expense', amount: 75, category: 'food', date: '2026-08-20T12:00:00' });
  store.commit('personal-only-change');

  assert.equal(JSON.stringify(state.accounts.business.transactions), businessTransactions);
  assert.equal(state.accounts.business.availableBalance, businessBalance);
  assert.equal(store.switchAccount('business'), true);
  assert.equal(store.getActiveProfile(), state.accounts.business);
  assert.equal(store.snapshot().accountId, 'business');
  assert.equal(state.accounts.business.transactions.some(transaction => transaction.id === 'personal-only'), false);
});

test('cycle 1: application mutations use the reactive commit path without manual render coupling', () => {
  const root = path.resolve(__dirname, '..');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const premium = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');
  assert.match(app, /MerStateStore\.createStore/);
  assert.match(app, /reactiveStore\.subscribe/);
  assert.doesNotMatch(`${app}\n${premium}`, /save\([^)]*\);\s*renderAll\(/);
  assert.match(app, /save\(existing\?'transaction-edit':'transaction-add'\)/);
  assert.match(premium, /save\('bulk-import'\)/);
});
