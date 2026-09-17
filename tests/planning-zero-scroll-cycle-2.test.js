'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../enterprise-ui.js'),'utf8');

test('cash-flow tabs expose one complete view and redraw the visible chart',()=>{
  const keys=['overview','chart','bills','analysis','about'];
  const buttons=keys.map(key=>({dataset:{forecastView:key},attributes:{},setAttribute(name,value){this.attributes[name]=value;}}));
  const panels=keys.map(key=>({dataset:{forecastPanel:key},hidden:true}));
  let redraws=0;
  const container={querySelectorAll:selector=>selector==='[data-forecast-view]'?buttons:panels};
  const context=vm.createContext({el:()=>container,resizeProjection:()=>{redraws+=1;},forecastView:'overview'});
  vm.runInContext(source.slice(source.indexOf('  function showForecastView('),source.indexOf('  function renderAnalysis(')),context);
  for(const key of keys){
    context.showForecastView(key);
    assert.deepEqual(panels.filter(panel=>!panel.hidden).map(panel=>panel.dataset.forecastPanel),[key]);
    assert.deepEqual(buttons.filter(button=>button.tabIndex===0).map(button=>button.dataset.forecastView),[key]);
  }
  assert.equal(redraws,1,'opening the chart measures its visible dimensions');
});

test('long AI explanations keep every character across accessible pages',()=>{
  const box={innerHTML:''},attachments=[];
  const context=vm.createContext({el:()=>box,esc:value=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;'),appState:{activeAccount:'personal'},copy:(_,en)=>en,window:{MerPagination:{attach:(container,options)=>attachments.push({container,options})}}});
  vm.runInContext(source.slice(source.indexOf('  function renderAnalysis('),source.indexOf('  async function analyzeCashflow(')),context);
  const message=('Income arrives before your next scheduled payment. '.repeat(32))+'<script>unsafe</script>';
  context.renderAnalysis(message);
  const chunks=[...box.innerHTML.matchAll(/<p class="forecast-analysis-page">([\s\S]*?)<\/p>/g)].map(match=>match[1]);
  assert.ok(chunks.length>4);assert.ok(chunks.every(chunk=>chunk.length<260));
  assert.equal(chunks.join('').replace(/&lt;/g,'<').replace(/&amp;/g,'&'),message,'pagination never truncates generated explanation text');
  assert.ok(!box.innerHTML.includes('<script>'));
  assert.equal(attachments[0].options.pageSize,1);
  assert.equal(attachments[0].options.scopeKey,'personal');
});
