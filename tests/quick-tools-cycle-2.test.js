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
  const nodes=new Map(),created=[],categories=(prefix,count)=>Array.from({length:count},(_,index)=>({id:`${prefix}-${index+1}`}));
  const profiles={personal:{categories:categories('personal',17)},business:{categories:categories('business',3)}};
  const context={core,state:profiles.personal,appState:{activeAccount:'personal'},currentLang:'hr',userId:'user-a'};
  class Element{
    constructor(){this.attributes={};this.dataset={};this.events={};this.children=[];this.scrollTop=0;this.hidden=false;this._html='';}
    setAttribute(name,value){this.attributes[name]=String(value);}
    getAttribute(name){return this.attributes[name];}
    addEventListener(name,callback){this.events[name]=callback;}
    before(node){this.previous=node;}
    after(node){this.next=node;}
    focus(){context.focused=this;}
    matches(selector){const match=/^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(selector);return Boolean(match&&Object.hasOwn(this.attributes,match[1])&&(match[2]===undefined||this.attributes[match[1]]===match[2]));}
    closest(selector){return this.matches(selector)?this:null;}
    querySelector(selector){return this.children.find(node=>node.matches(selector))||null;}
    querySelectorAll(selector){return this.children.filter(node=>node.matches(selector));}
    get innerHTML(){return this._html;}
    set innerHTML(html){
      this._html=html;this.children=[];
      for(const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)){
        const button=new Element();button.textContent=match[2];button.disabled=/\sdisabled(?:\s|$)/.test(match[1]);
        for(const attribute of match[1].matchAll(/([\w-]+)="([^"]*)"/g)){
          button.attributes[attribute[1]]=attribute[2];
          if(attribute[1].startsWith('data-'))button.dataset[attribute[1].slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase())]=attribute[2];
        }
        this.children.push(button);
      }
    }
  }
  for(const id of ['budgetTable','budgetTableWindow'])nodes.set(id,new Element());
  context.el=id=>nodes.get(id);
  context.copy=(hr,en)=>context.currentLang==='en'?en:hr;
  context.window={MerAuthProvider:{currentSession:()=>({userId:context.userId})}};
  context.document={createElement(){const node=new Element();created.push(node);return node;}};
  context.budgetCategoryRow=category=>`<div data-category="${category.id}"></div>`;
  const start=quickSource.indexOf("  const table=el('budgetTable')"),end=quickSource.indexOf('  window.MerQuickTools=',start);
  assert.ok(start>=0&&end>start,'execute the real budget controls, renderer, and event delegation');
  vm.createContext(context);vm.runInContext(quickSource.slice(start,end)+';globalThis.render=renderBudgets;renderBudgets();',context);
  const list=nodes.get('budgetTableWindow'),controls=list.previous,pager=list.next;
  function click(parent,selector){const button=parent.querySelector(selector);assert.ok(button,selector);parent.events.click({target:button});return button;}
  return {
    context,profiles,list,controls,pager,table:nodes.get('budgetTable'),
    rows:()=>[...nodes.get('budgetTable').innerHTML.matchAll(/data-category="([^"]+)"/g)].map(match=>match[1]),
    page:value=>click(pager,`[data-budget-page="${value}"]`),mode:value=>click(controls,`[data-budget-mode="${value}"]`),
    switchProfile(id){context.appState.activeAccount=id;context.state=profiles[id];context.render();}
  };
}

