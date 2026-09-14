'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {File}=require('node:buffer');
const R=require('../receipt-core.js');
const MerCore=require('../core.js');
const source=fs.readFileSync(require.resolve('../receipt-ui.js'),'utf8');

function deferred() {let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
class Events {
  constructor() {this.events=new Map();}
  addEventListener(name,handler) {if(!this.events.has(name))this.events.set(name,[]);this.events.get(name).push(handler);}
  removeEventListener(name,handler) {this.events.set(name,(this.events.get(name)||[]).filter(item=>item!==handler));}
  async emit(name,event={}) {await Promise.all((this.events.get(name)||[]).map(handler=>handler({preventDefault(){},target:this,...event})));}
}
function stream() {
  const track=new Events();track.stops=0;track.stop=()=>{track.stops++;track.readyState='ended';};track.readyState='live';
  return {track,getTracks:()=>[track]};
}
function harness(options={}) {
  const createdUrls=[],revokedUrls=[],draws=[],requests=[],cameraRequests=[],videos=[],canvases=[],observers=[];
  const suppliedStream=stream();
  class Element extends Events {
    constructor(attributes='') {
      super();this.disabled=/\sdisabled(?:\s|$)/.test(attributes);this.checked=false;this.hidden=/\shidden(?:\s|$)/.test(attributes);this.textContent='';this.files=[];this.clicks=0;this.focused=false;this.isConnected=true;
      this.classList={add(){},remove(){}};
    }
    setAttribute() {}
    click() {this.clicks++;return this.emit('click');}
    focus() {this.focused=true;}
    querySelector(selector) {return dialog.querySelector(selector);}
    querySelectorAll(selector) {return dialog.querySelectorAll(selector);}
  }
  const dialog=new Element();dialog.open=false;dialog.controls=new Map();dialog.closeButtons=[];
  Object.defineProperty(dialog,'innerHTML',{get(){return this.html||'';},set(html){
    this.html=html;this.controls=new Map();this.closeButtons=[];
    for(const match of html.matchAll(/<(button|input|div|p|video|form)[\s\n]([^>]+)>/g)) {
      const attributes=match[2],node=new Element(attributes),id=/\bid="([^"]+)"/.exec(attributes)?.[1],name=/\bname="([^"]+)"/.exec(attributes)?.[1];
      if(id)this.controls.set('#'+id,node);if(name)this.controls.set('[name="'+name+'"]',node);
      if(attributes.includes('data-receipt-close'))this.closeButtons.push(node);
      if(attributes.includes('data-receipt-error'))this.controls.set('[data-receipt-error]',node);
      if(match[1]==='video') {
        node.readyState=options.ready===false?0:2;node.videoWidth=options.ready===false?0:1920;node.videoHeight=options.ready===false?0:1080;
        node.pause=()=>{node.paused=true;};node.play=async()=>{if(options.playFailure)throw options.playFailure;node.played=true;};videos.push(node);
      }
    }
  }});
  dialog.querySelector=selector=>selector==='[data-receipt-close]'?dialog.closeButtons[0]:dialog.controls.get(selector)||null;
  dialog.querySelectorAll=selector=>selector==='[data-receipt-close]'?dialog.closeButtons:[];
  dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;return dialog.emit('close');};dialog.replaceChildren=()=>{dialog.innerHTML='';};
  const state={activeProfile:'personal',language:options.language||'hr',profiles:{personal:{transactions:[]},business:{transactions:[]}}};
  const document=new Events();document.hidden=false;document.documentElement={lang:'hr'};document.activeElement=null;
  const shell={hidden:false,inert:false};document.getElementById=id=>id==='appShell'?shell:null;
  document.body={append(){},classList:{remove(){}}};document.querySelector=()=>null;
  document.createElement=tag=>{
    if(tag==='dialog')return dialog;
    assert.equal(tag,'canvas');
    const canvas={getContext(){return options.noCanvas?null:{drawImage(...args){draws.push(args);},fillRect(){}};},toBlob(callback,type){if(options.toBlob)return options.toBlob(callback,type,canvases.length);callback(new Blob(['synthetic receipt frame'],{type}));}};
    canvases.push(canvas);return canvas;
  };
  class Image {constructor(){this.naturalWidth=1600;this.naturalHeight=900;}async decode(){if(options.imageDecode)await options.imageDecode;}}
  const window=new Events();Object.assign(window,{document,File,MerReceipts:R,MerCore,crypto:require('node:crypto').webcrypto,isSecureContext:options.secure!==false,MerEnterpriseBridge:{getState:()=>state,openModal:node=>node.showModal(),closeModal:node=>node.close()}});
  window.MutationObserver=class {constructor(handler){this.handler=handler;observers.push(this);}observe(){this.active=true;}disconnect(){this.active=false;}};
  if(options.supported!==false)window.navigator={mediaDevices:{getUserMedia:constraints=>{cameraRequests.push(constraints);return options.getUserMedia?options.getUserMedia(constraints):Promise.resolve(suppliedStream);}}};
  vm.runInNewContext(source,{window,document,Image,Intl,URL:{createObjectURL(blob){createdUrls.push(blob);return 'blob:receipt-'+createdUrls.length;},revokeObjectURL(url){revokedUrls.push(url);}},AbortController,setTimeout,clearTimeout,btoa:value=>Buffer.from(value,'binary').toString('base64'),fetch:async(url,request)=>{requests.push({url,request});return {ok:true,json:async()=>({source:'gemini',receipt:{merchant:'Synthetic shop',date:'2026-09-14',totalCents:1250,currency:'EUR',lines:[]}})};}});
  window.MerReceiptUI.open();
  return {window,document,dialog,state,shell,observers,stream:suppliedStream,videos,canvases,draws,cameraRequests,requests,createdUrls,revokedUrls,node:selector=>dialog.querySelector(selector),click:selector=>dialog.querySelector(selector).click()};
}

