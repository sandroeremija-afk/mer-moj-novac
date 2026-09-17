'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const MerCore = require('../core.js');
const MerDiscovery = require('../discovery-core.js');
const MerStateStore = require('../state-store.js');
const MerAccounting = require('../accounting-core.js');
const app = fs.readFileSync(require.resolve('../app.js'), 'utf8');
const enterprise = fs.readFileSync(require.resolve('../enterprise-ui.js'), 'utf8');
const premium = fs.readFileSync(require.resolve('../premium.js'), 'utf8');
const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
const between = (source, first, last) => {
  const start = source.indexOf(first), end = source.indexOf(last, start + first.length);
  assert.ok(start >= 0 && end > start, `${first} has a bounded runtime fixture`);
  return source.slice(start, end);
};
const encodeText = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
// Mirrors browser textContent -> innerHTML, intentionally NOT quote-escaping:
// production attribute contexts must handle their own quote delimiters.
const textDocument = { createElement:() => ({ textContent:'', get innerHTML() { return encodeText(this.textContent); } }) };
const escapeSource = between(app, 'function escapeHtml(', 'function cashflowLabel(');
const reference = '2026-09-17';
const expense = (id, amount, category, date = reference, extra = {}) => ({ id, type:'expense', amount, category, date, ...extra });
const profile = transactions => ({ transactions, categories:[], incomeCategories:[], goalBuckets:[], savingsEntries:[], automationRules:[], availableBalance:0, financialOpeningBalance:0, income:1200, bills:100, savingsTarget:0, guard:0.1, enterprise:{taxVault:{enabled:false}} });

function summaryHarness(personal, business = profile([])) {
  const appState = {activeAccount:'personal', accounts:{personal, business}, settings:{currency:'EUR'}};
  const store = MerStateStore.createStore(appState, {referenceDate:reference});
  const nodes = new Map([['#overviewVisualBreakdown', {innerHTML:''}], ['#overviewDetailsTitle', {textContent:''}]]);
  const context = vm.createContext({ MerCore, document:textDocument, appState, state:personal, appReferenceDate:reference, currentLang:'en', t:key => key, $:selector => nodes.get(selector) || null });
  const source = [
    between(app, 'const locale =', 'function inferredCategoryIconId('),
    between(app, 'function derivedTotals(', 'function applyStaticTranslations('),
    between(app, 'const insightDetailCopy =', 'function insightMonthLabel('),
    escapeSource,
    between(app, 'function expandedMetric(', 'function expandedNotes('),
    between(app, 'function renderOverviewBreakdown(', 'function compactChartCurrency(')
  ].join('\n');
  vm.runInContext(source, context);
  store.subscribe(event => { context.state = event.activeProfile; });
  return { context, nodes, store, render() { context.renderOverviewBreakdown(); return nodes.get('#overviewVisualBreakdown').innerHTML; } };
}

test('category summary renders canonical posted monthly totals and follows the active reactive profile', () => {
  const amounts = [100.11, 90.22, 80.33, 70.44, 60.55, 50.66, 40.77, 30.88];
  const personal = profile([
    {id:'salary', type:'income', amount:1200, date:reference, category:'salary'},
    ...amounts.map((amount, index) => expense(`e-${index}`, amount, `c-${index}`)),
    expense('last-month', 900, 'old', '2026-08-31'),
    expense('future', 800, 'future', '2026-09-18'),
    expense('draft', 777, 'draft', reference, {offlineDraft:true})
  ]);
  personal.categories = amounts.map((_, index) => ({id:`c-${index}`, name:`Category ${index}`, limit:300}));
  const business = profile([{id:'client', type:'income', amount:3000, date:reference}, expense('software', 242.7, 'business-only')]);
  business.categories = [{id:'business-only', name:'Business software', limit:500}];
  const h = summaryHarness(personal, business), output = h.render();
  const totals = MerCore.transactionTotals(personal.transactions, 'monthly', reference);
  assert.deepEqual({income:totals.income, expenses:totals.expenses, net:totals.net}, {income:1200, expenses:523.96, net:676.04});
  for (const amount of [totals.income, totals.expenses, totals.net]) assert.ok(output.includes(encodeText(MerCore.formatCurrency(amount, {locale:'en-IE', currency:'EUR'}))), `canonical amount ${amount} is visible`);
  assert.equal((output.match(/class="expanded-ranked-row"/g) || []).length, 6);
  assert.match(output, /Category 0/); assert.match(output, /Remaining categories/);
  assert.doesNotMatch(output, /Business software|Category 5|Category 6|Category 7|>old<|>future<|>draft</);
  assert.equal(h.nodes.get('#overviewDetailsTitle').textContent, 'Where your money goes');
  const untouched = JSON.stringify(personal);
  h.store.switchAccount('business');
  const switched = h.render();
  assert.match(switched, /Business software/); assert.doesNotMatch(switched, /Category 0|Remaining categories/);
  assert.ok(switched.includes(encodeText(MerCore.formatCurrency(242.7, {locale:'en-IE', currency:'EUR'}))));
  // Ignore the derived update timestamp; transactions and categories cannot cross profiles.
  assert.deepEqual(personal.transactions, JSON.parse(untouched).transactions);
  h.store.update('new-business-expense', (_draft, current) => current.transactions.push(expense('second', 10.1, 'business-only')));
  assert.ok(h.render().includes(encodeText(MerCore.formatCurrency(252.8, {locale:'en-IE', currency:'EUR'}))));
  h.store.switchAccount('personal'); assert.equal(h.render(), output);
});

