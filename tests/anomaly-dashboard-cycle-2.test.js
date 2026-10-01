'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Anomalies = require('../anomaly-core.js');
const Core = require('../core.js');
const ui = fs.readFileSync(require.resolve('../anomaly-ui.js'),'utf8');
const fixture = (amount = 130) => ({profileId:'personal',currency:'EUR',categories:[{id:'food',name:'Hrana'}],transactions:[
  {id:'baseline',type:'expense',date:'2026-08-15',amount:400,currency:'EUR',category:'food'},
  {id:'current',type:'expense',date:'2026-09-18',amount,currency:'EUR',category:'food'}
]});

class Element {
  constructor() { this.children=[];this.attributes={};this.hidden=false;this.textContent=''; }
  set innerHTML(_value) { throw new Error('Category content must never enter notification markup'); }
  replaceChildren(...children) { this.textContent='';this.children=children; }
  setAttribute(key,value) { this.attributes[key]=String(value); }
}

function harness(profile = fixture(), storage = new Map()) {
  const host=new Element(),button=new Element(),badge=new Element(),shell=new Element(),calls=[];
  button.querySelector=selector=>selector==='.assistant-fab-status'?badge:null;
  const context={
    window:{MerAnomalies:Anomalies,MerCore:Core,MerFinancialAssistant:{ask:()=>calls.push('ask')},fetch:()=>calls.push('fetch'),
      MerAuthProvider:{currentSession:()=>context.session},
      MerEnterpriseSecurity:{isLocked:()=>context.locked},
      localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}},
    session:{userId:'synthetic-user-one'},locked:false,mfaLocked:false,
    state:profile,appReferenceDate:'2026-09-18',currentLang:'hr',
    appState:{activeAccount:'personal',settings:{currency:'EUR',timezone:'Europe/Zagreb',hideBalances:false}},
    reactiveStore:{snapshot:()=>({profile:context.state})},t:key=>key,
    document:{querySelector:selector=>({'#spendingAnomalyAlert':host,'#assistantFab':button,'#appShell':shell}[selector]||null),body:{classList:{contains:()=>context.mfaLocked}}}
  };
  vm.createContext(context);
  const assistantSource=fs.readFileSync(require.resolve('../assistant-ui.js'),'utf8');
  vm.runInContext(assistantSource.slice(assistantSource.indexOf('  function anomalyBatchFor('),assistantSource.indexOf('  function renderMessages(')),context);
  context.window.MerAssistantUi={anomalyBatch:()=>context.anomalyBatchFor(context.appState.activeAccount)};
  vm.runInContext(ui,context);
  return {context,host,button,badge,shell,calls,storage,refresh:()=>context.window.MerAnomalyUI.refresh(),markRead:()=>context.window.MerAnomalyUI.markRead()};
}

test('a private unread chat badge replaces the dashboard alert at exactly 30 percent and clears below the threshold', () => {
  const {context,host,button,badge,refresh}=harness();
  assert.equal(host.hidden,true);assert.equal(host.children.length,0);
  assert.equal(badge.hidden,false);assert.equal(badge.textContent,'1');
  assert.match(button.attributes['aria-label'],/Otvori AI financijskog asistenta.*Nova poruka Mer AI/);
  context.currentLang='en';refresh();
  assert.match(button.attributes['aria-label'],/Open AI financial assistant.*New Mer AI message/);
  context.state.transactions[1].amount=129.99;refresh();
  assert.equal(badge.hidden,true);assert.equal(badge.textContent,'');
  assert.equal(button.attributes['aria-label'],'Open AI financial assistant');
  context.state.transactions[1].amount=150;refresh();
  assert.equal(badge.hidden,false);
});

test('a zero baseline or incomplete historical window never creates an unread message', () => {
  const empty=harness({profileId:'personal',currency:'EUR',categories:[],transactions:[]});
  assert.equal(empty.badge.hidden,true);
  const {context,badge,refresh}=harness();
  context.state.transactions[0].amount=0;refresh();assert.equal(badge.hidden,true);
  context.state.transactions[0].amount=400;context.state.transactions[0].date='2026-08-16';refresh();assert.equal(badge.hidden,true);
  context.state.transactions[0].date='2026-08-15';refresh();assert.equal(badge.hidden,false);
});

