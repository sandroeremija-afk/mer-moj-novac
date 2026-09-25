'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Vaults=require('../vaults-core.js'),Store=require('../state-store.js');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const reference='2026-09-18';
const profile=(id='personal')=>({profileId:id,transactions:[],savingsEntries:[],categories:[],financialOpeningBalance:1000,goalBuckets:[{id:`${id}-goal`,name:'Pričuva',current:100,target:1000}],enterprise:{}});
const purchase=(id,amount,extra={})=>({id,amount,profileId:'personal',date:reference,type:'expense',currency:'EUR',paymentMethod:'card',status:'posted',...extra});
const configure=(p,enabled=true,increment=2)=>Vaults.configureRoundUps(p,{enabled,increment,goalId:p.goalBuckets[0].id},reference,{profileId:p.profileId});

test('removed visualizer is absent from page, renderer, build and validation entry points',()=>{
  for(const file of ['index.html','premium.js','scripts/build.js','scripts/preflight.js'])assert.doesNotMatch(read(file),/micro-savings-ui|MerMicroSavings|microSavingsCard/,file);
  for(const file of ['micro-savings-ui.js','micro-savings-ui.css'])assert.equal(fs.existsSync(path.join(__dirname,'..',file)),false,file);
  assert.equal(Vaults.roundUpProjection,undefined);
  const html=read('index.html'),layout=html.match(/<section class="savings-layout">([\s\S]*?)<\/section>/)?.[1];
  assert.ok(layout);assert.match(layout,/class="panel contribution-panel savings-history-card savings-top-card"/);assert.match(layout,/id="savingsRecommendationCard"/);
  assert.equal((layout.match(/<(?:article|aside)\b/g)||[]).length,2);
  assert.match(read('styles.css'),/#savingsView \.savings-top-card\s*\{\s*grid-column:span 2;/);
  assert.match(read('premium.js'),/MerVaultsUI\?\.refresh\(\)/);
  assert.match(read('premium.js'),/MerAnomalyUI\?\.refresh\(\)/);
});

test('stored EUR 2 rules and funded entries survive reload without the visualizer',()=>{
  const p=profile();p.savingsEntries=[{id:'manual',profileId:'personal',goalId:'personal-goal',date:reference,amount:100,sourceType:'manual'}];
  p.transactions=[purchase('history',2.01)];assert.equal(configure(p).valid,true);
  p.transactions.push(purchase('funded',2.01));Vaults.reconcileRoundUps(p,reference);
  const persisted=JSON.parse(JSON.stringify(p)),configBefore=structuredClone(persisted.enterprise.roundUps),entriesBefore=structuredClone(persisted.savingsEntries);
  const business=profile('business'),store=Store.createStore({activeAccount:'personal',accounts:{personal:persisted,business},settings:{currency:'EUR'}},{referenceDate:reference});
  assert.deepEqual(persisted.enterprise.roundUps,configBefore);assert.deepEqual(persisted.savingsEntries,entriesBefore);
  assert.equal(persisted.savingsBalance,101.99);assert.equal(persisted.goalBuckets[0].current,101.99);
  assert.equal(persisted.enterprise.roundUps.increment,2);assert.equal(persisted.goalBuckets[0].roundUpIncrement,2);
  assert.equal(persisted.savingsEntries.some(entry=>entry.roundUpForTransactionId==='history'),false);
  store.update('edit-funded-purchase',(_draft,active)=>active.transactions.find(tx=>tx.id==='funded').amount=3.99);
  assert.equal(persisted.savingsBalance,100.01);assert.equal(persisted.savingsEntries.find(entry=>entry.id==='manual').amount,100);
  assert.equal(business.goalBuckets[0].current,100);assert.equal(business.enterprise.roundUps,undefined);
});

test('existing vault controls retain EUR 2 support, pause and forward-only resume',()=>{
  assert.equal(Vaults.roundUpAmount(2.01,2),1.99);assert.equal(Vaults.roundUpAmount(3.4,2),.6);assert.equal(Vaults.roundUpAmount(4,2),0);
  assert.match(read('vaults-ui.js'),/roundUnit\.innerHTML=\[1,2,5\]/);
  const p=profile();configure(p);p.transactions.push(purchase('first',2.01));Vaults.reconcileRoundUps(p,reference);
  configure(p,false);p.transactions.push(purchase('paused',2.01));Vaults.reconcileRoundUps(p,reference);
  assert.equal(p.goalBuckets[0].current,101.99);
  configure(p);Vaults.reconcileRoundUps(p,reference);assert.equal(p.goalBuckets[0].current,101.99);
  p.transactions.push(purchase('resumed',3.99));Vaults.reconcileRoundUps(p,reference);assert.equal(p.goalBuckets[0].current,102);
});

test('pending, cancelled, cash, foreign-currency and other-profile purchases remain excluded',()=>{
  const p=profile();configure(p);
  const store=Store.createStore({activeAccount:'personal',accounts:{personal:p,business:profile('business')},settings:{currency:'EUR'}},{referenceDate:reference});
  store.update('add-ineligible',(_draft,active)=>active.transactions.push(
    purchase('pending',2.01,{status:'pending'}),purchase('cancelled',2.01,{status:'cancelled'}),purchase('cash',2.01,{paymentMethod:'cash'}),
    purchase('foreign',2.01,{currency:'USD'}),purchase('other-profile',2.01,{profileId:'business'}),purchase('future',2.01,{date:'2026-10-01',status:'scheduled'})
  ));
  assert.equal(p.savingsEntries.length,0);assert.equal(p.goalBuckets[0].current,100);
  assert.equal(p.transactions.find(tx=>tx.id==='pending').status,'pending');
  assert.equal(p.transactions.find(tx=>tx.id==='cancelled').status,'cancelled');
});
