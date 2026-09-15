'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Core = require('../core.js');
const Accounting = require('../accounting-core.js');
const Enterprise = require('../enterprise-core.js');
const appSource = fs.readFileSync(require.resolve('../app.js'), 'utf8');
const enterpriseSource = fs.readFileSync(require.resolve('../enterprise-ui.js'), 'utf8');
const renderSource = appSource.slice(appSource.indexOf('function activeSubscriptions() {'), appSource.indexOf('\nfunction renderCategorySelects()'));
assert.ok(renderSource.startsWith('function activeSubscriptions()') && renderSource.includes('function renderSubscriptions()'), 'execute the real profile selector and subscription renderer');

const escape = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const series = (merchant, previous = 10, amount = 12, profileId = 'personal', currency = 'EUR') => [
  {id:`${merchant}-${currency}-aug`, date:'2026-08-10', amount:previous, name:merchant, merchantName:merchant, type:'expense', category:'entertainment', profileId, currency},
  {id:`${merchant}-${currency}-sep`, date:'2026-09-10', amount, name:merchant, merchantName:merchant, type:'expense', category:'entertainment', profileId, currency}
];

function harness(profiles = {personal:{profileId:'personal', transactions:[]}, business:{profileId:'business', transactions:[]}}) {
  const nodes = new Map(), insertions = [];
  function element(tag = 'div') {
    return {
      tagName:tag, hidden:false, className:'', _text:'', _html:'',
      set id(value) {this._id=value;nodes.set(value,this);}, get id() {return this._id;},
      set textContent(value) {this._text=String(value);this._html=escape(value);}, get textContent() {return this._text;},
      set innerHTML(value) {this._html=String(value);}, get innerHTML() {return this._html;},
      before(node) {insertions.push({before:this.id, node});}
    };
  }
  ['subscriptionList','subscriptionCount','subscriptionTotal'].forEach(id=>{element().id=id;});
  const context = {
    state:profiles.personal,
    appState:{activeAccount:'personal', settings:{currency:'EUR'}},
    appReferenceDate:'2026-09-15', currentLang:'hr',
    MerAccounting:Accounting, MerEnterpriseCore:Enterprise, window:{MerEnterpriseCore:Enterprise}, document:{createElement:element},
    $:selector=>nodes.get(selector.slice(1)) || null,
    escapeHtml:escape, categoryName:id=>id, formatIsoDate:value=>value,
    t:(key, values={})=>key==='renewsIn'?`Obnova za ${values.days} dana`:key==='noSubscriptions'?'Nema pretplata':key
  };
  context.currency=value=>Core.formatCurrency(value, {currency:context.appState.settings.currency, locale:context.currentLang==='en'?'en-IE':'hr-HR'});
  vm.createContext(context);vm.runInContext(renderSource,context);
  return {
    context, profiles, insertions, node:id=>nodes.get(id), render:()=>context.renderSubscriptions(),
    switchProfile(id) {context.appState.activeAccount=id;context.state=profiles[id];}
  };
}

test('subscription modal displays real recurring price increases with previous/current full currency amounts', () => {
  const app=harness();app.profiles.personal.transactions=series('Netflix',1000,1200.5);app.render();
  const alerts=app.node('subscriptionPriceAlerts');
  assert.equal(alerts.hidden,false);assert.match(alerts.innerHTML,/<h3>Upozorenja na poskupljenje<\/h3>/);
  assert.ok(alerts.innerHTML.includes(`${app.context.currency(1000)} → ${app.context.currency(1200.5)}`));
  assert.match(alerts.innerHTML,/<strong>Netflix<\/strong>/);assert.match(alerts.innerHTML,/<small>\+20\.1%<\/small>/);
  assert.equal(app.node('subscriptionCount').textContent,'1');assert.ok(app.node('subscriptionList').innerHTML.includes(app.context.currency(1200.5)));
  assert.equal(app.insertions.length,1);assert.equal(app.insertions[0].before,'subscriptionList');
});

test('no increases hide and clear alerts; rerender reuses the section instead of duplicating it', () => {
  const app=harness();app.profiles.personal.transactions=series('Spotify');app.render();
  const alerts=app.node('subscriptionPriceAlerts');assert.equal(alerts.hidden,false);
  app.profiles.personal.transactions=series('Spotify',12,12);app.render();
  assert.equal(alerts.hidden,true);assert.equal(alerts.innerHTML,'');assert.equal(app.insertions.length,1);
  app.profiles.personal.transactions=series('Spotify',12,10);app.render();assert.equal(alerts.hidden,true);
  app.profiles.personal.transactions=[];app.render();assert.equal(alerts.hidden,true);assert.equal(app.node('subscriptionCount').textContent,'0');
  assert.equal(app.node('subscriptionTotal').textContent,app.context.currency(0));
});

