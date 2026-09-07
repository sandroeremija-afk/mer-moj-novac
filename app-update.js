(function(root){
  'use strict';
  if(root.MerAppUpdate)return;
  const serviceWorker = navigator.serviceWorker;
  const CHECK_INTERVAL = 5 * 60 * 1000;
  const ACTIVATION_TIMEOUT = 12000;
  let registration = null, startPromise = null, lastCheck = -Infinity, checking = false;
  let controller = serviceWorker?.controller || null;
  let candidate = null, pending = null, needsReload = false, didReload = false, flushing = false;
  let banner = null, message = null, reloadButton = null, laterButton = null, error = false;
  const watched = new WeakSet();
  const copy = {
    hr:{title:'Dostupna je nova verzija',ready:'Spremite promjene pa osvježite aplikaciju kada budete spremni.',active:'Nova verzija je spremna. Spremite promjene pa osvježite ovu karticu.',reload:'Osvježi aplikaciju',later:'Kasnije',busy:'Priprema nove verzije…',error:'Ažuriranje još nije spremno. Možete nastaviti raditi i pokušati ponovno.'},
    en:{title:'A new version is available',ready:'Save your changes, then reload the app when you are ready.',active:'The new version is ready. Save your changes, then reload this tab.',reload:'Reload app',later:'Later',busy:'Preparing the new version…',error:'The update is not ready yet. You can keep working and try again.'}
  };
  const words = () => copy[document.documentElement.lang?.toLowerCase().startsWith('en') ? 'en' : 'hr'];

  function render(){
    if(!banner)return;
    const text = words();
    banner.querySelector('h2').textContent = text.title;
    message.textContent = pending ? text.busy : error ? text.error : needsReload ? text.active : text.ready;
    reloadButton.textContent = text.reload;
    laterButton.textContent = text.later;
    reloadButton.disabled = Boolean(pending);
    banner.setAttribute('aria-busy', String(Boolean(pending)));
  }
  function show(){
    if(!document.body)return;
    if(!banner){
      banner = document.createElement('section');
      banner.id = 'merAppUpdate';
      banner.className = 'mer-app-update';
      banner.setAttribute('role','region');
      banner.setAttribute('aria-labelledby','merAppUpdateTitle');
      const title = document.createElement('h2');
      title.id = 'merAppUpdateTitle';
      message = document.createElement('p');
      message.setAttribute('role','status');
      message.setAttribute('aria-live','polite');
      message.setAttribute('aria-atomic','true');
      const actions = document.createElement('div');
      actions.className = 'mer-app-update-actions';
      reloadButton = document.createElement('button');
      reloadButton.type = 'button';
      reloadButton.addEventListener('click',requestReload);
      laterButton = document.createElement('button');
      laterButton.type = 'button';
      laterButton.className = 'mer-app-update-later';
      laterButton.addEventListener('click',()=>{cancelPending();banner.hidden=true;});
      actions.append(reloadButton,laterButton);
      banner.append(title,message,actions);
      document.body.appendChild(banner);
      if(root.MutationObserver)new root.MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    }
    banner.hidden = false;
    render();
  }
  function offer(worker){
    if(!worker || !serviceWorker.controller || (candidate === worker && !error))return;
    candidate = worker;
    error = false;
    show();
  }
  function cancelPending(){
    if(pending)root.clearTimeout(pending.timer);
    pending = null;
  }
  function fail(){
    cancelPending();
    error = true;
    show();
  }
  async function reloadAfterConsent(){
    if(!pending || didReload || flushing)return;
    const accepted = pending;
    flushing = true;
    try{
      await root.MerEnterpriseSecurity?.flush?.();
      if(pending !== accepted || didReload)return;
      cancelPending();
      didReload = true;
      root.location.reload();
    }catch{if(pending === accepted)fail();}finally{flushing=false;}
  }
  function requestReload(){
    if(pending || didReload)return;
    error = false;
    const worker = registration?.waiting || candidate;
    if(needsReload){
      pending = {worker:serviceWorker.controller,timer:root.setTimeout(fail,ACTIVATION_TIMEOUT)};
      render();
      void reloadAfterConsent();
      return;
    }
    if(!worker || !['installed','activating','activated'].includes(worker.state)){fail();return;}
    pending = {worker,timer:root.setTimeout(fail,ACTIVATION_TIMEOUT)};
    render();
    if(worker === serviceWorker.controller){void reloadAfterConsent();return;}
    // This message is sent only by the user's update button. Installation never activates itself.
    try{worker.postMessage({type:'MER_ACTIVATE_UPDATE',userInitiated:true});}catch{fail();}
  }
  function watch(worker){
    if(!worker || watched.has(worker))return;
    watched.add(worker);
    const changed = ()=>{
      if(worker.state === 'installed')offer(registration.waiting || worker);
      if(worker.state === 'redundant' && pending?.worker === worker)fail();
    };
    worker.addEventListener('statechange',changed);
    changed();
  }
  function controllerChanged(){
    const previous = controller;
    controller = serviceWorker.controller;
    if(!controller || controller === previous)return;
    if(pending?.worker === controller){void reloadAfterConsent();return;}
    cancelPending();
    // A different tab may accept an update. This tab never loses work through an automatic reload.
    if(previous){needsReload=true;candidate=null;error=false;show();}
  }
  async function checkForUpdate(){
    if(!registration || checking || navigator.onLine === false || Date.now()-lastCheck<CHECK_INTERVAL)return false;
    checking = true;
    lastCheck = Date.now();
    try{
      await registration.update();
      if(registration.waiting)offer(registration.waiting);
      return true;
    }catch{return false;}finally{checking=false;}
  }
  function start(){
    if(startPromise)return startPromise;
    if(!serviceWorker || !root.isSecureContext)return Promise.resolve(null);
    serviceWorker.addEventListener('controllerchange',controllerChanged);
    startPromise = serviceWorker.register('/service-worker.js',{scope:'/',updateViaCache:'none'}).then(result=>{
      registration = result;
      registration.addEventListener('updatefound',()=>watch(registration.installing));
      watch(registration.installing);
      if(registration.waiting)offer(registration.waiting);
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void checkForUpdate();});
      root.addEventListener('online',()=>void checkForUpdate());
      void checkForUpdate();
      return registration;
    }).catch(()=>null);
    return startPromise;
  }
  root.MerAppUpdate = Object.freeze({start,checkForUpdate});
  if(document.readyState === 'complete')void start();
  else root.addEventListener('load',()=>void start(),{once:true});
})(window);
