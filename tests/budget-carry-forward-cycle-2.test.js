'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Core=require('../core.js');
const Store=require('../state-store.js');
const source=fs.readFileSync(require.resolve('../app.js'),'utf8');

function profile(id='personal',currency='EUR') {
  const business=id==='business';
  return {
    accountLabel:business?'businessAccount':'personalAccount',
    income:business?7000:3500,bills:business?1500:800,savingsTarget:business?800:450,guard:business?.15:.1,
    financialOpeningBalance:10000,
    categories:[
      {id:'food',name:'Hrana',limit:business?900:480,currency},
      {id:'transport',name:'Prijevoz',limit:business?600:200,currency},
      {id:'other',name:'Ostalo',limit:business?1000:960,currency},
      {id:'paused',name:'Pauzirani cilj',limit:0,currency}
    ],
    transactions:[
      {id:id+'-salary',profileId:id,type:'income',category:'salary',amount:business?7000:3500,date:'2026-09-01',currency},
      {id:id+'-expense',profileId:id,type:'expense',category:'food',amount:240,date:'2026-09-10',currency}
    ],
    goalBuckets:[],savingsEntries:[],savingsHistory:[100,200,300],enterprise:{taxVault:{enabled:false}}
  };
}

function setup(currency='EUR') {
  const state=Core.createAccountStore(profile('personal',currency),profile('business',currency));
  state.settings={currency};
  const store=Store.createStore(state,{referenceDate:'2026-09-30'});
  return {state,store,personal:state.accounts.personal,business:state.accounts.business};
}

function uiHarness(app) {
  const nodes=new Map(),events=new Map(),saved=[],toasts=[];
  const context={
    state:app.personal,MerCore:Core,editingCategoryId:null,currentLang:'hr',returnToBudgetManager:false,
    getPlan:()=>context.state.derived.financials,
    categoryName:id=>context.state.categories.find(category=>category.id===id)?.name||id,
    categoryVisual:()=>({icon:'X'}),locale:()=> 'hr-HR',
    currency:value=>`${value} EUR`,t:(key,data={})=>`${key}:${JSON.stringify(data)}`,
    notificationFingerprint:JSON.stringify,isNotificationResolved:()=>false,budgetCategoryRow:()=>'',
    renderListPagination:()=>{},budgetListPageSize:()=>4,
    save:reason=>{saved.push(reason);app.store.commit(reason);},showToast:message=>toasts.push(message),
    openModal:node=>{node.open=true;},closeModal:node=>{node.open=false;},setTimeout:()=>0,
    uniqueId:()=> 'qa-new-category',window:{confirm:()=>true},
    $:selector=>{
      if(!nodes.has(selector))nodes.set(selector,{value:'',textContent:'',innerHTML:'',hidden:false,open:false,disabled:false,dataset:{},classList:{toggle(){}},addEventListener:(event,callback)=>events.set(selector+':'+event,callback)});
      return nodes.get(selector);
    }
  };
  const functions=[
    source.slice(source.indexOf('function renderBudgetView()'),source.indexOf('function budgetCategoryPercent(')),
    source.slice(source.indexOf('function openBudgetEditor('),source.indexOf('function refreshBudgetTransferForm('))
  ];
  for(const id of ['budgetForm','autoBalanceBudget']) {
    const handler=source.split(/\r?\n/).find(line=>line.startsWith(`$('#${id}').addEventListener(`));
    assert.ok(handler,'Run the real '+id+' event handler');
    functions.push(handler);
  }
  vm.createContext(context);vm.runInContext(functions.join('\n'),context);
  return {context,nodes,saved,toasts,submit:()=>events.get('#budgetForm:submit')({preventDefault(){}}),balance:()=>events.get('#autoBalanceBudget:click')()};
}

test('category limits carry through the next month, skipped months and year boundaries without changing history',()=>{
  for(const currency of ['EUR','USD','GBP','CHF']) {
    const app=setup(currency);
    const limits=Object.fromEntries(Object.entries(app.state.accounts).map(([id,account])=>[id,account.categories.map(category=>[category.id,category.limit,category.currency])]));
    const history=Object.fromEntries(Object.entries(app.state.accounts).map(([id,account])=>[id,JSON.stringify({transactions:account.transactions,savingsEntries:account.savingsEntries,savingsHistory:account.savingsHistory})]));
    for(const date of ['2026-10-01','2027-02-01','2026-09-30']) {
      app.store.setReferenceDate(date);
      for(const [id,account] of Object.entries(app.state.accounts)) {
        assert.deepEqual(account.categories.map(category=>[category.id,category.limit,category.currency]),limits[id]);
        assert.equal(JSON.stringify({transactions:account.transactions,savingsEntries:account.savingsEntries,savingsHistory:account.savingsHistory}),history[id]);
        assert.equal(account.categories[0].spent,date==='2026-09-30'?240:0);
        assert.equal(account.derived.financials.plannedMonthlyBudget,id==='personal'?1900:3650);
      }
    }
  }
});

test('planned capacity does not invent income, available cash or safe spending before payday',()=>{
  const app=setup(),cash=app.personal.availableBalance;
  app.store.setReferenceDate('2026-10-01');
  const plan=app.personal.derived.financials;
  assert.equal(plan.plannedMonthlyBudget,1900);
  assert.equal(plan.monthlyIncome,0);
  assert.equal(plan.monthlyBudget,0);
  assert.equal(plan.safeRemaining,-1600);
  assert.equal(plan.spendablePool,-1600);
  assert.equal(app.personal.availableBalance,cash);
  assert.equal(app.personal.transactions.length,2);
});

