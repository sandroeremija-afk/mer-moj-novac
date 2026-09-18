'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../enterprise-ui.js'),'utf8');
const discovery=require('../discovery-core.js');
const esc=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');

test('cash flow is a single chart with accessible model limits and no summary or option controls',()=>{
  let redraws=0,restores=0;
  const container={innerHTML:''};
  const context=vm.createContext({
    el:()=>container,window:{MerPlanNavigation:{preserveFocus:()=>()=>{restores++;}}},intelligence:{},
    forecast:()=>({confidence:'limited-history',foreignCurrencyCount:3}),
    copy:(_,en)=>en,esc,renderProjection:()=>{redraws++;},requestAnimationFrame:callback=>callback(),resizeProjection:()=>{}
  });
  vm.runInContext(source.slice(source.indexOf('  function renderForecast('),source.indexOf('  function openIntelligence(')),context);
  context.renderForecast();
  assert.match(container.innerHTML,/cashflow-visual[\s\S]*forecast-chart/);
  assert.doesNotMatch(container.innerHTML,/cashflow-summary|enterprise-metrics|analyzeCashflow|cashflowAnalysis|forecastEventPicker|<button|<select|<input/);
  assert.match(container.innerHTML,/id="forecastModelNote" class="forecast-model-note forecast-accessible"/);
  assert.match(container.innerHTML,/Limited history/);assert.match(container.innerHTML,/3 foreign-currency records excluded; no conversion/);
  assert.match(container.innerHTML,/available only after posting/);
  assert.equal(redraws,1);assert.equal(restores,1);
  assert.doesNotMatch(source,/function renderAnalysis|function analyzeCashflow|pendingAnalysis/,'the retired cash-flow AI action leaves no request or pagination lifecycle');
});

function chartHarness(){
  const tooltip={hidden:true,innerHTML:'',style:{},offsetWidth:210,offsetHeight:110};
  const inspector={textContent:''};
  const attributes=()=>({values:{},setAttribute(name,value){this.values[name]=value;}});
  const guide=attributes(),dot=attributes(),points=[];
  const svg={getBoundingClientRect:()=>({left:0,top:0,width:680}),contains:node=>points.includes(node)};
  const chart={innerHTML:'',clientWidth:680,getBoundingClientRect:()=>({left:0,top:0}),querySelector:selector=>({svg,'.forecast-tooltip':tooltip,'.forecast-hover-line':guide,'.forecast-hover-dot':dot,'.forecast-inspector':inspector})[selector]||points[Number(/="(\d+)"/.exec(selector)?.[1])]};
  const profile={profileId:'personal',financialOpeningBalance:1000,availableBalance:0,transactions:[
    {id:'bill',date:'2026-09-19',amount:20,type:'expense',name:'Bill <unsafe>',profileId:'personal',currency:'EUR'},
    {id:'income',date:'2026-09-19',amount:200,type:'income',name:'Salary',profileId:'personal',currency:'EUR'},
    {id:'foreign',date:'2026-09-19',amount:9000,type:'expense',name:'Dollar bill',profileId:'personal',currency:'USD'},
    {id:'other',date:'2026-09-19',amount:8000,type:'expense',name:'Business bill',profileId:'business',currency:'EUR'}
  ],goalBuckets:[],savingsEntries:[],recurring:[],categories:[]};
  const context=vm.createContext({el:()=>({querySelector:()=>chart}),window:{innerHeight:768,innerWidth:1366},
    MerDiscovery:discovery,MerQuickToolsCore:require('../quick-tools-core.js'),state:profile,appReferenceDate:'2026-09-18',
    appState:{activeAccount:'personal',settings:{currency:'EUR',hideBalances:false}},projectionWidth:0,
    money:value=>`${(value/100).toFixed(2)} EUR`,copy:(_,en)=>en,formatIsoDate:value=>value,esc
  });
  for(let index=0;index<31;index++)points.push({
    dataset:{forecastPoint:String(index)},closest(){return this;},setAttribute(){},focus(){chart.onfocusin({target:this});}
  });
  vm.runInContext(source.slice(source.indexOf('  function renderProjection('),source.indexOf('  function renderForecast(')),context);
  context.renderProjection();
  return {context,chart,tooltip,inspector,points,svg,profile,guide,dot};
}

