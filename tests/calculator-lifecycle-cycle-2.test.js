'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const core = require('../quick-tools-core.js');
const source = fs.readFileSync(require.resolve('../quick-tools-ui.js'), 'utf8');

// Run the complete production UI, including its listeners and observer bindings.
function harness() {
  const observers = [], windowEvents = new Map(), documentEvents = new Map();
  const document = {activeElement:null};
  const addListener = (events,type,callback) => { if(!events.has(type))events.set(type,[]);events.get(type).push(callback); };
  let session = {userId:'user-a'}, locked = false, closes = 0, opens = 0;
  class Element {
    constructor(tag) {
      this.tagName=tag;this.children=[];this.attributes={};this.dataset={};this.listeners=new Map();this.style={};
      this.className='';this.id='';this.value='';this._text='';this.hidden=false;this.inert=false;this.disabled=false;this.open=false;
      this.offsetWidth=328;this.offsetHeight=430;this.scrollTop=0;
      this.classList={
        contains:value=>this.className.split(/\s+/).includes(value),
        add:value=>{if(!this.classList.contains(value))this.className=[this.className,value].filter(Boolean).join(' ');},
        remove:value=>{this.className=this.className.split(/\s+/).filter(item=>item!==value).join(' ');},
        toggle:(value,enabled)=>{const next=enabled===undefined?!this.classList.contains(value):enabled;this.classList[next?'add':'remove'](value);return next;}
      };
    }
    append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node);}}
    before(node){node.parentElement=this.parentElement;this.parentElement.children.splice(this.parentElement.children.indexOf(this),0,node);}
    after(node){node.parentElement=this.parentElement;this.parentElement.children.splice(this.parentElement.children.indexOf(this)+1,0,node);}
    setAttribute(name,value){this.attributes[name]=String(value);if(name==='id')this.id=String(value);if(name==='class')this.className=String(value);if(name.startsWith('data-'))this.dataset[name.slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase())]=String(value);}
    getAttribute(name){return this.attributes[name]??null;}
    set textContent(value){this._text=String(value);this.children=[];}
    get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}
    set innerHTML(html){
      this.children=[];this._text='';const stack=[this];
      for(const match of html.matchAll(/<(\/?)([a-z][\w-]*)(\s+(?:[^>"']|"[^"]*"|'[^']*')*)?\s*(\/?)>/gi)){
        const [,closing,tag,raw='',selfClosing]=match;
        if(closing){if(stack.length>1)stack.pop();continue;}
        const node=new Element(tag);
        for(const attr of raw.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))node.setAttribute(attr[1],attr[2]??attr[3]??attr[4]??'');
        stack.at(-1).append(node);if(!['input','br','hr','img','path','rect'].includes(tag)&&!selfClosing)stack.push(node);
      }
    }
    matches(selector){
      if(selector.startsWith('#'))return this.id===selector.slice(1);
      if(selector.startsWith('.'))return this.classList.contains(selector.slice(1));
      const attribute=/^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(selector);
      if(attribute)return Object.hasOwn(this.attributes,attribute[1])&&(attribute[2]===undefined||this.attributes[attribute[1]]===attribute[2]);
      return this.tagName===selector;
    }
    querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
    closest(selector){return this.matches(selector)?this:this.parentElement?.closest(selector)||null;}
    addEventListener(type,callback){addListener(this.listeners,type,callback);}
    dispatch(type,extra={}){const event={target:this,preventDefault(){},...extra};for(const callback of this.listeners.get(type)||[])callback(event);return event;}
    click(){if(!this.disabled)this.dispatch('click');}
    focus(){document.activeElement=this;}
    getBoundingClientRect(){return{left:650,right:694,top:10,bottom:54,width:44,height:44};}
    setRangeText(text,start,end){this.value=this.value.slice(0,start)+text+this.value.slice(end);this.selectionStart=this.selectionEnd=start+text.length;}
    setSelectionRange(start,end){this.selectionStart=start;this.selectionEnd=end;}
  }
  document.body=new Element('body');
  document.createElement=tag=>new Element(tag);
  document.getElementById=id=>document.body.querySelector('#'+id);
  document.addEventListener=(type,callback)=>addListener(documentEvents,type,callback);
  const shell=new Element('main');shell.id='appShell';document.body.append(shell);
  for(const id of ['commandTrigger','budgetTableWindow']){const node=new Element(id==='commandTrigger'?'button':'div');node.id=id;shell.append(node);}
  const table=new Element('div');table.id='budgetTable';document.getElementById('budgetTableWindow').append(table);
  class MutationObserver {
    constructor(callback){this.callback=callback;}
    observe(target,options){observers.push({target,options,callback:this.callback});}
  }
  const context={document,MutationObserver,Intl,innerWidth:1000,innerHeight:800,currentLang:'hr',appState:{activeAccount:'personal'},state:{categories:[]},
    MerRuntime:{bindDialogBackdropDismiss(){}},budgetCategoryRow:()=>'',syncModalLayer(){},
    openModal(dialog){opens++;dialog.open=true;},closeModal(dialog){closes++;dialog.open=false;dialog.dispatch('close');}
  };
  context.window={MerQuickToolsCore:core,MerAuthProvider:{currentSession:()=>session},MerEnterpriseSecurity:{isLocked:()=>locked},addEventListener:(type,callback)=>addListener(windowEvents,type,callback)};
  vm.runInNewContext(source,context);
  const get=id=>document.getElementById(id),dialog=get('calculatorModal'),input=get('calculatorExpression'),result=get('calculatorResult'),trigger=get('calculatorTrigger');
  const emit=(events,type)=>{for(const callback of events.get(type)||[])callback({type});};
  return {
    context,document,shell,dialog,input,result,trigger,get,
    get opens(){return opens;},get closes(){return closes;},
    open(){trigger.click();},calculate(value='125,50 + 20'){input.value=value;get('calculatorForm').dispatch('submit');},
    key(value){dialog.querySelector('.calculator-keys').dispatch('click',{target:dialog.querySelector(`[data-calculator-key="${value}"]`)});},
    session(value){session=value;},lock(value){locked=value;},
    windowEvent:type=>emit(windowEvents,type),documentEvent:type=>emit(documentEvents,type),
    mutate(target,attribute,mutation){mutation();for(const observer of observers)if(observer.target===target&&observer.options.attributeFilter.includes(attribute))observer.callback([{target,attributeName:attribute}]);}
  };
}

test('calculator closes and clears on access changes without a global redraw',()=>{
  const changes={
    hidden:app=>app.mutate(app.shell,'hidden',()=>{app.shell.hidden=true;}),
    inert:app=>app.mutate(app.shell,'inert',()=>{app.shell.inert=true;}),
    mfa:app=>app.mutate(app.document.body,'class',()=>app.document.body.classList.add('mfa-locked')),
    locked:app=>{app.lock(true);app.windowEvent('mer-security-status');},
    expired:app=>{app.session(null);app.windowEvent('storage');},
    visibility:app=>{app.session(null);app.documentEvent('visibilitychange');},
    signedOut:app=>{app.session(null);app.windowEvent('mer-security-status');}
  };
  for(const [name,invalidate] of Object.entries(changes)){
    const app=harness();app.open();app.calculate();
    assert.equal(app.dialog.open,true,name);assert.equal(app.result.textContent,'145,5',name);
    invalidate(app);
    assert.equal(app.dialog.open,false,name);assert.equal(app.input.value,'',name);assert.equal(app.result.textContent,'',name);
    assert.equal(app.trigger.disabled,true,name);assert.equal(app.trigger.getAttribute('aria-expanded'),'false',name);
    assert.equal(app.closes,1,name);app.open();assert.equal(app.opens,1,name+' cannot reopen until access returns');
  }
});

test('benign theme, security and render notifications retain the expression and result',()=>{
  const app=harness();app.open();app.calculate();
  app.mutate(app.document.body,'class',()=>app.document.body.classList.add('dark-theme'));
  app.windowEvent('mer-security-status');app.windowEvent('storage');app.documentEvent('visibilitychange');
  app.context.window.MerQuickTools.render();
  assert.equal(app.dialog.open,true);assert.equal(app.input.value,'125,50 + 20');assert.equal(app.result.textContent,'145,5');assert.equal(app.closes,0);
  app.context.currentLang='en';app.context.window.MerQuickTools.render();
  assert.equal(app.input.value,'125,50 + 20');assert.equal(app.result.textContent,'145.5');
});

test('restored access opens at zero and account or user changes clear prior calculations',()=>{
  const app=harness();app.open();app.calculate('1/0');assert.equal(app.result.classList.contains('is-error'),true);
  app.mutate(app.shell,'inert',()=>{app.shell.inert=true;});
  app.mutate(app.shell,'inert',()=>{app.shell.inert=false;});app.open();
  assert.equal(app.dialog.open,true);assert.equal(app.input.value,'0');assert.equal(app.result.textContent,'0');assert.equal(app.result.classList.contains('is-error'),false);
  app.calculate();app.context.appState.activeAccount='business';app.context.window.MerQuickTools.render();
  assert.equal(app.dialog.open,false);assert.equal(app.input.value,'');assert.equal(app.result.textContent,'');
  app.open();app.calculate();app.session({userId:'user-b'});app.windowEvent('storage');
  assert.equal(app.dialog.open,false);assert.equal(app.input.value,'');assert.equal(app.result.textContent,'');
  app.open();assert.equal(app.dialog.open,true);assert.equal(app.input.value,'0');assert.equal(app.result.textContent,'0');
});

test('calculator opens, clears and reopens at zero without restoring an old expression',()=>{
  const app=harness();app.open();
  assert.equal(app.input.value,'0');assert.equal(app.result.textContent,'0');assert.equal(app.input.getAttribute('placeholder'),'0');
  app.key('7');app.key('+');app.key('3');app.key('=');assert.equal(app.input.value,'7+3');assert.equal(app.result.textContent,'10');
  app.key('C');assert.equal(app.input.value,'0');assert.equal(app.result.textContent,'0');
  app.key('+');app.key('2');app.key('=');assert.equal(app.input.value,'0+2');assert.equal(app.result.textContent,'2');
  app.dialog.querySelector('[data-close-calculator]').click();app.open();
  assert.equal(app.input.value,'0');assert.equal(app.result.textContent,'0');
  app.key(',');app.key('5');app.key('=');assert.equal(app.result.textContent,'0,5');
  app.calculate('1/0');app.key('C');assert.equal(app.result.classList.contains('is-error'),false);assert.equal(app.result.textContent,'0');
});

test('pending submit and keypad events cannot preserve or recreate results after session loss',()=>{
  for(const action of [app=>app.calculate(),app=>app.key('7'),app=>app.get('calculatorExpression').dispatch('input')]){
    const app=harness();app.open();app.calculate();app.session(null);action(app);
    assert.equal(app.dialog.open,false);assert.equal(app.input.value,'');assert.equal(app.result.textContent,'');assert.equal(app.trigger.disabled,true);
  }
});
