'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const V=require('../vaults-core.js'),E=require('../enterprise-core.js'),S=require('../state-store.js'),C=require('../core.js'),A=require('../accounting-core.js');
const ref='2026-09-08';
const make=(id='personal')=>({profileId:id,accountName:id,financialOpeningBalance:0,transactions:[],savingsEntries:[],categories:[],goalBuckets:[{id:`${id}-reserve`,name:'Rezerva',current:0,target:10000,roundUpsEnabled:false},{id:`${id}-travel`,name:'Putovanje',current:0,target:5000,roundUpsEnabled:false}],enterprise:{paydayRules:[]}});
const tx=(id,amount,extra={})=>({id,amount,date:`${ref}T12:00:00`,profileId:'personal',type:'expense',paymentMethod:'card',currency:'EUR',...extra});
const configure=(p,increment=1,enabled=true)=>V.configureRoundUps(p,{enabled,increment,goalId:p.goalBuckets[0].id},ref,{profileId:p.profileId});
const payday=(p,extra={})=>E.configurePaydayRule(p,{id:'split',minimumAmount:1000,currency:'EUR',allocations:[{goalId:p.goalBuckets[0].id,percent:10},{goalId:p.goalBuckets[1].id,percent:15}],...extra},ref,{profileId:p.profileId});

