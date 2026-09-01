'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const MerCore = require('../core.js');
const MerStateStore = require('../state-store.js');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

function profile(accountName, accountLabel, initials, income, spent) {
  return {
    accountName,
    accountLabel,
    initials,
    income,
    bills: 0,
    savingsTarget: 0,
    savingsBalance: 0,
    guard: 0,
    spent,
    availableBalance: income - spent,
    transactions: [
      { id: `${initials}-income`, type: 'income', amount: income, category: 'salary', date: '2026-08-20T08:00:00' },
      { id: `${initials}-expense`, type: 'expense', amount: spent, category: 'other', date: '2026-08-20T09:00:00' }
    ],
    categories: [],
    incomeCategories: [],
    goalBuckets: []
  };
}

test('evaluation cycle 2: account store switches identity and financial metrics atomically', () => {
  const personal = profile('Moj eRačun', 'personalAccount', 'ME', 1200, 200);
  const business = profile('Elektronički računi d.o.o.', 'businessAccount', 'ER', 8000, 2500);
  const persisted = MerCore.createAccountStore(personal, business, { activeAccount: 'personal' });
  const store = MerStateStore.createStore(persisted, { referenceDate: '2026-08-20' });

  assert.equal(store.getActiveProfile().accountName, 'Moj eRačun');
  assert.equal(store.getActiveProfile().initials, 'ME');
  assert.equal(store.snapshot().totals.net, 1000);

  assert.equal(store.switchAccount('business'), true);
  assert.equal(store.getActiveProfile().accountName, 'Elektronički računi d.o.o.');
  assert.equal(store.getActiveProfile().accountLabel, 'businessAccount');
  assert.equal(store.getActiveProfile().initials, 'ER');
  assert.equal(store.snapshot().accountId, 'business');
  assert.equal(store.snapshot().totals.net, 5500);

  assert.equal(store.switchAccount('personal'), true);
  assert.equal(store.getActiveProfile().accountName, 'Moj eRačun');
  assert.equal(store.snapshot().totals.net, 1000);
});

test('evaluation cycle 2: application switch and render paths share the active profile object', () => {
  assert.match(app, /function renderAccountContext\(\)\s*\{[\s\S]*?accountAvatar[\s\S]*?state\.initials[\s\S]*?accountName[\s\S]*?state\.accountName[\s\S]*?accountLabel[\s\S]*?t\(state\.accountLabel\)/);
  assert.match(app, /function switchAccount\(accountId\)[\s\S]*?appState\.activeAccount=accountId;state=appState\.accounts\[accountId\];[\s\S]*?save\('account-switch'\)/);
  assert.match(app, /reactiveStore\.subscribe\(event\s*=>\s*\{[\s\S]*?state=event\.activeProfile;[\s\S]*?renderAll\(\)/);
  assert.match(app, /function renderAll\(\)[\s\S]*?renderAccountContext\(\)[\s\S]*?renderOverview\(\)[\s\S]*?renderBudgetView\(\)[\s\S]*?renderSavingsView\(\)[\s\S]*?renderInsights\(\)/);
});
