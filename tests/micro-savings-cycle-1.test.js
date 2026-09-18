'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const Vaults = require('../vaults-core.js'), Store = require('../state-store.js');
const { saveRule } = require('../micro-savings-ui.js');
const reference = '2026-09-18';
const profile = (id='personal') => ({ profileId:id, transactions:[], savingsEntries:[], categories:[], financialOpeningBalance:1000, goalBuckets:[{ id:`${id}-goal`, name:'Pričuva', current:0, target:1000 }], enterprise:{} });
const purchase = (id, amount, extra={}) => ({ id, amount, profileId:'personal', date:reference, type:'expense', currency:'EUR', paymentMethod:'card', status:'posted', ...extra });

test('EUR 2 thresholds round integer cents correctly, leaving exact multiples untouched', () => {
  assert.equal(Vaults.roundUpAmount(2.01,2),1.99);
  assert.equal(Vaults.roundUpAmount(3.4,2),.6);
  assert.equal(Vaults.roundUpAmount(3.99,2),.01);
  assert.equal(Vaults.roundUpAmount(4,2),0);
  const p=profile(); assert.equal(Vaults.configureRoundUps(p,{enabled:true,increment:2,goalId:'personal-goal'},reference).valid,true);
  p.transactions.push(purchase('new',2.01)); Vaults.reconcileRoundUps(p,reference);
  assert.equal(p.savingsEntries[0].amount,1.99);
  p.transactions[0].amount=3.99; Vaults.reconcileRoundUps(p,reference);
  assert.equal(p.goalBuckets[0].current,.01);
});

test('annual projection uses the eligible historical mean and updates frequency without funding anything', () => {
  const p=profile();p.transactions=[purchase('a',2.01),purchase('b',4)];
  const before=JSON.stringify(p), annual=Vaults.roundUpProjection(p,{increment:2,transactionsPerMonth:30},reference);
  assert.equal(annual.sampleCount,2);assert.equal(annual.averageRoundUpCents,99.5);
  assert.equal(annual.annualSavingsCents,35820);assert.equal(annual.monthlyProjection.at(-1).savingsCents,35820);
  assert.equal(Vaults.roundUpProjection(p,{increment:2,transactionsPerMonth:60},reference).annualSavings,716.4);
  assert.equal(Vaults.roundUpProjection(p,{increment:2,transactionsPerMonth:0},reference).annualSavings,0);
  assert.equal(JSON.stringify(p),before);
  p.transactions[0].amount=3.99;
  assert.equal(Vaults.roundUpProjection(p,{increment:2,transactionsPerMonth:30},reference).annualSavings,1.8);
});

test('projection excludes scheduled, cash, transfer, non-EUR, pending, rejected, draft and foreign-profile records', () => {
  const p=profile();p.transactions=[purchase('valid',3.4),
    purchase('future',3.4,{date:'2026-09-19'}),purchase('scheduled',3.4,{scheduled:true}),purchase('status-scheduled',3.4,{status:'scheduled'}),
    purchase('cash',3.4,{paymentMethod:'cash'}),purchase('transfer',3.4,{paymentMethod:'transfer'}),purchase('unmarked',3.4,{paymentMethod:'unknown'}),
    purchase('currency',3.4,{currency:'USD'}),purchase('profile',3.4,{profileId:'business'}),purchase('pending',3.4,{status:'pending'}),
    purchase('cancelled',3.4,{status:'cancelled'}),purchase('rejected',3.4,{status:'rejected'}),purchase('draft',3.4,{offlineDraft:true}),
    purchase('income',3.4,{type:'income'}),purchase('old',3.4,{date:'2026-06-20'}),purchase('invalid',NaN),purchase('negative',-3.4)];
  const result=Vaults.roundUpProjection(p,{increment:1,transactionsPerMonth:10},reference);
  assert.equal(result.sampleCount,1);assert.equal(result.annualSavings,72);
  assert.equal(Vaults.roundUpProjection(p,{},reference,{profileId:'business'}),null);
});

