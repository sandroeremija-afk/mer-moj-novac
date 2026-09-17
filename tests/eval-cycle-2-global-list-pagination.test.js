const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const MerCore = require('../core.js');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
function appFunction(name) {
  const source = app.match(new RegExp(`function ${name}\\([^]*?\\n\\}`));
  assert.ok(source, `${name} exists`);
  return source[0];
}
function element(value = '') {
  return { value, dataset:{}, hidden:false, textContent:'', innerHTML:'', disabled:false,
    classList:{ toggle(){} }, setAttribute(){}, focus(){} };
}
function activityHarness() {
  const elements = new Map();
  const $ = selector => {
    if (!elements.has(selector)) elements.set(selector, element());
    return elements.get(selector);
  };
  const transactions = Array.from({length:13}, (_, index) => ({
    id:`tx-${index + 1}`, name:index < 3 ? `Find ${index}` : `Merchant ${index}`,
    amount:10 + index, type:'expense', category:'food', date:`2026-09-${String(index + 1).padStart(2, '0')}T12:00:00Z`
  }));
  const context = vm.createContext({
    $, $$:()=>[], MerCore, Intl, Date, Number, String, Math,
    state:{transactions, categories:[{id:'food'}], incomeCategories:[]},
    appState:{settings:{currency:'EUR',timezone:'Europe/Zagreb'}},
    appReferenceDate:'2026-09-17', ACTIVITY_PAGE_SIZE:4, activityPage:1, activityReviewOnly:false,
    activityPageSequence:(pages)=>Array.from({length:pages}, (_, index)=>index+1),
    uncategorizedTransactions:()=>[], uncategorizedNotificationFingerprint:()=>'', isNotificationResolved:()=>false,
    t:(key,values)=>JSON.stringify({key,...values}), locale:()=> 'en-US',
    categoryName:id=>id, incomeCategoryName:id=>id,
    categoryVisual:()=>({className:'food'}), incomeCategoryVisual:()=>({className:'income'}),
    categoryMeta:{other:{className:'other'}}, categoryIconMarkup:()=>'', escapeHtml:String,
    formatTransactionDate:value=>value.slice(0,10), formatIsoDate:String
  });
  vm.runInContext([appFunction('renderActivityPagination'),appFunction('renderActivity')].join('\n'), context);
  const visibleIds = () => [...$('#transactionList').innerHTML.matchAll(/data-edit-transaction="([^"]+)"/g)].map(match=>match[1]);
  return {context,$,transactions,visibleIds};
}

test('cycle 2: Activity reaches every transaction exactly once across four-item pages', () => {
  const {context,transactions,visibleIds} = activityHarness();
  const snapshot = JSON.stringify(transactions);
  const reached = [];
  for (let page = 1; page <= 4; page++) {
    context.activityPage = page;
    context.renderActivity();
    assert.ok(visibleIds().length <= 4);
    reached.push(...visibleIds());
  }
  assert.equal(new Set(reached).size, 13);
  assert.deepEqual(reached.slice().sort(), transactions.map(item=>item.id).sort());
  assert.equal(JSON.stringify(transactions), snapshot);
});

test('cycle 2: Activity clamps after filtering, deleting, and switching profile data', () => {
  const {context,$,visibleIds} = activityHarness();
  context.activityPage = 4;
  $('#activitySearch').value = 'Find';
  context.renderActivity();
  assert.equal(context.activityPage, 1);
  assert.equal(visibleIds().length, 3);
  assert.equal($('#activityPagination').hidden, true);
  $('#activitySearch').value = '';
  context.activityPage = 4;
  context.state.transactions.splice(4);
  context.renderActivity();
  assert.equal(context.activityPage, 1);
  assert.equal(visibleIds().length, 4);
  context.state = {transactions:[{id:'business',name:'Business',amount:42,category:'food',type:'expense',date:'2026-09-17T12:00:00Z'}],categories:[{id:'food'}],incomeCategories:[]};
  context.renderActivity();
  assert.deepEqual(visibleIds(), ['business']);
  context.state.transactions = [];
  context.renderActivity();
  assert.deepEqual(visibleIds(), []);
  assert.equal($('#activityEmpty').hidden, false);
});

