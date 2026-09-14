'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const MerCore=require('../core.js');
const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
const chartSource=app.slice(app.indexOf('function savingsHistorySeries('),app.indexOf('function renderSavingsView('));
function harness({values=[100,200,450],width=400,height=180,language='hr',currency='EUR'}={}) {
  const nodes=new Map(),state={savingsHistory:values};let buttons=[],editing=false;
  class Node {
    constructor(id){this.id=id;this.dataset={};this.attrs={};this.listeners={};this.props={};this.hidden=true;this.textContent='';this.classes=new Set();this.style={setProperty:(key,value)=>{this.props[key]=value;}};this.classList={add:value=>this.classes.add(value),remove:value=>this.classes.delete(value),toggle:(value,enabled)=>enabled?this.classes.add(value):this.classes.delete(value)};}
    set innerHTML(value){this.html=value;if(this.id==='savingsChartPoints')buttons=[...value.matchAll(/data-savings-chart-point="(\d+)" aria-label="([^"]*)"/g)].map(match=>{const button=new Node('point'+match[1]);button.dataset.savingsChartPoint=match[1];button.attrs['aria-label']=match[2];return button;});}
    get innerHTML(){return this.html;}
    get clientWidth(){return width;}get clientHeight(){return height;}
    get offsetWidth(){return Math.min(width-8,this.textContent.length*7+20);}get offsetHeight(){return 36;}
    setAttribute(key,value){this.attrs[key]=value;}removeAttribute(key){delete this.attrs[key];if(key==='data-active-point')delete this.dataset.activePoint;}
    addEventListener(type,fn){this.listeners[type]=fn;}
    focus(){this.listeners.focus?.();}contains(node){return node===this||buttons.includes(node);}
    getBoundingClientRect(){return{left:20,width,height};}
  }
  ['savingsHistorySvg','savingsChartPoints','savingsChartAxis','savingsChartTooltip','contributionChart'].forEach(id=>nodes.set(id,new Node(id)));
  const context={MerCore,state,Intl,Number,Math,Date,appReferenceDate:'2026-08-14',document:{body:{classList:{contains:()=>editing}}},locale:()=>language==='hr'?'hr-HR':'en-GB',currency:value=>MerCore.formatCurrency(value,{locale:language==='hr'?'hr-HR':'en-GB',currency}),escapeHtml:String,t:(key,options={})=>key==='savingsPointLabel'?`${options.month}: ${options.amount}`:key,$:selector=>nodes.get(selector.slice(1)),$$:()=>buttons};
  vm.createContext(context);vm.runInContext(chartSource,context);context.renderSavingsHistoryChart();
  return{context,state,chart:nodes.get('contributionChart'),tooltip:nodes.get('savingsChartTooltip'),buttons:()=>buttons,setEditing:value=>{editing=value;}};
}
const normalized=value=>value.replace(/\s/g,' ');
test('Cycle 1: full-area hover selects precise full month and amount without financial mutations',()=>{
  const h=harness(),before=JSON.stringify(h.state);
  h.chart.onpointermove({clientX:390,pointerType:'mouse'});
  assert.equal(normalized(h.tooltip.textContent),'Kolovoz: 450,00 €');assert.equal(h.tooltip.hidden,false);
  assert.equal(h.tooltip.attrs['data-monetary'],'','new hover content participates in privacy masking');
  assert.equal(h.chart.dataset.activePoint,'2');assert.equal(h.buttons()[2].classes.has('active'),true);
  h.chart.onpointermove({clientX:20,pointerType:'mouse'});assert.equal(normalized(h.tooltip.textContent),'Lipanj: 100,00 €');
  assert.equal(JSON.stringify(h.state),before);h.chart.onmouseleave();assert.equal(h.tooltip.hidden,true);
});
test('Cycle 1: narrow and high-value tooltips remain inside the chart at both endpoints',()=>{
  for(const width of [140,260,400,700])for(const x of [20,20+width]){
    const h=harness({width,height:130,values:[9999999.99,1]});h.chart.onpointerdown({clientX:x,pointerType:'touch'});
    const left=parseFloat(h.tooltip.style.left),top=parseFloat(h.tooltip.style.top);
    assert.ok(left>=0&&left+h.tooltip.offsetWidth<=width);assert.ok(top>=0&&top+h.tooltip.offsetHeight<=130);
  }
});
test('Cycle 1: chart keyboard arrows, Home, End and Escape work without opening the detail popup',()=>{
  const h=harness();let prevented=0,stopped=0;
  const key=key=>h.chart.onkeydown({key,preventDefault:()=>{prevented++;},stopPropagation:()=>{stopped++;}});
  key('Home');assert.equal(h.chart.dataset.activePoint,'0');key('ArrowRight');assert.equal(h.chart.dataset.activePoint,'1');key('End');assert.equal(h.chart.dataset.activePoint,'2');
  key('ArrowRight');assert.equal(h.chart.dataset.activePoint,'2');key('ArrowLeft');assert.equal(h.chart.dataset.activePoint,'1');
  key('Escape');assert.equal(h.tooltip.hidden,true);assert.equal(prevented,5);assert.equal(stopped,6);
});
test('Cycle 1: touch scrubbing keeps native vertical movement and layout edit drags do not inspect data',()=>{
  const h=harness();let cancelled=0;
  h.chart.onpointerdown({clientX:220,pointerType:'touch',preventDefault:()=>{cancelled++;}});assert.equal(h.tooltip.hidden,false);assert.equal(cancelled,0);
  h.chart.onpointercancel();assert.equal(h.tooltip.hidden,true);h.setEditing(true);h.chart.onpointermove({clientX:220});assert.equal(h.tooltip.hidden,true);
});
test('Cycle 1: empty histories and reactive profile refresh discard old tooltip values',()=>{
  const h=harness();h.chart.onpointermove({clientX:400});h.state.savingsHistory=[0];h.context.renderSavingsHistoryChart();
  assert.equal(h.tooltip.hidden,true);h.chart.onpointermove({clientX:400});assert.equal(normalized(h.tooltip.textContent),'Kolovoz: 0 €');assert.equal(h.buttons().length,1);
  h.state.savingsHistory=[];h.context.renderSavingsHistoryChart();h.buttons()[0].focus();assert.equal(normalized(h.tooltip.textContent),'Kolovoz: 0 €');
  const english=harness({language:'en',currency:'USD'});english.buttons()[2].focus();assert.match(english.tooltip.textContent,/August:.*450[.,]00/);
});
