'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Providers = require('../bank-provider.js');
const ui = fs.readFileSync(require.resolve('../engagement-ui.js'), 'utf8');
const app = fs.readFileSync(require.resolve('../app.js'), 'utf8');

function paymentFixture() {
  const nodes = new Map();
  class Element {
    constructor(tag) { this.tagName=tag;this.children=[];this.value='';this.events={};this.hidden=false; }
    append(...children) { this.children.push(...children); }
    set innerHTML(html) {
      this.html=html;
      for(const match of html.matchAll(/<(span|select) id="([^"]+)"/g)) {
        const node=new Element(match[1]);node.id=match[2];nodes.set(node.id,node);this.append(node);
      }
    }
    get innerHTML() { return this.html; }
    addEventListener(name,handler) { this.events[name]=handler; }
    setCustomValidity(value) { this.validation=value; }
    reportValidity() { this.reported=true;return !this.validation; }
    change(value) { this.value=value;this.events.change?.(); }
  }
  const details=new Element('div');
  nodes.set('transactionModal',{querySelector:selector=>selector==='.transaction-details-row'?details:null});
  const appState={activeAccount:'personal',bankConnections:[
    {id:'personal-card',profileId:'personal',institution:'Revolut',accountName:'Visa',accountMask:'••1234',status:'connected'},
    {id:'business-card',profileId:'business',institution:'PBZ',accountName:'Business',accountMask:'••9876',status:'connected'},
    {id:'removed-card',profileId:'personal',institution:'Old',status:'disconnected'}
  ]};
  const state={sessionId:'session-a',authenticated:true,language:'hr'};
  const context={appState,document:{createElement:tag=>new Element(tag)},el:id=>nodes.get(id),
    window:{MerBankProviders:Providers},snapshot:()=>state,identity:()=>`${state.sessionId}|${appState.activeAccount}`,
    say:(hr,en)=>state.language==='en'?en:hr,
    esc:value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
  vm.createContext(context);
  const start=ui.indexOf("  const payment=document.createElement('label');"),end=ui.indexOf('  const oldRenderAll=renderAll;',start);
  assert.ok(start>0&&end>start);
  vm.runInContext(ui.slice(start,end),context);
  context.resetPayment();
  return {...context,details,get:id=>nodes.get(id),session:state};
}

test('card selection offers only this profile’s connected accounts plus explicitly manual bank choices',()=>{
  const h=paymentFixture(),before=JSON.stringify(h.appState);
  assert.equal(h.details.children.length,2,'both payment fields live inside the compact details grid');
  assert.equal(h.details.children[1].hidden,true);
  h.get('transactionPaymentMethod').change('card');
  const select=h.get('transactionCard');
  assert.equal(h.details.children[1].hidden,false);assert.equal(select.required,true);assert.equal(select.disabled,false);
  assert.match(select.innerHTML,/connection:personal-card/);assert.match(select.innerHTML,/Revolut · Visa · ••1234/);
  assert.doesNotMatch(select.innerHTML,/business-card|9876|removed-card/);
  for(const bank of ['zaba','revolut','pbz','erste'])assert.match(select.innerHTML,new RegExp(`manual:${bank}-demo`));
  assert.match(select.innerHTML,/Ručni odabir banke/);assert.match(select.innerHTML,/ručni odabir/);
  assert.equal(select.value,'','choosing Card never silently chooses a bank');
  assert.equal(h.readPaymentCard(),null,'a card requires an explicit choice');
  select.change('manual:zaba-demo');assert.equal(h.readPaymentCard(),'manual:zaba-demo');
  assert.equal(JSON.stringify(h.appState),before,'selecting a source never changes financial or connection state');
});

test('card references restore on edit, clear for non-card/new entries, and reject stale or forged selections',()=>{
  const h=paymentFixture(),select=h.get('transactionCard');
  h.resetPayment({paymentMethod:'card',cardReference:'manual:erste-demo'});assert.equal(select.value,'manual:erste-demo');
  h.resetPayment({paymentMethod:'card',connectionId:'personal-card'});assert.equal(select.value,'connection:personal-card','an existing imported card can identify its current linked account');
  h.get('transactionPaymentMethod').change('cash');assert.equal(select.value,'');assert.equal(select.required,false);assert.equal(select.disabled,true);assert.equal(h.readPaymentCard(),'');
  h.resetPayment({paymentMethod:'card',cardReference:'manual:revolut-demo'});
  h.resetPayment();assert.equal(select.value,'');assert.equal(h.get('transactionPaymentMethod').value,'transfer');
  h.resetPayment({paymentMethod:'card',cardReference:'connection:business-card'});assert.equal(select.value,'');
  for(const value of ['connection:business-card','manual:unknown','manual:zaba-demo<script>','connection:'+'x'.repeat(101)]) {
    select.value=value;assert.equal(h.readPaymentCard(),null);
  }
  h.resetPayment({paymentMethod:'card',cardReference:'connection:personal-card'});
  h.appState.bankConnections=[];assert.equal(h.readPaymentCard(),null,'unlinked accounts cannot be saved from a stale menu');
  h.resetPayment({paymentMethod:'card',cardReference:'manual:zaba-demo'});
  h.session.sessionId='session-b';assert.equal(h.readPaymentCard(),null,'a session change invalidates the old form');
  h.resetPayment({paymentMethod:'card',cardReference:'manual:zaba-demo'});
  h.appState.activeAccount='business';assert.equal(h.readPaymentCard(),null,'profile changes cannot reuse a previous selection');
  h.resetPayment();assert.equal(select.value,'');
  assert.match(ui,/paymentOwner!==identity\(\)\|\|!context.authenticated\)resetPayment\(\)/);
});

