'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const assistant=require('../assistant-core.js');
const transaction={id:'call-tx',name:'add_transaction',arguments:{amount:15,merchant:'Konzum',category:'Hrana',type:'expense'}};
const goal={id:'call-goal',name:'create_savings_goal',arguments:{goal_name:'Novi auto',target_amount:5000}};
const navigation={id:'call-nav',name:'navigate_view',arguments:{target_page:'stednja'}};

test('OpenAI actions: only valid whitelisted function arguments reach form preparation',()=>{
  assert.deepEqual(assistant.sanitizeActions([transaction,goal,navigation]),[transaction,goal,navigation]);
  for(const value of [0,-1,Infinity,NaN,'15',1000000000,15.123])assert.equal(assistant.sanitizeActions([{...transaction,arguments:{...transaction.arguments,amount:value}}]).length,0);
  for(const target_page of ['https://evil.example','__proto__','constructor','settings'])assert.equal(assistant.sanitizeActions([{...navigation,arguments:{target_page}}]).length,0);
  assert.equal(assistant.sanitizeActions([{...goal,arguments:{goal_name:'x'.repeat(41),target_amount:5000}}]).length,0);
  assert.equal(assistant.sanitizeActions([{...transaction,name:'delete_account'}, {...transaction,arguments:null}]).length,0);
  assert.equal(assistant.sanitizeActions([transaction,transaction]).length,1);
  assert.equal(assistant.sanitizeActions([{...transaction,id:'a'.repeat(120)}]).length,1);
  assert.equal(assistant.sanitizeActions([{...transaction,id:'a'.repeat(121)}]).length,0);
  assert.equal(assistant.prepareAction({name:'run_code'},{}),null);
  assert.equal(assistant.sanitizeActions([{...transaction,arguments:{...transaction.arguments,category:''}}]).length,1,'unknown category stays a draft for manual selection');
});

test('OpenAI actions: categories resolve only within the active profile and matching transaction type',()=>{
  const context={currency:'EUR',referenceDate:'2026-09-17',categories:[{id:'food',name:'Hrana i restorani',type:'expense'},{id:'salary',name:'Plaća',type:'income'}]};
  assert.deepEqual(assistant.prepareAction(transaction,context),{kind:'transaction',draft:{amount:15,merchant:'Konzum',categoryId:'food',type:'expense',date:'2026-09-17',currency:'EUR'}});
  assert.equal(assistant.prepareAction(transaction,{...context,categories:[{id:'food',name:'Hrana',type:'income'}]}).draft.categoryId,null);
  assert.equal(assistant.prepareAction(transaction,{...context,categories:[{id:'a',name:'Hrana doma',type:'expense'},{id:'b',name:'Hrana vani',type:'expense'}]}).draft.categoryId,null,'ambiguous category requires manual selection');
  assert.deepEqual(assistant.prepareAction(goal,context),{kind:'goal',draft:{name:'Novi auto',target:5000,current:0}});
  assert.deepEqual(assistant.prepareAction(navigation,context),{kind:'navigation',view:'savings'});
});

test('OpenAI chat transport: new route, action-only replies and local failures remain explicit',async()=>{
  let url;
  const client=assistant.createAssistantClient({fetchImpl:async(endpoint)=>{url=endpoint;return {ok:true,json:async()=>({id:'reply',message:'',actions:[transaction]})};}});
  const response=await client.ask({messages:[{role:'user',content:'Dodaj transakciju 15 eura u Konzumu za hranu'}]});
  assert.equal(url,'/api/ai/chat');assert.equal(response.source,'remote');assert.equal(response.actions[0].arguments.amount,15);assert.match(response.content,/pripremljena za pregled/);
  const fallback=await assistant.createAssistantClient({fetchImpl:async()=>({ok:false})}).ask({messages:[{role:'user',content:'Dodaj transakciju 15 eura'}]});
  assert.equal(fallback.source,'local');assert.equal(fallback.actions,undefined,'network failure never invents an action');
});

function harness(){
  const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
  const snippet=source.slice(source.indexOf('window.MerAssistantActions=Object.freeze({'),source.indexOf('\nfunction setAssessmentStep'));
  const state={authenticated:true,profileId:'personal',sessionId:'session1',language:'hr',currency:'EUR',referenceDate:'2026-09-17',categories:[{id:'food',name:'Hrana i restorani',type:'expense'}],profile:{transactions:[],goalBuckets:[]}};
  let locked=false,opened='',dialogs=[],applied;const toasts=[];
  const nodes=new Map(['goalNameInput','goalTargetInput','goalCurrentInput','goalPrimaryInput','helpAssistantModal','onboardingTour'].map(id=>['#'+id,{id,value:'',checked:false,hidden:true,open:false}]));
  const window={MerFinancialAssistant:assistant,MerEnterpriseSecurity:{isLocked:()=>locked},MerEngagementBridge:{snapshot:()=>state,applyTransactionDraft:draft=>{applied=draft;}},MerPremiumNavigation:{openGoalEditor:()=>{opened='goal';}},MerAssistantUi:{close(){}}};
  const sandbox={window,currentLang:'hr',$:selector=>nodes.get(selector),$$:()=>dialogs,closeModal:node=>{node.open=false;},showView:view=>{opened=view;},openTransaction:()=>{opened='transaction';},showToast:message=>toasts.push(message),currency:amount=>amount.toFixed(2)+' €'};
  vm.runInNewContext(snippet,sandbox);
  return {api:window.MerAssistantActions,state,nodes,toasts,get opened(){return opened;},get applied(){return applied;},lock:()=>{locked=true;},dialog:id=>{dialogs=[{id}];}};
}

test('OpenAI draft bridge: transaction and savings actions prefill ordinary forms without financial writes',()=>{
  const h=harness(),initial=JSON.stringify(h.state.profile),owner=h.api.owner();
  assert.equal(h.api.execute(transaction,owner).status,'prepared');assert.equal(h.opened,'transaction');assert.equal(h.applied.amount,15);assert.equal(h.applied.categoryId,'food');
  assert.equal(h.api.execute(goal,owner).status,'prepared');assert.equal(h.opened,'goal');assert.equal(h.nodes.get('#goalNameInput').value,'Novi auto');assert.equal(h.nodes.get('#goalTargetInput').value,'5000.00');assert.equal(h.nodes.get('#goalCurrentInput').value,'0');assert.equal(h.nodes.get('#goalPrimaryInput').checked,false);
  assert.equal(JSON.stringify(h.state.profile),initial,'only normal submit handlers can change finances');
  assert.equal(h.api.execute(navigation,owner).status,'navigated');assert.equal(h.opened,'savings');
});

test('OpenAI draft bridge: changed profiles, sessions, locks and existing forms cannot be overwritten',()=>{
  for(const change of ['profileId','sessionId','currency','language']){
    const h=harness(),owner=h.api.owner();h.state[change]='changed';assert.equal(h.api.execute(transaction,owner).status,'expired',change);assert.equal(h.opened,'');
  }
  const locked=harness(),owner=locked.api.owner();locked.lock();assert.equal(locked.api.execute(transaction,owner).status,'expired');
  const form=harness();form.dialog('transactionModal');assert.equal(form.api.execute(transaction,form.api.owner()).status,'deferred');assert.equal(form.opened,'');
  const tour=harness();tour.nodes.get('#onboardingTour').hidden=false;assert.equal(tour.api.execute(goal,tour.api.owner()).status,'deferred');
  const logout=harness();logout.state.authenticated=false;assert.equal(logout.api.execute(goal,'old').status,'expired');
});
