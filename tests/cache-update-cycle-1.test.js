'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const workerSource = fs.readFileSync(require.resolve('../service-worker.js'),'utf8');
const clientSource = fs.readFileSync(require.resolve('../app-update.js'),'utf8');
const origin = 'https://mer.example';
const tick = async()=>{for(let index=0;index<8;index++)await Promise.resolve();};

function workerHarness(source=workerSource){
  const handlers={}, stores=new Map(), calls=[], deleted=[];
  let skipped=0,claimed=0,offline=false;
  const manifest=['/index.html','/app.min.js?v=release-b','/styles.min.css?v=css-b','/assets/mer-mark-full-color.svg?v=brand-b','/auth-ui.min.js?v=auth-b',
    '/api/user.js','/auth/session.js','/userdata/private.js','/index.html?token=private','https://other.example/app.js','/.env'];
  const keyOf=value=>typeof value==='string'?new URL(value,origin).href:value.url;
  const getStore=name=>{if(!stores.has(name))stores.set(name,new Map());return stores.get(name);};
  const context=vm.createContext({
    self:{location:{origin},addEventListener:(name,callback)=>{handlers[name]=callback;},
      clients:{claim:async()=>{claimed++;},get:async id=>id==='tab'?{id,type:'window',url:origin+'/'}:id==='foreign'?{id,type:'window',url:'https://elsewhere.example/'}:null},
      skipWaiting:async()=>{skipped++;}},URL,Response,
    fetch:async(request,options)=>{
      const key=keyOf(request);calls.push({url:key,options});
      if(offline)throw new Error('OFFLINE');
      if(key===origin+'/sw-assets.json')return new Response(JSON.stringify(manifest));
      if(key===origin+'/')return new Response('<html>current shell</html>');
      return new Response('current asset: '+key);
    },
    caches:{
      open:async name=>({match:async request=>getStore(name).get(keyOf(request))?.clone(),put:async(request,response)=>getStore(name).set(keyOf(request),response.clone())}),
      keys:async()=>[...stores.keys()],delete:async name=>{deleted.push(name);return stores.delete(name);},
      match:()=>{throw new Error('Global cache lookup is forbidden');}
    }
  });
  vm.runInContext(source,context);
  const cacheName=vm.runInContext('CACHE',context);
  const dispatch=async(name,details={})=>{let promise=null;handlers[name]({...details,waitUntil:value=>{promise=value;}});if(promise)await promise;};
  const request=async(url,details={})=>{
    let promise=null;
    handlers.fetch({request:{url:new URL(url,origin).href,method:'GET',mode:'cors',headers:new Headers(),...details},respondWith:value=>{promise=value;}});
    return promise ? await promise : null;
  };
  return{dispatch,request,stores,calls,deleted,cacheName,keyOf,getStore,setOffline:value=>{offline=value;},skipped:()=>skipped,claimed:()=>claimed};
}
class Events {
  constructor(){this.listeners=new Map();}
  addEventListener(name,handler){if(!this.listeners.has(name))this.listeners.set(name,[]);this.listeners.get(name).push(handler);}
  dispatch(name,event={}){for(const handler of this.listeners.get(name)||[])handler(event);}
}
class Element extends Events {
  constructor(tag){super();this.tagName=tag;this.children=[];this.attributes={};this.hidden=false;this.disabled=false;this.textContent='';this.lang='hr';}
  setAttribute(name,value){this.attributes[name]=value;}
  append(...children){this.children.push(...children);}
  appendChild(child){this.children.push(child);return child;}
  querySelector(tag){return this.children.find(child=>child.tagName===tag)||null;}
}
function clientHarness({readyState='complete',hasController=true,waiting=true}={}){
  let now=1000000,reloads=0,registers=0,updates=0,registeredOptions=null;
  const timers=new Map(),messages=[];
  const oldWorker={state:'activated'};
  const nextWorker=Object.assign(new Events(),{state:'installed',postMessage:value=>messages.push(value)});
  const registration=Object.assign(new Events(),{installing:null,waiting:waiting?nextWorker:null,update:async()=>{updates++;}});
  const serviceWorker=Object.assign(new Events(),{controller:hasController?oldWorker:null,register:async(url,options)=>{assert.equal(url,'/service-worker.js');registeredOptions=options;registers++;return registration;}});
  const document=Object.assign(new Events(),{readyState,visibilityState:'visible',body:new Element('body'),documentElement:new Element('html'),createElement:tag=>new Element(tag)});
  const root=Object.assign(new Events(),{isSecureContext:true,location:{reload(){reloads++;}},setTimeout:callback=>{const id=Symbol('timer');timers.set(id,callback);return id;},clearTimeout:id=>timers.delete(id)});
  const navigator={serviceWorker,onLine:true};
  const context=vm.createContext({window:root,document,navigator,Date:{now:()=>now}});
  vm.runInContext(clientSource,context);
  const banner=()=>document.body.children[0];
  const click=()=>banner().querySelector('div').children[0].dispatch('click');
  const later=()=>banner().querySelector('div').children[1].dispatch('click');
  const changeController=()=>{serviceWorker.controller=nextWorker;nextWorker.state='activated';registration.waiting=null;serviceWorker.dispatch('controllerchange');};
  return{root,document,navigator,context,registration,nextWorker,serviceWorker,timers,messages,banner,click,later,changeController,
    advance:ms=>{now+=ms;},reloads:()=>reloads,registers:()=>registers,updates:()=>updates,options:()=>registeredOptions};
}
async function run(){
  const worker=workerHarness();
  worker.getStore('mer-shell-old').set(worker.keyOf('/index.html'),new Response('stale shell'));
  worker.getStore('other-app-cache').set(worker.keyOf('/unrelated'),new Response('unrelated'));
  await worker.dispatch('install');
  assert.equal(worker.skipped(),0,'Installing an update must not activate it over open forms');
  assert.equal(worker.calls.some(call=>call.url===origin+'/index.html'),false,'Precache must fetch canonical / to avoid cleanUrls redirects offline');
  for(const call of worker.calls)assert.equal(call.options.credentials,'omit','Precache never sends account cookies');
  const keys=[...worker.getStore(worker.cacheName).keys()];
  assert.ok(keys.includes(origin+'/app.min.js?v=release-b'),'Version query is part of cache identity');
  assert.equal(keys.some(key=>/\/api\/|\/auth\/|\/userdata\/|token=|other\.example|\.env/.test(key)),false,'Only public shell files enter cache');
  const before=worker.calls.length;
  assert.match(await(await worker.request('/app.min.js?v=release-b')).text(),/current asset/);
  assert.equal(worker.calls.length,before,'Exact build URL serves cached shell');
  await worker.request('/app.min.js?v=release-c');
  assert.equal(worker.calls.length,before+1,'Different build queries never reuse stale asset bytes');
  assert.equal(worker.getStore(worker.cacheName).has(origin+'/app.min.js?v=release-c'),false,'Runtime fetches are never written to cache');
  for(const url of ['/api','/api/account.js','/auth/callback','/userdata/export.js','/.env','/?code=private','https://other.example/app.js']){
    assert.equal(await worker.request(url),null,`Private or nonstatic request bypasses worker: ${url}`);
  }
  assert.equal(await worker.request('/app.min.js',{headers:new Headers({Authorization:'Bearer private'})}),null);
  assert.equal(await worker.request('/',{method:'POST',mode:'navigate'}),null);
  worker.setOffline(true);
  assert.match(await(await worker.request('/',{mode:'navigate'})).text(),/current shell/,'Offline fallback must not search an older cache');
  assert.equal(worker.calls.at(-1).options.cache,'no-store','Navigations always bypass the HTTP cache');
  worker.getStore(worker.cacheName).delete(origin+'/index.html');
  assert.equal((await worker.request('/',{mode:'navigate'})).status,503,'Missing current shell must not resurrect old HTML');
  const message={data:{type:'MER_ACTIVATE_UPDATE',userInitiated:true},origin,source:{id:'tab',type:'window'}};
  for(const changed of [{origin:'https://other.example'},{source:{id:'foreign',type:'window'}},{source:{id:'missing',type:'window'}},{source:{id:'tab',type:'worker'}},{data:{type:'MER_ACTIVATE_UPDATE'}},{data:{type:'SKIP_WAITING',userInitiated:true}}])await worker.dispatch('message',{...message,...changed});
  assert.equal(worker.skipped(),0,'Unvalidated activation messages cannot bypass the waiting phase');
  await worker.dispatch('message',message);
  assert.equal(worker.skipped(),1,'Explicit request from a same-origin window can activate');
  await worker.dispatch('activate');
  assert.equal(worker.claimed(),1);
  assert.deepEqual(worker.deleted,['mer-shell-old'],'Only superseded app shell caches are retired');
  assert.ok(worker.stores.has('other-app-cache'),'Unrelated caches remain untouched');

  const pinned=workerHarness(workerSource.replace('/*__MER_SHELL_ASSETS__*/ null',JSON.stringify(['/index.html','/app.min.js?v=pinned-release'])));
  await pinned.dispatch('install');
  assert.equal(pinned.calls.some(call=>call.url.endsWith('/sw-assets.json')),false,'Built worker uses its embedded release manifest');
  assert.ok(pinned.getStore(pinned.cacheName).has(origin+'/app.min.js?v=pinned-release'));

  const client=clientHarness();await tick();
  assert.equal(client.registers(),1,'Client starts even when load already fired');
  assert.equal(client.options().updateViaCache,'none');
  assert.equal(client.banner().attributes.role,'region');
  assert.equal(client.banner().querySelector('p').attributes['aria-live'],'polite');
  assert.equal(client.reloads(),0);assert.equal(client.messages.length,0,'Waiting worker never activates without a click');
  vm.runInContext(clientSource,client.context);await client.root.MerAppUpdate.start();
  assert.equal(client.registers(),1,'Loading the module twice cannot duplicate registration');
  client.document.dispatch('visibilitychange');client.root.dispatch('online');await tick();
  assert.equal(client.updates(),1,'Visibility and online events are throttled');
  client.advance(300001);client.document.dispatch('visibilitychange');await tick();
  assert.equal(client.updates(),2,'Visible page checks again after five minutes');
  client.document.documentElement.lang='en';
  client.click();
  assert.equal(client.messages[0].type,'MER_ACTIVATE_UPDATE');assert.equal(client.messages[0].userInitiated,true);
  assert.equal(client.reloads(),0,'Sending activation does not reload before a controller is ready');
  client.changeController();await tick();assert.equal(client.reloads(),1,'Explicit acceptance reloads once after activation');
  client.serviceWorker.dispatch('controllerchange');assert.equal(client.reloads(),1);

  const elsewhere=clientHarness();await tick();
  const form=new Element('form');form.unsavedChanges=true;elsewhere.document.body.appendChild(form);
  elsewhere.later();assert.equal(elsewhere.banner().hidden,true);
  elsewhere.changeController();assert.equal(elsewhere.reloads(),0,'Activation from another tab never discards an open form');
  assert.equal(elsewhere.banner().hidden,false,'Other-tab activation offers an explicit reload');
  assert.equal(form.unsavedChanges,true);
  elsewhere.click();await tick();assert.equal(elsewhere.reloads(),1);

  const saving=clientHarness();await tick();let finishSave;
  saving.root.MerEnterpriseSecurity={flush:()=>new Promise(resolve=>{finishSave=resolve;})};
  saving.click();saving.changeController();await tick();
  assert.equal(saving.reloads(),0,'An update must wait for encrypted persistence to finish');
  finishSave();await tick();assert.equal(saving.reloads(),1);

  const failedSave=clientHarness();await tick();
  failedSave.root.MerEnterpriseSecurity={flush:async()=>{throw new Error('PERSIST_FAILED');}};
  failedSave.click();failedSave.changeController();await tick();
  assert.equal(failedSave.reloads(),0,'Failed persistence cannot discard unsaved data');
  assert.match(failedSave.banner().querySelector('p').textContent,/pokušati ponovno/);

  const timeout=clientHarness();await tick();timeout.click();
  for(const callback of [...timeout.timers.values()])callback();
  assert.equal(timeout.reloads(),0);
  assert.match(timeout.banner().querySelector('p').textContent,/pokušati ponovno/);
  timeout.changeController();assert.equal(timeout.reloads(),0,'Late activation after timeout cannot reload without fresh consent');

  const dismissed=clientHarness();await tick();dismissed.click();dismissed.later();dismissed.changeController();
  assert.equal(dismissed.reloads(),0,'Choosing Later cancels any pending automatic follow-through');

  const first=clientHarness({readyState:'loading',hasController:false,waiting:false});
  assert.equal(first.registers(),0);first.root.dispatch('load');await tick();
  assert.equal(first.registers(),1);first.changeController();
  assert.equal(first.reloads(),0);assert.equal(first.banner(),undefined,'First install is silent and does not pretend to be an update');
  process.stdout.write('PASS cache update lifecycle: guarded activation, exact asset versions, canonical current-cache offline shell, private request exclusions and consent-only reload.\n');
}
run().catch(error=>{process.stderr.write(`${error.stack}\n`);process.exitCode=1;});
