'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Charts = require('../insight-charts.js');
const Insights = require('../insight-core.js');
const Core = require('../core.js');
const Store = require('../state-store.js');
const Accounting = require('../accounting-core.js');
const Discovery = require('../discovery-core.js');
const app = fs.readFileSync(require.resolve('../app.js'),'utf8');
const html = fs.readFileSync(require.resolve('../index.html'),'utf8');
const between=(source,start,end)=>{
  const first=source.indexOf(start),last=source.indexOf(end,first+start.length);
  assert.ok(first>=0&&last>first,`${start} has a complete production fixture`);
  return source.slice(first,last);
};
const textEscape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const textDocument={createElement:()=>({textContent:'',get innerHTML(){return textEscape(this.textContent);}})};

const data = () => ({
  granularity:'day', totals:{count:3},
  series:[
    {key:'2026-09-01', balance:1000, income:1000, expenses:0, growth:{balance:null,income:null,expenses:null}},
    {key:'2026-09-02', balance:750, income:0, expenses:250, growth:{balance:-25,income:-100,expenses:null}},
    {key:'2026-09-03', balance:1500, income:1000, expenses:250, growth:{balance:100,income:null,expenses:0}}
  ]
});

function mountHarness(series = data(), options = {}) {
  const nodes = new Map();
  const node = selector => {
    if(!nodes.has(selector))nodes.set(selector,{
      textContent:'',value:'',attributes:{},listeners:{},
      setAttribute(key,value){this.attributes[key]=String(value);},
      addEventListener(key,handler){this.listeners[key]=handler;},
      getBoundingClientRect(){return {left:100,width:640};}
    });
    return nodes.get(selector);
  };
  const wrapper={querySelector:node};
  const host={innerHTML:'',querySelector(selector){return selector==='.interactive-insight-trend' && this.innerHTML.includes('class="interactive-insight-trend"')?wrapper:null;}};
  Charts.mount(host,series,{locale:'hr-HR',currency:'EUR',...options});
  return {host,node,nodes,select(index){node('.insight-plot-window').listeners.keydown({key:'Home',preventDefault(){}});for(let i=0;i<index;i++)node('.insight-plot-window').listeners.keydown({key:'ArrowRight',preventDefault(){}});}};
}

