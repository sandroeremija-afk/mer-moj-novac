'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../enterprise-ui.js'),'utf8');

test('cash flow shows its summary, AI action, chart, events and model limits together',()=>{
  let redraws=0,restores=0;
  const owner={},inspected=[],restoredMessages=[],handlers={};
  const chart={inspectForecastDay:day=>inspected.push(day)};
  const container={innerHTML:'',querySelector:selector=>selector==='.forecast-chart'?chart:null};
  const picker={title:'',addEventListener:(type,handler)=>{handlers[type]=handler;}};
  const action={addEventListener:(type,handler)=>{handlers.analyze=handler;}};
  const events=Array.from({length:12},(_,index)=>({name:`Bill <${index}>`,kind:index===0?'income':'expense',amountCents:(index+1)*100,source:index===1?'pattern':'scheduled'}));
  const context=vm.createContext({
    el:id=>({enterpriseForecast:container,forecastEventPicker:picker,analyzeCashflow:action})[id],
    window:{MerPlanNavigation:{preserveFocus:()=>()=>{restores++;}}},intelligence:{},
    forecast:()=>({confidence:'limited-history',foreignCurrencyCount:3}),forecastOwner:owner,
    appState:{activeAccount:'personal',accounts:{personal:owner},settings:{currency:'EUR'}},state:{},appReferenceDate:'2026-09-17',
    MerDiscovery:{forecastChart:()=>({series:[{date:'2026-09-17',events:[]},{date:'2026-09-18',events}]})},
    formatIsoDate:value=>value,money:value=>`${value/100} EUR`,copy:(_,en)=>en,esc:value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;'),
    metricsMarkup:()=>'<div class="enterprise-metrics">Real local metrics</div>',
    analysisResult:{account:'personal',revision:2,message:'The real cached AI response.'},reactiveStore:{getRevision:()=>2},
    renderAnalysis:message=>restoredMessages.push(message),renderProjection:()=>{redraws++;},requestAnimationFrame:callback=>callback(),resizeProjection:()=>{},analyzeCashflow(){},act:callback=>callback()
  });
  vm.runInContext(source.slice(source.indexOf('  function renderForecast('),source.indexOf('  function renderAnalysis(')),context);
  context.renderForecast();
  assert.match(container.innerHTML,/cashflow-summary[\s\S]*enterprise-metrics[\s\S]*analyzeCashflow[\s\S]*cashflowAnalysis/);
  assert.match(container.innerHTML,/cashflow-visual[\s\S]*forecast-chart[\s\S]*forecastEventPicker[\s\S]*forecast-model-note/);
  assert.doesNotMatch(container.innerHTML,/role="tab|data-forecast-panel|\shidden/);
  assert.equal([...container.innerHTML.matchAll(/<option /g)].length,13,'every projected event remains reachable in the compact selector');
  assert.match(container.innerHTML,/Limited history/);assert.match(container.innerHTML,/3 foreign-currency records excluded; no conversion/);
  assert.match(container.innerHTML,/available only after posting/);assert.match(container.innerHTML,/Bill &lt;11>/);
  handlers.change({target:Object.assign(picker,{value:'1:11'})});
  assert.deepEqual(inspected,[1]);assert.match(picker.title,/Bill <11> · 12 EUR/);
  assert.deepEqual(restoredMessages,['The real cached AI response.']);
  assert.equal(redraws,1);assert.equal(restores,1);
  context.appState.accounts.personal={};context.renderForecast();
  assert.equal(context.analysisResult,null,'a replaced account does not retain the previous owner’s AI response');
  context.appState.settings.hideBalances=true;context.renderForecast();
  assert.match(container.innerHTML,/<option value="1:11">[^<]*Amount hidden<\/option>/);
  handlers.change({target:Object.assign(picker,{value:'1:11'})});
  assert.match(picker.title,/Amount hidden/);assert.doesNotMatch(picker.title,/12 EUR/);
});

test('long AI explanations keep every character across accessible pages',()=>{
  const box={innerHTML:''},attachments=[];
  const context=vm.createContext({el:()=>box,esc:value=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;'),appState:{activeAccount:'personal'},copy:(_,en)=>en,window:{MerPagination:{attach:(container,options)=>attachments.push({container,options})}}});
  vm.runInContext(source.slice(source.indexOf('  function renderAnalysis('),source.indexOf('  async function analyzeCashflow(')),context);
  const message=('Income arrives before your next scheduled payment. 💶 '.repeat(32))+'<script>unsafe</script>';
  context.renderAnalysis(message);
  const chunks=[...box.innerHTML.matchAll(/<p class="forecast-analysis-page">([\s\S]*?)<\/p>/g)].map(match=>match[1]);
  assert.ok(chunks.length>4);assert.ok(chunks.every(chunk=>[...chunk].length<150));
  assert.equal(chunks.join('').replace(/&lt;/g,'<').replace(/&amp;/g,'&'),message,'pagination never truncates generated explanation text');
  assert.ok(!box.innerHTML.includes('<script>'));
  assert.equal(attachments[0].options.pageSize,1);
  assert.equal(attachments[0].options.scopeKey,'personal');
});
