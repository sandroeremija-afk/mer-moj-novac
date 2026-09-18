'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Insights = require('../insight-core.js');
const Core = require('../core.js');
const Store = require('../state-store.js');

const entry=(id,date,amount,type='income',category='salary',extra={})=>({id,date,amount,type,category,...extra});
const profile=transactions=>({accountLabel:'personalAccount',transactions,categories:[{id:'food',name:'Hrana'},{id:'utilities',name:'Režije'}],incomeCategories:[{id:'salary',name:'Plaća'},{id:'gift',name:'Dar'}]});

test('monthly comparison covers matching elapsed days and category-level prior-only declines',()=>{
  const state=profile([
    entry('old-salary','2026-08-01',1000),entry('old-gift','2026-08-18',100,'income','gift'),entry('after-cutoff','2026-08-19',5000),
    entry('salary','2026-09-01',1500),entry('future','2026-09-19',7000),entry('bill','2026-09-05',200,'expense','utilities')
  ]);
  const report=Insights.metricBreakdown(state,'income','monthly','2026-09-18');
  assert.equal(report.current,1500);assert.equal(report.previous,1100);assert.equal(report.change,400);assert.equal(report.growth,36.36);
  assert.equal(report.currentStart,'2026-09-01');assert.equal(report.currentEnd,'2026-09-18');
  assert.equal(report.previousStart,'2026-08-01');assert.equal(report.previousEnd,'2026-08-18');
  assert.equal(report.count,1);assert.equal(report.previousCount,2);
  assert.deepEqual(report.categories.map(row=>[row.label,row.current,row.previous,row.change,row.growth]),[['Plaća',1500,1000,500,50],['Dar',0,100,-100,-100]]);
  assert.equal(report.categories.reduce((sum,row)=>sum+row.current,0),report.current);
  assert.equal(report.categories.reduce((sum,row)=>sum+row.previous,0),report.previous);
});

test('expense comparisons use expense category names rather than income metadata',()=>{
  const state=profile([entry('old','2026-08-03',150,'expense','food'),entry('new','2026-09-03',100,'expense','food'),entry('salary','2026-09-03',1000)]);
  state.incomeCategories.push({id:'food',name:'Not an expense label'});
  const report=Insights.metricBreakdown(state,'expenses','monthly','2026-09-18');
  assert.equal(report.current,100);assert.equal(report.previous,150);assert.equal(report.change,-50);assert.equal(report.growth,-33.33);
  assert.equal(report.categories[0].label,'Hrana');assert.equal(report.categories[0].share,100);
});

test('daily comparison handles month/year boundaries without DST-hour arithmetic',()=>{
  const state=profile([entry('a','2025-12-30',500),entry('b','2025-12-31',25),entry('c','2026-01-01',50)]);
  const report=Insights.metricBreakdown(state,'income','daily','2026-01-01');
  assert.equal(report.current,50);assert.equal(report.previous,25);assert.equal(report.growth,100);
  assert.equal(report.previousStart,'2025-12-31');assert.equal(report.previousEnd,'2025-12-31');
  const daylight=Insights.metricBreakdown(profile([]),'income','daily','2026-03-30');
  assert.equal(daylight.previousStart,'2026-03-29');
});

test('monthly comparisons clamp short prior months and carry January into the previous year',()=>{
  for(const [reference,start,end] of [
    ['2026-03-31','2026-02-01','2026-02-28'],
    ['2024-03-31','2024-02-01','2024-02-29'],
    ['2026-01-18','2025-12-01','2025-12-18'],
    ['2026-05-01','2026-04-01','2026-04-01']
  ]){
    const report=Insights.metricBreakdown(profile([entry('previous',end,20),entry('now',reference,30)]),'income','monthly',reference);
    assert.equal(report.previousStart,start);assert.equal(report.previousEnd,end);assert.equal(report.previous,20);assert.equal(report.current,30);
  }
});