test('badge labels never expose category names, markup, amounts or percentages, including outside privacy mode', () => {
  const profile=fixture();profile.categories[0].name='<img src=x onerror="alert(1)">';
  const {context,host,button,badge,refresh,storage}=harness(profile);
  for(const language of ['hr','en']) for(const privateMode of [false,true]) {
    context.currentLang=language;context.appState.settings.hideBalances=privateMode;refresh();
    assert.equal(badge.hidden,false);
    assert.doesNotMatch(JSON.stringify(button.attributes)+badge.textContent+host.textContent,/img|alert|130|100|30%|€/);
  }
  assert.equal(storage.size,0,'rendering does not acknowledge the message');
});

test('acknowledgement survives rerenders and reloads, while changed aggregate facts create a new unread message', () => {
  const {context,badge,refresh,markRead,storage,calls}=harness();
  refresh();refresh();assert.equal(badge.hidden,false);
  markRead();refresh();refresh();assert.equal(badge.hidden,true);
  assert.equal(storage.size,1);
  for(const [key,value] of storage) {
    assert.match(key,/^mer-anomaly-read-v1:tx-[a-f0-9]{8}$/);
    assert.match(value,/^tx-[a-f0-9]{8}$/,'persistent metadata contains only a fingerprint, not financial text');
  }
  const reloaded=harness(fixture(),storage);assert.equal(reloaded.badge.hidden,true);
  context.currentLang='en';context.appState.settings.hideBalances=true;context.state.categories[0].name='Food';refresh();
  assert.equal(badge.hidden,true,'localization, privacy and renaming do not duplicate a message');
  context.state.transactions[1].amount=160;refresh();assert.equal(badge.hidden,false);
  markRead();assert.equal(badge.hidden,true);
  context.state.transactions.push({id:'second-past',type:'expense',date:'2026-08-15',amount:400,currency:'EUR',category:'travel'},{id:'second-now',type:'expense',date:'2026-09-18',amount:135,currency:'EUR',category:'travel'});
  refresh();assert.equal(badge.hidden,false,'a new secondary anomaly also creates a notification');
  assert.deepEqual(calls,[],'notification and acknowledgement never call AI or the network');
});

test('read state is isolated by authenticated user and profile; currency and date changes cannot leave a stale badge', () => {
  const personal=fixture(),{context,badge,refresh,markRead}=harness(personal);
  markRead();assert.equal(badge.hidden,true);
  context.appState.activeAccount='business';context.state={...fixture(),profileId:'business'};refresh();assert.equal(badge.hidden,false);
  markRead();context.appState.activeAccount='personal';context.state=personal;refresh();assert.equal(badge.hidden,true);
  context.session={userId:'synthetic-user-two'};refresh();assert.equal(badge.hidden,false);
  context.appState.settings.currency='USD';refresh();assert.equal(badge.hidden,true);
  context.appState.settings.currency='EUR';context.appReferenceDate='2026-09-25';refresh();assert.equal(badge.hidden,true);
  context.appReferenceDate='2026-09-18';refresh();assert.equal(badge.hidden,false);
  context.session={userId:'synthetic-user-one'};refresh();assert.equal(badge.hidden,true);
});

test('logout, hidden app shell and both lock states suppress unread notifications without consuming them', () => {
  const {context,badge,shell,refresh,storage}=harness();
  context.session=null;refresh();assert.equal(badge.hidden,true);
  context.session={userId:'synthetic-user-one'};shell.hidden=true;refresh();assert.equal(badge.hidden,true);
  shell.hidden=false;context.locked=true;refresh();assert.equal(badge.hidden,true);
  context.locked=false;context.mfaLocked=true;refresh();assert.equal(badge.hidden,true);
  context.mfaLocked=false;refresh();assert.equal(badge.hidden,false);
  assert.equal(storage.size,0);
});

test('unavailable browser storage keeps acknowledgement functional in memory', () => {
  const {context,badge,refresh,markRead}=harness();
  Object.defineProperty(context.window,'localStorage',{get(){throw new Error('Storage blocked');}});
  assert.doesNotThrow(refresh);assert.equal(badge.hidden,false);
  assert.doesNotThrow(markRead);refresh();assert.equal(badge.hidden,true);
  context.state.transactions[1].amount=150;refresh();assert.equal(badge.hidden,false);
});

