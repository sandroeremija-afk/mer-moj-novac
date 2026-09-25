'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { compactModuleMode, createModulePages } = require('../responsive-ui.js');

function fixture() {
  const document = { documentElement:{lang:'hr'}, activeElement:null, selectors:new Map() };
  class Node {
    constructor(id = '') { this.id=id;this.dataset={};this.attributes={};this.children=[];this.parentNode=null;this.listeners={};this.hidden=false;this.textContent='';this.attributeWrites=0; }
    append(node) { if(node.parentNode)node.remove();node.parentNode=this;this.children.push(node); }
    after(node) { node.parentNode=this.parentNode;this.parentNode.children.splice(this.parentNode.children.indexOf(this)+1,0,node); }
    remove() { this.parentNode.children.splice(this.parentNode.children.indexOf(this),1);this.parentNode=null; }
    contains(node) { return node===this||this.children.some(child=>child.contains(node)); }
    setAttribute(key,value) { this.attributeWrites++;this.attributes[key]=String(value); }
    getAttribute(key) { return this.attributes[key]??null; }
    removeAttribute(key) { delete this.attributes[key];if(key.startsWith('data-'))delete this.dataset[key.slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase())]; }
    addEventListener(type,listener) { this.listeners[type]=listener; }
    focus(options) { document.activeElement=this;this.focusOptions=options; }
    click() { this.listeners.click?.({target:this}); }
    querySelector(selector) { return this.selectors?.get(selector)||null; }
    querySelectorAll() { return this.children.flatMap(node=>[node,...node.querySelectorAll()]).filter(node=>node.tagName==='BUTTON'&&!node.disabled||node.getAttribute('tabindex')!==null&&node.getAttribute('tabindex')!=='-1'); }
    getClientRects() { return this.hidden||this.zeroRect?[]:[{}]; }
    closest() { for(let node=this;node;node=node.parentNode)if(node.inert||node.hidden||node.dataset.pageHidden==='true')return node;return null; }
  }
  document.createElement=tag=>{const node=new Node();node.tagName=tag.toUpperCase();return node;};
  document.querySelector=selector=>document.selectors.get(selector)||null;
  let bounds={width:375,height:667};
  const groups={};
  for(const [id,selectors,anchorSelector] of [
    ['savingsView',[':scope > .savings-layout > .savings-history-card',':scope > .savings-layout > .savings-context-column',':scope > .goal-buckets-panel'],':scope > .page-heading'],
    ['insightsView',[':scope > .insights-kpis',':scope > .advanced-insights-grid > .donut-card',':scope > .advanced-insights-grid > .monthly-bars-card',':scope > .advanced-insights-grid > .expense-structure-card'],'#insightsFilters']
  ]) {
    const view=new Node(id),anchor=new Node();view.selectors=new Map([[anchorSelector,anchor]]);view.append(anchor);
    document.selectors.set('#'+id,view);
    groups[id]=selectors.map(selector=>{const node=new Node();view.append(node);view.selectors.set(selector,node);return node;});
  }
  const goalTarget=new Node('goalBucketGrid');groups.savingsView[2].append(goalTarget);document.selectors.set('#goalBucketGrid',goalTarget);
  const pages=createModulePages(document,()=>bounds);
  const nav=id=>document.selectors.get('#'+id).children.find(node=>node.className==='module-page-tabs');
  return {document,groups,goalTarget,pages,nav,setBounds:next=>{bounds=next;}};
}

test('compact module mode includes width and height boundaries without affecting regular desktops',()=>{
  for(const dimensions of [[375,667],[1100,900],[1150,768],[1200,900],[1920,700]])assert.equal(compactModuleMode(...dimensions),true);
  for(const dimensions of [[1201,701],[1366,768],[1920,1080]])assert.equal(compactModuleMode(...dimensions),false);
});

test('compact sections are mutually exclusive and all buttons control the original financial nodes',()=>{
  const ui=fixture(),parents=Object.values(ui.groups).flat().map(node=>node.parentNode);ui.pages.refresh();
  for(const [viewId,count] of [['savingsView',3],['insightsView',4]]){
    const view=ui.document.selectors.get('#'+viewId),nav=ui.nav(viewId);
    assert.equal(view.dataset.compactPage,'true');assert.equal(nav.hidden,false);assert.equal(nav.children.length,count);
    for(let selected=0;selected<count;selected++){
      nav.children[selected].click();
      ui.groups[viewId].forEach((node,index)=>{
        assert.equal(node.dataset.moduleHidden,String(index!==selected));
        assert.equal(nav.children[index].getAttribute('aria-controls'),node.id);
        assert.equal(nav.children[index].getAttribute('aria-pressed'),String(index===selected));
      });
    }
  }
  Object.values(ui.groups).flat().forEach((node,index)=>assert.equal(node.parentNode,parents[index]));
});

