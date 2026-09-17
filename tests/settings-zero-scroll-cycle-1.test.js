'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {topicForTarget,securityFlowForTarget}=require('../popup-layout.js');
const {importPageSizeFor,paginateRules}=require('../settings-enhancements.js');

test('settings deep links reveal the complete page or original security form',()=>{
  const routes=[
    ['baseCurrency','general'],['settingsLanguage','general'],
    ['themeToggle','general'],['settingsTourPreferences','general'],
    ['layoutEditToggle','general'],['hideBalances','general'],
    ['personalFirstName','personal'],['personalDataStorage','personal'],
    ['exportSovereignty','personal'],['deleteSovereignty','personal'],
    ['resetDemoData','personal']
  ];
  for(const [id,topic] of routes)assert.equal(topicForTarget(id),topic,id);
  assert.equal(topicForTarget('recoveryCodes'),'access');assert.equal(topicForTarget('mfaDisableCode'),'access');
  assert.equal(securityFlowForTarget('currentPasswordInput'),'password');assert.equal(securityFlowForTarget('mfaDisableCode'),'mfa');assert.equal(securityFlowForTarget('logoutOtherSessions'),'sessions');assert.equal(securityFlowForTarget('autoLockEnabled'),'device');
});

test('a 520-row import stays fully reachable on phone, compact desktop, and desktop pages',()=>{
  const rows=Array.from({length:520},(_,index)=>({id:index,name:`Entry ${index}`,excluded:false}));
  for(const [width,height,expectedSize] of [[375,667,1],[390,844,1],[1440,700,3],[1440,900,4]]){
    const size=importPageSizeFor(width,height),visited=[];assert.equal(size,expectedSize);
    const pages=paginateRules(rows,1,size).pages;
    for(let page=1;page<=pages;page++)visited.push(...paginateRules(rows,page,size).items.map(row=>row.id));
    assert.deepEqual(visited,rows.map(row=>row.id));
    const selected=paginateRules(rows,pages,size).items.at(-1);selected.name='Reviewed';selected.excluded=true;
    assert.equal(rows[519].name,'Reviewed');assert.equal(rows[519].excluded,true);
  }
  assert.equal(rows.length,520);
});

test('focused security dialogs move mounted forms and retain recovery and import controls',()=>{
  const popup=fs.readFileSync(require.resolve('../popup-layout.js'),'utf8');
  assert.match(popup,/nodes\.filter\(Boolean\)\.forEach\(node=>view\.append\(node\)\)/);
  assert.doesNotMatch(popup,/cloneNode|localStorage|\.reset\(/);
  for(const id of ['personalDataForm','changePasswordForm','settingsTourMfa','bulkOverrideConfirmation','bulkOverrideUndoBar'])assert.ok(popup.includes(id),id);
  assert.match(popup,/mfaNodes=\[\.\.\.mfaSummary\.children\]/);
  assert.match(popup,/entry\.button\.tabIndex=active\?0:-1/);
  assert.match(popup,/dialog\.addEventListener\('invalid',event=>/);
  assert.match(popup,/views\.filter\(item=>!item\.button\.disabled\)/);
  assert.match(popup,/document\.body\.append\(flow\);nodes\.filter\(Boolean\)/);
  assert.match(popup,/if\(!record\.flow\.open\)record\.flow\.showModal\(\)/);
  assert.doesNotMatch(popup,/generalViews|personalViews|security-access-tabs|settings-topic-picker/);
  assert.match(popup,/\['ArrowLeft','ArrowRight','Home','End'\]/);
  const premium=fs.readFileSync(require.resolve('../premium.js'),'utf8');
  assert.match(premium,/itemSelector:'\.active-session-item'/);assert.match(premium,/itemSelector:'\.goal-bucket-card'/);
  assert.doesNotMatch(premium,/goalBucketGrid[^\n]+slice\(0,2\)/);
  assert.match(premium,/const firstRow=importPage\*importPageSize/);
});