test('top-five plus remaining categories preserves every cent without mutating its ranked inputs', () => {
  const h = summaryHarness(profile([]));
  const rows = [['a',100.11],['b',90.22],['c',80.33],['d',70.44],['e',60.55],['f',50.66],['g',40.77],['h',30.88]];
  const original = JSON.stringify(rows), slices = h.context.categorySummarySlices(rows);
  assert.equal(slices.length, 6);
  assert.deepEqual(Array.from(slices.slice(0,5), item => item.amount), rows.slice(0,5).map(([,amount]) => amount));
  assert.equal(slices[5].amount, 122.31);
  assert.equal(MerCore.roundMoney(slices.reduce((sum,item) => sum + item.amount,0)), 523.96);
  assert.equal(JSON.stringify(rows), original);
  h.context.currentLang = 'hr'; assert.equal(h.context.categorySummarySlices(rows)[5].label, 'Preostale kategorije');
  assert.equal(h.context.categorySummarySlices(rows.slice(0,5)).length, 5);
});

test('category distribution safely escapes custom text and attribute delimiters', () => {
  const h = summaryHarness(profile([]));
  const attack = 'Food" onpointerenter="alert(1) <img src=x onerror=alert(2)> & extra';
  const output = h.context.categoryDistributionMarkup([{label:attack,amount:42}], 42, {expenses:'Expenses" onfocus="alert(3)', noData:'<script>empty</script>'});
  assert.ok(output.includes(encodeText(attack)), 'full custom category label remains readable as text');
  assert.doesNotMatch(output, /<img\b|<script\b|\b(?:title|aria-label)="[^"]*"\s+on[a-z]+=/i);
  assert.match(output, /aria-label="Expenses&quot; onfocus=&quot;alert\(3\): /);
  assert.match(output, /role="img"/);
});

test('empty and very large category summaries remain finite with complete proportions', () => {
  const h = summaryHarness(profile([])), empty = h.render();
  assert.match(empty, /There is no data/); assert.doesNotMatch(empty, /conic-gradient|NaN|Infinity|undefined/);
  const values = [9e12,8e12,7e12,6e12,5e12,4e12,3e12];
  const slices = h.context.categorySummarySlices(values.map((amount,i) => [`large-${i}`,amount]));
  const total = values.reduce((sum,amount) => sum + amount,0);
  assert.equal(slices.reduce((sum,item) => sum + item.amount,0), total);
  const output = h.context.categoryDistributionMarkup(slices,total,{expenses:'Expenses',noData:'Empty'});
  assert.doesNotMatch(output, /NaN|Infinity|undefined/); assert.match(output, /100%\)/);
  const widths = Array.from(output.matchAll(/style="width:([\d.]+)%/g), match => Number(match[1]));
  assert.equal(widths.length,6); assert.ok(widths.every(value => Number.isFinite(value) && value > 0 && value <= 100));
  assert.ok(Math.abs(widths.reduce((sum,value) => sum + value,0)-100)<1e-9);
});

test('cold-start translations and the category summary do not depend on removed chart elements', () => {
  for (const id of ['chartTitle','chartDesc','goalCurrent','goalOf','goalPercent','goalProgress','goalProgressTrack']) assert.doesNotMatch(html,new RegExp(`id="${id}"`));
  const h = summaryHarness(profile([]));
  h.context.document = {...textDocument, documentElement:{lang:''}, title:''};
  h.context.$$ = () => [];
  vm.runInContext(between(app,'function applyStaticTranslations(','function applyTheme('), h.context);
  assert.doesNotThrow(() => h.context.applyStaticTranslations());
  assert.equal(h.context.document.documentElement.lang,'en'); assert.equal(h.context.document.title,'mer My money');
  assert.doesNotThrow(() => h.render());
});

test('premium goal rendering survives removed Overview cards and still updates all Savings controls', () => {
  const ids = new Set(Array.from(html.matchAll(/\bid="([^"]+)"/g), match => `#${match[1]}`));
  const nodes = new Map();
  const select = selector => {
    if (!ids.has(selector) && selector !== '#savingsView .savings-hero h2') return null;
    if (!nodes.has(selector)) nodes.set(selector,{textContent:'',innerHTML:'',style:{},attributes:{},setAttribute(name,value){this.attributes[name]=value;}});
    return nodes.get(selector);
  };
  const goal={id:'emergency',name:'Emergency fund',primary:true,target:1000,current:250,dueDate:'2027-01-01'};
  const context = vm.createContext({MerCore,MerAccounting,document:textDocument,state:{goalBuckets:[goal]},appReferenceDate:reference,$:select,$$:()=>[],currency:value=>String(value),t:(key,values)=>`${key}:${JSON.stringify(values||{})}`,preferredDate:value=>value,paginatePremiumLists(){}});
  vm.runInContext(escapeSource+between(premium,'  function primaryGoal(','  function openGoalEditor('),context);
  assert.doesNotThrow(() => context.renderGoals());
  assert.equal(nodes.get('#savingsHeroCurrent').textContent,'250');
  assert.equal(nodes.get('#savingsHeroProgress').style.width,'25%');
  assert.equal(nodes.get('#savingsHeroTrack').attributes['aria-valuenow'],'25');
  assert.equal(nodes.get('#stillNeeded').textContent,'750');
  assert.match(nodes.get('#goalBucketGrid').innerHTML,/Emergency fund/);
});

function commandHarness({width=1440, language='en'}={}) {
  const nodes = new Map(), calls = [];
  const node = id => {
    if (!nodes.has(id)) nodes.set(id,{id,value:'',innerHTML:'',textContent:'',hidden:false,attributes:{},listeners:{},setAttribute(name,value){this.attributes[name]=value;},removeAttribute(name){delete this.attributes[name];},addEventListener(name,listener){this.listeners[name]=listener;},focus(){calls.push(['focus',id]);},scrollIntoView(){},after(element){nodes.set(element.id,element);}});
    return nodes.get(id);
  };
  const personal = profile([]), business = profile([]);
  const appState = {activeAccount:'personal',accounts:{personal,business},settings:{currency:'EUR',hideBalances:false}};
  const context = vm.createContext({MerCore,MerDiscovery,appState,state:personal,appReferenceDate:reference,currentLang:language,commandIndex:0,visibleCommands:[],commandDialog:{open:false},el:node,t:key=>key,formatIsoDate:value=>value,
    document:{...textDocument,createElement:() => ({...node('temporary'),id:''}),querySelector:selector=>({click:()=>calls.push(['click',selector])})},
    requestAnimationFrame:callback=>callback(),showView:view=>calls.push(['view',view]),resetActivityFilters:()=>calls.push(['reset-filters']),openTransaction:id=>calls.push(['transaction',id]),openIncomeTransaction:()=>calls.push(['income']),openBudgetEditor:id=>calls.push(['budget',id]),openIncomeCategoryEditor:id=>calls.push(['income-category',id]),switchAccount:id=>calls.push(['account',id]),openIntelligence:id=>calls.push(['intelligence',id]),openModal:dialog=>{dialog.open=true;},closeModal:dialog=>{dialog.open=false;},act:callback=>callback()
  });
  context.copy=(hr,en)=>context.currentLang==='hr'?hr:en;
  context.esc=encodeText;
  context.window={innerWidth:width,MerPremiumNavigation:{openSettings:tab=>calls.push(['settings',tab]),openGoalEditor:id=>calls.push(['goal',id])},MerPopupLayout:{revealTarget:id=>calls.push(['reveal',id])},MerEngagementUI:{openWrapped:()=>calls.push(['wrapped'])},MerEnterpriseSecurity:{isLocked:()=>false}};
  vm.runInContext(between(enterprise,'  function commands()','  function toggleStealth('),context);
  return {context,nodes,calls,node,personal,business,render(query=''){node('commandSearch').value=query;context.renderCommands();return context.visibleCommands;}};
}

test('command palette opens with exactly four focused shortcuts in the requested order', () => {
  for (const language of ['hr','en']) {
    const h=commandHarness({language});h.context.openCommands();
    assert.deepEqual(Array.from(h.context.visibleCommands,item=>item.quick),['password','mfa','transactions','language']);
    assert.match(h.node('commandResultHint').textContent,language==='hr'?/Brzi pristup/:/Quick access/);
    assert.equal(h.node('commandSearch').attributes['aria-activedescendant'],'commandOption0');
    assert.equal((h.node('commandResults').innerHTML.match(/role="option"/g)||[]).length,4);
    for(const command of h.context.visibleCommands)command.run();
    for(const expected of [['settings','security'],['reveal','currentPasswordInput'],['reveal','startMfa'],['reset-filters'],['view','activity'],['settings','general'],['reveal','settingsLanguage']])assert.ok(h.calls.some(call=>JSON.stringify(call)===JSON.stringify(expected)));
    h.render('   ');assert.equal(h.context.visibleCommands.length,4,'whitespace keeps focused defaults');
  }
});

test('command search retains other features, normalizes Croatian tokens and respects the active profile', () => {
  const h=commandHarness({language:'hr'});
  assert.equal(h.render('PROMJENA lozinke')[0].quick,'password');
  assert.match(h.render('stednju')[0].label,/Štednju/);
  h.context.currentLang='en';
  h.render('monthly REVIEW')[0].run();assert.ok(h.calls.some(call=>call[0]==='wrapped'));
  assert.equal(h.render('e-invoice').length,0);
  h.context.appState.activeAccount='business';h.context.state=h.business;
  assert.match(h.render('e-invoice')[0].label,/New e-invoice/);
  assert.equal(h.render('no-such-command-92847').length,0);
  assert.equal(h.node('commandSearch').attributes['aria-activedescendant'],undefined);
});

test('runtime command results are bounded, escaped and isolated, including stale actions after a profile switch', () => {
  for (const width of [375,1440]) {
    const h=commandHarness({width});
    h.personal.transactions=Array.from({length:12},(_,i)=>expense(`personal-${i}`,100+i,'food',reference,{name:`Vendor ${i} <img src=x onerror=alert(1)>`,profileId:'personal'}));
    h.personal.transactions.push(expense('foreign',888,'food',reference,{name:'Vendor foreign',profileId:'business'}));
    h.business.transactions=[expense('business-vendor',42,'software',reference,{name:'Vendor business only',profileId:'business'})];
    const results=h.render('vendor');assert.equal(results.length,width<=640?4:6);
    assert.match(h.node('commandResultHint').textContent,new RegExp(`Showing ${results.length} of 12 results`));
    assert.doesNotMatch(h.node('commandResults').innerHTML,/<img\b|Vendor foreign|Vendor business/);
    assert.match(h.node('commandResults').innerHTML,/&lt;img/);
    const stale=results[0];h.context.appState.activeAccount='business';h.context.state=h.business;
    const before=h.calls.length;stale.run();assert.equal(h.calls.length,before,'stale personal search action is rejected');
    const current=h.render('vendor');assert.equal(current.length,1);assert.match(current[0].label,/business only/);
    current[0].run();assert.deepEqual(h.calls.at(-1),['transaction','business-vendor']);
    h.context.appState.settings.hideBalances=true;h.render('vendor');assert.match(h.node('commandResults').innerHTML,/••••/);
    assert.doesNotMatch(h.node('commandResults').innerHTML,/€42/);
  }
});

test('command keyboard selection and reopen reset work with the new four-item defaults', () => {
  const h=commandHarness();h.context.openCommands();
  h.node('commandSearch').listeners.keydown({key:'ArrowDown',preventDefault(){}});
  assert.equal(h.node('commandSearch').attributes['aria-activedescendant'],'commandOption1');
  h.node('commandSearch').listeners.keydown({key:'Enter',preventDefault(){}});
  assert.equal(h.context.commandDialog.open,false);assert.ok(h.calls.some(call=>call[0]==='reveal'&&call[1]==='startMfa'));
  h.context.openCommands();assert.equal(h.context.commandIndex,0);assert.equal(h.node('commandSearch').value,'');
  h.node('appShell').hidden=true;h.context.commandDialog.open=false;h.context.openCommands();assert.equal(h.context.commandDialog.open,false);
});
