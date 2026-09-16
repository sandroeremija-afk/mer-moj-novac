'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const core=require('../quick-tools-core.js');
const quickSource=fs.readFileSync(require.resolve('../quick-tools-ui.js'),'utf8');
const enterpriseSource=fs.readFileSync(require.resolve('../enterprise-ui.js'),'utf8');

test('forecast resize preserves the current tooltip and focus until the chart width changes',()=>{
  const start=enterpriseSource.indexOf('const resizeProjection='),end=enterpriseSource.indexOf('new ResizeObserver(resizeProjection)',start);
  assert.ok(start>=0&&end>start,'execute the real observer callback');
  let chart={clientWidth:680,clientHeight:300},renders=0;
  const focusedPoint={},context={
    projectionWidth:680,intelligence:{open:true},focused:focusedPoint,tooltipVisible:true,
    el:()=>({querySelector:()=>chart}),
    renderProjection(){renders++;context.projectionWidth=Math.round(chart.clientWidth);context.focused=null;context.tooltipVisible=false;}
  };
  vm.createContext(context);vm.runInContext(enterpriseSource.slice(start,end)+';globalThis.resize=resizeProjection;',context);
  context.resize();chart.clientHeight=480;context.resize();chart.clientWidth=680.2;context.resize();
  assert.equal(renders,0);assert.equal(context.focused,focusedPoint);assert.equal(context.tooltipVisible,true);
  chart.clientWidth=680.6;context.resize();
  assert.equal(renders,1);assert.equal(context.projectionWidth,681);
  context.resize();assert.equal(renders,1,'the width recorded by renderProjection suppresses repeated observer events');
  context.intelligence.open=false;chart.clientWidth=900;context.resize();assert.equal(renders,1);
  context.intelligence.open=true;context.resize();assert.equal(renders,2);
  chart=null;assert.doesNotThrow(()=>context.resize());assert.equal(renders,2);
  assert.match(enterpriseSource,/projectionWidth=Math\.round\(container\.clientWidth\)/);
  assert.match(enterpriseSource,/requestAnimationFrame\(resizeProjection\)/,'deferred rendering uses the same width guard');
});

function forecastControls(){
  const start=enterpriseSource.indexOf('    svg.onpointermove=event=>'),end=enterpriseSource.indexOf('\n  }\n  function renderForecast',start);
  assert.ok(start>=0&&end>start,'execute the real forecast pointer and keyboard bindings');
  const selections=[],tooltip={hidden:true},container={},points=[];
  const context={container,tooltip,width:660,left:84,plotWidth:560,MerQuickToolsCore:core};
  context.svg={getBoundingClientRect:()=>({left:100,width:330}),contains:node=>points.includes(node)};
  context.inspectIndex=index=>{selections.push(index);tooltip.hidden=false;};
  context.inspect=event=>{const point=event.target.closest('[data-forecast-point]');if(point)context.inspectIndex(Number(point.dataset.forecastPoint));};
  context.clear=()=>{tooltip.hidden=true;};
  for(let index=0;index<31;index++)points.push({
    dataset:{forecastPoint:String(index)},tabindex:index===0?'0':'-1',
    closest:()=>points[index],setAttribute(name,value){this[name]=value;},
    focus(){context.focused=this;container.onfocusin({target:this});}
  });
  container.querySelector=selector=>points[Number(/="(\d+)"/.exec(selector)?.[1])];
  vm.runInNewContext(enterpriseSource.slice(start,end),context);
  function key(value,index){
    const event={key:value,target:points[index],defaultPrevented:false,stopped:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;}};
    container.onkeydown(event);return event;
  }
  return {context,container,points,tooltip,selections,key};
}

test('forecast hover and keyboard navigation select the same days and dismiss only the active tooltip on Escape',()=>{
  const app=forecastControls();
  app.context.svg.onpointermove({clientX:282});assert.equal(app.selections.at(-1),15);assert.equal(app.tooltip.hidden,false);
  app.context.svg.onpointerleave();assert.equal(app.tooltip.hidden,true);
  app.container.onclick({target:app.points[4]});assert.equal(app.selections.at(-1),4);
  app.points[0].focus();assert.equal(app.selections.at(-1),0);
  assert.equal(app.key('ArrowRight',0).defaultPrevented,true);
  assert.equal(app.context.focused,app.points[1]);assert.equal(app.selections.at(-1),1);
  assert.equal(app.points[0].tabindex,'-1');assert.equal(app.points[1].tabindex,'0');
  app.key('End',1);assert.equal(app.context.focused,app.points[30]);
  app.key('ArrowRight',30);assert.equal(app.context.focused,app.points[30]);
  app.key('Home',30);assert.equal(app.context.focused,app.points[0]);
  app.key('ArrowLeft',0);assert.equal(app.context.focused,app.points[0]);
  const firstEscape=app.key('Escape',0);
  assert.equal(firstEscape.defaultPrevented,true);assert.equal(firstEscape.stopped,true);assert.equal(app.tooltip.hidden,true);
  const secondEscape=app.key('Escape',0);
  assert.equal(secondEscape.defaultPrevented,false);assert.equal(secondEscape.stopped,false,'normal dialog dismissal can resume after the tooltip is gone');
});

