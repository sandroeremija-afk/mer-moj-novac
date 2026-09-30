'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../enterprise-ui.js'),'utf8');
const css=fs.readFileSync(require.resolve('../enterprise.css'),'utf8');
const renderSource=source.slice(source.indexOf('  function renderTaxVault(){'),source.indexOf('  function openTaxVault()'));

function harness(profile='business'){
  const nodes=new Map(),writes=[];
  const el=id=>{
    if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',listeners:{},addEventListener(type,handler){this.listeners[type]=handler;}});
    return nodes.get(id);
  };
  const state={goalBuckets:[{current:50,taxVault:true},{current:75,taxVault:true},{current:500,taxVault:false}],enterprise:{taxVault:{enabled:false,currency:'EUR',startDate:'2026-01-01'}}};
  const appState={activeAccount:profile,settings:{currency:'EUR'}},taxDialog={open:true};
  const context={state,appState,taxDialog,el,copy:hr=>hr,currency:value=>`${Number(value).toFixed(2)} EUR`,appReferenceDate:'2026-09-30',save:reason=>writes.push(reason),closeModal:dialog=>{dialog.open=false;}};
  vm.runInNewContext(`${renderSource}\nrenderTaxVault();`,context);
  return {state,appState,taxDialog,nodes,writes};
}

test('tax vault wider presentation preserves actual reserves, explicit gross-tax math and the original toggle semantics',()=>{
  const app=harness(),html=app.nodes.get('planTaxBody').innerHTML;
  assert.match(html,/class="tax-vault-reserve"/);assert.match(html,/class="tax-vault-calculation"/);
  assert.match(html,/125\.00 EUR/);assert.doesNotMatch(html,/625\.00 EUR/);
  assert.match(html,/iznos × 25 \/ 125/);assert.match(html,/1250\.00 EUR/);assert.match(html,/250\.00 EUR/);
  assert.match(html,/Virtualna pričuva nije porezna prijava ni bankovni prijenos/);
  assert.deepEqual(app.writes,[],'opening the informational layout must never reserve or transfer money');
  app.nodes.get('planTaxVaultToggle').listeners.change({target:{checked:true}});
  assert.equal(app.state.enterprise.taxVault.enabled,true);assert.equal(app.state.enterprise.taxVault.rate,25);
  assert.equal(app.state.enterprise.taxVault.startDate,'2026-01-01');assert.equal(app.state.enterprise.taxVault.currency,'EUR');
  assert.deepEqual(app.writes,['tax-vault-toggle']);
  assert.equal(app.state.goalBuckets[0].current,50);assert.equal(app.state.goalBuckets[1].current,75);
});

test('tax vault closes without exposing business totals after a personal profile switch',()=>{
  const app=harness('personal');assert.equal(app.taxDialog.open,false);assert.equal(app.nodes.size,0);assert.deepEqual(app.writes,[]);
});

test('tax vault uses bounded responsive width and separate desktop columns without a forced tall canvas',()=>{
  assert.match(css,/#taxVaultModal\[open\]:not\(\.tour-modal-host\)\{width:min\(1040px,calc\(100vw - 32px\)\);height:fit-content;block-size:fit-content;min-height:0;min-block-size:0/);
  assert.match(css,/#planTaxBody\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
  assert.match(css,/#planTaxBody \.enterprise-b2b\{[^}]*flex-direction:row/);
  assert.match(css,/@media\(max-width:640px\)\{[\s\S]*?#planTaxBody\{grid-template-columns:minmax\(0,1fr\)/);
});