test('the unread fingerprint covers exactly the sanitized five-category batch rendered by the chat', () => {
  const profile=fixture();profile.transactions=[];profile.categories=[];
  for(let index=0;index<6;index++) {
    const category='category-'+index;
    profile.categories.push({id:category,name:'Kategorija '+index});
    profile.transactions.push({id:'past-'+index,type:'expense',date:'2026-08-15',amount:400,currency:'EUR',category},{id:'now-'+index,type:'expense',date:'2026-09-18',amount:200-index*10,currency:'EUR',category});
  }
  const {context,badge,refresh,markRead}=harness(profile);
  const batch=context.window.MerAssistantUi.anomalyBatch();
  assert.equal(batch.length,5);assert.deepEqual(Array.from(batch,item=>item.categoryId),['category-0','category-1','category-2','category-3','category-4']);
  markRead();assert.equal(badge.hidden,true);
  profile.transactions.find(item=>item.id==='now-5').amount=151;refresh();assert.equal(badge.hidden,true,'a changed sixth category is not part of the displayed batch');
  profile.transactions.find(item=>item.id==='now-5').amount=165;refresh();assert.equal(badge.hidden,false,'the newly visible fifth category makes the rendered batch unread');
  assert.ok(context.window.MerAssistantUi.anomalyBatch().some(item=>item.categoryId==='category-5'));
  profile.categories[0].name='\u0000';markRead();assert.equal(context.window.MerAssistantUi.anomalyBatch().length,4,'a sanitizer-rejected label is not included in the badge fingerprint');
  profile.transactions.find(item=>item.id==='now-0').amount=210;refresh();assert.equal(badge.hidden,true,'changing a sanitizer-rejected row cannot create an invisible notification');
});

test('the real premium renderAll wrapper refreshes the notification after the rest of the dashboard', () => {
  const source=fs.readFileSync(require.resolve('../premium.js'),'utf8');
  const start=source.indexOf('  function renderPremium()');
  const lastLine=source.indexOf('  renderAll=function renderAllWithPremium()',start);
  assert.ok(start>=0 && lastLine>start);
  const code=source.slice(start,source.indexOf('\n',lastLine));
  const {context,badge}=harness(),order=[];
  context.applyPrivacy=()=>order.push('privacy');context.renderGoals=()=>order.push('goals');context.$=()=>({open:false});context.renderAll=()=>order.push('dashboard');
  context.window.MerExportUI={refresh:()=>order.push('export')};context.window.MerVaultsUI={refresh:()=>order.push('vaults')};context.window.MerSavingsMinimal={refresh:()=>order.push('savings')};
  const originalRefresh=context.window.MerAnomalyUI.refresh;
  context.window.MerAnomalyUI={refresh:()=>{order.push('anomaly');originalRefresh();}};
  vm.runInContext(code,context);
  context.state.transactions[1].amount=100;context.renderAll();
  assert.deepEqual(order,['dashboard','privacy','goals','export','vaults','savings','anomaly']);assert.equal(badge.hidden,true);
  context.state.transactions[1].amount=130;context.renderAll();assert.equal(badge.hidden,false);assert.equal(order.at(-1),'anomaly');
  context.appState.activeAccount='business';context.state={profileId:'business',transactions:[],categories:[]};context.renderAll();assert.equal(badge.hidden,true);
});

test('production loads notification dependencies in order and no longer includes the dashboard anomaly card', () => {
  const html=fs.readFileSync(require.resolve('../index.html'),'utf8'),build=fs.readFileSync(require.resolve('../scripts/build.js'),'utf8'),css=fs.readFileSync(require.resolve('../styles.css'),'utf8');
  const scripts=[...html.matchAll(/<script\b[^>]*src="([^"?]+)(?:\?[^"]*)?"/g)].map(match=>match[1]);
  const index=name=>{assert.ok(scripts.includes(name));return scripts.indexOf(name);};
  assert.ok(index('core.js')<index('anomaly-core.js'));assert.ok(index('anomaly-core.js')<index('assistant-core.js'));assert.ok(index('assistant-ui.js')<index('anomaly-ui.js'));assert.ok(index('app.js')<index('anomaly-ui.js'));
  for(const file of ['anomaly-core.js','anomaly-ui.js']) assert.ok(build.includes("'"+file+"'"));
  assert.doesNotMatch(html,/id="spendingAnomalyAlert"/);
  assert.match(html,/<span class="assistant-fab-status" aria-hidden="true" hidden><\/span>/);
  assert.match(css,/\.assistant-fab-status\[hidden\]\s*\{\s*display:none/);
});
