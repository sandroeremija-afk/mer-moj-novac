'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {paginate}=require('../pagination.js');
const read=file=>fs.readFileSync(require.resolve('../'+file),'utf8');
const app=read('app.js');
const sizeSource=app.slice(app.indexOf('function budgetListPageSize()'),app.indexOf('function renderListPagination('));

function pageSize({width=1280,height=720,bottom=696,top=362,hidden=false,padding=9,content=44,pagerHeight=56,panelScroll=0}={}) {
  const rectangle=value=>({getBoundingClientRect:()=>value});
  const row={...rectangle({height:64}),children:[rectangle({height:32}),rectangle({height:content})],style:{minHeight:'64px',paddingTop:padding+'px',paddingBottom:padding+'px',borderTopWidth:'0px',borderBottomWidth:'1px'}};
  const pager={...rectangle({height:pagerHeight}),hidden:false};
  const panel={...rectangle({bottom}),scrollTop:panelScroll,style:{paddingBottom:'14px',borderBottomWidth:'1px'}};
  const windowNode={...rectangle({top}),querySelector:()=>pager,style:{paddingBottom:'0px'}};
  const list={querySelector:()=>row};
  const view={hidden,querySelector:()=>panel};
  const nodes={'#budgetsView':view,'#budgetTable':list,'#budgetTableWindow':windowNode};
  const context=vm.createContext({window:{innerWidth:width,innerHeight:height},$:selector=>nodes[selector],getComputedStyle:node=>node.style});
  return vm.runInContext(sizeSource+';budgetListPageSize()',context);
}

test('short budget canvases adapt rows to available space instead of clipping the pager',()=>{
  assert.equal(pageSize(),4,'720px laptop retains four comfortable rows');
  assert.equal(pageSize({height:600,bottom:576,top:350}),2,'short canvas uses two accessible rows');
  assert.equal(pageSize({height:768,bottom:744,top:372}),4);
  assert.equal(pageSize({height:1080,bottom:1052,top:442,padding:16}),4,'large screens stay capped at four');
});

test('recovery messages, long row labels, and larger controls participate in the height budget',()=>{
  assert.equal(pageSize({top:445}),2,'visible recovery card reserves its own height');
  assert.equal(pageSize({content:70}),2,'wrapped category text is never squeezed');
  assert.equal(pageSize({pagerHeight:76}),3,'enlarged pager controls retain their space');
  assert.equal(pageSize({top:650}),1,'at least one category remains reachable on a constrained canvas');
});

test('focus scrolling from a previous layout cannot inflate the number of visible budget rows',()=>{
  const viewport={height:600,bottom:576,top:350};
  assert.equal(pageSize(viewport),2);
  assert.equal(pageSize({...viewport,top:297,panelScroll:53}),2,'internal scroll offset does not count as additional vertical space');
  assert.equal(pageSize({...viewport,top:230,panelScroll:120}),2);
  assert.match(read('page-space.css'),/#budgetsView > \.table-panel \{ overflow:clip; \}/,'the bounded desktop panel cannot acquire a programmatic scroll position');
});

test('hidden initial views use a safe estimate while tablet pages also adapt and phones retain natural flow',()=>{
  assert.equal(pageSize({hidden:true,height:600}),3);
  assert.equal(pageSize({hidden:true,height:768}),4);
  assert.equal(pageSize({width:1024,height:768}),4);
  assert.equal(pageSize({width:1024,height:768,top:445}),2);
  assert.equal(pageSize({width:768,height:1024}),4);
  assert.equal(pageSize({width:700,height:667,top:445}),4);
});

test('every category stays reachable at each adaptive page size and page count remains correct',()=>{
  const categories=Array.from({length:7},(_,index)=>'category-'+index);
  for(const size of [1,2,3,4]) {
    const first=paginate(categories,1,size);
    const all=Array.from({length:first.pages},(_,index)=>paginate(categories,index+1,size).items).flat();
    assert.deepEqual(all,categories);
    assert.equal(first.pages,Math.ceil(categories.length/size));
  }
});

test('budget pagination refreshes after recovery layout, view activation and browser resize',()=>{
  const render=app.slice(app.indexOf('function renderBudgetView()'),app.indexOf('function budgetCategoryPercent('));
  assert.match(render,/renderListPagination\('#budgetTable',\{pageSize:budgetListPageSize,itemSelector:'\.budget-row'/);
  assert.ok(render.indexOf('renderListPagination(')>render.indexOf('recovery.hidden='));
  assert.match(app,/if\(activeView==='budgets'\)window\.MerPagination\?\.refreshAll\(\)/);
  const pagination=read('pagination.js');
  assert.match(pagination,/typeof config\.pageSize === 'function' \? config\.pageSize\(\)/);
  assert.match(pagination,/root\.addEventListener\('resize', refreshAll\)/);
});

test('short budget rows preserve hit targets and pager reserves the floating assistant lane',()=>{
  const css=read('fluid-layout.css');
  assert.match(css,/@media \(max-height:760px\) \{\s*#budgetsView #budgetTable \.budget-row \{ padding-block:9px; \}/);
  assert.match(css,/#budgetsView #budgetTable \.budget-row \{[^}]*min-height:64px/);
  assert.match(read('page-space.css'),/#budgetsView #budgetTableWindow > \.mer-pagination \{[^}]*flex:0 0 auto;[^}]*padding-inline-end:48px/);
});

test('tablet budget view reserves a bounded table below a single summary row without changing phone layout',()=>{
  const css=read('page-space.css');
  const tablet=css.slice(css.indexOf('@media (min-width:701px) and (max-width:1024px)'));
  assert.match(tablet,/#budgetsView > \.budget-summary \{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(tablet,/#budgetsView > \.table-panel \{[^}]*flex:1 1 0;[^}]*min-height:0;[^}]*overflow:visible/);
  assert.match(tablet,/#budgetsView #budgetTableWindow > \.mer-pagination \{[^}]*flex:0 0 auto/);
  assert.match(tablet,/#budgetsView #budgetTable \.budget-row \{[^}]*min-height:64px/);
  assert.match(tablet,/\.page:has\(> #budgetsView.active\) \{[^}]*overflow-y:auto/, 'exceptionally large text retains an accessible outer-page fallback');
  assert.match(sizeSource,/if\(window.innerWidth<=700\)return 4/);
});
