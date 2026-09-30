'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../premium.js'), 'utf8');
const css = fs.readFileSync(require.resolve('../modal-space.css'), 'utf8');

// Run the existing navigation functions, not a duplicate implementation. The
// fixture records modal transitions while retaining the same draft objects.
function navigationFixture({transactionOpen=false, settingsOpen=false, staged=true}={}) {
  const events = [], timers = [];
  const draft = {name:'Synthetic groceries', amount:'18.50', category:'food'};
  const stage = {profileId:'personal', rows:[{name:'Synthetic staged item', amount:42, included:true}]};
  const state = Object.freeze({accountLabel:'personalAccount', transactions:Object.freeze([])});
  const nodes = new Map([
    ['transactionModal', {id:'transactionModal', open:transactionOpen, draft}],
    ['bankSettingsModal', {id:'bankSettingsModal', open:settingsOpen, selectedTab:'personal'}],
    ['importDataModal', {id:'importDataModal', open:false}],
    ['importTransactionBackWrap', {hidden:true}],
    ['importProfileBadge', {textContent:''}],
    ['transactionName', {value:draft.name, focus:options=>events.push(['focus', options.preventScroll])}]
  ]);
  const context = {
    $:selector=>nodes.get(selector.slice(1)), state, appState:{activeAccount:'personal'},
    closeCardMenus:()=>events.push(['menus']),
    closeModal:dialog=>{dialog.open=false;events.push(['close', dialog.id]);},
    openModal:dialog=>{dialog.open=true;events.push(['open', dialog.id]);},
    renderImportReview:()=>events.push(['review']),
    showToast:message=>events.push(['toast', message]), t:key=>key,
    setTimeout:callback=>timers.push(callback),
    window:{MerExportUI:{openActivityTransfer:()=>events.push(['transfer'])}},
    MerImport:{
      stageBelongsToProfile:(candidate,profile)=>candidate.profileId===profile,
      commitReviewStage:()=>assert.fail('Navigation must never commit a staged import')
    },
    save:()=>assert.fail('Navigation must never save or mutate financial state')
  };
  const declarationsStart=source.indexOf('  let importStage = null;');
  const declarationsEnd=source.indexOf('  let editingGoalId = null;', declarationsStart);
  const functionsStart=source.indexOf('  function openGlobalImport(');
  const functionsEnd=source.indexOf('  function categoryOptions(', functionsStart);
  assert.ok(declarationsStart>=0 && declarationsEnd>declarationsStart);
  assert.ok(functionsStart>=0 && functionsEnd>functionsStart);
  vm.createContext(context);
  vm.runInContext(`${source.slice(declarationsStart,declarationsEnd)}
${source.slice(functionsStart,functionsEnd)}
function seedStage(value) { importStage=value; }
function navigationState() { return {importStage,returnToTransactionEntry,returnToImportSettings}; }`, context);
  context.seedStage(staged?stage:null);
  return {
    context, events, draft, stage, state,
    get:id=>nodes.get(id),
    flush:()=>{while(timers.length)timers.shift()();}
  };
}

test('activity import always exposes Back and returns to transfer choices without committing staged data',()=>{
  const h=navigationFixture();
  h.context.openGlobalImport();
  assert.equal(h.get('importTransactionBackWrap').hidden,false);
  assert.equal(h.get('importDataModal').open,true);
  assert.equal(h.context.navigationState().importStage,h.stage);
  assert.equal(h.get('importProfileBadge').textContent,'personalAccount');
  h.events.length=0;
  h.context.backToManualTransaction();
  assert.deepEqual(h.events,[['close','importDataModal'],['transfer']]);
  assert.equal(h.get('importDataModal').open,false);
  assert.equal(h.get('importTransactionBackWrap').hidden,true);
  assert.equal(h.context.navigationState().returnToTransactionEntry,false);
  assert.equal(h.context.navigationState().returnToImportSettings,false);
  assert.equal(h.context.navigationState().importStage,h.stage);
  assert.deepEqual(h.stage.rows,[{name:'Synthetic staged item',amount:42,included:true}]);
  assert.deepEqual(h.state.transactions,[]);
});

