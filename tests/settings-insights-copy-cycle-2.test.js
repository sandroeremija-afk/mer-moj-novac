'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Charts=require('../insight-charts.js'),Insights=require('../insight-core.js'),Core=require('../core.js');
const premium=fs.readFileSync(require.resolve('../premium.js'),'utf8');
const popup=fs.readFileSync(require.resolve('../popup-layout.js'),'utf8');
function settingsCopy(){
  const context={translations:{hr:{},en:{}}};
  vm.runInNewContext(premium.slice(premium.indexOf('{')+1,premium.indexOf('  let selectedSettingsTab')),context);
  return context.translations;
}
const profile={profileId:'personal',financialOpeningBalance:500,categories:[{id:'food',name:'Hrana'}],incomeCategories:[{id:'salary',name:'Plaća'}],transactions:[
  {id:'past',type:'expense',amount:50,category:'food',date:'2026-08-03'},
  {id:'income',type:'income',amount:2000,category:'salary',date:'2026-09-01'},
  {id:'expense',type:'expense',amount:500,category:'food',date:'2026-09-03'},
  {id:'future',type:'income',amount:9000,category:'salary',date:'2026-10-01',status:'scheduled'}
],savingsEntries:[{id:'saving',date:'2026-09-03',amount:10}]};

test('explanatory chart copy distinguishes cumulative recorded balance from net worth and future income',()=>{
  const before=JSON.stringify(profile),data=Insights.transactionSeries(profile,'monthly','2026-09-18');
  assert.equal(data.openingBalance,450);assert.equal(data.closingBalance,1950);assert.equal(data.totals.net,1500);
  const markup=Charts.chartMarkup(data,{mode:'balance',locale:'hr-HR'});
  assert.match(markup,/Početno stanje \+ evidentirani prihodi − troškovi; nije ukupna imovina/);
  assert.match(markup,/Završno stanje umanjeno za početno stanje/);
  assert.match(markup,/Ako je početno stanje 0, postotak se ne računa/);
  assert.doesNotMatch(markup,/Rast od početnog stanja/);
  for(const mode of ['income','expenses']){
    assert.match(Charts.chartMarkup(data,{mode,locale:'hr-HR'}),/po intervalima, bez budućih unosa/);
    assert.match(Charts.chartMarkup(data,{mode,locale:'en-IE'}),/future entries are excluded/);
  }
  assert.match(Charts.chartMarkup(data,{mode:'balance',locale:'en-IE'}),/not total net worth/);
  assert.equal(JSON.stringify(profile),before,'rendering explanatory copy must never alter financial state');
});

test('category explanations follow the real equal-elapsed-period comparison and all-time exception',()=>{
  const monthly=Insights.metricBreakdown(profile,'expenses','monthly','2026-09-18');
  assert.equal(monthly.previousEnd,'2026-08-18');assert.equal(monthly.current,500);assert.equal(monthly.previous,50);
  assert.match(Charts.categoryMarkup(monthly,{locale:'hr-HR'}),/jednako protekli dio prethodnog razdoblja/);
  assert.match(Charts.categoryMarkup(monthly,{locale:'en-IE'}),/same elapsed portion/);
  const all=Insights.metricBreakdown(profile,'expenses','all','2026-09-18');
  assert.equal(all.previous,null);
  assert.match(Charts.categoryMarkup(all,{locale:'hr-HR'}),/nema prethodnog razdoblja za usporedbu/);
  assert.match(Charts.chartMarkup({series:[],totals:{count:0}},{locale:'hr-HR'}),/Budući unosi još nisu uključeni/);
  const totals=Core.transactionTotals(profile.transactions,'monthly','2026-09-18');
  assert.equal(totals.savingsRate,75,'the savings-rate measure is residual income, not the 10 EUR deposited in savings');
});

test('Settings helpers explain local security, opt-in privacy and unchanged currency amounts in both languages',()=>{
  const copy=settingsCopy();
  assert.match(copy.hr.baseCurrencyHint,/ne preračunava iznose po tečaju/);
  assert.match(copy.en.baseCurrencyHint,/does not convert amounts/);
  assert.match(copy.hr.hideBalancesHint,/ne šifrira/);
  assert.match(copy.hr.changePasswordHint,/lokalnog računa.*ovom pregledniku.*demo načinu/);
  assert.match(copy.hr.twoFactorHint,/lokalne sesije.*SMS je samo demonstracija/);
  assert.match(copy.hr.smsMfaDescription,/ne šalje SMS.*pet minuta/);
  assert.equal(copy.hr.sendSmsCode,'Prikaži demonstracijski kod');
  assert.match(copy.en.smsMfaDescription,/does not send SMS.*five minutes/);
  assert.match(copy.hr.activeSessionsHint,/Drugi uređaji nisu uključeni/);
  assert.match(copy.hr.noRulesBody,/sljedećem uvozu; ne mijenja već spremljene/);
  assert.match(copy.hr.automationSubtitle,/samo u aktivnom profilu/);
  assert.match(copy.hr.recoveryCodesHint,/Svaki kod vrijedi jednom.*izvan ovog preglednika/);
  for(const key of ['baseCurrencyHint','changePasswordHint','twoFactorHint','smsMfaDescription','activeSessionsHint','automationSubtitle'])assert.ok(copy.en[key]&&copy.en[key]!==copy.hr[key],key+' retains an explicit English version');
});

