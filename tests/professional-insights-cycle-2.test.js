'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Charts=require('../insight-charts.js');
const Insights=require('../insight-core.js');
const Core=require('../core.js');
const Accounting=require('../accounting-core.js');
const Store=require('../state-store.js');
const options={locale:'hr-HR',currency:'EUR'};
const money=value=>Core.formatCurrency(value,options);
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const plain=markup=>markup.replace(/<[^>]*>/g,'');
const fixture=values=>({granularity:'day',openingBalance:values[0],closingBalance:values.at(-1),totals:{count:Math.max(1,values.length-1)},series:values.map((balance,index)=>({key:`2026-09-${String(index+1).padStart(2,'0')}`,balance,income:Math.max(0,balance),expenses:Math.abs(Math.min(0,balance)),opening:index===0}))});

test('cumulative smoothing uses bounded monotone cubic segments without invented intermediate extrema',()=>{
  for(const values of [[0,100,200,300],[200,100,50,0],[0,150,-100,200,-50],[-100,-100,-100],[0,1e12,-1e12,0]]){
    const result=Charts.geometry(fixture(values),'balance');
    const curves=[...result.path.matchAll(/C([\d.]+),([\d.]+) ([\d.]+),([\d.]+) ([\d.]+),([\d.]+)/g)].map(match=>match.slice(1).map(Number));
    assert.equal(curves.length,values.length-1);
    assert.doesNotMatch(result.path,/\bL/);
    for(let i=0;i<curves.length;i++){
      const start=result.points[i],end=result.points[i+1],[x1,y1,x2,y2,x3,y3]=curves[i];
      assert.ok(x1>=start.x-.01&&x1<=end.x+.01);assert.ok(x2>=start.x-.01&&x2<=end.x+.01);
      assert.ok(Math.abs(x3-end.x)<.01&&Math.abs(y3-end.y)<.01);
      let previousX=start.x;
      for(let sample=0;sample<=20;sample++){
        const t=sample/20,u=1-t,x=u*u*u*start.x+3*u*u*t*x1+3*u*t*t*x2+t*t*t*x3,y=u*u*u*start.y+3*u*u*t*y1+3*u*t*t*y2+t*t*t*y3;
        assert.ok(x>=previousX-.01);assert.ok(y>=Math.min(start.y,end.y)-.01&&y<=Math.max(start.y,end.y)+.01);
        assert.ok(x>=24-.01&&x<=616+.01&&y>=20-.01&&y<=174+.01);previousX=x;
      }
    }
    assert.match(result.area,/ Z$/);assert.ok(result.area.startsWith(result.path));
  }
});

test('net chart includes gradient area, fixed grid, opening baseline, exact bounds and period dots',()=>{
  const data=fixture([100,150,75,200]),geometry=Charts.geometry(data,'balance'),markup=Charts.chartMarkup(data,{...options,mode:'balance'});
  assert.match(markup,/<linearGradient id="mer-insight-area-balance"/);
  assert.match(markup,/class="insight-trend-area" fill="url\(#mer-insight-area-balance\)"/);
  assert.equal((markup.match(/class="insight-grid-line"/g)||[]).length,4);
  assert.ok(markup.includes(`class="insight-opening-baseline" d="M24,${geometry.points[0].y} H616"`));
  assert.ok(markup.includes(`class="insight-trend-baseline" d="M24,${geometry.zero} H616"`));
  assert.ok((markup.match(/class="insight-period-dot"/g)||[]).length>=2);
  assert.ok(markup.includes(esc(money(geometry.max))));assert.ok(markup.includes(esc(money(geometry.min))));
  assert.match(markup,/<svg[^>]*data-monetary/);
});