test('live rear camera starts only on request, with no microphone and a local footer back button',async()=>{
  const app=harness();assert.equal(app.cameraRequests.length,0);assert.equal(app.requests.length,0);
  await app.click('#receiptCamera');
  assert.equal(app.cameraRequests.length,1);
  assert.equal(app.cameraRequests[0].audio,false);assert.equal(app.cameraRequests[0].video.facingMode.ideal,'environment');
  assert.equal(app.videos[0].srcObject,app.stream);assert.equal(app.videos[0].muted,true);assert.equal(app.videos[0].played,true);
  assert.equal(app.node('#receiptSnap').disabled,false);assert.equal(app.requests.length,0);
  assert.match(app.dialog.innerHTML,/<video[^>]+autoplay muted playsinline/);
  assert.match(app.dialog.innerHTML,/<footer[^>]*><button[^>]+id="receiptBack">Natrag/);
  assert.doesNotMatch(app.dialog.innerHTML.split('</header>')[0],/Natrag|←/);
});

test('capture waits for a decoded frame and then enters the existing consent and review pipeline',async()=>{
  const app=harness({ready:false});await app.click('#receiptCamera');
  assert.equal(app.node('#receiptSnap').disabled,true);await app.click('#receiptSnap');assert.equal(app.draws.length,0);
  const video=app.videos[0];video.readyState=2;video.videoWidth=4032;video.videoHeight=3024;await video.emit('loadeddata');
  assert.equal(app.node('#receiptSnap').disabled,false);await app.click('#receiptSnap');
  assert.equal(app.canvases[0].width,2048);assert.equal(app.canvases[0].height,1536);assert.equal(app.draws[0][0],video);
  assert.equal(app.stream.track.stops,1);assert.equal(video.srcObject,null);assert.equal(video.paused,true);
  assert.match(app.dialog.innerHTML,/receipt-.*\.jpg/);assert.equal(app.node('#receiptAnalyze').disabled,false);
  assert.equal(app.node('#receiptConsent').checked,false);assert.equal(app.requests.length,0);
  await app.click('#receiptAnalyze');assert.equal(app.requests.length,0);assert.match(app.node('[data-receipt-error]').textContent,/pristanak/);
  app.node('#receiptConsent').checked=true;await app.click('#receiptAnalyze');
  assert.equal(app.requests.length,1);const request=JSON.parse(app.requests[0].request.body);
  assert.equal(request.consent,true);assert.equal(request.image.mimeType,'image/jpeg');assert.ok(request.image.data);assert.equal(request.transactions,undefined);
  assert.match(app.dialog.innerHTML,/Provjerite i povežite/);assert.match(app.dialog.innerHTML,/Synthetic shop/);
});

