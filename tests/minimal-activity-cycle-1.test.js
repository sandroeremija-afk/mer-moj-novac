'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../core.js');
const Demo = require('../demo-data.js');
const Store = require('../state-store.js');
const normalized = value => value.replace(/\s/g,' ');
const format = (amount,type='expense',options={}) => normalized(Core.formatTransactionAmount({amount,type},{locale:'hr-HR',currency:'EUR',...options}));

test('Activity formats every amount fully with a direction and two decimals',()=>{
  for(const amount of [100,60,40,120])assert.equal(format(amount),`-${amount},00 €`);
  assert.equal(format(1000,'income'),'+1.000,00 €');
  assert.equal(format(12500.5),'-12.500,50 €');
  assert.equal(format(999999999.99),'-999.999.999,99 €');
  assert.equal(format(0),'0 €');
  assert.equal(format(-0,'income'),'0 €');
  assert.equal(format(.01),'-0,01 €');
  assert.equal(format(100,'expense',{categoryBudgetLimit:true}),'-100,00 €','budget-limit exceptions never reach records');
});

test('refunds and corrections preserve their actual signed financial direction',()=>{
  assert.equal(format(-15,'expense'),'+15,00 €');
  assert.equal(format(-15,'income'),'-15,00 €');
  assert.equal(format('12.35'),'-12,35 €');
  assert.equal(format(NaN),'0 €');
  assert.equal(format(Infinity),'0 €');
  assert.equal(format(1000,'income',{locale:'en-IE',currency:'USD'}),'+US$1,000.00');
  assert.equal(format(1000,'income',{locale:'invalid_locale',currency:'XXX-invalid'}),'+1.000,00 €');
  assert.equal(normalized(Core.formatTransactionAmount({amount:10,type:'expense',currency:'USD'},{locale:'hr-HR'})),'-10,00 USD','foreign currency records retain their denomination');
});

test('retired bill ledgers remain inert and profile-isolated in existing cached data',()=>{
  const state=Demo.createDemoAppState(new Date('2026-09-14T12:00:00'));
  const legacy=[{id:'legacy-record',ownerUserId:'user-1',profileId:'personal',participants:[{name:'Ana',amount:20}]}];
  state.accounts.personal.billSplits=structuredClone(legacy);
  const householdLegacy=[{id:'archived-home',ownerUserId:'user-1',profileId:'personal',bills:[{name:'Old shared bill',amountCents:2000}]}];
  state.accounts.personal.enterprise||={};state.accounts.personal.enterprise.households=structuredClone(householdLegacy);
  const store=Store.createStore(state,{referenceDate:'2026-09-14'});
  const before=structuredClone(store.getState().accounts.business.transactions);
  const previous=store.snapshot().totals.net;
  store.update('add-income',draft=>draft.accounts.personal.transactions.push({id:'new-income',type:'income',amount:1000,date:'2026-09-14',category:'salary'}));
  assert.equal(store.snapshot().totals.net,previous+1000);
  assert.deepEqual(store.getState().accounts.personal.billSplits,legacy,'removing the feature does not erase archived user data');
  assert.deepEqual(store.getState().accounts.personal.enterprise.households,householdLegacy,'the older household ledger is also kept inert');
  store.switchAccount('business');
  assert.deepEqual(store.snapshot().profile.transactions,before);
  assert.equal(store.snapshot().profile.billSplits,undefined);
  assert.equal(store.snapshot().profile.enterprise?.households,undefined);
  store.switchAccount('personal');
  assert.deepEqual(store.snapshot().profile.billSplits,legacy);
  assert.deepEqual(store.snapshot().profile.enterprise.households,householdLegacy);
});
