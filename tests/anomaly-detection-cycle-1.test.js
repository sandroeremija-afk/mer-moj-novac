'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Anomalies = require('../anomaly-core.js');
const reference = '2026-09-18';
const transaction = (id,date,amount,extra = {}) => ({id,date,amount,type:'expense',category:'food',currency:'EUR',...extra});
const profile = (current = 130) => ({profileId:'personal',currency:'EUR',categories:[{id:'food',name:'Hrana'}],transactions:[
  transaction('w1','2026-08-15',100),transaction('w2','2026-08-22',100),transaction('w3','2026-08-29',100),transaction('w4','2026-09-05',100),transaction('now',reference,current)
]});

test('anomaly comparison includes exactly seven current days and the preceding 28 days', () => {
  const value = profile();
  value.transactions.push(transaction('previous','2026-08-14',999),transaction('first-current','2026-09-12',5),transaction('last-baseline','2026-09-11',20),transaction('future','2026-09-19',999));
  const result = Anomalies.detect(value,reference);
  assert.deepEqual([result.currentStart,result.currentEnd,result.baselineStart,result.baselineEnd],['2026-09-12','2026-09-18','2026-08-15','2026-09-11']);
  assert.equal(result.categories[0].current,135);
  assert.equal(result.categories[0].average,105);
  assert.equal(result.anomalies.length,0);
});

test('30 percent is inclusive and percentages or weekly means cannot round a below-threshold case into an alert', () => {
  assert.equal(Anomalies.detect(profile(),reference).anomalies.length,1);
  assert.equal(Anomalies.detect(profile(129.99),reference).anomalies.length,0);
  const value = profile();
  value.transactions[0].amount += 0.01;
  const result = Anomalies.detect(value,reference);
  assert.equal(result.categories[0].average,100.0025);
  assert.ok(result.categories[0].growthPercent < 30);
  assert.equal(result.anomalies.length,0);
});

test('new ledgers and nonpositive baselines never produce a percentage anomaly', () => {
  const fresh = profile();
  fresh.transactions[0].date = '2026-08-16';
  assert.equal(Anomalies.detect(fresh,reference).hasHistory,false);
  assert.equal(Anomalies.detect(fresh,reference).anomalies.length,0);
  for (const amount of [0,-100]) {
    const value = profile();
    value.transactions.slice(0,4).forEach(item => {item.amount=amount;});
    const result = Anomalies.detect(value,reference);
    assert.equal(result.categories[0].growthPercent,null);
    assert.equal(result.anomalies.length,0);
  }
});

test('a complete ledger includes zero-spend weeks and nets category refunds', () => {
  const value = profile(140);
  value.transactions = [transaction('history','2026-08-01',100,{type:'income'}),transaction('baseline','2026-09-01',400),transaction('purchase',reference,150),transaction('refund',reference,-10)];
  const result = Anomalies.detect(value,reference);
  assert.equal(result.anomalies[0].current,140);
  assert.equal(result.anomalies[0].average,100);
  assert.equal(result.anomalies[0].delta,40);
  value.transactions.push(transaction('refund2',reference,-20));
  assert.equal(Anomalies.detect(value,reference).anomalies.length,0);
});

test('profiles and currencies remain isolated including mislabeled records and profile requests', () => {
  const value = profile(100);
  value.transactions.push(transaction('other-profile',reference,999,{profileId:'business'}),transaction('usd',reference,999,{currency:'USD'}));
  assert.equal(Anomalies.detect(value,reference,{profileId:'personal',currency:'EUR'}).anomalies.length,0);
  assert.equal(Anomalies.detect(value,reference,{profileId:'business',currency:'EUR'}).categories.length,0);
  assert.equal(Anomalies.detect(value,reference,{profileId:'personal',currency:'USD'}).hasHistory,false);
  const legacy = profile();
  legacy.transactions.forEach(item => {delete item.profileId;delete item.currency;});
  assert.equal(Anomalies.detect(legacy,reference,{profileId:'personal',currency:'EUR'}).anomalies.length,1);
  assert.equal(Anomalies.detect(legacy,reference,{profileId:'personal',currency:'USD'}).anomalies.length,0);
});

test('pending, failed, offline, non-expense, malformed and future entries cannot generate or establish anomalies', () => {
  const value = profile(100);
  ['pending','draft','cancelled','canceled','rejected','failed'].forEach((status,index) => value.transactions.push(transaction(`status-${index}`,reference,999,{status})));
  value.transactions.push(transaction('pending-scheduled','2026-09-19',999,{status:'pending',scheduled:true}));
  value.transactions.push(transaction('offline',reference,999,{offlineDraft:true}),transaction('savings',reference,999,{type:'savings'}),transaction('transfer',reference,999,{type:'transfer'}),transaction('income',reference,999,{type:'income'}),transaction('nan',reference,NaN),transaction('infinity',reference,Infinity),transaction('huge',reference,1e20),transaction('string',reference,'999'),transaction('bad-date','2026-02-30',999));
  const result = Anomalies.detect(value,reference);
  assert.equal(result.categories[0].current,100);
  assert.equal(result.anomalies.length,0);
  const pendingHistory = profile();
  pendingHistory.transactions[0].status='pending';
  assert.equal(Anomalies.detect(pendingHistory,reference).hasHistory,false);
});