test('refresh preserves section selection and localizes navigation without repeated attribute writes',()=>{
  const ui=fixture();ui.pages.refresh();ui.nav('savingsView').children[2].click();
  ui.document.documentElement.lang='en';ui.pages.refresh();
  assert.deepEqual(ui.nav('savingsView').children.map(node=>node.textContent),['History','Summary','Goals']);
  assert.deepEqual(ui.nav('insightsView').children.map(node=>node.textContent),['Summary','Categories','Cash flow','Expenses']);
  assert.equal(ui.groups.savingsView[2].dataset.moduleHidden,'false');
  const before=ui.nav('savingsView').children.map(node=>node.attributeWrites);ui.pages.refresh();
  assert.deepEqual(ui.nav('savingsView').children.map(node=>node.attributeWrites),before);
});

test('desktop restores every section while compact return preserves the selected page',()=>{
  const ui=fixture();ui.pages.refresh();ui.nav('insightsView').children[2].click();
  ui.setBounds({width:1440,height:900});ui.pages.refresh();
  for(const viewId of ['savingsView','insightsView']){
    assert.equal(ui.document.selectors.get('#'+viewId).dataset.compactPage,undefined);
    assert.equal(ui.nav(viewId).hidden,true);
    ui.groups[viewId].forEach(node=>assert.equal(node.dataset.moduleHidden,undefined));
  }
  ui.setBounds({width:1440,height:700});ui.pages.refresh();assert.equal(ui.groups.insightsView[2].dataset.moduleHidden,'false');
});

test('wizard reveal and arrow keys select hidden groups without moving focus unexpectedly',()=>{
  const ui=fixture();ui.pages.refresh();
  assert.equal(ui.pages.revealTarget('#goalBucketGrid'),true);assert.equal(ui.groups.savingsView[2].dataset.moduleHidden,'false');
  assert.equal(ui.document.activeElement,null,'wizard owns its focus');
  assert.equal(ui.pages.revealTarget('#unknown'),false);
  const nav=ui.nav('savingsView'),button=nav.children[2];let prevented=false;
  button.listeners.keydown({key:'Home',preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.equal(ui.document.activeElement,nav.children[0]);assert.equal(ui.groups.savingsView[0].dataset.moduleHidden,'false');
  ui.pages.destroy();assert.equal(ui.nav('savingsView'),undefined);
  Object.values(ui.groups).flat().forEach(node=>assert.equal(node.dataset.moduleHidden,undefined));
});

test('leaving compact mode recovers navigation focus in the selected section without scrolling',()=>{
  const ui=fixture(),group=ui.groups.savingsView[2];
  const hidden=ui.document.createElement('button'),disabled=ui.document.createElement('button'),collapsed=ui.document.createElement('button'),inert=ui.document.createElement('button'),visible=ui.document.createElement('button');
  hidden.hidden=true;disabled.disabled=true;disabled.setAttribute('tabindex','0');collapsed.zeroRect=true;inert.inert=true;
  [hidden,disabled,collapsed,inert,visible].forEach(node=>group.append(node));
  ui.pages.refresh();const selected=ui.nav('savingsView').children[2];selected.click();selected.focus();
  ui.setBounds({width:1440,height:900});ui.pages.refresh();
  assert.equal(ui.document.activeElement,visible);
  assert.deepEqual(visible.focusOptions,{preventScroll:true});
  assert.equal(ui.nav('savingsView').hidden,true);
});

test('focus recovery falls back to the selected group and does not steal focus from content',()=>{
  const ui=fixture();ui.pages.refresh();const selected=ui.nav('insightsView').children[3];selected.click();selected.focus();
  ui.setBounds({width:1440,height:900});ui.pages.refresh();
  assert.equal(ui.document.activeElement,ui.groups.insightsView[3]);
  assert.equal(ui.groups.insightsView[3].getAttribute('tabindex'),'-1');
  assert.deepEqual(ui.groups.insightsView[3].focusOptions,{preventScroll:true});
  ui.setBounds({width:375,height:667});ui.pages.refresh();ui.goalTarget.focus();
  ui.setBounds({width:1440,height:900});ui.pages.refresh();
  assert.equal(ui.document.activeElement,ui.goalTarget);
});

test('module pages use the existing resize and mutation refresh pipeline, never financial storage',()=>{
  const source=fs.readFileSync(require.resolve('../responsive-ui.js'),'utf8');
  assert.match(source,/modulePages\?\.refresh\(\)/);
  assert.match(source,/window\.MerModulePages = modulePages/);
  assert.match(source,/observe\(document\.documentElement, \{ attributes:true, attributeFilter:\['lang'\] \}\)/);
  const start=source.indexOf('function createModulePages('),end=source.indexOf('function computeFloatingPosition(',start);
  assert.ok(start>=0&&end>start);
  assert.doesNotMatch(source.slice(start,end),/localStorage|sessionStorage|reactiveStore|\.mutate\(|goal\.current\s*=|innerHTML/);
});
