'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Vault=require('../vault-core.js');
const memory=()=>{const data=new Map();return{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};};
class Element {
  constructor(){this.children=new Map();this.open=false;this.listeners={};this.classList={add(){},remove(){},toggle(){},contains(){return false;}};}
  setAttribute(){} removeAttribute(){} appendChild(){} focus(){} remove(){}
  querySelector(selector){if(!this.children.has(selector))this.children.set(selector,new Element());return this.children.get(selector);}
  querySelectorAll(){return[];} addEventListener(name,handler){this.listeners[name]=handler;}
  showModal(){this.open=true;}close(){this.open=false;}
}
async function run(){
  const localStorage=memory(),sessionStorage=memory(),body=new Element(),shell=new Element(),created=[];
  const document={body,createElement:()=>{const element=new Element();created.push(element);return element;},getElementById:()=>shell,querySelectorAll:()=>[],addEventListener(){}};
  const root={localStorage,sessionStorage,MerVault:Vault,MerRuntime:{report(){}},addEventListener(){},dispatchEvent(){},setInterval(){},isSecureContext:false};
  const context=vm.createContext({window:root,document,navigator:{},structuredClone,CustomEvent:class{constructor(name,options){this.name=name;this.detail=options?.detail;}},requestAnimationFrame:callback=>callback(),setTimeout,Blob,URL,atob,btoa,crypto:require('node:crypto').webcrypto});
  vm.runInContext(fs.readFileSync(require.resolve('../security-enterprise.js'),'utf8'),context);
  let state={accounts:{personal:{transactions:[{id:'legacy',amount:15}]},business:{transactions:[{id:'legacy-b',amount:20}]}},language:'hr'};
  state.mfa={enabled:true,secret:'existing-a-mfa'};state.mfaByUser={'registered-a':state.mfa};state.mfaLegacyOwner='registered-a';
  localStorage.setItem('mer-auth-users-v1',JSON.stringify([{id:'registered-a'}]));
  localStorage.setItem('mer-money-v6',JSON.stringify(state));
  await root.MerEnterpriseSecurity.persist({shouldNotPersist:true});assert.equal(localStorage.getItem('mer-money-v6'),JSON.stringify(state));
  const fresh=()=>({accounts:{personal:{transactions:[]},business:{transactions:[]}},language:'hr'});
  root.MerEnterpriseSecurity.init({storage:localStorage,sessionStorage,getState:()=>state,replaceState:snapshot=>{state=structuredClone(snapshot);},freshState:fresh});
  const demo={userId:'demo-user',demo:true,issuedAt:Date.now()};await root.MerEnterpriseSecurity.beforeEnter(demo);
  assert.equal(state.accounts.personal.transactions[0].id,'legacy');assert.equal(localStorage.getItem('mer-money-v6'),null,'Migration removes unscoped legacy after successful user-scoped save');
  assert.equal(JSON.stringify(state).includes('existing-a-mfa'),false,'Demo never inherits another registered user MFA');
  assert.equal(JSON.parse(localStorage.getItem('mer-cache-v1:registered-a')).mfa.secret,'existing-a-mfa','Retiring shared legacy preserves the other user enrollment in their own migration cache');
  state.accounts.personal.transactions.push({id:'demo-only',amount:22});await root.MerEnterpriseSecurity.persist(state);await root.MerEnterpriseSecurity.onLogout();
  await root.MerEnterpriseSecurity.beforeEnter({userId:'registered-a',demo:false,issuedAt:Date.now()},'Private owner A password');
  assert.equal(state.accounts.personal.transactions.length,0,'New user cannot inherit demo data');
  assert.equal(state.mfa.secret,'existing-a-mfa','Owner MFA survives encrypted migration');
  state.accounts.personal.transactions.push({id:'a-only',amount:200});state.accounts.business.transactions.push({id:'a-biz',amount:300});await root.MerEnterpriseSecurity.persist(state);
  assert.equal(localStorage.getItem('mer-cache-v1:registered-a'),null);assert.equal(root.MerEnterpriseSecurity.status().encrypted,true);await root.MerEnterpriseSecurity.onLogout();
  await root.MerEnterpriseSecurity.beforeEnter({userId:'registered-b',demo:false,issuedAt:Date.now()},'Private owner B password');assert.equal(state.accounts.personal.transactions.length,0,'User A never bleeds into B');await root.MerEnterpriseSecurity.onLogout();
  await root.MerEnterpriseSecurity.beforeEnter({userId:'registered-a',demo:false,issuedAt:Date.now()},'Private owner A password');assert.equal(state.accounts.personal.transactions[0].id,'a-only');assert.equal(state.accounts.business.transactions[0].id,'a-biz');
  root.MerAuthProvider={currentSession:()=>({userId:'registered-a'})};await root.MerEnterpriseSecurity.lock();assert.equal(root.MerEnterpriseSecurity.isLocked(),true);
  state.accounts.personal.transactions.push({id:'completed-while-locked',amount:8});assert.equal(await root.MerEnterpriseSecurity.persist(state),false);
  created[0].querySelector('#enterpriseUnlockInput').value='Private owner A password';await created[0].querySelector('form').listeners.submit({preventDefault(){}});
  assert.equal(root.MerEnterpriseSecurity.isLocked(),false);assert.equal(state.accounts.personal.transactions.at(-1).id,'completed-while-locked','Idle unlock must not replace newer in-memory state with stale ciphertext');await root.MerEnterpriseSecurity.persist(state);await root.MerEnterpriseSecurity.onLogout();
  await root.MerEnterpriseSecurity.beforeEnter(demo);assert.equal(state.accounts.personal.transactions.at(-1).id,'demo-only');
  const handlers={},cached=new Map([['/index.html',new Response('<html>offline shell</html>')]]);
  const swContext=vm.createContext({self:{location:{origin:'https://mer.example'},addEventListener:(name,callback)=>{handlers[name]=callback;},clients:{claim:async()=>{}}},URL,Response,fetch:async()=>{throw new Error('offline');},caches:{match:async key=>cached.get(key)?.clone(),open:async()=>({match:async key=>cached.get(key)?.clone()}),keys:async()=>[]}});
  vm.runInContext(fs.readFileSync(require.resolve('../service-worker.js'),'utf8'),swContext);
  let responsePromise=null;
  handlers.fetch({request:{method:'GET',url:'https://mer.example/api/assistant',headers:new Headers(),mode:'cors'},respondWith:value=>{responsePromise=value;}});assert.equal(responsePromise,null,'API bypasses cache');
  handlers.fetch({request:{method:'GET',url:'https://other.example/app.js',headers:new Headers(),mode:'cors'},respondWith:value=>{responsePromise=value;}});assert.equal(responsePromise,null,'Cross-origin bypasses cache');
  handlers.fetch({request:{method:'GET',url:'https://mer.example/',headers:new Headers({'Authorization':'Bearer secret'}),mode:'navigate'},respondWith:value=>{responsePromise=value;}});assert.equal(responsePromise,null,'Credential-bearing request bypasses cache');
  handlers.fetch({request:{method:'GET',url:'https://mer.example/',headers:new Headers(),mode:'navigate'},respondWith:value=>{responsePromise=value;}});assert.match(await(await responsePromise).text(),/offline shell/);
  const manifest=JSON.parse(fs.readFileSync(require.resolve('../manifest.webmanifest'),'utf8'));assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'/');assert.equal(manifest.icons.length>0,true);
  const integrationSource=fs.readFileSync(require.resolve('../enterprise-ui.js'),'utf8'),methodStart=integrationSource.indexOf('    replaceState(snapshot) {'),methodEnd=integrationSource.indexOf('    onError:',methodStart);
  assert.ok(methodStart>=0&&methodEnd>methodStart);
  const original={accounts:{personal:{transactions:[{id:'keep-personal',amount:12}]},business:{transactions:[{id:'keep-business',amount:34}]}},settings:{currency:'EUR',hideBalances:true},language:'hr',theme:'dark'};
  let deactivated=0;
  const integration=vm.createContext({structuredClone,currentLang:'en',currentTheme:'light',personalDefaults:{},businessDefaults:{},normalizeProfile:profile=>structuredClone(profile),normalizeAppSettings:settings=>({...settings}),MerSecurity:{createMfaMethodState:value=>({enabled:false,...value})},window:{MerMfaState:{deactivate(){deactivated++;}}},reactiveStore:{update:(_,mutation)=>mutation(original)},applyStaticTranslations(){}});
  const replace=vm.runInContext(`({${integrationSource.slice(methodStart,methodEnd).trim().replace(/,$/,'')}}).replaceState`,integration);
  replace(original);assert.equal(original.settings.currency,'EUR');assert.equal(original.settings.hideBalances,true);assert.equal(original.accounts.personal.transactions[0].id,'keep-personal');assert.equal(original.accounts.business.transactions[0].id,'keep-business');assert.ok(original.mfaByUser);assert.equal(deactivated,1,'Old MFA mapping deactivates before snapshot replacement');
  process.stdout.write('PASS enterprise security cycle 2: legacy migration, registered/demo/user isolation, encrypted reload, offline shell and API cache exclusion.\n');
}
run().catch(error=>{process.stderr.write(`${error.stack}\n`);process.exitCode=1;});
