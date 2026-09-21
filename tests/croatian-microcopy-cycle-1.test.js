'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Core = require('../core.js');
const Export = require('../export-core.js');
const Receipts = require('../receipt-core.js');
const read = file => fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const app = read('app.js'), premium = read('premium.js');
const between = (source,start,end) => {
  const from=source.indexOf(start),to=source.indexOf(end,from);
  assert.ok(from>=0&&to>from,`${start} boundary`);
  return source.slice(from,to);
};
function dictionaries() {
  const context={};
  const sources=[app.slice(0,app.indexOf('const categoryMeta')),
    premium.slice(premium.indexOf('{')+1,premium.indexOf('  let selectedSettingsTab'))];
  vm.runInNewContext(sources.join('\n')+';this.copy=translations;',context);
  return context.copy;
}
const tx=(id,source,sourceType='manual')=>({id,source,sourceType,name:'Example',amount:10,type:'expense',date:'2026-09-05T12:00:00',currency:'EUR',category:'food',profileId:'personal'});
const profile=transactions=>({transactions,categories:[{id:'food',name:'Hrana',limit:100}],incomeCategories:[],recurring:[]});

test('known source markers localize legacy records in both languages without changing data',()=>{
  for(const [source,hr,en] of [
    ['Manual','Ručno','Manual'],['manual','Ručno','Manual'],['Ručno','Ručno','Manual'],
    ['Auto','Automatski','Automatic'],['Automatic','Automatski','Automatic'],
    ['Imported','Uvezeno','Imported'],['Uvezeno','Uvezeno','Imported'],
    ['round-up','Zaokruživanje','Round-up'],['Zaokruživanje','Zaokruživanje','Round-up']
  ]) {
    const item=Object.freeze(tx('legacy',source)),before=JSON.stringify(item);
    assert.equal(Core.formatTransactionSource(item,{locale:'hr-HR'}),hr);
    assert.equal(Core.formatTransactionSource(item,{locale:'en-IE'}),en);
    assert.equal(JSON.stringify(item),before);
  }
  for(const [sourceType,expected] of [['manual','Ručno'],['auto','Automatski'],['import','Uvezeno'],['round-up','Zaokruživanje'],['constructor','Ručno'],['__proto__','Ručno']]) {
    assert.equal(Core.formatTransactionSource({sourceType}),expected);
  }
  assert.equal(Core.formatTransactionSource(null),'Ručno');
});

test('source prefixes translate while bank names, file names and custom text stay exact',()=>{
  assert.equal(Core.formatTransactionSource('Auto: Revolut'),'Automatski: Revolut');
  assert.equal(Core.formatTransactionSource('Import: statement.csv'),'Uvoz: statement.csv');
  assert.equal(Core.formatTransactionSource('Uvoz: izvod.csv',{language:'en'}),'Import: izvod.csv');
  for(const source of ['Zagrebačka banka','Manual Bank','Autohaus Zagreb','constructor','__proto__','<img src=x onerror=alert(1)>']) {
    assert.equal(Core.formatTransactionSource(tx('custom',source)),source);
  }
});

test('Activity renders localized source badges dynamically and still escapes custom names',()=>{
  const records=[tx('manual','Manual'),tx('bank','Auto: Revolut','auto'),tx('custom','<img src=x>')];
  const before=JSON.stringify(records),nodes=new Map(),copy=dictionaries();
  const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',dataset:{},innerHTML:''});return nodes.get(id);};
  const context={MerCore:Core,state:profile(records),appState:{settings:{currency:'EUR',timezone:'Europe/Zagreb'}},currentLang:'hr',appReferenceDate:'2026-09-21',activityReviewOnly:false,activityPage:1,ACTIVITY_PAGE_SIZE:4,
    $:node,$$:()=>[],uncategorizedTransactions:()=>[],uncategorizedNotificationFingerprint:()=>'',isNotificationResolved:()=>false,renderActivityPagination(){},
    categoryName:()=> 'Hrana',incomeCategoryName:()=> 'Plaća',categoryVisual:()=>({className:'food'}),categoryMeta:{other:{className:'other'}},categoryIconMarkup:()=>'',formatTransactionDate:()=> '5. rujna',escapeHtml:Receipts.escapeHtml};
  context.locale=()=>context.currentLang==='en'?'en-IE':'hr-HR';
  context.t=key=>copy[context.currentLang][key]||key;
  vm.createContext(context);
  vm.runInContext(between(app,'function renderActivity()','function escapeHtml('),context);
  context.renderActivity();
  assert.match(node('#transactionList').innerHTML,/>Ručno<\/span>/);
  assert.match(node('#transactionList').innerHTML,/>Automatski: Revolut<\/span>/);
  assert.match(node('#transactionList').innerHTML,/&lt;img src=x&gt;/);
  assert.doesNotMatch(node('#transactionList').innerHTML,/<img\b|>Manual<\/span>/);
  context.currentLang='en';context.renderActivity();
  assert.match(node('#transactionList').innerHTML,/>Manual<\/span>/);
  assert.equal(JSON.stringify(records),before);
});