test('growth summaries use true opening balance and preserve negative, zero-base and exact-cent cases',()=>{
  for(const [opening,closing,change,growth] of [[100,150,50,'+50%'],[-200,-100,100,'+50%'],[100,-100,-200,'−200%'],[0,100,100,'—'],[0,0,0,'—'],[12.34,12.35,.01,'+0,08%']]){
    const data=fixture([opening,closing]),markup=Charts.chartMarkup(data,{...options,mode:'balance'});
    const summary=markup.slice(markup.indexOf('class="insight-growth-summary"'),markup.indexOf('class="interactive-insight-trend"'));
    assert.ok(summary.includes(esc(`${change>0?'+':''}${money(change)}`)),`exact change ${change}`);
    assert.ok(summary.includes(growth),`growth ${growth}`);
    assert.doesNotMatch(summary,/Infinity|NaN|undefined/);
  }
  const privateMarkup=Charts.chartMarkup(fixture([1456.78,2345.67]),{...options,mode:'balance',privateMode:true});
  assert.match(privateMarkup,/Iznosi su skriveni/);
  assert.doesNotMatch(plain(privateMarkup),/€|888,89|60,60%|1\.456,78|2\.345,67/);
});

test('monthly comparison displays every exact income and expense value without hover-only labels',()=>{
  const data=[{key:'2026-08',income:1250.5,expenses:720.25},{key:'2026-09',income:0,expenses:-10.5}];
  const markup=Charts.monthlyComparisonMarkup(data,options);
  assert.equal((markup.match(/class="monthly-comparison-row"/g)||[]).length,2);
  assert.equal((markup.match(/<strong data-monetary aria-label=/g)||[]).length,4);
  for(const amount of [1250.5,720.25,0,-10.5])assert.ok(markup.includes(`>${esc(money(amount))}</strong>`));
  assert.match(markup,/kolovoz 2026/);assert.match(markup,/rujan 2026/);
  assert.doesNotMatch(markup,/\btitle=|NaN|Infinity|undefined/);
  const widths=[...markup.matchAll(/width:([\d.]+)%/g)].map(match=>Number(match[1]));assert.ok(widths.every(value=>value>=0&&value<=100));
});