test('cycle 2: list scope changes with profile, language, search, and status filter', () => {
  const list = element();
  const calls = [];
  const context = vm.createContext({
    $:()=>list, appState:{activeAccount:'personal'}, currentLang:'hr',
    window:{MerPagination:{attach:(container, options)=>calls.push({container,options})}}
  });
  vm.runInContext(appFunction('renderListPagination'), context);
  const render = scopeKey => context.renderListPagination('#list',{scopeKey,itemSelector:'.row',label:'Categories'});
  render(['','all']);
  render(['food','all']);
  render(['food','warning']);
  context.appState.activeAccount = 'business';
  render(['food','warning']);
  context.currentLang = 'en';
  render(['food','warning']);
  assert.equal(new Set(calls.map(call=>call.options.scopeKey)).size, 5);
  assert.ok(calls.every(call=>call.container === list && call.options.pageSize === 4));
  assert.ok(calls.every(call=>call.options.itemSelector === '.row'));
  assert.equal(list.dataset.paginatedList, 'true');
});

test('cycle 2: bulky lists adapt from four desktop records to one mobile record without losing entries', () => {
  const list=element(),calls=[];
  const context=vm.createContext({
    $:()=>list,appState:{activeAccount:'personal'},currentLang:'hr',
    window:{innerWidth:1280,MerPagination:{attach:(container,options)=>calls.push({container,options})}}
  });
  vm.runInContext([appFunction('bulkyListPageSize'),appFunction('renderListPagination')].join('\n'),context);
  context.renderListPagination('#savingsEntryList',{pageSize:context.bulkyListPageSize,itemSelector:'.savings-entry-item'});
  const size=calls[0].options.pageSize;
  const source=Array.from({length:13},(_,index)=>index);
  for(const [width,expected] of [[1280,4],[640,1],[375,1],[641,4]]){
    context.window.innerWidth=width;
    assert.equal(size(),expected,`page size adapts at width ${width} without rerendering`);
    const reached=[];
    for(let page=1;page<=Math.ceil(source.length/size());page++)reached.push(...MerCore.paginateItems(source,page,size()).items);
    assert.deepEqual(reached,source,'every deposit stays reachable after resizing');
  }
});

test('cycle 2: expanded savings deposit history also uses one row on mobile',()=>{
  const calls=[],list={};
  const document={documentElement:{lang:'hr'},body:{},addEventListener(){},querySelectorAll:()=>[]};
  const window={document,innerWidth:375,addEventListener(){},MutationObserver:class{observe(){}},MerPagination:{attach:(node,options)=>calls.push({node,options})}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','zero-scroll.js'),'utf8'),{window});
  window.MerZeroScroll.enhance({id:'listFixture',classList:{contains:()=>false},querySelectorAll:selector=>selector==='.savings-detail-entry-list'?[list]:[]});
  assert.equal(calls.length,1);
  assert.equal(calls[0].node,list);
  assert.equal(calls[0].options.pageSize(),1);
  window.innerWidth=1280;
  assert.equal(calls[0].options.pageSize(),4);
});

test('cycle 2: notifications retain all actionable category and recurring notices for pagination', () => {
  const context = vm.createContext({
    state:{categories:Array.from({length:9}, (_, id)=>({id:`category-${id}`,spent:90,limit:100})),recurring:[]},
    appReferenceDate:'2026-09-17', MerCore,
    isNotificationResolved:()=>false, uncategorizedTransactions:()=>[], getPlan:()=>({monthlyBudget:1000,safeRemaining:900}),
    categoryName:String, notificationFingerprint:JSON.stringify, activeSubscriptions:()=>[], currency:String, t:key=>key
  });
  vm.runInContext(appFunction('buildNotifications'), context);
  assert.equal(context.buildNotifications().length, 9, 'lower-priority notices remain accessible beyond page one');
});
