'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Settings = require('../settings-enhancements.js');
const Core = require('../core.js');
const Store = require('../state-store.js');
const Vault = require('../vault-core.js');
const Assistant = require('../assistant-core.js');

const profile = () => ({income:0,bills:0,savingsTarget:0,guard:0,availableBalance:0,categories:[{id:'other',limit:0}],incomeCategories:[{id:'salary'}],transactions:[],goalBuckets:[],savingsEntries:[],recurring:[]});
const values = {firstName:' Ana ',lastName:'Horvat',oib:'01234567890',address:'Ilica 10, Zagreb'};
function makeStore() {
  const state = Core.createAccountStore(profile(),profile(),{activeAccount:'personal'});
  state.settings = {};
  return Store.createStore(state,{referenceDate:'2026-09-16'});
}

test('personal details normalize supported fields and reject unowned or malformed stored data',() => {
  assert.deepEqual(Settings.normalizePersonalData(null),{version:1,ownerId:'',firstName:'',lastName:'',oib:'',address:''});
  const result = Settings.normalizePersonalData({...values,ownerId:'user-a',firstName:' Ana\u0000 ',lastName:'Č'.repeat(120),address:{unsafe:true},verified:true,password:'secret'});
  assert.equal(result.firstName,'Ana');assert.equal(result.lastName.length,80);assert.equal(result.oib,'01234567890');assert.equal(result.address,'');
  assert.equal('verified' in result,false);assert.equal('password' in result,false);
  assert.equal(Settings.normalizePersonalData({...values}).firstName,'');
  for (const oib of ['012345678901','1234','1234567890a',12345678901]) assert.equal(Settings.normalizePersonalData({...values,ownerId:'user-a',oib}).oib,'');
});

test('personal-data updates use the shared reactive store and persist within a user snapshot',() => {
  const store = makeStore(), reasons = [], session = {userId:'user-a'};
  const financialSnapshot = () => JSON.stringify(store.getState().accounts,(key,value) => key === 'updatedAt' ? undefined : value);
  const before = financialSnapshot();
  store.subscribe(event => reasons.push(event.reason));
  assert.equal(Settings.savePersonalData(store,session,values).ok,true);
  assert.deepEqual(reasons,['personal-data-save']);assert.equal(financialSnapshot(),before);
  const persisted = JSON.parse(JSON.stringify(Vault.scopeSnapshot(store.getState(),session.userId)));
  persisted.settings.personalData = Settings.normalizePersonalData(persisted.settings.personalData);
  assert.equal(Settings.personalDataFor(persisted,session).firstName,'Ana');
  store.switchAccount('business');assert.equal(Settings.personalDataFor(store.getState(),session).oib,'01234567890');
  assert.equal(Settings.personalDataFor(persisted,{userId:'user-b'}).firstName,'');
  assert.equal(Settings.personalDataFor(persisted,null).oib,'');
  const secondUserStore = makeStore();assert.equal(Settings.personalDataFor(secondUserStore.getState(),{userId:'user-b'}).address,'');
});

test('invalid or unauthenticated personal-data submissions never mutate state; fields can be cleared',() => {
  const store = makeStore(), session = {userId:'user-a'};
  assert.equal(Settings.savePersonalData(store,null,values).reason,'authentication');
  assert.equal(store.getRevision(),0);
  assert.equal(Settings.savePersonalData(store,session,{...values,oib:'123'}).reason,'validation');
  assert.equal(Settings.savePersonalData(store,session,{...values,firstName:'x'.repeat(81)}).ok,false);
  assert.equal(store.getRevision(),0);
  const empty = {firstName:'',lastName:'',oib:'',address:''};
  Settings.savePersonalData(store,session,values);Settings.savePersonalData(store,session,empty);
  assert.deepEqual(Settings.personalDataFor(store.getState(),session),{version:1,ownerId:session.userId,...empty});
});

test('GDPR snapshot includes personal details in the existing user storage and AI context excludes them',() => {
  const store = makeStore();Settings.savePersonalData(store,{userId:'user-a'},values);
  const portable = Vault.portableSnapshot(store.getState());
  assert.equal(portable.data.settings.personalData.oib,values.oib);
  assert.deepEqual(Assistant.sanitizeFinancialContext({...values,personalData:portable.data.settings.personalData,totalIncome:100,currency:'EUR'}),{currency:'EUR',totalIncome:100});
  const keys = Vault.localUserKeys({length:0},'user-a');
  assert.ok(keys.includes('mer-cache-v1:user-a'));assert.ok(keys.some(key => key.includes('user-a') && key.startsWith(Vault.PREFIX)));
});

test('large rule sets stay bounded with stable order and a clamped final page after deletion',() => {
  const rules = Array.from({length:1003},(_,index) => ({id:`rule-${index}`}));
  const first = Settings.paginateRules(rules), middle = Settings.paginateRules(rules,80), last = Settings.paginateRules(rules,999);
  assert.equal(Settings.RULES_PAGE_SIZE,3);
  assert.equal(first.items.length,3);assert.equal(first.items[0].id,'rule-0');
  assert.equal(middle.items[0].id,'rule-237');assert.equal(middle.items.length,3);
  assert.equal(last.page,335);assert.equal(last.items.length,1);assert.equal(last.start,1003);assert.equal(last.end,1003);
  assert.equal(Settings.paginateRules(rules.slice(0,1000),335).page,334);
  assert.deepEqual(Settings.paginateRules([],5),{items:[],page:1,pages:1,total:0,start:0,end:0});
  assert.equal(Settings.paginateRules(rules,NaN).page,1);assert.equal(Settings.paginateRules(rules,-4).page,1);
  assert.equal(rules.length,1003);
});
