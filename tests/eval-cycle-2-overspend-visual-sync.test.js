const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const MerCore = require('../core.js');
const MerStateStore = require('../state-store.js');

function overspentProfile() {
  return {
    income:100,
    bills:0,
    savingsTarget:0,
    guard:0,
    availableBalance:100,
    categories:[{id:'food',limit:100,spent:0},{id:'other',limit:50,spent:0}],
    transactions:[
      {id:'income',type:'income',amount:1000,category:'salary',date:'2026-08-20T08:00:00'},
      {id:'expense',type:'expense',amount:5000,category:'food',date:'2026-08-20T09:00:00'}
    ],
    goalBuckets:[{id:'reserve',target:1000,current:0,primary:true}],
    savingsEntries:[]
  };
}

test('evaluation cycle 2: extreme overspending keeps all derived values finite and synchronized', () => {
  const profile=overspentProfile();
  MerStateStore.recalculateProfile(profile,'2026-08-20');
  assert.equal(profile.derived.monthly.income,1000);
  assert.equal(profile.derived.monthly.expenses,5000);
  assert.equal(profile.derived.monthly.net,-4000);
  assert.equal(profile.derived.monthly.savingsRate,-400);
  assert.equal(profile.derived.categoryMetrics.food.percent,5000);
  assert.equal(profile.derived.categoryMetrics.food.level,'red');
  assert.equal(profile.derived.categoryMetrics.food.warning,'exceeded');
  assert.ok(Object.values(profile.derived.monthly).filter(value=>typeof value==='number').every(Number.isFinite));
});

test('evaluation cycle 2: donut and cumulative chart ratios remain bounded after a 50x overage', () => {
  const profile=overspentProfile();
  MerStateStore.recalculateProfile(profile,'2026-08-20');
  assert.equal(profile.derived.categorySegments.length,1);
  assert.equal(profile.derived.categorySegments[0].start,0);
  assert.equal(profile.derived.categorySegments[0].end,100);
  assert.equal(profile.derived.spendingSeries[19].actual,5000);
  const domain=MerCore.chartDomain(profile.derived.spendingSeries.flatMap(item=>[item.actual||0,item.planned]));
  assert.ok(MerCore.scaleChartValue(5000,domain,165)>0);
  assert.ok(MerCore.scaleChartValue(5000,domain,165)<=165);
});

test('evaluation cycle 2: UI caps visual progress widths while retaining the true overage percentage', () => {
  const app=fs.readFileSync(path.resolve(__dirname,'..','app.js'),'utf8');
  assert.match(app,/style="width:\$\{Math\.min\(100,pct\)\}%"/);
  assert.match(app,/budgetProgress'\)\.style\.width = `\$\{Math\.min\(100, percent\)\}%`/);
  assert.match(app,/availableBalance'\)\.classList\.toggle\('negative-value',state\.availableBalance<0\)/);
  assert.match(app,/MerCore\.chartDomain/);
  assert.match(app,/MerCore\.proportionalSegments/);
});