test('year-to-date comparisons end on the comparable prior-year calendar date with leap-day clamping',()=>{
  const state=profile([entry('prior','2023-02-28',100),entry('prior-later','2023-03-01',5000),entry('now','2024-02-29',200)]);
  for(const timeframe of ['ytd','yearly','this-year']){
    const report=Insights.metricBreakdown(state,'income',timeframe,'2024-02-29');
    assert.equal(report.timeframe,'ytd');assert.equal(report.previousStart,'2023-01-01');assert.equal(report.previousEnd,'2023-02-28');
    assert.equal(report.previous,100);assert.equal(report.current,200);assert.equal(report.growth,100);
  }
});

test('all-time reports have no invented previous period or growth and retain category totals',()=>{
  const report=Insights.metricBreakdown(profile([entry('old','2020-06-25',100),entry('new','2026-09-18',50,'income','gift')]),'income','all','2026-09-18');
  assert.equal(report.current,150);assert.equal(report.currentStart,'2020-06-01');assert.equal(report.currentEnd,'2026-09-18');
  for(const key of ['previous','change','growth','previousStart','previousEnd'])assert.equal(report[key],null);
  assert.equal(report.previousCount,0);
  for(const row of report.categories){assert.equal(row.previous,null);assert.equal(row.change,null);assert.equal(row.growth,null);}
});

test('booked date, profile, draft, invalid amount and non-transaction filters apply to both periods',()=>{
  const state=profile([
    entry('valid-prior','2026-08-01',10),entry('valid-now','2026-09-01',20),
    entry('foreign-prior','2026-08-01',9000,'income','salary',{profileId:'business'}),entry('foreign-now','2026-09-01',9000,'income','salary',{profileId:'business'}),
    entry('future','2026-09-19',5000),entry('draft','2026-09-01',6000,'income','salary',{status:'draft'}),entry('offline','2026-08-01',7000,'income','salary',{offlineDraft:true}),
    entry('transfer','2026-09-01',3000,'transfer'),entry('savings','2026-08-01',3000,'savings'),entry('nan','2026-09-01',NaN),entry('invalid','2026-02-30',20),
    entry('arrived','2026-09-18',5,'income','salary',{status:'scheduled'})
  ]);
  const report=Insights.metricBreakdown(state,'income','monthly','2026-09-18',{profileId:'personal'});
  assert.equal(report.current,25);assert.equal(report.previous,10);assert.equal(report.count,2);assert.equal(report.previousCount,1);
  state.profileId='personal';
  const denied=Insights.metricBreakdown(state,'income','monthly','2026-09-18',{profileId:'business'});
  assert.equal(denied.valid,false);assert.equal(denied.error,'profile-mismatch');assert.deepEqual(denied.categories,[]);assert.equal(denied.current,0);
});

test('category labels remain profile-isolated and missing categories have deterministic fallbacks',()=>{
  const state=profile([entry('foreign-label','2026-09-18',10,'income','private'),entry('uncategorized','2026-09-18',5,'expense',undefined)]);
  state.incomeCategories.push({id:'private',name:'BUSINESS PRIVATE LABEL',profileId:'business'});
  const income=Insights.metricBreakdown(state,'income','monthly','2026-09-18',{profileId:'personal'});
  assert.equal(income.categories[0].label,'private');assert.doesNotMatch(JSON.stringify(income),/BUSINESS PRIVATE/);
  state.transactions[1].category=undefined;
  const expenses=Insights.metricBreakdown(state,'expenses','monthly','2026-09-18');assert.equal(expenses.categories[0].categoryId,'other');
});

test('decimal sums and signed corrections preserve cents and finite percent values',()=>{
  const state=profile([
    entry('p1','2026-08-01',0.1,'expense','food'),entry('p2','2026-08-01',0.2,'expense','food'),
    entry('c1','2026-09-01',0.1,'expense','food'),entry('c2','2026-09-01',0.2,'expense','food'),entry('c3','2026-09-01',0.3,'expense','food'),
    entry('refund','2026-09-01',-0.2,'expense','food')
  ]);
  const report=Insights.metricBreakdown(state,'expenses','monthly','2026-09-18');
  assert.equal(report.current,0.4);assert.equal(report.previous,0.3);assert.equal(report.change,0.1);assert.equal(report.growth,33.33);assert.equal(report.hasCorrections,true);
  assert.equal(report.categories[0].amount,0.4);assert.equal(report.categories[0].change,0.1);
  const negative=Insights.metricBreakdown(profile([entry('a','2026-08-01',-100,'expense','food'),entry('b','2026-09-01',-50,'expense','food')]),'expenses','monthly','2026-09-18');
  assert.equal(negative.growth,50);assert.equal(negative.categories[0].share,0);assert.equal(negative.shareDisclosure,'positive-category-shares-after-corrections');
});

