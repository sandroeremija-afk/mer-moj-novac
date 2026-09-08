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
    getState:()=>({activeProfile:appState.activeAccount,profiles:appState.accounts,language:currentLang,currency:appState.settings.currency}),
    openModal(dialog){window.MerPlanNavigation?.enter(dialog);window.MerPlanNavigation?.enhance(dialog);openModal(dialog);}, closeModal,
    currentUser:()=>window.MerAuthProvider?.currentSession(),
    mutateHousehold(action){reactiveStore.update('household-change',draft=>action(draft.accounts[draft.activeAccount]));},
    attachReceipt(profileId,transactionId,receipt){
      if(profileId!==appState.activeAccount)throw new Error('Profile changed');
      reactiveStore.update('receipt-attach',draft=>MerReceipts.attachReceipt(draft,profileId,transactionId,receipt));
    },
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
  toolbar.innerHTML=`${icon('spark')}<span>${copy('Planiraj unaprijed','Plan ahead')}</span>`;
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
      {label:copy('Izvoz — sve transakcije','Export — all transactions'),run:()=>document.querySelector('[data-export-active]').click()},
      {label:copy('Izvoz — budžeti','Export — budgets'),run:()=>document.querySelector('[data-export-budget]').click()},
      {label:copy('Izvoz — izvještaj uvida','Export — insights report'),run:()=>document.querySelector('[data-export-insights]').click()},
      {label:copy('Lozinka — promjena lozinke','Password — change password'),run:()=>openSetting('security','currentPasswordInput')},
      {label:copy('Jezik — Hrvatski / English','Language — Hrvatski / English'),run:()=>openSetting('general','settingsLanguage')},
      {label:copy('2FA / MFA — dvostruka autentifikacija','2FA / MFA — two-factor authentication'),run:()=>openSetting('security','startMfa')},
{label:copy('Tema aplikacije — Svijetla / Tamna','App theme — Light / Dark'),run:()=>openSetting('general','themeToggle')},
      {label:copy('Skeniraj račun — OCR i povezivanje','Scan receipt — OCR and matching'),run:()=>window.MerReceiptUI?.open()},
      {label:copy('FIRE — financijska neovisnost','FIRE — financial independence'),run:()=>window.MerPlanningUI?.open('fire')},
      {label:copy('Pretplate — podsjetnici za obnovu','Subscriptions — renewal reminders'),run:()=>window.MerPlanningUI?.open('renewals')},
      {label:copy('Kućanstvo — zajednički troškovi','Household — shared bills'),run:()=>window.MerHouseholdUI?.open()},
      {label:copy('Isprobaj scenarij','Try a scenario'),run:()=>openIntelligence('scenario')},
      {label:copy('Automatska raspodjela prihoda','Payday auto-split'),run:()=>openIntelligence('rules')},
      {label:copy('Osobni profil · Moj eRačun','Personal profile · Moj eRačun'),run:()=>switchAccount('personal')},
      {label:copy('Poslovni profil · Elektronički računi d.o.o.','Business profile · Elektronički računi d.o.o.'),run:()=>switchAccount('business')},
      {label:copy('Zaključaj aplikaciju','Lock application'),run:()=>window.MerEnterpriseSecurity?.lock()},
      ...(appState.activeAccount==='business'?[{label:copy('Novi e-račun (nacrt)','New e-invoice (draft)'),run:()=>window.MerInvoiceUI?.open()}]:[])
    ];
  }
  function openSetting(tab,id){window.MerPremiumNavigation.openSettings(tab);requestAnimationFrame(()=>{const target=el(id);target?.scrollIntoView({block:'center'});target?.focus({preventScroll:true});});}
  function runSearchResult(result){
    if(result.profileId!==appState.activeAccount)return;
    if(result.kind==='transaction'){showView('activity');openTransaction(result.id);}
    if(result.kind==='category'){showView('budgets');openBudgetEditor(result.id);}
    if(result.kind==='income-category'){showView('insights');openIncomeCategoryEditor(result.id);}
    if(result.kind==='goal'){showView('savings');window.MerPremiumNavigation.openGoalEditor(result.id);}
  }
  function renderCommands() {
    const query=el('commandSearch').value;
    const actions=commands().filter(command=>MerDiscovery.key(query).split(' ').every(token=>MerDiscovery.key(command.label).includes(token))).map(command=>({...command,group:copy('Naredbe i postavke','Actions and settings')}));
    const results=MerDiscovery.search(state,appState.activeAccount,query,{label:category=>category.name||t(category.nameKey||category.id)}).map(result=>{
      const transaction=result.kind==='transaction';
      const group=transaction?`${copy('Transakcije','Transactions')} · ${result.merchant} · ${formatIsoDate(result.date)}`:result.kind==='goal'?copy('Ciljevi i trezori','Goals and vaults'):copy('Kategorije i budžeti','Categories and budgets');
      const status=result.offlineDraft?copy('Nacrt','Draft'):result.date>appReferenceDate?copy('Planirano','Scheduled'):copy('Knjiženo','Posted');
      const amount=appState.settings.hideBalances?'••••':MerCore.formatCurrency(result.amount,{locale:currentLang==='en'?'en-GB':'hr-HR',currency:/^[A-Z]{3}$/.test(result.currency||'')?result.currency:appState.settings.currency});
      return {label:result.label,group,detail:transaction?`${status} · ${amount}`:'',run:()=>runSearchResult(result)};
    });
    visibleCommands=[...results,...actions];
    commandIndex=Math.max(0,Math.min(commandIndex,visibleCommands.length-1));
    let previousGroup='';
    el('commandResults').innerHTML=visibleCommands.length?visibleCommands.map((command,index)=>{const heading=command.group!==previousGroup?`<div class="command-group" role="presentation">${esc(command.group)}</div>`:'';previousGroup=command.group;return `${heading}<button type="button" role="option" id="commandOption${index}" aria-selected="${index===commandIndex}" data-command-index="${index}"><span>${esc(command.label)}${command.detail?`<small>${esc(command.detail)}</small>`:''}</span><span aria-hidden="true">↵</span></button>`;}).join(''):`<p class="enterprise-muted">${copy('Nema rezultata u aktivnom profilu.','No results in the active profile.')}</p>`;
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
  const suiteTools=document.createElement('div');suiteTools.className='enterprise-tools';
  const planBack=document.createElement('button');planBack.type='button';planBack.className='secondary-button plan-back';planBack.id='planOverviewBack';planBack.hidden=true;
  intelligence.querySelector('header').prepend(planBack);planBack.addEventListener('click',()=>showIntelligenceTab('forecast'));
  const taxDialog=makeDialog('taxVaultModal',copy('Porezni trezor','Tax vault'),'<div class="enterprise-dialog-body" id="planTaxBody"></div>');
  function renderTaxVault(){
    if(appState.activeAccount!=='business'){if(taxDialog.open)closeModal(taxDialog);return;}
    const total=(state.goalBuckets||[]).filter(goal=>goal.taxVault).reduce((sum,goal)=>sum+(Number(goal.current)||0),0);
    el('taxVaultModalTitle').textContent=copy('Porezni trezor','Tax vault');
    el('planTaxBody').innerHTML=`<div class="enterprise-metrics"><div><span>${copy('Rezervirani PDV','Reserved VAT')}</span><strong data-money>${currency(total)}</strong></div></div><label class="enterprise-b2b"><input type="checkbox" id="planTaxVaultToggle" ${state.enterprise?.taxVault?.enabled?'checked':''}>${copy('Izdvajaj PDV iz oporezivih B2B uplata','Reserve VAT from taxable B2B income')}</label><p>${copy('Primjenjuje se samo na prihode označene kao oporeziva B2B uplata.','Applies only to income marked as a taxable B2B payment.')}</p><p>${copy('Pri stopi 25%, PDV sadržan u bruto uplati računa se kao iznos × 25 / 125.','At a 25% rate, VAT included in a gross payment is amount × 25 / 125.')} ${currency(1250)} → ${currency(250)}.</p><p class="enterprise-muted">${copy('Virtualna pričuva nije porezna prijava ni bankovni prijenos.','A virtual reserve, not a tax filing or bank transfer.')}</p>`;
    el('planTaxVaultToggle').addEventListener('change',event=>{state.enterprise||={};state.enterprise.taxVault={...state.enterprise.taxVault,enabled:event.target.checked,rate:25,currency:state.enterprise.taxVault?.currency||appState.settings.currency,startDate:state.enterprise.taxVault?.startDate||appReferenceDate};save('tax-vault-toggle');});
  }
  function openTaxVault(){if(appState.activeAccount!=='business')return;renderTaxVault();window.MerEnterpriseBridge.openModal(taxDialog);}
  suiteTools.addEventListener('click',event=>{if(event.target.closest('[data-suite-action]')?.dataset.suiteAction==='tax')openTaxVault();});
  intelligence.querySelector('.enterprise-dialog-body').prepend(suiteTools);
  suiteTools.addEventListener('click',event=>{const action=event.target.closest('[data-suite-action]')?.dataset.suiteAction;if(action==='receipt')window.MerReceiptUI?.open();if(action==='fire'||action==='renewals')window.MerPlanningUI?.open(action);if(action==='household')window.MerHouseholdUI?.open();});
  const receiptTrigger=document.createElement('button');receiptTrigger.type='button';receiptTrigger.className='secondary-button';receiptTrigger.id='openReceiptScanner';document.querySelector('#activityView .heading-actions')?.prepend(receiptTrigger);receiptTrigger.addEventListener('click',()=>window.MerReceiptUI?.open());
  const receiptAction=document.createElement('button');receiptAction.type='button';receiptAction.className='secondary-button transaction-receipt-action';receiptAction.id='transactionReceiptAction';receiptAction.hidden=true;el('transactionForm').prepend(receiptAction);
  el('transactionModal').addEventListener('toggle',()=>{const tx=state.transactions.find(item=>item.id===editingTransactionId);receiptAction.hidden=!tx;receiptAction.textContent=tx?.receipts?.length?copy(`Povezani računi (${tx.receipts.length})`,`Linked receipts (${tx.receipts.length})`):copy('Poveži fotografiju računa','Attach receipt photo');});
  receiptAction.addEventListener('click',()=>{const tx=state.transactions.find(item=>item.id===editingTransactionId);if(!tx)return;if(tx.receipts?.length)window.MerReceiptUI?.view(tx.id);else window.MerReceiptUI?.open({transactionId:tx.id});});
  new ResizeObserver(()=>{if(intelligence.open&&currentTab==='forecast')renderProjection();}).observe(intelligence);
  function forecast(){return E.forecastCashFlow(state,appReferenceDate,{profileId:appState.activeAccount,currency:appState.settings.currency});}
  function metricsMarkup(f){return `<div class="enterprise-metrics"><div><span>${copy('Sigurno za potrošnju · 30 dana','Safe to spend · 30 days')}</span><strong data-money>${money(f.safeToSpendCents)}</strong></div><div><span>${copy('Očekivani računi','Expected bills')}</span><strong data-money>${money(f.predictedBillsCents)}</strong></div><div><span>${copy('Rezervirano u ciljevima','Reserved in goals')}</span><strong data-money>${money(f.reservedCents)}</strong></div></div>`;}
  function renderProjection(){
    const container=el('enterpriseForecast').querySelector('.forecast-chart');if(!container)return;
    const model=MerDiscovery.forecastChart(state,appReferenceDate,{profileId:appState.activeAccount,currency:appState.settings.currency});
    const width=Math.max(260,Math.round(container.clientWidth||680)),height=width<440?218:238,left=Math.min(width*.45,Math.max(82,...model.ticks.map(value=>money(value).length*6.7+16))),right=16,top=18,bottom=40,plotWidth=width-left-right,plotHeight=height-top-bottom;
    const x=index=>left+index/30*plotWidth,y=value=>top+(model.maximum-value)/model.range*plotHeight;
    const path=model.series.map((point,index)=>`${index?'L':'M'}${x(index).toFixed(2)},${y(point.balanceCents).toFixed(2)}`).join(' ');
    const axisMoney=value=>MerCore.formatCurrency(value/100,{locale:currentLang==='en'?'en-GB':'hr-HR',currency:model.forecast.currency});
    const dateLabel=value=>new Intl.DateTimeFormat(currentLang==='en'?'en-GB':'hr-HR',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
    const ticks=[0,7,14,21,30];
    container.innerHTML=`<svg viewBox="0 0 ${width} ${height}" style="height:${height}px" role="group" aria-label="${copy('Procjena novčanog toka s očekivanim prihodima i računima','Cash-flow projection with expected income and bills')}"><defs><linearGradient id="forecastAreaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#00a9e4" stop-opacity=".20"/><stop offset="100%" stop-color="#00a9e4" stop-opacity="0"/></linearGradient></defs>${model.ticks.map(value=>`<line class="forecast-gridline" x1="${left}" y1="${y(value)}" x2="${width-right}" y2="${y(value)}"/><text class="forecast-axis" x="${left-8}" y="${y(value)+4}" text-anchor="end">${esc(axisMoney(value))}<title>${esc(money(value))}</title></text>`).join('')}<path d="${path} L${x(30)},${height-bottom} L${left},${height-bottom} Z" fill="url(#forecastAreaFill)"/><path d="${path}" fill="none" stroke="#00a9e4" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${ticks.map(index=>`<text class="forecast-axis" x="${x(index)}" y="${height-14}" text-anchor="${index===0?'start':index===30?'end':'middle'}">${esc(dateLabel(model.series[index].date))}</text>`).join('')}${model.series.map((point,index)=>{const hasExpense=point.events.some(event=>event.kind==='expense'),hasIncome=point.events.some(event=>event.kind==='income'),color=hasExpense?'#c46b2c':hasIncome?'#279465':'#00a9e4';return `<g data-forecast-point="${index}" ${point.events.length?'tabindex="0" role="button"':''} aria-label="${esc(`${dateLabel(point.date)} · ${money(point.balanceCents)} · ${point.events.map(event=>event.name).join(', ')}`)}"><circle cx="${x(index)}" cy="${y(point.balanceCents)}" r="12" fill="transparent"/>${point.events.length?`<circle class="forecast-event-node" cx="${x(index)}" cy="${y(point.balanceCents)}" r="5" fill="${color}"/>`:''}${hasExpense&&hasIncome?`<circle cx="${x(index)+5}" cy="${y(point.balanceCents)-5}" r="3" fill="#279465"/>`:''}</g>`;}).join('')}</svg><div class="forecast-legend"><span><i class="bill"></i>${copy('Očekivani račun','Expected bill')}</span><span><i class="income"></i>${copy('Očekivani prihod','Expected income')}</span></div><div class="forecast-inspector" aria-live="polite">${copy('Dodirnite točku ili prijeđite pokazivačem za detalje.','Tap or hover a point for details.')}</div>`;
    const inspect=event=>{
      const node=event.target.closest('[data-forecast-point]');if(!node)return;
      const point=model.series[Number(node.dataset.forecastPoint)],inspector=container.querySelector('.forecast-inspector');
inspector.innerHTML=`<strong data-money>${esc(formatIsoDate(point.date))} · ${money(point.balanceCents)}</strong><span>${point.events.map(item=>`${item.kind==='income'?copy('Očekivani prihod','Expected income'):copy('Očekivani račun','Expected bill')}: ${esc(item.name)} · ${money(item.amountCents)}${item.source==='pattern'?copy(' (procjena obrasca)',' (pattern estimate)'):''}`).join('<br>')||copy('Nema planiranih događaja.','No planned events.')}</span>`;
    };
    container.onpointerover=inspect;container.onclick=inspect;container.onfocusin=inspect;
  }
  function renderForecast(){
    const f=forecast();
el('enterpriseForecast').innerHTML=`${metricsMarkup(f)}<div class="forecast-chart"></div><p class="enterprise-muted">${copy('Graf uključuje očekivane prihode; siguran iznos iznad ih ne računa do knjiženja. Procjena nije jamstvo ni bankovno stanje.','Chart includes expected income; safe-to-spend above excludes it until posted. An estimate, not a guarantee or bank balance.')}${f.confidence==='limited-history'?copy(' Nedovoljno povijesti za pouzdanu prognozu.',' Limited history for a reliable prediction.'):''}</p><details class="enterprise-details"><summary>${copy('Nadolazeći računi','Upcoming bills')} (${f.bills.length})</summary><div class="enterprise-list">${f.bills.map(b=>`<div><span>${esc(b.name||b.merchant||copy('Planirani račun','Scheduled bill'))}<small>${esc(b.date)}</small></span><strong data-money>${money(b.amountCents)}</strong></div>`).join('')||`<p>${copy('Nema prepoznatih ponavljajućih računa.','No recurring bills detected.')}</p>`}</div></details><article class="subscription-radar"><h3>${copy('Pretplate · radar cijena','Subscriptions · price radar')}</h3><div class="enterprise-list">${f.radar.map(item=>`<div><span>${esc(item.name||item.merchant)}<small>${esc(item.nextDate||'')}</small></span><strong data-money>${money(item.amountCents)}</strong>${item.priceHike?`<span class="enterprise-badge warning">${copy('Poskupljenje','Price increase')} ${Number(item.increasePercent||0).toFixed(1)}%</span>`:''}</div>`).join('')||`<p class="enterprise-muted">${copy('Za usporedbu cijena potrebne su barem dvije mjesečne naplate.','At least two monthly charges are needed to compare prices.')}</p>`}</div></article><section class="forecast-ai"><p class="enterprise-muted">${copy('Gemini dobiva samo zbirne iznose i anonimne obrasce, bez naziva trgovaca i osobnih podataka.','Gemini receives aggregate amounts and anonymous patterns, not merchant or personal information.')}</p><button type="button" class="secondary-button" id="analyzeCashflow">${copy('Objasni prognozu uz Gemini','Explain forecast with Gemini')}</button><div id="cashflowAnalysis" aria-live="polite"></div></section>`;
    if(f.foreignCurrencyCount){const notice=document.createElement('p');notice.className='enterprise-muted';notice.textContent=copy(`Prognoza izostavlja ${f.foreignCurrencyCount} transakcija u drugim valutama; nema automatske konverzije.`,`Forecast excludes ${f.foreignCurrencyCount} transactions in other currencies; no automatic conversion.`);el('enterpriseForecast').prepend(notice);}
    el('analyzeCashflow').addEventListener('click',()=>act(analyzeCashflow));
    renderProjection();
    requestAnimationFrame(()=>{if(intelligence.open&&currentTab==='forecast')renderProjection();});
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
  function showIntelligenceTab(tab){currentTab=tab;planBack.hidden=tab==='forecast';planBack.textContent=copy('← Natrag','← Back');['forecast','scenario','rules'].forEach(name=>{el(`enterprise${name[0].toUpperCase()+name.slice(1)}`).hidden=name!==tab;document.querySelector(`[data-intelligence-tab="${name}"]`).setAttribute('aria-selected',String(name===tab));});if(tab==='forecast')renderForecast();if(tab==='scenario')renderScenario();if(tab==='rules')renderRules();if(document.activeElement===planBack&&planBack.hidden)document.querySelector('[data-intelligence-tab="forecast"]').focus({preventScroll:true});}
  function openIntelligence(tab='forecast'){el('intelligenceProfile').textContent=state.accountName||appState.activeAccount;showIntelligenceTab(tab);openModal(intelligence);}
  toolbar.addEventListener('click',()=>openIntelligence());forecastInline.addEventListener('click',()=>openIntelligence());
  document.querySelectorAll('[data-intelligence-tab]').forEach(button=>button.addEventListener('click',()=>showIntelligenceTab(button.dataset.intelligenceTab)));

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
    suiteTools.innerHTML=[['receipt','Skeniraj račun','Scan receipt'],['fire','FIRE simulator','FIRE simulator'],['renewals','Obnove pretplata','Renewals'],['household','Kućanstvo','Household']].map(([id,hr,en])=>`<button type="button" class="secondary-button" data-suite-action="${id}">${copy(hr,en)}</button>`).join('');
    if(appState.activeAccount==='business')suiteTools.insertAdjacentHTML('beforeend',`<button type="button" class="secondary-button" data-suite-action="tax">${copy('Porezni trezor','Tax vault')}</button>`);
    if(taxDialog.open){const restore=window.MerPlanNavigation?.preserveFocus(taxDialog);renderTaxVault();restore?.();}
    receiptTrigger.innerHTML=`${icon('receipt')}<span>${copy('Skeniraj račun','Scan receipt')}</span>`;
    toolbar.querySelector('span').textContent=copy('Planiraj unaprijed','Plan ahead');
    el('intelligenceModalTitle').textContent=copy('Planirajte s više sigurnosti','Plan with confidence');
    el('commandPaletteTitle').textContent=copy('Što želite učiniti?','What would you like to do?');
    el('commandSearch').placeholder=copy('Pretražite transakcije, ciljeve, postavke…','Search transactions, goals, settings…');
    el('commandSearch').setAttribute('aria-label',copy('Globalna pretraga','Global search'));
    el('commandTrigger').setAttribute('aria-label',copy('Globalna pretraga (Ctrl K)','Global search (Ctrl K)'));
    if(commandDialog.open)renderCommands();
    [['forecast','Novčani tok','Cash flow'],['scenario','Isprobaj scenarij','What if?'],['rules','Automatizacija','Automation']].forEach(([tab,hr,en])=>{document.querySelector(`[data-intelligence-tab="${tab}"]`).textContent=copy(hr,en);});
    const f=forecast();document.querySelector('.topbar').dataset.health=f.health;
    forecastInline.innerHTML=`<span>${copy('Sigurno za potrošnju · 30 dana','Safe to spend · 30 days')}<small>${copy('Nakon očekivanih računa','After expected bills')} · ${copy('Pretplate','Subscriptions')}: ${f.radar.length}</small></span><strong data-money>${money(f.safeToSpendCents)}</strong><span aria-hidden="true">↗</span>`;
    invoiceButton.hidden=appState.activeAccount!=='business';
    window.MerInvoiceUI?.refresh();
    window.MerReceiptUI?.refresh();
    window.MerHouseholdUI?.render();
    renderRenewalStatus();
    const drafts=state.transactions.filter(tx=>tx.offlineDraft).length;offline.hidden=navigator.onLine&&!drafts;offline.textContent=copy(`${navigator.onLine?'Nacrti':'Izvanmrežno'} · ${drafts}`,`${navigator.onLine?'Drafts':'Offline'} · ${drafts}`);
    if(intelligence.open)showIntelligenceTab(currentTab);
    markAmounts();
  }
  window.addEventListener('online',render);window.addEventListener('offline',render);
  const renewalAlert=document.createElement('button');renewalAlert.type='button';renewalAlert.id='renewalSafeguardAlert';renewalAlert.className='renewal-safeguard-alert';renewalAlert.hidden=true;el('notificationList').before(renewalAlert);
  renewalAlert.addEventListener('click',()=>window.MerPlanningUI?.open('renewals'));
  function renderRenewalStatus(){const count=window.MerPlanningUI?.reminders().length||0;renewalAlert.hidden=!count;renewalAlert.textContent=copy(`${count} obnove uskoro · Pregledaj podsjetnike`,`${count} renewals due · Review reminders`);const total=buildNotifications().length+count;el('notificationCount').textContent=total;el('notificationCount').hidden=!total;el('notificationButton').setAttribute('aria-label',t('notificationCount',{count:total}));}
  window.addEventListener('mer:renewal-reminders',renderRenewalStatus);
  window.MerEnterpriseUI=Object.freeze({render,openCommands,openIntelligence});
  render();
})();
