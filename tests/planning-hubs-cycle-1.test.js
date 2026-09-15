'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const path = require('node:path'), read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

class Element {
  constructor(tag, doc) {
    this.tagName=tag.toLowerCase();this.doc=doc;this.children=[];this.parentElement=null;this.attributes={};this.dataset={};this.listeners={};this.id='';this.className='';this.hidden=false;this.open=false;this.disabled=false;this.textContent='';
    this.classList={contains:name=>this.className.split(/\s+/).includes(name)};
    this.attributes[Symbol.iterator]=function*(){for(const [name,value]of Object.entries(this))yield{name,value};};
  }
  setAttribute(name,value) {this.attributes[name]=String(value);if(name==='class')this.className=value;else if(name==='id')this.id=value;else if(name.startsWith('data-'))this.dataset[name.slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase())]=value;}
  getAttribute(name){return this.attributes[name]??null;}
  append(child){if(child.parentElement)child.parentElement.children=child.parentElement.children.filter(item=>item!==child);child.parentElement=this;this.children.push(child);}
  prepend(child){this.append(child);this.children.splice(this.children.indexOf(child),1);this.children.unshift(child);}
  set innerHTML(value){this._html=value;this.children.forEach(child=>{child.parentElement=null;});this.children=[];const stack=[this],voidTags=new Set(['input','br','img','use']);for(const match of value.matchAll(/<(\/?)([a-z][\w-]*)(\s+(?:[^>"']|"[^"]*"|'[^']*')*)?\s*(\/?)>/gi)){const [,closing,tag,raw='',selfClosing]=match;if(closing){if(stack.length>1)stack.pop();continue;}const child=new Element(tag,this.doc);for(const attr of raw.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))child.setAttribute(attr[1],attr[2]??attr[3]??attr[4]??'');stack.at(-1).append(child);if(!voidTags.has(tag)&&!selfClosing)stack.push(child);}}
  get innerHTML(){return this._html||'';}
  matches(selector){if(selector.startsWith('#'))return this.id===selector.slice(1);if(selector.startsWith('.'))return this.classList.contains(selector.slice(1));const attr=selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);if(attr){const value=attr[1].startsWith('data-')?this.dataset[attr[1].slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase())]:this.attributes[attr[1]];return value!==undefined&&(attr[2]===undefined||String(value)===attr[2]);}return this.tagName===selector;}
  querySelectorAll(selector){const choices=selector.split(',').map(item=>item.trim()),found=[];const visit=node=>node.children.forEach(child=>{if(choices.some(item=>child.matches(item)))found.push(child);visit(child);});visit(this);return found;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  closest(selector){const matches=selector.endsWith(':not([open])')?!this.open&&this.matches(selector.slice(0,-12)):this.matches(selector);return matches?this:this.parentElement?.closest(selector)||null;}
  contains(node){return node===this||this.children.some(child=>child.contains(node));}
  get isConnected(){return this===this.doc.body||Boolean(this.parentElement?.isConnected);}
  getClientRects(){return this.hidden||!this.isConnected?[]:[{}];}
  addEventListener(type,handler){(this.listeners[type]||=[]).push(handler);}
  dispatch(type){const event={target:this,preventDefault(){this.defaultPrevented=true;}};for(let node=this;node;node=type==='click'?node.parentElement:null)for(const callback of node.listeners[type]||[])callback(event);return event;}
  click(){this.focus();this.dispatch('click');}
  focus(){this.doc.activeElement=this;}
  close(){this.open=false;this.dispatch('close');}
}
function harness(){
  const frames=[],observers=[],calls=[],document={activeElement:null,documentElement:{lang:'hr'}};
  document.body=new Element('body',document);document.createElement=tag=>new Element(tag,document);document.querySelectorAll=selector=>document.body.querySelectorAll(selector);document.getElementById=id=>document.body.querySelector('#'+id);
  const add=(tag,id,parent=document.body)=>{const element=document.createElement(tag);element.id=id;parent.append(element);return element;};
  const shell=add('div','appShell'),personal={},business={},state={activeProfile:'personal',language:'hr',profiles:{personal,business}};
  let user='one',locked=false;
  for(const kind of ['payments','savings']){const button=add('button',kind+'Trigger');button.dataset.planningHub=kind;}
  for(const id of ['budgetDetailsModal','subscriptionsModal','assessmentModal','vaultsModal','fireSimulatorModal','subscriptionRenewalsModal','taxVaultModal','recurringModal','receiptMatcherModal']){const dialog=add('dialog',id);dialog.className='modal';const header=add('header','',dialog);add('button','close-'+id,header);const footer=add('footer','',dialog);footer.className='modal-actions';if(id==='assessmentModal'){const button=add('button','assessmentBack',footer);button.hidden=true;}add('button','submit-'+id,footer);if(id==='budgetDetailsModal')add('button','addRecurring',dialog);}
  const window={document,MerEnterpriseSecurity:{isLocked:()=>locked},MerRuntime:{bindDialogBackdropDismiss(dialog,callback){dialog.dismissBackdrop=callback;}}};
  const nativeOpen=dialog=>{window.MerPlanNavigation?.enter(dialog);window.MerPlanNavigation?.enhance(dialog);for(const other of document.querySelectorAll('dialog'))if(other!==dialog)other.close();dialog.open=true;};
  window.MerEnterpriseBridge={getState:()=>state,currentUser:()=>({userId:user}),openModal:nativeOpen,closeModal:dialog=>dialog.close()};
  window.MerPlanningUI={open:kind=>{calls.push(kind);nativeOpen(document.getElementById(kind==='fire'?'fireSimulatorModal':'subscriptionRenewalsModal'));}};
  window.MerVaultsUI={open:kind=>{calls.push(kind);nativeOpen(document.getElementById('vaultsModal'));}};
  window.MerEnterpriseUI={openTaxVault:()=>{calls.push('tax');nativeOpen(document.getElementById('taxVaultModal'));}};
  window.openAssessment=()=>{calls.push('assessment');nativeOpen(document.getElementById('assessmentModal'));};window.renderSubscriptions=()=>calls.push('render-subscriptions');
  window.MutationObserver=class{constructor(callback){this.callback=callback;}observe(node){observers.push({node,callback:this.callback});}};
  const context=vm.createContext({window,document,requestAnimationFrame:callback=>frames.push(callback)});
  vm.runInContext(read('plan-navigation.js'),context);vm.runInContext(read('planning-hubs.js'),context);
  return{window,document,state,shell,calls,add,get:id=>document.getElementById(id),open:nativeOpen,hub:window.MerPlanningHubs,nav:window.MerPlanNavigation,frame:callback=>frames.push(callback),flush(){while(frames.length)frames.shift()();},notify(node){observers.filter(observer=>observer.node===node).forEach(observer=>observer.callback());},setUser:value=>{user=value;},lock:()=>{locked=true;}};
}
{
  const h=harness();h.get('paymentsTrigger').click();const hub=h.get('planningPaymentsModal');
  assert.equal(hub.open,true);assert.deepEqual(hub.querySelectorAll('[data-hub-action]').map(button=>button.dataset.hubAction),['scheduled','subscriptions','renewals']);
  assert.equal(hub.querySelector('header').querySelector('[data-plan-back]'),null);
  assert.equal(hub.querySelector('footer').children[0].textContent,'Zatvori');
  for(const [action,id] of [['scheduled','budgetDetailsModal'],['subscriptions','subscriptionsModal'],['renewals','subscriptionRenewalsModal']]){
    const button=hub.querySelector(`[data-hub-action="${action}"]`);button.click();assert.equal(hub.open,false);assert.equal(h.get(id).open,true);
    h.nav.back(h.get(id));h.flush();assert.equal(hub.open,true);assert.equal(h.document.activeElement.dataset.hubAction,action);
  }
  assert.deepEqual(h.calls,['render-subscriptions','renewals'],'each child dispatches exactly once');
  const first=hub;h.hub.open('payments');assert.equal(h.get('planningPaymentsModal'),first,'singleton hub is reused');
  first.dismissBackdrop();assert.equal(first.open,false);h.hub.open('payments');assert.equal(first.dispatch('cancel').defaultPrevented,true);assert.equal(first.open,false);
}
{
  const h=harness();h.hub.open('savings');const hub=h.get('planningSavingsModal');
  assert.deepEqual(hub.querySelectorAll('[data-hub-action]').map(button=>button.dataset.hubAction),['assessment','automation','fire']);
  for(const [action,id] of [['assessment','assessmentModal'],['automation','vaultsModal'],['fire','fireSimulatorModal']]){hub.querySelector(`[data-hub-action="${action}"]`).click();assert.equal(h.get(id).open,true);const draft=h.add('input','draft-'+action,h.get(id));draft.value='unsaved';h.nav.back(h.get(id));h.flush();assert.equal(draft.value,'unsaved');assert.equal(hub.open,true);}
  assert.deepEqual(h.calls,['assessment','automation','fire']);
  h.state.activeProfile='business';h.hub.render();assert.equal(hub.open,false);assert.equal(h.hub.canRestore(hub.id),false);
  h.hub.open('savings');hub.querySelector('[data-hub-action="tax"]').click();assert.equal(h.get('taxVaultModal').open,true);assert.deepEqual(h.calls.at(-1),'tax');
}
{
  for(const invalidate of [h=>{h.state.activeProfile='business';},h=>h.setUser('two'),h=>h.lock(),h=>{h.shell.hidden=true;},h=>{h.shell.inert=true;},h=>{h.state.profiles.personal={};}]){
    const h=harness();h.hub.open('savings');h.get('planningSavingsModal').querySelector('[data-hub-action="fire"]').click();invalidate(h);h.nav.back(h.get('fireSimulatorModal'));h.flush();assert.equal(h.get('planningSavingsModal').open,false,'stale hub cannot reopen');assert.equal(h.get('fireSimulatorModal').open,false);
  }
}
{
  const h=harness();h.hub.open('savings');h.get('planningSavingsModal').querySelector('[data-hub-action="assessment"]').click();const assessment=h.get('assessmentModal'),back=assessment.querySelector('[data-plan-back]'),local=h.get('assessmentBack');assert.equal(back.hidden,false);
  local.hidden=false;h.notify(local);assert.equal(back.hidden,true,'wizard internal Back takes priority after the first step');
  local.hidden=true;h.notify(local);assert.equal(back.hidden,false);
  h.nav.back(assessment);h.flush();assert.equal(h.get('planningSavingsModal').open,true);
  h.get('planningSavingsModal').close();h.open(assessment);assert.equal(back.hidden,true,'direct opening cannot retain a stale hub Back');
}
{
  const h=harness();h.hub.open('payments');h.get('planningPaymentsModal').querySelector('[data-hub-action="scheduled"]').click();const details=h.get('budgetDetailsModal');h.get('addRecurring').focus();h.open(h.get('recurringModal'));
  h.nav.back(h.get('recurringModal'));h.flush();assert.equal(details.open,true);assert.equal(h.document.activeElement.id,'addRecurring');
  h.nav.back(details);h.flush();assert.equal(h.get('planningPaymentsModal').open,true,'nested return preserves the earlier hub origin');
}
{
  const h=harness();h.open(h.get('fireSimulatorModal'));h.nav.back(h.get('fireSimulatorModal'));h.flush();assert.equal(h.get('planningSavingsModal'),null,'direct commands do not unexpectedly create a hub');
  const receipt=h.get('receiptMatcherModal'),back=h.add('button','receiptBack',receipt.querySelector('footer'));h.nav.enhance(receipt);assert.equal(receipt.querySelector('[data-plan-back]'),null,'camera/review keep local Back');assert.equal(back.parentElement,receipt.querySelector('footer'));
  h.hub.open('payments');h.state.language='en';h.hub.render();assert.equal(h.get('planningPaymentsModal').querySelector('h2').textContent,'Payments and subscriptions');
  assert.equal(h.get('paymentsTrigger').textContent,'Payments and subscriptions');assert.equal(h.get('savingsTrigger').textContent,'Savings planning');
}
assert.match(read('planning-hubs.css'),/max-height:90dvh/);
assert.match(read('planning-hubs.css'),/\.planning-hub-header \.modal-close \{ position:static/);
assert.match(read('planning-hubs.css'),/min-height:76px/);
// Execute the actual application close routine, not a reimplementation of its focus rules.
function appCloseHarness(h) {
  const modalReturnFocus=new WeakMap();
  const source=read('app.js').match(/function closeModal\(modal\) \{[\s\S]*?\r?\n\}/)?.[0];assert.ok(source);
  const scope=vm.createContext({modalReturnFocus,hideBankActionTooltip(){},syncModalLayer(){},requestAnimationFrame:h.frame,
    $:selector=>selector==='.modal[open]'?h.document.querySelectorAll('dialog').find(dialog=>dialog.open):h.document.body.querySelector(selector)});
  vm.runInContext(source,scope);h.window.MerEnterpriseBridge.closeModal=scope.closeModal;
  return{close:scope.closeModal,returns:modalReturnFocus};
}
for(const [kind,hubId,action,childId]of [['payments','planningPaymentsModal','scheduled','budgetDetailsModal'],['savings','planningSavingsModal','fire','fireSimulatorModal']]){
  const h=harness(),app=appCloseHarness(h),trigger=h.get(kind+'Trigger');
  h.hub.open(kind);const hub=h.get(hubId);app.returns.set(hub,trigger);hub.querySelector('[data-planning-hub-close]').click();h.flush();
  assert.equal(h.document.activeElement,trigger,'direct hub X returns to its module toolbar');
  h.hub.open(kind);const origin=hub.querySelector(`[data-hub-action="${action}"]`);origin.click();const child=h.get(childId);app.returns.set(child,origin);
  app.close(child);h.flush();assert.equal(h.document.activeElement,trigger,'child X exits to the visible module toolbar when its hub is closed');
  h.hub.open(kind);const nextOrigin=hub.querySelector(`[data-hub-action="${action}"]`);nextOrigin.click();app.returns.set(child,nextOrigin);
  let toolbarFocus=0;const focus=trigger.focus.bind(trigger);trigger.focus=()=>{toolbarFocus+=1;focus();};
  h.nav.back(child);h.flush();assert.equal(hub.open,true);assert.equal(h.document.activeElement.dataset.hubAction,action);
  assert.equal(toolbarFocus,0,'pending child-close callback cannot steal focus outside the reopened hub');
  // openModal captures the former child Back as the return target on this round trip.
  app.returns.set(hub,child.querySelector('[data-plan-back]')||child.querySelector('button'));
  hub.dispatch('cancel');h.flush();assert.equal(h.document.activeElement,trigger,'restored hub Esc returns to toolbar, never a hidden child control');
  h.hub.open(kind);app.returns.set(hub,trigger);app.close(hub);const other=h.get('subscriptionsModal');h.open(other);const inside=other.querySelector('button');inside.focus();h.flush();
  assert.equal(h.document.activeElement,inside,'closing hub does not move focus out of another open dialog');
}
process.stdout.write('Planning hubs cycle 1: contextual placement, single dispatch, footer navigation, nested Back, draft identity and profile/session guards passed.\n');
