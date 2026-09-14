'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {createController} = require('../modal-footer.js');

// Minimal DOM with node movement, reflected attributes and real event dispatch.
// It models the selectors used by the production controller without parsing its output.
class Element {
  constructor(tag, document) {
    this.tagName = tag.toLowerCase(); this.ownerDocument = document;
    this.children = []; this.parentElement = null; this.attributes = new Map(); this.listeners = new Map(); this._text = '';
    this.classList = {
      contains:name => this.className.split(/\s+/).includes(name),
      add:(...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); }
    };
    this.dataset = new Proxy({}, {
      set:(_, key, value) => { this.setAttribute(`data-${key.replace(/[A-Z]/g, letter=>`-${letter.toLowerCase()}`)}`, value); return true; },
      get:(_, key) => this.getAttribute(`data-${String(key).replace(/[A-Z]/g, letter=>`-${letter.toLowerCase()}`)}`) ?? undefined
    });
    document.created.push(this);
  }
  get id() { return this.getAttribute('id') || ''; }
  set id(value) { this.setAttribute('id',value); }
  get className() { return this.getAttribute('class') || ''; }
  set className(value) { this.setAttribute('class',value); }
  get hidden() { return this.hasAttribute('hidden'); }
  set hidden(value) { if(value)this.setAttribute('hidden','');else this.removeAttribute('hidden'); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) { if(value)this.setAttribute('disabled','');else this.removeAttribute('disabled'); }
  get type() { return this.getAttribute('type') || (this.tagName==='button'?'submit':'text'); }
  set type(value) { this.setAttribute('type',value); }
  get textContent() { return this._text + this.children.map(child=>child.textContent).join(''); }
  set textContent(value) { this._text=String(value);this.children.forEach(child=>{child.parentElement=null;});this.children=[]; }
  get firstElementChild() { return this.children[0] || null; }
  get form() {
    const explicit = this.getAttribute('form');
    return explicit ? this.ownerDocument.getElementById(explicit) : this.closest('form');
  }
  get isConnected() { return this===this.ownerDocument.body || Boolean(this.parentElement?.isConnected); }
  setAttribute(name,value) { this.attributes.set(name,String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  hasAttribute(name) { return this.attributes.has(name); }
  removeAttribute(name) { this.attributes.delete(name); }
  remove() { if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(child=>child!==this);this.parentElement=null; }
  append(...nodes) { nodes.forEach(node=>{node.remove();node.parentElement=this;this.children.push(node);}); }
  prepend(...nodes) { nodes.forEach(node=>node.remove());nodes.forEach(node=>{node.parentElement=this;});this.children.unshift(...nodes); }
  contains(node) { return this===node || this.children.some(child=>child.contains(node)); }
  matches(selector) {
    return selector.split(',').some(part=>{
      const terms=part.trim().split(/\s+/);let node=this;
      if(!node.matchesSimple(terms.pop()))return false;
      while(terms.length){const term=terms.pop();node=node.parentElement;while(node&&!node.matchesSimple(term))node=node.parentElement;if(!node)return false;}
      return true;
    });
  }
  matchesSimple(selector) {
    if(selector.startsWith('#'))return this.id===selector.slice(1);
    if(selector.startsWith('.'))return this.classList.contains(selector.slice(1));
    const attribute=selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if(attribute)return this.hasAttribute(attribute[1]) && (attribute[2]===undefined || this.getAttribute(attribute[1])===attribute[2]);
    return this.tagName===selector;
  }
  closest(selector) { for(let node=this;node;node=node.parentElement)if(node.matches(selector))return node;return null; }
  querySelectorAll(selector) {
    if(selector.startsWith(':scope > '))return this.children.filter(child=>child.matches(selector.slice(9)));
    const found=[];const visit=node=>node.children.forEach(child=>{if(child.matches(selector))found.push(child);visit(child);});visit(this);return found;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  addEventListener(name,handler) { if(!this.listeners.has(name))this.listeners.set(name,[]);this.listeners.get(name).push(handler); }
  dispatch(name) {
    const event={target:this,currentTarget:this,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};
    (this.listeners.get(name)||[]).forEach(handler=>handler(event));return event;
  }
  click() { if(this.disabled)return;const event=this.dispatch('click');if(!event.defaultPrevented && this.tagName==='button' && this.type==='submit')this.form?.dispatch('submit'); }
}
function harness() {
  const document={created:[],documentElement:{lang:'hr'}};
  document.createElement=tag=>new Element(tag,document);document.body=document.createElement('body');
  document.getElementById=id=>document.body.querySelector(`#${id}`);
  const node=(tag,attributes={},text='')=>{const result=document.createElement(tag);Object.entries(attributes).forEach(([key,value])=>{if(value!==false)result.setAttribute(key,value===true?'':value);});result.textContent=text;return result;};
  const dialog=node('dialog',{id:'testModal',class:'modal'}), header=node('header'), close=node('button',{type:'button',class:'modal-close'},'×');
  let closes=0;close.addEventListener('click',()=>closes++);header.append(close);dialog.append(header);document.body.append(dialog);
  return {document,node,dialog,header,close,closes:()=>closes,enhance:createController(document).enhance};
}
const snapshot=node=>({tag:node.tagName,attributes:[...node.attributes].sort(([a],[b])=>a.localeCompare(b)),text:node._text,children:node.children.map(snapshot)});

test('cycle 1: footer normalization moves the existing Back handler and preserves live form ownership',()=>{
  const h=harness(), form=h.node('form',{id:'expenseForm'}), field=h.node('input',{name:'name'}), footer=h.node('div',{class:'modal-actions'}), group=h.node('div',{class:'modal-primary-actions'});
  const cancel=h.node('button',{type:'button'},'Otkaži'), back=h.node('button',{id:'assessmentBack',type:'button'},'Natrag'), save=h.node('button',{type:'submit'},'Spremi');
  field.value='Unfinished draft';let backs=0,submits=0;back.addEventListener('click',()=>backs++);form.addEventListener('submit',event=>{event.preventDefault();submits++;});
  group.append(cancel,back,save);footer.append(group);form.append(field,footer);h.dialog.append(form);
  const ownerBefore=save.form, handlerBefore=back.listeners.get('click')[0];
  h.enhance(h.dialog);
  assert.equal(footer.firstElementChild,back);assert.equal(back.listeners.get('click')[0],handlerBefore);assert.equal(save.form,ownerBefore);
  assert.equal(field.value,'Unfinished draft');assert.equal(form.querySelector('input'),field);
  assert.equal(back.hasAttribute('data-footer-left'),true);assert.equal(cancel.hasAttribute('data-footer-redundant'),true);
  back.click();save.click();assert.equal(backs,1);assert.equal(submits,1);assert.equal(h.closes(),0);
});

test('cycle 1: external footer submit keeps its explicit live form association',()=>{
  const h=harness(), form=h.node('form',{id:'renewalForm'}), footer=h.node('footer',{class:'planning-footer'}), back=h.node('button',{'data-planning-back':'',type:'button'},'Natrag'), save=h.node('button',{type:'submit',form:'renewalForm'},'Spremi podsjetnik');
  let submits=0;form.addEventListener('submit',()=>submits++);footer.append(back,save);h.dialog.append(form,footer);
  h.enhance(h.dialog);assert.equal(save.form,form);save.click();assert.equal(submits,1);
});

test('cycle 1: hidden wizard Back selects generated Close then returns to the same Back control',()=>{
  const h=harness(), footer=h.node('footer',{class:'engagement-footer'}), stage=h.node('div',{hidden:true}), back=h.node('button',{id:'wrappedBack',type:'button'},'Natrag'), next=h.node('button',{type:'button'},'Dalje');
  stage.append(back);footer.append(stage,next);h.dialog.append(footer);h.enhance(h.dialog);
  const generated=footer.querySelector('[data-footer-close]');assert.ok(generated);assert.equal(generated.type,'button');assert.equal(generated.hidden,false);assert.equal(footer.firstElementChild,generated);
  assert.equal(back.parentElement,stage,'a hidden stage does not leak its navigation');generated.click();assert.equal(h.closes(),1);
  stage.hidden=false;h.enhance(h.dialog);assert.equal(footer.firstElementChild,back);assert.equal(generated.hidden,true);assert.equal(generated.hasAttribute('data-footer-left'),false);
  back.hidden=true;h.enhance(h.dialog);assert.equal(footer.firstElementChild,generated);assert.equal(generated.hidden,false);assert.equal(generated.hasAttribute('data-footer-left'),true);
});

test('cycle 1: visible Cancel is retained as the left action without manufacturing another close',()=>{
  const h=harness(), footer=h.node('footer',{class:'invoice-footer'}), cancel=h.node('button',{type:'button'},'Otkaži'), save=h.node('button',{type:'submit'},'Spremi');
  let cancelled=0;cancel.addEventListener('click',()=>cancelled++);footer.append(save,cancel);h.dialog.append(footer);h.enhance(h.dialog);
  assert.equal(footer.firstElementChild,cancel);assert.equal(footer.querySelector('[data-footer-close]'),null);cancel.click();assert.equal(cancelled,1);
});

test('cycle 1: import keeps its hidden contextual wrapper and gates confirmation as review changes',()=>{
  const h=harness();h.dialog.id='importDataModal';
  const wrapper=h.node('div',{id:'importTransactionBackWrap',hidden:true}), back=h.node('button',{id:'backToTransactionEntry',type:'button'},'Natrag'), review=h.node('div',{id:'importReview',hidden:true}), footer=h.node('div',{class:'modal-actions import-commit-actions'}), cancel=h.node('button',{type:'button'},'Otkaži'), confirm=h.node('button',{id:'confirmImport',type:'button'},'Potvrdi uvoz');
  let returned=0,confirmed=0;back.addEventListener('click',()=>returned++);confirm.addEventListener('click',()=>confirmed++);
  wrapper.append(back);footer.append(cancel,confirm);review.append(footer);h.dialog.append(wrapper,review);h.enhance(h.dialog);
  assert.equal(footer.parentElement,h.dialog);assert.equal(wrapper.parentElement,footer);assert.equal(wrapper.hidden,true);assert.equal(back.parentElement,wrapper);assert.equal(confirm.hidden,true);assert.equal(footer.firstElementChild,cancel);
  wrapper.hidden=false;review.hidden=false;h.enhance(h.dialog);
  assert.equal(footer.firstElementChild,wrapper);assert.equal(back.parentElement,wrapper);assert.equal(back.hasAttribute('data-footer-left'),true);assert.equal(confirm.hidden,false);assert.equal(cancel.hasAttribute('data-footer-redundant'),true);
  back.click();confirm.click();assert.equal(returned,1);assert.equal(confirmed,1);
  wrapper.hidden=true;review.hidden=true;h.enhance(h.dialog);assert.equal(back.parentElement,wrapper);assert.equal(confirm.hidden,true);assert.equal(cancel.hasAttribute('data-footer-left'),true);assert.equal(cancel.hasAttribute('data-footer-redundant'),false);
});

test('cycle 1: repeat normalization is idempotent and generated Close resolves the current header handler',()=>{
  const h=harness();h.enhance(h.dialog);
  const footer=h.dialog.querySelector('.mer-generated-footer'), generated=footer.querySelector('[data-footer-close]'), before=snapshot(h.dialog), count=h.document.created.length;
  for(let index=0;index<5;index++)h.enhance(h.dialog);
  assert.deepEqual(snapshot(h.dialog),before);assert.equal(h.document.created.length,count);assert.equal(generated.listeners.get('click').length,1);
  h.document.documentElement.lang='en';h.enhance(h.dialog);assert.equal(generated.textContent,'Close');
  h.close.remove();const replacement=h.node('button',{type:'button',class:'modal-close'},'×');let replacementCloses=0;replacement.addEventListener('click',()=>replacementCloses++);h.header.append(replacement);generated.click();assert.equal(h.closes(),0);assert.equal(replacementCloses,1);
});

test('cycle 1: temporary generated footer yields to a newly visible stage footer and reappears afterward',()=>{
  const h=harness(), stage=h.node('section',{hidden:true}), footer=h.node('div',{class:'modal-actions'}), cancel=h.node('button',{type:'button'},'Zatvori');
  footer.append(cancel);stage.append(footer);h.dialog.append(stage);h.enhance(h.dialog);const generated=h.dialog.querySelector('.mer-generated-footer');assert.ok(generated);assert.equal(generated.hidden,false);
  stage.hidden=false;h.enhance(h.dialog);assert.equal(generated.hidden,true);assert.equal(cancel.hasAttribute('data-footer-left'),true);
  stage.hidden=true;h.enhance(h.dialog);assert.equal(generated.hidden,false);assert.equal(h.dialog.querySelectorAll('.mer-generated-footer').length,1);
});

test('cycle 1: authentication locks and tour hosts are unchanged and gain no dismiss controls',()=>{
  for(const name of ['enterprise-lock-dialog','tour-modal-host']){
    const h=harness();h.dialog.classList.add(name);const before=snapshot(h.dialog),count=h.document.created.length;h.enhance(h.dialog);
    assert.deepEqual(snapshot(h.dialog),before);assert.equal(h.document.created.length,count);
  }
  const h=harness();h.close.remove();h.enhance(h.dialog);assert.equal(h.dialog.querySelector('.mer-generated-footer'),null,'a dialog without a close path must not invent one');
});

test('cycle 1: nested dialogs and settings body action groups are not normalized as outer footer rows',()=>{
  const h=harness(), settings=h.node('div',{class:'settings-modal-body'}), settingsActions=h.node('div',{class:'modal-actions'}), settingsCancel=h.node('button',{type:'button'},'Otkaži'), nested=h.node('dialog'), nestedFooter=h.node('footer',{class:'receipt-footer'}), nestedBack=h.node('button',{id:'receiptBack',type:'button'},'Natrag');
  settingsActions.append(settingsCancel);settings.append(settingsActions);nestedFooter.append(nestedBack);nested.append(nestedFooter);h.dialog.append(settings,nested);h.enhance(h.dialog);
  assert.equal(settingsActions.classList.contains('mer-modal-footer'),false);assert.equal(settingsCancel.hasAttribute('data-footer-left'),false);assert.equal(nestedFooter.classList.contains('mer-modal-footer'),false);assert.equal(nestedBack.parentElement,nestedFooter);assert.ok(h.dialog.querySelector(':scope > .mer-generated-footer'));
});

test('cycle 1: mobile footer row and content-sized primary group outrank legacy stacked modal rules',()=>{
  const standard=fs.readFileSync(require.resolve('../modal-footer.css'),'utf8'),legacy=fs.readFileSync(require.resolve('../styles.css'),'utf8');
  const rule=(source,selector)=>{
    const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const body=source.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([^}]*)\\}`));
    assert.ok(body,`Missing layout rule ${selector}`);return body[1];
  };
  // These selectors contain only type/class selectors, so their cascade weights are exact.
  const specificity=selector=>{
    assert.match(selector,/^[a-zA-Z0-9_.\s-]+$/,'extend the calculator if selectors gain IDs, attributes or pseudo-classes');
    const classes=selector.match(/\.[\w-]+/g)||[],types=selector.replace(/\.[\w-]+/g,'').trim().split(/\s+/).filter(Boolean);
    return [0,classes.length,types.length];
  };
  const outranks=(winner,loser)=>{const a=specificity(winner),b=specificity(loser);for(let index=0;index<3;index++)if(a[index]!==b[index])return a[index]>b[index];return false;};
  const rowSelector='html body dialog.mer-footer-standard .mer-modal-footer',stackSelector='.modal-actions.split-actions';
  assert.match(rule(legacy,stackSelector),/flex-direction\s*:\s*column\s*;/);
  assert.match(rule(standard,rowSelector),/flex-direction\s*:\s*row\s*;/);
  assert.deepEqual(specificity(rowSelector),[0,2,3]);assert.deepEqual(specificity(stackSelector),[0,2,0]);
  assert.equal(outranks(rowSelector,stackSelector),true,'the mobile legacy column rule must not override footer row placement');
  const groupSelector='html body dialog .mer-modal-footer .modal-primary-actions',group=rule(standard,groupSelector);
  assert.match(group,/display\s*:\s*flex\s*;/);assert.match(group,/width\s*:\s*max-content\s*;/);assert.match(group,/flex\s*:\s*0\s+1\s+max-content\s*;/);
  assert.equal(outranks(groupSelector,'.modal-primary-actions'),true,'the primary group must override legacy full-width grid sizing');
});