test('popup labels preserve the local-only boundary and localize the recovery/blur explanation on language changes',()=>{
  const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:''});return nodes.get(id);};
  const document={documentElement:{lang:'hr'},getElementById:node};
  const context={document,dialog:{querySelector:node},flowLabels:[],subviews:[]};
  const start=popup.indexOf('  function labels()'),end=popup.indexOf('  // Existing forms and controls',start);
  assert.ok(start>=0&&end>start);vm.createContext(context);vm.runInContext(popup.slice(start,end),context);
  context.labels();
  assert.match(node('settingsDataHint').textContent,/lokalni račun.*ne zatvaraju računi kod vaše banke/);
  assert.equal(node('settingsRecoveryReturn').textContent,'Prikaži kodove za oporavak');
  assert.match(node('hideBalancesHint').textContent,/ne šifrira podatke/);
  document.documentElement.lang='en';context.labels();
  assert.match(node('settingsDataHint').textContent,/does not close accounts held by your bank/);
  assert.equal(node('settingsRecoveryReturn').textContent,'View recovery codes');
  assert.match(node('hideBalancesHint').textContent,/not encryption/);
  assert.match(popup,/Kod iz aplikacije ili demonstracija SMS provjere/);
});

test('currency field omits its info button while retaining other accessible tooltips',()=>{
  const html=fs.readFileSync(require.resolve('../index.html'),'utf8'),app=fs.readFileSync(require.resolve('../app.js'),'utf8'),copy=settingsCopy();
  assert.doesNotMatch(html,/<button\b[^>]*data-tooltip-key="baseCurrencyHint"/);
  assert.match(html,/<select id="baseCurrency"><option value="EUR">/);
  assert.match(html,/<button\b[^>]*class="info-button"[^>]*data-tooltip-key="topCategoryTooltip"/);
  assert.equal(copy.hr.baseCurrencyInfo,'Informacije o osnovnoj valuti');
  assert.equal(copy.en.baseCurrencyInfo,'About the display currency');
  assert.doesNotMatch(html,/<small\b[^>]*data-i18n="baseCurrencyHint"/,'the compact form must not reintroduce the overflowing helper row');
  assert.match(app,/trigger\.addEventListener\('focus',\(\)=>showTooltip\(trigger\)\)/);
  assert.match(app,/trigger\.addEventListener\('click',\(\)=>\$\('#appTooltip'\)\.hidden\?showTooltip\(trigger\):hideTooltip\(\)\)/);
  assert.match(app,/trigger\.setAttribute\('aria-describedby','appTooltip'\)/);
});

test('mobile savings-history summary keeps a viewport margin and a non-shrinking action footer',()=>{
  const css=fs.readFileSync(require.resolve('../modal-space.css'),'utf8'),savings=fs.readFileSync(require.resolve('../savings-minimal.css'),'utf8');
  const mobile=css.slice(css.indexOf('@media(max-width:640px)'));
  const rule=mobile.match(/html body dialog#savingsHistoryDetailModal\[open\]:not\(\.tour-modal-host\)\s*\{([^}]+)\}/)?.[1];
  assert.ok(rule,'the height correction is scoped to mobile history, never the spotlight host');
  assert.match(rule,/inset:0;\s*margin:auto;/);
  assert.match(rule,/max-height:calc\(var\(--ui-visual-height,100dvh\) - 20px\)/);
  assert.match(rule,/max-block-size:calc\(var\(--ui-visual-height,100dvh\) - 20px\)/);
  assert.match(mobile,/#savingsHistoryDetailModal \.savings-detail-body\s*\{\s*gap:6px;\s*\}/);
  assert.match(savings,/\.savings-detail-header,\.savings-detail-footer\s*\{[^}]*flex:0 0 auto/);
  assert.match(savings,/\.savings-detail-footer button\s*\{\s*min-height:44px/);
  for(const height of [568,667,844])assert.ok(height-20<height&&height-20>0,'both physical and logical max sizes reserve viewport space at '+height);
});

test('new static Settings fallbacks match the effective Croatian translations before runtime localization',()=>{
  const html=fs.readFileSync(require.resolve('../index.html'),'utf8'),copy=settingsCopy();
  for(const key of ['settingsIntroClean','changePasswordHint','twoFactorHint','recoveryCodesHint','activeSessionsHint','hideBalancesHint','sendSmsCode','smsVerificationCode','automationSubtitle']){
    const nodes=[...html.matchAll(new RegExp('data-i18n="'+key+'"[^>]*>([^<]*)<','g'))];
    assert.ok(nodes.length,key+' is present in static markup');
    for(const node of nodes)assert.equal(node[1],copy.hr[key],key+' has no stale pre-hydration promise');
  }
});
