'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=file=>fs.readFileSync(require.resolve('../'+file),'utf8');

function harness(){
  let mutations=0,frameId=0;
  const observers=[],frames=new Map(),timers=[];
  const document={activeElement:null};
  class Element{
    constructor(tag){this.tagName=tag;this.children=[];this.parentElement=null;this.attributes={};this.dataset={};this.listeners=new Map();this.hidden=false;this.disabled=false;this.id='';this.className='';this._text='';this.classList={add:name=>{if(!this.className.split(' ').includes(name))this.className+=' '+name;}};}
    get isConnected(){return this===document.documentElement||Boolean(this.parentElement?.isConnected);}
    get previousElementSibling(){const siblings=this.parentElement?.children||[];return siblings[siblings.indexOf(this)-1]||null;}
    get textContent(){return this._text;}
    set textContent(value){this._text=String(value);mutations++;}
    append(...nodes){for(const node of nodes){node.remove();node.parentElement=this;this.children.push(node);mutations++;}}
    prepend(node){this.append(node);this.children.splice(this.children.indexOf(node),1);this.children.unshift(node);}
    after(node){const parent=this.parentElement;node.remove();node.parentElement=parent;parent.children.splice(parent.children.indexOf(this)+1,0,node);mutations++;}
    remove(){if(this.parentElement){const children=this.parentElement.children;children.splice(children.indexOf(this),1);this.parentElement=null;mutations++;}}
    setAttribute(name,value){this.attributes[name]=String(value);}
    getAttribute(name){return this.attributes[name]??null;}
    removeAttribute(name){delete this.attributes[name];}
    matches(selector){return selector.startsWith('.')?this.className.split(' ').includes(selector.slice(1)):this.tagName===selector;}
    closest(selector){return this.matches(selector)?this:this.parentElement?.closest(selector)||null;}
    contains(node){return this===node||this.children.some(child=>child.contains(node));}
    querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
    addEventListener(name,callback){if(!this.listeners.has(name))this.listeners.set(name,[]);this.listeners.get(name).push(callback);}
    removeEventListener(name,callback){this.listeners.set(name,(this.listeners.get(name)||[]).filter(item=>item!==callback));}
    focus(){document.activeElement=this;}
    click(){for(const callback of this.listeners.get('click')||[])callback({target:this});}
  }
  document.documentElement=new Element('html');document.documentElement.lang='en';document.body=new Element('body');document.documentElement.append(document.body);
  document.createElement=tag=>new Element(tag);document.querySelectorAll=selector=>document.documentElement.querySelectorAll(selector);
  const root={document,addEventListener(){},setTimeout:callback=>timers.push(callback),requestAnimationFrame(callback){frames.set(++frameId,callback);return frameId;},cancelAnimationFrame:id=>frames.delete(id),MutationObserver:class{constructor(callback){this.callback=callback;}observe(node,options){this.node=node;this.options=options;observers.push(this);}disconnect(){this.disconnected=true;}}};
  const context=vm.createContext({window:root});vm.runInContext(read('pagination.js'),context);vm.runInContext(read('sections.js'),context);
  const add=(tag,parent=document.body)=>{const node=document.createElement(tag);parent.append(node);return node;};
  return{root,document,add,observers,mutations:()=>mutations,flush(){const pending=[...frames.values()];frames.clear();pending.forEach(callback=>callback());},flushTimers(){while(timers.length)timers.shift()();},notifyLanguage(){observers.filter(observer=>observer.node===document.documentElement&&!observer.disconnected).forEach(observer=>observer.callback());}};
}
const visible=container=>container.children.filter(item=>!item.hidden&&item.getAttribute('data-page-hidden')!=='true');

test('attached pagination reaches every record, clamps filtered pages, and isolates changed profile scopes',()=>{
  const h=harness(),container=h.add('div'),items=Array.from({length:11},(_,i)=>{const item=h.add('article',container);item.id='record'+i;return item;});
  let scope='personal';const pager=h.root.MerPagination.attach(container,{pageSize:4,itemSelector:'article',scopeKey:()=>scope});
  const reached=[];for(let page=1;page<=3;page++){pager.goTo(page);reached.push(...visible(container).map(item=>item.id));}
  assert.deepEqual(reached,items.map(item=>item.id));
  items.slice(3).forEach(item=>item.hidden=true);pager.refresh();assert.equal(pager.page,1);assert.equal(visible(container).length,3);
  items.forEach(item=>item.hidden=false);pager.goTo(3);scope='business';pager.refresh();assert.equal(pager.page,1);
  assert.equal(container.children[0],items[0],'pager retains node identity and existing handlers');
});

test('repeated enhancement emits no child-list mutations and language changes update the same pager',()=>{
  const h=harness(),container=h.add('div');for(let i=0;i<7;i++)h.add('article',container);
  const options={pageSize:4,itemSelector:'article'},pager=h.root.MerPagination.attach(container,options),nav=container.parentElement.children.at(-1),before=h.mutations();
  for(let i=0;i<20;i++)assert.equal(h.root.MerPagination.attach(container,options),pager);
  assert.equal(h.mutations(),before,'stable refresh cannot feed a childList-driven enhancement loop');
  h.document.documentElement.lang='hr';h.notifyLanguage();h.flush();
  assert.equal(nav.children[0].textContent,'Prethodna');assert.equal(nav.children[2].textContent,'Sljedeća');
});

test('native form validation reveals the first invalid page and keeps later invalid fields from hiding it',()=>{
  const h=harness(),form=h.add('form'),container=h.add('div',form),fields=[];
  for(let i=0;i<7;i++){const row=h.add('article',container),field=h.add('input',row);field.form=form;fields.push(field);}
  const pager=h.root.MerPagination.attach(container,{pageSize:2,itemSelector:'article'}),handler=container.listeners.get('invalid')[0];
  handler({target:fields[4],preventDefault(){}});assert.equal(pager.page,3);assert.ok(visible(container).some(item=>item.contains(fields[4])));
  let suppressed=false;handler({target:fields[6],preventDefault(){suppressed=true;}});assert.equal(suppressed,true);assert.equal(pager.page,3);
  h.flushTimers();handler({target:fields[6],preventDefault(){}});assert.equal(pager.page,4,'a later submit may reveal the next invalid field');
});

test('section language refresh retains draft identity and selection; rebuild releases stale validation handlers',()=>{
  const h=harness(),container=h.add('div'),first=h.add('article',container),second=h.add('article',container),draft=h.add('input',second);draft.value='unsaved';
  const label=(en,hr)=>()=>h.document.documentElement.lang==='en'?en:hr;
  const sections=h.root.MerSections.attach(container,[{label:label('Overview','Sažetak'),nodes:[first]},{label:label('Form','Obrazac'),nodes:[second]}]);
  sections.select(1);h.document.documentElement.lang='hr';h.notifyLanguage();
  assert.equal(sections.tabs.children[1].textContent,'Obrazac');assert.equal(sections.selected,1);assert.equal(draft.value,'unsaved');assert.equal(draft.parentElement,second);
  const before=h.mutations();sections.refreshLabels();assert.equal(h.mutations(),before,'translated labels are idempotent');
  for(const node of [...container.children])node.remove();
  const nextFirst=h.add('article',container),nextSecond=h.add('article',container);
  h.root.MerSections.attach(container,[{label:'A',nodes:[nextFirst]},{label:'B',nodes:[nextSecond]}]);
  assert.equal(container.listeners.get('invalid').length,1,'rebuilding a section does not retain old panels through event handlers');
});
