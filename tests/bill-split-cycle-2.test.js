'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Core=require('../bill-split-core.js');
const bwip=require('../assets/bwip-js-4.11.4.min.js');
const payment={amountCents:12355,currency:'EUR',recipientName:'Željko Seneković',recipientAddress:'Ivanečka ulica 125',recipientCity:'42000 Varaždin',iban:'HR1210010051863000160',model:'HR00',reference:'2026-9',description:'Povrat zajedničkog troška'};
function decodeByteMode(words) {
  assert.ok([901,924].includes(words[0]));const bytes=[],input=words.slice(1);
  // 901 allows a final group of one to five direct bytes; 924 groups are always five codewords.
  const groups=words[0]===924 ? input.length/5 : Math.floor((input.length-1)/5);
  for(let i=0;i<groups;i++) {let value=0n;for(const word of input.slice(i*5,i*5+5))value=value*900n+BigInt(word);const chunk=Array(6);for(let j=5;j>=0;j--){chunk[j]=Number(value%256n);value/=256n;}bytes.push(...chunk);}
  bytes.push(...input.slice(groups*5));return new TextDecoder('utf-8',{fatal:true}).decode(new Uint8Array(bytes));
}
test('cycle 2: genuine HUB3 payload has 14 LF-terminated fields, UTF-8 byte compaction and fixed PDF417 parameters',()=>{
  const result=Core.hub3(payment);assert.equal(result.fields.length,14);assert.equal(result.payload.split('\n').length,15);
  assert.equal(result.fields[0],'HRVHUB30');assert.equal(result.fields[1],'EUR');assert.equal(result.fields[2],'000000000012355');
  assert.equal(result.fields[6],payment.recipientName);assert.equal(result.fields[9],payment.iban);
  assert.equal(decodeByteMode(Core.pdf417Codewords(result.payload)),result.payload);
  assert.deepEqual([result.options.columns,result.options.eclevel,result.options.fixedeclevel,result.options.rowmult],[9,4,true,3]);
  const svg=bwip.toSVG(result.options);assert.match(svg,/<svg/);assert.match(svg,/<path/);assert.match(svg,/<rect[^>]+#FFFFFF/i);
  const raw=bwip.raw(result.options)[0];assert.equal(raw.pixx,222);assert.equal(raw.pixy%3,0);assert.ok(raw.pixs.includes(1)&&raw.pixs.includes(0));
  assert.ok(raw.pixy<=96,'HUB3 max 32 rows at 3:1 module aspect ratio');
});
test('cycle 2: binary compaction round-trips ASCII and Croatian UTF-8 at all six-byte boundaries',()=>{
  for(let n=1;n<40;n++) for(const value of ['A'.repeat(n),'Štednja čćđšž '.repeat(n)]) assert.equal(decodeByteMode(Core.pdf417Codewords(value)),value);
});
test('cycle 2: HUB3 validates Croatian IBAN checksum, limits, currency, reference and unsafe characters',()=>{
  assert.equal(Core.validIban(payment.iban),true);assert.equal(Core.validIban('HR0010010051863000160'),false);assert.equal(Core.validIban('DE89370400440532013000'),false);
  assert.equal(Core.hub3({...payment,recipientName:'Č'.repeat(25)}).fields[6].length,25,'character limit is not byte length');
  for(const fields of [{recipientName:'Č'.repeat(26)},{description:'x'.repeat(36)},{recipientName:'A\nB'},{description:'😀'},{currency:'USD'},{model:'HR01'},{model:'HR99',reference:'123'},{reference:'ABC'},{reference:'1'.repeat(23)},{iban:'HR0010010051863000160'}]) assert.throws(()=>Core.hub3({...payment,...fields}));
  assert.equal(Core.hub3({...payment,model:'HR99',reference:''}).fields[10],'HR99');
});
test('cycle 2: EPC SEPA QR is bank-readable payment payload, not arbitrary invoice metadata',()=>{
  const result=Core.epc(payment),lines=result.payload.split('\n');
  assert.deepEqual(lines.slice(0,5),['BCD','002','1','SCT','']);assert.equal(lines[5],payment.recipientName);assert.equal(lines[6],payment.iban);assert.equal(lines[7],'EUR123.55');
  assert.equal(result.payload.endsWith('\n'),false);assert.ok(new TextEncoder().encode(result.payload).length<=331);assert.equal(result.options.eclevel,'M');
  const svg=bwip.toSVG(result.options);assert.match(svg,/<path/);const raw=bwip.raw(result.options)[0];assert.equal(raw.pixx,raw.pixy);assert.ok(raw.pixx<=69,'EPC limits QR to version 13');
  assert.throws(()=>Core.epc({...payment,iban:'CH9300762011623852957'}),/INVALID_BIC/);
  assert.doesNotThrow(()=>Core.epc({...payment,iban:'CH9300762011623852957',bic:'POFICHBEXXX'}));
  assert.throws(()=>Core.epc({...payment,recipientName:'Č'.repeat(70),description:'Č'.repeat(140)}),/PAYLOAD_TOO_LONG/);
  assert.throws(()=>Core.epc({...payment,description:'one\ntwo'}),/INVALID_PAYMENT_FIELD/);
});
test('cycle 2: bill dialog delegates canonical modal lifecycle, keeps stale codes hidden and exports only verified payment data',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../bill-split-ui.js'),'utf8');
  assert.match(source,/bindDialogBackdropDismiss\(dialog,close\)/);assert.match(source,/addEventListener\('cancel'/);
  assert.match(source,/ownerKey\(state\) === owner/);assert.match(source,/split\.revision !== payment\.revision/);
  assert.match(source,/catch \(error\) \{ invalidateCode\(\); showError/);assert.match(source,/function downloadCode\(\) \{\s*verifyPayment\(\)/);
  assert.match(source,/core\.save\(profile,captured,input\)/);assert.match(source,/core\.settle\(profile,captured,input\)/);
  assert.doesNotMatch(source,/fetch\(|transactions\.push|income.*push|localStorage\.setItem/);
  const css=fs.readFileSync(path.join(__dirname,'../bill-split.css'),'utf8');
  assert.match(css,/#billSplitModal \[hidden\] \{ display:none !important;/);assert.match(css,/max-height:90dvh/);assert.match(css,/min-height:44px/);assert.match(css,/overflow-x:hidden/);
});
test('cycle 2: UI refuses anonymous and locked sessions before opening a dialog',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../bill-split-ui.js'),'utf8');let calls=0;
  const root={MerBillSplits:Core,document:{createElement(){calls++;throw new Error('unexpected dialog');}},MerEngagementBridge:{snapshot:()=>({authenticated:false})},addEventListener(){}};
  vm.runInNewContext(source,{window:root});assert.equal(root.MerBillSplitUI.open('meal'),false);assert.equal(calls,0);
  root.MerEngagementBridge.snapshot=()=>({authenticated:true,profile:{},userId:'u1',profileId:'personal'});root.MerEnterpriseSecurity={isLocked:()=>true};
  assert.equal(root.MerBillSplitUI.open(),false);assert.equal(calls,0);
});
test('cycle 2: barcode preview isolates filled black modules from global icon styles and preserves white background',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../bill-split.css'),'utf8');
  const globalCss=fs.readFileSync(path.join(__dirname,'../styles.css'),'utf8');
  assert.match(globalCss,/svg\s*\{[^}]*fill:\s*none;[^}]*stroke:\s*currentColor/,'regression setup includes the inherited icon reset');
  assert.match(css,/#billSplitModal \[data-barcode-svg\] svg\s*\{[^}]*fill:#000;[^}]*stroke:none;[^}]*stroke-width:0;/);
  assert.match(css,/#billSplitModal \[data-barcode-svg\] svg path\s*\{[^}]*fill:#000;[^}]*stroke:none;/);
  assert.match(css,/#billSplitModal \[data-barcode-svg\] svg rect\s*\{[^}]*fill:#fff;[^}]*stroke:none;/);
  const svg=bwip.toSVG(Core.hub3(payment).options);
  assert.match(svg,/<rect[^>]+fill="#FFFFFF"/);assert.doesNotMatch(svg,/<script|<foreignObject|(?:href|src)="https?:/);
});
test('cycle 2: generated code is announced and revealed inside the scroll body, respecting motion preferences and stale state',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../bill-split-ui.js'),'utf8');
  assert.match(source,/heading\.tabIndex = -1/);assert.match(source,/heading\.focus\(\{preventScroll:true\}\)/);
  assert.match(source,/preview\.setAttribute\('aria-labelledby',heading\.id\)/);
  assert.match(source,/body\.scrollTo\(\{top,behavior\}\)/);assert.doesNotMatch(source,/scrollIntoView/);
  assert.match(source,/prefers-reduced-motion: reduce/);assert.match(source,/payment\?\.code !== prepared/);
  assert.match(source,/prepared = payment\.code/);assert.match(source,/root\.requestAnimationFrame\(reveal\)/);
});
