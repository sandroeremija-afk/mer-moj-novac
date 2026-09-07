'use strict';
const assert=require('node:assert/strict');
const D=require('../discovery-core.js');
const E=require('../enterprise-core.js');
const profile={profileId:'personal',financialOpeningBalance:3000,categories:[{id:'food',name:'Hrana'},{id:'travel',name:'Prijevoz'}],incomeCategories:[{id:'salary',name:'Plaća'}],goalBuckets:[{id:'goal',name:'Fond za hitne slučajeve',current:0}],recurring:[],transactions:[
  {id:'a',name:'Konzum',rawDescription:'Kupnja namirnica',amount:20,date:'2026-09-01',category:'food'},
  {id:'b',name:'Konzum',amount:30,date:'2026-09-20',category:'food',status:'scheduled'},
  {id:'secret',name:'Konzum business secret',amount:90,date:'2026-09-02',profileId:'business'},
  {id:'c',name:'A1',amount:45,date:'2026-09-12',status:'scheduled'}
]};
assert.equal(D.monthGenitive('2026-09-07'),'rujna');
assert.deepEqual(Array.from({length:12},(_,i)=>D.monthGenitive(`2026-${String(i+1).padStart(2,'0')}-01`)),['siječnja','veljače','ožujka','travnja','svibnja','lipnja','srpnja','kolovoza','rujna','listopada','studenoga','prosinca']);
assert.equal(D.monthGenitive('2026-09-07','en'),'September');
assert.deepEqual(D.search(profile,'personal','Konzum').map(row=>row.id),['b','a']);
assert.deepEqual(D.search(profile,'business','Konzum'),[]);
assert.deepEqual(D.search(profile,'personal','Hrana').map(row=>row.id),['food','b','a']);
assert.equal(D.search(profile,'personal','hitne slucajeve')[0].kind,'goal');
assert.equal(D.search(profile,'personal','kupnja namirnica')[0].id,'a');
assert.equal(D.search(profile,'personal','A1')[0].id,'c');
assert.deepEqual(D.search(null,'personal','Konzum'),[]);
const before=JSON.stringify(profile),base=E.forecastCashFlow(profile,'2026-09-07',{profileId:'personal'}).safeToSpendCents;
profile.transactions.push({id:'salary',name:'Plaća',amount:1500,type:'income',date:'2026-09-18'});
const model=D.forecastChart(profile,'2026-09-07',{profileId:'personal',currency:'EUR'});
assert.equal(model.forecast.safeToSpendCents,base);
assert.equal(model.series.at(-1).balanceCents,base+150000);
assert.equal(model.events.filter(event=>event.kind==='income').length,1);
assert.ok(model.ticks.length>=3&&model.ticks.length<=7);
assert.ok(model.series.every(point=>point.balanceCents>=model.minimum&&point.balanceCents<=model.maximum));
profile.transactions.pop();assert.equal(JSON.stringify(profile),before);
// Monthly income prediction deduplicates a scheduled salary and ignores foreign profiles/currencies.
profile.transactions.push(...['07','08','09'].map(month=>({id:'pay'+month,name:'Plaća',date:`2026-${month}-01`,type:'income',amount:1000,currency:'EUR'})));
profile.transactions.push({id:'payfuture',name:'Plaća',date:'2026-10-01',type:'income',amount:1000,currency:'EUR'});
assert.equal(D.projectedIncome(profile,'2026-09-07',{profileId:'personal',currency:'EUR'}).length,1);
const snapshot=JSON.stringify(profile);D.forecastChart(profile,'2026-09-07',{profileId:'personal'});assert.equal(JSON.stringify(profile),snapshot);
for(const amount of [0,0.01,1e9,-1e9]){
  const data={...profile,transactions:[{id:'stress',name:'Stress',amount,date:'2026-09-08',type:'expense'}]};
  const chart=D.forecastChart(data,'2026-09-07',{profileId:'personal'});
  assert.ok(chart.ticks.every(Number.isFinite));assert.ok(chart.range>0);
}
process.stdout.write('Global discovery: declensions, full-text deep-link entities, scheduled income, isolation and chart bounds passed.\n');
