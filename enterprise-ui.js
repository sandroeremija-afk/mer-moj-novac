(function enterpriseInterface() {
  'use strict';
  const E = window.MerEnterpriseCore;
  const el = id => document.getElementById(id);
  const copy = (hr,en) => currentLang === 'en' ? en : hr;
  const money = cents => currency((Number(cents)||0)/100);
  const esc = escapeHtml;
  const icon = name => `<svg aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
  let pendingAnalysis = null, commandIndex = 0, visibleCommands = [];
  let currentTab = 'forecast';
  function act(fn) { return Promise.resolve().then(fn).catch(error => { window.MerRuntime?.report(error,{silent:true}); showToast(copy('Radnja nije uspjela. Pokušajte ponovno.','Action failed. Please try again.')); }); }
  function makeDialog(id,title,body,className='') {
    const dialog = document.createElement('dialog');
    dialog.id=id; dialog.className=`modal enterprise-dialog ${className}`;
    dialog.setAttribute('aria-labelledby',`${id}Title`);
    dialog.innerHTML=`<header class="enterprise-dialog-head"><h2 id="${id}Title">${esc(title)}</h2><button type="button" class="icon-button" data-enterprise-close aria-label="${copy('Zatvori','Close')}">${icon('x')}</button></header>${body}`;
    document.body.append(dialog);
    dialog.querySelector('[data-enterprise-close]').addEventListener('click',()=>closeModal(dialog));
    dialog.addEventListener('close',()=>{syncModalLayer(); if(dialog.id==='intelligenceModal')pendingAnalysis?.abort();});
    MerRuntime.bindDialogBackdropDismiss(dialog,()=>closeModal(dialog));
    return dialog;
  }
  window.MerEnterpriseBridge = Object.freeze({
    getState:()=>({activeProfile:appState.activeAccount,profiles:appState.accounts,language:currentLang}),
    openModal, closeModal,
    saveInvoice(invoice) {
      if(appState.activeAccount!=='business')throw new Error('Business profile required');
      reactiveStore.update('invoice-save',draft=>MerInvoices.saveDraft(draft,invoice,draft.activeAccount));
      showToast(copy('Nacrt e-računa spremljen.','Invoice draft saved.'));
    }
  });
  window.MerEnterpriseSecurity?.init({
    getState:()=>appState, getLanguage:()=>currentLang,
    freshState:()=>MerDemoData.createDemoAppState(new Date()),
    replaceState(snapshot) {
      snapshot=structuredClone(snapshot);
      snapshot.accounts.personal=normalizeProfile(snapshot.accounts.personal,personalDefaults);
      snapshot.accounts.business=normalizeProfile(snapshot.accounts.business,businessDefaults);
      snapshot.settings=normalizeAppSettings(snapshot.settings);
      snapshot.mfa=MerSecurity.createMfaMethodState(snapshot.mfa||{});
      snapshot.mfaByUser||={};snapshot.mfaLegacyOwner||=null;snapshot.bankConnections||=[];
      window.MerMfaState?.deactivate();
      currentLang=snapshot.language==='en'?'en':'hr';currentTheme=snapshot.theme==='dark'?'dark':'light';
      reactiveStore.update('vault-load',draft=>{Object.keys(draft).forEach(key=>delete draft[key]);Object.assign(draft,snapshot);});
      applyStaticTranslations();
    },
    onError:message=>showToast(String(message||copy('Spremanje nije uspjelo.','Save failed.')))
  });

  const controls=document.createElement('div');controls.className='enterprise-header-controls';
  controls.innerHTML=`<button type="button" class="icon-button" id="commandTrigger" aria-label="Naredbe (Ctrl K)" title="Naredbe · Ctrl / ⌘ K">${icon('search')}</button><button type="button" class="icon-button" id="stealthToggle" aria-label="Sakrij iznose" aria-pressed="false" title="Privatnost · Ctrl / ⌘ Shift H">${icon('shield')}</button>`;
  document.querySelector('.header-action-cluster').prepend(controls);
  const toolbar=document.createElement('button');toolbar.type='button';toolbar.id='openIntelligence';toolbar.className='secondary-button';
  toolbar.innerHTML=`${icon('chart')}<span>${copy('Planiraj unaprijed','Plan ahead')}</span>`;
  document.querySelector('#overviewView .heading-actions').prepend(toolbar);
  const invoiceButton=document.createElement('button');invoiceButton.type='button';invoiceButton.id='openEnterpriseInvoice';invoiceButton.className='secondary-button';invoiceButton.textContent='e-Račun';invoiceButton.hidden=true;
  document.querySelector('#overviewView .heading-actions').prepend(invoiceButton);
  invoiceButton.addEventListener('click',()=>window.MerInvoiceUI?.open());

  const forecastInline=document.createElement('button');forecastInline.type='button';forecastInline.id='forecastInline';forecastInline.className='forecast-inline';
  document.querySelector('.safe-panel .safe-footer').before(forecastInline);
  const commandDialog=makeDialog('commandPalette',copy('Što želite učiniti?','What would you like to do?'),`<input id="commandSearch" type="search" autocomplete="off" placeholder="Pretražite naredbe…" aria-label="Pretraži naredbe" role="combobox" aria-expanded="true" aria-controls="commandResults" aria-autocomplete="list"><div id="commandResults" role="listbox" aria-label="Naredbe"></div><footer class="command-hint">↑ ↓ ${copy('Odabir','Choose')} · Enter · Esc</footer>`,'command-dialog');
  function commands() {
    return [
      ...[['overview','Pregled','Overview'],['budgets','Budžete','Budgets'],['savings','Štednju','Savings'],['activity','Aktivnost','Activity'],['insights','Uvide','Insights']].map(([id,hr,en])=>({label:copy(`Idi na ${hr}`,`Go to ${en}`),run:()=>showView(id)})),
      {label:copy('Novi trošak','New expense'),run:()=>openTransaction()},
      {label:copy('Novi prihod','New income'),run:()=>openIncomeTransaction()},
      {label:copy('Izvezi podatke — transakcije','Export data — transactions'),run:()=>document.querySelector('[data-export-active]').click()},
      {label:copy('Isprobaj scenarij','Try a scenario'),run:()=>openIntelligence('scenario')},
      {label:copy('Automatska raspodjela prihoda','Payday auto-split'),run:()=>openIntelligence('rules')},
      {label:copy('Osobni profil · Moj eRačun','Personal profile · Moj eRačun'),run:()=>switchAccount('personal')},
      {label:copy('Poslovni profil · Elektronički računi d.o.o.','Business profile · Elektronički računi d.o.o.'),run:()=>switchAccount('business')},
      {label:copy('Zaključaj aplikaciju','Lock application'),run:()=>window.MerEnterpriseSecurity?.lock()},
      ...(appState.activeAccount==='business'?[{label:copy('Novi e-račun (nacrt)','New e-invoice (draft)'),run:()=>window.MerInvoiceUI?.open()}]:[])
    ];
  }
  const searchKey=value=>String(value).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
  function renderCommands() {
    visibleCommands=commands().filter(command=>searchKey(command.label).includes(searchKey(el('commandSearch').value)));
    commandIndex=Math.max(0,Math.min(commandIndex,visibleCommands.length-1));
    el('commandResults').innerHTML=visibleCommands.length?visibleCommands.map((command,index)=>`<button type="button" role="option" id="commandOption${index}" aria-selected="${index===commandIndex}" data-command-index="${index}">${esc(command.label)}<span aria-hidden="true">↵</span></button>`).join(''):`<p class="enterprise-muted">${copy('Nema naredbi za taj upit.','No commands found.')}</p>`;
    if(visibleCommands.length)el('commandSearch').setAttribute('aria-activedescendant',`commandOption${commandIndex}`);else el('commandSearch').removeAttribute('aria-activedescendant');
  }
  function openCommands(){if(window.MerEnterpriseSecurity?.isLocked()||el('appShell').hidden)return;el('commandSearch').value='';commandIndex=0;renderCommands();openModal(commandDialog);el('commandSearch').focus();}
  el('commandSearch').setAttribute('autofocus','');
  function runCommand(index){const command=visibleCommands[index];if(!command)return;closeModal(commandDialog);act(command.run);}
  el('commandTrigger').addEventListener('click',openCommands);
  el('commandSearch').addEventListener('input',()=>{commandIndex=0;renderCommands();});
  el('commandResults').addEventListener('click',event=>{const item=event.target.closest('[data-command-index]');if(item)runCommand(Number(item.dataset.commandIndex));});
  el('commandSearch').addEventListener('keydown',event=>{
    if(event.key==='Enter'){event.preventDefault();runCommand(commandIndex);}
    if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();commandIndex=(commandIndex+(event.key==='ArrowDown'?1:-1)+visibleCommands.length)%Math.max(1,visibleCommands.length);renderCommands();el(`commandOption${commandIndex}`)?.scrollIntoView({block:'nearest'});}
  });
  function toggleStealth(){appState.settings.hideBalances=!appState.settings.hideBalances;save('stealth-toggle');}
  el('stealthToggle').addEventListener('click',toggleStealth);
  document.addEventListener('keydown',event=>{
    if(el('appShell').hidden||window.MerEnterpriseSecurity?.isLocked())return;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();commandDialog.open?closeModal(commandDialog):openCommands();}
    if((event.ctrlKey||event.metaKey)&&event.shiftKey&&event.key.toLowerCase()==='h'){event.preventDefault();toggleStealth();}
  });
  let privacyFrame=0;
  function markAmounts() {
    privacyFrame=0;
    const on=Boolean(appState.settings?.hideBalances);
    document.body.classList.toggle('enterprise-stealth',on);
    el('stealthToggle').setAttribute('aria-pressed',String(on));
    el('stealthToggle').setAttribute('aria-label',copy(on?'Prikaži iznose':'Sakrij iznose',on?'Show amounts':'Hide amounts'));
    // Mark leaf text, never rewrite markup used by charts, translations or event listeners.
    document.querySelectorAll('#appShell strong, #appShell span, #appShell p, #appShell text, .modal strong, .modal span, .modal td, .modal text, .modal p, .modal small, .modal b, .summary-value, [data-money], [data-monetary], .modal output').forEach(node=>{
      if(node.children.length||node.closest('#commandPalette, #authShell'))return;
      const monetary=/[€$£¥]|\b(?:EUR|USD|GBP|CHF)\b/.test(node.textContent)||node.matches('[data-money], [data-monetary], .summary-value, .axis-labels text');
      node.classList.toggle('private-amount',monetary);
      if(monetary&&on){if(!node.hasAttribute('data-original-aria'))node.setAttribute('data-original-aria',node.getAttribute('aria-hidden')||'');node.setAttribute('aria-hidden','true');}
      else if(node.hasAttribute('data-original-aria')){const value=node.getAttribute('data-original-aria');if(value)node.setAttribute('aria-hidden',value);else node.removeAttribute('aria-hidden');node.removeAttribute('data-original-aria');}
    });
  }
  new MutationObserver(()=>{if(!privacyFrame)privacyFrame=requestAnimationFrame(markAmounts);}).observe(document.body,{childList:true,subtree:true,characterData:true});

  const intelligence=makeDialog('intelligenceModal',copy('Planirajte s više sigurnosti','Plan with confidence'),`<p class="enterprise-muted" id="intelligenceProfile"></p><div class="enterprise-tabs" role="tablist"><button type="button" data-intelligence-tab="forecast" role="tab">${copy('Novčani tok','Cash flow')}</button><button type="button" data-intelligence-tab="scenario" role="tab">${copy('Isprobaj scenarij','What if?')}</button><button type="button" data-intelligence-tab="rules" role="tab">${copy('Automatizacija','Automation')}</button></div><div class="enterprise-dialog-body"><section id="enterpriseForecast" role="tabpanel"></section><section id="enterpriseScenario" role="tabpanel" hidden><p>${copy('Isprobajte veću kupnju bez promjene stvarnih podataka.','Model a large purchase without changing your real data.')}</p><label class="enterprise-field">${copy('Iznos kupnje','Purchase amount')}<input id="scenarioAmount" type="number" min="0" max="999999999" step="0.01" value="0" inputmode="decimal"></label><div id="scenarioResults" aria-live="polite"></div></section><section id="enterpriseRules" role="tabpanel" hidden></section></div>`);
  function forecast(){return E.forecastCashFlow(state,appReferenceDate,{profileId:appState.activeAccount,currency:appState.settings.currency});}
  function metricsMarkup(f){return `<div class="enterprise-metrics"><div><span>${copy('Sigurno za potrošnju · 30 dana','Safe to spend · 30 days')}</span><strong data-money>${money(f.safeToSpendCents)}</strong></div><div><span>${copy('Očekivani računi','Expected bills')}</span><strong data-money>${money(f.predictedBillsCents)}</strong></div><div><span>${copy('Rezervirano u ciljevima','Reserved in goals')}</span><strong data-money>${money(f.reservedCents)}</strong></div></div>`;}
  function renderForecast(){
    const f=forecast(),values=f.series.map(point=>Number(point.balanceCents ?? point.availableCents ?? point.valueCents ?? 0)),min=Math.min(0,...values),max=Math.max(1,...values),range=Math.max(1,max-min);
    const points=values.map((value,index)=>`${12+index/Math.max(1,values.length-1)*636},${132-(value-min)/range*112}`).join(' ');
    el('enterpriseForecast').innerHTML=`${metricsMarkup(f)}<div class="forecast-chart"><svg viewBox="0 0 660 154" role="img" aria-label="${copy('Procijenjeno slobodno stanje u sljedećih 30 dana','Projected uncommitted cash over the next 30 days')}"><line x1="12" y1="132" x2="648" y2="132" stroke="currentColor" opacity=".15"/><polyline points="${points}" fill="none" stroke="#00a9e4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><div><span>${esc(f.referenceDate)}</span><span>${esc(f.throughDate)}</span></div></div><p class="enterprise-muted">${copy('Procjena iz posljednjih 90 dana, planiranih troškova i već izdvojene štednje. Nije jamstvo ni bankovno stanje.','Estimate from the last 90 days, scheduled bills and reserved savings. Not a guarantee or a bank balance.')}${f.confidence==='limited-history'?copy(' Nedovoljno povijesti za pouzdanu prognozu.',' Limited history for a reliable prediction.'):''}</p><details class="enterprise-details"><summary>${copy('Nadolazeći računi','Upcoming bills')} (${f.bills.length})</summary><div class="enterprise-list">${f.bills.map(b=>`<div><span>${esc(b.name||b.merchant||copy('Planirani račun','Scheduled bill'))}<small>${esc(b.date)}</small></span><strong data-money>${money(b.amountCents)}</strong></div>`).join('')||`<p>${copy('Nema prepoznatih ponavljajućih računa.','No recurring bills detected.')}</p>`}</div></details><article class="subscription-radar"><h3>${copy('Pretplate · radar cijena','Subscriptions · price radar')}</h3><div class="enterprise-list">${f.radar.map(item=>`<div><span>${esc(item.name||item.merchant)}<small>${esc(item.nextDate||'')}</small></span><strong data-money>${money(item.amountCents)}</strong>${item.priceHike?`<span class="enterprise-badge warning">${copy('Poskupljenje','Price increase')} ${Number(item.increasePercent||0).toFixed(1)}%</span>`:''}</div>`).join('')||`<p class="enterprise-muted">${copy('Za usporedbu cijena potrebne su barem dvije mjesečne naplate.','At least two monthly charges are needed to compare prices.')}</p>`}</div></article><section class="forecast-ai"><p class="enterprise-muted">${copy('Gemini dobiva samo zbirne iznose i anonimne obrasce, bez naziva trgovaca i osobnih podataka.','Gemini receives aggregate amounts and anonymous patterns, not merchant or personal information.')}</p><button type="button" class="secondary-button" id="analyzeCashflow">${copy('Objasni prognozu uz Gemini','Explain forecast with Gemini')}</button><div id="cashflowAnalysis" aria-live="polite"></div></section>`;
    if(f.foreignCurrencyCount){const notice=document.createElement('p');notice.className='enterprise-muted';notice.textContent=copy(`Prognoza izostavlja ${f.foreignCurrencyCount} transakcija u drugim valutama; nema automatske konverzije.`,`Forecast excludes ${f.foreignCurrencyCount} transactions in other currencies; no automatic conversion.`);el('enterpriseForecast').prepend(notice);}
    el('analyzeCashflow').addEventListener('click',()=>act(analyzeCashflow));
  }
  async function analyzeCashflow(){
    pendingAnalysis?.abort();const controller=new AbortController();pendingAnalysis=controller;const account=appState.activeAccount,revision=reactiveStore.getRevision();
    const box=el('cashflowAnalysis'),button=el('analyzeCashflow');button.disabled=true;box.setAttribute('aria-busy','true');box.innerHTML='<div class="enterprise-skeleton" role="status" aria-label="Učitavanje"><i></i><i></i><i></i></div>';
    const timer=setTimeout(()=>controller.abort(),25000);
    try{const response=await fetch('/api/cashflow',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locale:currentLang,analysis:E.anonymizedForecast(forecast())}),signal:controller.signal});const result=await response.json();if(account!==appState.activeAccount||revision!==reactiveStore.getRevision()||!intelligence.open)return;box.textContent=String(result.message||copy('AI trenutno nije dostupan. Lokalna prognoza ostaje dostupna.','AI unavailable. Your local forecast is still available.'));}
    catch{if(intelligence.open&&account===appState.activeAccount)box.textContent=copy('Gemini nije dostupan. Provjerite vezu ili poslužiteljski API ključ. Lokalna procjena ostaje dostupna.','Gemini is unavailable. Check connectivity or the server API key. The local estimate remains available.');}
    finally{clearTimeout(timer);button.disabled=false;box.setAttribute('aria-busy','false');}
  }
  function renderScenario(){
    const result=E.simulatePurchase(state,el('scenarioAmount').value,appReferenceDate,{profileId:appState.activeAccount,currency:appState.settings.currency});
    el('scenarioResults').innerHTML=!result.valid?`<p role="alert">${copy('Unesite valjan nenegativan iznos.','Enter a valid non-negative amount.')}</p>`:`<div class="enterprise-metrics"><div><span>${copy('Prije kupnje','Before purchase')}</span><strong data-money>${money(result.safeBeforeCents)}</strong></div><div><span>${copy('Nakon kupnje','After purchase')}</span><strong data-money>${money(result.safeAfterCents)}</strong></div></div><div class="enterprise-list">${result.goals.map(goal=>`<div><span>${esc(goal.name)}<small>${esc(goal.originalDate||'—')} → ${esc(goal.simulatedDate||'—')}</small></span><strong>${goal.delayMonths===null?copy('Postavite mjesečnu uplatu','Set monthly contribution'):copy(`+${goal.delayMonths} mj.`,`+${goal.delayMonths} mo.`)}</strong></div>`).join('')}</div><p class="enterprise-muted">${copy('Kupnja prvo koristi slobodan novac. Ostatak odgađa planirane uplate proporcionalno po ciljevima. Prikaz je simulacija, bez knjiženja.','Purchase uses uncommitted cash first, then delays planned contributions proportionally. Simulation only; nothing is posted.')}</p>`;
  }
  el('scenarioAmount').addEventListener('input',renderScenario);
  function renderRules(){
    const rules=state.enterprise?.paydayRules||[],goals=state.goalBuckets.filter(g=>!g.taxVault);
    el('enterpriseRules').innerHTML=`<p>${copy('Kada pojedinačni prihod premaši prag, dio iznosa automatski se izdvaja u odabrane ciljeve.','When a single income exceeds the threshold, automatically allocate a share to selected goals.')}</p><form id="paydayRuleForm"><label class="enterprise-field">${copy('Prihod veći od','Income greater than')}<input id="paydayThreshold" type="number" min="0" max="999999999" step="0.01" value="1000" required></label><div class="enterprise-allocation-grid">${goals.map((goal,index)=>`<label class="enterprise-field">${esc(goal.name)} (%)<input type="number" data-goal-allocation="${esc(goal.id)}" min="0" max="100" step="0.1" value="${index===0?10:0}"></label>`).join('')}</div><p class="enterprise-muted">${copy('Primjenjuje se na prihode od danas. Uređivanje ili uklanjanje pravila preračunava pripadajuće automatske uplate. Zbroj postotaka ne smije biti veći od 100%.','Applies to income from today. Editing or removing a rule recalculates its automatic deposits. Percentages must total no more than 100%.')}</p><p id="paydayError" role="alert"></p><button type="submit" class="primary-button" ${goals.length?'':'disabled'}>${copy('Spremi pravilo','Save rule')}</button></form><div class="enterprise-list">${rules.map(rule=>`<div><span>${copy('Prihod iznad','Income over')} <strong data-money>${currency(rule.minimumAmount)}</strong><small>${rule.allocations.map(a=>`${esc(goals.find(g=>g.id===a.goalId)?.name||a.goalId)} ${a.percent}%`).join(' · ')}</small></span><button type="button" class="secondary-button" data-remove-payday="${esc(rule.id)}">${copy('Ukloni','Remove')}</button></div>`).join('')}</div>${appState.activeAccount==='business'?`<div class="enterprise-tax"><label><input id="taxVaultToggle" type="checkbox" ${state.enterprise?.taxVault?.enabled?'checked':''}> ${copy('Porezni trezor · PDV 25%','Tax vault · VAT 25%')}</label><p class="enterprise-muted">${copy('Samo prihodi označeni kao oporeziva B2B uplata. Iz bruto 1.250 € izdvaja se 250 € PDV-a (25/125). Virtualna pričuva nije porezna prijava ni bankovni prijenos.','Only income marked as a taxable B2B payment. €1,250 gross reserves €250 VAT (25/125). A virtual reserve, not a tax filing or bank transfer.')}</p></div>`:''}`;
    el('paydayRuleForm').addEventListener('submit',event=>{event.preventDefault();const rule={id:uniqueId('payday'),enabled:true,currency:appState.settings.currency,startDate:appReferenceDate,minimumAmount:Number(el('paydayThreshold').value),allocations:[...document.querySelectorAll('[data-goal-allocation]')].filter(input=>Number(input.value)>0).map(input=>({goalId:input.dataset.goalAllocation,percent:Number(input.value)}))};if(!E.validatePaydayRule(rule,state).valid){el('paydayError').textContent=copy('Odaberite cilj i postotke ukupno od 0 do 100%.','Choose a goal and percentages totaling up to 100%.');return;}state.enterprise||={};state.enterprise.paydayRules||=[];state.enterprise.paydayRules.push(rule);save('payday-rule-add');showToast(copy('Pravilo je spremljeno.','Rule saved.'));});
    document.querySelectorAll('[data-remove-payday]').forEach(button=>button.addEventListener('click',()=>{state.enterprise.paydayRules=rules.filter(r=>r.id!==button.dataset.removePayday);save('payday-rule-remove');}));
    el('taxVaultToggle')?.addEventListener('change',event=>{state.enterprise||={};state.enterprise.taxVault={...state.enterprise.taxVault,enabled:event.target.checked,rate:25,currency:state.enterprise.taxVault?.currency||appState.settings.currency,startDate:state.enterprise.taxVault?.startDate||appReferenceDate};save('tax-vault-toggle');});
  }
  function showIntelligenceTab(tab){currentTab=tab;['forecast','scenario','rules'].forEach(name=>{el(`enterprise${name[0].toUpperCase()+name.slice(1)}`).hidden=name!==tab;document.querySelector(`[data-intelligence-tab="${name}"]`).setAttribute('aria-selected',String(name===tab));});if(tab==='forecast')renderForecast();if(tab==='scenario')renderScenario();if(tab==='rules')renderRules();}
  function openIntelligence(tab='forecast'){el('intelligenceProfile').textContent=state.accountName||appState.activeAccount;showIntelligenceTab(tab);openModal(intelligence);}
  document.querySelectorAll('[data-intelligence-tab]').forEach(button=>button.addEventListener('click',()=>showIntelligenceTab(button.dataset.intelligenceTab)));
  toolbar.addEventListener('click',()=>openIntelligence());forecastInline.addEventListener('click',()=>openIntelligence());

  const b2b=document.createElement('label');b2b.id='transactionB2BRow';b2b.className='enterprise-b2b';b2b.hidden=true;b2b.innerHTML=`<input type="checkbox" id="transactionB2B"> ${copy('Oporeziva B2B uplata (iznos uključuje 25% PDV-a)','Taxable B2B payment (amount includes 25% VAT)')}`;
  el('transactionForm').querySelector('.modal-actions').before(b2b);
  const security=document.createElement('section');security.className='enterprise-security-actions';
  security.innerHTML=`<h3>${copy('Uređaj, privatnost i podaci','Device, privacy and data')}</h3><p class="enterprise-muted">${copy('Automatsko zaključavanje nakon 10 minuta. Lokalni račun i podaci ovog preglednika; nije upravljanje udaljenim bankovnim računom.','Auto-lock after 10 minutes. Manages this browser’s local account and data, not remote bank accounts.')}</p><div class="enterprise-action-grid"><button type="button" class="secondary-button" id="configureVault">${copy('Šifriranje i PIN','Encryption and PIN')}</button><button type="button" class="secondary-button" id="lockNow">${copy('Zaključaj sada','Lock now')}</button><button type="button" class="secondary-button" id="exportSovereignty">${copy('Preuzmi sve podatke (JSON)','Download all data (JSON)')}</button><button type="button" class="secondary-button danger" id="deleteSovereignty">${copy('Trajno izbriši lokalni račun','Permanently delete local account')}</button></div>`;
  document.querySelector('[data-settings-panel="security"]').append(security);
  el('configureVault').addEventListener('click',()=>act(()=>window.MerEnterpriseSecurity?.openVaultSetup()));
  el('lockNow').addEventListener('click',()=>act(()=>window.MerEnterpriseSecurity?.lock()));
  const pinButton=document.createElement('button');pinButton.type='button';pinButton.className='secondary-button';pinButton.id='enterprisePinSetup';pinButton.textContent=copy('Postavi PIN za demo','Set demo PIN');security.querySelector('.enterprise-action-grid').append(pinButton);
  pinButton.addEventListener('click',()=>act(()=>window.MerEnterpriseSecurity?.openPinSetup()));
  const installButton=document.createElement('button');installButton.type='button';installButton.className='secondary-button';installButton.id='enterpriseInstall';installButton.textContent=copy('Instaliraj Mer','Install Mer');security.querySelector('.enterprise-action-grid').append(installButton);
  installButton.addEventListener('click',()=>act(()=>window.MerEnterpriseSecurity?.install()));
  const securityStatus=document.createElement('p');securityStatus.id='enterpriseSecurityStatus';securityStatus.className='enterprise-muted';security.append(securityStatus);
  function renderSecurity(){const status=window.MerEnterpriseSecurity?.status();pinButton.hidden=!status?.demo;installButton.hidden=!status?.canInstall;securityStatus.textContent=copy(status?.encrypted?'AES-256 šifriranje je uključeno.':'Demo predmemorija nije šifrirana. Uključite privatni trezor prije unosa osjetljivih podataka.',status?.encrypted?'AES-256 encryption is enabled.':'Demo cache is not encrypted. Enable the private vault before entering sensitive data.');}
  window.addEventListener('mer-security-status',renderSecurity);renderSecurity();
  el('exportSovereignty').addEventListener('click',()=>act(()=>window.MerEnterpriseSecurity?.exportAll()));
  el('deleteSovereignty').addEventListener('click',()=>act(()=>window.MerEnterpriseSecurity?.requestDelete()));
  const offline=document.createElement('button');offline.type='button';offline.id='offlineStatus';offline.className='offline-status';document.querySelector('#activityView .heading-actions')?.prepend(offline);
  const draftDialog=makeDialog('offlineDraftModal',copy('Izvanmrežni nacrti','Offline drafts'),'<div class="enterprise-dialog-body" id="offlineDraftList"></div>');
  function renderDrafts(){const drafts=state.transactions.filter(tx=>tx.offlineDraft);el('offlineDraftList').innerHTML=drafts.map(tx=>`<div class="enterprise-draft"><span>${esc(tx.name)}<small>${esc(tx.date.slice(0,10))}</small></span><strong data-money>${currency(tx.amount)}</strong><button type="button" class="primary-button" data-post-draft="${esc(tx.id)}" ${navigator.onLine?'':'disabled'}>${copy('Potvrdi unos','Confirm entry')}</button><button type="button" class="secondary-button" data-delete-draft="${esc(tx.id)}">${copy('Obriši','Delete')}</button></div>`).join('')||`<p>${copy('Nema spremljenih nacrta.','No saved drafts.')}</p>`;}
  offline.addEventListener('click',()=>{renderDrafts();openModal(draftDialog);});
  draftDialog.addEventListener('click',event=>{const post=event.target.closest('[data-post-draft]'),remove=event.target.closest('[data-delete-draft]');if(post&&navigator.onLine){const tx=state.transactions.find(tx=>tx.id===post.dataset.postDraft&&tx.offlineDraft);if(tx){delete tx.offlineDraft;tx.status='posted';MerCore.updateTransactionSchedule(tx,appReferenceDate);MerAccounting.applyRoundUp(state,tx,appReferenceDate);save('offline-draft-post');renderDrafts();}}if(remove){state.transactions=state.transactions.filter(tx=>!(tx.id===remove.dataset.deleteDraft&&tx.offlineDraft));save('offline-draft-delete');renderDrafts();}});
  function render(){
    toolbar.querySelector('span').textContent=copy('Planiraj unaprijed','Plan ahead');
    el('intelligenceModalTitle').textContent=copy('Planirajte s više sigurnosti','Plan with confidence');
    el('commandPaletteTitle').textContent=copy('Što želite učiniti?','What would you like to do?');
    [['forecast','Novčani tok','Cash flow'],['scenario','Isprobaj scenarij','What if?'],['rules','Automatizacija','Automation']].forEach(([tab,hr,en])=>{document.querySelector(`[data-intelligence-tab="${tab}"]`).textContent=copy(hr,en);});
    const f=forecast();document.querySelector('.topbar').dataset.health=f.health;
    forecastInline.innerHTML=`<span>${copy('Sigurno za potrošnju · 30 dana','Safe to spend · 30 days')}<small>${copy('Nakon očekivanih računa','After expected bills')} · ${copy('Pretplate','Subscriptions')}: ${f.radar.length}</small></span><strong data-money>${money(f.safeToSpendCents)}</strong><span aria-hidden="true">↗</span>`;
    invoiceButton.hidden=appState.activeAccount!=='business';
    window.MerInvoiceUI?.refresh();
    const drafts=state.transactions.filter(tx=>tx.offlineDraft).length;offline.hidden=navigator.onLine&&!drafts;offline.textContent=copy(`${navigator.onLine?'Nacrti':'Izvanmrežno'} · ${drafts}`,`${navigator.onLine?'Drafts':'Offline'} · ${drafts}`);
    if(intelligence.open)showIntelligenceTab(currentTab);
    markAmounts();
  }
  window.addEventListener('online',render);window.addEventListener('offline',render);
  window.MerEnterpriseUI=Object.freeze({render,openCommands,openIntelligence});
  render();
})();
