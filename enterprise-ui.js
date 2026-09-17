(function enterpriseInterface() {
  'use strict';
  const E = window.MerEnterpriseCore;
  const el = id => document.getElementById(id);
  const copy = (hr,en) => currentLang === 'en' ? en : hr;
  const money = cents => currency((Number(cents)||0)/100);
  const esc = escapeHtml;
  const icon = name => `<svg aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
  let pendingAnalysis = null, commandIndex = 0, visibleCommands = [];

  function act(fn) { return Promise.resolve().then(fn).catch(error => { window.MerRuntime?.report(error,{silent:true}); showToast(copy('Radnja nije uspjela. Pokušajte ponovno.','Action failed. Please try again.')); }); }
  function makeDialog(id,title,body,className='') {
    const dialog = document.createElement('dialog');
    dialog.id=id; dialog.className=`modal enterprise-dialog ${className}`;
    dialog.setAttribute('aria-labelledby',`${id}Title`);
    dialog.innerHTML=`<header class="enterprise-dialog-head"><h2 id="${id}Title">${esc(title)}</h2><button type="button" class="icon-button" data-enterprise-close aria-label="${copy('Zatvori','Close')}">${icon('x')}</button></header>${body}<footer class="modal-actions enterprise-footer"><button type="button" class="secondary-button" data-enterprise-close data-enterprise-footer-close>${copy('Zatvori','Close')}</button></footer>`;
    document.body.append(dialog);
    dialog.querySelectorAll('[data-enterprise-close]').forEach(button=>button.addEventListener('click',()=>closeModal(dialog)));
    dialog.addEventListener('close',()=>{syncModalLayer(); if(dialog.id==='intelligenceModal')pendingAnalysis?.abort();});
    MerRuntime.bindDialogBackdropDismiss(dialog,()=>closeModal(dialog));
    return dialog;
  }
  window.MerEnterpriseBridge = Object.freeze({
    getState:()=>({activeProfile:appState.activeAccount,profiles:appState.accounts,language:currentLang,currency:appState.settings.currency}),
    openModal(dialog){window.MerPlanNavigation?.enter(dialog);window.MerPlanNavigation?.enhance(dialog);openModal(dialog);}, closeModal,
    currentUser:()=>window.MerAuthProvider?.currentSession(),
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
  controls.innerHTML=`<button type="button" class="icon-button" id="commandTrigger" aria-label="Naredbe (Ctrl K)" title="Naredbe · Ctrl / ⌘ K">${icon('search')}</button>`;
  document.querySelector('.header-action-cluster').prepend(controls);
  const toolbar=document.createElement('button');toolbar.type='button';toolbar.id='openIntelligence';toolbar.className='secondary-button';
  toolbar.innerHTML=`${icon('spark')}<span>${copy('Novčani tok','Cash flow')}</span>`;
  document.querySelector('#overviewView .heading-actions').prepend(toolbar);
  const invoiceButton=document.createElement('button');invoiceButton.type='button';invoiceButton.id='openEnterpriseInvoice';invoiceButton.className='secondary-button';invoiceButton.textContent='e-Račun';invoiceButton.hidden=true;
  document.querySelector('#overviewView .heading-actions').prepend(invoiceButton);
  invoiceButton.addEventListener('click',()=>window.MerInvoiceUI?.open());

  const commandDialog=makeDialog('commandPalette',copy('Što želite učiniti?','What would you like to do?'),`<input id="commandSearch" type="search" autocomplete="off" placeholder="Pretražite naredbe…" aria-label="Pretraži naredbe" role="combobox" aria-expanded="true" aria-controls="commandResults" aria-autocomplete="list"><div id="commandResults" role="listbox" aria-label="Naredbe"></div><footer class="command-hint">↑ ↓ ${copy('Odabir','Choose')} · Enter · Esc</footer>`,'command-dialog');
  function commands() {
    return [
      ...[['overview','Pregled','Overview'],['budgets','Budžete','Budgets'],['savings','Štednju','Savings'],['activity','Aktivnost','Activity'],['insights','Uvide','Insights']].map(([id,hr,en])=>({label:copy(`Idi na ${hr}`,`Go to ${en}`),keywords:({overview:'Pregled',budgets:'Budžeti',savings:'Štednja',activity:'Aktivnost',insights:'Uvidi'})[id],run:()=>showView(id)})),
      {label:copy('Novi trošak','New expense'),run:()=>openTransaction()},
      {label:copy('Novi prihod','New income'),run:()=>openIncomeTransaction()},
      {label:copy('Mjesečni osvrt — Financial Wrapped','Monthly review — Financial Wrapped'),run:()=>window.MerEngagementUI?.openWrapped()},
      {label:copy('Financijsko zdravlje — detaljna analiza','Financial health — detailed analysis'),run:()=>window.MerEngagementUI?.openHealth()},
      {label:copy('Izvoz — sve transakcije','Export — all transactions'),run:()=>window.MerExportUI?.open('activity',{timeframe:'all'})},
      {label:copy('Izvoz — budžeti','Export — budgets'),run:()=>document.querySelector('[data-export-budget]').click()},
      {label:copy('Izvoz — izvještaj uvida','Export — insights report'),run:()=>document.querySelector('[data-export-insights]').click()},
      {quick:'password',label:copy('Lozinka — promjena lozinke','Password — change password'),run:()=>openSetting('security','currentPasswordInput')},
      {quick:'language',label:copy('Promjena jezika — Hrvatski / English','Change language — Hrvatski / English'),run:()=>openSetting('general','settingsLanguage')},
      {quick:'mfa',label:copy('MFA / 2FA — dvostruka autentifikacija','MFA / 2FA — two-factor authentication'),run:()=>openSetting('security','startMfa')},
      {quick:'transactions',label:copy('Sve transakcije','All transactions'),run:()=>{resetActivityFilters();showView('activity');}},
{label:copy('Tema aplikacije — Svijetla / Tamna','App theme — Light / Dark'),run:()=>openSetting('general','themeToggle')},
      {label:copy('Skeniraj račun — OCR i povezivanje','Scan receipt — OCR and matching'),run:()=>window.MerReceiptUI?.open()},
      {label:copy('FIRE — financijska neovisnost','FIRE — financial independence'),run:()=>window.MerPlanningUI?.open('fire')},
      {label:copy('Pretplate — podsjetnici za obnovu','Subscriptions — renewal reminders'),run:()=>window.MerPlanningUI?.open('renewals')},
      {label:copy('Automatska raspodjela prihoda','Payday auto-split'),run:()=>openIntelligence('rules')},
      {label:copy('Osobni profil · Moj eRačun','Personal profile · Moj eRačun'),run:()=>switchAccount('personal')},
      {label:copy('Poslovni profil · Elektronički računi d.o.o.','Business profile · Elektronički računi d.o.o.'),run:()=>switchAccount('business')},
      {label:copy('Zaključaj aplikaciju','Lock application'),run:()=>window.MerEnterpriseSecurity?.lock()},
      ...(appState.activeAccount==='business'?[{label:copy('Novi e-račun (nacrt)','New e-invoice (draft)'),run:()=>window.MerInvoiceUI?.open()}]:[])
    ];
  }
  function openSetting(tab,id){window.MerPremiumNavigation.openSettings(tab);window.MerPopupLayout?.revealTarget(id);requestAnimationFrame(()=>{const target=el(id);target?.scrollIntoView({block:'center'});target?.focus({preventScroll:true});});}
  function runSearchResult(result){
    if(result.profileId!==appState.activeAccount)return;
    if(result.kind==='transaction'){showView('activity');openTransaction(result.id);}
    if(result.kind==='category'){showView('budgets');openBudgetEditor(result.id);}
    if(result.kind==='income-category'){showView('insights');openIncomeCategoryEditor(result.id);}
    if(result.kind==='goal'){showView('savings');window.MerPremiumNavigation.openGoalEditor(result.id);}
  }
  function renderCommands() {
    const query=el('commandSearch').value;
    const available=commands(), empty=!query.trim();
    const matches=empty?['password','mfa','transactions','language'].map(key=>available.find(command=>command.quick===key)).filter(Boolean):available.filter(command=>MerDiscovery.key(query).split(' ').every(token=>MerDiscovery.key(`${command.label} ${command.keywords||''}`).includes(token)));
    const actions=matches.map(command=>({...command,group:copy('Naredbe i postavke','Actions and settings')}));
    const results=MerDiscovery.search(state,appState.activeAccount,query,{label:category=>category.name||t(category.nameKey||category.id)}).map(result=>{
      const transaction=result.kind==='transaction';
      const group=transaction?`${copy('Transakcije','Transactions')} · ${result.merchant} · ${formatIsoDate(result.date)}`:result.kind==='goal'?copy('Ciljevi i trezori','Goals and vaults'):copy('Kategorije i budžeti','Categories and budgets');
      const status=result.offlineDraft?copy('Nacrt','Draft'):result.date>appReferenceDate?copy('Planirano','Scheduled'):copy('Knjiženo','Posted');
      const amount=appState.settings.hideBalances?'••••':MerCore.formatCurrency(result.amount,{locale:currentLang==='en'?'en-GB':'hr-HR',currency:/^[A-Z]{3}$/.test(result.currency||'')?result.currency:appState.settings.currency});
      return {label:result.label,group,detail:transaction?`${status} · ${amount}`:'',run:()=>runSearchResult(result)};
    });
    const allResults=empty?actions:[...results,...actions];
    visibleCommands=allResults.slice(0,window.innerWidth<=640?4:6);
    commandIndex=Math.max(0,Math.min(commandIndex,visibleCommands.length-1));
    let previousGroup='';
    el('commandResults').innerHTML=visibleCommands.length?visibleCommands.map((command,index)=>{const heading=command.group!==previousGroup?`<div class="command-group" role="presentation">${esc(command.group)}</div>`:'';previousGroup=command.group;return `${heading}<button type="button" role="option" id="commandOption${index}" aria-selected="${index===commandIndex}" data-command-index="${index}"><span>${esc(command.label)}${command.detail?`<small>${esc(command.detail)}</small>`:''}</span><span aria-hidden="true">↵</span></button>`;}).join(''):`<p class="enterprise-muted">${copy('Nema rezultata u aktivnom profilu.','No results in the active profile.')}</p>`;
    let count=el('commandResultHint');
    if(!count){count=document.createElement('p');count.id='commandResultHint';count.className='command-result-hint';count.setAttribute('role','status');el('commandResults').after(count);}
    count.textContent=allResults.length>visibleCommands.length?copy(`Prikazano ${visibleCommands.length} od ${allResults.length} rezultata. Precizirajte pretragu.`,`Showing ${visibleCommands.length} of ${allResults.length} results. Refine your search.`):empty?copy('Brzi pristup · počnite tipkati za sve ostale funkcije.','Quick access · type to find other features.'):'';
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
    if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();commandIndex=(commandIndex+(event.key==='ArrowDown'?1:-1)+visibleCommands.length)%Math.max(1,visibleCommands.length);renderCommands();}
  });
  function toggleStealth(){appState.settings.hideBalances=!appState.settings.hideBalances;save('stealth-toggle');}
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

  const intelligence=makeDialog('intelligenceModal',copy('Novčani tok','Cash flow'),'<p class="enterprise-muted" id="intelligenceProfile"></p><div class="enterprise-dialog-body"><section id="enterpriseForecast"></section></div>');
  const taxDialog=makeDialog('taxVaultModal',copy('Porezni trezor','Tax vault'),'<div class="enterprise-dialog-body" id="planTaxBody"></div>');
  function renderTaxVault(){
    if(appState.activeAccount!=='business'){if(taxDialog.open)closeModal(taxDialog);return;}
    const total=(state.goalBuckets||[]).filter(goal=>goal.taxVault).reduce((sum,goal)=>sum+(Number(goal.current)||0),0);
    el('taxVaultModalTitle').textContent=copy('Porezni trezor','Tax vault');
    el('planTaxBody').innerHTML=`<div class="enterprise-metrics"><div><span>${copy('Rezervirani PDV','Reserved VAT')}</span><strong data-money>${currency(total)}</strong></div></div><label class="enterprise-b2b"><input type="checkbox" id="planTaxVaultToggle" ${state.enterprise?.taxVault?.enabled?'checked':''}>${copy('Izdvajaj PDV iz oporezivih B2B uplata','Reserve VAT from taxable B2B income')}</label><p>${copy('Primjenjuje se samo na prihode označene kao oporeziva B2B uplata.','Applies only to income marked as a taxable B2B payment.')}</p><p>${copy('Pri stopi 25%, PDV sadržan u bruto uplati računa se kao iznos × 25 / 125.','At a 25% rate, VAT included in a gross payment is amount × 25 / 125.')} ${currency(1250)} → ${currency(250)}.</p><p class="enterprise-muted">${copy('Virtualna pričuva nije porezna prijava ni bankovni prijenos.','A virtual reserve, not a tax filing or bank transfer.')}</p>`;
    el('planTaxVaultToggle').addEventListener('change',event=>{state.enterprise||={};state.enterprise.taxVault={...state.enterprise.taxVault,enabled:event.target.checked,rate:25,currency:state.enterprise.taxVault?.currency||appState.settings.currency,startDate:state.enterprise.taxVault?.startDate||appReferenceDate};save('tax-vault-toggle');});
  }
  function openTaxVault(){if(appState.activeAccount!=='business')return;renderTaxVault();window.MerEnterpriseBridge.openModal(taxDialog);}
  const receiptTrigger=document.createElement('button');receiptTrigger.type='button';receiptTrigger.className='secondary-button';receiptTrigger.id='openReceiptScanner';document.querySelector('#activityView .heading-actions')?.prepend(receiptTrigger);receiptTrigger.addEventListener('click',()=>window.MerReceiptUI?.open());
  const receiptAction=document.createElement('button');receiptAction.type='button';receiptAction.className='secondary-button transaction-receipt-action';receiptAction.id='transactionReceiptAction';receiptAction.hidden=true;el('transactionForm').prepend(receiptAction);
  el('transactionModal').addEventListener('toggle',()=>{const tx=state.transactions.find(item=>item.id===editingTransactionId);receiptAction.hidden=!tx;receiptAction.textContent=tx?.receipts?.length?copy(`Povezani računi (${tx.receipts.length})`,`Linked receipts (${tx.receipts.length})`):copy('Poveži fotografiju računa','Attach receipt photo');});
  receiptAction.addEventListener('click',()=>{const tx=state.transactions.find(item=>item.id===editingTransactionId);if(!tx)return;if(tx.receipts?.length)window.MerReceiptUI?.view(tx.id);else window.MerReceiptUI?.open({transactionId:tx.id});});
  let projectionWidth=0, forecastOwner=null, analysisResult=null;
  // Tooltip/inspector height changes must not rebuild the chart or steal focus.
  const resizeProjection=()=>{const chart=el('enterpriseForecast').querySelector('.forecast-chart');if(intelligence.open&&chart&&Math.round(chart.clientWidth)!==projectionWidth)renderProjection();};
  new ResizeObserver(resizeProjection).observe(intelligence);
  function forecast(){return E.forecastCashFlow(state,appReferenceDate,{profileId:appState.activeAccount,currency:appState.settings.currency});}
  function metricsMarkup(f){return `<div class="enterprise-metrics"><div><span>${copy('Sigurno za potrošnju · 30 dana','Safe to spend · 30 days')}</span><strong data-money>${money(f.safeToSpendCents)}</strong></div><div><span>${copy('Očekivani računi','Expected bills')}</span><strong data-money>${money(f.predictedBillsCents)}</strong></div><div><span>${copy('Rezervirano u ciljevima','Reserved in goals')}</span><strong data-money>${money(f.reservedCents)}</strong></div></div>`;}
  function renderProjection(){
    const container=el('enterpriseForecast').querySelector('.forecast-chart');if(!container)return;
    projectionWidth=Math.round(container.clientWidth);
    const model=MerDiscovery.forecastChart(state,appReferenceDate,{profileId:appState.activeAccount,currency:appState.settings.currency});
    const width=Math.max(260,Math.round(container.clientWidth||680)),height=window.innerWidth<600?110:window.innerHeight<740?180:218,left=Math.min(width*.45,Math.max(82,...model.ticks.map(value=>money(value).length*6.7+16))),right=16,top=14,bottom=32,plotWidth=width-left-right,plotHeight=height-top-bottom;
    const x=index=>left+index/30*plotWidth,y=value=>top+(model.maximum-value)/model.range*plotHeight;
    const path=model.series.map((point,index)=>`${index?'L':'M'}${x(index).toFixed(2)},${y(point.balanceCents).toFixed(2)}`).join(' ');
    const axisMoney=value=>MerCore.formatCurrency(value/100,{locale:currentLang==='en'?'en-GB':'hr-HR',currency:model.forecast.currency});
    const dateLabel=value=>new Intl.DateTimeFormat(currentLang==='en'?'en-GB':'hr-HR',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
    const ticks=[0,7,14,21,30];
    container.innerHTML=`<svg viewBox="0 0 ${width} ${height}" style="height:${height}px" role="group" aria-label="${copy('Procjena novčanog toka s očekivanim prihodima i računima','Cash-flow projection with expected income and bills')}"><defs><linearGradient id="forecastAreaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#00a9e4" stop-opacity=".20"/><stop offset="100%" stop-color="#00a9e4" stop-opacity="0"/></linearGradient></defs>${model.ticks.map(value=>`<line class="forecast-gridline" x1="${left}" y1="${y(value)}" x2="${width-right}" y2="${y(value)}"/><text class="forecast-axis" x="${left-8}" y="${y(value)+4}" text-anchor="end">${esc(axisMoney(value))}<title>${esc(money(value))}</title></text>`).join('')}<path d="${path} L${x(30)},${height-bottom} L${left},${height-bottom} Z" fill="url(#forecastAreaFill)"/><path d="${path}" fill="none" stroke="#00a9e4" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${ticks.map(index=>`<text class="forecast-axis" x="${x(index)}" y="${height-14}" text-anchor="${index===0?'start':index===30?'end':'middle'}">${esc(dateLabel(model.series[index].date))}</text>`).join('')}${model.series.map((point,index)=>{const hasExpense=point.events.some(event=>event.kind==='expense'),hasIncome=point.events.some(event=>event.kind==='income'),color=hasExpense?'#c46b2c':hasIncome?'#279465':'#00a9e4';return `<g data-forecast-point="${index}" tabindex="${index===0?0:-1}" role="button" aria-label="${esc(`${formatIsoDate(point.date)} · ${money(point.balanceCents)} · ${point.events.map(event=>event.name).join(', ')}`)}"><circle cx="${x(index)}" cy="${y(point.balanceCents)}" r="12" fill="transparent"/>${point.events.length?`<circle class="forecast-event-node" cx="${x(index)}" cy="${y(point.balanceCents)}" r="5" fill="${color}"/>`:''}${hasExpense&&hasIncome?`<circle cx="${x(index)+5}" cy="${y(point.balanceCents)-5}" r="3" fill="#279465"/>`:''}</g>`;}).join('')}<line class="forecast-hover-line" visibility="hidden" y1="${top}" y2="${height-bottom}"/><circle class="forecast-hover-dot" visibility="hidden" r="5"/></svg><div class="forecast-tooltip" role="tooltip" hidden></div><div class="forecast-legend"><span><i class="bill"></i>${copy('Očekivani račun','Expected bill')}</span><span><i class="income"></i>${copy('Očekivani prihod','Expected income')}</span></div><div class="forecast-inspector" aria-live="polite">${copy('Dodirnite točku ili prijeđite pokazivačem za detalje.','Tap or hover a point for details.')}</div>`;
    const svg=container.querySelector('svg'),tooltip=container.querySelector('.forecast-tooltip'),guide=container.querySelector('.forecast-hover-line'),dot=container.querySelector('.forecast-hover-dot');
    let active=-1;
    const inspectIndex=index=>{
      const point=model.series[index];if(!point)return;
      const rect=svg.getBoundingClientRect(),outer=container.getBoundingClientRect(),scale=rect.width/width;
      if(index!==active){
        active=index;
        const heading=`<strong data-money>${esc(formatIsoDate(point.date))} · ${money(point.balanceCents)}</strong>`;
        const text=heading;
        container.querySelector('.forecast-inspector').innerHTML=text;tooltip.innerHTML=heading;
      }
      tooltip.hidden=false;guide.setAttribute('x1',x(index));guide.setAttribute('x2',x(index));guide.setAttribute('visibility','visible');dot.setAttribute('cx',x(index));dot.setAttribute('cy',y(point.balanceCents));dot.setAttribute('visibility','visible');
      tooltip.style.left=`${Math.max(8,Math.min(container.clientWidth-tooltip.offsetWidth-8,rect.left-outer.left+x(index)*scale-tooltip.offsetWidth/2))}px`;
      tooltip.style.top=`${Math.max(8,rect.top-outer.top+y(point.balanceCents)*scale-tooltip.offsetHeight-12)}px`;
    };
    const inspect=event=>{const node=event.target.closest('[data-forecast-point]');if(node)inspectIndex(Number(node.dataset.forecastPoint));};
    const clear=()=>{tooltip.hidden=true;guide.setAttribute('visibility','hidden');dot.setAttribute('visibility','hidden');};
    svg.onpointermove=event=>inspectIndex(MerQuickToolsCore.chartIndex(event.clientX,svg.getBoundingClientRect(),width,left,plotWidth));
    svg.onpointerleave=clear;container.onclick=inspect;container.onfocusin=inspect;
    container.onfocusout=event=>{if(!svg.contains(event.relatedTarget))clear();};
    container.onkeydown=event=>{const node=event.target.closest('[data-forecast-point]');if(!node)return;if(event.key==='Escape'&&!tooltip.hidden){event.preventDefault();event.stopPropagation();clear();return;}const index=Number(node.dataset.forecastPoint);const next=event.key==='ArrowRight'?Math.min(30,index+1):event.key==='ArrowLeft'?Math.max(0,index-1):event.key==='Home'?0:event.key==='End'?30:null;if(next===null)return;event.preventDefault();node.setAttribute('tabindex','-1');const target=container.querySelector(`[data-forecast-point="${next}"]`);target.setAttribute('tabindex','0');target.focus({preventScroll:true});inspectIndex(next);};
    container.inspectForecastDay=inspectIndex;
  }
  function renderForecast(){
    const restoreFocus=window.MerPlanNavigation?.preserveFocus?.(intelligence);
    const f=forecast();
    const owner=appState.accounts[appState.activeAccount];
    if(forecastOwner!==owner){forecastOwner=owner;analysisResult=null;}
    const model=MerDiscovery.forecastChart(state,appReferenceDate,{profileId:appState.activeAccount,currency:appState.settings.currency});
    const events=model.series.flatMap((point,day)=>point.events.map((event,index)=>({day,index,date:point.date,...event})));
    const eventLabel=event=>`${formatIsoDate(event.date)} · ${event.kind==='income'?copy('Prihod','Income'):copy('Račun','Bill')} · ${event.name} · ${appState.settings.hideBalances?copy('Iznos skriven','Amount hidden'):money(event.amountCents)}${event.source==='pattern'?copy(' (procjena)',' (estimate)'):''}`;
    const limits=copy('Procjena, ne bankovno stanje. Očekivani prihodi raspoloživi su tek nakon knjiženja.','An estimate, not a bank balance. Expected income is available only after posting.')+(f.confidence==='limited-history'?copy(' Malo povijesnih podataka.',' Limited history.'):'')+(f.foreignCurrencyCount?copy(` Izostavljeno ${f.foreignCurrencyCount} zapisa u drugim valutama; nema konverzije.`,` ${f.foreignCurrencyCount} foreign-currency records excluded; no conversion.`):'');
    el('enterpriseForecast').innerHTML=`<section class="cashflow-summary" aria-label="${copy('Sažetak i AI uvid','Summary and AI insight')}">${metricsMarkup(f)}<div class="cashflow-ai-toolbar"><p>${copy('OpenAI prima zbirne iznose, bez trgovaca i osobnih podataka.','OpenAI receives totals without merchants or personal data.')}</p><button type="button" class="secondary-button" id="analyzeCashflow">${copy('AI uvid','AI insight')}</button></div><div id="cashflowAnalysis" aria-live="polite"></div></section><section class="cashflow-visual" aria-label="${copy('Novčani tok i prognoza','Cash flow and forecast')}"><div class="forecast-chart"></div><label class="forecast-event-picker" for="forecastEventPicker"><span>${copy('Očekivani prihodi i računi','Expected income and bills')} · ${events.length}</span><select id="forecastEventPicker" ${events.length?'':'disabled'}><option value="">${events.length?copy('Odaberite događaj za detalje','Choose an event for details'):copy('Nema očekivanih događaja','No expected events')}</option>${events.map(event=>`<option value="${event.day}:${event.index}">${esc(eventLabel(event))}</option>`).join('')}</select></label><p class="forecast-model-note">${esc(limits)}</p></section>`;
    el('analyzeCashflow').addEventListener('click',()=>act(analyzeCashflow));
    el('forecastEventPicker').addEventListener('change',event=>{
      const selected=events.find(item=>`${item.day}:${item.index}`===event.target.value);
      if(!selected)return;
      event.target.title=eventLabel(selected);
      el('enterpriseForecast').querySelector('.forecast-chart').inspectForecastDay?.(selected.day);
    });
    if(analysisResult?.account===appState.activeAccount&&analysisResult.revision===reactiveStore.getRevision())renderAnalysis(analysisResult.message);
    renderProjection();
    requestAnimationFrame(resizeProjection);
    restoreFocus?.();
  }
  function renderAnalysis(message){
    const box=el('cashflowAnalysis'),chunks=String(message).match(/[\s\S]{1,120}(?:\s|$)|[\s\S]{1,120}/gu)||[];
    box.innerHTML=chunks.map(chunk=>`<p class="forecast-analysis-page">${esc(chunk)}</p>`).join('');
    window.MerPagination?.attach(box,{pageSize:1,itemSelector:'.forecast-analysis-page',scopeKey:appState.activeAccount,label:copy('Objašnjenje prognoze','Forecast explanation')});
  }
  async function analyzeCashflow(){
    pendingAnalysis?.abort();const controller=new AbortController();pendingAnalysis=controller;const account=appState.activeAccount,revision=reactiveStore.getRevision();
    const box=el('cashflowAnalysis'),button=el('analyzeCashflow');button.disabled=true;box.setAttribute('aria-busy','true');box.innerHTML='<div class="enterprise-skeleton" role="status" aria-label="Učitavanje"><i></i><i></i><i></i></div>';
    const timer=setTimeout(()=>controller.abort(),25000);
    try{const response=await fetch('/api/cashflow',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locale:currentLang,analysis:E.anonymizedForecast(forecast())}),signal:controller.signal});const result=await response.json();if(account!==appState.activeAccount||revision!==reactiveStore.getRevision()||!intelligence.open)return;const message=String(result.message||copy('AI trenutno nije dostupan. Lokalna prognoza ostaje dostupna.','AI unavailable. Your local forecast is still available.'));analysisResult={account,revision,message};renderAnalysis(message);}
    catch{if(intelligence.open&&account===appState.activeAccount)renderAnalysis(copy('OpenAI nije dostupan. Provjerite vezu ili poslužiteljski API ključ. Lokalna procjena ostaje dostupna.','OpenAI is unavailable. Check connectivity or the server API key. The local estimate remains available.'));}
    finally{clearTimeout(timer);button.disabled=false;box.setAttribute('aria-busy','false');}
  }
  function openIntelligence(tab='forecast'){if(tab==='rules'){window.MerVaultsUI?.open('automation');return;}el('intelligenceProfile').textContent=state.accountName||appState.activeAccount;renderForecast();openModal(intelligence);}
  toolbar.addEventListener('click',()=>openIntelligence());

  const b2b=document.createElement('label');b2b.id='transactionB2BRow';b2b.className='enterprise-b2b';b2b.hidden=true;b2b.innerHTML=`<input type="checkbox" id="transactionB2B"> ${copy('Oporeziva B2B uplata (iznos uključuje 25% PDV-a)','Taxable B2B payment (amount includes 25% VAT)')}`;
  el('transactionForm').querySelector('.modal-actions').before(b2b);
  const security=document.createElement('section');security.className='enterprise-security-actions';
  const autoLockSetting=document.createElement('label');autoLockSetting.className='toggle-setting auto-lock-setting';
  autoLockSetting.innerHTML='<input type="checkbox" role="switch" id="autoLockEnabled" aria-describedby="autoLockHint"><span><strong id="autoLockLabel"></strong><small id="autoLockHint"></small></span>';
  document.querySelector('[data-settings-panel="security"]').prepend(autoLockSetting);
  el('autoLockEnabled').addEventListener('change',event=>{
    const enabled=event.target.checked;
    reactiveStore.update('auto-lock-preference',draft=>{draft.settings.autoLockEnabled=enabled;});
    window.MerEnterpriseSecurity?.syncAutoLock();
    showToast(copy(enabled?'Automatsko zaključavanje je uključeno.':'Automatsko zaključavanje je isključeno.',enabled?'Automatic locking is on.':'Automatic locking is off.'));
  });
  security.innerHTML=`<h3>${copy('Zaštita uređaja','Device protection')}</h3><p class="enterprise-muted">${copy('Automatsko zaključavanje možete uključiti iznad. Lokalni račun i podaci ovog preglednika; nije upravljanje udaljenim bankovnim računom.','Enable automatic locking above if needed. Manages this browser’s local account and data, not remote bank accounts.')}</p><div class="enterprise-action-grid"><button type="button" class="secondary-button" id="configureVault">${copy('Šifriranje i PIN','Encryption and PIN')}</button><button type="button" class="secondary-button" id="lockNow">${copy('Zaključaj sada','Lock now')}</button><button type="button" class="secondary-button" id="exportSovereignty">${copy('Preuzmi sve podatke (JSON)','Download all data (JSON)')}</button><button type="button" class="secondary-button danger" id="deleteSovereignty">${copy('Trajno izbriši lokalni račun','Permanently delete local account')}</button></div>`;
  document.querySelector('[data-settings-panel="security"]').append(security);
  el('configureVault').addEventListener('click',()=>act(()=>window.MerEnterpriseSecurity?.openVaultSetup()));
  el('lockNow').addEventListener('click',()=>act(()=>window.MerEnterpriseSecurity?.lock()));
  const pinButton=document.createElement('button');pinButton.type='button';pinButton.className='secondary-button';pinButton.id='enterprisePinSetup';pinButton.textContent=copy('Postavi PIN za demo','Set demo PIN');security.querySelector('.enterprise-action-grid').append(pinButton);
  pinButton.addEventListener('click',()=>act(()=>window.MerEnterpriseSecurity?.openPinSetup()));
  const installButton=document.createElement('button');installButton.type='button';installButton.className='secondary-button';installButton.id='enterpriseInstall';installButton.textContent=copy('Instaliraj Mer','Install Mer');security.querySelector('.enterprise-action-grid').append(installButton);
  installButton.addEventListener('click',()=>act(()=>window.MerEnterpriseSecurity?.install()));
  const securityStatus=document.createElement('p');securityStatus.id='enterpriseSecurityStatus';securityStatus.className='enterprise-muted';security.append(securityStatus);
  function renderSecurity(){const status=window.MerEnterpriseSecurity?.status();pinButton.hidden=!status?.demo;installButton.hidden=!status?.canInstall;securityStatus.textContent=copy(status?.encrypted?'AES-256 šifriranje je uključeno.':'Demo predmemorija nije šifrirana. Uključite privatni trezor prije unosa osjetljivih podataka.',status?.encrypted?'AES-256 encryption is enabled.':'Demo cache is not encrypted. Enable the private vault before entering sensitive data.');
    el('autoLockEnabled').checked=appState.settings.autoLockEnabled===true;
    el('autoLockLabel').textContent=copy('Automatsko zaključavanje (10 min neaktivnosti)','Automatic locking (10 min of inactivity)');
    el('autoLockHint').textContent=copy('Isključeno prema zadanim postavkama. Uključite ako želite zaključavanje nakon pauze. Ručno zaključavanje ostaje dostupno.','Off by default. Enable to lock after a break. Manual locking remains available.');
  }
  window.addEventListener('mer-security-status',renderSecurity);renderSecurity();
  el('exportSovereignty').addEventListener('click',()=>act(()=>window.MerEnterpriseSecurity?.exportAll()));
  el('deleteSovereignty').addEventListener('click',()=>act(()=>window.MerEnterpriseSecurity?.requestDelete()));
  const offline=document.createElement('button');offline.type='button';offline.id='offlineStatus';offline.className='offline-status';document.querySelector('#activityView .heading-actions')?.prepend(offline);
  const draftDialog=makeDialog('offlineDraftModal',copy('Izvanmrežni nacrti','Offline drafts'),'<div class="enterprise-dialog-body" id="offlineDraftList"></div>');
  function renderDrafts(){const drafts=state.transactions.filter(tx=>tx.offlineDraft);el('offlineDraftList').innerHTML=drafts.map(tx=>`<div class="enterprise-draft"><span>${esc(tx.name)}<small>${esc(tx.date.slice(0,10))}</small></span><strong data-money>${currency(tx.amount)}</strong><button type="button" class="primary-button" data-post-draft="${esc(tx.id)}" ${navigator.onLine?'':'disabled'}>${copy('Potvrdi unos','Confirm entry')}</button><button type="button" class="secondary-button" data-delete-draft="${esc(tx.id)}">${copy('Obriši','Delete')}</button></div>`).join('')||`<p>${copy('Nema spremljenih nacrta.','No saved drafts.')}</p>`;window.MerPagination?.attach(el('offlineDraftList'),{pageSize:()=>window.innerWidth<600||window.innerHeight<700?2:4,itemSelector:'.enterprise-draft',scopeKey:appState.activeAccount,label:copy('Nacrti','Drafts')});}
  offline.addEventListener('click',()=>{renderDrafts();openModal(draftDialog);});
  draftDialog.addEventListener('click',event=>{const post=event.target.closest('[data-post-draft]'),remove=event.target.closest('[data-delete-draft]');if(post&&navigator.onLine){const tx=state.transactions.find(tx=>tx.id===post.dataset.postDraft&&tx.offlineDraft);if(tx){delete tx.offlineDraft;tx.status='posted';MerCore.updateTransactionSchedule(tx,appReferenceDate);MerAccounting.applyRoundUp(state,tx,appReferenceDate);save('offline-draft-post');renderDrafts();}}if(remove){state.transactions=state.transactions.filter(tx=>!(tx.id===remove.dataset.deleteDraft&&tx.offlineDraft));save('offline-draft-delete');renderDrafts();}});
  function render(){
    window.MerEnterpriseSecurity?.syncAutoLock();
    document.querySelectorAll('[data-enterprise-footer-close]').forEach(button=>{button.textContent=copy('Zatvori','Close');});
    renderSecurity();
    if(taxDialog.open){const restore=window.MerPlanNavigation?.preserveFocus(taxDialog);renderTaxVault();restore?.();}
    receiptTrigger.innerHTML=`${icon('receipt')}<span>${copy('Skeniraj račun','Scan receipt')}</span>`;
    toolbar.querySelector('span').textContent=copy('Novčani tok','Cash flow');
    el('intelligenceModalTitle').textContent=copy('Novčani tok','Cash flow');
    el('commandPaletteTitle').textContent=copy('Što želite učiniti?','What would you like to do?');
    el('commandSearch').placeholder=copy('Pretražite transakcije, ciljeve, postavke…','Search transactions, goals, settings…');
    el('commandSearch').setAttribute('aria-label',copy('Globalna pretraga','Global search'));
    el('commandTrigger').setAttribute('aria-label',copy('Globalna pretraga (Ctrl K)','Global search (Ctrl K)'));
    if(commandDialog.open)renderCommands();
    const f=forecast();document.querySelector('.topbar').dataset.health=f.health;
    invoiceButton.hidden=appState.activeAccount!=='business';
    window.MerInvoiceUI?.refresh();
    window.MerReceiptUI?.refresh();
    window.MerPlanningHubs?.render();
    renderRenewalStatus();
    const drafts=state.transactions.filter(tx=>tx.offlineDraft).length;offline.hidden=navigator.onLine&&!drafts;offline.textContent=copy(`${navigator.onLine?'Nacrti':'Izvanmrežno'} · ${drafts}`,`${navigator.onLine?'Drafts':'Offline'} · ${drafts}`);
    if(intelligence.open)renderForecast();
    markAmounts();
  }
  window.addEventListener('online',render);window.addEventListener('offline',render);
  const renewalAlert=document.createElement('button');renewalAlert.type='button';renewalAlert.id='renewalSafeguardAlert';renewalAlert.className='renewal-safeguard-alert';renewalAlert.hidden=true;el('notificationList').before(renewalAlert);
  renewalAlert.addEventListener('click',()=>window.MerPlanningUI?.open('renewals'));
  function renderRenewalStatus(){const count=window.MerPlanningUI?.reminders().length||0;renewalAlert.hidden=!count;renewalAlert.textContent=copy(`${count} obnove uskoro · Pregledaj podsjetnike`,`${count} renewals due · Review reminders`);const total=buildNotifications().length+count;el('notificationCount').textContent=total;el('notificationCount').hidden=!total;el('notificationButton').setAttribute('aria-label',t('notificationCount',{count:total}));}
  window.addEventListener('mer:renewal-reminders',renderRenewalStatus);
  window.MerEnterpriseUI=Object.freeze({render,openCommands,openIntelligence,openTaxVault});
  render();
})();
