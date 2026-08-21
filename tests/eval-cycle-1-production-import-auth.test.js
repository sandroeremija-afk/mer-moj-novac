const test = require('node:test');
const assert = require('node:assert/strict');
const MerAuth = require('../auth-core.js');
const MerCore = require('../core.js');
const MerAccounting = require('../accounting-core.js');
const MerImport = require('../import-core.js');

class MemoryStorage {
  constructor(){this.values=new Map();}
  getItem(key){return this.values.has(key)?this.values.get(key):null;}
  setItem(key,value){this.values.set(key,String(value));}
  removeItem(key){this.values.delete(key);}
}

const profile = () => ({
  categories:[{id:'food'},{id:'transport'},{id:'healthBeauty'},{id:'entertainment'},{id:'utilities'},{id:'shopping'},{id:'other'}],
  incomeCategories:[{id:'salary'},{id:'freelance'},{id:'gift'},{id:'otherIncome'}],transactions:[],savingsEntries:[],goalBuckets:[{id:'vault',name:'Reserve',current:10,target:100,roundUpsEnabled:true}]
});

test('cycle 1: registration hashes passwords and preserves an expiring session across provider instances',async()=>{
  const usersStorage=new MemoryStorage(),sessionStorage=new MemoryStorage();let now=1_800_000_000_000;
  const provider=MerAuth.createLocalProvider({usersStorage,sessionStorage,now:()=>now,sessionDurationMs:60000});
  const registration=await provider.register({name:'Ana Horvat',email:'ANA@example.com',password:'sigurna-lozinka-2026'});
  assert.equal(registration.ok,true);assert.equal(registration.session.email,'ana@example.com');
  const persisted=usersStorage.getItem(MerAuth.USERS_KEY);assert.doesNotMatch(persisted,/sigurna-lozinka-2026/);assert.match(persisted,/passwordHash/);
  const fresh=MerAuth.createLocalProvider({usersStorage,sessionStorage,now:()=>now,sessionDurationMs:60000});assert.equal(fresh.currentSession().name,'Ana Horvat');
  assert.equal((await fresh.signIn({email:'ana@example.com',password:'wrong-password'})).ok,false);
  assert.equal((await fresh.signIn({email:'ana@example.com',password:'sigurna-lozinka-2026'})).ok,true);
  now+=60001;assert.equal(fresh.currentSession(),null);
});

test('cycle 1: demo and logout affect session state without deleting local financial data',()=>{
  const usersStorage=new MemoryStorage(),sessionStorage=new MemoryStorage();usersStorage.setItem('mer-money-v6','financial-state');
  const provider=MerAuth.createLocalProvider({usersStorage,sessionStorage});provider.startDemo('Alex Morgan');assert.equal(provider.currentSession().demo,true);provider.signOut();assert.equal(provider.currentSession(),null);assert.equal(usersStorage.getItem('mer-money-v6'),'financial-state');
});

test('cycle 1: Croatian merchant macros categorize every requested vendor family',()=>{
  const current=profile();
  const cases=[['Uber Zagreb','transport'],['HŽ Putnički prijevoz','transport'],['Croatia Airlines','transport'],['Lidl Hrvatska','food'],['Interspar Arena','food'],['Müller Zagreb','healthBeauty'],['Bipa 044','healthBeauty'],['Entrio ulaznice','entertainment'],['CineStar','entertainment'],['HEP Opskrba','utilities'],['Zagreb Holding','utilities']];
  cases.forEach(([description,expected])=>assert.equal(MerCore.autoCategorizeBankTransaction({description,amount:-20},current).category,expected,description));
});

