'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

test('split actions, lifecycle hooks, modal code and assets are removed from the shipped app',()=>{
  for(const file of ['app.js','engagement-ui.js','engagement-init.js','enterprise-ui.js','plan-navigation.js','index.html','scripts/build.js','scripts/preflight.js']) {
    assert.doesNotMatch(read(file),/MerBillSplit|bill-split|transactionSplitSubmit|splitSubmit|Podijeli račun|Podjela računa|bwip-js|MerHousehold|mutateHousehold|household-(?:ui|core)|merHouseholdDialog|Kućanstvo/,file);
  }
  for(const file of ['bill-split-core.js','bill-split-ui.js','bill-split.css','assets/bwip-js-4.11.4.min.js','household-core.js','household-ui.js','household.css'])assert.equal(fs.existsSync(path.join(__dirname,'..',file)),false,file);
  assert.match(read('invoice-ui.js'),/root\.qrcode/,'unrelated invoice preview encoder is preserved');
  assert.match(read('index.html'),/qrcode/,'invoice QR asset remains registered');
});

test('Activity uses the tested formatter and offers exactly one edit action without a split wrapper',()=>{
  const source=read('app.js');
  assert.match(source,/amountLabel=MerCore\.formatTransactionAmount\(tx,/);
  assert.match(source,/currency:tx\.currency\|\|appState\.settings\.currency\|\|'EUR'/,'itemized records never pretend a foreign amount was converted');
  assert.match(source,/class="transaction-amount \$\{type\}" data-monetary>\$\{escapeHtml\(amountLabel\)\}/);
  assert.doesNotMatch(read('engagement-ui.js'),/enhanceActivity|transaction-row-actions/);
  assert.doesNotMatch(read('engagement.css'),/transaction-row-actions/);
  assert.match(read('natural-input-ui.js'),/applyTransactionDraft/,'regular sentence entry stays available');
});

test('responsive rows reserve complete monetary text and accessible edit controls',()=>{
  const css=read('minimal-activity.css');
  assert.match(css,/grid-template-columns:40px minmax\(0,1fr\) minmax\(90px,\.45fr\) max-content 44px/);
  assert.match(css,/white-space:nowrap/);assert.match(css,/overflow:visible/);assert.match(css,/text-overflow:clip/);
  assert.match(css,/font-variant-numeric:tabular-nums/);assert.match(css,/min-height:44px/);
  assert.match(css,/@media \(max-width:520px\)/);
  assert.match(css,/\.transaction-amount \{ grid-column:2; grid-row:2;/,'small screens give the complete amount its own row');
  assert.match(read('index.html'),/minimal-activity\.css/);
  assert.match(read('scripts/build.js'),/minimal-activity\.css/);
});