test('receipt matching uses the same localized, escaped source labels without changing match results',()=>{
  const records=[tx('manual','Manual'),tx('custom','Auto: Bank <One>','auto')],nodes=new Map();
  const node=id=>{if(!nodes.has(id))nodes.set(id,{checked:true,innerHTML:'',textContent:''});return nodes.get(id);};
  const snapshot={language:'hr',currency:'EUR'};
  const context={root:{MerCore:Core},document:{documentElement:{lang:'hr'}},R:Receipts,owner:'personal',selectedId:'',preferredId:'',current:()=>true,receipt:{merchant:'Example',date:'2026-09-05',totalCents:1000,currency:'EUR',type:'expense',lines:[]},profile:()=>profile(records),snapshot:()=>snapshot,dialog:{querySelector:node},x:Receipts.escapeHtml,money:cents=>String(cents)};
  context.copy=(hr,en)=>snapshot.language==='en'?en:hr;
  vm.createContext(context);
  vm.runInContext(between(read('receipt-ui.js'),'  function renderMatches()','  async function attach('),context);
  context.renderMatches();
  assert.match(node('#receiptMatches').innerHTML,/ · Ručno · /);
  assert.match(node('#receiptMatches').innerHTML,/Automatski: Bank &lt;One&gt;/);
  assert.doesNotMatch(node('#receiptMatches').innerHTML,/<One>/);
  snapshot.language='en';context.renderMatches();
  assert.match(node('#receiptMatches').innerHTML,/ · Manual · /);
  assert.equal(records[0].source,'Manual');
});

test('Croatian CSV/JSON/PDF report rows localize source labels but preserve financial and audit fields',()=>{
  const data=profile([tx('manual','Manual'),tx('import','Import: bank.csv','import'),tx('bank','Auto: Revolut','auto')]),before=JSON.stringify(data);
  const report=language=>Export.buildReport({profile:data,profileId:'personal',context:'activity',timeframe:'monthly',referenceDate:'2026-09-21',language});
  const hr=report('hr'),en=report('en');
  const sources=result=>Object.fromEntries(result.sections[0].rows.map(row=>[row[10],row[9]]));
  assert.deepEqual(sources(hr),{manual:'Ručno',import:'Uvoz: bank.csv',bank:'Automatski: Revolut'});
  assert.deepEqual(sources(en),{manual:'Manual',import:'Import: bank.csv',bank:'Auto: Revolut'});
  assert.deepEqual(hr.sections[0].rows.map(row=>[row[0],row[5],row[10]]),en.sections[0].rows.map(row=>[row[0],row[5],row[10]]));
  assert.match(Export.toCsv(hr),/Ručno/);
  assert.equal(JSON.stringify(data),before);
});

test('effective Croatian dictionaries use consistent, clear copy while English and proper names remain',()=>{
  const copy=dictionaries();
  assert.equal(copy.hr.freelance,'Honorarni i dodatni poslovi');
  assert.equal(copy.hr.filters,'Filtri');assert.equal(copy.hr.clearFilters,'Očisti filtre');
  assert.equal(copy.hr.merRecommendation,'MER preporuka');assert.equal(copy.hr.activityTransfer,'Uvoz / izvoz');
  assert.equal(copy.hr.recoveryCodesTitle,'Spremite kodove za oporavak');
  assert.equal(copy.hr.authenticatorApp,'Aplikacija za kodove');
  assert.equal(copy.hr.openBanking,'Otvoreno bankarstvo');
  for(const value of Object.values(copy.hr))assert.doesNotMatch(value,/\brecovery\b|\bprovider\b|\bFreelance\b|\bReset\b|\bOpen Banking\b|\bOPEN BANKING\b/);
  assert.equal(copy.en.clearFilters,'Clear filters');assert.equal(copy.en.recoveryCodesTitle,'Save your recovery codes');
  assert.match(copy.hr.mfaDescription,/Google Authenticator, Authy/);
  assert.equal(copy.hr.profileBrandName,'Moj eRačun');
});

test('Settings currency/timezone labels follow the language without changing technical values or selections',()=>{
  const copy=dictionaries(),nodes={
    '#baseCurrency':{value:'USD',options:['EUR','USD','GBP','CHF'].map(value=>({value,textContent:value}))},
    '#timezone':{value:'Europe/Zagreb',options:['Europe/Zagreb','UTC','America/New_York'].map(value=>({value,textContent:value}))}
  };
  const context={$:id=>nodes[id],language:'hr'};
  context.t=key=>copy[context.language][key];
  vm.createContext(context);
  vm.runInContext(between(premium,'  function localizeSettingsOptionLabels()','  function renderPremiumSettings()'),context);
  context.localizeSettingsOptionLabels();
  assert.deepEqual(nodes['#baseCurrency'].options.map(option=>option.textContent),['EUR — euro','USD — američki dolar','GBP — britanska funta','CHF — švicarski franak']);
  assert.deepEqual(nodes['#timezone'].options.map(option=>option.textContent),['Zagreb (Hrvatska)','UTC — svjetsko vrijeme','New York (SAD)']);
  context.language='en';context.localizeSettingsOptionLabels();
  assert.equal(nodes['#baseCurrency'].options[1].textContent,'USD — US Dollar');
  assert.equal(nodes['#baseCurrency'].value,'USD');assert.equal(nodes['#timezone'].value,'Europe/Zagreb');
  assert.deepEqual(nodes['#timezone'].options.map(option=>option.value),['Europe/Zagreb','UTC','America/New_York']);
});

test('security overview and static Croatian fallbacks avoid mixed-language labels',()=>{
  const popup=fs.readFileSync(require.resolve('../popup-layout.js'),'utf8');
  const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
  assert.match(popup,/Aplikacija za sigurnosne kodove ili SMS\./);
  assert.doesNotMatch(popup,/Authenticator aplikacija ili SMS/);
  assert.match(html,/value="USD">USD — američki dolar/);
  assert.match(html,/data-i18n="helpAssistant">Pomoć i AI asistent/);
  assert.doesNotMatch(html,/Spremite recovery kodove|Fiksni vs\. Fleksibilni/);
});