test('monthly comparison masks visible values in private mode and escapes injected labels',()=>{
  const data=[{key:'<img src=x onerror="alert(1)">',income:1234.56,expenses:789.12}];
  const markup=Charts.monthlyComparisonMarkup(data,{...options,privateMode:true});
  assert.equal((markup.match(/Iznosi su skriveni/g)||[]).length,2);
  assert.doesNotMatch(plain(markup),/€|1\.234,56|789,12/);
  assert.match(markup,/&lt;img/);assert.doesNotMatch(markup,/<img\b|onerror="/);
});

test('category comparison bounds rows, preserves exact tail totals and retains previous-only categories',()=>{
  const rows=Array.from({length:7},(_,index)=>({label:`Kategorija ${index}`,current:index<6?(index+1)*10.01:0,previous:(index+1)*5.02}));
  const copy=JSON.stringify(rows),markup=Charts.categoryMarkup({previous:140.56,categories:rows},options);
  assert.equal((markup.match(/class="insight-category-row"/g)||[]).length,4);
  assert.match(markup,/Ostale kategorije/);
  const current=Core.roundMoney(rows.slice(3).reduce((sum,row)=>sum+row.current,0)),previous=Core.roundMoney(rows.slice(3).reduce((sum,row)=>sum+row.previous,0));
  assert.ok(markup.includes(esc(money(current))));assert.ok(markup.includes(esc(money(previous))));
  assert.equal(JSON.stringify(rows),copy);
  const priorOnly=Charts.categoryMarkup({previous:40,categories:[{label:'Stari prihod',current:0,previous:40}]},options);
  assert.match(priorOnly,/Stari prihod/);assert.ok(priorOnly.includes(esc(money(0))));assert.ok(priorOnly.includes(esc(money(40))));
  const allTime=Charts.categoryMarkup({previous:null,categories:rows.map(row=>({...row,previous:null}))},options);
  assert.equal((allTime.match(/Prethodno: —/g)||[]).length,4);
});

test('category comparison escapes user labels and masks monetary text while marking visual tracks private',()=>{
  const markup=Charts.categoryMarkup({previous:1500,categories:[{label:'Hrana <svg onload="alert(1)">',current:1000,previous:1500}]},{...options,privateMode:true});
  assert.match(markup,/&lt;svg onload=&quot;alert\(1\)&quot;&gt;/);
  assert.doesNotMatch(markup,/<svg\b|onload="/);assert.doesNotMatch(plain(markup),/€|1\.000|1\.500/);
  assert.equal((markup.match(/Iznosi su skriveni/g)||[]).length,2);
  assert.match(markup,/class="insight-category-tracks" aria-hidden="true" data-monetary/);
});

test('empty current-period plots retain useful prior-period category comparisons',()=>{
  const data={granularity:'day',totals:{count:0},series:[{key:'2026-09-01',income:0,expenses:0,balance:0}]};
  const markup=Charts.chartMarkup(data,{...options,mode:'income',breakdown:{previous:500,categories:[{label:'Plaća prošlog mjeseca',current:0,previous:500}]}});
  assert.match(markup,/Nema transakcija/);assert.match(markup,/Plaća prošlog mjeseca/);assert.ok(markup.includes(esc(money(500))));
});

const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
const between=(start,end)=>{const a=app.indexOf(start),b=app.indexOf(end,a+start.length);assert.ok(a>=0&&b>a);return app.slice(a,b);};
function applicationFixture(){
  const tx=(id,date,amount,type,category)=>({id,date,amount,type,category});
  const personal={accountLabel:'personalAccount',financialOpeningBalance:100,categories:[{id:'food',name:'Hrana'},{id:'utilities',name:'Režije'}],incomeCategories:[{id:'salary',name:'Plaća'}],transactions:[tx('past','2026-08-01',1000,'income','salary'),tx('oldfood','2026-08-01',100,'expense','food'),tx('after-cutoff','2026-08-20',500,'income','salary'),tx('current','2026-09-01',1500,'income','salary'),tx('food','2026-09-02',150,'expense','food'),tx('bill','2026-09-03',50,'expense','utilities')]};
  const business={...personal,accountLabel:'businessAccount',financialOpeningBalance:0,incomeCategories:[{id:'salary',name:'B2B prihod'}],transactions:[tx('business','2026-09-18',9000,'income','salary')]};
  const appState={activeAccount:'personal',accounts:{personal,business},settings:{currency:'EUR',hideBalances:false}},store=Store.createStore(appState,{referenceDate:'2026-09-18'}),nodes=new Map();
  const node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',dataset:{},attributes:{},setAttribute(key,value){this.attributes[key]=String(value);}});return nodes.get(id);};
  let captured;
  const context=vm.createContext({MerCore:Core,MerInsights:Insights,MerAccounting:Accounting,MerInsightCharts:{...Charts,mount(host,data,config){captured={data,config};host.innerHTML=Charts.chartMarkup(data,config);}},appState,state:personal,appReferenceDate:'2026-09-18',currentLang:'hr',insightsTimeframe:'monthly',$:node,t:key=>key,document:{createElement:()=>({textContent:'',get innerHTML(){return esc(this.textContent);}})}});
  vm.runInContext([between('const locale =','function inferredCategoryIconId('),between('function derivedTotals(','function applyStaticTranslations('),between('function escapeHtml(','function cashflowLabel('),between('function categorySummarySlices(','function compactChartCurrency('),between('const insightDetailCopy =','function renderAll(')].join('\n'),context);
  store.subscribe(event=>{context.state=event.activeProfile;});
  return {context,node,appState,personal,business,store,get captured(){return captured;}};
}

test('production income/expense details use comparable-period totals, category labels and explicit ranges',()=>{
  const h=applicationFixture();h.context.renderInsightDetail('income');
  let metrics=h.node('#insightExpandedMetrics').innerHTML;
  for(const expected of [money(1500),money(1000),`+${money(500)} · +50%`])assert.ok(metrics.includes(esc(expected)));
  assert.match(h.node('#insightChartIntro').textContent,/1\. rujna 2026.*18\. rujna 2026.*1\. kolovoza 2026.*18\. kolovoza 2026/);
  assert.equal(h.captured.config.breakdown.previous,1000);assert.match(h.node('#insightExpandedChart').innerHTML,/Plaća/);
  h.context.renderInsightDetail('expenses');metrics=h.node('#insightExpandedMetrics').innerHTML;
  for(const expected of [money(200),money(100),`+${money(100)} · +100%`])assert.ok(metrics.includes(esc(expected)));
  assert.match(h.node('#insightExpandedChart').innerHTML,/Hrana/);assert.match(h.node('#insightExpandedChart').innerHTML,/Režije/);
  h.context.insightsTimeframe='all';h.context.renderInsightDetail('income');assert.equal(h.captured.config.breakdown.previous,null);assert.match(h.node('#insightChartIntro').textContent,/Nema usporedivog/);
});

test('production net detail supplies a true opening sample before the cumulative booked series',()=>{
  const h=applicationFixture();h.context.renderInsightDetail('net');
  const {data,config}=h.captured;
  assert.equal(config.mode,'balance');assert.equal(data.series[0].opening,true);assert.equal(data.series[0].balance,data.openingBalance);assert.equal(data.series[0].growth.balance,null);
  assert.equal(data.openingBalance,1500);assert.equal(data.closingBalance,2800);
  assert.match(h.node('#insightExpandedChart').innerHTML,/insight-growth-summary/);
  assert.match(h.node('#insightExpandedChart').innerHTML,/insight-trend-area/);
  assert.match(h.node('#insightChartIntro').textContent,/Neevidentirana imovina i dugovi nisu uključeni/);
});

test('reactive profile and privacy switches update comparable details and do not reuse the prior profile categories',()=>{
  const h=applicationFixture();h.context.renderInsightDetail('income');
  h.store.switchAccount('business');h.context.renderInsightDetail('income');
  assert.equal(h.captured.config.breakdown.current,9000);assert.equal(h.captured.config.breakdown.previous,0);
  assert.match(h.node('#insightExpandedChart').innerHTML,/B2B prihod/);assert.doesNotMatch(h.node('#insightExpandedChart').innerHTML,/Plaća/);
  h.appState.settings.hideBalances=true;h.context.renderInsightDetail('income');
  assert.equal(h.captured.config.privateMode,true);assert.doesNotMatch(plain(h.node('#insightExpandedChart').innerHTML),/€|9\.000/);
  h.appState.settings.hideBalances=false;h.store.switchAccount('personal');h.context.renderInsightDetail('income');assert.equal(h.captured.config.breakdown.current,1500);
});

test('production monthly comparison masks assistive summary labels as well as visible currency',()=>{
  const h=applicationFixture();h.context.reference='2026-09-18';
  const render=()=>vm.runInContext(`(()=>{${between('  const series=MerAccounting.monthSeries(state.transactions,reference,6);',"  $('#expenseStructureSummary')")}})()`,h.context);
  render();assert.match(h.node('#monthlyBarChart').attributes['aria-label'],/€/);
  h.appState.settings.hideBalances=true;render();
  assert.match(h.node('#monthlyBarChart').attributes['aria-label'],/Iznosi su skriveni/);
  assert.doesNotMatch(h.node('#monthlyBarChart').attributes['aria-label'],/€|1\.500|1\.000/);
  assert.doesNotMatch(plain(h.node('#monthlyBarChart').innerHTML),/€|1\.500|1\.000/);
});

test('detail category presentation cannot override the helper profile-safe label with foreign metadata',()=>{
  const h=applicationFixture();
  h.personal.incomeCategories=[{id:'salary',name:'FOREIGN PRIVATE METADATA',profileId:'business'}];
  h.context.renderInsightDetail('income');
  assert.doesNotMatch(h.node('#insightExpandedChart').innerHTML,/FOREIGN PRIVATE METADATA/);
  assert.equal(h.captured.config.breakdown.categories[0].label,'salary');
});

test('custom category names are preserved rather than interpreted as translation or prototype keys',()=>{
  const h=applicationFixture();
  h.context.t=key=>({other:'Ostalo',close:'Zatvori',income:'Prihod'})[key]||key;
  for(const name of ['other','close','income','__proto__','constructor']){
    h.personal.incomeCategories=[{id:'salary',name}];
    h.context.renderInsightDetail('income');
    assert.equal(h.captured.config.breakdown.categories[0].label,name);
    assert.ok(h.node('#insightExpandedChart').innerHTML.includes(name));
  }
});