test('back and file selection stop camera immediately and restore upload without losing the modal',async()=>{
  for(const action of ['#receiptBack','#receiptCameraChoose']) {
    const app=harness();await app.click('#receiptCamera');await app.click(action);
    assert.equal(app.stream.track.stops,1);assert.equal(app.videos[0].srcObject,null);assert.equal(app.dialog.open,true);
    assert.ok(app.node('#receiptCamera'));assert.equal(app.requests.length,0);
    if(action==='#receiptCameraChoose')assert.equal(app.node('#receiptFile').clicks,1);
    else assert.equal(app.node('#receiptCamera').focused,true);
  }
});

test('close, Escape, lock, profile switch, hidden tab, and pagehide all release camera tracks',async()=>{
  for(const action of ['close','escape','locked','profile','hidden','pagehide']) {
    const app=harness();await app.click('#receiptCamera');
    if(action==='close')app.window.MerReceiptUI.close();
    if(action==='escape')await app.dialog.emit('cancel');
    if(action==='locked')await app.document.emit('mer:locked');
    if(action==='profile'){app.state.activeProfile='business';await app.document.emit('mer:profile-change');}
    if(action==='hidden'){app.document.hidden=true;await app.document.emit('visibilitychange');}
    if(action==='pagehide')await app.window.emit('pagehide');
    assert.equal(app.stream.track.stops,1,action);assert.equal(app.videos[0].srcObject,null,action);assert.equal(app.requests.length,0,action);
    if(['hidden','pagehide'].includes(action))assert.ok(app.node('#receiptCamera'),action);else assert.equal(app.dialog.open,false,action);
  }
});

test('late permission approval after backing out, locking, or hiding cannot leak or attach a stream',async()=>{
  for(const action of ['back','locked','hidden']) {
    const pending=deferred(),app=harness({getUserMedia:()=>pending.promise}),late=stream();
    const opening=app.click('#receiptCamera');
    if(action==='back')await app.click('#receiptBack');
    if(action==='locked')await app.document.emit('mer:locked');
    if(action==='hidden'){app.document.hidden=true;await app.document.emit('visibilitychange');}
    pending.resolve(late);await opening;
    assert.equal(late.track.stops,1,action);assert.equal(app.videos[0].srcObject,null,action);assert.equal(app.requests.length,0,action);
  }
});

test('actual security events and hidden/inert application shells release streams on session expiry or MFA',async()=>{
  for(const action of ['security','hidden','inert']) {
    const app=harness();await app.click('#receiptCamera');
    if(action==='security')await app.window.emit('mer-security-status',{detail:{locked:true}});
    else {app.shell[action]=true;app.observers[0].handler();}
    assert.equal(app.dialog.open,false,action);assert.equal(app.stream.track.stops,1,action);
    assert.equal(app.observers[0].active,false,action);assert.equal(app.videos[0].srcObject,null,action);
  }
});

