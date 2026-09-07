'use strict';
const assert=require('node:assert/strict');
const P=require('../planning-core.js');
const E=require('../enterprise-core.js');
const Store=require('../state-store.js');
const input={netWorth:1000,monthlyContribution:100,monthlySpending:100,annualReturn:0,withdrawalRate:10,inflation:0};
const base={referenceDate:'2024-01-31',timezone:'Europe/Zagreb'};
const profile=id=>({profileId:id,financialOpeningBalance:0,transactions:[],goalBuckets:[],savingsEntries:[],categories:[],enterprise:{}});
{
  const before=JSON.stringify(input),result=P.calculateFire(input,base);
  assert.equal(result.valid,true);assert.equal(result.targetCents,1200000);assert.equal(result.reachedMonth,110);
  assert.equal(result.estimatedDate,'2033-03-31');assert.equal(result.savingRatePercent,50);
  assert.equal(JSON.stringify(input),before,'simulator is non-mutating');
  assert.equal(P.calculateFire({...input,netWorth:12000},base).reachedMonth,0);
  assert.equal(P.calculateFire({...input,monthlyContribution:0},base).estimatedDate,null);
  assert.equal(P.calculateFire({...input,annualReturn:5,inflation:5},base).reachedMonth,110,'equal return and inflation gives zero real growth');
  assert.ok(P.calculateFire({...input,annualReturn:5,inflation:0},base).reachedMonth<110);
  assert.ok(P.calculateFire({...input,annualReturn:0,inflation:3},base).reachedMonth>110);
  for(const [key,value]of [['monthlySpending',0],['withdrawalRate',0],['annualReturn',Infinity],['netWorth',NaN],['inflation',-100],['monthlyContribution',-1],['monthlyContribution','']])assert.equal(P.calculateFire({...input,[key]:value},base).valid,false,`${key} invalid`);
  assert.equal(P.calculateFire(input,{referenceDate:'2024-02-30'}).valid,false);
  assert.equal(P.validateFire(null).valid,false);
  assert.equal(P.validateFire([]).valid,false);
  assert.equal(P.calculateFire(null,base).valid,false);
  const extreme=P.calculateFire({...input,netWorth:1e9,annualReturn:30,inflation:-5},base);
  assert.ok(extreme.series.every(point=>Number.isSafeInteger(point.balanceCents)));
  assert.ok(extreme.downside.reachedMonth===0);
}
{
  assert.equal(P.today('Europe/Zagreb',new Date('2026-09-07T22:30:00Z')),'2026-09-08');
  assert.equal(P.today('America/New_York',new Date('2026-09-07T22:30:00Z')),'2026-09-07');
  assert.equal(P.addMonthsClamped('2024-01-31',1),'2024-02-29');
  assert.equal(P.nextRenewal({cadence:'annual',anchorDate:'2024-02-29'},'2025-01-01'),'2025-02-28');
  assert.equal(P.nextRenewal({cadence:'annual',anchorDate:'2024-02-29'},'2028-01-01'),'2028-02-29');
  assert.equal(P.nextRenewal({cadence:'monthly',anchorDate:'2024-01-31'},'2024-02-01'),'2024-02-29');
  assert.equal(P.nextRenewal({cadence:'monthly',anchorDate:'2024-01-31'},'2024-03-01'),'2024-03-31');
  assert.equal(P.nextRenewal({cadence:'trial',anchorDate:'2026-09-02'},'2026-09-07'),'2026-09-02','trial does not silently renew');
}
{
  const personal=profile('personal'),business=profile('business');
  let saved=P.saveRenewal(personal,{name:'Adobe',amount:125,currency:'EUR',cadence:'annual',anchorDate:'2026-09-10'},{profileId:'personal'});
  assert.equal(saved.valid,true);
  assert.equal(saved.rule.previousAmount,null);
  assert.equal(P.renewalSchedule(personal,{referenceDate:'2026-09-07'})[0].priceHike,false,'first subscription without a previous price is not a price hike');
  const firstWithNull=profile('personal');P.saveRenewal(firstWithNull,{name:'First',amount:120,currency:'EUR',cadence:'annual',anchorDate:'2026-09-10',previousAmount:null});
  assert.equal(P.renewalSchedule(firstWithNull,{referenceDate:'2026-09-07'})[0].increaseCents,0,'explicit null previous price remains unknown, not zero');
  assert.equal(P.saveRenewal(personal,{name:'ADOBE',amount:125,currency:'EUR',cadence:'annual',anchorDate:'2026-09-11'},{profileId:'personal'}).reason,'duplicate');
  assert.equal(P.saveRenewal(personal,{name:'Wrong',profileId:'business',amount:1,cadence:'annual',anchorDate:'2026-09-10'},{profileId:'personal'}).reason,'profile');
  assert.equal(P.dueReminders(personal,{referenceDate:'2026-09-06'}).length,0);
  const due=P.dueReminders(personal,{referenceDate:'2026-09-07'});assert.equal(due.length,1);assert.equal(due[0].daysUntil,3);
  assert.equal(P.dueReminders(business,{referenceDate:'2026-09-07'}).length,0);
  assert.equal(P.dismissReminder(personal,due[0].reminderKey,{referenceDate:'2026-09-07'}),true);
  assert.equal(P.dueReminders(personal,{referenceDate:'2026-09-07'}).length,0);
  assert.equal(P.dueReminders(personal,{referenceDate:'2027-09-07'}).length,1,'review dismissal is per occurrence');
  saved=P.saveRenewal(personal,{...saved.rule,amount:150,previousAmount:125},{profileId:'personal'});
  assert.equal(P.renewalSchedule(personal,{referenceDate:'2026-09-07'})[0].increaseCents,2500);
  assert.equal(P.renewalSchedule(personal,{referenceDate:'2026-09-07'})[0].priceHike,true);
  P.saveRenewal(personal,{name:'Trial',amount:0,cadence:'trial',anchorDate:'2026-09-05'},{profileId:'personal'});
  assert.ok(P.dueReminders(personal,{referenceDate:'2026-09-07'}).some(rule=>rule.expired));
  assert.equal(P.renewalSchedule(personal,{profileId:'business',referenceDate:'2026-09-07'}).length,0);
}
{
  const personal=profile('personal');
  personal.transactions=[{id:'a',profileId:'personal',name:'Annual service',amount:100,type:'expense',date:'2025-09-01'}, {id:'b',profileId:'personal',name:'Annual service',amount:120,type:'expense',date:'2026-09-01'}, {id:'foreign',profileId:'business',name:'Secret business service',amount:10,type:'expense',date:'2026-09-01'}];
  const suggestions=P.detectAnnualRenewals(personal,{referenceDate:'2026-09-07'});
  assert.equal(suggestions.length,1);assert.equal(suggestions[0].previousAmount,100);
  P.saveRenewal(personal,suggestions[0]);
  assert.equal(P.detectAnnualRenewals(personal,{referenceDate:'2026-09-07'}).length,0);
  personal.enterprise.renewals=[];personal.transactions[1].offlineDraft=true;
  assert.equal(P.detectAnnualRenewals(personal,{referenceDate:'2026-09-07'}).length,0);
  assert.equal(P.detectAnnualRenewals(personal,{referenceDate:'broken-date'}).length,0);
}
{
  const personal=profile('personal'),business=profile('business');
  business.enterprise.taxVault={enabled:true,currency:'EUR',rate:25};
  const store=Store.createStore({activeAccount:'business',settings:{currency:'EUR'},accounts:{personal,business}},{referenceDate:'2026-09-07'});
  store.update('taxable-receipt',(_,p)=>p.transactions.push({id:'invoice',profileId:'business',date:'2026-09-07',amount:1250,type:'income',currency:'EUR',isB2B:true}));
  assert.equal(E.reconcileAutomations(business,'2026-09-07',{profileId:'business'}).taxReservedCents,25000);
  assert.equal(store.snapshot().profile.availableBalance,1000);
  store.update('receipt-edit',(_,p)=>{p.transactions[0].amount=2500;});
  assert.equal(E.reconcileAutomations(business,'2026-09-07',{profileId:'business'}).taxReservedCents,50000);
  store.switchAccount('personal');assert.equal(store.snapshot().profile.availableBalance,0);
}
process.stdout.write('Planning cycle 1: FIRE assumptions, inflation, date edges, renewal alerts, profile isolation and B2B tax reactivity passed.\n');