test('price alerts recalculate per active profile and base currency without exposing foreign rows', () => {
  const app=harness();
  app.profiles.personal.transactions=[...series('Personal EUR'),...series('Personal USD',20,25,'personal','USD'),...series('Injected Business',30,40,'business')];
  app.profiles.business.transactions=series('Business EUR',50,60,'business');
  app.render();let html=app.node('subscriptionPriceAlerts').innerHTML;
  assert.match(html,/Personal EUR/);assert.doesNotMatch(html,/Personal USD|Injected Business|Business EUR/);
  app.context.appState.settings.currency='USD';app.render();html=app.node('subscriptionPriceAlerts').innerHTML;
  assert.match(html,/Personal USD/);assert.doesNotMatch(html,/Personal EUR|Injected Business|Business EUR/);
  assert.ok(html.includes(`${app.context.currency(20)} → ${app.context.currency(25)}`));
  app.context.appState.settings.currency='EUR';app.switchProfile('business');app.render();html=app.node('subscriptionPriceAlerts').innerHTML;
  assert.match(html,/Business EUR/);assert.doesNotMatch(html,/Personal EUR|Personal USD|Injected Business/);
  app.switchProfile('personal');app.render();assert.match(app.node('subscriptionPriceAlerts').innerHTML,/Personal EUR/);
});

test('merchant labels are escaped in price alerts and the ordinary subscription list', () => {
  const merchant='<img src=x onerror="alert(1)">Netflix & Friends';
  const app=harness();app.profiles.personal.transactions=series(merchant);app.render();
  for(const id of ['subscriptionPriceAlerts','subscriptionList']) {
    const html=app.node(id).innerHTML;
    assert.ok(html.includes(escape(merchant)),id);assert.doesNotMatch(html,/<img\b|<script\b/,id);
  }
});

test('subscription list and total exclude wrong-profile, foreign-currency, and aggregated historical transactions', () => {
  const app=harness();
  const aggregate=series('Netflix summary',100,110).map(item=>({...item,isAggregate:true}));
  const legacy=series('Prethodni mjesečni troškovi',100,100);
  legacy.unshift({...legacy[0],id:'legacy-jul',date:'2026-07-10'});
  app.profiles.personal.transactions=[
    ...series('Netflix Personal EUR',10,12),
    ...series('Netflix Personal USD',20,25,'personal','USD'),
    ...series('Netflix Business',50,60,'business'),...aggregate,...legacy
  ];
  app.render();
  let list=app.node('subscriptionList').innerHTML;
  assert.match(list,/Netflix Personal EUR/);assert.doesNotMatch(list,/Netflix Personal USD|Netflix Business|Netflix summary|Prethodni mjesečni troškovi/);
  assert.equal(app.node('subscriptionCount').textContent,'1');assert.equal(app.node('subscriptionTotal').textContent,app.context.currency(12));
  app.context.appState.settings.currency='USD';app.render();list=app.node('subscriptionList').innerHTML;
  assert.match(list,/Netflix Personal USD/);assert.doesNotMatch(list,/Netflix Personal EUR|Netflix Business|Netflix summary|Prethodni mjesečni troškovi/);
  assert.equal(app.node('subscriptionCount').textContent,'1');assert.equal(app.node('subscriptionTotal').textContent,app.context.currency(25));
});

test('English price alert heading and currency follow the current language', () => {
  const app=harness();app.profiles.personal.transactions=series('Netflix');app.context.currentLang='en';app.render();
  const html=app.node('subscriptionPriceAlerts').innerHTML;
  assert.match(html,/<h3>Price increases<\/h3>/);assert.ok(html.includes(`${app.context.currency(10)} → ${app.context.currency(12)}`));
});

test('forecast contains neither subscription radar nor duplicate payday editor; Activity keeps receipt scanning', () => {
  const forecast=enterpriseSource.slice(enterpriseSource.indexOf('function renderForecast(){'),enterpriseSource.indexOf('async function analyzeCashflow'));
  assert.ok(forecast.includes('enterpriseForecast'),'forecast renderer is located');
  assert.doesNotMatch(forecast,/subscription-radar|subscriptionRadar|paydayRules|paydayRulesEditor|enterpriseRules/);
  assert.doesNotMatch(enterpriseSource,/id="enterpriseRules"|function renderRules\(/);
  assert.match(enterpriseSource,/receiptTrigger\.id='openReceiptScanner';document\.querySelector\('#activityView \.heading-actions'\)\?\.prepend\(receiptTrigger\)/);
  assert.match(enterpriseSource,/receiptTrigger\.addEventListener\('click',\(\)=>window\.MerReceiptUI\?\.open\(\)\)/);
  assert.match(enterpriseSource,/if\(tab==='rules'\)\{window\.MerVaultsUI\?\.open\('automation'\)/);
  const notifications=appSource.slice(appSource.indexOf('function buildNotifications()'),appSource.indexOf('function renderNotifications()'));
  assert.match(notifications,/activeSubscriptions\(\)\.filter\(/);
  assert.match(notifications,/action:t\('manageSubscriptions'\),view:'budgets',subscriptions:true/);
});
