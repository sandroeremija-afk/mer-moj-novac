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
  const doc={activeElement:null};
  const svg={getBoundingClientRect:()=>({left:0,top:0,width:680}),contains:node=>points.includes(node)};
  const chart={innerHTML:'',clientWidth:680,contains:node=>points.includes(node),getBoundingClientRect:()=>({left:0,top:0}),querySelector:selector=>({svg,'.forecast-tooltip':tooltip,'.forecast-hover-line':guide,'.forecast-hover-dot':dot,'.forecast-inspector':inspector})[selector]||points[Number(/="(\d+)"/.exec(selector)?.[1])]};
  let markup='';
  Object.defineProperty(chart,'innerHTML',{get:()=>markup,set(value){
    markup=value;if(points.includes(doc.activeElement))doc.activeElement=null;
    points.length=0;tooltip.hidden=true;inspector.textContent='';
    for(const match of value.matchAll(/data-forecast-point="(\d+)" tabindex="(-?\d+)"/g))points.push({
      dataset:{forecastPoint:match[1]},tabindex:match[2],focusVisible:true,closest(){return this;},matches(){return this.focusVisible;},setAttribute(name,value){this[name]=value;},
      focus(options){doc.activeElement=this;this.focusOptions=options;chart.onfocusin?.({target:this});}
    });
  }});
  const profile={profileId:'personal',financialOpeningBalance:1000,availableBalance:0,transactions:[
    {id:'bill',date:'2026-09-19',amount:20,type:'expense',name:'Bill <unsafe>',profileId:'personal',currency:'EUR'},
    {id:'income',date:'2026-09-19',amount:200,type:'income',name:'Salary',profileId:'personal',currency:'EUR'},
    {id:'foreign',date:'2026-09-19',amount:9000,type:'expense',name:'Dollar bill',profileId:'personal',currency:'USD'},
    {id:'other',date:'2026-09-19',amount:8000,type:'expense',name:'Business bill',profileId:'business',currency:'EUR'}
  ],goalBuckets:[],savingsEntries:[],recurring:[],categories:[]};
  const context=vm.createContext({el:()=>({querySelector:()=>chart}),window:{innerHeight:768,innerWidth:1366},document:doc,
    MerDiscovery:discovery,MerQuickToolsCore:require('../quick-tools-core.js'),state:profile,appReferenceDate:'2026-09-18',
    appState:{activeAccount:'personal',settings:{currency:'EUR',hideBalances:false}},projectionWidth:0,projectionHeight:0,requestAnimationFrame(){},resizeProjection(){},
    money:value=>`${(value/100).toFixed(2)} EUR`,copy:(_,en)=>en,formatIsoDate:value=>value,esc
  });
  vm.runInContext(source.slice(source.indexOf('  function renderProjection('),source.indexOf('  function renderForecast(')),context);
  context.renderProjection();
  return {context,chart,tooltip,inspector,points,svg,profile,guide,dot,document:doc};
}

test('forecast shows labeled axes and highlights while retaining scoped hover, touch and focus details',()=>{
  const app=chartHarness(),snapshot=JSON.stringify(app.profile);
  assert.match(app.chart.innerHTML,/forecast-money-axis/);
  assert.match(app.chart.innerHTML,/forecast-date-axis/);
  assert.equal((app.chart.innerHTML.match(/data-forecast-highlight=/g)||[]).length,3);
  assert.equal((app.chart.innerHTML.match(/data-forecast-marker=/g)||[]).length,3);
  assert.match(app.chart.innerHTML,/Peak balance|Lowest balance|Month-end balance/);
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
  const left=Number(/class="forecast-gridline"[^>]*x1="([^"]+)"/.exec(app.chart.innerHTML)[1]);
  app.svg.onpointerdown({clientX:left+(680-left-18)/30});assert.equal(app.tooltip.hidden,false);assert.match(app.tooltip.innerHTML,/2026-09-19/);
  app.chart.onfocusout({relatedTarget:null});assert.equal(app.tooltip.hidden,true);
  assert.equal(JSON.stringify(app.profile),snapshot,'opening and exploring the projection does not change financial data');
});

test('zero cash-flow axis ticks omit decimal places in Croatian and English',()=>{
  const app=chartHarness();
  const labels=()=>[...app.chart.innerHTML.matchAll(/class="forecast-axis forecast-money-axis"[^>]*>([^<]*)<\/text>/g)].map(match=>match[1].replace(/\u00a0/g,' '));
  assert.ok(labels().includes('€0'));
  app.context.copy=(hr)=>hr;app.context.renderProjection();
  assert.ok(labels().includes('0 €'));
  assert.ok(!labels().includes('0,00 €'));
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
  assert.ok(height+168<=app.context.window.innerHeight-210,'compact callouts share the viewport budget with the plot');
  assert.match(app.chart.innerHTML,/forecast-highlights is-narrow/);
  assert.equal((app.chart.innerHTML.match(/forecast-date-axis/g)||[]).length,3,'mobile date ticks have breathing room');
  assert.doesNotMatch(css,/cashflow-summary|cashflow-ai-toolbar|forecast-event-picker/);
});

test('cash-flow drawing coordinates follow allocated plot height instead of the retired 330px cap',()=>{
  const app=chartHarness();app.svg.clientHeight=486;app.context.renderProjection();
  assert.match(app.chart.innerHTML,/viewBox="0 0 680 486"/);
  assert.equal(app.context.projectionHeight,486);
  app.svg.clientHeight=238;app.context.renderProjection();
  assert.match(app.chart.innerHTML,/viewBox="0 0 680 238"/);
  assert.equal(app.context.projectionHeight,238);
});

test('cash-flow redraw preserves the keyboard-focused day, roving tabindex and tooltip',()=>{
  const app=chartHarness();app.points[12].focus();
  const previous=app.document.activeElement;
  app.svg.clientHeight=486;app.context.renderProjection();
  assert.notEqual(app.document.activeElement,previous,'focus belongs to the newly created point');
  assert.equal(app.document.activeElement,app.points[12]);
  assert.equal(app.points[0].tabindex,'-1');assert.equal(app.points[12].tabindex,'0');
  assert.equal(app.points[12].focusOptions.preventScroll,true);
  assert.equal(app.tooltip.hidden,false);assert.match(app.tooltip.innerHTML,/2026-09-30/);
  app.chart.clientWidth=420;app.context.renderProjection();
  assert.equal(app.document.activeElement,app.points[12]);assert.equal(app.tooltip.hidden,false);
});

test('cash-flow resize does not move focus from a footer or convert pointer focus into keyboard focus',()=>{
  const app=chartHarness(),footer={closest:()=>null};app.document.activeElement=footer;
  app.svg.onpointermove({clientX:400});assert.equal(app.tooltip.hidden,false);
  app.svg.clientHeight=486;app.context.renderProjection();
  assert.equal(app.document.activeElement,footer);assert.equal(app.tooltip.hidden,true);
  app.points[8].focus();app.points[8].focusVisible=false;app.context.renderProjection();
  assert.equal(app.document.activeElement,null);assert.equal(app.tooltip.hidden,true);
});