test('forecast keyboard focus moving within the plot retains details while leaving the plot hides them',()=>{
  const app=forecastControls();app.points[0].focus();
  app.container.onfocusout({relatedTarget:app.points[1]});assert.equal(app.tooltip.hidden,false);
  app.container.onfocusout({relatedTarget:{tagName:'BUTTON'}});assert.equal(app.tooltip.hidden,true);
  app.points[1].focus();app.container.onfocusout({relatedTarget:null});assert.equal(app.tooltip.hidden,true);
});

test('forecast keyboard updates the readout even when SVG focusin is not delivered',()=>{
  const app=forecastControls();
  for(const point of app.points)point.focus=function(){app.context.focused=this;};
  app.container.onclick({target:app.points[15]});
  app.key('ArrowRight',15);
  assert.equal(app.context.focused,app.points[16]);
  assert.equal(app.selections.at(-1),16);
  app.key('End',16);assert.equal(app.selections.at(-1),30);
});

function budgetHarness(){
  const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
  const start=source.indexOf('function renderBudgetView()'),end=source.indexOf('function budgetCategoryPercent',start);
  assert.ok(start>=0&&end>start,'execute the real complete budget view renderer');
  const nodes=new Map(),categories=(prefix,count)=>Array.from({length:count},(_,index)=>({id:`${prefix}-${index+1}`,limit:100,spent:20}));
  const profiles={personal:{categories:categories('personal',17)},business:{categories:categories('business',3)}};
  const context={
    state:profiles.personal,MerCore:require('../core.js'),window:{},
    getPlan:()=>({monthlyBudget:2000,safeRemaining:1000}),
    currency:value=>`${value} €`,t:key=>key,
    notificationFingerprint:JSON.stringify,isNotificationResolved:()=>false,
    budgetCategoryRow:category=>`<div data-category="${category.id}" data-limit="${category.limit}" data-spent="${category.spent}"></div>`,
    $:selector=>{
      if(!nodes.has(selector))nodes.set(selector,{textContent:'',innerHTML:'',style:{},dataset:{},classList:{toggle(){}}});
      return nodes.get(selector);
    }
  };
  vm.createContext(context);vm.runInContext(source.slice(start,end),context);context.renderBudgetView();
  return {
    context,profiles,table:nodes.get('#budgetTable'),
    rows:()=>[...nodes.get('#budgetTable').innerHTML.matchAll(/data-category="([^"]+)"/g)].map(match=>match[1]),
    switchProfile(id){context.state=profiles[id];context.renderBudgetView();}
  };
}

test('budget view renders every category directly without controls or a pagination extension',()=>{
  const app=budgetHarness(),snapshot=JSON.stringify(app.profiles);
  assert.equal(app.rows().length,17);
  assert.deepEqual(app.rows(),app.profiles.personal.categories.map(category=>category.id));
  assert.equal(JSON.stringify(app.profiles),snapshot,'rendering does not mutate category limits or spending');
  const css=fs.readFileSync(require.resolve('../quick-tools.css'),'utf8');
  const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
  assert.doesNotMatch(quickSource,/MerBudgetPagination|budget-view-controls|budget-pagination|data-budget-mode|data-budget-page/);
  assert.doesNotMatch(css,/budget-view-controls|budget-pagination/);
  assert.doesNotMatch(source,/MerBudgetPagination/);
});

test('simple budget list responds to edits, additions and removals without a manual refresh',()=>{
  const app=budgetHarness();
  app.profiles.personal.categories[16].limit=150;
  app.profiles.personal.categories[16].spent=42.5;
  app.context.renderBudgetView();
  assert.match(app.table.innerHTML,/data-category="personal-17" data-limit="150" data-spent="42.5"/);
  app.profiles.personal.categories.push({id:'personal-18',limit:200,spent:0});
  app.context.renderBudgetView();assert.equal(app.rows().length,18);assert.equal(app.rows().at(-1),'personal-18');
  app.profiles.personal.categories.splice(0,1);
  app.context.renderBudgetView();assert.equal(app.rows().length,17);assert.equal(app.rows()[0],'personal-2');
  app.profiles.personal.categories.length=0;
  app.context.renderBudgetView();assert.deepEqual(app.rows(),[]);assert.equal(app.table.innerHTML,'');
});

test('simple budget list displays only active-profile categories on each switch',()=>{
  const app=budgetHarness(),snapshot=JSON.stringify(app.profiles);
  app.switchProfile('business');assert.deepEqual(app.rows(),['business-1','business-2','business-3']);
  assert.doesNotMatch(app.table.innerHTML,/personal-/);
  app.switchProfile('personal');assert.equal(app.rows().length,17);assert.equal(app.rows()[0],'personal-1');
  assert.doesNotMatch(app.table.innerHTML,/business-/);
  assert.equal(JSON.stringify(app.profiles),snapshot);
});

test('cash flow has one forecast view and an accessible hover readout without the removed scenario controls',()=>{
  assert.doesNotMatch(enterpriseSource,/enterpriseScenario|scenarioAmount|scenarioResults|renderScenario|data-intelligence-tab/);
  assert.match(enterpriseSource,/forecast-tooltip" role="tooltip" hidden/);
  assert.match(enterpriseSource,/forecast-inspector" aria-live="polite"/);
  assert.match(enterpriseSource,/new ResizeObserver\(resizeProjection\)/);
});
