'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');const ui=read('vaults-ui.js'),css=read('vaults-ui.css'),premium=read('premium.js');
test('vault manager bounds unlimited goals with search and six-per-page navigation',()=>{
  assert.match(ui,/PAGE_SIZE=6/);assert.match(ui,/id='vaultsModal'/);assert.match(ui,/vaultsSearch/);assert.match(ui,/vaultsPrev/);assert.match(ui,/vaultsNext/);assert.match(ui,/filtered\.slice\(page\*PAGE_SIZE/);assert.match(premium,/slice\(0,2\)\.map/);
});
test('vault forms expose icon, dates, EUR 1/5 roundups, payday percentage destinations and explicit opt-in',()=>{
  assert.match(ui,/goalIconInput/);assert.match(ui,/vaultsRoundEnabled/);assert.match(ui,/value="1"/);assert.match(ui,/value="5"/);assert.match(ui,/vaultsPaydayMinimum/);assert.match(ui,/data-vault-allocation-percent/);assert.match(ui,/configurePaydayRule/);assert.match(ui,/configureRoundUps/);assert.match(premium,/profileId:appState.activeAccount,roundUpsEnabled:false/);
  assert.match(ui,/step='0\.01'/);
});
test('modal supports Escape, safe backdrop selection, live profile invalidation and existing reactive store',()=>{
  assert.match(ui,/bindDialogBackdropDismiss\(dialog,close\)/);assert.match(ui,/addEventListener\('cancel'/);assert.match(ui,/owner!==s\.profileId/);assert.match(premium,/reactiveStore\.update\(reason/);assert.match(premium,/MerVaultsUI\?\.refresh/);
});
test('responsive vault dialog has one scroll body, visible footer and touch-sized buttons',()=>{
  assert.match(css,/max-height:90dvh/);assert.match(css,/vaults-body\{min-height:0;overflow-y:auto;overflow-x:hidden/);assert.match(css,/vaults-footer.*flex:0 0 auto/);assert.match(css,/min-height:44px/);assert.match(css,/@media\(max-width:767px\)/);assert.match(css,/vaults-grid\{grid-template-columns:1fr/);assert.doesNotMatch(css,/var\(--surface\)|var\(--text\)/);
});
