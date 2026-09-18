'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Security=require('../security-core.js');
const premium=fs.readFileSync(require.resolve('../premium.js'),'utf8');
const css=fs.readFileSync(require.resolve('../settings-enhancements.css'),'utf8');
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');

function harness(options={}) {
  const nodes=new Map(),node=selector=>{
    if(!nodes.has(selector))nodes.set(selector,{hidden:false,textContent:'',innerHTML:'',attributes:{},classList:{toggle(){}},setAttribute(key,value){this.attributes[key]=value;}});
    return nodes.get(selector);
  };
  const choices=['authenticator','sms'].map(method=>Object.assign(node(method),{dataset:{mfaMethod:method}}));
  const context=vm.createContext({
    appState:{mfa:{enabled:false}},selectedMfaMethod:'authenticator',pendingEnrollment:null,
    pendingSmsChallenge:null,pendingSmsDisableChallenge:null,visibleRecoveryCodes:[],
    MerSecurity:Security,$:node,$$:()=>choices,t:key=>key,window:{MerMfaRecoveryLayout:{refresh(){}}},...options
  });
  const first=premium.indexOf('  function renderMfa()'),last=premium.indexOf('  function renderActiveSessions()',first);
  assert.ok(first>=0&&last>first);
  vm.runInContext(premium.slice(first,last),context);
  return {context,node,choices,render:()=>context.renderMfa()};
}

test('MFA rendering cleanly switches original mounted setup cards without enabling security',()=>{
  const h=harness();
  h.render();assert.equal(h.node('#startMfa').hidden,false);assert.equal(h.node('#mfaSetup').hidden,true);
  h.context.pendingEnrollment={secret:'JBSWY3DPEHPK3PXP'};h.render();
  assert.equal(h.node('#mfaSetup').hidden,false);assert.equal(h.node('#mfaSmsSetup').hidden,true);
  assert.equal(h.node('#mfaSecret').textContent,'JBSW Y3DP EHPK 3PXP');
  h.context.selectedMfaMethod='sms';h.context.pendingEnrollment=null;h.render();
  assert.equal(h.node('#mfaSetup').hidden,true);assert.equal(h.node('#mfaSmsSetup').hidden,false);
  assert.equal(h.node('#mfaSmsVerify').hidden,true);assert.equal(h.node('#startMfa').hidden,true);
  h.context.pendingSmsChallenge={demoCode:'123456',maskedPhone:'+385 *** 5678'};h.render();
  assert.equal(h.node('#mfaSmsVerify').hidden,false);
  assert.equal(h.node('.security-card [data-i18n="mfaDescription"]').textContent,'smsMfaDescription');
  assert.equal(h.context.appState.mfa.enabled,false,'opening and selecting methods cannot enable authentication');
  assert.equal(h.choices[1].attributes['aria-pressed'],'true');
});

test('enabled MFA renders only verification management and immutable method choice',()=>{
  for(const method of ['authenticator','sms']){
    const h=harness({appState:{mfa:{enabled:true,method}},selectedMfaMethod:method==='sms'?'authenticator':'sms'});
    h.render();
    assert.equal(h.node('#mfaSetup').hidden,true);assert.equal(h.node('#mfaSmsSetup').hidden,true);
    assert.equal(h.node('#mfaDisable').hidden,false);
    assert.equal(h.node('#sendMfaDisableSmsCode').hidden,method!=='sms');
    assert.equal(h.node('#mfaDisableCodeLabel').textContent,method==='sms'?'disableSmsCode':'disableCode');
    assert.ok(h.choices.every(choice=>choice.disabled));
  }
});

test('recovery codes retain their original visibility contract and local SMS disclosure remains honest',()=>{
  const h=harness({visibleRecoveryCodes:['ABCD-EFGH','IJKL-MNOP']});h.render();
  assert.equal(h.node('#recoveryPanel').hidden,false);assert.match(h.node('#recoveryCodes').innerHTML,/ABCD-EFGH/);
  h.context.visibleRecoveryCodes=[];h.render();
  assert.equal(h.node('#recoveryPanel').hidden,true);assert.equal(h.node('#recoveryCodes').innerHTML,'');
  assert.match(premium,/smsMfaDescription:'Lokalni SMS demo adapter/);
  assert.match(html,/id="mfaSmsDemoDelivery" role="status" aria-live="polite"/);
  assert.doesNotMatch(html,/id="mfaQr"/,'manual TOTP secret is not misrepresented as a working QR code');
});

test('MFA dedicated dialog has independent responsive white card styles after nodes leave Settings',()=>{
  const start=css.indexOf('/* MFA controls are moved'),end=css.indexOf('@media(max-width:800px)',start);
  const scope=css.slice(start,end);
  assert.match(scope,/#settings-mfa-flow \.security-card\s*\{\s*display:grid;grid-template-columns:minmax\(0,1fr\) auto/);
  assert.match(scope,/#settings-mfa-flow \[hidden\] \{ display:none!important;/);
  assert.match(scope,/--ink:#18332b;--muted:#4a5d55/);
  assert.match(scope,/background:#fff;color:var\(--ink\)/);
  assert.match(scope,/@media\(max-width:600px\)/);
  assert.match(scope,/grid-template-columns:minmax\(0,1fr\) 120px/);
  assert.match(scope,/min-width:0;min-height:44px/);
  assert.doesNotMatch(scope,/overflow(?:-y)?:\s*(?:auto|scroll)/);
  assert.match(scope,/overflow-wrap:anywhere/,'long authenticator secrets must wrap inside their own card');
});
