'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../engagement-core.js'),{createHealthHandler,sanitizeHealth}=require('../api/health-advice.js');
const source=fs.readFileSync(require.resolve('../engagement-ui.js'),'utf8');
const analysis={currency:'EUR',score:65,incomeCents:300000,savedCents:20000,bufferMonths:2,shortfallCents:0,categories:[{index:8,name:'SECRET CATEGORY',iban:'HR-PRIVATE',spentCents:15000,limitCents:10000,newLimitCents:15000}]};
async function call(handler,body={consent:true,locale:'hr',analysis},extra={}){const req={method:'POST',headers:{origin:'https://mer.test',host:'mer.test','content-type':'application/json'},body,...extra};const res={headers:{},setHeader(key,value){this.headers[key]=value;},end(value){this.body=JSON.parse(value);}};await handler(req,res);return res;}
class Element{
  constructor(tag,document){this.tagName=tag;this.document=document;this.children=[];this.attributes={};this.dataset={};this.listeners=new Map();this.id='';this.className='';this.hidden=false;this.disabled=false;this.value='';this.open=false;this._text='';this.classList={add:name=>{this.className+=` ${name}`;}};}
  setAttribute(name,value){this.attributes[name]=String(value);if(['id','type','value'].includes(name))this[name]=value;if(name==='class')this.className=value;if(name==='hidden')this.hidden=true;}
  getAttribute(name){return this.attributes[name]??null;}
  append(...nodes){nodes.forEach(node=>{node.parentElement=this;this.children.push(node);});}
  prepend(node){node.parentElement=this;this.children.unshift(node);}
  after(node){node.parentElement=this.parentElement;this.parentElement.children.splice(this.parentElement.children.indexOf(this)+1,0,node);}
  before(node){node.parentElement=this.parentElement;this.parentElement.children.splice(this.parentElement.children.indexOf(this),0,node);}
  get options(){return this.querySelectorAll('option');}
  set textContent(value){this._text=String(value);}
  get textContent(){return this._text;}
  set innerHTML(value){this._html=value;this.children=[];const stack=[this],voids=new Set(['input','br','hr','img','meta','link']);for(const match of value.matchAll(/<(\/?)([a-z][\w-]*)(\s+(?:[^>"']|"[^"]*"|'[^']*')*)?\s*(\/?)>/gi)){const[,closing,tag,raw='',self]=match;if(closing){if(stack.length>1)stack.pop();continue;}const node=new Element(tag,this.document);for(const item of raw.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))node.setAttribute(item[1],item[2]??item[3]??item[4]??'');stack.at(-1).append(node);if(!voids.has(tag)&&!self)stack.push(node);}}
  get innerHTML(){return this._html||'';}
  matches(selector){if(selector.startsWith('#'))return this.id===selector.slice(1);if(selector.startsWith('.'))return this.className.split(/\s+/).includes(selector.slice(1));if(selector==='dialog[open]')return this.tagName==='dialog'&&this.open;if(selector.startsWith('[')){const attrs=[...selector.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)];return attrs.every(([,name,value])=>Object.hasOwn(this.attributes,name)&&(value===undefined||this.attributes[name]===value));}return this.tagName===selector;}
  querySelectorAll(selector){const space=selector.indexOf(' ');if(space>=0){const parent=this.querySelector(selector.slice(0,space));return parent?parent.querySelectorAll(selector.slice(space+1)):[];}const found=[];for(const child of this.children){if(child.matches(selector))found.push(child);found.push(...child.querySelectorAll(selector));}return found;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  addEventListener(type,callback){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(callback);}
  dispatch(type,extra={}){const event={target:this,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...extra};return {event,results:(this.listeners.get(type)||[]).map(callback=>callback(event))};}
  click(){return this.disabled?{results:[]}:this.dispatch('click');}
  showModal(){this.open=true;}
  close(){this.open=false;this.dispatch('close');}
  reportValidity(){return this.type!=='month'||/^\d{4}-(0[1-9]|1[0-2])$/.test(this.value)&&(!this.max||this.value<=this.max);}
}
function harness(){
  const document={tour:false};document.body=new Element('body',document);document.createElement=tag=>new Element(tag,document);document.getElementById=id=>document.body.querySelector(`#${id}`);document.querySelector=selector=>selector.includes('#onboardingTour')?(document.tour?{}:document.body.querySelector('dialog[open]')):document.body.querySelector(selector);
  document.querySelectorAll=selector=>document.body.querySelectorAll(selector);
  document.body.innerHTML='<section id="overviewView"><div class="summary-grid"></div></section><section id="insightsView"><div class="heading-actions"></div></section><section id="activityView"><div class="heading-actions"></div><div id="transactionList"></div></section><dialog id="transactionModal"><form id="transactionForm"><input id="transactionName"><input id="transactionAmount"><select id="transactionCategory"></select><input id="transactionDate"><div id="spendCheck"></div><div class="modal-primary-actions"></div></form></dialog>';
  const profile=id=>({profileId:id,currency:'EUR',bills:500,categories:[{id:'food',name:'SECRET CATEGORY',limit:100},{id:'transport',limit:300}],incomeCategories:[{id:'salary'}],goalBuckets:[{id:'reserve',primary:true,current:1000}],transactions:[{id:`${id}-income`,profileId:id,name:'SECRET EMPLOYER',date:'2026-09-02',amount:3000,type:'income',category:'salary'},{id:`${id}-expense`,profileId:id,name:'SECRET MERCHANT',date:'2026-09-03',amount:150,type:'expense',category:'food'}],savingsEntries:[{id:`${id}-saving`,date:'2026-09-04',amount:200,goalId:'reserve'}]});
  const appState={activeAccount:'personal',settings:{currency:'EUR'},accounts:{personal:profile('personal'),business:profile('business')}};
  let revision=0;const pending=[],timers=[],updates=[],shares=[];
  const window={MerEngagement:E,MerAuthProvider:{currentSession:()=>({userId:'user-1'})}};
  const reactiveStore={getRevision:()=>revision,update(reason,action){updates.push(reason);action(appState);revision++;}};
  const context=vm.createContext({window,document,appState,state:appState.accounts.personal,appReferenceDate:'2026-09-08',activeView:'overview',currentLang:'hr',reactiveStore,renderAll(){},escapeHtml:value=>String(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character])),currency:value=>`${value.toFixed(2)} €`,categoryName:id=>`Category ${id}`,incomeCategoryName:id=>`Income ${id}`,validStoredDate:value=>/^\d{4}-\d{2}-\d{2}$/.test(value),setTransactionType(){},evaluateTransaction(){},showToast(){},openModal(node){for(const other of document.body.querySelectorAll('dialog[open]'))other.close();node.showModal();},closeModal:node=>node.close(),MerRuntime:{bindDialogBackdropDismiss(node,callback){node.dismissBackdrop=callback;}},AbortController,setTimeout:callback=>timers.push(callback),navigator:{clipboard:{writeText:async text=>shares.push(text)}},fetch:(url,options)=>new Promise((resolve,reject)=>pending.push({url,options,resolve,reject}))});
  context.transactionType='expense';
  window.MerExportBridge={snapshot:()=>({profileId:appState.activeAccount,profile:context.state,sessionId:context.sessionId||'session-1',authenticated:context.authenticated!==false,revision,referenceDate:context.appReferenceDate,currency:appState.settings.currency,language:context.currentLang})};
  vm.runInContext(source,context);
  const get=id=>document.getElementById(id),click=id=>Promise.all(get(id).click().results),render=()=>window.MerEngagementUI.render();
  return {context,window,document,appState,updates,pending,timers,shares,get,click,render,bump(){revision++;},switchProfile(id){appState.activeAccount=id;context.state=appState.accounts[id];render();},respond(index=0,message='AI explanation'){pending[index].resolve({ok:true,json:async()=>({source:'gemini',message})});}};
}
async function main(){
  const sanitized=sanitizeHealth({...analysis,name:'Sandro',IBAN:'PRIVATE',transactions:[{secret:'PRIVATE'}]});
  assert.deepEqual(sanitized.categories,[{category:1,spentCents:15000,limitCents:10000,newLimitCents:15000}]);
  assert.ok(!JSON.stringify(sanitized).includes('SECRET'));assert.equal(sanitized.name,undefined);assert.equal(sanitized.transactions,undefined);
  assert.equal(sanitizeHealth({...analysis,score:101}),null);assert.equal(sanitizeHealth({...analysis,shortfallCents:-1}),null,'a shortfall cannot be negative');assert.equal(sanitizeHealth({...analysis,incomeCents:1.1}),null);assert.equal(sanitizeHealth({...analysis,categories:[{spentCents:-1,limitCents:10,newLimitCents:10}]}),null);
  let upstream;
  const handler=createHealthHandler({env:{GEMINI_API_KEY:'server-only-test-key',GEMINI_MODEL:'configured-model'},fetchImpl:async(url,options)=>{upstream={url,options};return {ok:true,status:200,headers:{get:()=>null},text:async()=>JSON.stringify({output_text:'Prijedlog je spreman za pregled.'})};}});
  let res=await call(handler,{analysis,locale:'hr'});assert.equal(res.statusCode,400);assert.equal(res.body.error,'CONSENT_REQUIRED');assert.equal(upstream,undefined);
  res=await call(handler);assert.equal(res.statusCode,200);assert.equal(res.body.source,'gemini');assert.equal(res.body.model,'configured-model');assert.equal(res.headers['Cache-Control'],'no-store');assert.ok(!JSON.stringify(res.body).includes('server-only-test-key'));
  const body=JSON.parse(upstream.options.body);assert.equal(body.store,false);assert.equal(upstream.options.redirect,'error');assert.equal(body.model,'configured-model');assert.ok(!body.input.includes('SECRET'));assert.ok(!body.input.includes('HR-PRIVATE'));assert.match(body.system_instruction,/No action has been performed/);assert.match(body.system_instruction,/Croatian/);
  assert.equal((await call(handler,undefined,{method:'GET'})).statusCode,405);assert.equal((await call(handler,undefined,{headers:{origin:'https://evil.test',host:'mer.test','content-type':'application/json'}})).statusCode,403);assert.equal((await call(handler,undefined,{headers:{origin:'https://mer.test',host:'mer.test','content-type':'text/plain'}})).statusCode,415);
  const unavailable=createHealthHandler({env:{}});assert.equal((await call(unavailable)).statusCode,503);
  {
    const h=harness();await h.click('healthImprove');assert.equal(h.get('financialHealthModal').open,true);assert.match(h.get('healthAiConsent').textContent,/bez imena, IBAN-a/);assert.equal(h.updates.length,0,'opening health does not change limits');
    const pending=h.click('healthAiExplain');assert.equal(h.get('healthAiExplain').disabled,true);const request=JSON.parse(h.pending[0].options.body);assert.equal(request.consent,true);assert.ok(!JSON.stringify(request).includes('SECRET'));h.respond();await pending;assert.equal(h.get('healthAiResponse').textContent,'AI explanation');assert.equal(h.updates.length,0,'AI never applies limits');assert.equal(h.get('healthAiExplain').disabled,false);
    h.get('financialHealthModal').dismissBackdrop();assert.equal(h.get('financialHealthModal').open,false);
    await h.click('healthImprove');assert.equal(h.get('financialHealthModal').dispatch('cancel').event.defaultPrevented,true);assert.equal(h.get('financialHealthModal').open,false);
  }
  for(const mutation of ['close','profile','session','revision','language']){
    const h=harness();await h.click('healthImprove');const pending=h.click('healthAiExplain');
    if(mutation==='close')h.get('financialHealthModal').close();if(mutation==='profile')h.switchProfile('business');if(mutation==='session')h.context.sessionId='s2';if(mutation==='revision')h.bump();if(mutation==='language'){h.context.currentLang='en';h.render();}
    h.respond(0,'STALE_RESPONSE');await pending;assert.notEqual(h.get('healthAiResponse').textContent,'STALE_RESPONSE',`${mutation} invalidates the response`);
  }
  {
    const h=harness();await h.click('healthImprove');const old=h.click('healthAiExplain');h.get('financialHealthModal').close();await h.click('healthImprove');const next=h.click('healthAiExplain');h.respond(1,'Fresh response');await next;
    h.pending[0].resolve({ok:false,json:async()=>({error:'OLD_FAILURE'})});await old;assert.equal(h.get('healthAiResponse').textContent,'Fresh response','an old failed request cannot overwrite the newer explanation');
  }
  {
    const h=harness();await h.click('healthImprove');const before=h.context.state.categories.map(category=>category.limit);
    h.context.state.transactions.push({id:'rapid-edit',profileId:'personal',date:'2026-09-05',type:'expense',category:'food',amount:30});h.bump();await h.click('applyHealthPlan');
    assert.deepEqual(h.context.state.categories.map(category=>category.limit),before,'stale proposals cannot overwrite limits');assert.equal(h.get('applyHealthPlan').disabled,true);
    h.get('financialHealthModal').close();await h.click('healthImprove');await h.click('applyHealthPlan');assert.equal(h.context.state.categories.reduce((sum,category)=>sum+category.limit,0),400);assert.equal(h.appState.accounts.business.categories[0].limit,100,'confirmed rebalance cannot cross profiles');
  }
  {
    const h=harness();await h.click('openFinancialWrapped');assert.equal(h.get('financialWrappedModal').open,true);assert.equal(h.get('wrappedStep').textContent,'1 od 4');assert.equal(h.get('wrappedBack').disabled,true);
    for(let step=2;step<=4;step++){await h.click('wrappedNext');assert.equal(h.get('wrappedStep').textContent,`${step} od 4`);}
    assert.equal(h.get('wrappedNext').textContent,'Završi');await h.click('shareWrapped');assert.equal(h.shares.length,1);assert.ok(!h.shares[0].includes('€'));assert.ok(!h.shares[0].includes('SECRET'));await h.click('wrappedBack');assert.equal(h.get('wrappedStep').textContent,'3 od 4');await h.click('wrappedNext');await h.click('wrappedNext');assert.equal(h.get('financialWrappedModal').open,false);
    await h.click('openFinancialWrapped');h.get('financialWrappedModal').dismissBackdrop();assert.equal(h.get('financialWrappedModal').open,false);
    await h.click('openFinancialWrapped');assert.equal(h.get('financialWrappedModal').dispatch('cancel').event.defaultPrevented,true);assert.equal(h.get('financialWrappedModal').open,false);
    assert.ok(h.updates.every(reason=>reason==='wrapped-seen'));assert.equal(h.appState.accounts.business.engagement,undefined,'seen status is profile-scoped');
  }
  {
    const h=harness();assert.equal(h.timers.length,0,'no automatic wrapped on September 8');h.context.appReferenceDate='2026-10-01';h.document.tour=true;h.render();assert.equal(h.timers.length,0,'an active tour suppresses the automatic story');h.document.tour=false;h.render();assert.equal(h.timers.length,1);
    h.context.activeView='budgets';h.timers.shift()();assert.equal(h.get('financialWrappedModal').open,false,'leaving the dashboard during the delay cancels auto-open');
    h.context.activeView='overview';h.render();h.timers.shift()();assert.equal(h.get('financialWrappedModal').open,true);h.get('financialWrappedModal').close();h.render();assert.equal(h.timers.length,0,'completion marker prevents repeat automatic launches');
  }
  {
    const h=harness();h.context.appReferenceDate='2026-10-01';h.render();h.document.tour=true;h.timers.shift()();assert.equal(h.get('financialWrappedModal').open,false,'a tour starting after scheduling still cancels auto-open');
    h.document.tour=false;h.context.authenticated=false;h.render();assert.equal(h.timers.length,0,'signed-out state never schedules a story');
  }
  process.stdout.write('Engagement cycle 2 passed: sanitized/consented health API, configured model, stale response guards, four wrapped steps, safe sharing, Escape/backdrop, first-day dashboard and tour gates.\n');
}
main().catch(error=>{process.stderr.write(`${error.stack}\n`);process.exitCode=1;});
