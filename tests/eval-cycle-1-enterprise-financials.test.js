'use strict';
const assert = require('node:assert/strict');
const core = require('../enterprise-core.js');
const state = require('../state-store.js');
const clone = value => JSON.parse(JSON.stringify(value));
const tx = (id, date, amount, type = 'expense', name = 'Netflix', profileId = 'personal') => ({ id, date, amount, type, name, profileId, currency:'EUR' });
const profile = () => ({ profileId:'personal', financialOpeningBalance:0, availableBalance:0, transactions:[], savingsEntries:[], goalBuckets:[{ id:'reserve', name:'Rezerva', current:0, target:2000 }], recurring:[], categories:[], savingsTarget:200 });

{
  const data = profile();
  data.transactions = [tx('salary','2026-09-01',1000,'income'),tx('bill','2026-09-02',500)];
  let forecast = core.forecastCashFlow(data,'2026-09-07');
  assert.equal(forecast.availableCents,50000);
  assert.equal(forecast.safeToSpendCents,50000);
  data.transactions.push(tx('bonus','2026-09-07',200,'income'));
  assert.equal(core.forecastCashFlow(data,'2026-09-07').safeToSpendCents,70000);
  data.transactions.push(tx('future','2026-09-09',10000,'income'));
  assert.equal(core.forecastCashFlow(data,'2026-09-07').safeToSpendCents,70000);
  assert.equal(core.forecastCashFlow(data,'2026-09-09').availableCents,1070000);
  data.transactions.push(tx('foreign','2026-09-06',100000,'income','Business client','business'));
  assert.equal(core.forecastCashFlow(data,'2026-09-07').safeToSpendCents,70000);
  data.transactions.push({...tx('usd','2026-09-06',150,'income'),currency:'USD'});
  assert.equal(core.forecastCashFlow(data,'2026-09-07').foreignCurrencyCount,1);
  assert.equal(core.forecastCashFlow(data,'2026-09-07').safeToSpendCents,70000);
  data.transactions.push(tx('refund','2026-09-07',-50));
  assert.equal(core.forecastCashFlow(data,'2026-09-07').safeToSpendCents,75000);
}
{
  const data = profile();
  data.financialOpeningBalance = 1500;
  data.goalBuckets[0].current = 250;
  data.transactions = [tx('jul','2026-07-15',10),tx('aug','2026-08-15',10),tx('sep','2026-09-15',12)];
  const radar = core.subscriptionRadar(data,'2026-09-16');
  assert.equal(radar.length,1);
  assert.equal(radar[0].increaseCents,200);
  assert.equal(radar[0].increasePercent,20);
  assert.equal(radar[0].nextDate,'2026-10-15');
  const forecast = core.forecastCashFlow(data,'2026-09-16');
  assert.equal(forecast.availableCents,121800);
  assert.equal(forecast.predictedBillsCents,1200);
  assert.equal(forecast.safeToSpendCents,120600);
  assert.equal(forecast.series.at(-1).balanceCents,forecast.safeToSpendCents);
  assert.equal(forecast.reservedCents,25000);
  data.recurring.push({id:'netflix',name:'Netflix',day:15,amount:12,enabled:true});
  assert.equal(core.forecastCashFlow(data,'2026-09-16').predictedBillsCents,1200,'explicit bill replaces inferred bill');
  data.transactions.push(tx('scheduled','2026-10-15',12));
  assert.equal(core.forecastCashFlow(data,'2026-09-16').predictedBillsCents,1200,'scheduled transaction replaces recurring rule and pattern');
  const anonymized = core.anonymizedForecast(forecast);
  assert.ok(!JSON.stringify(anonymized).includes('Netflix'));
  assert.ok(!JSON.stringify(anonymized).includes('personal'));
}
{
  const data = profile();
  data.transactions = [tx('nov','2023-11-30',20),tx('dec','2023-12-31',20),tx('jan','2024-01-31',20)];
  assert.equal(core.recurringPatterns(data,'2024-02-01')[0].nextDate,'2024-02-29');
  data.recurring = [{id:'monthend',name:'Najam',day:31,amount:50,enabled:true}];
  assert.ok(core.forecastCashFlow(data,'2024-02-01').bills.some(bill => bill.date==='2024-02-29'));
  assert.equal(core.forecastCashFlow(data,'2024-02-29').daysRemaining,1);
  const shopping = profile();
  shopping.transactions=[tx('a','2026-07-01',10),tx('b','2026-07-25',20),tx('c','2026-08-01',10)];
  assert.equal(core.subscriptionRadar(shopping,'2026-08-02').length,0,'frequent shopping is not a monthly subscription');
}
{
  const data = profile();
  data.transactions = [tx('income','2026-09-01',2000,'income')];
  data.enterprise = {paydayRules:[{id:'split',enabled:true,minimumAmount:1000,startDate:'2026-09-01',allocations:[{goalId:'reserve',percent:10}]}]};
  let result = core.reconcileAutomations(data,'2026-09-07');
  assert.equal(result.totalCents,20000); assert.equal(data.goalBuckets[0].current,200);
  assert.equal(core.reconcileAutomations(data,'2026-09-07').changed,false);
  data.transactions.push({...data.transactions[0]});
  assert.equal(core.reconcileAutomations(data,'2026-09-07').changed,false,'duplicate IDs do not allocate twice');
  data.transactions = [tx('new-id','2026-09-01',2000,'income')];
  data.transactions[0].importHash='same-bank-id';
  data.transactions.push({...data.transactions[0],id:'other-id'});
  core.reconcileAutomations(data,'2026-09-07');
  assert.equal(data.goalBuckets[0].current,200,'duplicate bank imports do not allocate twice');
  data.transactions = [tx('income','2026-09-01',3000,'income')];
  core.reconcileAutomations(data,'2026-09-07');
  assert.equal(data.goalBuckets[0].current,300,'edited income updates allocation');
  data.goalBuckets[0].current += 50;
  data.savingsEntries.push({id:'manual',goalId:'reserve',amount:50,date:'2026-09-07'});
  data.transactions = [];
  core.reconcileAutomations(data,'2026-09-07');
  assert.equal(data.goalBuckets[0].current,50,'deleted income reverses automatic allocation and preserves manual deposit');
  assert.equal(data.savingsEntries.length,1);
  data.transactions=[tx('future','2026-10-01',2000,'income')];
  assert.equal(core.reconcileAutomations(data,'2026-09-07').totalCents,0);
  assert.equal(core.reconcileAutomations(data,'2026-10-01').totalCents,20000);
  data.enterprise.paydayRules[0].enabled=false;
  core.reconcileAutomations(data,'2026-10-01');
  assert.equal(data.goalBuckets[0].current,50);
  assert.equal(core.validatePaydayRule({minimumAmount:1000,allocations:[{goalId:'reserve',percent:110}]},data).valid,false);
}
{
  const personal = profile(), business=profile(); business.profileId='business';
  personal.enterprise = business.enterprise = {taxVault:{enabled:true,rate:25}};
  personal.transactions=[{...tx('p','2026-09-01',1250,'income'),isB2B:true}];
  business.transactions=[{...tx('b','2026-09-01',1250,'income','Client','business'),isB2B:true},tx('non-b2b','2026-09-01',500,'income','Gift','business')];
  assert.equal(core.reconcileAutomations(personal,'2026-09-07').taxReservedCents,0);
  assert.equal(core.reconcileAutomations(business,'2026-09-07').taxReservedCents,25000,'VAT-inclusive 1250 = net 1000 plus VAT 250');
  assert.equal(core.forecastCashFlow(business,'2026-09-07').availableCents,150000);
  business.transactions=[]; core.reconcileAutomations(business,'2026-09-07');
  assert.equal(business.goalBuckets.find(goal=>goal.taxVault).current,0);
}
{
  const data=profile(); data.financialOpeningBalance=100; data.goalBuckets[0].current=100;
  const before=JSON.stringify(data), result=core.simulatePurchase(data,600,'2026-09-07');
  assert.equal(result.valid,true); assert.equal(result.goals[0].delayMonths,3);
  assert.equal(JSON.stringify(data),before,'scenario never changes real data');
  assert.equal(core.simulatePurchase(data,-1,'2026-09-07').valid,false);
  assert.equal(core.simulatePurchase(data,NaN,'2026-09-07').valid,false);
  data.savingsTarget=0;
  assert.equal(core.simulatePurchase(data,600,'2026-09-07').goals[0].simulatedDate,null);
  assert.equal(core.cents(0.1+0.2),30);
  const copy=clone(data); copy.transactions=[tx('stress','2026-09-07',1000000000,'income')];
  assert.ok(Number.isSafeInteger(core.forecastCashFlow(copy,'2026-09-07').availableCents));
}
{
  const personal=profile(),business=profile();business.profileId='business';
  personal.enterprise={paydayRules:[{id:'live',minimumAmount:1000,allocations:[{goalId:'reserve',percent:10}]}]};
  const store=state.createStore({activeAccount:'personal',accounts:{personal,business}},{referenceDate:'2026-09-07'});
  let emissions=0;store.subscribe(()=>emissions++);
  store.update('income',(_,active)=>active.transactions.push(tx('live','2026-09-07',2000,'income')));
  assert.equal(store.snapshot().profile.availableBalance,1800);
  assert.equal(core.forecastCashFlow(store.snapshot().profile,'2026-09-07').availableCents,180000);
  assert.equal(store.snapshot().profile.savingsBalance,200);
  store.update('edit',(_,active)=>{active.transactions[0].amount=3000;});
  assert.equal(store.snapshot().profile.availableBalance,2700);
  store.switchAccount('business');
  assert.equal(store.snapshot().profile.availableBalance,0);
  store.switchAccount('personal');
  store.update('delete',(_,active)=>{active.transactions=[];});
  assert.equal(store.snapshot().profile.availableBalance,0);
  assert.equal(store.snapshot().profile.savingsBalance,0);
  assert.equal(emissions,5);
}
process.stdout.write('Cycle 1 enterprise financials: ledger, forecasts, leap years, isolation, allocations and scenarios passed.\n');
