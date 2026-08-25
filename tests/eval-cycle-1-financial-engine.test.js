const test = require('node:test');
const assert = require('node:assert/strict');
const MerCore = require('../core.js');
const MerStateStore = require('../state-store.js');

function profile(label = 'personalAccount') {
  return {
    accountLabel:label,
    income:1000,
    bills:0,
    savingsTarget:0,
    guard:0,
    availableBalance:500,
    categories:[{ id:'food', limit:1000, spent:0 }],
    incomeCategories:[{ id:'salary' }, { id:'otherIncome' }],
    transactions:[
      { id:'salary', type:'income', amount:1000, category:'salary', date:'2026-08-01T08:00:00' },
      { id:'expense', type:'expense', amount:500, category:'food', date:'2026-08-10T08:00:00' }
    ],
    goalBuckets:[{ id:'reserve', target:5000, current:0, primary:true }],
    savingsEntries:[],
    recurring:[]
  };
}

function setup() {
  const state=MerCore.createAccountStore(profile(),profile('businessAccount'));
  const store=MerStateStore.createStore(state,{referenceDate:'2026-08-22'});
  return {state,store,personal:state.accounts.personal};
}

test('evaluation cycle 1: 1000 income minus 500 expenses produces 500 safe to spend', () => {
  const {personal}=setup();
  const financials=personal.derived.financials;
  assert.equal(financials.monthlyIncome,1000);
  assert.equal(financials.monthlyExpenses,500);
  assert.equal(financials.cashFlowNet,500);
  assert.equal(financials.monthlyBudget,1000);
  assert.equal(financials.safeToSpend,500);
  assert.equal(financials.safeRemaining,500);
  assert.equal(financials.days,10);
  assert.equal(financials.safeDaily,50);
});

test('evaluation cycle 1: uncategorized 200 income raises safe to spend from 500 to 700 immediately', () => {
  const {store,personal}=setup();
  const beforeBalance=personal.availableBalance;
  personal.transactions.push({ id:'bonus', type:'income', amount:200, name:'Bonus', date:'2026-08-22T12:00:00' });
  store.commit('income-add');
  const financials=personal.derived.financials;
  assert.equal(financials.monthlyIncome,1200);
  assert.equal(financials.incomeAdjustment,200);
  assert.equal(financials.monthlyBudget,1200);
  assert.equal(financials.safeToSpend,700);
  assert.equal(financials.safeDaily,70);
  assert.equal(personal.availableBalance,beforeBalance+200);
});

test('evaluation cycle 1: strict commitments stay protected while every extra euro remains spendable', () => {
  const strict=profile();
  strict.bills=100;
  strict.savingsTarget=50;
  strict.guard=.1;
  const baseline=MerCore.FinancialEngine.calculate(strict,'2026-08-22',{openingBalance:0,savingsBalance:0});
  assert.equal(baseline.protectedCommitments,250);
  assert.equal(baseline.spendablePool,750);
  assert.equal(baseline.safeToSpend,250);
  strict.transactions.push({ id:'side-hustle', type:'income', amount:200, date:'2026-08-22T12:00:00' });
  const updated=MerCore.FinancialEngine.calculate(strict,'2026-08-22',{openingBalance:0,savingsBalance:0});
  assert.equal(updated.spendablePool,950);
  assert.equal(updated.safeToSpend,450);
  assert.equal(updated.safeToSpend-baseline.safeToSpend,200);
});

test('evaluation cycle 1: exact days remaining are derived from the real calendar including leap years', () => {
  const august=MerCore.FinancialEngine.calculate(profile(),'2026-08-22',{openingBalance:0,savingsBalance:0});
  const leapProfile=profile();
  leapProfile.transactions=leapProfile.transactions.map(transaction=>({...transaction,date:transaction.date.replace('2026-08','2028-02')}));
  const leap=MerCore.FinancialEngine.calculate(leapProfile,'2028-02-20',{openingBalance:0,savingsBalance:0});
  assert.equal(august.days,10);
  assert.equal(leap.days,10);
  assert.equal(leap.safeDaily,50);
});
