'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Core = require('../export-core.js');
const source = fs.readFileSync(require.resolve('../export-ui.js'), 'utf8');
const css = fs.readFileSync(require.resolve('../export-ui.css'), 'utf8');

// Run the production handlers with real export calculations and a minimal DOM.
class Element {
  constructor(tag, document) {
    this.tagName = tag.toLowerCase(); this.document = document; this.children = []; this.attributes = {};
    this.listeners = new Map(); this.open = false; this.hidden = false; this.disabled = false; this.value = ''; this.className = ''; this.id = ''; this._text = '';
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (['id','type','value','min','max','name'].includes(name)) this[name] = value;
    if (name === 'class') this.className = value;
    if (['disabled','hidden'].includes(name)) this[name] = true;
  }
  getAttribute(name) {return this.attributes[name] ?? null;}
  removeAttribute(name) {delete this.attributes[name];}
  append(...children) {children.forEach(child => {child.parentElement = this; this.children.push(child);});}
  remove() {if(this.parentElement)this.parentElement.children = this.parentElement.children.filter(child => child !== this);this.parentElement = null;}
  set textContent(value) {this._text=String(value);this.children=[];}
  get textContent() {return this._text + this.children.map(child => child.textContent).join('');}
  set innerHTML(value) {
    this._html = value; this.children = []; const stack = [this], voidTags = new Set(['input','br','hr','img','meta','link']);
    for (const match of value.matchAll(/<(\/?)([a-z][\w-]*)(\s+(?:[^>"']|"[^"]*"|'[^']*')*)?\s*(\/?)>/gi)) {
      const [, closing, tag, raw = '', selfClosing] = match;
      if (closing) {if(stack.length>1)stack.pop();continue;}
      const child = new Element(tag, this.document);
      for (const attribute of raw.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) child.setAttribute(attribute[1],attribute[2]??attribute[3]??attribute[4]??'');
      stack.at(-1).append(child);
      if(!voidTags.has(tag.toLowerCase())&&!selfClosing)stack.push(child);
    }
  }
  get innerHTML() {return this._html || '';}
  matches(selector) {
    if(selector.startsWith('#'))return this.id===selector.slice(1);
    if(selector.startsWith('.'))return this.className.split(/\s+/).includes(selector.slice(1));
    if(selector==='dialog:not([open])')return this.tagName==='dialog'&&!this.open;
    const attribute=selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if(attribute)return Object.hasOwn(this.attributes,attribute[1])&&(attribute[2]===undefined||this.attributes[attribute[1]]===attribute[2]);
    return this.tagName===selector;
  }
  querySelectorAll(selector) {const found=[];this.children.forEach(child=>{if(child.matches(selector))found.push(child);found.push(...child.querySelectorAll(selector));});return found;}
  querySelector(selector) {return this.querySelectorAll(selector)[0]||null;}
  closest(selector) {return this.matches(selector)?this:this.parentElement?.closest(selector)||null;}
  get isConnected() {return this===this.document.body||Boolean(this.parentElement?.isConnected);}
  getClientRects() {return this.hidden||this.closest('dialog:not([open])')?[]:[{}];}
  focus() {this.document.activeElement=this;}
  addEventListener(type, callback) {if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(callback);}
  dispatch(type, extra = {}) {const event={target:this,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...extra};return {event,results:(this.listeners.get(type)||[]).map(callback=>callback(event))};}
  click() {if(this.disabled)return;if(this.tagName==='button')this.focus();if(this.tagName==='a')this.document.downloads.push({filename:this.download,url:this.href});return this.dispatch('click');}
  showModal() {assert.equal(this.document.body.querySelectorAll('dialog').filter(dialog=>dialog.open).length,0,'only one dialog can be open');this.open=true;}
  close() {this.open=false;this.dispatch('close');}
}
function harness() {
  const document={downloads:[],activeElement:null}; document.body=new Element('body',document);
  document.createElement=tag=>new Element(tag,document);document.getElementById=id=>document.body.querySelector(`#${id}`);
  const transactions=[{id:'income-1',profileId:'personal',date:'2026-09-08',name:'Plaća',type:'income',amount:1000,currency:'EUR',category:'salary'},{id:'expense-1',profileId:'personal',date:'2026-09-01',name:'Konzum',type:'expense',amount:150,currency:'EUR',category:'groceries'}];
  const state={profile:{accountName:'Moj eRačun',transactions,categories:[{id:'groceries',name:'Namirnice',limit:400}],savingsEntries:[{id:'save-1',date:'2026-09-07',amount:100,profileId:'personal'}]},profileId:'personal',referenceDate:'2026-09-08',currency:'EUR',language:'hr',timezone:'Europe/Zagreb',insightsTimeframe:'ytd',sessionId:'session-1',authenticated:true,revision:1};
  const blobs=new Map(),timers=[],revocations=[],imports=[],notifications=[],events=new Map(),reports=[],returnFocus=new WeakMap();
  let urlId=0,locked=false;
  const window={document,MerExportCore:{...Core,buildReport(options){reports.push(options);return Core.buildReport(options);}},
    MerRuntime:{bindDialogBackdropDismiss(dialog,callback){dialog.dismissBackdrop=callback;}},
    MerEnterpriseSecurity:{isLocked:()=>locked},
    MerExportBridge:{snapshot:()=>state,openModal:node=>{returnFocus.set(node,document.activeElement);node.showModal();node.querySelector('[autofocus]')?.focus();},closeModal:node=>node.close(),openImport:()=>imports.push('import'),onDownloaded:(report,format)=>notifications.push({report,format})},
    MerExportPdf:{create:async()=>new Uint8Array([37,80,68,70])},
    addEventListener(type,callback){events.set(type,callback);}
  };
  const context=vm.createContext({window,document,Intl,Date,Blob,setTimeout:(callback,delay)=>timers.push({callback,delay}),URL:{createObjectURL(blob){const url=`blob:test-${++urlId}`;blobs.set(url,blob);return url;},revokeObjectURL:url=>revocations.push(url)}});
  vm.runInContext(source,context);
  const get=id=>document.getElementById(id);
  const change=(id,value)=>{get(id).value=value;get(id).dispatch('change');};
  const submit=()=>Promise.all(get('exportForm').dispatch('submit').results);
  return {window,state,document,get,change,submit,blobs,timers,revocations,imports,notifications,reports,returnFocus,ui:window.MerExportUI,lock(){locked=true;events.get('mer-security-status')?.();}};
}
async function main() {
  {
    const h=harness();assert.equal(h.ui.openActivityTransfer(),true);
    assert.equal(h.get('activityTransferTitle').textContent,'Uvoz / Izvoz');
    assert.equal(h.get('activityTransferImportTitle').textContent,'Uvoz transakcija');
    assert.equal(h.get('activityTransferExportTitle').textContent,'Izvoz transakcija');
    assert.equal(h.document.downloads.length,0);
    h.get('activityTransferExport').click();
    assert.equal(h.get('activityTransferModal').open,false);assert.equal(h.get('izvozModal').open,true);assert.equal(h.get('exportBack').hidden,false);
    assert.equal(h.get('exportCancel').hidden,true,'the contextual footer has one visible Back action');
    assert.equal(h.get('izvozModal').querySelector('header').querySelector('#exportBack'),null);
    assert.equal(h.get('izvozModal').querySelector('footer').children[0],h.get('exportBack'));
    assert.equal(h.get('exportDownload').closest('form'),h.get('exportForm'),'moving Back must retain submit ownership');
    h.get('exportBack').click();assert.equal(h.get('izvozModal').open,false);assert.equal(h.get('activityTransferModal').open,true);
    h.get('activityTransferImport').click();assert.equal(h.get('activityTransferModal').open,false);assert.deepEqual(h.imports,['import']);
    assert.equal(h.document.downloads.length,0,'neither choice downloads before final confirmation');
  }
  {
    const h=harness();
    for(const context of ['budget','activity','savings','insights']) {
      assert.equal(h.ui.open(context),true);
      assert.equal(h.get('izvozModal').open,true);assert.equal(h.get('exportBack').hidden,true);assert.equal(h.get('exportCancel').hidden,false);assert.equal(h.get('exportCancel').textContent,'Zatvori');
      assert.deepEqual(h.get('exportTimeframe').querySelectorAll('option').map(node=>node.textContent),['Danas','Ovaj mjesec','Prethodni mjeseci','Ova godina','Sve ukupno']);
      assert.equal(h.get('exportMonthLabel').textContent,'Prethodni mjeseci');
      assert.deepEqual(h.get('exportFormat').querySelectorAll('option').map(node=>node.value),['csv','pdf','json']);
      assert.equal(h.document.downloads.length,0);h.get('exportCancel').click();
    }
    h.ui.open('insights');assert.equal(h.get('exportTimeframe').value,'ytd','Insights starts with its active timeframe');
    h.change('exportTimeframe','custom-month');assert.equal(h.get('exportMonthField').hidden,false);assert.equal(h.get('exportMonth').value,'');
    assert.equal(h.get('exportMonth').disabled,true);assert.equal(h.get('exportDownload').disabled,true,'current-month-only data has no previous-month choice');
    h.state.profile.transactions.push({date:'2026-02-28',amount:25,type:'expense'});h.state.revision+=1;h.ui.refresh();
    h.change('exportMonth','2026-02');assert.match(h.get('exportPeriod').textContent,/2026-02/);
    h.change('exportMonth','');assert.equal(h.get('exportDownload').disabled,true);assert.equal(h.get('exportError').hidden,false);await h.submit();assert.equal(h.document.downloads.length,0);
    h.change('exportMonth','2026-13');assert.equal(h.get('exportDownload').disabled,true);
    h.change('exportTimeframe','all');assert.equal(h.get('exportMonthField').hidden,true);assert.equal(h.get('exportDownload').disabled,false);
    h.get('izvozModal').dismissBackdrop();assert.equal(h.get('izvozModal').open,false);
    h.ui.open('budget');assert.equal(h.get('izvozModal').dispatch('cancel').event.defaultPrevented,true);assert.equal(h.get('izvozModal').open,false);
  }
  {
    const h=harness();h.ui.open('activity');h.change('exportFormat','json');
    h.state.profile.transactions.push({id:'income-new',profileId:'personal',date:'2026-09-08',type:'income',amount:200,currency:'EUR'});h.state.revision+=1;
    await h.submit();assert.equal(h.document.downloads.length,1);const downloaded=h.document.downloads[0];
    assert.match(downloaded.filename,/^Aktivnost_Transakcije_Mjesec_2026-09_personal\.json$/);
    const report=JSON.parse(await h.blobs.get(downloaded.url).text());assert.equal(report.recordCount,3,'submission uses current global state, not the old preview');
    assert.ok(report.sections[0].rows.some(row=>row.includes('income-new')));
    assert.equal(h.timers[0].delay,60000);assert.equal(h.revocations.length,0);h.timers[0].callback();assert.deepEqual(h.revocations,[downloaded.url]);
    assert.equal(h.notifications.length,1);assert.equal(h.get('exportDownload').disabled,false);
    h.change('exportFormat','csv');h.change('exportTimeframe','daily');await h.submit();
    const csv=await h.blobs.get(h.document.downloads[1].url).text();assert.match(csv,/"income-new"/);assert.doesNotMatch(csv,/"expense-1"/);
  }
  {
    const h=harness();h.ui.open('activity');h.state.profile.transactions=[];h.state.revision+=1;h.ui.refresh();
    assert.equal(h.get('exportCount').textContent,'Broj zapisa: 0');assert.equal(h.get('exportEmpty').hidden,false);assert.equal(h.get('exportDownload').disabled,false);
    h.change('exportFormat','pdf');await h.submit();assert.match(h.document.downloads[0].filename,/\.pdf$/);assert.equal(h.blobs.get(h.document.downloads[0].url).type,'application/pdf');
  }
  for(const mutation of ['close','profile','session','language','currency','revision','selection','locked','logout']) {
    const h=harness();let resolvePdf;
    h.window.MerExportPdf.create=()=>new Promise(resolve=>{resolvePdf=resolve;});
    h.ui.open('budget');h.change('exportFormat','pdf');const pending=h.submit();assert.equal(h.get('exportDownload').disabled,true);
    if(mutation==='close')h.get('exportCancel').click();
    if(mutation==='profile')h.state.profileId='business';
    if(mutation==='session')h.state.sessionId='session-2';
    if(mutation==='language')h.state.language='en';
    if(mutation==='currency')h.state.currency='USD';
    if(mutation==='revision')h.state.revision+=1;
    if(mutation==='selection')h.change('exportTimeframe','daily');
    if(mutation==='locked')h.lock();
    if(mutation==='logout')h.state.authenticated=false;
    resolvePdf(new Uint8Array([37,80,68,70]));await pending;
    assert.equal(h.document.downloads.length,0,`${mutation} must invalidate the pending PDF`);
    assert.equal(h.notifications.length,0);assert.equal(h.get('exportDownload').disabled,false);
  }
  {
    const h=harness();h.window.MerExportPdf.create=async()=>{throw new Error('offline font fetch');};h.ui.open('activity');h.change('exportFormat','pdf');await h.submit();
    assert.equal(h.get('exportError').hidden,false);assert.equal(h.get('exportDownload').disabled,false);assert.equal(h.document.downloads.length,0);
    h.change('exportFormat','json');await h.submit();assert.equal(h.document.downloads.length,1,'another format recovers after PDF failure');
    h.state.profileId='business';h.ui.refresh();assert.equal(h.get('izvozModal').open,false,'profile switching clears the old dialog');
    h.state.authenticated=false;assert.equal(h.ui.open('activity'),false);assert.equal(h.ui.openActivityTransfer(),false);
  }
  {
    const h=harness();h.state.language='en';h.ui.openActivityTransfer();assert.equal(h.get('activityTransferTitle').textContent,'Import / Export');h.get('activityTransferExport').click();assert.equal(h.get('exportTitle').textContent,'Export transactions');assert.equal(h.get('exportCancel').textContent,'Close');
    assert.equal(h.get('izvozModal').getAttribute('aria-labelledby'),'exportTitle');assert.equal(h.get('exportError').getAttribute('role'),'alert');
    assert.equal(h.get('activityTransferModal').getAttribute('aria-labelledby'),'activityTransferTitle');
  }
  {
    const h=harness();h.state.referenceDate='2026-09-01';h.state.timezone='America/Los_Angeles';h.ui.open('activity');
    assert.equal(h.get('exportMonth').value,'','current records do not create previous-month choices');
    h.window.MerExportBridge.categoryLabel=id=>id==='groceries'?'Namirnice iz aplikacije':id;
    h.window.MerExportBridge.incomeCategoryLabel=id=>id==='salary'?'Redovna plaća':id;
    h.change('exportFormat','json');await h.submit();
    const report=JSON.parse(await h.blobs.get(h.document.downloads[0].url).text());
    assert.equal(report.period.start,'2026-09-01','date-only reference dates must not shift into the previous month in western timezones');
    assert.ok(report.sections[0].rows.some(row=>row.includes('Namirnice iz aplikacije')));
    assert.ok(report.sections[0].rows.some(row=>row.includes('Redovna plaća')),'income labels use the current application translator too');
  }
  {
    const h=harness(),trigger=h.document.createElement('button');trigger.id='moduleTransferTrigger';h.document.body.append(trigger);trigger.focus();
    h.ui.openActivityTransfer();assert.equal(h.returnFocus.get(h.get('activityTransferModal')),trigger);
    h.get('activityTransferExport').click();assert.equal(h.returnFocus.get(h.get('izvozModal')),trigger,'nested export must capture the visible header trigger');
    h.get('exportClose').click();assert.equal(h.document.activeElement,trigger,'closing nested export restores visible header focus');
    h.ui.openActivityTransfer();h.get('activityTransferExport').click();h.get('exportBack').click();
    assert.equal(h.returnFocus.get(h.get('activityTransferModal')),trigger,'Back preserves the same outer trigger');
    h.get('activityTransferCancel').click();assert.equal(h.document.activeElement,trigger);
  }
  {
    const h=harness();h.state.profile.transactions.push({date:'2024-02-29',amount:25,type:'expense'});h.ui.open('budget');h.change('exportTimeframe','custom-month');h.change('exportMonth','2024-02');
    const input=h.get('exportMonth'),option=input.children[0];input.focus();h.state.revision+=1;h.ui.refresh();
    assert.equal(h.get('exportMonth'),input);assert.equal(input.value,'2024-02');assert.equal(input.children[0],option);assert.equal(h.document.activeElement,input,'reactive preview refresh retains the chosen month and focused select');
    assert.equal(h.get('exportSummary').querySelectorAll('[data-monetary]').length,h.get('exportSummary').querySelectorAll('dd').length,'all preview amounts participate in the existing stealth-mode selector');
  }
  {
    const h=harness();h.state.profile.transactions.push({date:'2026-08-02',amount:30,type:'expense'},{date:'2026-07-01',amount:20,type:'expense'},{date:'2025-01-01',amount:999,profileId:'business'});
    for(const context of ['budget','activity','insights']) {
      h.ui.open(context,{timeframe:'custom-month'});
      assert.equal(h.get('exportMonth').tagName,'select');
      assert.deepEqual(h.get('exportMonth').children.map(option=>[option.value,option.textContent]),[['2026-08','Kolovoz 2026'],['2026-07','Srpanj 2026']]);
      assert.equal(h.get('exportMonth').value,'2026-08','the newest previous month is selected by default');
      h.change('exportMonth','2026-08');assert.equal(h.get('exportDownload').disabled,false);assert.equal(h.get('exportCount').textContent,'Broj zapisa: 1');
      h.change('exportFormat','json');await h.submit();
      const report=JSON.parse(await h.blobs.get(h.document.downloads.at(-1).url).text());
      assert.equal(report.period.start,'2026-08-01');assert.equal(report.period.end,'2026-08-31');assert.equal(report.recordCount,1);
      h.get('exportCancel').click();
    }
    h.ui.open('savings',{timeframe:'custom-month'});
    assert.deepEqual(h.get('exportMonth').children.map(option=>option.value),[''],'current deposits are not previous months');
    assert.equal(h.get('exportMonth').disabled,true);assert.equal(h.get('exportDownload').disabled,true);
    h.state.profile.savingsEntries.push({id:'save-past',date:'2026-06-07',amount:20,profileId:'personal'});h.state.revision+=1;h.ui.refresh();
    assert.deepEqual(h.get('exportMonth').children.map(option=>option.value),['2026-06'],'savings uses previous deposit and withdrawal dates only');
    assert.equal(h.get('exportMonth').disabled,false);assert.equal(h.get('exportDownload').disabled,false);
    h.get('exportCancel').click();h.state.language='en';h.ui.open('activity',{timeframe:'custom-month',month:'2026-07'});
    assert.equal(h.get('exportMonth').value,'2026-07');assert.equal(h.get('exportMonth').children[0].textContent,'August 2026');
    assert.equal(h.get('exportMonthLabel').textContent,'Previous months');
    assert.equal(h.get('exportTimeframe').querySelectorAll('option')[2].textContent,'Previous months');
  }
  {
    const h=harness();h.state.profile.transactions=[];h.ui.open('activity',{timeframe:'custom-month'});
    assert.equal(h.get('exportMonth').disabled,true);assert.equal(h.get('exportMonth').value,'');
    assert.equal(h.get('exportMonth').children[0].textContent,'Nema prethodnih mjeseci');assert.equal(h.get('exportDownload').disabled,true);
    await h.submit();assert.equal(h.document.downloads.length,0);
    h.change('exportTimeframe','all');assert.equal(h.get('exportDownload').disabled,false);
    h.state.profile.transactions.push({date:'2026-08-01',amount:25,type:'expense'});h.state.revision+=1;h.ui.refresh();
    h.change('exportTimeframe','custom-month');assert.equal(h.get('exportMonth').disabled,false);assert.equal(h.get('exportMonth').value,'2026-08');assert.equal(h.get('exportDownload').disabled,false);
    h.state.profile.transactions.push({date:'2026-07-01',amount:25,type:'expense'});h.state.revision+=1;h.ui.refresh();
    assert.equal(h.get('exportMonth').value,'2026-08','adding history preserves a valid selection');
    h.state.profile.transactions.shift();h.state.revision+=1;h.ui.refresh();assert.equal(h.get('exportMonth').value,'2026-07','deleting the selected month selects the newest available month');
    h.change('exportMonth','2026-06');assert.equal(h.get('exportDownload').disabled,true,'a programmatic value without data cannot bypass the dropdown');
    h.state.profile.transactions=[];h.ui.refresh();assert.equal(h.get('exportMonth').disabled,true);assert.equal(h.get('exportDownload').disabled,true);
    h.get('exportCancel').click();h.state.language='en';h.ui.open('activity',{timeframe:'custom-month'});
    assert.equal(h.get('exportMonth').children[0].textContent,'No previous months','empty history is relocalized when reopening in English');
    h.state.profileId='business';h.ui.refresh();assert.equal(h.get('izvozModal').open,false);
    h.state.profile={transactions:[{date:'2026-05-01',amount:10,profileId:'business'}]};h.ui.open('activity',{timeframe:'custom-month'});
    assert.deepEqual(h.get('exportMonth').children.map(option=>option.value),['2026-05']);
  }
  assert.match(css,/max-height:90dvh/);assert.match(css,/#izvozModal\.export-dialog[^}]*overflow:hidden/);assert.match(css,/\.export-body[^}]*overflow:visible/);assert.doesNotMatch(css,/\.export-body[^}]*overflow-y:(?:auto|scroll)/);
  assert.match(css,/\.export-footer[^}]*flex-shrink:0/);assert.match(css,/font-size:16px/);assert.match(css,/min-height:44px/);assert.match(css,/@media\(max-width:540px\)/);
  assert.match(css,/\.export-preview dl>div\{display:grid;grid-template-columns:minmax\(0,1fr\) max-content/);assert.match(css,/\.export-preview dd\{white-space:nowrap;overflow-wrap:normal/);
  process.stdout.write('Export modal cycle 2 passed: choices, context/date/format filters, explicit downloads, live state, async cancellation, errors, accessibility and responsive boundaries.\n');
}
main().catch(error=>{process.stderr.write(`${error.stack}\n`);process.exitCode=1;});