test('top-metric charts use a unique cumulative line for net and dedicated income/expense bars',()=>{
  const net=Charts.chartMarkup(data(),{mode:'balance'}),income=Charts.chartMarkup(data(),{mode:'income'}),expenses=Charts.chartMarkup(data(),{mode:'expenses'});
  assert.match(net,/class="insight-trend-line"/);
  assert.doesNotMatch(net,/class="insight-trend-bar/);
  assert.match(income,/class="insight-trend-bar income"/);
  assert.match(expenses,/class="insight-trend-bar expenses"/);
  assert.doesNotMatch(income,/insight-trend-bar expenses/);
  assert.doesNotMatch(expenses,/insight-trend-bar income/);
  for(const markup of [net,income,expenses]){
    assert.doesNotMatch(markup,/type="range"|insight-trend-selector/);
    assert.match(markup,/class="insight-plot-window" tabindex="0" role="group"/);
    assert.match(markup,/aria-live="polite"/);
    assert.doesNotMatch(markup,/NaN|Infinity|undefined/);
  }
});

test('hover, touch and accessible keyboard selection show exact date, currency amount and interval growth',()=>{
  const h=mountHarness(data(),{mode:'balance'});
  assert.equal(h.node('.trend-amount').textContent,Core.formatCurrency(1500,{locale:'hr-HR',currency:'EUR'}));
  assert.match(h.node('.trend-date').textContent,/3\. rujna 2026/);
  assert.match(h.node('.trend-growth').textContent,/\+100%/);
  h.node('svg').listeners.pointermove({clientX:420});
  assert.equal(h.node('.insight-plot-window').attributes['data-selected-index'],'1');
  assert.equal(h.node('.trend-amount').textContent,Core.formatCurrency(750,{locale:'hr-HR',currency:'EUR'}));
  assert.match(h.node('.trend-growth').textContent,/[-−]25%/);
  h.node('svg').listeners.pointerdown({clientX:124});
  assert.equal(h.node('.insight-plot-window').attributes['data-selected-index'],'0');
  assert.match(h.node('.trend-growth').textContent,/Nema usporedive/);
  h.select(2); // Keyboard focus stays on the plot itself, with no extra slider.
  assert.equal(h.node('.insight-plot-window').attributes['aria-label'],`Odaberite datum na grafikonu: ${h.node('.trend-date').textContent}: ${h.node('.trend-amount').textContent}`);
  assert.equal(h.node('.insight-trend-cursor').attributes.x1,h.node('.insight-trend-node').attributes.cx);
  assert.equal(h.node('.insight-trend-cursor').attributes.x2,h.node('.insight-trend-node').attributes.cx);
});

test('responsive pointer positions clamp at both chart edges and zero-width layouts ignore scrubbing',()=>{
  for(const width of [295,335,768,1150]){
    const h=mountHarness();
    h.node('svg').getBoundingClientRect=()=>({left:30,width});
    h.node('svg').listeners.pointermove({clientX:30+width/2});assert.equal(h.node('.insight-plot-window').attributes['data-selected-index'],'1');
    h.node('svg').listeners.pointermove({clientX:0});assert.equal(h.node('.insight-plot-window').attributes['data-selected-index'],'0');
    h.node('svg').listeners.pointermove({clientX:30+width+100});assert.equal(h.node('.insight-plot-window').attributes['data-selected-index'],'2');
    h.node('svg').getBoundingClientRect=()=>({left:30,width:0});
    h.node('svg').listeners.pointermove({clientX:30});assert.equal(h.node('.insight-plot-window').attributes['data-selected-index'],'2');
  }
});

test('private chart readouts and assistive labels never disclose monetary values or growth rates',()=>{
  for(const mode of ['balance','income','expenses']){
    const h=mountHarness(data(),{mode,privateMode:true});
    for(const index of [0,1,2]){
      h.select(index);
      assert.equal(h.node('.trend-amount').textContent,'Iznosi su skriveni');
      assert.equal(h.node('.trend-growth').textContent,'Iznosi su skriveni');
      assert.match(h.node('.insight-plot-window').attributes['aria-label'],/Iznosi su skriveni$/);
      assert.doesNotMatch(h.node('.insight-plot-window').attributes['aria-label'],/€|%|1\.500|750/);
    }
  }
});

test('empty, equal-value and extreme negative chart series keep finite coordinates in their viewport',()=>{
  assert.match(Charts.chartMarkup({series:[],totals:{count:0}}),/Nema transakcija/);
  const empty=mountHarness({series:[],totals:{count:0}});assert.equal(empty.nodes.size,0);
  for(const values of [[0],[10,10,10],[-1e12,0,1e12],[-100,-200,-50]]){
    const fixture={series:values.map((value,i)=>({key:`2026-09-0${i+1}`,balance:value})),totals:{count:values.length}};
    const result=Charts.geometry(fixture,'balance');
    for(const point of result.points){assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));assert.ok(point.x>=24&&point.x<=616);assert.ok(point.y>=20&&point.y<=174);}
    assert.ok(result.zero>=20&&result.zero<=174);
    assert.doesNotMatch(Charts.chartMarkup(fixture),/NaN|Infinity|undefined/);
  }
});