test('transaction return retains the original unsaved form and restores focus only after reopening it',()=>{
  const h=navigationFixture({transactionOpen:true,settingsOpen:true});
  h.context.openGlobalImport({fromTransaction:true});
  assert.equal(h.get('transactionModal').open,false);
  assert.equal(h.get('bankSettingsModal').open,false);
  assert.equal(h.context.navigationState().returnToImportSettings,false,'the transaction origin has priority');
  h.events.length=0;
  h.context.backToManualTransaction();
  assert.deepEqual(h.events,[['close','importDataModal'],['open','transactionModal']]);
  assert.equal(h.get('transactionModal').draft,h.draft);
  assert.deepEqual(h.draft,{name:'Synthetic groceries',amount:'18.50',category:'food'});
  assert.equal(h.get('transactionName').value,'Synthetic groceries');
  assert.equal(h.context.navigationState().importStage,h.stage);
  h.flush();
  assert.deepEqual(h.events.at(-1),['focus',true]);
});

test('settings return reopens the existing settings view without resetting its selected tab',()=>{
  const h=navigationFixture({settingsOpen:true,staged:false});
  h.context.openGlobalImport();
  assert.equal(h.get('bankSettingsModal').open,false);
  assert.equal(h.get('importTransactionBackWrap').hidden,false);
  assert.equal(h.context.navigationState().returnToImportSettings,true);
  h.events.length=0;
  h.context.backToManualTransaction();
  assert.deepEqual(h.events,[['close','importDataModal'],['open','bankSettingsModal']]);
  assert.equal(h.get('bankSettingsModal').selectedTab,'personal');
  assert.equal(h.context.navigationState().returnToImportSettings,false);
});

test('a later activity entry cannot inherit an abandoned transaction or settings return context',()=>{
  for(const origin of ['transaction','settings']) {
    const h=navigationFixture({transactionOpen:origin==='transaction',settingsOpen:origin==='settings'});
    h.context.openGlobalImport({fromTransaction:origin==='transaction'});
    h.context.closeModal(h.get('importDataModal'));
    h.context.openGlobalImport();
    assert.equal(h.context.navigationState().returnToTransactionEntry,false);
    assert.equal(h.context.navigationState().returnToImportSettings,false);
    h.events.length=0;
    h.context.backToManualTransaction();
    assert.deepEqual(h.events,[['close','importDataModal'],['transfer']]);
    assert.equal(h.context.navigationState().importStage,h.stage);
  }
});

test('import surface fits its active content with viewport limits and a compact empty-upload width',()=>{
  const modal=/html body dialog#importDataModal\[open\]:not\(\.tour-modal-host\)\s*\{([^}]+)\}/.exec(css)?.[1];
  assert.ok(modal,'the scoped override must beat the shared full-height modal rule');
  for(const property of ['height:fit-content','block-size:fit-content','min-height:0','min-block-size:0','inset:0','margin:auto','overflow:hidden'])assert.ok(modal.includes(property),property);
  assert.match(modal,/max-height:calc\(var\(--ui-visual-height,100dvh\) - 20px\)/);
  assert.match(modal,/max-block-size:calc\(var\(--ui-visual-height,100dvh\) - 20px\)/);
  assert.match(css,/#importDataModal\[open\]:not\(\.has-import-review\):not\(\.tour-modal-host\)\s*\{\s*width:min\(800px,calc\(100vw - 20px\)\)/);
  assert.match(css,/#importDataModal > \.import-workspace\s*\{\s*flex:0 0 auto/);
});

test('import header reserves the close control and its navigation footer stays in normal flow',()=>{
  assert.match(css,/#importDataModal > \.settings-pane-heading\s*\{[^}]*padding-right:56px;[^}]*align-items:flex-start;[^}]*gap:12px;[^}]*flex-shrink:0;/);
  assert.match(css,/html body #importDataModal > \.import-commit-actions\s*\{\s*position:static;\s*margin:12px 0 0;\s*padding:12px 0 0;/);
});
