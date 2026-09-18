'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Anomalies = require('../anomaly-core.js');
const ui = fs.readFileSync(require.resolve('../anomaly-ui.js'),'utf8');
const fixture = (amount = 130) => ({profileId:'personal',currency:'EUR',categories:[{id:'food',name:'Hrana'}],transactions:[
  {id:'baseline',type:'expense',date:'2026-08-15',amount:400,currency:'EUR',category:'food'},
  {id:'current',type:'expense',date:'2026-09-18',amount,currency:'EUR',category:'food'}
]});

class Element {
  constructor(tagName) { this.tagName=tagName;this.children=[];this.attributes={};this.listeners=new Map();this.hidden=false;this.value=''; }
  set textContent(value) { this.value=String(value);this.children=[]; }
  get textContent() { return this.value+this.children.map(child=>child.textContent).join(''); }
  set innerHTML(_value) { throw new Error('Category content must be rendered as text'); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.value='';this.children=children; }
  setAttribute(key,value) { this.attributes[key]=String(value); }
  addEventListener(name,callback) { const callbacks=this.listeners.get(name)||[];callbacks.push(callback);this.listeners.set(name,callbacks); }
  dispatch(name,event) { for(const callback of this.listeners.get(name)||[]) callback(event); }
}

function harness(profile = fixture()) {
  const host=new Element('aside'), created=[], calls=[];
  const context={
    window:{MerAnomalies:Anomalies,MerAssistantUi:{open:()=>calls.push('open')}},MerAnomalies:Anomalies,
    state:profile,appReferenceDate:'2026-09-18',currentLang:'hr',
    appState:{activeAccount:'personal',settings:{currency:'EUR',timezone:'Europe/Zagreb',hideBalances:false}},
    document:{querySelector:selector=>selector==='#spendingAnomalyAlert'?host:null,createElement:tag=>{const element=new Element(tag);created.push(element);return element;}},
    categoryName:id=>context.state.categories.find(item=>item.id===id)?.name || (context.currentLang==='en'?'Other':'Ostalo')
  };
  vm.createContext(context);vm.runInContext(ui,context);
  return {context,host,created,calls,refresh:()=>context.window.MerAnomalyUI.refresh()};
}

test('dashboard alert appears at exactly 30 percent, localizes and disappears immediately below the threshold', () => {
  const {context,host,refresh}=harness();
  assert.equal(host.hidden,false);
  assert.match(host.textContent,/Promjena u obrascu potrošnje/);
  assert.match(host.textContent,/Hrana: \+30%.*7 dana.*4 tjedna/);
  assert.equal(host.children[1].textContent,'Pitaj Mer AI');
  context.currentLang='en';context.state.categories[0].name='Food';refresh();
  assert.match(host.textContent,/A change in your spending pattern/);
  assert.match(host.textContent,/Food: \+30%.*last 7 days.*preceding 4 weeks/);
  assert.equal(host.children[1].textContent,'Ask Mer AI');
  context.state.transactions[1].amount=129.99;refresh();
  assert.equal(host.hidden,true);assert.equal(host.children.length,0);assert.equal(host.textContent,'');
  context.state.transactions[1].amount=150;refresh();
  assert.equal(host.hidden,false);assert.match(host.textContent,/\+50%/);
});

test('a zero baseline or incomplete historical window never creates a dashboard alert', () => {
  const empty=harness({profileId:'personal',currency:'EUR',categories:[],transactions:[]});
  assert.equal(empty.host.hidden,true);
  const {context,host,refresh}=harness();
  context.state.transactions[0].amount=0;refresh();
  assert.equal(host.hidden,true);assert.equal(host.children.length,0);
  context.state.transactions[0].amount=400;context.state.transactions[0].date='2026-08-16';refresh();
  assert.equal(host.hidden,true);assert.equal(host.textContent,'');
  context.state.transactions[0].date='2026-08-15';refresh();
  assert.equal(host.hidden,false);
});

test('privacy mode replaces category and numerical details in both languages and restores fresh data when disabled', () => {
  const {context,host,refresh}=harness();
  for (const lang of ['hr','en']) {
    context.currentLang=lang;context.appState.settings.hideBalances=true;refresh();
    assert.equal(host.hidden,false);
    assert.doesNotMatch(host.textContent,/Hrana|130|100|30|%|€/);
    assert.match(host.textContent,lang==='en'?/Higher category spending/:/Povećana potrošnja u kategoriji/);
  }
  context.appState.settings.hideBalances=false;context.state.transactions[1].amount=160;refresh();
  assert.match(host.textContent,/Hrana: \+60%/);
});

