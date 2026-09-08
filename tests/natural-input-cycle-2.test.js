'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),N=require('../natural-input-core.js');
const source=fs.readFileSync(require.resolve('../natural-input-ui.js'),'utf8'),css=fs.readFileSync(require.resolve('../natural-input-ui.css'),'utf8');
class Element{
  constructor(tag,document){this.tagName=tag;this.document=document;this.children=[];this.attributes={};this.listeners=new Map();this.id='';this.className='';this.hidden=false;this.disabled=false;this.checked=false;this.value='';this.open=false;this.classList={toggle:(name,on)=>{const names=new Set(this.className.split(/\s+/));if(on)names.add(name);else names.delete(name);this.className=[...names].join(' ');}};}
  setAttribute(name,value){this.attributes[name]=String(value);if(['id','type','value'].includes(name))this[name]=value;if(name==='class')this.className=value;if(name==='hidden')this.hidden=true;}
  getAttribute(name){return this.attributes[name]??null;}
  append(...nodes){nodes.forEach(node=>{node.parentElement=this;this.children.push(node);});}
  insertBefore(node,target){node.parentElement=this;const index=this.children.indexOf(target);if(index<0)this.children.push(node);else this.children.splice(index,0,node);}
  set innerHTML(value){this._html=value;this.children=[];const stack=[this],voids=new Set(['input','br','hr','img','meta','link']);for(const match of value.matchAll(/<(\/?)([a-z][\w-]*)(\s+(?:[^>"']|"[^"]*"|'[^']*')*)?\s*(\/?)>/gi)){const[,closing,tag,raw='',self]=match;if(closing){if(stack.length>1)stack.pop();continue;}const node=new Element(tag,this.document);for(const item of raw.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))node.setAttribute(item[1],item[2]??item[3]??item[4]??'');stack.at(-1).append(node);if(!voids.has(tag)&&!self)stack.push(node);}}
  get innerHTML(){return this._html||'';}
  matches(selector){if(selector.startsWith('#'))return this.id===selector.slice(1);if(selector.startsWith('[')){const attrs=[...selector.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)];return attrs.every(([,name,value])=>Object.hasOwn(this.attributes,name)&&(value===undefined||this.attributes[name]===value));}return this.tagName===selector;}
  querySelectorAll(selector){const found=[];for(const child of this.children){if(child.matches(selector))found.push(child);found.push(...child.querySelectorAll(selector));}return found;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  addEventListener(type,callback){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(callback);}
  dispatch(type,event={}){return(this.listeners.get(type)||[]).map(callback=>callback({target:this,...event}));}
  click(){if(this.disabled)return[];this.focus();return this.dispatch('click');}
  focus(){this.document.activeElement=this;}
  close(){this.open=false;this.dispatch('close');}
}
function harness({fetchImpl,speech}={}){
  const document={activeElement:null};document.body=new Element('body',document);document.createElement=tag=>new Element(tag,document);document.getElementById=id=>document.body.querySelector(`#${id}`);
  const dialog=document.createElement('dialog');dialog.id='transactionModal';dialog.open=true;dialog.innerHTML='<form id="transactionForm"><button type="button" data-transaction-type="expense" aria-pressed="true"></button><input id="transactionName"><input id="transactionAmount"><select id="transactionCategory"></select><input id="transactionDate"></form>';document.body.append(dialog);
  const state={profileId:'personal',sessionId:'s1',authenticated:true,revision:1,referenceDate:'2026-03-01',language:'hr',currency:'EUR',profile:{transactions:[]},categories:[{id:'food',name:'Hrana',type:'expense'},{id:'salary',name:'Plaća',type:'income'}]};
  const applied=[],requests=[];let locked=false;
  const window={document,MerNaturalInput:N,MerEnterpriseSecurity:{isLocked:()=>locked},SpeechRecognition:speech,addEventListener(){},MerEngagementBridge:{snapshot:()=>state,applyTransactionDraft(draft){applied.push(draft);return true;}}};
  const context=vm.createContext({window,document,AbortController,setTimeout,clearTimeout,fetch:async(...args)=>{requests.push(args);return fetchImpl?fetchImpl(...args):{ok:true,text:async()=>JSON.stringify({source:'gemini',draft:{amount:35.5,merchant:'Konzum',categoryId:'food',type:'expense',date:'2026-02-28',currency:'EUR'}})};}});
  vm.runInContext(source,context);window.MerNaturalInputUI.init();window.MerNaturalInputUI.reset();
  const get=id=>document.getElementById(id),click=async id=>Promise.all(get(id).click()),text=value=>{get('naturalInputText').value=value;get('naturalInputText').dispatch('input');};
  return {window,state,document,dialog,applied,requests,get,click,text,ui:window.MerNaturalInputUI,lock(){locked=true;window.MerNaturalInputUI.render();}};
}
async function main(){
  {
    const h=harness();assert.equal(h.get('naturalInputBody').hidden,true);assert.equal(h.get('naturalConsent').checked,false);
    assert.equal(h.get('naturalInputToggle').getAttribute('aria-label'),'Unesi rečenicom');
    assert.equal(h.get('naturalInputText').tagName,'input','sentence input stays a single line');
    assert.equal(h.get('naturalInputText').getAttribute('type'),'text');
    assert.equal(h.get('naturalInputText').getAttribute('maxlength'),'600');
    assert.ok(h.get('naturalInputToggle').querySelector('svg'),'compact trigger uses vector icon, not a second full-width toolbar');
    await h.click('naturalInputToggle');h.text('Jučer sam potrošio 35,50 eura u Konzumu');await h.click('naturalInputAI');assert.equal(h.requests.length,0);assert.equal(h.applied.length,0);assert.match(h.get('naturalInputStatus').textContent,/potvrdite slanje/);
    assert.ok(h.dialog.className.includes('is-natural-input-open'),'progressive input replaces the full manual form instead of stacking');
    await h.click('naturalInputLocal');assert.equal(h.requests.length,0);assert.equal(h.applied[0].amount,35.5);assert.equal(h.applied[0].date,'2026-02-28');assert.equal(h.state.profile.transactions.length,0,'only draft fields are filled; finances never saved');assert.match(h.get('naturalInputStatus').textContent,/Lokalni prijedlog/);
    assert.equal(h.get('naturalInputBody').hidden,true,'successful fill returns to manual review');assert.ok(!h.dialog.className.includes('is-natural-input-open'));assert.equal(h.document.activeElement,h.get('transactionAmount'));
    h.get('naturalConsent').checked=true;await h.click('naturalInputAI');assert.equal(h.requests.length,1);assert.equal(h.applied.length,2);assert.match(h.get('naturalInputStatus').textContent,/Gemini prijedlog/);
    const body=JSON.parse(h.requests[0][1].body);assert.equal(body.consent,true);assert.equal(body.profile,undefined);assert.equal(body.transactions,undefined);assert.equal(body.sessionId,undefined);assert.equal(body.text,'Jučer sam potrošio 35,50 eura u Konzumu');
    h.text('U Konzumu');await h.click('naturalInputLocal');assert.equal(h.applied.length,2);assert.match(h.get('naturalInputStatus').textContent,/Iznos nije jasan/);
    h.text('10 USD u Konzumu');await h.click('naturalInputLocal');assert.equal(h.applied.length,2);assert.match(h.get('naturalInputStatus').textContent,/druga valuta/);
    h.text('10 eura u Konzumu 31.2.2026.');await h.click('naturalInputLocal');assert.equal(h.applied.length,2);assert.match(h.get('naturalInputStatus').textContent,/Datum ili vrsta/);
    h.window.MerEngagementBridge.applyTransactionDraft=()=>{throw new Error('closed');};h.text('10 eura u Konzumu');await h.click('naturalInputLocal');assert.match(h.get('naturalInputStatus').textContent,/Obrazac se promijenio/);
  }
  {
    const h=harness();h.get('transactionName').value='Moja kupnja';h.get('transactionAmount').value='12.50';
    await h.click('naturalInputToggle');h.text('35 eura u Konzumu');await h.click('naturalInputBack');
    assert.equal(h.get('naturalInputBody').hidden,true);assert.equal(h.get('naturalInputToggle').getAttribute('aria-expanded'),'false');
    assert.equal(h.get('transactionName').value,'Moja kupnja');assert.equal(h.get('transactionAmount').value,'12.50','back preserves unsaved manual state');
    assert.equal(h.document.activeElement,h.get('naturalInputToggle'));assert.equal(h.requests.length,0);assert.equal(h.applied.length,0);
    await h.click('naturalInputToggle');assert.equal(h.get('naturalInputText').value,'35 eura u Konzumu','toggle preserves the sentence draft');
    h.dialog.close();assert.equal(h.get('naturalInputText').value,'');assert.ok(!h.dialog.className.includes('is-natural-input-open'),'dialog close clears progressive view state');
  }
  {
    const h=harness({fetchImpl:async()=>({ok:false,status:503})});h.text('35 eura u Konzumu');h.get('naturalConsent').checked=true;await h.click('naturalInputAI');assert.equal(h.applied[0].amount,35);assert.match(h.get('naturalInputStatus').textContent,/Gemini nije dostupan.*lokalni prijedlog/);
    assert.equal(h.get('naturalInputAI').disabled,false);
  }
  for(const mutation of ['close','back','profile','session','form','text','revision','locked','logout','withdraw-consent']){
    let finish;const h=harness({fetchImpl:()=>new Promise(resolve=>{finish=resolve;})});h.text('35 eura u Konzumu');h.get('naturalConsent').checked=true;const pending=h.click('naturalInputAI');
    if(mutation==='close')h.dialog.close();if(mutation==='back')await h.click('naturalInputBack');if(mutation==='profile'){h.state.profileId='business';h.ui.render();}if(mutation==='session')h.state.sessionId='s2';if(mutation==='form')h.get('transactionAmount').value='99';if(mutation==='text')h.text('New text');if(mutation==='revision')h.state.revision++;if(mutation==='locked')h.lock();if(mutation==='logout')h.state.authenticated=false;if(mutation==='withdraw-consent'){h.get('naturalConsent').checked=false;h.get('naturalConsent').dispatch('change');}
    finish({ok:true,text:async()=>JSON.stringify({source:'gemini',draft:{amount:35,merchant:'Konzum',categoryId:'food',type:'expense',date:'2026-03-01',currency:'EUR'}})});await pending;assert.equal(h.applied.length,0,`${mutation} prevents stale draft application`);
  }
  {
    const h=harness();await h.click('naturalMic');assert.match(h.get('naturalInputStatus').textContent,/ne podržava glasovni/);assert.equal(h.document.activeElement,h.get('naturalInputText'));assert.equal(h.requests.length,0);
    let instance;class Speech{constructor(){instance=this;}start(){}stop(){this.onend?.();}abort(){this.aborted=true;}}
    const s=harness({speech:Speech});await s.click('naturalMic');assert.equal(instance.lang,'hr-HR');assert.equal(s.get('naturalMic').getAttribute('aria-pressed'),'true');
    instance.onresult({results:[[{transcript:'35 eura u Konzumu'}]]});instance.onend();assert.equal(s.get('naturalInputText').value,'35 eura u Konzumu');assert.equal(s.requests.length,0,'speech transcription does not automatically upload to Gemini');assert.equal(s.applied.length,0,'speech is reviewed before filling');
    await s.click('naturalMic');instance.onerror({error:'not-allowed'});instance.onend();assert.match(s.get('naturalInputStatus').textContent,/nije dopušten/);
    await s.click('naturalMic');await s.click('naturalMic');assert.match(s.get('naturalInputStatus').textContent,/zaustavljen/);assert.equal(s.get('naturalMic').getAttribute('aria-pressed'),'false');
    await s.click('naturalMic');s.dialog.close();assert.equal(instance.aborted,true);assert.equal(instance.onresult,null);assert.equal(s.get('naturalInputText').value,'');
  }
  assert.match(css,/font-size:16px/);assert.match(css,/min-height:44px/);assert.match(css,/#transactionModal\{[^}]*overflow:hidden/);assert.match(css,/#transactionModal\.is-natural-input-open #transactionForm[^}]*display:none/);assert.doesNotMatch(css,/appearance:auto|overflow-y:auto|resize:vertical/);assert.match(source,/type="button"/);assert.doesNotMatch(source,/localStorage|apiKey|GEMINI_API_KEY|requestSubmit\(|\.submit\(/);
  process.stdout.write('Natural input cycle 2 passed: explicit consent, draft-only apply, honest fallback, stale request rejection, speech denial/unsupported/close, and safe typed entry.\n');
}
main().catch(error=>{process.stderr.write(`${error.stack}\n`);process.exitCode=1;});
