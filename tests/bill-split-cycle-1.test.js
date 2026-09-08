'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../bill-split-core.js');
const Demo = require('../demo-data.js');
const Store = require('../state-store.js');
const scope = {userId:'user-1',profileId:'personal',currency:'EUR',referenceDate:'2026-09-08'};
const people = [{id:'self',name:'Ja'},{id:'ana',name:'Ana'},{id:'ivo',name:'Ivo'}];
function profile() { return {profileId:'personal',currency:'EUR',categories:[{id:'food',limit:200}],transactions:[{id:'meal',type:'expense',name:'Ručak',date:'2026-09-07',amount:10,currency:'EUR',category:'food'}],savingsEntries:[],goalBuckets:[]}; }
function save(p,input = {}) { return Core.save(p,scope,{transactionId:'meal',expectedStamp:Core.transactionStamp(p,scope,'meal'),mode:'equal',participants:people,...input}); }
function repayment(split,overrides = {}) { return {id:split.id,participantId:'ana',expectedRevision:split.revision,amountCents:100,date:'2026-09-08',...overrides}; }

test('cycle 1: equal shares always reconcile to exact cents, including remainder and tiny amounts',()=>{
  assert.deepEqual(Core.allocate(1000,people).map(p=>p.shareCents),[334,333,333]);
  for(let amount=1;amount<=999;amount+=7) {
    const shares=Core.allocate(amount,people);assert.equal(shares.reduce((sum,p)=>sum+p.shareCents,0),amount);
    assert.ok(Math.max(...shares.map(p=>p.shareCents))-Math.min(...shares.map(p=>p.shareCents))<=1);
  }
  assert.deepEqual(Core.allocate(1,people).map(p=>p.shareCents),[1,0,0]);
  assert.equal(Core.allocate(Core.MAX_CENTS,people).reduce((sum,p)=>sum+p.shareCents,0),Core.MAX_CENTS);
});
test('cycle 1: custom shares validate exact sum, participants and nonnegative integer cents',()=>{
  assert.deepEqual(Core.allocate(1000,people.map((p,i)=>({...p,shareCents:[200,300,500][i]})),'custom').map(p=>p.shareCents),[200,300,500]);
  for(const shares of [[200,300,499],[200,300.1,499.9],[200,-300,1100]]) assert.throws(()=>Core.allocate(1000,people.map((p,i)=>({...p,shareCents:shares[i]})),'custom'));
  for(const list of [[],[people[0]],[null,people[1]],[people[0],people[0]],[people[0],{id:'other',name:'ja'}]]) assert.throws(()=>Core.allocate(1000,list));
  assert.equal(Core.cents('12,34'),1234);assert.equal(Core.cents('0',true),0);
  for(const value of ['-1','NaN','Infinity','1.001','1e3','1,200.00',Core.MAX_CENTS/100+1]) assert.throws(()=>Core.cents(value));
});
test('cycle 1: splitting and partial/full repayments only mutate billSplits, never financial postings',()=>{
  const p=profile(),before=structuredClone(p),split=save(p);
  assert.equal(Core.inspect(p,scope,split).outstandingCents,666);
  const partial=Core.settle(p,scope,repayment(split));
  assert.equal(Core.inspect(p,scope,partial).outstandingCents,566);
  const paid=Core.settle(p,scope,repayment(partial,{amountCents:233}));
  assert.equal(Core.inspect(p,scope,paid).participants.find(p=>p.id==='ana').owedCents,0);
  const {billSplits,...after}=p;assert.deepEqual(after,before);assert.equal(p.transactions.length,1);
  assert.equal(billSplits[0].settlements.length,2);
});
test('cycle 1: profile and user scope isolation blocks reading, settling and deleting foreign records',()=>{
  const p=profile(),split=save(p);
  assert.deepEqual(Core.list(p,{...scope,userId:'user-2'}),[]);
  assert.throws(()=>Core.find(p,{...scope,userId:'user-2'},split.id),/ACCESS_DENIED/);
  assert.throws(()=>Core.settle(p,{...scope,userId:'user-2'},repayment(split)),/ACCESS_DENIED/);
  assert.throws(()=>Core.remove(p,{...scope,userId:'user-2'},split.id,1),/ACCESS_DENIED/);
  assert.throws(()=>Core.list(p,{...scope,profileId:'business'}),/ACCESS_DENIED/);
  assert.throws(()=>Core.inspect(p,undefined,split),/ACCESS_DENIED/);
  const mixed=profile();mixed.transactions[0].profileId='business';assert.throws(()=>save(mixed),/TRANSACTION_MISSING/);
});
test('cycle 1: stale transaction edits, duplicate submit revisions and removal safeguards protect repayments',()=>{
  const p=profile(),split=save(p);
  assert.throws(()=>save(p),/STALE_SPLIT/);
  const paid=Core.settle(p,scope,repayment(split));
  assert.throws(()=>Core.settle(p,scope,repayment(split)),/STALE_SPLIT/);
  assert.throws(()=>Core.settle(p,scope,repayment(paid,{amountCents:234})),/OVERPAYMENT/);
  assert.throws(()=>Core.settle(p,scope,repayment(paid,{participantId:'self'})),/INVALID_PARTICIPANTS/);
  assert.throws(()=>Core.remove(p,scope,paid.id,paid.revision),/SETTLEMENT_PROTECTED/);
  assert.throws(()=>save(p,{expectedRevision:paid.revision,mode:'custom',participants:people.map((person,index)=>({...person,shareCents:[601,99,300][index]}))}),/SETTLEMENT_PROTECTED/);
  p.transactions[0].amount=12;
  assert.equal(Core.inspect(p,scope,paid).stale,true);
  assert.throws(()=>Core.settle(p,scope,repayment(paid)),/STALE_TRANSACTION/);
  assert.throws(()=>save(p,{expectedStamp:paid.transactionStamp,expectedRevision:paid.revision}),/STALE_TRANSACTION/);
  const repaired=save(p,{expectedRevision:paid.revision});assert.equal(repaired.amountCents,1200);assert.equal(repaired.settlements[0].amountCents,100);
});
test('cycle 1: deleted expenses remain visible as stale; income, invalid amounts and malformed cached splits do not crash',()=>{
  const p=profile(),split=save(p);p.transactions=[];
  assert.equal(Core.inspect(p,scope,split).stale,true);
  for(const change of [{type:'income'},{amount:-10},{amount:0},{status:'cancelled'}]) {const q=profile();Object.assign(q.transactions[0],change);assert.throws(()=>save(q));}
  const bad=profile();bad.billSplits=[null,{ownerUserId:scope.userId,profileId:scope.profileId,participants:[null]}];
  assert.deepEqual(Core.list(bad,scope),[]);save(bad);assert.equal(Core.list(bad,scope).length,1);
});
test('cycle 1: repayment dates validate leap years and reject future/impossible dates',()=>{
  const p=profile(),split=save(p);
  for(const date of ['2026-02-29','2026-09-09','2026-04-31','invalid']) assert.throws(()=>Core.settle(p,scope,repayment(split,{date})),/INVALID_DATE/);
  const paid=Core.settle(p,scope,repayment(split,{date:'2024-02-29'}));assert.equal(paid.settlements[0].date,'2024-02-29');
});
test('cycle 1: reactive store retains the separate ledger while profile totals and business state stay unchanged',()=>{
  const store=Store.createStore(Demo.createDemoAppState(new Date('2026-09-08T12:00:00')),{referenceDate:scope.referenceDate});
  const before=structuredClone(store.getState()),expense=before.accounts.personal.transactions.find(tx=>(tx.type||'expense')==='expense'&&tx.amount>0);
  const stamp=Core.transactionStamp(before.accounts.personal,scope,expense.id);
  store.update('split-test',draft=>Core.save(draft.accounts.personal,scope,{transactionId:expense.id,expectedStamp:stamp,participants:people,mode:'equal'}));
  const after=structuredClone(store.getState());assert.equal(after.accounts.personal.billSplits.length,1);
  for(const account of ['personal','business']) {
    // Store recalculation timestamps may advance, but every derived number must be identical.
    delete before.accounts[account].derived.updatedAt;delete after.accounts[account].derived.updatedAt;
  }
  assert.deepEqual(after.accounts.personal.transactions,before.accounts.personal.transactions);
  assert.deepEqual(after.accounts.personal.derived,before.accounts.personal.derived);
  assert.deepEqual(after.accounts.business,before.accounts.business);
});