test('budget summary and recovery compare saved category limits with the plan, while safe remaining stays actual',()=>{
  const app=setup();app.store.setReferenceDate('2026-10-01');
  const ui=uiHarness(app);ui.context.renderBudgetView();
  assert.equal(ui.nodes.get('#fullBudgetValue').textContent,'1900 EUR');
  assert.equal(ui.nodes.get('#fullRemainingValue').textContent,'-1600 EUR');
  assert.match(ui.nodes.get('#unallocatedValue').textContent,/260 EUR/);
  assert.equal(ui.nodes.get('#budgetRecovery').hidden,true);
  assert.equal(ui.nodes.get('#autoBalanceBudget').hidden,true);
  assert.equal(ui.nodes.get('#allocationStatus').textContent,'allocationPercent:{"percent":86}');
});

test('an unchanged carried limit and a deliberate edit can be saved when no current-month income is posted',()=>{
  const app=setup();app.store.setReferenceDate('2026-10-01');
  const businessBefore=JSON.stringify(app.business.categories),transactions=JSON.stringify(app.personal.transactions);
  const ui=uiHarness(app);ui.context.openBudgetEditor('food');
  assert.equal(ui.nodes.get('#budgetLimitInput').value,480);
  assert.equal(ui.nodes.get('#budgetLimitInput').max,'740.00');
  ui.submit();assert.deepEqual(ui.saved,['category-edit']);
  ui.nodes.get('#budgetLimitInput').value='520';ui.submit();
  assert.equal(app.personal.categories[0].limit,520);
  assert.equal(JSON.stringify(app.personal.transactions),transactions);
  assert.equal(JSON.stringify(app.business.categories),businessBefore);
  app.store.setReferenceDate('2027-01-01');
  assert.equal(app.personal.categories[0].limit,520);
  assert.equal(app.personal.derived.financials.monthlyIncome,0);
});

test('explicit zero category limits persist and are never restored from an older nonzero value',()=>{
  const app=setup();app.store.setReferenceDate('2026-10-01');
  const ui=uiHarness(app);ui.context.openBudgetEditor('food');
  ui.nodes.get('#budgetLimitInput').value='0';ui.submit();
  assert.equal(app.personal.categories[0].limit,0);
  app.store.setReferenceDate('2027-03-01');
  assert.equal(app.personal.categories[0].limit,0);
  assert.equal(app.personal.categories[3].limit,0);
  assert.equal(app.business.categories[0].limit,900);
  app.store.commit('unrelated-change');
  assert.equal(app.personal.categories[0].limit,0);
});

test('balancing no longer zeros carried limits solely because the new month has no posted income',()=>{
  const app=setup();app.store.setReferenceDate('2026-10-01');
  const ui=uiHarness(app),limits=app.personal.categories.map(category=>category.limit);
  ui.balance();
  assert.deepEqual(app.personal.categories.map(category=>category.limit),limits);
  assert.deepEqual(ui.saved,[],'No unnecessary category mutation is persisted');
  app.personal.categories[2].limit=1960;app.store.commit('test-plan-overallocation');
  ui.context.renderBudgetView();assert.equal(ui.nodes.get('#autoBalanceBudget').hidden,false);
  ui.balance();
  assert.equal(app.personal.categories.reduce((sum,category)=>sum+category.limit,0),1900);
  assert.deepEqual(ui.saved,['budget-auto-balance']);
  assert.equal(app.personal.derived.financials.monthlyIncome,0);
});

test('explicit zero planned capacity is respected even if recorded income is positive',()=>{
  const app=setup();app.personal.income=0;app.personal.bills=0;app.personal.savingsTarget=0;
  app.personal.categories.forEach(category=>{category.limit=0;});
  app.store.commit('zero-plan');
  const ui=uiHarness(app);ui.context.renderBudgetView();ui.context.openBudgetEditor('paused');
  assert.equal(app.personal.derived.financials.plannedMonthlyBudget,0);
  assert.equal(app.personal.derived.financials.monthlyBudget,3500);
  assert.equal(ui.nodes.get('#fullBudgetValue').textContent,'0 EUR');
  assert.equal(ui.nodes.get('#budgetLimitInput').max,'0.00');
  ui.nodes.get('#budgetLimitInput').value='1';ui.submit();
  assert.deepEqual(ui.saved,[]);
  assert.equal(app.personal.categories[3].limit,0);
});

test('category editing still enforces the spending floor and overall planned allocation',()=>{
  const app=setup(),ui=uiHarness(app);ui.context.openBudgetEditor('food');
  assert.equal(ui.nodes.get('#budgetLimitInput').min,'240.00');
  for(const value of ['239.99','740.01']) {
    ui.nodes.get('#budgetLimitInput').value=value;ui.submit();
    assert.equal(app.personal.categories[0].limit,480);
  }
  assert.deepEqual(ui.saved,[]);
});

test('planned capacity uses exact financial rounding and the visible budget label identifies planned money',()=>{
  const plan=Core.FinancialEngine.calculate({income:1000.01,bills:100.01,savingsTarget:50.02,guard:.1,transactions:[]},'2026-10-01');
  assert.equal(plan.plannedMonthlyBudget,749.98);
  assert.equal(plan.monthlyIncome,0);
  assert.match(source,/monthlyBudget:'Planirani fleksibilni budžet'/);
  assert.match(fs.readFileSync(require.resolve('../index.html'),'utf8'),/data-i18n="monthlyBudget">Planirani fleksibilni budžet/);
});