test('stable import identities count only the latest record and invalid sums cannot overflow into alerts', () => {
  const value = profile(0);
  value.transactions.push(transaction('first',reference,500,{importHash:'same'}),transaction('edited',reference,100,{importHash:'same'}));
  assert.equal(Anomalies.detect(value,reference).categories[0].current,100);
  value.transactions.push(transaction('large1',reference,1e12),transaction('large2',reference,1e12));
  assert.equal(Anomalies.detect(value,reference).categories.length,0);
});

test('later corrections replace the original identity before status, date, currency and amount eligibility', () => {
  const identities = [{id:'now'},{id:'first-copy',importHash:'same-import'},{id:'first-copy',bankTransactionId:'same-bank',bankConnectionId:'connection-a'}];
  const corrections = [{status:'cancelled'},{status:'pending'},{date:'2026-09-19'},{currency:'USD'},{type:'transfer'},{offlineDraft:true},{amount:NaN}];
  for (const identity of identities) for (const correction of corrections) {
    const value = profile();
    Object.assign(value.transactions.at(-1),identity);
    value.transactions.push({...value.transactions.at(-1),...correction});
    const result = Anomalies.detect(value,reference);
    assert.equal(result.categories[0].current,0,`${JSON.stringify(identity)} correction ${JSON.stringify(correction)}`);
    assert.equal(result.anomalies.length,0);
  }
});

test('a later invalidation of the oldest duplicate removes its full-history evidence and baseline spend', () => {
  for (const correction of [{status:'cancelled'},{status:'pending'},{date:'2026-09-19'},{currency:'USD'}]) {
    const value = profile();
    value.transactions.push({...value.transactions[0],...correction});
    const result = Anomalies.detect(value,reference);
    assert.equal(result.hasHistory,false);
    assert.equal(result.categories[0].average,75);
    assert.equal(result.anomalies.length,0);
  }
});

test('foreign profile duplicates cannot overwrite the active profile but corrections keep bank connections separate', () => {
  const value = profile();
  value.transactions.push({...value.transactions.at(-1),profileId:'business',status:'cancelled'});
  assert.equal(Anomalies.detect(value,reference).anomalies[0].current,130);
  value.transactions.push(transaction('card-a',reference,10,{bankTransactionId:'shared-id',connectionId:'a'}),transaction('card-b',reference,10,{bankTransactionId:'shared-id',connectionId:'b'}),transaction('card-a-edit',reference,10,{bankTransactionId:'shared-id',bankConnectionId:'a',status:'cancelled'}));
  assert.equal(Anomalies.detect(value,reference).anomalies[0].current,140);
});

test('calendar windows handle leap days, timezone midnight and invalid references deterministically', () => {
  const leap = Anomalies.detect(profile(),'2024-03-06');
  assert.equal(leap.currentStart,'2024-02-29');
  assert.equal(leap.baselineStart,'2024-02-01');
  const midnight = Anomalies.detect(profile(),new Date('2026-09-17T22:30:00Z'),{timezone:'Europe/Zagreb'});
  assert.equal(midnight.referenceDate,reference);
  assert.equal(midnight.anomalies.length,1);
  assert.equal(Anomalies.detect(profile(),'2026-02-30').categories.length,0);
  assert.equal(Anomalies.detect(profile(),new Date('invalid')).categories.length,0);
});

test('store recalculation preserves nonbooked bank states while an app schedule books on its due date', () => {
  const Store = require('../state-store.js');
  const value = profile(100);
  value.transactions.push(...['pending','cancelled','canceled','rejected','failed'].map(status => transaction(status,reference,1000,{status})));
  value.transactions.push(transaction('due',reference,30,{status:'pending',scheduled:true}),transaction('tomorrow','2026-09-19',1000,{status:'scheduled',scheduled:true}));
  Store.recalculateProfile(value,reference,'personal',{currency:'EUR'});
  for (const status of ['pending','cancelled','canceled','rejected','failed']) assert.equal(value.transactions.find(item=>item.id===status).status,status);
  assert.equal(value.transactions.find(item=>item.id==='due').status,'posted');
  assert.equal(value.transactions.find(item=>item.id==='tomorrow').status,'scheduled');
  assert.equal(Anomalies.detect(value,reference).anomalies[0].current,130);
  assert.equal(value.derived.monthly.expenses,230);
});