test('switching profile, currency, or comparison day removes stale alert content', () => {
  const personal=fixture(), {context,host,refresh}=harness(personal);
  context.appState.activeAccount='business';context.state={profileId:'business',currency:'EUR',categories:[],transactions:[]};refresh();
  assert.equal(host.hidden,true);assert.equal(host.textContent,'');
  context.appState.activeAccount='personal';context.state=personal;refresh();
  assert.equal(host.hidden,false);
  context.appState.settings.currency='USD';refresh();
  assert.equal(host.hidden,true);assert.equal(host.children.length,0);
  context.appState.settings.currency='EUR';context.appReferenceDate='2026-09-25';refresh();
  assert.equal(host.hidden,true);assert.equal(host.textContent,'');
});

test('the alert button stops the outside-click handler and opens Mer AI once without an automatic AI request', () => {
  const {context,host,calls,refresh}=harness();
  assert.equal(calls.length,0);
  refresh();refresh();
  const button=host.children[1], event={stopped:false,stopPropagation(){this.stopped=true;calls.push('stop');}};
  assert.equal(button.tagName,'button');assert.equal(button.type,'button');
  button.dispatch('click',event);
  if (!event.stopped) calls.push('outside-close');
  assert.deepEqual(calls,['stop','open']);
  assert.equal(context.window.MerFinancialAssistant,undefined,'the dashboard renderer does not need an AI request adapter');
});

test('imported category markup stays inert text and cannot create extra controls or executable elements', () => {
  const profile=fixture();profile.categories[0].name='<img src=x onerror="alert(1)">';
  const {host,created}=harness(profile);
  assert.equal(host.hidden,false);
  assert.match(host.children[0].children[1].textContent,/<img src=x onerror="alert\(1\)">/);
  assert.deepEqual(created.map(element=>element.tagName),['div','strong','p','button']);
  assert.equal(created.filter(element=>element.tagName==='button').length,1);
});

test('the real premium renderAll wrapper refreshes the anomaly after the rest of the dashboard', () => {
  const source=fs.readFileSync(require.resolve('../premium.js'),'utf8');
  const start=source.indexOf('  function renderPremium()');
  const lastLine=source.indexOf('  renderAll=function renderAllWithPremium()',start);
  assert.ok(start>=0 && lastLine>start);
  const code=source.slice(start,source.indexOf('\n',lastLine));
  const {context,host}=harness(), order=[];
  context.applyPrivacy=()=>order.push('privacy');
  context.renderGoals=()=>order.push('goals');
  context.$=()=>({open:false});
  context.renderAll=()=>order.push('dashboard');
  context.window.MerExportUI={refresh:()=>order.push('export')};
  context.window.MerVaultsUI={refresh:()=>order.push('vaults')};
  context.window.MerSavingsMinimal={refresh:()=>order.push('savings')};
  const originalRefresh=context.window.MerAnomalyUI.refresh;
  context.window.MerAnomalyUI={refresh:()=>{order.push('anomaly');originalRefresh();}};
  vm.runInContext(code,context);
  context.state.transactions[1].amount=100;
  context.renderAll();
  assert.deepEqual(order,['dashboard','privacy','goals','export','vaults','savings','anomaly']);
  assert.equal(host.hidden,true);
  context.state.transactions[1].amount=130;context.renderAll();
  assert.equal(host.hidden,false);
  assert.equal(order.at(-1),'anomaly');
  context.appState.activeAccount='business';context.state={profileId:'business',transactions:[],categories:[]};context.renderAll();
  assert.equal(host.hidden,true);assert.equal(host.children.length,0);
});

test('dashboard anomaly dependencies are loaded in usable order and included in the production build', () => {
  const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
  const build=fs.readFileSync(require.resolve('../scripts/build.js'),'utf8');
  const scripts=[...html.matchAll(/<script\b[^>]*src="([^"?]+)(?:\?[^\"]*)?"/g)].map(match=>match[1]);
  const index=name=>{assert.ok(scripts.includes(name),`${name} is loaded`);return scripts.indexOf(name);};
  assert.ok(index('core.js')<index('anomaly-core.js'));
  assert.ok(index('anomaly-core.js')<index('assistant-core.js'));
  assert.ok(index('assistant-ui.js')<index('anomaly-ui.js'));
  assert.ok(index('app.js')<index('anomaly-ui.js'));
  for (const file of ['anomaly-core.js','anomaly-ui.js']) assert.ok(build.includes(`'${file}'`),`${file} is included in the production assets`);
  assert.match(html,/<aside\b[^>]*id="spendingAnomalyAlert"[^>]*aria-live="polite"[^>]*hidden/);
});
