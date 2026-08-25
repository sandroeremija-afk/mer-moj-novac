const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const MerCore = require('../core.js');
const MerStateStore = require('../state-store.js');

function profile() {
  return {
    accountLabel:'personalAccount',income:1000,bills:0,savingsTarget:0,guard:0,availableBalance:500,
    categories:[{id:'food',limit:1000,spent:0}],incomeCategories:[{id:'salary'}],
    transactions:[
      {id:'income',type:'income',amount:1000,date:'2026-08-01T08:00:00'},
      {id:'expense',type:'expense',amount:500,category:'food',date:'2026-08-10T08:00:00'}
    ],
    goalBuckets:[{id:'goal',target:1000,current:0,primary:true}],savingsEntries:[],recurring:[]
  };
}

test('evaluation cycle 2: ring fill scales proportionally when income changes', () => {
  const initial=MerCore.FinancialEngine.calculate(profile(),'2026-08-22',{openingBalance:0,savingsBalance:0});
  const updatedProfile=profile();
  updatedProfile.transactions.push({id:'bonus',type:'income',amount:200,date:'2026-08-22T12:00:00'});
  const updated=MerCore.FinancialEngine.calculate(updatedProfile,'2026-08-22',{openingBalance:0,savingsBalance:0});
  assert.equal(initial.safePercent,50);
  assert.ok(Math.abs(updated.safePercent-(700/1200*100))<1e-10);
  assert.ok(updated.safePercent>initial.safePercent);
  assert.ok(updated.safePercent<=100);
});

test('evaluation cycle 2: negative protection values stay finite and map to a safe red ring state', () => {
  const overdrawn=profile();
  overdrawn.transactions[1].amount=1500;
  const result=MerCore.FinancialEngine.calculate(overdrawn,'2026-08-22',{openingBalance:0,savingsBalance:0});
  assert.equal(result.safeToSpend,-500);
  assert.equal(result.safeDaily,-50);
  assert.equal(result.safePercent,0);
  assert.equal(result.overBudget,500);
  Object.values(result).filter(value=>typeof value==='number').forEach(value=>assert.ok(Number.isFinite(value)));
});

test('evaluation cycle 2: Dashboard, Budgets, and Insights share one financial snapshot', () => {
  const state=MerCore.createAccountStore(profile(),{...profile(),accountLabel:'businessAccount'});
  const store=MerStateStore.createStore(state,{referenceDate:'2026-08-22'});
  const snapshot=store.snapshot();
  assert.equal(snapshot.budget,state.accounts.personal.derived.financials);
  assert.equal(snapshot.totals,state.accounts.personal.derived.financials.monthly);
  assert.equal(snapshot.budget.safeRemaining,500);
  assert.equal(snapshot.totals.net,500);
});

test('evaluation cycle 2: every UI consumer reads live engine values instead of static profile income', () => {
  const root=path.resolve(__dirname,'..');
  const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  const store=fs.readFileSync(path.join(root,'state-store.js'),'utf8');
  assert.match(store,/MerCore\.FinancialEngine\.calculate/);
  assert.doesNotMatch(app,/function getPlan\(\)[^\n]+calculateBudget/);
  assert.match(app,/getPlan\(\)\.safeRemaining/);
  assert.match(app,/plan\.monthlyIncome/);
  assert.match(app,/plan\.safePercent/);
  assert.match(app,/fullRemainingValue[^\n]+plan\.safeRemaining/);
  assert.match(app,/derivedTotals\(insightsTimeframe\)/);
  assert.doesNotMatch(app,/calcIncome'\)\.textContent\s*=\s*currency\(state\.income/);
});