test('forecast reveals the real scoped balance and event details only on hover, touch or focus',()=>{
  const app=chartHarness(),snapshot=JSON.stringify(app.profile);
  assert.doesNotMatch(app.chart.innerHTML,/<text|forecast-legend|forecast-axis/,'dates and monetary axis text are absent');
  assert.match(app.chart.innerHTML,/forecast-tooltip" role="tooltip" hidden/);
  assert.match(app.chart.innerHTML,/aria-describedby="forecastModelNote"/);
  assert.equal((app.chart.innerHTML.match(/data-forecast-point=/g)||[]).length,31);
  assert.equal(app.tooltip.hidden,true);assert.equal(app.inspector.textContent,'');
  app.points[1].focus();
  const model=discovery.forecastChart(app.profile,'2026-09-18',{profileId:'personal',currency:'EUR'});
  assert.ok(app.tooltip.innerHTML.includes(`${(model.series[1].balanceCents/100).toFixed(2)} EUR`));
  for(const text of ['2026-09-19','Bill &lt;unsafe>','20.00 EUR','Salary','200.00 EUR'])assert.ok(app.tooltip.innerHTML.includes(text));
  assert.doesNotMatch(app.tooltip.innerHTML,/Dollar bill|Business bill/);
  assert.equal(app.tooltip.hidden,false);assert.match(app.inspector.textContent,/Bill <unsafe>/);
  app.svg.onpointerleave();assert.equal(app.tooltip.hidden,true);assert.equal(app.inspector.textContent,'');
  app.svg.onpointerdown({clientX:16+(680-32)/30});assert.equal(app.tooltip.hidden,false);assert.match(app.tooltip.innerHTML,/2026-09-19/);
  app.chart.onfocusout({relatedTarget:null});assert.equal(app.tooltip.hidden,true);
  assert.equal(JSON.stringify(app.profile),snapshot,'opening and exploring the projection does not change financial data');
});

test('stealth mode masks forecast totals and event amounts in both tooltip and accessible labels',()=>{
  const app=chartHarness();app.context.appState.settings.hideBalances=true;app.context.renderProjection();app.points[1].focus();
  assert.match(app.tooltip.innerHTML,/Amount hidden/);assert.match(app.inspector.textContent,/Amount hidden/);
  assert.doesNotMatch(app.chart.innerHTML,/\d\.\d{2} EUR/);assert.doesNotMatch(app.tooltip.innerHTML,/\d\.\d{2} EUR/);
  assert.doesNotMatch(app.inspector.textContent,/\d\.\d{2} EUR/);
  app.context.state={...app.profile,profileId:'business',financialOpeningBalance:500,transactions:[]};app.context.appState.activeAccount='business';
  app.context.appState.settings.hideBalances=false;app.context.renderProjection();app.points[1].focus();
  assert.doesNotMatch(app.tooltip.innerHTML,/Bill|Salary/);assert.match(app.tooltip.innerHTML,/500\.00 EUR/);
});

test('cash flow keeps only its bottom-left close action and a viewport-sized plot',()=>{
  const css=fs.readFileSync(require.resolve('../enterprise.css'),'utf8');
  assert.match(source,/intelligence\.querySelector\('\.enterprise-dialog-head \[data-enterprise-close\]'\)\.remove\(\)/);
  assert.match(source,/intelligence\.querySelector\('\[data-enterprise-footer-close\]'\)\.setAttribute\('autofocus',''\)/,'opening the modal does not reveal a point tooltip automatically');
  assert.match(css,/#intelligenceModal \.enterprise-footer\{justify-content:flex-start/);
  assert.match(css,/\.forecast-accessible,#intelligenceModal \.forecast-inspector\{[^}]*position:absolute[^}]*clip-path:inset\(50%\)/);
  const app=chartHarness();app.context.window.innerWidth=375;app.context.window.innerHeight=667;app.chart.clientWidth=291;app.context.renderProjection();
  const height=Number(/style="height:(\d+)px"/.exec(app.chart.innerHTML)[1]);
  assert.ok(height<=app.context.window.innerHeight-230);
  assert.doesNotMatch(css,/cashflow-summary|cashflow-ai-toolbar|forecast-event-picker/);
});