test('chart date labels preserve calendar buckets and markup escapes malformed external date text',()=>{
  const options={locale:'en-IE'};
  assert.equal(Charts.dateLabel({key:'2026'}, {granularity:'year'}, options),'2026');
  assert.equal(Charts.dateLabel({key:'2026-09'}, {granularity:'month'}, options),'September 2026');
  assert.match(Charts.dateLabel({key:'2026-09-18T09'}, {granularity:'hour'}, options),/18 September 2026 · 09:00/);
  const bad={series:[{key:'<img src=x onerror="alert(1)">',balance:5}],totals:{count:1}};
  const markup=Charts.chartMarkup(bad,options);
  assert.doesNotMatch(markup,/<img\b|onerror="/);assert.match(markup,/&lt;img/);
});

test('chart readouts follow posted state updates and profile switches without importing the other profile history',()=>{
  const profile=(label,amount)=>({accountLabel:label,transactions:[{id:label,type:'income',amount,date:'2026-09-18',category:'salary'}],categories:[],incomeCategories:[],goalBuckets:[],savingsEntries:[],recurring:[],financialOpeningBalance:0});
  const personal=profile('personalAccount',1000),business=profile('businessAccount',9000);
  const appState={activeAccount:'personal',accounts:{personal,business},settings:{currency:'EUR'}};
  const store=Store.createStore(appState,{referenceDate:'2026-09-18'});
  let visible;
  const render=()=>{visible=mountHarness(Insights.cumulativeSeries(appState.accounts[appState.activeAccount],'monthly','2026-09-18',{profileId:appState.activeAccount}),{mode:'balance'});};
  store.subscribe(render);render();
  assert.equal(visible.node('.trend-amount').textContent,Core.formatCurrency(1000,{locale:'hr-HR',currency:'EUR'}));
  store.update('add-income',(_draft,current)=>current.transactions.push({id:'bonus',type:'income',amount:200,date:'2026-09-18'}));
  assert.equal(visible.node('.trend-amount').textContent,Core.formatCurrency(1200,{locale:'hr-HR',currency:'EUR'}));
  store.update('future-entry',(_draft,current)=>current.transactions.push({id:'scheduled',type:'income',amount:8888,date:'2026-09-19',status:'scheduled'}));
  assert.equal(visible.node('.trend-amount').textContent,Core.formatCurrency(1200,{locale:'hr-HR',currency:'EUR'}));
  store.switchAccount('business');
  assert.equal(visible.node('.trend-amount').textContent,Core.formatCurrency(9000,{locale:'hr-HR',currency:'EUR'}));
  store.update('add-expense',(_draft,current)=>current.transactions.push({id:'invoice',type:'expense',amount:250,date:'2026-09-18'}));
  assert.equal(visible.node('.trend-amount').textContent,Core.formatCurrency(8750,{locale:'hr-HR',currency:'EUR'}));
  store.switchAccount('personal');
  assert.equal(visible.node('.trend-amount').textContent,Core.formatCurrency(1200,{locale:'hr-HR',currency:'EUR'}));
});

function applicationFixture() {
  const personal={accountLabel:'personalAccount',income:2000,bills:200,savingsTarget:100,guard:.1,financialOpeningBalance:100,transactions:[
    {id:'old',type:'income',amount:250,date:'2026-08-31'},
    {id:'income',type:'income',amount:2000,date:'2026-09-01'},
    {id:'fixed',type:'expense',amount:200,date:'2026-09-02',category:'utilities'},
    {id:'variable',type:'expense',amount:100,date:'2026-09-03',category:'food'},
    {id:'future',type:'expense',amount:3000,date:'2026-10-01',category:'food'}
  ],categories:[{id:'utilities',name:'Režije',limit:500},{id:'food',name:'Hrana',limit:500}],incomeCategories:[],goalBuckets:[],savingsEntries:[],recurring:[]};
  const business={...personal,accountLabel:'businessAccount',financialOpeningBalance:0,transactions:[{id:'business',type:'income',amount:9000,date:'2026-09-18'}],categories:[]};
  const appState={activeAccount:'personal',accounts:{personal,business},settings:{currency:'EUR',hideBalances:false}};
  const store=Store.createStore(appState,{referenceDate:'2026-09-18'}),chart=mountHarness({series:[],totals:{count:0}}),nodes=new Map([['#insightExpandedChart',chart.host]]);
  const node=selector=>{
    if(!nodes.has(selector))nodes.set(selector,{textContent:'',innerHTML:'',dataset:{},style:{setProperty(){}},classList:{toggle(){}},setAttribute(){}});
    return nodes.get(selector);
  };
  const context=vm.createContext({MerCore:Core,MerAccounting:Accounting,MerDiscovery:Discovery,MerInsights:Insights,MerInsightCharts:Charts,document:textDocument,state:personal,appState,appReferenceDate:'2026-09-18',activeMonth:8,currentLang:'hr',insightsTimeframe:'monthly',$:node,t:(key,values={})=>`${key}${Object.values(values).join(' ')}`,renderOverviewBreakdown(){}});
  const source=[between(app,'const locale =','function inferredCategoryIconId('),between(app,'function getPlan()','function applyStaticTranslations('),between(app,'function escapeHtml(','function cashflowLabel('),between(app,'function renderOverview()','function renderOverviewBreakdown('),between(app,'function categorySummarySlices(','function compactChartCurrency('),between(app,'const insightDetailCopy =','function renderAll(')].join('\n');
  vm.runInContext(source,context);
  store.subscribe(event=>{context.state=event.activeProfile;});
  return {context,store,node,chart,personal,business,appState};
}

test('production top metric modal handlers select unique plots and honor the active timeframe',()=>{
  const h=applicationFixture();
  h.context.renderInsightDetail('net');
  assert.equal(h.node('#insightChartTitle').textContent,'Kumulativno stanje novca');
  assert.match(h.node('#insightChartIntro').textContent,/Neevidentirana imovina i dugovi nisu uključeni/);
  assert.match(h.chart.host.innerHTML,/insight-trend-line/);
  assert.equal(h.chart.node('.trend-amount').textContent,Core.formatCurrency(2050,{locale:'hr-HR',currency:'EUR'}));
  h.context.renderInsightDetail('income');assert.match(h.chart.host.innerHTML,/insight-trend-bar income/);
  h.chart.select(0);assert.equal(h.chart.node('.trend-amount').textContent,Core.formatCurrency(2000,{locale:'hr-HR',currency:'EUR'}));
  h.context.renderInsightDetail('expenses');assert.match(h.chart.host.innerHTML,/insight-trend-bar expenses/);
  h.chart.select(1);assert.equal(h.chart.node('.trend-amount').textContent,Core.formatCurrency(200,{locale:'hr-HR',currency:'EUR'}));
  h.context.insightsTimeframe='daily';h.context.renderInsightDetail('expenses');
  assert.match(h.chart.host.innerHTML,/Nema transakcija/);
  h.context.insightsTimeframe='monthly';h.store.switchAccount('business');h.context.renderInsightDetail('net');
  assert.equal(h.chart.node('.trend-amount').textContent,Core.formatCurrency(9000,{locale:'hr-HR',currency:'EUR'}));
});

test('fixed-versus-flexible detail is a ratio breakdown, not another category-donut or ranked merchant chart',()=>{
  const h=applicationFixture();h.context.renderInsightDetail('expense-structure');
  assert.equal(h.node('#insightChartTitle').textContent,'Fiksni i fleksibilni troškovi');
  const markup=h.chart.host.innerHTML;
  assert.match(markup,/class="expense-structure-meter"/);
  assert.match(markup,/width:66\.67%/);assert.match(markup,/width:33\.33%/);
  assert.match(markup,/Režije/);assert.match(markup,/Hrana/);
  assert.doesNotMatch(markup,/category-donut|expanded-ranked|topMerchants/);
  assert.equal(h.node('#insightExpandedMetrics').innerHTML,'');
});

test('expense detail safely bounds long category lists while preserving the hidden tail amount in visible aggregates',()=>{
  const h=applicationFixture();
  const categories=['fixed','variable'].flatMap(behavior=>Array.from({length:5},(_,i)=>({behavior,categoryId:`${behavior}-${i}`,amount:(i+1)*10})));
  h.personal.categories=categories.map(row=>({id:row.categoryId,name:`${row.categoryId} <img src=x onerror="alert(1)">`}));
  const markup=h.context.expenseStructureMarkup({fixed:150,variable:150,total:300,fixedShare:50,variableShare:50,categories,hasCorrections:false},true);
  assert.equal((markup.match(/class="expense-structure-category"/g)||[]).length,8);
  assert.equal((markup.match(/Ostale kategorije/g)||[]).length,2);
  assert.equal(markup.split(Core.formatCurrency(90,{locale:'hr-HR',currency:'EUR'})).length-1,2);
  assert.match(markup,/&lt;img/);assert.doesNotMatch(markup,/<img\b/);
  assert.doesNotMatch(markup,/fixed-3|fixed-4|variable-3|variable-4/);
});

test('the itemized calculation renders the canonical remaining pool, buffer, spent adjustment and exact daily division',()=>{
  const h=applicationFixture();h.context.renderOverview();
  const financials=h.personal.derived.financials,money=value=>Core.formatCurrency(value,{locale:'hr-HR',currency:'EUR'});
  assert.equal(h.node('#calcIncome').textContent,`+ ${money(financials.monthlyIncome)}`);
  assert.equal(h.node('#calcBills').textContent,`− ${money(financials.bills)}`);
  assert.equal(h.node('#calcSavings').textContent,`− ${money(financials.savingsTarget)}`);
  assert.equal(h.node('#calcBudget').textContent,`= ${money(financials.safeRemaining)}`);
  assert.equal(h.node('#calcSafe').textContent,`= ${money(financials.safeDaily)}`);
  assert.equal(h.node('#calcBuffer').textContent,`−${money(financials.buffer)}`);
  assert.equal(h.node('#calcSpent').textContent,`−${money(financials.monthlyExpenses)}`);
  assert.match(h.node('#calcDays').textContent,/13/);
  assert.equal(financials.safeDaily,Core.roundMoney(financials.safeRemaining/13));
  h.store.update('income-bonus',(_draft,current)=>current.transactions.push({id:'bonus',type:'income',amount:130,date:'2026-09-18'}));
  h.context.renderOverview();
  assert.equal(h.node('#calcSafe').textContent,`= ${money(Core.roundMoney(financials.safeDaily+10))}`);
});

test('budget statement contains exactly five visible financial rows, including explicit deductions and no tab navigation',()=>{
  const modal=between(html,'id="breakdownModal"','</dialog>');
  const statement=between(modal,'<ol class="financial-statement"','</ol>');
  assert.equal((statement.match(/<li(?:\s|>)/g)||[]).length,5);
  for(const id of ['calcIncome','calcBills','calcSavings','calcBuffer','calcSpent','calcBudget','calcSafe','calcDays'])assert.equal((statement.match(new RegExp(`id="${id}"`,'g'))||[]).length,1);
  assert.match(statement,/financial-statement-adjustments/);
  assert.doesNotMatch(modal,/data-page|role="tab"|pagination/);
  const styles=fs.readFileSync(require.resolve('../insight-refinement.css'),'utf8');
  assert.match(styles,/#breakdownModal \.financial-statement\s*\{[^}]*display:grid/);
  assert.doesNotMatch(styles,/overflow(?:-[xy])?\s*:\s*(?:auto|scroll)/);
  for(const file of ['insight-core.js','insight-charts.js','insight-refinement.css'])assert.ok(html.includes(file),`${file} is loaded on cold start`);
});
