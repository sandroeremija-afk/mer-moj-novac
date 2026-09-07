'use strict';
const assert = require('node:assert/strict');
const E = require('../enterprise-core.js');
const Core = require('../core.js');
const Store = require('../state-store.js');
const seed = id => ({profileId:id,financialOpeningBalance:0,transactions:[],categories:[],savingsEntries:[],goalBuckets:[{id:`${id}-goal`,name:'Rezerva',current:0,target:5000}],savingsTarget:100,enterprise:{paydayRules:[]}});
const make = (id,amount,type='income',currency='EUR') => ({id,name:'Unos',date:'2026-09-07',amount,type,currency});

{
  const personal=seed('personal'),business=seed('business');
  personal.enterprise.paydayRules=[{id:'p',minimumAmount:1000,currency:'EUR',allocations:[{goalId:'personal-goal',percent:10}]}];
  business.enterprise.taxVault={enabled:true,currency:'EUR',rate:25};
  const s=Store.createStore({activeAccount:'personal',settings:{currency:'EUR'},accounts:{personal,business}},{referenceDate:'2026-09-07'});
  s.update('offline-income',(_,p)=>p.transactions.push({...make('draft-income',2000),offlineDraft:true,status:'draft'}));
  assert.equal(s.snapshot().profile.availableBalance,0);
  assert.equal(s.snapshot().profile.savingsBalance,0);
  assert.equal(E.forecastCashFlow(personal,'2026-09-07').availableCents,0);
  assert.equal(E.reconcileAutomations(personal,'2026-09-07').allocations,0);
  s.update('confirm-draft',(_,p)=>{delete p.transactions[0].offlineDraft;p.transactions[0].status='posted';Core.updateTransactionSchedule(p.transactions[0],'2026-09-07');});
  assert.equal(s.snapshot().profile.availableBalance,1800);
  assert.equal(s.snapshot().profile.savingsBalance,200);
  s.commit('repeat-confirm');
  assert.equal(s.snapshot().profile.savingsBalance,200,'repeated posting does not duplicate virtual deposit');
  s.update('draft-expense',(_,p)=>p.transactions.push({...make('draft-expense',500,'expense'),offlineDraft:true,status:'draft'}));
  assert.equal(E.forecastCashFlow(personal,'2026-09-07').availableCents,180000);
  assert.equal(E.forecastCashFlow(personal,'2026-09-07').predictedBillsCents,0);
  s.update('delete-draft',(_,p)=>{p.transactions=p.transactions.filter(tx=>tx.id!=='draft-expense');});
  assert.equal(s.snapshot().profile.availableBalance,1800);
  s.switchAccount('business');
  s.update('b2b-draft',(_,p)=>p.transactions.push({...make('b2b',1250),isB2B:true,offlineDraft:true,status:'draft'}));
  assert.equal(E.reconcileAutomations(business,'2026-09-07').taxReservedCents,0);
  s.update('confirm-b2b',(_,p)=>{delete p.transactions[0].offlineDraft;p.transactions[0].status='posted';});
  assert.equal(s.snapshot().profile.availableBalance,1000);
  assert.equal(E.reconcileAutomations(business,'2026-09-07').taxReservedCents,25000);
  s.switchAccount('personal');assert.equal(s.snapshot().profile.availableBalance,1800);
}
{
  const personal=seed('personal');
  personal.transactions=[make('eur',2000),make('usd',4000,'income','USD')];
  personal.enterprise.paydayRules=[{id:'eur-rule',minimumAmount:1000,allocations:[{goalId:'personal-goal',percent:10}]}];
  E.reconcileAutomations(personal,'2026-09-07',{currency:'EUR'});
  assert.equal(personal.enterprise.paydayRules[0].currency,'EUR');
  assert.equal(personal.goalBuckets[0].current,200);
  assert.equal(E.reconcileAutomations(personal,'2026-09-07',{currency:'USD'}).changed,false,'display currency change cannot undo funded EUR allocation');
  assert.equal(personal.goalBuckets[0].current,200);
  personal.goalBuckets.push({id:'usd-goal',name:'USD fond',current:0,target:5000});
  personal.enterprise.paydayRules.push({id:'usd-rule',currency:'USD',minimumAmount:1000,allocations:[{goalId:'usd-goal',percent:15}]});
  E.reconcileAutomations(personal,'2026-09-07',{currency:'USD'});
  assert.equal(personal.goalBuckets[0].current,200);
  assert.equal(personal.goalBuckets[1].current,600);
  assert.equal(personal.savingsEntries.find(entry=>entry.goalId==='usd-goal').currency,'USD');
  const business=seed('business');business.transactions=[{...make('b2b',1250),isB2B:true}];business.enterprise.taxVault={enabled:true};
  E.reconcileAutomations(business,'2026-09-07',{currency:'EUR'});
  assert.equal(business.enterprise.taxVault.currency,'EUR');
  assert.equal(E.reconcileAutomations(business,'2026-09-07',{currency:'USD'}).taxReservedCents,25000);
}
{
  const data=seed('personal');
  data.transactions=[make('e1',10,'expense'),{...make('e2',10,'expense'),date:'2026-08-07'}, {...make('e3',100000,'expense'),date:'2026-09-08',status:'draft'}];
  data.transactions[0].offlineDraft=true;
  assert.equal(E.subscriptionRadar(data,'2026-09-07').length,0,'drafts cannot create subscription evidence');
  assert.equal(E.forecastCashFlow(data,'2026-09-07').bills.length,0,'future drafts do not appear as committed bills');
}
process.stdout.write('Enterprise integration: offline draft posting, profile isolation, currency-bound automations and tax reserves passed.\n');
