'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const R=require('../receipt-core.js');
const draft=overrides=>({id:'receipt-test',merchant:'Konzum',date:'2026-09-07',currency:'EUR',totalCents:1250,lines:[{description:'Namirnice',quantity:2,totalCents:1250}],type:'expense',source:'gemini',imageHash:'a'.repeat(64),reviewed:true,...overrides});
const tx=(id,overrides={})=>({id,profileId:'personal',name:'POS KONZUM ZAGREB',date:'2026-09-07T10:00:00',amount:12.5,currency:'EUR',type:'expense',source:'Auto: Revolut',bankTransactionId:`bank-${id}`,...overrides});
test('OCR review handles unknown fields, integer cents and malformed rows without inventing money',()=>{
  const blank=R.normalizeReceipt(null);assert.equal(blank.totalCents,null);assert.equal(blank.merchant,'');assert.equal(R.reviewReceipt(blank).valid,false);
  assert.equal(R.parseMoney('12,50'),1250);assert.equal(R.parseMoney('0.00'),0);
  for(const value of ['1.234,50','-1','NaN','Infinity','12.345'])assert.equal(R.parseMoney(value),null);
  assert.equal(R.reviewReceipt(draft({date:'2026-02-29'})).valid,false);
  assert.equal(R.reviewReceipt(draft({date:'2028-02-29'})).valid,true);
  assert.equal(R.reviewReceipt(draft({lines:[null]})).valid,false);
  assert.equal(R.reviewReceipt(draft({lines:[{description:'Roba',totalCents:1000}]})).linesMismatch,true);
  assert.equal(R.reviewReceipt(draft({lines:Array.from({length:101},()=>({description:'Roba',totalCents:1}))})).valid,false);
});
test('bank matches rank exact amount/date/vendor before approximate merchants and reject wrong currencies/types/profiles',()=>{
  const profile={transactions:[tx('wrong-profile',{profileId:'business'}),tx('close',{name:'OTHER STORE',date:'2026-09-09'}),tx('perfect'),tx('income',{type:'income'}),tx('usd',{currency:'USD'}),tx('wrong-amount',{amount:15}),tx('late',{date:'2026-09-15'}),tx('manual',{source:'Manual',bankTransactionId:null})]};
  const matches=R.matchTransactions(draft(),profile,'personal');
  assert.deepEqual(matches.map(item=>item.id),['perfect','close']);assert.equal(matches[0].confidence,'high');assert.equal(matches[1].confidence,'review');
  assert.equal(R.matchTransactions(draft(),profile,'business').some(item=>item.id==='perfect'),false);
  assert.equal(R.matchTransactions(draft(),profile,'personal',{includeManual:true}).some(item=>item.id==='manual'),true);
  assert.equal(R.matchTransactions(draft({type:'income'}),profile,'personal')[0].id,'income');
});
test('confirmed receipt attaches once, contains metadata only and changes neither balances nor transaction amounts',()=>{
  const original=tx('p1'),businessTx=tx('b1',{profileId:'business'});
  const store={activeAccount:'personal',settings:{currency:'EUR'},accounts:{personal:{transactions:[original],availableBalance:500},business:{transactions:[businessTx],availableBalance:900}}};
  const business=JSON.stringify(store.accounts.business);
  const result=R.attachReceipt(store,'personal','p1',{...draft(),image:'private-image',apiKey:'secret'});
  assert.equal(result.duplicate,false);assert.equal(original.receipts.length,1);assert.equal(original.amount,12.5);assert.equal(store.accounts.personal.availableBalance,500);assert.equal(store.accounts.personal.transactions.length,1);
  assert.equal(JSON.stringify(store.accounts.business),business);assert.ok(!JSON.stringify(result).includes('private-image'));assert.ok(!JSON.stringify(result).includes('secret'));
  assert.equal(R.attachReceipt(store,'personal','p1',draft()).duplicate,true);assert.equal(original.receipts.length,1);
  store.accounts.personal.transactions.push(tx('p2'));
  assert.throws(()=>R.attachReceipt(store,'personal','p2',draft({id:'another'})),/već povezan/);
});
test('linking revalidates active profile, current amount/currency, confirmation and transaction membership',()=>{
  const store={activeAccount:'personal',accounts:{personal:{transactions:[tx('p1')]},business:{transactions:[tx('b1',{profileId:'business'})]}}};
  assert.throws(()=>R.attachReceipt(store,'business','b1',draft()),/Profil/);
  assert.throws(()=>R.attachReceipt(store,'personal','b1',draft()),/dostupna/);
  assert.throws(()=>R.attachReceipt(store,'personal','p1',draft({reviewed:false})),/potvrdite/);
  store.accounts.personal.transactions[0].amount=15;
  assert.throws(()=>R.attachReceipt(store,'personal','p1',draft()),/više ne odgovara/);
  store.accounts.personal.transactions[0].amount=12.5;store.activeAccount='business';
  assert.throws(()=>R.attachReceipt(store,'personal','p1',draft()),/Profil/);
  assert.equal(store.accounts.personal.transactions[0].receipts,undefined);
});
test('async request guard rejects superseded results, profile switches and closed dialogs',()=>{
  const guard=R.createRequestGuard('personal'),first=guard.begin();
  assert.equal(guard.current(first,'personal'),true);assert.equal(guard.current(first,'business'),false);
  const second=guard.begin();assert.equal(guard.current(first,'personal'),false);assert.equal(guard.current(second,'personal'),true);
  guard.invalidate();assert.equal(guard.current(second,'personal'),false);
});
test('receipt descriptions escape active markup and profile default currency governs legacy matching',()=>{
  assert.equal(R.escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  const store={activeAccount:'personal',settings:{currency:'USD'},accounts:{personal:{transactions:[tx('p1',{currency:undefined})]}}};
  const result=R.attachReceipt(store,'personal','p1',draft({currency:'USD'}));assert.equal(result.receipt.currency,'USD');
});