test('payment labels are plain Card and keep provider names as escaped text',()=>{
  const h=paymentFixture();
  h.appState.bankConnections[0].accountName='<img src=x onerror=alert(1)>';
  h.get('transactionPaymentMethod').change('card');
  assert.doesNotMatch(h.get('transactionCard').innerHTML,/<img/);assert.match(h.get('transactionCard').innerHTML,/&lt;img/);
  assert.doesNotMatch(ui,/Kartica · zaokruživanje|Card · roundup/);
  assert.match(ui,/say\('Kartica','Card'\)/);
  assert.doesNotMatch(ui,/MerNaturalInputUI/);assert.doesNotMatch(app,/MerNaturalInputUI/);
});

function submitFixture({method='card',reference='manual:zaba-demo',existing=null}={}) {
  const nodes=new Map(Object.entries({transactionAmount:{value:'15'},transactionName:{value:'Synthetic shop'},transactionDate:{value:'2026-09-30'},
    spendCheck:{dataset:{}},transactionCategory:{value:'food'},transactionPaymentMethod:{value:method},transactionModal:{}}));
  let submit;
  nodes.set('transactionForm',{addEventListener(_event,callback){submit=callback;}});
  const state={transactions:existing?[existing]:[]},events=[];
  const context={window:{MerEngagementUI:{readPaymentCard:()=>reference}},transactionType:'expense',editingTransactionId:existing?.id??null,
    $:selector=>selector.startsWith('[data-transaction-type]')?{dataset:{transactionType:'expense'}}:nodes.get(selector.slice(1)),
    state,appState:{activeAccount:'personal',settings:{currency:'EUR'}},currentLang:'hr',appReferenceDate:'2026-09-30',navigator:{onLine:true},
    validStoredDate:()=>true,evaluateTransaction:()=>true,showToast:message=>events.push(['toast',message]),t:key=>key,currency:value=>String(value),
    MerAccounting:{undoRoundUp:()=>events.push(['undo']),applyRoundUp:()=>events.push(['roundup'])},MerCore:{updateTransactionSchedule:tx=>tx},
    save:reason=>events.push(['save',reason]),closeModal:()=>events.push(['close']),uniqueId:()=> 'synthetic-new'};
  vm.createContext(context);
  const start=app.indexOf("$('#transactionForm').addEventListener('submit',event=>{");
  const end=app.indexOf("$('#deleteTransaction').addEventListener",start);
  vm.runInContext(app.slice(start,end),context);
  return {state,events,submit:()=>submit({preventDefault(){}})};
}

test('submit persists a separate card reference without pretending a manual source is a bank connection',()=>{
  const h=submitFixture();h.submit();
  const saved=h.state.transactions[0];assert.equal(saved.cardReference,'manual:zaba-demo');assert.equal(saved.paymentMethod,'card');
  assert.equal(saved.sourceType,'manual');assert.equal(saved.source,'Manual');assert.equal(saved.connectionId,undefined);
  assert.equal(h.events.filter(([kind])=>kind==='save').length,1);
});

test('invalid card choice cannot mutate money; editing preserves sync identity and removes card data for cash',()=>{
  const existing={id:'synthetic-auto',name:'Synthetic bank entry',amount:12,type:'expense',category:'food',date:'2026-09-29',sourceType:'auto',source:'Auto: Revolut',connectionId:'personal-card',cardReference:'connection:personal-card',paymentMethod:'card'};
  const rejected=submitFixture({reference:null,existing:{...existing}});rejected.submit();
  assert.deepEqual(rejected.state.transactions[0],existing);assert.ok(rejected.events.every(([kind])=>kind==='toast'),'validation precedes roundup undo and saving');
  const changed=submitFixture({method:'cash',existing:{...existing}});changed.submit();
  const saved=changed.state.transactions[0];assert.equal(saved.paymentMethod,'cash');assert.equal(saved.cardReference,undefined);
  assert.equal(saved.connectionId,'personal-card');assert.equal(saved.sourceType,'auto');assert.equal(saved.source,'Auto: Revolut');
  assert.match(app,/transaction.paymentMethod!=='card'[^\n]*delete transaction.cardReference/,'restored metadata is sanitized');
});