test('an older camera request cannot replace or stop a newer session',async()=>{
  const first=deferred(),second=deferred();let calls=0;
  const app=harness({getUserMedia:()=>++calls===1?first.promise:second.promise});
  const openingFirst=app.click('#receiptCamera');await app.click('#receiptBack');const openingSecond=app.click('#receiptCamera');
  const fresh=stream();second.resolve(fresh);await openingSecond;
  const stale=stream();first.resolve(stale);await openingFirst;
  assert.equal(stale.track.stops,1);assert.equal(fresh.track.stops,0);assert.equal(app.videos[1].srcObject,fresh);
  app.window.MerReceiptUI.close();assert.equal(fresh.track.stops,1);
});

test('unsupported or insecure browsers invoke the native rear-camera input',async()=>{
  for(const options of [{supported:false},{secure:false}]) {
    const app=harness(options);await app.click('#receiptCamera');
    assert.equal(app.cameraRequests.length,0);assert.equal(app.node('#receiptCameraFile').clicks,1);
    assert.match(app.dialog.innerHTML,/<input id="receiptCameraFile" type="file" accept="image\/\*" capture="environment" hidden>/);
  }
});

test('permission denial, missing/busy camera, and playback failure recover with a native fallback',async()=>{
  for(const name of ['NotAllowedError','NotFoundError','NotReadableError','SecurityError']) {
    const app=harness({getUserMedia:()=>Promise.reject({name})});await app.click('#receiptCamera');
    assert.ok(app.node('#receiptFile'));assert.match(app.dialog.innerHTML,/data-receipt-error/);assert.doesNotMatch(app.dialog.innerHTML,/<video/);
    await app.click('#receiptCamera');assert.equal(app.node('#receiptCameraFile').clicks,1);assert.equal(app.cameraRequests.length,1);assert.equal(app.requests.length,0);
  }
  const playback=harness({playFailure:{name:'NotAllowedError'}});await playback.click('#receiptCamera');
  assert.equal(playback.stream.track.stops,1);assert.equal(playback.videos[0].srcObject,null);assert.ok(playback.node('#receiptFile'));
});

test('camera disconnect restores upload and capture failure allows retry',async()=>{
  const disconnected=harness();await disconnected.click('#receiptCamera');await disconnected.stream.track.emit('ended');
  assert.equal(disconnected.stream.track.stops,1);assert.equal(disconnected.videos[0].srcObject,null);assert.ok(disconnected.node('#receiptCamera'));
  const failed=harness({noCanvas:true});await failed.click('#receiptCamera');await failed.click('#receiptSnap');
  assert.equal(failed.node('#receiptSnap').disabled,false);assert.match(failed.node('[data-receipt-error]').textContent,/nije moguće snimiti/);
  assert.equal(failed.stream.track.stops,0);failed.window.MerReceiptUI.close();assert.equal(failed.stream.track.stops,1);
});

test('pending capture cannot resurrect a closed modal or cross profiles, and duplicate snaps are ignored',async()=>{
  for(const action of ['close','profile']) {
    let finish;const app=harness({toBlob:callback=>{finish=callback;}});await app.click('#receiptCamera');
    const capture=app.click('#receiptSnap');await app.click('#receiptSnap');assert.equal(app.draws.length,1);
    if(action==='profile'){app.state.activeProfile='business';await app.document.emit('mer:profile-change');}else app.window.MerReceiptUI.close();
    finish(new Blob(['synthetic'],{type:'image/jpeg'}));await capture;
    assert.equal(app.dialog.open,false);assert.equal(app.dialog.innerHTML,'');assert.equal(app.stream.track.stops,1);assert.equal(app.createdUrls.length,0);assert.equal(app.requests.length,0);
  }
});

test('English camera instructions and errors remain localized',async()=>{
  const app=harness({language:'en'});await app.click('#receiptCamera');
  assert.match(app.dialog.innerHTML,/Take a receipt photo/);assert.match(app.dialog.innerHTML,/Capture photo/);assert.match(app.dialog.innerHTML,/Audio is not recorded/);
  assert.match(app.node('#receiptCameraStatus').textContent,/Camera ready/);
});