test('round-ups use exact 1 or 5 EUR steps without moving exact multiples',()=>{
  assert.equal(V.roundUpAmount(3.4,1),.6);assert.equal(V.roundUpAmount(3.4,5),1.6);assert.equal(V.roundUpAmount(9.99,5),.01);
  assert.equal(V.roundUpAmount(10,5),0);assert.equal(V.roundUpAmount(1,1),0);assert.equal(V.roundUpAmount(-3.4,5),0);assert.equal(V.roundUpAmount(NaN),0);
});
test('round-up enablement excludes historical and same-day existing records',()=>{
  const p=make();p.transactions=[tx('existing',3.4),tx('old',2.5,{date:'2026-08-01'})];assert.equal(configure(p).valid,true);
  V.reconcileRoundUps(p,ref);assert.equal(p.goalBuckets[0].current,0);
  p.transactions.push(tx('new',3.4),tx('backfilled',3.4,{date:'2026-08-02'}));V.reconcileRoundUps(p,ref);assert.equal(p.goalBuckets[0].current,.6);assert.equal(p.savingsEntries.length,1);
});
test('only explicitly identified card purchases round up, never cash transfers income or foreign currency',()=>{
  const p=make();configure(p,5);p.transactions=[tx('card',3.4),tx('cash',3.4,{paymentMethod:'cash'}),tx('transfer',3.4,{paymentMethod:'transfer'}),tx('unknown',3.4,{paymentMethod:undefined}),tx('income',3.4,{type:'income'}),tx('usd',3.4,{currency:'USD'}),tx('flag',3.4,{paymentMethod:undefined,isCardPayment:true})];
  V.reconcileRoundUps(p,ref);assert.equal(p.goalBuckets[0].current,3.2);assert.equal(p.savingsEntries.length,2);
});
test('bank card accounts retain payment method metadata, while current accounts remain unknown',()=>{
  const p=make(),raw={id:'card-payment',bookedAt:ref,amount:-3.4,description:'Kupnja'};
  const card=C.normalizeBankTransaction(raw,{id:'card',providerId:'bank',accountId:'one',accountKindEn:'Card'},p,ref);
  const account=C.normalizeBankTransaction(raw,{id:'current',providerId:'bank',accountId:'two',accountKindEn:'Current account'},p,ref);
  const cash=C.normalizeBankTransaction({...raw,paymentMethod:'cash'},{id:'card',providerId:'bank',accountId:'one',accountKindEn:'Card'},p,ref);
  assert.equal(card.paymentMethod,'card');assert.equal(account.paymentMethod,'unknown');assert.equal(cash.paymentMethod,'cash');
});
test('round-ups reconcile repeated renders, edits, deletions and cash corrections once',()=>{
  const p=make();configure(p);p.transactions=[tx('one',3.4)];V.reconcileRoundUps(p,ref);assert.equal(p.goalBuckets[0].current,.6);assert.equal(V.reconcileRoundUps(p,ref).changed,false);
  p.transactions[0].amount=3.25;V.reconcileRoundUps(p,ref);assert.equal(p.goalBuckets[0].current,.75);
  p.transactions[0].paymentMethod='cash';V.reconcileRoundUps(p,ref);assert.equal(p.goalBuckets[0].current,0);
  p.transactions[0].paymentMethod='card';V.reconcileRoundUps(p,ref);assert.equal(p.goalBuckets[0].current,.75);
  p.transactions=[];V.reconcileRoundUps(p,ref);assert.equal(p.goalBuckets[0].current,0);assert.equal(p.savingsEntries.length,0);
});
test('pause preserves past roundups, enabling again only admits newly observed purchases',()=>{
  const p=make();configure(p);p.transactions=[tx('first',3.4)];V.reconcileRoundUps(p,ref);configure(p,1,false);
  p.transactions.push(tx('paused',2.25));V.reconcileRoundUps(p,ref);assert.equal(p.goalBuckets[0].current,.6);
  configure(p,5);V.reconcileRoundUps(p,ref);assert.equal(p.goalBuckets[0].current,.6);
  p.transactions.push(tx('after',2.25));V.reconcileRoundUps(p,ref);assert.equal(p.goalBuckets[0].current,3.35);
  p.transactions[0].amount=3.5;V.reconcileRoundUps(p,ref);assert.equal(p.goalBuckets[0].current,3.25);
});
test('future round-ups post on the due date and roll back when moved into the future',()=>{
  const p=make();configure(p,5);p.transactions=[tx('future',3.4,{date:'2026-09-09',status:'scheduled'})];
  V.reconcileRoundUps(p,ref);assert.equal(p.goalBuckets[0].current,0);
  V.reconcileRoundUps(p,'2026-09-09');assert.equal(p.goalBuckets[0].current,1.6);
  p.transactions[0].date='2026-10-09';V.reconcileRoundUps(p,'2026-09-09');assert.equal(p.goalBuckets[0].current,0);
});
test('offline drafts and pending/cancelled payments cannot round up',()=>{
  const p=make();configure(p);p.transactions=[tx('draft',3.4,{offlineDraft:true}),tx('pending',3.4,{status:'pending'}),tx('cancelled',3.4,{status:'cancelled'})];V.reconcileRoundUps(p,ref);assert.equal(p.savingsEntries.length,0);
});
test('strict profile rules prevent allocations into another account goal or from foreign transactions',()=>{
  const p=make(),b=make('business');p.goalBuckets.push({...b.goalBuckets[0],profileId:'business'});
  assert.equal(V.configureRoundUps(p,{enabled:true,goalId:'business-reserve',increment:1},ref,{profileId:'personal'}).valid,false);
  configure(p);p.transactions=[tx('foreign',3.4,{profileId:'business'})];V.reconcileRoundUps(p,ref);assert.equal(p.goalBuckets[0].current,0);assert.equal(b.goalBuckets[0].current,0);
  assert.equal(V.configureRoundUps(p,{enabled:true,goalId:'personal-reserve',increment:1},ref,{profileId:'business'}).valid,false);
});
test('bank/import hash duplicates never produce additional round-up credits',()=>{
  const p=make();configure(p);p.transactions=[tx('first',3.4,{importHash:'bank-hash'}),tx('retry',3.4,{importHash:'bank-hash'})];V.reconcileRoundUps(p,ref);assert.equal(p.goalBuckets[0].current,.6);
  const historical=make();historical.transactions=[tx('old',3.4,{importHash:'old-hash'})];configure(historical);historical.transactions=[tx('reimported',3.4,{importHash:'old-hash'})];V.reconcileRoundUps(historical,ref);assert.equal(historical.goalBuckets[0].current,0);
});
test('accounting compatibility wrappers do not double-credit new reconciled rules',()=>{
  const p=make();configure(p);const purchase=tx('card',3.4);p.transactions.push(purchase);
  A.applyRoundUp(p,purchase,ref);V.reconcileRoundUps(p,ref);assert.equal(p.goalBuckets[0].current,.6);
  A.undoRoundUp(p,purchase);purchase.amount=3.25;A.applyRoundUp(p,purchase,ref);V.reconcileRoundUps(p,ref);assert.equal(p.goalBuckets[0].current,.75);
});
test('legacy round-up funds survive migration without auto-funding older history',()=>{
  const p=make();p.goalBuckets[0].roundUpsEnabled=true;p.goalBuckets[0].current=.6;p.transactions=[tx('funded',3.4,{paymentMethod:undefined}),tx('historical',2.25)];p.savingsEntries=[{id:'legacy',amount:.6,goalId:'personal-reserve',date:ref,sourceType:'round-up',roundUpForTransactionId:'funded'}];
  V.reconcileRoundUps(p,ref);assert.equal(p.goalBuckets[0].current,.6);assert.equal(p.savingsEntries.length,1);assert.equal(p.enterprise.roundUps.enabled,true);
});
test('payday rules ignore existing income and start only above 1000 EUR',()=>{
  const p=make();p.transactions=[tx('existing',2000,{type:'income'})];assert.equal(payday(p).valid,true);E.reconcileAutomations(p,ref);assert.equal(p.goalBuckets[0].current,0);
  p.transactions.push(tx('equal',1000,{type:'income'}),tx('salary',2000,{type:'income'}));E.reconcileAutomations(p,ref);assert.equal(p.goalBuckets[0].current,200);assert.equal(p.goalBuckets[1].current,300);assert.equal(p.savingsEntries.length,2);
});
test('forward-only payday edits, pause/resume and deletion reconcile without retroactive surprise deposits',()=>{
  const p=make();payday(p);p.transactions=[tx('salary',2000,{type:'income'})];E.reconcileAutomations(p,ref);p.enterprise.paydayRules[0].enabled=false;
  p.transactions.push(tx('paused',3000,{type:'income'}));E.reconcileAutomations(p,ref);assert.equal(p.goalBuckets[0].current,200);
  p.transactions[0].amount=3000;E.reconcileAutomations(p,ref);assert.equal(p.goalBuckets[0].current,300);
  payday(p);E.reconcileAutomations(p,ref);assert.equal(p.goalBuckets[0].current,300);
  p.transactions.push(tx('resumed',2000,{type:'income'}));E.reconcileAutomations(p,ref);assert.equal(p.goalBuckets[0].current,500);
  p.transactions=p.transactions.filter(row=>row.id!=='salary');E.reconcileAutomations(p,ref);assert.equal(p.goalBuckets[0].current,200);
});
test('payday future income activates on arrival, and moving it forward reverses only its allocation',()=>{
  const p=make();payday(p);p.transactions=[tx('future-income',2000,{type:'income',date:'2026-09-09'})];E.reconcileAutomations(p,ref);assert.equal(p.savingsEntries.length,0);
  E.reconcileAutomations(p,'2026-09-09');assert.equal(p.goalBuckets[0].current,200);
  p.transactions[0].date='2026-10-01';E.reconcileAutomations(p,'2026-09-09');assert.equal(p.goalBuckets[0].current,0);
});
test('payday allocation is cent exact and validated against duplicate goals and over-allocation',()=>{
  const p=make();assert.equal(payday(p,{allocations:[{goalId:'personal-reserve',percent:60},{goalId:'personal-travel',percent:60}]}).valid,false);
  assert.equal(payday(p,{allocations:[{goalId:'personal-reserve',percent:10},{goalId:'personal-reserve',percent:15}]}).valid,false);
  payday(p);p.transactions=[tx('salary',1000.01,{type:'income'})];E.reconcileAutomations(p,ref);assert.equal(p.goalBuckets[0].current,100);assert.equal(p.goalBuckets[1].current,150);
});
test('payday ignores pending, drafts, FX currencies and foreign profile income',()=>{
  const p=make();payday(p);p.transactions=[tx('pending',2000,{type:'income',status:'pending'}),tx('draft',2000,{type:'income',status:'draft'}),tx('usd',2000,{type:'income',currency:'USD'}),tx('business',2000,{type:'income',profileId:'business'})];E.reconcileAutomations(p,ref);assert.equal(p.savingsEntries.length,0);
});
test('business tax vault and payday rules share a capped pool without double-reserving tax',()=>{
  const p=make('business');p.enterprise.taxVault={enabled:true,currency:'EUR',startDate:ref};payday(p);
  p.transactions=[tx('b2b',1250,{profileId:'business',type:'income',isB2B:true})];const result=E.reconcileAutomations(p,ref,{profileId:'business'});
  assert.equal(result.taxReservedCents,25000);assert.equal(p.goalBuckets[0].current,125);assert.equal(p.goalBuckets[1].current,187.5);assert.equal(result.totalCents,56250);assert.equal(E.reconcileAutomations(p,ref,{profileId:'business'}).changed,false);
});
test('store recalculation cascades stash into savings and available balances with account isolation',()=>{
  const personal=make(),business=make('business');const store=S.createStore({activeAccount:'personal',accounts:{personal,business},settings:{currency:'EUR'}},{referenceDate:ref});
  configure(personal,5);payday(personal);store.update('new',(_,p)=>p.transactions.push(tx('salary',2000,{type:'income'}),tx('purchase',3.4)));
  assert.equal(personal.savingsBalance,501.6);assert.equal(personal.availableBalance,1495);assert.equal(business.savingsBalance,0);
  store.update('edit',(_,p)=>p.transactions[1].amount=4.9);assert.equal(personal.savingsBalance,500.1);assert.equal(personal.availableBalance,1495);
  store.switchAccount('business');assert.equal(store.snapshot().profile.availableBalance,0);
});
test('unlimited goals validate real dates and preserve custom target/icon metadata',()=>{
  const p=make();p.goalBuckets=Array.from({length:200},(_,i)=>({id:`goal-${i}`,name:`Trezor ${i}`,icon:'✈️',current:0,target:1000,dueDate:'2028-02-29'}));
  assert.equal(p.goalBuckets.every(goal=>C.validateSavingsGoal(goal).valid),true);assert.equal(C.validateSavingsGoal({...p.goalBuckets[0],dueDate:'2027-02-29'}).valid,false);
  const store=S.createStore({activeAccount:'personal',accounts:{personal:p,business:make('business')}},{referenceDate:ref});assert.equal(store.snapshot().profile.goalBuckets.length,200);assert.equal(p.goalBuckets[199].icon,'✈️');
});
