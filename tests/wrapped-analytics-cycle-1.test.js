'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../engagement-core.js');
const options={profileId:'personal',currency:'EUR',referenceDate:'2026-10-01',month:'2026-09'};
const profile=()=>({profileId:'personal',currency:'EUR',goalBuckets:[{id:'reserve'}],transactions:[
  {id:'salary',date:'2026-09-01',amount:1000.03,type:'income'},
  {id:'food',date:'2026-09-03',amount:150.02,type:'expense',category:'food'},
  {id:'transport',date:'2026-09-04',amount:49.99,type:'expense',category:'transport'},
  {id:'prior',date:'2026-08-04',amount:400.02,type:'expense',category:'food'}
],savingsEntries:[
  {id:'deposit',date:'2026-09-04',amount:200.01,goalId:'reserve'},
  {id:'roundup',date:'2026-09-04',amount:.99,goalId:'reserve',sourceType:'roundup'},
  {id:'withdrawal',date:'2026-09-05',amount:-50.02,goalId:'reserve'}
]});

test('wrapped analytics use exact cent totals, separate deposits and withdrawals, and compare calendar months',()=>{
  const result=E.monthlyAnalytics(profile(),options);
  assert.equal(result.current.incomeCents,100003);assert.equal(result.current.expenseCents,20001);
  assert.equal(result.current.savedCents,15098);assert.equal(result.current.depositsCents,20100);assert.equal(result.current.withdrawalsCents,5002);
  assert.equal(result.current.depositsCents-result.current.withdrawalsCents,result.current.savedCents);
  assert.equal(result.current.roundupCents,99,'roundups remain a subset, not additional deposits');
  assert.equal(result.previous.month,'2026-08');assert.equal(result.expenseChangeCents,-20001);assert.equal(result.expenseChangePercent,-50);
  assert.equal(result.dayCount,30);assert.equal(result.dailyExpenseCents,667);assert.equal(result.retainedIncomePercent,80002/100003*100);
  assert.deepEqual(result.current.categories,[{id:'food',amountCents:15002},{id:'transport',amountCents:4999}]);
});

test('wrapped analytics do not invent a baseline or divide by zero',()=>{
  const p=profile();p.transactions=p.transactions.filter(row=>row.id!=='prior');
  let result=E.monthlyAnalytics(p,options);assert.equal(result.expenseChangeCents,null);assert.equal(result.expenseChangePercent,null);
  p.transactions.push({id:'prior-income',date:'2026-08-01',type:'income',amount:1000});
  result=E.monthlyAnalytics(p,options);assert.equal(result.expenseChangeCents,20001);assert.equal(result.expenseChangePercent,null);
  p.transactions=[];p.savingsEntries=[];result=E.monthlyAnalytics(p,options);
  assert.equal(result.retainedIncomePercent,null);assert.equal(result.expenseChangeCents,null);assert.equal(result.current.hasData,false);
});

test('wrapped analytics retain refunds, leap-year day counts and cross-profile exclusions',()=>{
  const p=profile();p.transactions.push(
    {id:'refund',date:'2026-09-06',amount:-10.01,type:'expense',category:'food'},
    {id:'foreign',date:'2026-09-06',amount:9000,type:'expense',category:'food',profileId:'business'},
    {id:'foreign-currency',date:'2026-09-06',amount:9000,type:'expense',category:'food',currency:'USD'},
    {id:'draft',date:'2026-09-06',amount:9000,type:'expense',category:'food',offlineDraft:true},
    {id:'cancelled',date:'2026-09-06',amount:9000,type:'expense',category:'food',status:'cancelled'}
  );
  assert.equal(E.monthlyAnalytics(p,options).current.expenseCents,19000);
  p.transactions=[{id:'leap',date:'2028-02-10',amount:29,type:'expense',category:'food'}];
  const result=E.monthlyAnalytics(p,{...options,month:'2028-02',referenceDate:'2028-03-01'});assert.equal(result.dayCount,29);assert.equal(result.dailyExpenseCents,100);
});

test('month options include history and twelve recent closed months without foreign or pending-only history',()=>{
  const p=profile();p.transactions.push(
    {id:'old',date:'2022-02-12',amount:1,type:'expense'},
    {id:'foreign-old',date:'2021-02-12',amount:1,type:'expense',profileId:'business'},
    {id:'pending-old',date:'2020-02-12',amount:1,type:'expense',status:'pending'}
  );
  const months=E.summaryMonths(p,options);assert.equal(months[0],'2026-09');assert.equal(months.length,13);
  assert.ok(months.includes('2025-10'));assert.ok(months.includes('2022-02'));assert.ok(!months.includes('2026-10'));
  assert.ok(!months.includes('2021-02'));assert.ok(!months.includes('2020-02'));
});
