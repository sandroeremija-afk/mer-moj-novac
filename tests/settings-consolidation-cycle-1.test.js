'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../popup-layout.js'),'utf8');

// Execute the production DOM migration with node identity, values and real
// listeners. This intentionally does not simulate CSS dimensions; browser
// evaluation covers desktop and mobile fit without inner scrolling.
class Element {
  constructor(tag,document){
    this.tagName=tag.toLowerCase();this.ownerDocument=document;this.children=[];this.parentElement=null;
    this.attrs=new Map();this.listeners=new Map();this._text='';this.scrollHeight=500;this.clientHeight=500;
    this.classList={contains:name=>this.className.split(/\s+/).includes(name)};
    this.dataset=new Proxy({}, {get:(_,key)=>this.getAttribute(`data-${String(key).replace(/[A-Z]/g,c=>`-${c.toLowerCase()}`)}`)??undefined,set:(_,key,value)=>{this.setAttribute(`data-${key.replace(/[A-Z]/g,c=>`-${c.toLowerCase()}`)}`,value);return true;}});
  }
  get id(){return this.getAttribute('id')||'';}set id(value){this.setAttribute('id',value);}
  get className(){return this.getAttribute('class')||'';}set className(value){this.setAttribute('class',value);}
  get value(){return this._value??this.getAttribute('value')??'';}set value(value){this._value=String(value);}
  get textContent(){return this._text+this.children.map(node=>node.textContent).join('');}
  set textContent(value){this._text=String(value);this.children.forEach(node=>node.parentElement=null);this.children=[];}
  get hidden(){return this.hasAttribute('hidden');}set hidden(value){this.toggleAttribute('hidden',value);}
  get isConnected(){return this===this.ownerDocument.body||Boolean(this.parentElement?.isConnected);}
  setAttribute(name,value){this.attrs.set(name,String(value));}
  getAttribute(name){return this.attrs.get(name)??null;}
  hasAttribute(name){return this.attrs.has(name);}
  toggleAttribute(name,force){if(force??!this.hasAttribute(name))this.setAttribute(name,'');else this.attrs.delete(name);}
  remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(node=>node!==this);this.parentElement=null;}
  append(...nodes){nodes.forEach(node=>{node.remove();node.parentElement=this;this.children.push(node);});}
  prepend(...nodes){nodes.forEach(node=>node.remove());nodes.forEach(node=>node.parentElement=this);this.children.unshift(...nodes);}
  before(...nodes){const parent=this.parentElement;nodes.forEach(node=>{node.remove();node.parentElement=parent;parent.children.splice(parent.children.indexOf(this),0,node);});}
  after(...nodes){const parent=this.parentElement;let index=parent.children.indexOf(this)+1;nodes.forEach(node=>{node.remove();node.parentElement=parent;parent.children.splice(index++,0,node);});}
  contains(node){return this===node||this.children.some(child=>child.contains(node));}
  closest(selector){return this.matches(selector)?this:this.parentElement?.closest(selector)||null;}
  focus(){this.ownerDocument.activeElement=this;}
  matches(selector){return selector.split(',').some(part=>{
    const simple=part.trim(),tag=simple.match(/^[a-z][a-z-]*/i)?.[0];
    if(tag&&this.tagName!==tag.toLowerCase())return false;
    for(const match of simple.matchAll(/#([\w-]+)|\.([\w-]+)|\[([\w-]+)(?:="([^"]*)")?\]/g)){
      if(match[1]&&this.id!==match[1])return false;
      if(match[2]&&!this.classList.contains(match[2]))return false;
      if(match[3]&&(!this.hasAttribute(match[3])||(match[4]!==undefined&&this.getAttribute(match[3])!==match[4])))return false;
    }
    return true;
  });}
  querySelectorAll(selector){const nodes=[];const walk=node=>node.children.forEach(child=>{if(child.matches(selector))nodes.push(child);walk(child);});walk(this);return nodes;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  addEventListener(type,listener){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(listener);}
  dispatch(type,details={}){const event={target:this,currentTarget:this,preventDefault(){},...details};(this.listeners.get(type)||[]).forEach(listener=>listener(event));}
  click(){this.dispatch('click');}
  set innerHTML(html){
    this.textContent='';const stack=[this];
    for(const token of html.match(/<[^>]+>|[^<]+/g)||[]){
      if(token.startsWith('</')){stack.pop();continue;}
      if(!token.startsWith('<')){stack.at(-1)._text+=token;continue;}
      const tag=/^<([\w-]+)/.exec(token)?.[1];if(!tag)continue;
      const node=this.ownerDocument.createElement(tag);
      for(const attribute of token.slice(tag.length+1,-1).matchAll(/([\w-]+)(?:="([^"]*)")?/g))node.setAttribute(attribute[1],attribute[2]??'');
      stack.at(-1).append(node);if(!['input','br','hr'].includes(tag)&&!token.endsWith('/>'))stack.push(node);
    }
  }
}
function harness(){
  const document={documentElement:{lang:'hr'}};
  document.createElement=tag=>new Element(tag,document);document.body=document.createElement('body');
  document.getElementById=id=>document.body.querySelector(`#${id}`);
  document.querySelectorAll=selector=>document.body.querySelectorAll(selector);
  const node=(tag,attrs={},parent=null)=>{const result=document.createElement(tag);for(const [key,value]of Object.entries(attrs))result.setAttribute(key,value);parent?.append(result);return result;};
  const dialog=node('dialog',{id:'bankSettingsModal',open:''},document.body);
  const body=node('div',{class:'settings-modal-body'},dialog);
  const general=node('section',{'data-settings-panel':'general'},body),personal=node('section',{'data-settings-panel':'personal'},body),security=node('section',{'data-settings-panel':'security'},body),rules=node('section',{'data-settings-panel':'automation'},body);
  const regional=node('div',{class:'settings-form-grid'},general),appearance=node('div',{id:'settingsTourPreferences'},general),privacy=node('label',{class:'toggle-setting'},general);
  node('select',{id:'settingsLanguage'},regional);node('div',{id:'themeToggle'},appearance);node('input',{id:'hideBalances'},privacy);
  node('div',{class:'settings-pane-heading'},security);
  const personalForm=node('form',{id:'personalDataForm'},personal),firstName=node('input',{id:'personalFirstName'},personalForm);
  node('p',{id:'personalDataNotice'},personal);node('p',{id:'personalDataStorage'},personalForm);node('p',{class:'personal-data-portability'},personal);
  firstName.value='Unsaved first name';
  const demo=node('div',{id:'demoResetCard'},general);
  const password=node('form',{id:'changePasswordForm'},security),passwordInput=node('input',{id:'currentPasswordInput'},password);
  passwordInput.value='Unsubmitted password';
  const mfa=node('div',{id:'settingsTourMfa'},security),setup=node('div',{id:'mfaSetup'},mfa),code=node('input',{id:'mfaVerificationCode'},setup);
  code.value='123456';node('div',{id:'recoveryPanel',hidden:''},mfa);node('div',{id:'mfaDisable',hidden:''},mfa);
  const notice=node('p',{class:'info-note'},security);
  const sessions=node('div',{class:'active-sessions-card'},security);
  node('label',{class:'auto-lock-setting'},security);
  const enterprise=node('section',{class:'enterprise-security-actions'},security),originalGrid=node('div',{class:'enterprise-action-grid'},enterprise);
  const exportButton=node('button',{id:'exportSovereignty'},originalGrid),deleteButton=node('button',{id:'deleteSovereignty'},originalGrid);
  node('p',{class:'rules-subtitle'},rules);const ruleForm=node('form',{id:'automationRuleForm'},rules);node('input',{id:'ruleKeyword'},ruleForm);
  node('div',{id:'automationRuleList'},rules);node('nav',{id:'rulesPagination'},rules);
  const importDialog=node('dialog',{id:'importDataModal'},document.body);node('div',{class:'import-dropzone'},importDialog);
  const importReview=node('div',{id:'importReview',hidden:''},importDialog);
  node('div',{class:'bulk-editor'},importReview);node('div',{id:'bulkOverrideConfirmation'},importReview);node('div',{id:'bulkOverrideUndoBar'},importReview);
  const calls={export:0,delete:0,password:0,personal:0},tabs=[];
  exportButton.addEventListener('click',()=>calls.export++);deleteButton.addEventListener('click',()=>calls.delete++);
  password.addEventListener('submit',()=>calls.password++);personalForm.addEventListener('submit',()=>calls.personal++);
  const frames=[],events={};
  const window={document,MerSettings:{selectTab:tab=>tabs.push(tab)},addEventListener:(name,handler)=>events[name]=handler};
  vm.runInNewContext(source,{window,requestAnimationFrame:callback=>{frames.push(callback);return frames.length;},MutationObserver:class{observe(){}}});
  const flush=()=>{while(frames.length)frames.shift()();};flush();
  const topic=value=>{const radio=security.querySelector(`input[value="${value}"]`);assert.ok(radio);radio.checked=true;radio.dispatch('change');flush();};
  return{window,document,dialog,body,personal,security,demo,personalForm,firstName,password,passwordInput,mfa,setup,code,notice,sessions,exportButton,deleteButton,calls,tabs,flush,topic,events};
}

test('consolidation moves existing sovereignty actions and demo controls beside personal data without replacing handlers',()=>{
  const app=harness();
  for(const button of [app.exportButton,app.deleteButton]){
    assert.ok(app.personal.contains(button));assert.equal(app.security.contains(button),false);
    assert.equal(app.document.querySelectorAll(`#${button.id}`).length,1);
  }
  assert.ok(app.personal.contains(app.demo));assert.ok(app.personal.contains(app.personalForm));
  assert.equal(app.firstName.value,'Unsaved first name');
  app.exportButton.click();app.deleteButton.click();app.personalForm.dispatch('submit');
  assert.deepEqual(app.calls,{export:1,delete:1,password:0,personal:1});
});

test('security has three visible topic choices and one common password/MFA card retaining form and enrollment state',()=>{
  const app=harness(),access=app.document.getElementById('securityAccessCard');
  assert.deepEqual(app.security.querySelectorAll('input[name="settingsTopic"]').map(node=>node.value),['access','device','sessions']);
  assert.equal(app.security.querySelector('input[value="data"]'),null);
  assert.ok(access.contains(app.password));assert.ok(access.contains(app.mfa));assert.ok(access.contains(app.notice));
  assert.equal(access.hasAttribute('data-topic-hidden'),false);
  app.topic('sessions');assert.equal(access.hasAttribute('data-topic-hidden'),true);assert.equal(app.sessions.hasAttribute('data-topic-hidden'),false);
  app.topic('device');app.topic('access');
  assert.equal(app.document.getElementById('changePasswordForm'),app.password);
  assert.equal(app.passwordInput.value,'Unsubmitted password');assert.equal(app.code.value,'123456');assert.equal(app.setup.hidden,false);
  app.password.dispatch('submit');assert.equal(app.calls.password,1);
});

test('deep links select Personal for data actions and the correct mobile access subview for password/MFA',()=>{
  const app=harness(),access=app.document.getElementById('securityAccessCard');
  app.window.MerPopupLayout.revealTarget('exportSovereignty');assert.equal(app.tabs.at(-1),'personal');
  app.window.MerPopupLayout.revealTarget('personalAddress');assert.equal(app.tabs.at(-1),'personal');
  app.window.MerPopupLayout.revealTarget('#mfaVerificationCode');assert.equal(app.tabs.at(-1),'security');
  assert.equal(access.dataset.accessView,'mfa');assert.equal(access.hasAttribute('data-topic-hidden'),false);
  assert.equal(access.querySelector('button[data-access-view="mfa"]').getAttribute('aria-pressed'),'true');
  app.window.MerPopupLayout.revealTarget('#currentPasswordInput');assert.equal(access.dataset.accessView,'password');
  access.querySelector('button[data-access-view="mfa"]').click();assert.equal(access.dataset.accessView,'mfa');
  app.dialog.dispatch('close');assert.equal(access.dataset.accessView,'password');assert.equal(access.hasAttribute('data-topic-hidden'),false);
  assert.equal(app.passwordInput.value,'Unsubmitted password');assert.equal(app.code.value,'123456');
});

test('consolidated labels respond to language changes while measured fit records layout regressions',()=>{
  const app=harness();
  assert.equal(app.document.getElementById('securityAccessTitle').textContent,'Lozinka i dvofaktorska autentifikacija');
  assert.equal(app.body.dataset.contentFits,'true');
  app.document.documentElement.lang='en';app.body.scrollHeight=800;app.events.resize();app.flush();
  assert.equal(app.document.getElementById('securityAccessTitle').textContent,'Password and two-factor authentication');
  assert.equal(app.document.getElementById('settingsDataTitle').textContent,'Data management');
  assert.equal(app.body.dataset.contentFits,'false');
  app.body.scrollHeight=500;app.events.resize();app.flush();assert.equal(app.body.dataset.contentFits,'true');
});

test('mounted subviews retain connected controls and disabled import steps cannot be reached by arrow keys',()=>{
  const app=harness();
  for(const id of ['changePasswordForm','settingsTourMfa','personalDataForm','personalDataStorage','mfaDisable','recoveryPanel','automationRuleForm','importReview','bulkOverrideConfirmation'])assert.equal(app.document.getElementById(id).isConnected,true,id);
  const upload=app.document.getElementById('settings-import-upload-tab'),review=app.document.getElementById('settings-import-review-tab');
  assert.equal(review.disabled,true);upload.dispatch('keydown',{key:'ArrowRight'});
  assert.equal(upload.getAttribute('aria-selected'),'true');assert.equal(review.getAttribute('aria-selected'),'false');
  app.window.MerImportLayout.refresh(true);assert.equal(review.disabled,false);assert.equal(review.getAttribute('aria-selected'),'true');
  app.window.MerMfaRecoveryLayout.refresh(true);assert.equal(app.document.getElementById('settings-mfa-account-recovery').hidden,false);
  app.window.MerMfaRecoveryLayout.refresh(false);assert.equal(app.document.getElementById('settings-mfa-account-manage').hidden,false);
  assert.equal(app.code.value,'123456');
});

test('native validation reveals the original input and active outer settings tab',()=>{
  const app=harness();
  app.window.MerPopupLayout.revealTarget('exportSovereignty');
  assert.equal(app.document.getElementById('settings-personal-details').hidden,true);
  app.dialog.dispatch('invalid',{target:app.firstName});
  assert.equal(app.tabs.at(-1),'personal');assert.equal(app.document.getElementById('settings-personal-details').hidden,false);
  assert.equal(app.firstName.value,'Unsaved first name');
});

test('General language/theme command targets and the preferences tour cannot be rerouted to Security',()=>{
  const app=harness();
  for(const target of ['settingsLanguage','themeToggle','#settingsTourPreferences']){
    app.window.MerSettings.selectTab('general');
    app.window.MerPopupLayout.revealTarget(target);
    assert.equal(app.tabs.at(-1),'general',`${target} must remain in General`);
  }
});