test('budget controls render seventeen categories as eight, eight, and one with functional disabled bounds',()=>{
  const app=budgetHarness(),snapshot=JSON.stringify(app.profiles),seen=[...app.rows()];
  assert.equal(app.rows().length,8);assert.equal(app.pager.hidden,false);
  assert.equal(app.pager.querySelector('[data-budget-page="0"]').disabled,true);
  app.page(0);assert.equal(app.rows()[0],'personal-1');
  app.list.scrollTop=100;app.page(2);seen.push(...app.rows());
  assert.equal(app.rows().length,8);assert.equal(app.rows()[0],'personal-9');
  assert.equal(app.list.scrollTop,0);assert.equal(app.context.focused,app.list);
  app.page(3);seen.push(...app.rows());assert.deepEqual(app.rows(),['personal-17']);
  assert.equal(app.pager.querySelector('[data-budget-page="4"]').disabled,true);
  app.page(4);assert.deepEqual(app.rows(),['personal-17']);
  assert.deepEqual(seen,app.profiles.personal.categories.map(category=>category.id));
  app.page(2);assert.equal(app.rows()[0],'personal-9');assert.equal(JSON.stringify(app.profiles),snapshot);
});

test('budget Show all removes paging and returning to Pages starts at the first eight categories',()=>{
  const app=budgetHarness();app.page(2);app.list.scrollTop=70;app.mode('all');
  assert.equal(app.rows().length,17);assert.equal(app.pager.hidden,true);assert.equal(app.list.dataset.listMode,'all');
  assert.equal(app.list.scrollTop,0);assert.equal(app.controls.querySelector('[data-budget-mode="all"]').getAttribute('aria-pressed'),'true');
  assert.equal(app.context.focused,app.controls.querySelector('[data-budget-mode="all"]'));
  app.mode('pages');assert.equal(app.rows().length,8);assert.equal(app.rows()[0],'personal-1');assert.equal(app.pager.hidden,false);
  assert.equal(app.controls.querySelector('[data-budget-mode="pages"]').getAttribute('aria-pressed'),'true');
});

test('budget display resets pages, show-all state and scroll when the profile or signed-in user changes',()=>{
  for(const mode of ['all','page-two']){
    const app=budgetHarness();if(mode==='all')app.mode('all');else app.page(2);
    app.list.scrollTop=99;app.switchProfile('business');
    assert.deepEqual(app.rows(),['business-1','business-2','business-3']);
    assert.equal(app.list.dataset.listMode,'pages');assert.equal(app.list.scrollTop,0);assert.equal(app.pager.hidden,true);
    app.switchProfile('personal');assert.equal(app.rows()[0],'personal-1');assert.equal(app.rows().length,8);
    app.mode('all');app.list.scrollTop=99;app.context.userId='user-b';app.context.render();
    assert.equal(app.rows()[0],'personal-1');assert.equal(app.rows().length,8);
    assert.equal(app.list.dataset.listMode,'pages');assert.equal(app.list.scrollTop,0);
  }
});

test('budget redraw localizes controls, clamps the current page after deletion and handles an empty category list',()=>{
  const app=budgetHarness();app.page(2);app.page(3);app.context.currentLang='en';app.context.render();
  assert.equal(app.controls.getAttribute('aria-label'),'Category display');assert.equal(app.pager.getAttribute('aria-label'),'Category pages');
  assert.match(app.pager.innerHTML,/Page 3 \/ 3/);assert.match(app.controls.innerHTML,/Show all/);
  app.profiles.personal.categories.length=9;app.context.render();
  assert.deepEqual(app.rows(),['personal-9']);assert.match(app.pager.innerHTML,/Page 2 \/ 2/);
  app.profiles.personal.categories.length=0;app.context.render();
  assert.deepEqual(app.rows(),[]);assert.equal(app.pager.hidden,true);assert.match(app.pager.innerHTML,/Page 1 \/ 1/);
});

test('cash flow has one forecast view and an accessible hover readout without the removed scenario controls',()=>{
  assert.doesNotMatch(enterpriseSource,/enterpriseScenario|scenarioAmount|scenarioResults|renderScenario|data-intelligence-tab/);
  assert.match(enterpriseSource,/forecast-tooltip" role="tooltip" hidden/);
  assert.match(enterpriseSource,/forecast-inspector" aria-live="polite"/);
  assert.match(enterpriseSource,/new ResizeObserver\(resizeProjection\)/);
});
