const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const MerCore = require('../core.js');
const MerStateStore = require('../state-store.js');

function profile(label) {
  return {
    accountLabel:label,
    income:100,
    bills:0,
    savingsTarget:0,
    guard:0,
    availableBalance:100,
    categories:[{id:'food',limit:100,spent:0}],
    incomeCategories:[{id:'salary'}],
    transactions:[],
    goalBuckets:[{id:'reserve',target:1000,current:0,primary:true}],
    savingsEntries:[],
    recurring:[]
  };
}

function setup() {
  const state=MerCore.createAccountStore(profile('personalAccount'),profile('businessAccount'));
  return {state,store:MerStateStore.createStore(state,{referenceDate:'2026-08-20'})};
}

test('evaluation cycle 1: a 1000 euro income immediately increases balance and net total', () => {
  const {state,store}=setup();
  const before=state.accounts.personal.availableBalance;
  state.accounts.personal.transactions.unshift({id:'income-1000',type:'income',name:'Salary',amount:1000,category:'salary',date:'2026-08-20T09:00:00'});
  store.commit('transaction-add');
  assert.equal(state.accounts.personal.availableBalance,before+1000);
  assert.equal(state.accounts.personal.derived.monthly.income,1000);
  assert.equal(state.accounts.personal.derived.monthly.net,1000);
  assert.equal(state.accounts.personal.derived.monthlySavings,1000);
});

test('evaluation cycle 1: a 5000 euro expense on a 100 euro budget is warned but allowed', () => {
  const impact=MerCore.assessExpenseImpact({amount:5000,currentSpent:0,monthlyBudget:100,categorySpent:0,categoryLimit:100,dailyBudget:5});
  assert.equal(impact.valid,true);
  assert.equal(impact.allowed,true);
  assert.equal(impact.warning,'monthly-over');
  assert.equal(impact.monthlyOver,4900);
  assert.equal(impact.categoryOver,4900);
  assert.equal(impact.categoryPercent,5000);
  assert.equal(impact.level,'danger');
});

test('evaluation cycle 1: extreme expense persists and produces a real negative balance', () => {
  const {state,store}=setup();
  state.accounts.personal.transactions.unshift({id:'expense-5000',type:'expense',name:'Emergency repair',amount:5000,category:'food',date:'2026-08-20T10:00:00'});
  store.commit('transaction-add');
  assert.equal(state.accounts.personal.derived.monthly.expenses,5000);
  assert.equal(state.accounts.personal.availableBalance,-4900);
  assert.equal(state.accounts.personal.derived.categoryMetrics.food.spent,5000);
});

test('evaluation cycle 1: form dispatch derives the active type and never treats overage as invalid', () => {
  const app=fs.readFileSync(path.resolve(__dirname,'..','app.js'),'utf8');
  const evaluation=app.match(/function evaluateTransaction\(\)[\s\S]*?function openTransaction/)?.[0]||'';
  assert.match(app,/selectedType=.*data-transaction-type.*aria-pressed/);
  assert.match(app,/transactionType=selectedType==='income'\?'income':'expense'/);
  assert.match(app,/transactionSubmit'\)\.disabled=!impact\.valid/);
  assert.match(app,/transactionAddedOverBudget/);
  assert.doesNotMatch(evaluation,/transactionSubmit'\)\.disabled=blocked/);
  assert.doesNotMatch(evaluation,/return !blocked/);
});
