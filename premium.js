(function initializePremiumFeatures() {
  Object.assign(translations.hr, {
    userSettingsOverline:'KORISNIČKE POSTAVKE', userSettings:'Korisničke postavke', settingsIntro:'Privatnost, sigurnost, uvoz i automatizacija na jednom mjestu.', general:'Općenito', security:'Sigurnost', importData:'Uvoz podataka', automation:'Pravila', banksShort:'Banke', preferences:'PREFERENCE', regionalPrivacy:'Prikaz i privatnost', baseCurrency:'Osnovna valuta', dateFormat:'Format datuma', dateEuropean:'31. 12. 2026.', timezone:'Vremenska zona', hideBalances:'Sakrij iznose na nadzornoj ploči', hideBalancesHint:'Osjetljivi iznosi zamagljeni su dok je opcija uključena.', dataPortability:'Prenosivost podataka', dataPortabilityHint:'Izvoz ne uključuje MFA tajnu ni recovery kodove.', exportAllJson:'Izvezi sve kao JSON', exportAllCsv:'Izvezi sve kao CSV', importJsonBackup:'Uvezi JSON sigurnosnu kopiju', importTransactions:'Uvezi CSV / Excel', importDataShort:'Uvoz', exportDataShort:'Izvoz', activeProfileOnly:'Aktivni profil ostaje potpuno izoliran.', bulkImport:'Grupni unos CSV / Excel', bulkImportHint:'Uvezite više prihoda i troškova uz pregled prije potvrde.', allProfilesIncluded:'Uključuje oba izolirana profila.', settingsSaved:'Postavke su spremljene.', dataExported:'Podaci su izvezeni.', dataImported:'Sigurnosna kopija je uvezena.', invalidBackup:'Datoteka nije valjana mer sigurnosna kopija.',
    accountProtection:'ZAŠTITA RAČUNA', mfaTitle:'Višefaktorska autentikacija', mfaEnabled:'Uključeno', mfaDisabled:'Isključeno', authenticatorApps:'Authenticator aplikacije', mfaDescription:'Koristite vremenski jednokratni kod iz Google Authenticatora, Authyja ili druge TOTP aplikacije.', enableMfa:'Uključi MFA', saveMfaSecret:'Spremite tajni ključ u authenticator aplikaciju', copySecret:'Kopiraj ključ', verifySixDigit:'Potvrdite šesteroznamenkasti kod', confirmAndEnable:'Potvrdi i uključi', recoveryCodesTitle:'Spremite recovery kodove', recoveryCodesHint:'Svaki se može upotrijebiti samo jednom. Nakon zatvaranja više ih ne prikazujemo.', downloadCodes:'Preuzmi kodove', disableCode:'TOTP ili recovery kod', disableMfa:'Isključi MFA', localMfaNotice:'Ova statička verzija štiti lokalnu sesiju. Produkcijski login zahtijeva serversku pohranu MFA tajne.', mfaInvalid:'Kod nije valjan. Provjerite vrijeme uređaja i pokušajte ponovno.', mfaReady:'MFA je uključen. Spremite recovery kodove.', mfaRemoved:'MFA je isključen.', secretCopied:'Tajni ključ je kopiran.', protectedSession:'ZAŠTIĆENA SESIJA', verifyIdentity:'Potvrdite svoj identitet', unlockHint:'Unesite kod iz authenticator aplikacije ili neiskorišteni recovery kod.', securityCode:'Sigurnosni kod', unlockApp:'Otključaj aplikaciju', unlockError:'Kod nije valjan ili je recovery kod već iskorišten.',
    smartImport:'KNJIGOVODSTVENI UVOZ', importHistory:'Uvezite prihode i troškove', chooseImportFile:'Odaberite CSV, Excel ili CAMT.053 datoteku', importFileHint:'Pametno prepoznajemo datum, opis, iznos, vrstu i kategoriju. Ništa se ne sprema prije pregleda i potvrde.', chooseFile:'Odaberi datoteku', loadLargeSample:'Učitaj testni primjer (520 redaka)', include:'Uključi', date:'Datum', description:'Opis', type:'Vrsta', previous:'Prethodno', next:'Sljedeće', applyToIncluded:'Primijeni na uključene', confirmImport:'Pregledano — potvrdi uvoz', importSummary:'{ready} spremno · {duplicates} duplikata · {invalid} nevaljanih', importPage:'Stranica {page} od {pages}', importFinished:'Uvezeno je {count} transakcija; {duplicates} duplikata je preskočeno.', importFailed:'Datoteku nije moguće pročitati. Provjerite stupce i format.', excelUnavailable:'Excel modul nije učitan. Pokušajte ponovno ili upotrijebite CSV.',
    smartRules:'PAMETNA PRAVILA', automationRules:'Automatska kategorizacija', automationIntro:'Prvo pravilo čiji je pojam pronađen u opisu automatski određuje vrstu i kategoriju budućih uvoza i bankovnih transakcija.', descriptionContains:'Opis sadrži', addRule:'Dodaj pravilo', noRules:'Još nema prilagođenih pravila za ovaj profil.', ruleSaved:'Pravilo je dodano.', ruleDeleted:'Pravilo je izbrisano.', ruleExists:'Pravilo za taj pojam već postoji.', deleteRule:'Izbriši pravilo',
    goalBucketsOverline:'NAMJENSKA ŠTEDNJA', goalBuckets:'Ciljevi štednje', goalBucketsIntro:'Odvojite pričuvu, putovanje ili veću kupnju u jasne, mjerljive ciljeve.', newSavingsGoal:'Novi cilj', goalModalIntro:'Dodajte naziv, ciljani iznos i rok kako biste pratili napredak bez miješanja namjena.', goalName:'Naziv cilja', targetAmount:'Ciljani iznos', currentAmount:'Trenutačni iznos', targetDate:'Ciljani datum', setPrimaryGoal:'Prikaži kao glavni cilj', primaryGoalHint:'Glavni cilj prikazuje se na nadzornoj ploči.', deleteGoal:'Izbriši cilj', saveGoal:'Spremi cilj', editGoal:'Uredi cilj', addToSavingsGoal:'Dodaj u cilj štednje', savingsGoalLabel:'Cilj štednje', goalRemaining:'Još {amount}', goalDue:'Rok: {date}', goalNoDate:'Bez postavljenog roka', primaryGoal:'Glavni cilj', goalSaved:'Cilj štednje je spremljen.', goalDeleted:'Cilj štednje je izbrisan.', goalInvalid:'Provjerite naziv, iznose i datum cilja.', goalHasBalance:'Cilj s postojećim iznosom prvo postavite na 0 prije brisanja.', atLeastOneGoal:'Mora ostati barem jedan cilj štednje.'
  });
  Object.assign(translations.en, {
    userSettingsOverline:'USER SETTINGS', userSettings:'User settings', settingsIntro:'Privacy, security, imports and automation in one place.', general:'General', security:'Security', importData:'Import data', automation:'Rules', banksShort:'Banks', preferences:'PREFERENCES', regionalPrivacy:'Display and privacy', baseCurrency:'Base currency', dateFormat:'Date format', dateEuropean:'31 Dec 2026', timezone:'Timezone', hideBalances:'Hide dashboard balances', hideBalancesHint:'Sensitive amounts are blurred while this option is enabled.', dataPortability:'Data portability', dataPortabilityHint:'Exports never include your MFA secret or recovery codes.', exportAllJson:'Export all as JSON', exportAllCsv:'Export all as CSV', importJsonBackup:'Import JSON backup', importTransactions:'Import CSV / Excel', importDataShort:'Import', exportDataShort:'Export', activeProfileOnly:'The active profile remains fully isolated.', bulkImport:'Bulk import CSV / Excel', bulkImportHint:'Import multiple incomes and expenses with a review before confirmation.', allProfilesIncluded:'Includes both isolated profiles.', settingsSaved:'Settings saved.', dataExported:'Data exported.', dataImported:'Backup imported.', invalidBackup:'This file is not a valid mer backup.',
    accountProtection:'ACCOUNT PROTECTION', mfaTitle:'Multi-factor authentication', mfaEnabled:'Enabled', mfaDisabled:'Disabled', authenticatorApps:'Authenticator apps', mfaDescription:'Use a time-based one-time code from Google Authenticator, Authy or another TOTP app.', enableMfa:'Enable MFA', saveMfaSecret:'Save this secret in your authenticator app', copySecret:'Copy secret', verifySixDigit:'Verify the six-digit code', confirmAndEnable:'Verify and enable', recoveryCodesTitle:'Save your recovery codes', recoveryCodesHint:'Each code works once. They will not be shown again after you close this screen.', downloadCodes:'Download codes', disableCode:'TOTP or recovery code', disableMfa:'Disable MFA', localMfaNotice:'This static version protects the local session. Production sign-in requires server-side MFA secret storage.', mfaInvalid:'That code is invalid. Check your device time and try again.', mfaReady:'MFA is enabled. Save your recovery codes.', mfaRemoved:'MFA disabled.', secretCopied:'Secret copied.', protectedSession:'PROTECTED SESSION', verifyIdentity:'Verify your identity', unlockHint:'Enter a code from your authenticator app or an unused recovery code.', securityCode:'Security code', unlockApp:'Unlock app', unlockError:'That code is invalid or the recovery code was already used.',
    smartImport:'ACCOUNTING IMPORT', importHistory:'Import income and expenses', chooseImportFile:'Choose CSV, Excel or CAMT.053', importFileHint:'We intelligently detect date, description, amount, type and category. Nothing is saved before review and confirmation.', chooseFile:'Choose file', loadLargeSample:'Load test sample (520 rows)', include:'Include', date:'Date', description:'Description', type:'Type', previous:'Previous', next:'Next', applyToIncluded:'Apply to included', confirmImport:'Reviewed — confirm import', importSummary:'{ready} ready · {duplicates} duplicates · {invalid} invalid', importPage:'Page {page} of {pages}', importFinished:'Imported {count} transactions; skipped {duplicates} duplicates.', importFailed:'The file could not be read. Check its columns and format.', excelUnavailable:'The Excel module is not loaded. Try again or use CSV.',
    smartRules:'SMART RULES', automationRules:'Automatic categorization', automationIntro:'The first rule whose keyword appears in a description automatically sets the type and category for future imports and bank transactions.', descriptionContains:'Description contains', addRule:'Add rule', noRules:'No custom rules for this profile yet.', ruleSaved:'Rule added.', ruleDeleted:'Rule deleted.', ruleExists:'A rule for that keyword already exists.', deleteRule:'Delete rule',
    goalBucketsOverline:'PURPOSEFUL SAVING', goalBuckets:'Savings goals', goalBucketsIntro:'Separate your reserve, travel or larger purchases into clear, measurable goals.', newSavingsGoal:'New goal', goalModalIntro:'Add a name, target amount and date to track progress without mixing purposes.', goalName:'Goal name', targetAmount:'Target amount', currentAmount:'Current amount', targetDate:'Target date', setPrimaryGoal:'Show as primary goal', primaryGoalHint:'The primary goal appears on the dashboard.', deleteGoal:'Delete goal', saveGoal:'Save goal', editGoal:'Edit goal', addToSavingsGoal:'Add to a savings goal', savingsGoalLabel:'Savings goal', goalRemaining:'{amount} remaining', goalDue:'Due: {date}', goalNoDate:'No target date', primaryGoal:'Primary goal', goalSaved:'Savings goal saved.', goalDeleted:'Savings goal deleted.', goalInvalid:'Check the goal name, amounts and date.', goalHasBalance:'Set this goal’s current amount to 0 before deleting it.', atLeastOneGoal:'At least one savings goal must remain.'
  });

  Object.assign(translations.hr, {
    activeModule:'AKTIVNI MODUL', viewDetails:'Detalji', overviewDetailsOverline:'DETALJI PREGLEDA', overviewDetailsTitle:'Trendovi i sljedeći koraci', budgetDetailsOverline:'AUTOMATIZACIJA BUDŽETA', savingsDetailsOverline:'DETALJI ŠTEDNJE', reportDetails:'Detalji izvještaja', insightsDetailsOverline:'DUBINSKA ANALIZA', settingsIntroClean:'Privatnost, sigurnost, pravila i povezane banke na jednom mjestu.'
  });
  Object.assign(translations.en, {
    activeModule:'ACTIVE MODULE', viewDetails:'Details', overviewDetailsOverline:'OVERVIEW DETAILS', overviewDetailsTitle:'Trends and next steps', budgetDetailsOverline:'BUDGET AUTOMATION', savingsDetailsOverline:'SAVINGS DETAILS', reportDetails:'Report details', insightsDetailsOverline:'DEEP-DIVE ANALYSIS', settingsIntroClean:'Privacy, security, rules and connected banks in one place.'
  });

  let selectedSettingsTab = 'general';
  let pendingEnrollment = null;
  let visibleRecoveryCodes = [];
  let importStage = null;
  let importPage = 0;
  let editingGoalId = null;
  const importPageSize = 50;

  function selectSettingsTab(tab) {
    selectedSettingsTab = ['general', 'security', 'automation', 'banks'].includes(tab) ? tab : 'general';
    $$('[data-settings-tab]').forEach(button => { const active=button.dataset.settingsTab===selectedSettingsTab;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1; });
    $$('[data-settings-panel]').forEach(panel => { const active=panel.dataset.settingsPanel===selectedSettingsTab;panel.hidden=!active;panel.classList.toggle('active',active); });
    if(selectedSettingsTab==='banks')renderBankSettings();
  }

  function openSettings(tab='general') {
    toggleAccountMenu(false);
    renderPremiumSettings();
    selectSettingsTab(tab);
    if(!$('#bankSettingsModal').open)openModal($('#bankSettingsModal'));
  }

  function preferredDate(value, includeTime=false) {
    const iso=String(value||'').slice(0,10);
    if(appState.settings.dateFormat==='iso'&&!includeTime)return iso;
    const date=new Date(String(value).includes('T')?value:`${iso}T12:00:00`);
    const options=includeTime?{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}:{day:'numeric',month:appState.settings.dateFormat==='us'?'numeric':'short',year:'numeric'};
    options.timeZone=appState.settings.timezone||'Europe/Zagreb';
    return new Intl.DateTimeFormat(appState.settings.dateFormat==='us'?'en-US':locale(),options).format(date);
  }

  formatIsoDate = value => preferredDate(value);
  formatTransactionDate = function premiumTransactionDate(iso) {
    const dateKey=String(iso).slice(0,10);
    const key=dateKey==='2026-08-20'?'dateToday':dateKey==='2026-08-19'?'dateYesterday':null;
    return key?t(key):preferredDate(iso);
  };

  function currencySymbol() {
    return new Intl.NumberFormat(locale(),{style:'currency',currency:appState.settings.currency,currencyDisplay:'narrowSymbol'}).formatToParts(0).find(part=>part.type==='currency')?.value||appState.settings.currency;
  }

  function applyPrivacy() {
    document.body.classList.toggle('balances-hidden',Boolean(appState.settings.hideBalances));
    const sensitive=$$('#overviewView .summary-value, #overviewView #safeDaily, #overviewView #safeRemaining, #overviewView #goalCurrent, #overviewView #goalOf, #overviewView #goalDeposit');
    sensitive.forEach(element=>element.setAttribute('aria-label',appState.settings.hideBalances?(currentLang==='hr'?'Iznos je skriven':'Amount hidden'):element.textContent));
    $$('.input-suffix > span:last-child').forEach(element=>{element.textContent=currencySymbol();});
  }

  function renderPremiumSettings() {
    $('#baseCurrency').value=appState.settings.currency;
    $('#dateFormat').value=appState.settings.dateFormat;
    $('#timezone').value=appState.settings.timezone;
    $('#hideBalances').checked=Boolean(appState.settings.hideBalances);
    $('#importProfileBadge').textContent=t(state.accountLabel);
    $('#rulesProfileBadge').textContent=t(state.accountLabel);
    renderMfa();renderAutomationRules();renderImportReview();
  }

  function renderMfa() {
    const enabled=Boolean(appState.mfa.enabled);
    $('#mfaStatus').textContent=t(enabled?'mfaEnabled':'mfaDisabled');
    $('#mfaStatus').classList.toggle('green-pill',enabled);
    $('#startMfa').hidden=enabled;
    $('#mfaDisable').hidden=!enabled;
    $('#mfaSetup').hidden=enabled||!pendingEnrollment;
    $('#recoveryPanel').hidden=visibleRecoveryCodes.length===0;
    if(pendingEnrollment)$('#mfaSecret').textContent=pendingEnrollment.secret.match(/.{1,4}/g).join(' ');
    $('#recoveryCodes').innerHTML=visibleRecoveryCodes.map(code=>`<code>${code}</code>`).join('');
  }

  async function verifyMfaCode(code, consume=true) {
    if(/^\d{6}$/.test(String(code||'').trim())&&await MerSecurity.validateTotp(appState.mfa.secret,String(code).trim()))return true;
    const recovery=await MerSecurity.consumeRecoveryCode(code,appState.mfa.recoveryCodeHashes);
    if(recovery.valid&&consume){appState.mfa.recoveryCodeHashes=recovery.remainingHashes;save();}
    return recovery.valid;
  }

  function downloadFile(name,content,type) {
    const blob=new Blob([content],{type});const link=document.createElement('a');link.download=name;link.href=URL.createObjectURL(blob);document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),0);
  }

  function safePortableState() {
    return {version:appState.version,exportedAt:new Date().toISOString(),language:appState.language,theme:appState.theme,settings:{...appState.settings},bankConnections:appState.bankConnections.map(({token,...connection})=>connection),accounts:structuredClone(appState.accounts)};
  }

  function exportAllJson() { downloadFile('mer-moj-novac-data.json',JSON.stringify(safePortableState(),null,2),'application/json;charset=utf-8');showToast(t('dataExported')); }
  function csvCell(value){const text=String(value??'');return /[",\n]/.test(text)?`"${text.replaceAll('"','""')}"`:text;}
  function exportAllCsv() {
    const rows=[['Profile','Date','Description','Type','Category','Amount', 'Currency','Source']];
    Object.entries(appState.accounts).forEach(([profileId,profile])=>(profile.transactions||[]).forEach(tx=>rows.push([profileId,String(tx.date).slice(0,10),tx.name,MerCore.transactionType(tx),tx.category,Number(tx.amount).toFixed(2),appState.settings.currency,tx.source||'Manual'])));
    downloadFile('mer-moj-novac-all-transactions.csv',`\ufeff${rows.map(row=>row.map(csvCell).join(',')).join('\r\n')}`,'text/csv;charset=utf-8');showToast(t('dataExported'));
  }

  function exportActiveProfileCsv() {
    const rows=[['Date','Description','Type','Category','Amount','Currency','Source']];
    (state.transactions||[]).slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).forEach(tx=>rows.push([String(tx.date).slice(0,10),tx.name,MerCore.transactionType(tx),tx.category,Number(tx.amount).toFixed(2),appState.settings.currency,tx.source||'Manual']));
    downloadFile(`mer-${appState.activeAccount}-transactions.csv`,`\ufeff${rows.map(row=>row.map(csvCell).join(',')).join('\r\n')}`,'text/csv;charset=utf-8');showToast(t('dataExported'));
  }

  function openGlobalImport() {
    if($('#transactionModal').open)closeModal($('#transactionModal'));
    if($('#bankSettingsModal').open)closeModal($('#bankSettingsModal'));
    $('#importProfileBadge').textContent=t(state.accountLabel);
    renderImportReview();
    if(!$('#importDataModal').open)openModal($('#importDataModal'));
  }

  async function importJsonBackup(file) {
    try {
      const backup=JSON.parse(await file.text());
      if(!backup?.accounts?.personal||!backup?.accounts?.business)throw new Error('invalid-backup');
      const nextAccounts=structuredClone(backup.accounts);
      Object.values(nextAccounts).forEach(normalizeProfile);
      appState.accounts=nextAccounts;
      appState.activeAccount=backup.activeAccount==='business'?'business':'personal';
      appState.settings={...appState.settings,...(backup.settings||{})};
      currentLang=backup.language==='en'?'en':'hr';
      currentTheme=backup.theme==='dark'?'dark':'light';
      state=appState.accounts[appState.activeAccount];
      applyStaticTranslations();
      save('json-backup-import');
      selectSettingsTab('general');
      showToast(t('dataImported'));
    } catch(error) {
      console.error(error);
      showToast(t('invalidBackup'));
    } finally {
      $('#settingsImportJsonFile').value='';
    }
  }

  function categoryOptions(type,selected) {
    const categories=type==='income'?state.incomeCategories:state.categories;
    return categories.map(category=>`<option value="${category.id}" ${category.id===selected?'selected':''}>${escapeHtml(type==='income'?incomeCategoryName(category.id):categoryName(category.id))}</option>`).join('');
  }

  function stageImport(result,fileName) {
    importStage={...result,fileName};importPage=0;renderImportReview();
  }

  function renderImportReview() {
    const review=$('#importReview');if(!review)return;
    review.hidden=!importStage;
    if(!importStage)return;
    const rows=importStage.reviewRows||[];const pages=Math.max(1,Math.ceil(rows.length/importPageSize));importPage=Math.min(importPage,pages-1);
    $('#importSummary').textContent=t('importSummary',{ready:rows.filter(row=>!row.excluded).length,duplicates:importStage.duplicates||0,invalid:importStage.invalidRows?.length||0});
    $('#importPageLabel').textContent=t('importPage',{page:importPage+1,pages});$('#importPrev').disabled=importPage===0;$('#importNext').disabled=importPage>=pages-1;
    const slice=rows.slice(importPage*importPageSize,(importPage+1)*importPageSize);
    $('#importReviewRows').innerHTML=slice.map((row,offset)=>{const index=importPage*importPageSize+offset;return `<tr class="${row.needsReview?'needs-review':''}"><td><input type="checkbox" data-import-include="${index}" ${row.excluded?'':'checked'} aria-label="${t('include')}"></td><td><input type="date" value="${row.date}" data-import-date="${index}"></td><td><input type="text" value="${escapeHtml(row.name)}" data-import-name="${index}"></td><td><input type="number" min="0.01" step="0.01" value="${row.amount}" data-import-amount="${index}"></td><td><select data-import-type="${index}"><option value="expense" ${row.type==='expense'?'selected':''}>${t('expense')}</option><option value="income" ${row.type==='income'?'selected':''}>${t('income')}</option></select></td><td><select data-import-category="${index}">${categoryOptions(row.type,row.category)}</select></td></tr>`;}).join('');
    $$('[data-import-include]').forEach(input=>input.addEventListener('change',()=>{rows[Number(input.dataset.importInclude)].excluded=!input.checked;$('#importSummary').textContent=t('importSummary',{ready:rows.filter(row=>!row.excluded).length,duplicates:importStage.duplicates||0,invalid:importStage.invalidRows?.length||0});}));
    $$('[data-import-type]').forEach(select=>select.addEventListener('change',()=>{const index=Number(select.dataset.importType),row=rows[index];row.type=select.value;row.category=(row.type==='income'?state.incomeCategories:state.categories)[0]?.id;row.needsReview=false;renderImportReview();}));
    $$('[data-import-category]').forEach(select=>select.addEventListener('change',()=>{const row=rows[Number(select.dataset.importCategory)];row.category=select.value;row.needsReview=false;}));
    $$('[data-import-date]').forEach(input=>input.addEventListener('change',()=>{rows[Number(input.dataset.importDate)].date=input.value;}));
    $$('[data-import-name]').forEach(input=>input.addEventListener('change',()=>{rows[Number(input.dataset.importName)].name=input.value.trim();}));
    $$('[data-import-amount]').forEach(input=>input.addEventListener('change',()=>{rows[Number(input.dataset.importAmount)].amount=Math.abs(Number(input.value)||0);}));
    $('#bulkImportCategory').innerHTML=categoryOptions($('#bulkImportType').value,$('#bulkImportCategory').value);
  }

  async function readImportFile(file) {
    try {
      let result;
      if(/\.xlsx?$/i.test(file.name)){
        if(!window.XLSX){showToast(t('excelUnavailable'));return;}
        const workbook=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});const sheet=workbook.Sheets[workbook.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(sheet,{header:1,raw:true,defval:''});result=MerImport.parseRows(rows,state,{dateFormat:appState.settings.dateFormat});
      }else if(/\.(xml|camt)$/i.test(file.name))result=MerAccounting.parseCamt053(await file.text(),state);
      else result=MerImport.parseCsvImport(await file.text(),state,{dateFormat:appState.settings.dateFormat});
      stageImport(result,file.name);
    }catch(error){console.error(error);showToast(t('importFailed'));}
  }

  function loadLargeSample() {
    const rows=[['Date','Description','Amount','Type']];
    for(let index=1;index<=520;index+=1){const day=String(index%28+1).padStart(2,'0'),income=index%13===0;const names=income?`Freelance client ${index}`:[`Konzum Market ${index}`,`Uber ride ${index}`,`Netflix plan ${index}`,`Unknown vendor ${index}`][index%4];rows.push([`2026-08-${day}`,names,income?500+index:-(5+(index%73)),income?'Income':'Expense']);}
    stageImport(MerImport.parseRows(rows,state,{dateFormat:appState.settings.dateFormat}),'mer-demo-520.csv');
  }

  function renderAutomationRules() {
    if(!$('#automationRuleList'))return;
    const rules=state.automationRules||[];$('#automationRuleList').innerHTML=rules.length?rules.map(rule=>`<div class="automation-rule"><span class="rule-if">${escapeHtml(rule.keyword)}</span><span aria-hidden="true">→</span><strong>${escapeHtml(rule.type==='income'?incomeCategoryName(rule.category):categoryName(rule.category))}</strong><small>${t(rule.type)}</small><button type="button" class="icon-button small danger-icon" data-delete-rule="${rule.id}" aria-label="${t('deleteRule')}"><svg aria-hidden="true"><use href="#icon-x"></use></svg></button></div>`).join(''):`<div class="notification-empty">${t('noRules')}</div>`;
    $$('[data-delete-rule]').forEach(button=>button.addEventListener('click',()=>{state.automationRules=state.automationRules.filter(rule=>rule.id!==button.dataset.deleteRule);save();renderAutomationRules();showToast(t('ruleDeleted'));}));
    renderRuleCategorySelect();
  }

  function renderRuleCategorySelect(){const type=$('#ruleType').value||'expense';$('#ruleCategory').innerHTML=categoryOptions(type,$('#ruleCategory').value);}

  function primaryGoal(){return state.goalBuckets.find(goal=>goal.primary)||state.goalBuckets[0];}
  function renderGoals() {
    const goals=state.goalBuckets||[];const primary=primaryGoal();if(!primary)return;
    state.savingsBalance=goals.reduce((sum,goal)=>sum+goal.current,0);state.savingsGoal=primary.target;
    const primaryResult=MerCore.validateSavingsGoal(primary),pct=Math.round(primaryResult.percent||0);
    $('#overviewView .goal-panel h2').textContent=primary.name;$('#goalCurrent').textContent=currency(primary.current,true);$('#goalOf').textContent=t('goalOf',{target:currency(primary.target,true)});$('#goalPercent').textContent=`${pct}%`;$('#goalProgress').style.width=`${pct}%`;$('#goalProgressTrack').setAttribute('aria-valuenow',String(pct));
    $('#savingsView .savings-hero h2').textContent=primary.name;$('#savingsHeroCurrent').textContent=currency(primary.current,true);$('#savingsHeroTarget').textContent=t('goalTargetOf',{target:currency(primary.target,true)});$('#savingsHeroProgress').style.width=`${pct}%`;$('#stillNeeded').textContent=currency(primaryResult.remaining,true);if(primary.dueDate)$('#savingsFinish').textContent=preferredDate(primary.dueDate);
    $('#goalBucketGrid').innerHTML=goals.map(goal=>{const result=MerCore.validateSavingsGoal(goal),percent=Math.round(result.percent||0),metrics=MerAccounting.goalMetrics(goal,'2026-08-20');return `<article class="goal-bucket-card rich-goal-card"><div class="goal-bucket-head"><div class="goal-progress-ring" style="--goal-progress:${percent*3.6}deg"><span>${percent}%</span></div><div><strong>${escapeHtml(goal.name)}</strong><small>${goal.primary?t('primaryGoal'):(goal.dueDate?t('goalDue',{date:preferredDate(goal.dueDate)}):t('goalNoDate'))}</small></div><button type="button" class="icon-button small" data-edit-goal="${goal.id}" aria-label="${t('editGoal')}"><svg aria-hidden="true"><use href="#icon-edit"></use></svg></button></div><div class="goal-bucket-values"><strong>${currency(goal.current,true)}</strong><span>${t('goalOf',{target:currency(goal.target,true)})}</span></div><div class="goal-metric-grid"><span><small>${t('monthlyRequired')}</small><strong>${metrics.monthlyRequired===null?'—':currency(metrics.monthlyRequired,true)}</strong></span><span><small>${goal.dueDate?t('daysToGoal',{days:metrics.daysRemaining}):t('goalNoDate')}</small><strong>${currency(result.remaining,true)}</strong></span></div><button type="button" class="roundup-toggle ${goal.roundUpsEnabled?'active':''}" data-toggle-roundup="${goal.id}" aria-pressed="${Boolean(goal.roundUpsEnabled)}"><span><strong>${t('roundUps')}</strong><small>${t('roundUpsHint')}</small></span><i></i></button></article>`;}).join('');
    $$('[data-edit-goal]').forEach(button=>button.addEventListener('click',()=>openGoalEditor(button.dataset.editGoal)));
    $$('[data-toggle-roundup]').forEach(button=>button.addEventListener('click',()=>{const chosen=state.goalBuckets.find(goal=>goal.id===button.dataset.toggleRoundup),enable=!chosen.roundUpsEnabled;state.goalBuckets.forEach(goal=>{goal.roundUpsEnabled=false;});chosen.roundUpsEnabled=enable;save('roundup-goal-toggle');showToast(t('settingsSaved'));}));
  }

  function openGoalEditor(id=null) {
    editingGoalId=id;const goal=id?state.goalBuckets.find(item=>item.id===id):null;$('#goalForm').reset();$('#goalModalTitle').textContent=t(goal?'editGoal':'newSavingsGoal');$('#goalNameInput').value=goal?.name||'';$('#goalTargetInput').value=goal?.target||'';$('#goalCurrentInput').value=goal?.current||0;$('#goalDueDateInput').value=goal?.dueDate||'';$('#goalPrimaryInput').checked=Boolean(goal?.primary);$('#deleteSavingsGoal').hidden=!goal;openModal($('#goalModal'));setTimeout(()=>$('#goalNameInput').focus(),50);
  }

  function renderPremium() { applyPrivacy();renderGoals();if($('#bankSettingsModal').open)renderPremiumSettings(); }
  const originalRenderAll=renderAll;
  renderAll=function renderAllWithPremium(){originalRenderAll();renderPremium();};

  $$('[data-settings-tab]').forEach(button=>button.addEventListener('click',()=>selectSettingsTab(button.dataset.settingsTab)));
  $('#manageSettings').addEventListener('click',()=>openSettings('general'));
  $('#manageBanks').addEventListener('click',()=>selectSettingsTab('banks'));
  $('#bankSettingsModal').addEventListener('close',()=>{visibleRecoveryCodes=[];pendingEnrollment=null;renderMfa();});
  ['baseCurrency','dateFormat','timezone','hideBalances'].forEach(id=>$('#'+id).addEventListener('change',()=>{appState.settings.currency=$('#baseCurrency').value;appState.settings.dateFormat=$('#dateFormat').value;appState.settings.timezone=$('#timezone').value;appState.settings.hideBalances=$('#hideBalances').checked;save('settings-change');showToast(t('settingsSaved'));}));
  $('#settingsExportJson').addEventListener('click',exportAllJson);$('#settingsExportAllCsv').addEventListener('click',exportAllCsv);
  $$('[data-open-global-import]').forEach(button=>button.addEventListener('click',openGlobalImport));
  $$('[data-export-active]').forEach(button=>button.addEventListener('click',exportActiveProfileCsv));
  $('#settingsImportJson').addEventListener('click',()=>$('#settingsImportJsonFile').click());
  $('#settingsImportJsonFile').addEventListener('change',()=>{const file=$('#settingsImportJsonFile').files?.[0];if(file)importJsonBackup(file);});

  $('#startMfa').addEventListener('click',async()=>{pendingEnrollment=await MerSecurity.createEnrollment(state.accountName);visibleRecoveryCodes=[];renderMfa();});
  $('#copyMfaSecret').addEventListener('click',async()=>{if(!pendingEnrollment)return;await navigator.clipboard?.writeText(pendingEnrollment.secret);showToast(t('secretCopied'));});
  $('#confirmMfa').addEventListener('click',async()=>{if(!pendingEnrollment||!await MerSecurity.validateTotp(pendingEnrollment.secret,$('#mfaVerificationCode').value)){showToast(t('mfaInvalid'));return;}appState.mfa={enabled:true,secret:pendingEnrollment.secret,recoveryCodeHashes:pendingEnrollment.recoveryCodeHashes,enabledAt:new Date().toISOString()};visibleRecoveryCodes=pendingEnrollment.recoveryCodes;pendingEnrollment=null;sessionStorage.setItem('mer-mfa-unlocked','true');save();renderMfa();showToast(t('mfaReady'));});
  $('#downloadRecoveryCodes').addEventListener('click',()=>downloadFile('mer-recovery-codes.txt',visibleRecoveryCodes.join('\r\n'),'text/plain;charset=utf-8'));
  $('#disableMfa').addEventListener('click',async()=>{if(!await verifyMfaCode($('#mfaDisableCode').value)){showToast(t('mfaInvalid'));return;}appState.mfa={enabled:false,secret:null,recoveryCodeHashes:[]};sessionStorage.removeItem('mer-mfa-unlocked');visibleRecoveryCodes=[];save();renderMfa();showToast(t('mfaRemoved'));});
  $('#mfaUnlockForm').addEventListener('submit',async event=>{event.preventDefault();if(!await verifyMfaCode($('#mfaUnlockCode').value)){ $('#mfaUnlockError').textContent=t('unlockError');return;}sessionStorage.setItem('mer-mfa-unlocked','true');$('#mfaLockScreen').hidden=true;document.body.classList.remove('mfa-locked');});

  $('#importFile').addEventListener('change',()=>{const file=$('#importFile').files?.[0];if(file)readImportFile(file);});$('#loadImportSample').addEventListener('click',loadLargeSample);$('#importPrev').addEventListener('click',()=>{importPage=Math.max(0,importPage-1);renderImportReview();});$('#importNext').addEventListener('click',()=>{importPage+=1;renderImportReview();});
  $('#bulkImportType').addEventListener('change',()=>{$('#bulkImportCategory').innerHTML=categoryOptions($('#bulkImportType').value);});
  $('#applyBulkImport').addEventListener('click',()=>{if(!importStage)return;const type=$('#bulkImportType').value,category=$('#bulkImportCategory').value;importStage.reviewRows.filter(row=>!row.excluded).forEach(row=>{row.type=type;row.category=category;row.needsReview=false;});renderImportReview();});
  $('#confirmImport').addEventListener('click',()=>{if(!importStage)return;const result=MerImport.commitImport(state,importStage.reviewRows,importStage.fileName);result.imported.forEach(tx=>MerAccounting.applyRoundUp(state,tx));const duplicates=(importStage.duplicates||0)+result.duplicates;importStage=null;save('bulk-import');showToast(t('importFinished',{count:result.imported.length,duplicates}));});

  $('#ruleType').addEventListener('change',renderRuleCategorySelect);$('#automationRuleForm').addEventListener('submit',event=>{event.preventDefault();const keyword=$('#ruleKeyword').value.trim();if(state.automationRules.some(rule=>rule.keyword.toLocaleLowerCase()===keyword.toLocaleLowerCase())){showToast(t('ruleExists'));return;}state.automationRules.push({id:`rule-${Date.now()}`,keyword,type:$('#ruleType').value,category:$('#ruleCategory').value,enabled:true});save();event.target.reset();renderAutomationRules();showToast(t('ruleSaved'));});

  $('#addSavingsGoal').addEventListener('click',()=>openGoalEditor());$('#goalForm').addEventListener('submit',event=>{event.preventDefault();const payload={name:$('#goalNameInput').value.trim(),target:Number($('#goalTargetInput').value),current:Number($('#goalCurrentInput').value),dueDate:$('#goalDueDateInput').value,primary:$('#goalPrimaryInput').checked,icon:'◎'};const validation=MerCore.validateSavingsGoal(payload);if(!validation.valid){showToast(t('goalInvalid'));return;}if(payload.primary)state.goalBuckets.forEach(goal=>{goal.primary=false;});const existing=editingGoalId?state.goalBuckets.find(goal=>goal.id===editingGoalId):null;if(existing)Object.assign(existing,payload);else state.goalBuckets.push({id:`goal-${Date.now()}`,...payload});if(!state.goalBuckets.some(goal=>goal.primary))state.goalBuckets[0].primary=true;save(existing?'savings-goal-edit':'savings-goal-add');closeModal($('#goalModal'));showToast(t('goalSaved'));editingGoalId=null;});
  $('#deleteSavingsGoal').addEventListener('click',()=>{const goal=state.goalBuckets.find(item=>item.id===editingGoalId);if(!goal)return;if(state.goalBuckets.length===1){showToast(t('atLeastOneGoal'));return;}if(goal.current>0){showToast(t('goalHasBalance'));return;}state.goalBuckets=state.goalBuckets.filter(item=>item.id!==goal.id);state.savingsEntries=state.savingsEntries.filter(entry=>entry.goalId!==goal.id);if(goal.primary)state.goalBuckets[0].primary=true;save('savings-goal-delete');closeModal($('#goalModal'));showToast(t('goalDeleted'));editingGoalId=null;});

  applyStaticTranslations();renderAll();selectSettingsTab(selectedSettingsTab);
  if(appState.mfa.enabled&&sessionStorage.getItem('mer-mfa-unlocked')!=='true'){$('#mfaLockScreen').hidden=false;document.body.classList.add('mfa-locked');}
})();