test('cycle 1: CAMT.053 parser keeps credit/debit semantics, statement metadata and malformed-row recovery',()=>{
  const camt=`<?xml version="1.0"?><Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08"><BkToCstmrStmt><Stmt><Acct><Id><IBAN>HR1210010051863000160</IBAN></Id><Svcr><FinInstnId><BICFI>PBZGHR2X</BICFI></FinInstnId></Svcr></Acct><Ntry><Amt Ccy="EUR">63.28</Amt><CdtDbtInd>DBIT</CdtDbtInd><BookgDt><Dt>2026-08-20</Dt></BookgDt><NtryDtls><TxDtls><RmtInf><Ustrd>KONZUM SUPERMARKET</Ustrd></RmtInf></TxDtls></NtryDtls></Ntry><Ntry><Amt Ccy="EUR">4300.00</Amt><CdtDbtInd>CRDT</CdtDbtInd><BookgDt><Dt>2026-08-20</Dt></BookgDt><NtryDtls><TxDtls><RmtInf><Ustrd>PLAĆA KOLOVOZ</Ustrd></RmtInf></TxDtls></NtryDtls></Ntry><Ntry><Amt Ccy="EUR">12</Amt><CdtDbtInd>DBIT</CdtDbtInd></Ntry></Stmt></BkToCstmrStmt></Document>`;
  const result=MerAccounting.parseCamt053(camt,profile());assert.equal(result.reviewRows.length,2);assert.equal(result.invalidRows.length,1);assert.deepEqual(result.reviewRows.map(row=>row.type),['expense','income']);assert.equal(result.reviewRows[0].category,'food');assert.equal(result.reviewRows[0].iban,'HR1210010051863000160');assert.equal(result.reviewRows[0].bic,'PBZGHR2X');
  const committed=MerImport.commitImport(profile(),result.reviewRows,'PBZ-camt053.xml');assert.equal(committed.imported[0].currency,'EUR');assert.equal(committed.imported[0].iban,'HR1210010051863000160');
});

test('cycle 1: PSD2 adapter normalizes the production payload contract',()=>{
  const normalized=MerAccounting.normalizePsd2Transaction('gocardless',{transactionId:'tx-91',transactionAmount:{amount:'18.40',currency:'EUR'},creditDebitIndicator:'DBIT',bookingDate:'2026-08-20',merchantName:'UBER *TRIP'},{id:'acc-1',iban:'HR123',bic:'ZABAHR2X',currency:'EUR'});
  assert.deepEqual(MerAccounting.PSD2_TRANSACTION_FIELDS.filter(field=>normalized[field]===undefined),[]);assert.equal(normalized.accountId,'acc-1');assert.equal(normalized.creditDebitIndicator,'DBIT');assert.equal(normalized.amount,18.4);assert.ok(MerAccounting.SUPPORTED_INSTITUTIONS.some(bank=>bank.id==='zaba'));assert.ok(MerAccounting.SUPPORTED_INSTITUTIONS.some(bank=>bank.id==='wise'));
});

test('cycle 1: round-ups route to one vault and never leak into another profile',()=>{
  const personal=profile(),business=profile();business.goalBuckets[0].id='business-vault';const transaction={id:'p-1',type:'expense',name:'Konzum',amount:12.31,date:'2026-08-20T12:00:00'};
  const entry=MerAccounting.applyRoundUp(personal,transaction);assert.equal(entry.amount,.69);assert.equal(personal.goalBuckets[0].current,10.69);assert.equal(business.goalBuckets[0].current,10);assert.equal(MerAccounting.undoRoundUp(personal,transaction),1);assert.equal(personal.goalBuckets[0].current,10);
});

test('cycle 1: subscription detection recognizes known services and rejects one-off generic merchants',()=>{
  const subscriptions=MerAccounting.detectSubscriptions([{id:1,type:'expense',name:'Netflix',amount:15.49,date:'2026-08-19T12:00:00',category:'entertainment'},{id:2,type:'expense',name:'One-off purchase',amount:90,date:'2026-05-01T12:00:00',category:'other'}],'2026-08-21');
  assert.equal(subscriptions.length,1);assert.equal(subscriptions[0].merchant,'Netflix');assert.equal(subscriptions[0].nextRenewal,'2026-09-19');assert.equal(subscriptions[0].daysUntil,29);
});