test('projection deduplicates imported bank transactions and recomputes after deletions', () => {
  const p=profile();p.transactions=[purchase('a',3.4,{importHash:'same'}),purchase('retry',3.4,{importHash:'same'}),purchase('b',2.01)];
  assert.equal(Vaults.roundUpProjection(p,{increment:2,transactionsPerMonth:10},reference).sampleCount,2);
  p.transactions=[];
  const fallback=Vaults.roundUpProjection(p,{increment:2,transactionsPerMonth:30},reference);
  assert.equal(fallback.source,'assumption');assert.equal(fallback.averageRoundUpCents,100);assert.equal(fallback.annualSavings,360);
  assert.equal(Vaults.roundUpProjection(p,{increment:5,transactionsPerMonth:30},reference).annualSavings,900);
});

test('latest corrected imports replace older eligible purchases before projection filtering', () => {
  for(const correction of [{status:'cancelled'},{status:'pending'},{date:'2026-12-01'},{currency:'USD'},{paymentMethod:'cash'}]){
    const p=profile();p.transactions=[purchase('old',4.2,{importHash:'reconciled'}),purchase('new',4.2,{importHash:'reconciled',...correction})];
    assert.equal(Vaults.roundUpProjection(p,{},reference).sampleCount,0);
  }
  const p=profile();p.transactions=[purchase('old',4.2,{importHash:'reconciled'}),purchase('new',4.6,{importHash:'reconciled'})];
  assert.equal(Vaults.roundUpProjection(p,{transactionsPerMonth:10},reference).annualSavings,48);
});

test('the direct opt-in mutates the real reactive store and excludes existing history', () => {
  const personal=profile(),business=profile('business');personal.transactions=[purchase('existing',2.01)];
  const store=Store.createStore({activeAccount:'personal',accounts:{personal,business},settings:{currency:'EUR'}},{referenceDate:reference});
  const owner={profileId:'personal',sessionId:'session-one'};
  let currentSession='session-one',authenticated=true,mutations=0;
  const bridge={snapshot:()=>({...store.snapshot(),profileId:store.snapshot().accountId,referenceDate:reference,sessionId:currentSession,authenticated}),mutate:(profileId,reason,action)=>{
    assert.equal(profileId,store.snapshot().accountId);mutations++;store.update(reason,(_draft,p)=>action(p));
  }};
  assert.equal(saveRule(bridge,owner,{enabled:true,increment:2,goalId:'personal-goal'}),true);
  assert.equal(personal.enterprise.roundUps.enabled,true);assert.equal(personal.enterprise.roundUps.increment,2);
  assert.equal(personal.savingsEntries.length,0);
  store.update('new-card',(_draft,p)=>p.transactions.push(purchase('new',2.01)));
  assert.equal(personal.savingsBalance,1.99);assert.equal(business.savingsBalance,0);
  assert.equal(saveRule(bridge,owner,{enabled:false,increment:2,goalId:'personal-goal'}),true);
  store.update('paused-card',(_draft,p)=>p.transactions.push(purchase('paused',2.01)));
  assert.equal(personal.savingsBalance,1.99);
  assert.equal(saveRule(bridge,owner,{enabled:true,increment:5,goalId:'personal-goal'}),true);
  assert.equal(personal.savingsBalance,1.99);
  currentSession='new-session';assert.equal(saveRule(bridge,owner,{enabled:true,increment:1,goalId:'personal-goal'}),false);
  currentSession='session-one';authenticated=false;assert.equal(saveRule(bridge,owner,{enabled:true,increment:1,goalId:'personal-goal'}),false);
  authenticated=true;store.switchAccount('business');assert.equal(saveRule(bridge,owner,{enabled:true,increment:1,goalId:'business-goal'}),false);
  assert.equal(mutations,3);assert.equal(business.enterprise.roundUps,undefined);
});