test('new activity against zero prior value is unknown growth rather than Infinity',()=>{
  const report=Insights.metricBreakdown(profile([entry('new','2026-09-18',20)]),'income','monthly','2026-09-18');
  assert.equal(report.previous,0);assert.equal(report.change,20);assert.equal(report.growth,null);assert.equal(report.categories[0].growth,null);
  assert.equal(JSON.stringify(report).includes('Infinity'),false);
});

test('net contribution details distinguish income and expense even when category IDs collide',()=>{
  const report=Insights.metricBreakdown(profile([entry('i','2026-09-18',100,'income','same'),entry('e','2026-09-18',30,'expense','same'),entry('old','2026-08-18',50)]),'net','monthly','2026-09-18');
  assert.equal(report.current,70);assert.equal(report.previous,50);assert.equal(report.change,20);assert.equal(report.growth,40);
  assert.equal(report.categories.filter(row=>row.categoryId==='same').length,2);
  assert.equal(report.categories.find(row=>row.type==='expense').amount,-30);
});

test('time-zone references, invalid inputs and safe integer overflow are handled explicitly',()=>{
  const state=profile([entry('now','2026-09-18',30),entry('prior','2026-09-17',10)]);
  const zoned=Insights.metricBreakdown(state,'income','daily',new Date('2026-09-17T23:30:00Z'),{timezone:'Europe/Zagreb'});
  assert.equal(zoned.currentEnd,'2026-09-18');assert.equal(zoned.current,30);assert.equal(zoned.previous,10);
  for(const date of ['not-a-date','2026-02-30',new Date(NaN)])assert.equal(Insights.metricBreakdown(state,'income','monthly',date).valid,false);
  assert.equal(Insights.metricBreakdown(state,'income','daily',new Date(),{timezone:'not/a/timezone'}).valid,false);
  const tooMuch=profile(Array.from({length:3},(_,i)=>entry(`large-${i}`,'2026-09-18',40000000000000)));
  const invalid=Insights.metricBreakdown(tooMuch,'income','monthly','2026-09-18');assert.equal(invalid.valid,false);assert.equal(invalid.error,'amount-overflow');
  assert.equal(Insights.metricBreakdown(undefined,'income','monthly','2026-09-18').current,0);
});

test('computation is immutable and re-evaluates profile changes from the central reactive store',()=>{
  const personal=profile([entry('p-old','2026-08-01',100),entry('p','2026-09-01',200)]),business={...profile([entry('b','2026-09-01',9000)]),accountLabel:'businessAccount'};
  const original=JSON.stringify(personal);Insights.metricBreakdown(personal,'income','monthly','2026-09-18');assert.equal(JSON.stringify(personal),original);
  const state={accounts:{personal,business},activeAccount:'personal',settings:{currency:'EUR'}};
  const store=Store.createStore(state,{referenceDate:'2026-09-18'});
  const render=()=>Insights.metricBreakdown(state.accounts[state.activeAccount],'income','monthly','2026-09-18',{profileId:state.activeAccount});
  assert.equal(render().current,200);
  store.update('add-bonus',(_draft,current)=>current.transactions.push(entry('bonus','2026-09-18',25.5)));
  assert.equal(render().current,225.5);assert.equal(render().change,125.5);
  store.switchAccount('business');assert.equal(render().current,9000);assert.equal(render().previous,0);
  store.switchAccount('personal');assert.equal(render().current,225.5);
  assert.equal(render().current,Core.transactionTotals(personal.transactions,'monthly','2026-09-18').income);
});
