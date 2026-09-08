'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Vault = require('../vault-core.js');
const source = fs.readFileSync(require.resolve('../security-enterprise.js'), 'utf8');

function memory() {
  const data = new Map();
  let writes = 0;
  return {
    getItem:key => data.get(key) ?? null,
    setItem(key,value) { writes++;data.set(key,String(value)); },
    removeItem:key => data.delete(key),
    writes:() => writes
  };
}
class Element {
  constructor() {
    this.children = new Map();this.listeners = {};this.open = false;
    this.classList = {add(){},remove(){},toggle(){},contains(){return false;}};
  }
  setAttribute(){} removeAttribute(){} appendChild(){} focus(){} remove(){}
  querySelector(selector) { if (!this.children.has(selector)) this.children.set(selector,new Element());return this.children.get(selector); }
  querySelectorAll() { return []; }
  addEventListener(name,handler) { this.listeners[name] = handler; }
  showModal() { this.open = true; }
  close() { this.open = false; }
}
const snapshot = enabled => ({accounts:{personal:{transactions:[]},business:{transactions:[]}},settings:enabled === undefined ? {} : {autoLockEnabled:enabled},language:'hr'});
function harness({enabled,localStorage=memory(),sessionStorage=memory(),now=1_000_000}={}) {
  const documentListeners = {}, windowListeners = {}, intervals = new Map(), dialogs = [];
  let state = snapshot(enabled), intervalId = 0, instant = now, currentSession = null;
  const document = {
    body:new Element(),createElement:() => { const dialog=new Element();dialogs.push(dialog);return dialog; },
    getElementById:() => new Element(),querySelectorAll:() => dialogs.filter(dialog=>dialog.open),
    addEventListener:(name,handler) => { documentListeners[name]=handler; }
  };
  const root = {
    localStorage,sessionStorage,
    MerVault:{...Vault,createIdleClock:options=>Vault.createIdleClock({...options,now:()=>instant})},
    MerRuntime:{report(){}},MerAuthProvider:{currentSession:()=>currentSession},
    addEventListener:(name,handler)=>{windowListeners[name]=handler;},dispatchEvent(){},
    setInterval:callback=>{const id=++intervalId;intervals.set(id,callback);return id;},
    clearInterval:id=>intervals.delete(id)
  };
  class ClockDate extends Date { static now(){return instant;} }
  const context = vm.createContext({window:root,document,Date:ClockDate,structuredClone,
    CustomEvent:class {constructor(name,options){this.name=name;this.detail=options?.detail;}},
    requestAnimationFrame:callback=>callback(),setTimeout,Blob,URL,atob,btoa,crypto:require('node:crypto').webcrypto});
  vm.runInContext(source,context);
  const api=root.MerEnterpriseSecurity;
  api.init({storage:localStorage,sessionStorage,getState:()=>state,replaceState:next=>{state=structuredClone(next);},freshState:()=>snapshot(false)});
  return {
    api,localStorage,sessionStorage,dialogs,intervals,state:()=>state,now:()=>instant,
    setTime:value=>{instant=value;},advance:delta=>{instant+=delta;},tick:()=>{for(const callback of [...intervals.values()])callback();},
    event(name){(documentListeners[name]||windowListeners[name])?.();},
    async enter(userId='demo-user',password,extra={}) {
      currentSession={userId,demo:userId==='demo-user',issuedAt:instant,...extra};
      return api.beforeEnter(currentSession,password);
    },
    async unlock(password) {
      dialogs[0].querySelector('#enterpriseUnlockInput').value=password;
      await dialogs[0].querySelector('form').listeners.submit({preventDefault(){}});
    },
    setEnabled(value){state.settings.autoLockEnabled=value;api.syncAutoLock();}
  };
}
async function run() {
  for (const enabled of [undefined,false,'true',1]) {
    const app=harness({enabled});
    app.sessionStorage.setItem('mer-idle-v1:demo-user','1');
    await app.enter();
    assert.equal(app.api.status().autoLockEnabled,false,'Only boolean true opts in');
    assert.equal(app.intervals.size,0,'Default-off never starts an idle timer');
    const writes=app.sessionStorage.writes();
    app.advance(1_200_000);app.tick();
    for(const event of ['mousemove','pointerdown','keydown','touchstart','scroll','visibilitychange','focus','pageshow'])app.event(event);
    assert.equal(app.api.isLocked(),false,'Old idle timestamps and focus cannot lock an opted-out user');
    assert.equal(app.sessionStorage.writes(),writes,'Opted-out activity never writes idle timestamps');
    assert.equal(app.sessionStorage.getItem('mer-idle-v1:demo-user'),null);
  }

  const app=harness();await app.enter();
  app.advance(700_000);app.setEnabled(true);
  assert.equal(app.api.status().autoLockEnabled,true);assert.equal(app.intervals.size,1);
  const enabledAt=app.now();
  app.advance(599_999);app.tick();assert.equal(app.api.isLocked(),false);
  app.advance(1);app.tick();assert.equal(app.api.isLocked(),true,'Locks at exactly 600000ms after explicit opt-in');
  assert.equal(app.intervals.size,0,'Idle timer stops after locking');
  await app.api.onLogout();assert.equal(app.api.status().autoLockEnabled,false);

  const toggles=harness();await toggles.enter();toggles.setEnabled(true);
  toggles.advance(600_000);toggles.setEnabled(false);toggles.tick();toggles.event('visibilitychange');
  assert.equal(toggles.api.isLocked(),false,'Turning off at the boundary cancels the pending lock');
  assert.equal(toggles.intervals.size,0);
  toggles.advance(900_000);toggles.setEnabled(true);
  const secondStart=toggles.now();
  assert.equal(Number(toggles.sessionStorage.getItem('mer-idle-v1:demo-user')),secondStart);
  toggles.advance(599_999);toggles.event('visibilitychange');assert.equal(toggles.api.isLocked(),false);
  toggles.advance(1);toggles.event('focus');assert.equal(toggles.api.isLocked(),true,'Re-enable grants a new complete idle window');
  await toggles.api.onLogout();

  const activity=harness();await activity.enter();activity.setEnabled(true);
  activity.advance(599_000);activity.event('touchstart');
  activity.advance(1_000);activity.tick();assert.equal(activity.api.isLocked(),false,'Touch activity extends the enabled idle window');
  activity.state().activeAccount='business';activity.api.syncAutoLock();
  activity.advance(599_000);activity.event('pageshow');assert.equal(activity.api.isLocked(),true,'Profile switching does not reset the user preference or timer');
  await activity.api.onLogout();

  const persistence=harness();await persistence.enter();persistence.setEnabled(true);
  await persistence.api.persist(persistence.state());
  const persisted=JSON.parse(persistence.localStorage.getItem('mer-cache-v1:demo-user'));
  assert.equal(persisted.settings.autoLockEnabled,true,'Opt-in persists inside the user-scoped snapshot');
  const reload=harness({localStorage:persistence.localStorage,sessionStorage:persistence.sessionStorage,now:persistence.now()+600_000});
  await reload.enter('demo-user',undefined,{issuedAt:persistence.now()});
  assert.equal(reload.api.isLocked(),true,'An opted-in cold reload respects its own stored idle timestamp');
  await reload.api.onLogout();
  await reload.enter('user-b','Different owner secure password');
  assert.equal(reload.api.status().autoLockEnabled,false,'Another user does not inherit the first user opt-in');
  assert.equal(reload.intervals.size,0);await reload.api.onLogout();

  const guarded=harness();
  const password='Correct encrypted owner passphrase';
  await guarded.enter('registered-owner',password);
  assert.equal(guarded.api.status().encrypted,true);assert.equal(guarded.api.status().autoLockEnabled,false);
  await guarded.api.lock();assert.equal(guarded.api.isLocked(),true,'Manual locking remains available while auto-lock is off');
  await guarded.unlock('wrong password');assert.equal(guarded.api.isLocked(),true,'Opt-out does not bypass credential validation');
  await guarded.unlock(password);assert.equal(guarded.api.isLocked(),false);assert.equal(guarded.intervals.size,0);
  await guarded.api.onLogout();
  const entry=guarded.enter('registered-owner');
  assert.equal(guarded.api.isLocked(),true,'Encrypted cold-start always requires a credential, even with auto-lock disabled');
  guarded.advance(1_000_000);guarded.event('visibilitychange');assert.equal(guarded.api.isLocked(),true);
  await guarded.unlock(password);assert.equal(await entry,true);
  assert.equal(guarded.api.isLocked(),false);assert.equal(guarded.intervals.size,0);
  await guarded.api.onLogout();
  assert.ok(enabledAt>0);
  process.stdout.write('PASS auto-lock opt-in cycle 1: default-off, exact boundary, disable/re-enable, activity, visibility, profile/user isolation, persistence, manual and encrypted startup gates.\n');
}
run().catch(error=>{process.stderr.write(`${error.stack}\n`);process.exitCode=1;});
