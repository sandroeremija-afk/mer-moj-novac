(function initializeEngagement() {
  'use strict';
  const E = window.MerEngagement, el = id => document.getElementById(id);
  const say = (hr,en) => currentLang === 'en' ? en : hr, esc = escapeHtml;
  let owner = '', storyIndex = 0, storyMonth = '', proposal = null, proposalOwner = '', aiRequest = null;
  const snapshot = () => {
    const base = window.MerExportBridge.snapshot(), session = window.MerAuthProvider?.currentSession?.();
    return {...base,userId:session?.userId || '',categories:[...state.categories.map(category => ({id:category.id,name:categoryName(category.id),type:'expense'})),...state.incomeCategories.map(category => ({id:category.id,name:incomeCategoryName(category.id),type:'income'}))]};
  };
  const options = () => ({profileId:appState.activeAccount,currency:appState.settings.currency,referenceDate:appReferenceDate});
  const identity = () => { const context=snapshot(); return `${context.sessionId}|${context.profileId}`; };
  const responseContext = () => `${identity()}|${currentLang}|${appState.settings.currency}`;
  const money = value => `<span data-money>${esc(currency(value/100))}</span>`;
  window.MerEngagementBridge = Object.freeze({
    snapshot, openModal, closeModal, toast:showToast, categoryLabel:categoryName,
    mutate(reason, action) { if(!snapshot().authenticated)throw new Error('Session unavailable'); reactiveStore.update(reason,draft=>action(draft.accounts[draft.activeAccount])); },
    applyTransactionDraft(draft) {
      if(!snapshot().authenticated || !el('transactionModal').open)throw new Error('Form closed');
      if(!draft || !['income','expense'].includes(draft.type) || !Number.isFinite(draft.amount) || draft.amount<=0 || draft.amount>999999999 || !validStoredDate(draft.date))throw new Error('Invalid draft');
      setTransactionType(draft.type);
      el('transactionName').value=String(draft.merchant||draft.name||'').slice(0,100);
      el('transactionAmount').value=draft.amount.toFixed(2);el('transactionDate').value=draft.date;
      const categories=draft.type==='income'?state.incomeCategories:state.categories;
      if(categories.some(category=>category.id===draft.categoryId))el('transactionCategory').value=draft.categoryId;
      else {let blank=el('transactionCategory').querySelector('option[value=""]');if(!blank){blank=new Option(say('Odaberite kategoriju','Choose a category'),'');el('transactionCategory').prepend(blank);}el('transactionCategory').value='';el('transactionCategory').required=true;}
      evaluateTransaction();
    }
  });
  function dialog(id,title,body) {
    const node=document.createElement('dialog');node.id=id;node.className='modal engagement-dialog';node.setAttribute('aria-labelledby',`${id}Title`);
    node.innerHTML=`<header class="engagement-head"><h2 id="${id}Title">${esc(title)}</h2><button class="icon-button" type="button" data-engagement-close aria-label="${say('Zatvori','Close')}">×</button></header>${body}`;
    document.body.append(node);node.querySelectorAll('[data-engagement-close]').forEach(button=>button.addEventListener('click',()=>closeModal(node)));
    node.addEventListener('cancel',event=>{event.preventDefault();closeModal(node);});
    MerRuntime.bindDialogBackdropDismiss(node,()=>closeModal(node));return node;
  }
  const recommendationCopy = {
    save:['Izdvojite do 20% prihoda u štednju.','Build toward saving 20% of income.'], 'keep-saving':['Zadržite redovite uplate u trezore.','Keep regular vault contributions.'],
    rebalance:['Pregledajte prekoračene kategorije.','Review overspent categories.'], 'keep-budget':['Nastavite pratiti limite kategorija.','Keep monitoring category limits.'], 'set-budget':['Postavite mjesečne limite.','Set monthly category limits.'],
    buffer:['Postupno gradite pričuvu za 6 mjeseci.','Build a six-month reserve gradually.'], 'keep-buffer':['Sačuvajte svoju sigurnosnu pričuvu.','Maintain your emergency reserve.'], 'set-essentials':['Unesite osnovne mjesečne troškove.','Set essential monthly costs.']
  };
  const healthCard=document.createElement('section');healthCard.id='financialHealthWidget';healthCard.className='financial-health-widget';healthCard.setAttribute('aria-label',say('Financijsko zdravlje','Financial health'));
  healthCard.innerHTML='<button class="health-score-trigger" id="healthScoreTrigger" type="button"><span id="healthScore" data-money>—</span><span id="healthLabel"></span></button><ul id="healthRecommendations"></ul><button class="secondary-button" id="healthImprove" type="button"></button>';
  document.querySelector('#overviewView .summary-grid').after(healthCard);
  const healthDialog=dialog('financialHealthModal','Financijsko zdravlje','<div class="engagement-body"><p id="healthExplanation"></p><div id="healthBreakdown"></div><h3 id="rebalanceTitle"></h3><p id="rebalanceDescription"></p><div id="rebalanceRows" class="engagement-table-wrap"></div><p id="rebalanceNote" role="status"></p><button type="button" class="secondary-button" id="healthAiExplain"></button><p id="healthAiConsent" class="engagement-caption"></p><p id="healthAiResponse" role="status"></p></div><footer class="engagement-footer"><button type="button" class="secondary-button" data-engagement-close id="healthCancel"></button><button type="button" class="primary-button" id="applyHealthPlan"></button></footer>');
  function openHealth() {
    if(!snapshot().authenticated)return;
    proposal=E.rebalance(state,options());proposalOwner=identity();aiRequest?.abort();el('healthAiResponse').textContent='';
    const result=E.health(state,options());
    el('financialHealthModalTitle').textContent=say('Financijsko zdravlje','Financial health');
    el('healthExplanation').textContent=say('Informativna ocjena, nije kreditni rejting ni financijski savjet. 40 bodova: stopa štednje prema cilju od 20%. 35: poštivanje limita. 25: glavni fond pokriva 6 mjeseci osnovnih troškova. Bez prihoda nema pouzdane ocjene.','An informational score, not a credit rating or financial advice. 40 points: savings toward a 20% rate. 35: budget adherence. 25: the primary reserve covers six months of essentials. No income means no reliable score.');
    el('healthBreakdown').innerHTML=`<div><span>${say('Stopa štednje','Savings rate')}</span><strong data-money>${Math.round(result.savingsRate*100)}%</strong></div><div><span>${say('Poštivanje limita','Budget adherence')}</span><strong data-money>${Math.round(result.adherence*100)}%</strong></div><div><span>${say('Mjeseci pričuve','Buffer months')}</span><strong data-money>${result.bufferMonths.toFixed(1)}</strong></div>`;
    el('rebalanceTitle').textContent=say('Prijedlog preraspodjele','Rebalancing proposal');
    el('rebalanceDescription').textContent=say('Premještamo samo neiskorištene limite prema kategorijama s prekoračenjem. Ukupni budžet ostaje isti. Ništa se ne mijenja bez vaše potvrde.','Move unused limits to overspent categories. The total budget stays the same. Nothing changes without your confirmation.');
    el('rebalanceRows').innerHTML=proposal.rows.filter(row=>row.limitCents!==row.newLimitCents).map(row=>`<div class="rebalance-row"><span>${esc(categoryName(row.id))}</span><span>${money(row.limitCents)} → ${money(row.newLimitCents)}</span></div>`).join('');
    el('rebalanceNote').innerHTML=proposal.shortfallCents>0?`${say('Nedovoljno slobodnih limita. Nepokriveno:','Insufficient unused limits. Uncovered:')} ${money(proposal.shortfallCents)}`:proposal.changed?say('Provjerite nove limite prije primjene.','Review the new limits before applying.'):say('Nema prekoračenih kategorija za preraspodjelu.','No overspent categories need rebalancing.');
    el('healthAiExplain').textContent=say('Zatraži Gemini objašnjenje','Ask Gemini to explain');el('healthAiExplain').disabled=false;
    el('healthAiConsent').textContent=say('Klikom šaljete Gemini servisu samo zbirne iznose i numerirane limite, bez imena, IBAN-a ili pojedinačnih transakcija. Prijedlog limita izračunava Mer, a AI ga objašnjava.','Clicking sends only totals and numbered limits to Gemini, without names, IBANs or individual transactions. Mer calculates the limits; AI explains the proposal.');
    el('healthCancel').textContent=say('Otkaži','Cancel');el('applyHealthPlan').textContent=say('Primijeni prijedlog','Apply proposal');el('applyHealthPlan').disabled=!proposal.changed;
    openModal(healthDialog);
  }
  el('healthScoreTrigger').addEventListener('click',openHealth);el('healthImprove').addEventListener('click',openHealth);
  el('applyHealthPlan').addEventListener('click',()=>{
    if(proposalOwner!==identity())return closeModal(healthDialog);
    try {window.MerEngagementBridge.mutate('health-rebalance',profile=>E.applyRebalance(profile,proposal,options()));closeModal(healthDialog);showToast(say('Limiti su preraspodijeljeni. Ukupni budžet je nepromijenjen.','Limits rebalanced. The total budget is unchanged.'));}
    catch {el('rebalanceNote').textContent=say('Podaci su promijenjeni. Zatvorite i ponovno otvorite prijedlog.','Data changed. Close and reopen the proposal.');el('applyHealthPlan').disabled=true;}
  });
  el('healthAiExplain').addEventListener('click',async()=>{
    aiRequest?.abort();const request=new AbortController();aiRequest=request;const context=responseContext(), revision=reactiveStore.getRevision();
    const result=E.health(state,options());el('healthAiExplain').disabled=true;el('healthAiResponse').textContent=say('Gemini priprema objašnjenje…','Gemini is preparing an explanation…');
    try {const response=await fetch('/api/health-advice',{method:'POST',headers:{'Content-Type':'application/json'},signal:request.signal,body:JSON.stringify({locale:currentLang,consent:true,analysis:{currency:appState.settings.currency,score:result.score,incomeCents:result.incomeCents,savedCents:result.savedCents,bufferMonths:result.bufferMonths,shortfallCents:proposal.shortfallCents,categories:proposal.rows.map((row,index)=>({index:index+1,spentCents:row.spentCents,limitCents:row.limitCents,newLimitCents:row.newLimitCents}))}})});const data=await response.json();if(!response.ok)throw new Error(data.error);if(request.signal.aborted||context!==responseContext()||aiRequest!==request||revision!==reactiveStore.getRevision()||!healthDialog.open)return;el('healthAiResponse').textContent=String(data.message||'');}
    catch(error){if(error.name!=='AbortError'&&!request.signal.aborted&&aiRequest===request&&context===responseContext()&&revision===reactiveStore.getRevision()&&healthDialog.open)el('healthAiResponse').textContent=say('Gemini trenutačno nije dostupan. Provjereni prijedlog limita ostaje dostupan bez AI-ja.','Gemini is unavailable. The verified limit proposal remains available without AI.');}
    finally {if(aiRequest===request)el('healthAiExplain').disabled=false;}
  });
  healthDialog.addEventListener('close',()=>aiRequest?.abort());
  const storyDialog=dialog('financialWrappedModal','Vaš mjesečni pregled','<div class="wrapped-progress" id="wrappedProgress" aria-hidden="true"></div><div class="wrapped-controls"><label for="wrappedMonth" id="wrappedMonthLabel"></label><input type="month" id="wrappedMonth"></div><div class="engagement-body wrapped-story" id="wrappedStory" aria-live="polite"></div><footer class="engagement-footer"><button type="button" class="secondary-button" id="wrappedBack"></button><span id="wrappedStep"></span><button type="button" class="primary-button" id="wrappedNext"></button></footer>');
  storyDialog.classList.add('wrapped-dialog');
  const badges={start:['Novi početak','A fresh start'],saver:['Majstor štednje','Savings master'],disciplined:['Disciplinirani budžet','Budget discipline'],aware:['Svjestan potrošač','Mindful spending']};
  function renderStory() {
    const result=E.monthlySummary(state,{...options(),month:storyMonth});
    el('financialWrappedModalTitle').textContent=say('Vaš mjesečni pregled','Your monthly wrapped');el('wrappedMonthLabel').textContent=say('Mjesec','Month');
    el('wrappedProgress').innerHTML=Array.from({length:4},(_,index)=>`<span class="${index<=storyIndex?'complete':''}"></span>`).join('');
    el('wrappedStep').textContent=say(`${storyIndex+1} od 4`,`${storyIndex+1} of 4`);el('wrappedBack').textContent=say('Natrag','Back');el('wrappedBack').disabled=storyIndex===0;el('wrappedNext').textContent=storyIndex===3?say('Završi','Finish'):say('Dalje','Next');
    const profileName=appState.activeAccount==='business'?say('Poslovni račun','Business'):say('Osobni račun','Personal');
    const intro=`<p class="wrapped-caption">${esc(profileName)} · ${esc(storyMonth)}</p>`;
    const slides=[
      `<h3>${say('Vaš novac u pokretu','Your money in motion')}</h3><dl><div><dt>${say('Prihodi','Income')}</dt><dd>${money(result.incomeCents)}</dd></div><div><dt>${say('Troškovi','Expenses')}</dt><dd>${money(result.expenseCents)}</dd></div></dl><p>${say('Razlika prihoda i troškova','Income minus expenses')}: ${money(result.netCents)}</p>`,
      `<h3>${say('Što je obilježilo mjesec?','What shaped your month?')}</h3><p>${say('Najveća kategorija','Top category')}</p><strong class="wrapped-feature">${result.topCategory?esc(categoryName(result.topCategory.id)):say('Još nema troškova','No expenses yet')}</strong>${result.topCategory?money(result.topCategory.amountCents):''}<p>${say('Najveća kupnja','Biggest purchase')}: ${result.biggest?`${esc(result.biggest.name)} · ${money(result.biggest.amountCents)}`:'—'}</p>`,
      `<h3>${say('Mali koraci. Veći ciljevi.','Small steps. Bigger goals.')}</h3><strong class="wrapped-feature">${money(result.savedCents)}</strong><p>${say('Neto uplate u štednju, nakon isplata.','Net savings deposits, after withdrawals.')}</p><dl><div><dt>${say('U trezorima','Into vaults')}</dt><dd>${money(result.vaultCents)}</dd></div><div><dt>${say('Od toga zaokruživanje','Including roundups')}</dt><dd>${money(result.roundupCents)}</dd></div></dl>`,
      `<div class="wrapped-award" aria-hidden="true">✦</div><h3>${say(...badges[result.badge])}</h3><p>${result.hasData?say('Svaki pregled je korak prema boljoj odluci. Nastavite svojim tempom.','Every review is a step toward a better decision. Keep your own pace.'):say('Za ovaj mjesec još nema knjiženih podataka. Odaberite drugi mjesec ili zabilježite prvu transakciju.','No posted data for this month yet. Choose another month or record your first transaction.')}</p><button type="button" class="secondary-button" id="shareWrapped">${say('Podijeli uspjeh','Share achievement')}</button><p class="engagement-caption">${say('Dijeli se samo naziv značke i mjesec, bez iznosa.','Only the badge and month are shared, never amounts.')}</p><p id="wrappedShareStatus" role="status"></p>`
    ];
    el('wrappedStory').innerHTML=intro+slides[storyIndex];
    el('shareWrapped')?.addEventListener('click',async()=>{const text=`Mer · ${storyMonth} · ${say(...badges[result.badge])}`;try {if(navigator.share)await navigator.share({title:'Mer',text});else {await navigator.clipboard.writeText(text);el('wrappedShareStatus').textContent=say('Značka je kopirana.','Badge copied.');}}catch(error){if(error.name!=='AbortError'&&el('wrappedShareStatus'))el('wrappedShareStatus').textContent=say('Dijeljenje nije dostupno u ovom pregledniku.','Sharing is unavailable in this browser.');}});
  }
  function openWrapped() {
    if(!snapshot().authenticated)return;
    owner=identity();storyIndex=0;storyMonth=E.previousMonth(appReferenceDate);el('wrappedMonth').value=storyMonth;el('wrappedMonth').max=E.previousMonth(appReferenceDate);renderStory();openModal(storyDialog);
    const context=snapshot(), key=E.wrappedKey(context.userId,context.profileId,context.referenceDate);
    if(context.userId&&!state.engagement?.wrappedSeen?.[key])window.MerEngagementBridge.mutate('wrapped-seen',profile=>{profile.engagement||={};profile.engagement.wrappedSeen||={};profile.engagement.wrappedSeen[key]=true;});
  }
  el('wrappedBack').addEventListener('click',()=>{storyIndex=Math.max(0,storyIndex-1);renderStory();});el('wrappedNext').addEventListener('click',()=>{if(storyIndex===3)closeModal(storyDialog);else {storyIndex++;renderStory();}});
  el('wrappedMonth').addEventListener('change',()=>{if(!el('wrappedMonth').reportValidity()||!/^\d{4}-(0[1-9]|1[0-2])$/.test(el('wrappedMonth').value))return;storyMonth=el('wrappedMonth').value;storyIndex=0;renderStory();});
  const payment=document.createElement('label');payment.className='transaction-payment-method';payment.innerHTML='<span id="transactionPaymentLabel"></span><select id="transactionPaymentMethod"><option value="transfer"></option><option value="card"></option><option value="cash"></option></select>';el('spendCheck').before(payment);
  const splitSubmit=document.createElement('button');splitSubmit.type='submit';splitSubmit.className='secondary-button';splitSubmit.id='transactionSplitSubmit';splitSubmit.dataset.splitSubmit='true';el('transactionForm').querySelector('.modal-primary-actions').prepend(splitSubmit);
  const splitLedger=document.createElement('button');splitLedger.type='button';splitLedger.className='secondary-button';splitLedger.id='openBillSplits';splitLedger.addEventListener('click',()=>window.MerBillSplitUI?.open());document.querySelector('#activityView .heading-actions').prepend(splitLedger);
  function enhanceActivity() {
    document.querySelectorAll('#transactionList [data-edit-transaction]').forEach(edit=>{
      const tx=state.transactions.find(row=>String(row.id)===String(edit.dataset.editTransaction));
      if(!tx||MerCore.transactionType(tx)!=='expense'||!(tx.amount>0)||edit.closest('.transaction-row-actions'))return;
      const actions=document.createElement('div');actions.className='transaction-row-actions';edit.before(actions);actions.append(edit);
      const split=document.createElement('button');split.type='button';split.className='icon-button small';split.setAttribute('aria-label',say(`Podijeli račun: ${tx.name}`,`Split bill: ${tx.name}`));split.title=say('Podijeli račun','Split bill');split.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v7M12 10 5 17M12 10l7 7M5 12v5h5M14 17h5v-5"/></svg>';split.addEventListener('click',()=>window.MerBillSplitUI?.open(tx.id));actions.prepend(split);
    });
  }
  const oldRenderAll=renderAll;
  renderAll=function renderEngagementApp(){oldRenderAll();render();window.MerVaultsUI?.render?.();window.MerBillSplitUI?.render?.();window.MerNaturalInputUI?.render?.();};
  function render() {
    const context=snapshot();
    if(!context.authenticated){if(storyDialog.open)closeModal(storyDialog);if(healthDialog.open)closeModal(healthDialog);return;}
    if(storyDialog.open&&owner!==identity())closeModal(storyDialog);
    if(healthDialog.open&&proposalOwner!==identity())closeModal(healthDialog);
    const result=E.health(state,options());
    el('healthScore').textContent=result.score===null?'—':`${result.score}/100`;el('healthLabel').textContent=say('Financijsko zdravlje','Financial health');
    el('healthRecommendations').innerHTML=result.recommendations.map(key=>`<li>${esc(say(...recommendationCopy[key]))}</li>`).join('');el('healthImprove').textContent=say('Popravi sve','Improve all');
    splitLedger.textContent=say('Podjela računa','Split bills');splitSubmit.textContent=say('Spremi i podijeli','Save and split');splitSubmit.hidden=transactionType==='income';enhanceActivity();
    el('transactionPaymentLabel').textContent=say('Način plaćanja','Payment method');
    const labels=[say('Prijenos / nije navedeno','Transfer / unspecified'),say('Kartica · zaokruživanje ako je uključeno','Card · roundup if enabled'),say('Gotovina','Cash')];[...el('transactionPaymentMethod').options].forEach((option,index)=>option.textContent=labels[index]);
    if(storyDialog.open)renderStory();
    if(E.shouldAutoOpen(state,context.userId,options())&&!document.querySelector('dialog[open],#onboardingTour:not([hidden])')&&activeView==='overview')setTimeout(()=>{if(activeView==='overview'&&snapshot().authenticated&&!document.querySelector('dialog[open],#onboardingTour:not([hidden])')&&E.shouldAutoOpen(state,snapshot().userId,options()))openWrapped();},250);
  }
  window.MerEngagementUI={render,openHealth,openWrapped,enhanceActivity};render();
})();
