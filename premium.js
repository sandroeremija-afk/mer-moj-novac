(function initializePremiumFeatures() {
  Object.assign(translations.hr, {
    userSettingsOverline:'KORISNIČKE POSTAVKE', userSettings:'Korisničke postavke', settingsIntro:'Privatnost, sigurnost, uvoz i automatizacija na jednom mjestu.', general:'Općenito', security:'Sigurnost', importData:'Uvoz podataka', automation:'Pravila', banksShort:'Banke', preferences:'PREFERENCE', regionalPrivacy:'Prikaz i privatnost', baseCurrency:'Osnovna valuta', dateFormat:'Format datuma', dateEuropean:'31. 12. 2026.', timezone:'Vremenska zona', hideBalances:'Sakrij iznose na nadzornoj ploči', hideBalancesHint:'Osjetljivi iznosi zamagljeni su dok je opcija uključena.', dataPortability:'Prijenos podataka', dataPortabilityHint:'Izvoz ne uključuje MFA tajnu ni recovery kodove.', exportAllJson:'Izvezi sve kao JSON', exportAllCsv:'Izvezi sve kao CSV', importJsonBackup:'Uvezi JSON sigurnosnu kopiju', importTransactions:'Uvezi CSV / Excel', importDataShort:'Uvoz', exportDataShort:'Izvoz', activeProfileOnly:'Aktivni profil ostaje potpuno izoliran.', bulkImport:'Grupni unos CSV / Excel', bulkImportHint:'Uvezite više prihoda i troškova uz pregled prije potvrde.', allProfilesIncluded:'Uključuje oba izolirana profila.', settingsSaved:'Postavke su spremljene.', dataExported:'Podaci su izvezeni.', dataImported:'Sigurnosna kopija je uvezena.', invalidBackup:'Datoteka nije valjana mer sigurnosna kopija.',
    accountProtection:'ZAŠTITA RAČUNA', mfaTitle:'Višefaktorska autentikacija', mfaEnabled:'Uključeno', mfaDisabled:'Isključeno', authenticatorApps:'Authenticator aplikacije', mfaDescription:'Koristite vremenski jednokratni kod iz Google Authenticatora, Authyja ili druge TOTP aplikacije.', enableMfa:'Uključi MFA', saveMfaSecret:'Spremite tajni ključ u authenticator aplikaciju', copySecret:'Kopiraj ključ', verifySixDigit:'Potvrdite šesteroznamenkasti kod', confirmAndEnable:'Potvrdi i uključi', recoveryCodesTitle:'Spremite recovery kodove', recoveryCodesHint:'Svaki se može upotrijebiti samo jednom. Nakon zatvaranja više ih ne prikazujemo.', downloadCodes:'Preuzmi kodove', disableCode:'TOTP ili recovery kod', disableMfa:'Isključi MFA', localMfaNotice:'Ova statička verzija štiti lokalnu sesiju. Produkcijski login zahtijeva serversku pohranu MFA tajne.', mfaInvalid:'Kod nije valjan. Provjerite vrijeme uređaja i pokušajte ponovno.', mfaReady:'MFA je uključen. Spremite recovery kodove.', mfaRemoved:'MFA je isključen.', secretCopied:'Tajni ključ je kopiran.', protectedSession:'ZAŠTIĆENA SESIJA', verifyIdentity:'Potvrdite svoj identitet', unlockHint:'Unesite kod iz authenticator aplikacije ili neiskorišteni recovery kod.', securityCode:'Sigurnosni kod', unlockApp:'Otključaj aplikaciju', unlockError:'Kod nije valjan ili je recovery kod već iskorišten.',
    smartImport:'KNJIGOVODSTVENI UVOZ', importHistory:'Uvezite prihode i troškove', chooseImportFile:'Odaberite CSV, Excel ili CAMT.053 datoteku', importFileHint:'Pametno prepoznajemo datum, opis, iznos, vrstu i kategoriju. Ništa se ne sprema prije pregleda i potvrde.', chooseFile:'Odaberi datoteku', loadLargeSample:'Učitaj testni primjer (520 redaka)', include:'Uključi', date:'Datum', description:'Opis', type:'Vrsta', previous:'Prethodno', next:'Sljedeće', applyToIncluded:'Primijeni na uključene', confirmImport:'Pregledano — potvrdi uvoz', importSummary:'{ready} spremno · {duplicates} duplikata · {invalid} nevaljanih', importPage:'Stranica {page} od {pages}', importFinished:'Uvezeno je {count} transakcija; {duplicates} duplikata je preskočeno.', importFailed:'Datoteku nije moguće pročitati. Provjerite stupce i format.', excelUnavailable:'Excel modul nije učitan. Pokušajte ponovno ili upotrijebite CSV.',
    smartRules:'AUTO-KATEGORIZACIJA', automationRules:'Pravila za uvezene transakcije', automationSubtitle:'Automatski dodijelite kategorije uvezenim bankovnim transakcijama na temelju ključnih riječi.', ruleIf:'AKO', ruleThen:'ONDA', ruleIfContains:'Naziv transakcije sadrži', ruleAssignCategory:'Dodijeli kategoriju', ruleKeywordPlaceholder:'npr. Uber', activeRules:'Aktivna pravila', noRulesTitle:'Još nema vlastitih pravila', noRulesBody:'Dodajte prvo pravilo iznad i sljedeći će se uvoz kategorizirati automatski.', ruleExample:'PRIMJER', ruleExampleContains:'Naziv sadrži', addRule:'Dodaj pravilo', ruleSaved:'Pravilo je dodano.', ruleDeleted:'Pravilo je izbrisano.', ruleExists:'Pravilo za taj pojam već postoji.', deleteRule:'Izbriši pravilo',
    goalBucketsOverline:'NAMJENSKA ŠTEDNJA', goalBuckets:'Ciljevi štednje', goalBucketsIntro:'Odvojite pričuvu, putovanje ili veću kupnju u jasne, mjerljive ciljeve.', newSavingsGoal:'Novi cilj', goalModalIntro:'Dodajte naziv, ciljani iznos i rok kako biste pratili napredak bez miješanja namjena.', goalName:'Naziv cilja', targetAmount:'Ciljani iznos', currentAmount:'Trenutačni iznos', targetDate:'Ciljani datum', setPrimaryGoal:'Prikaži kao glavni cilj', primaryGoalHint:'Glavni cilj prikazuje se na nadzornoj ploči.', deleteGoal:'Izbriši cilj', saveGoal:'Spremi cilj', editGoal:'Uredi cilj', addToSavingsGoal:'Dodaj u cilj štednje', savingsGoalLabel:'Cilj štednje', goalRemaining:'Još {amount}', goalDue:'Rok: {date}', goalNoDate:'Bez postavljenog roka', primaryGoal:'Glavni cilj', goalSaved:'Cilj štednje je spremljen.', goalDeleted:'Cilj štednje je izbrisan.', goalInvalid:'Provjerite naziv, iznose i datum cilja.', goalHasBalance:'Cilj s postojećim iznosom prvo postavite na 0 prije brisanja.', atLeastOneGoal:'Mora ostati barem jedan cilj štednje.'
  });
  Object.assign(translations.en, {
    userSettingsOverline:'USER SETTINGS', userSettings:'User settings', settingsIntro:'Privacy, security, imports and automation in one place.', general:'General', security:'Security', importData:'Import data', automation:'Rules', banksShort:'Banks', preferences:'PREFERENCES', regionalPrivacy:'Display and privacy', baseCurrency:'Base currency', dateFormat:'Date format', dateEuropean:'31 Dec 2026', timezone:'Timezone', hideBalances:'Hide dashboard balances', hideBalancesHint:'Sensitive amounts are blurred while this option is enabled.', dataPortability:'Data transfer', dataPortabilityHint:'Exports never include your MFA secret or recovery codes.', exportAllJson:'Export all as JSON', exportAllCsv:'Export all as CSV', importJsonBackup:'Import JSON backup', importTransactions:'Import CSV / Excel', importDataShort:'Import', exportDataShort:'Export', activeProfileOnly:'The active profile remains fully isolated.', bulkImport:'Bulk import CSV / Excel', bulkImportHint:'Import multiple incomes and expenses with a review before confirmation.', allProfilesIncluded:'Includes both isolated profiles.', settingsSaved:'Settings saved.', dataExported:'Data exported.', dataImported:'Backup imported.', invalidBackup:'This file is not a valid mer backup.',
    accountProtection:'ACCOUNT PROTECTION', mfaTitle:'Multi-factor authentication', mfaEnabled:'Enabled', mfaDisabled:'Disabled', authenticatorApps:'Authenticator apps', mfaDescription:'Use a time-based one-time code from Google Authenticator, Authy or another TOTP app.', enableMfa:'Enable MFA', saveMfaSecret:'Save this secret in your authenticator app', copySecret:'Copy secret', verifySixDigit:'Verify the six-digit code', confirmAndEnable:'Verify and enable', recoveryCodesTitle:'Save your recovery codes', recoveryCodesHint:'Each code works once. They will not be shown again after you close this screen.', downloadCodes:'Download codes', disableCode:'TOTP or recovery code', disableMfa:'Disable MFA', localMfaNotice:'This static version protects the local session. Production sign-in requires server-side MFA secret storage.', mfaInvalid:'That code is invalid. Check your device time and try again.', mfaReady:'MFA is enabled. Save your recovery codes.', mfaRemoved:'MFA disabled.', secretCopied:'Secret copied.', protectedSession:'PROTECTED SESSION', verifyIdentity:'Verify your identity', unlockHint:'Enter a code from your authenticator app or an unused recovery code.', securityCode:'Security code', unlockApp:'Unlock app', unlockError:'That code is invalid or the recovery code was already used.',
    smartImport:'ACCOUNTING IMPORT', importHistory:'Import income and expenses', chooseImportFile:'Choose CSV, Excel or CAMT.053', importFileHint:'We intelligently detect date, description, amount, type and category. Nothing is saved before review and confirmation.', chooseFile:'Choose file', loadLargeSample:'Load test sample (520 rows)', include:'Include', date:'Date', description:'Description', type:'Type', previous:'Previous', next:'Next', applyToIncluded:'Apply to included', confirmImport:'Reviewed — confirm import', importSummary:'{ready} ready · {duplicates} duplicates · {invalid} invalid', importPage:'Page {page} of {pages}', importFinished:'Imported {count} transactions; skipped {duplicates} duplicates.', importFailed:'The file could not be read. Check its columns and format.', excelUnavailable:'The Excel module is not loaded. Try again or use CSV.',
    smartRules:'AUTO-CATEGORIZATION', automationRules:'Rules for imported transactions', automationSubtitle:'Automatically assign categories to imported bank transactions using keywords.', ruleIf:'IF', ruleThen:'THEN', ruleIfContains:'Transaction name contains', ruleAssignCategory:'Assign category', ruleKeywordPlaceholder:'e.g. Uber', activeRules:'Active rules', noRulesTitle:'No custom rules yet', noRulesBody:'Add your first rule above and the next import will be categorized automatically.', ruleExample:'EXAMPLE', ruleExampleContains:'Name contains', addRule:'Add rule', ruleSaved:'Rule added.', ruleDeleted:'Rule deleted.', ruleExists:'A rule for that keyword already exists.', deleteRule:'Delete rule',
    goalBucketsOverline:'PURPOSEFUL SAVING', goalBuckets:'Savings goals', goalBucketsIntro:'Separate your reserve, travel or larger purchases into clear, measurable goals.', newSavingsGoal:'New goal', goalModalIntro:'Add a name, target amount and date to track progress without mixing purposes.', goalName:'Goal name', targetAmount:'Target amount', currentAmount:'Current amount', targetDate:'Target date', setPrimaryGoal:'Show as primary goal', primaryGoalHint:'The primary goal appears on the dashboard.', deleteGoal:'Delete goal', saveGoal:'Save goal', editGoal:'Edit goal', addToSavingsGoal:'Add to a savings goal', savingsGoalLabel:'Savings goal', goalRemaining:'{amount} remaining', goalDue:'Due: {date}', goalNoDate:'No target date', primaryGoal:'Primary goal', goalSaved:'Savings goal saved.', goalDeleted:'Savings goal deleted.', goalInvalid:'Check the goal name, amounts and date.', goalHasBalance:'Set this goal’s current amount to 0 before deleting it.', atLeastOneGoal:'At least one savings goal must remain.'
  });
  Object.assign(translations.hr,{confirmBulkOverrideTitle:'Potvrdite grupnu izmjenu',bulkOverrideCopy:'Promijenit ćete vrstu i kategoriju za {count} uključenih redaka u “{category}”.',confirmBulkOverride:'Promijeni uključene retke',bulkOverrideApplied:'Promijenjeno je {count} redaka.',undoBulkOverride:'Poništi grupnu izmjenu',bulkOverrideUndone:'Grupna izmjena je poništena.',importProfileChanged:'Aktivni profil se promijenio. Prethodni pregled uvoza sigurno je odbačen.'});
  Object.assign(translations.en,{confirmBulkOverrideTitle:'Confirm bulk change',bulkOverrideCopy:'You are about to change type and category for {count} included rows to “{category}”.',confirmBulkOverride:'Change included rows',bulkOverrideApplied:'Changed {count} rows.',undoBulkOverride:'Undo bulk change',bulkOverrideUndone:'Bulk change undone.',importProfileChanged:'The active profile changed. The previous import review was safely discarded.'});

  Object.assign(translations.hr, {
    activeModule:'AKTIVNI MODUL', viewDetails:'Detalji', overviewDetailsOverline:'DETALJI PREGLEDA', overviewDetailsTitle:'Trendovi i sljedeći koraci', budgetDetailsOverline:'AUTOMATIZACIJA BUDŽETA', savingsDetailsOverline:'DETALJI ŠTEDNJE', reportDetails:'Detalji izvještaja', insightsDetailsOverline:'DUBINSKA ANALIZA', settingsIntroClean:'Prilagodite prikaz, privatnost, sigurnost i pravila automatizacije.'
  });
  Object.assign(translations.en, {
    activeModule:'ACTIVE MODULE', viewDetails:'Details', overviewDetailsOverline:'OVERVIEW DETAILS', overviewDetailsTitle:'Trends and next steps', budgetDetailsOverline:'BUDGET AUTOMATION', savingsDetailsOverline:'SAVINGS DETAILS', reportDetails:'Report details', insightsDetailsOverline:'DEEP-DIVE ANALYSIS', settingsIntroClean:'Customize display, privacy, security and automation rules.'
  });
  Object.assign(translations.hr, {
    securityManagement:'Sigurnost računa',changePassword:'Promjena lozinke',changePasswordHint:'Ažurirajte lozinku i odjavite ostale aktivne sesije.',currentPassword:'Trenutna lozinka',newPassword:'Nova lozinka',confirmNewPassword:'Potvrdi novu lozinku',saveNewPassword:'Spremi novu lozinku',passwordUpdated:'Lozinka je uspješno promijenjena. Ostale sesije su odjavljene.',invalidCurrentPassword:'Trenutna lozinka nije ispravna.',passwordMismatch:'Nove lozinke se ne podudaraju.',passwordReused:'Nova lozinka mora se razlikovati od trenutačne.',passwordWeak:'Nova lozinka mora imati najmanje 10 znakova.',demoPasswordUnavailable:'Promjena lozinke nije dostupna u demo načinu.',passwordChangeFailed:'Lozinku trenutačno nije moguće promijeniti.',twoFactorAuthentication:'Dvostruka autentifikacija (2FA)',twoFactorHint:'Odaberite način potvrde prije uključivanja zaštite.',twoFactorMethod:'Način dvostruke autentifikacije',authenticatorApp:'Authenticator aplikacija',mobileNumber:'Broj mobilnog telefona',sendSmsCode:'Pošalji SMS kod',smsVerificationCode:'Kod iz SMS poruke',smsDemoDelivery:'Lokalna demonstracijska dostava za {phone}: kod {code}',smsInvalidPhone:'Unesite valjan međunarodni broj, primjerice +385 91 234 5678.',smsCodeSent:'Kod je spreman za provjeru.',activeSessions:'Aktivne sesije',activeSessionsHint:'Pregledajte uređaje i odjavite sesije koje više ne koristite.',logoutOtherDevices:'Odjavi sve ostale uređaje',currentSession:'Ovaj uređaj',localSessionIp:'IP: lokalna sesija',sessionLocation:'Lokacija: {location}',sessionStarted:'Aktivna od {date}',otherSessionsLoggedOut:'Odjavljeno je drugih sesija: {count}.',noOtherSessions:'Nema drugih aktivnih uređaja.',smsMfaDescription:'Primite jednokratni kod SMS adapterom na potvrđeni broj.',smsUnlockHint:'Unesite SMS kod ili neiskorišteni recovery kod.'
  });
  Object.assign(translations.en, {
    securityManagement:'Account security',changePassword:'Change password',changePasswordHint:'Update your password and sign out other active sessions.',currentPassword:'Current password',newPassword:'New password',confirmNewPassword:'Confirm new password',saveNewPassword:'Save new password',passwordUpdated:'Password changed successfully. Other sessions were signed out.',invalidCurrentPassword:'The current password is incorrect.',passwordMismatch:'The new passwords do not match.',passwordReused:'The new password must be different from the current password.',passwordWeak:'The new password must contain at least 10 characters.',demoPasswordUnavailable:'Password changes are unavailable in demo mode.',passwordChangeFailed:'The password cannot be changed right now.',twoFactorAuthentication:'Two-factor authentication (2FA)',twoFactorHint:'Choose a verification method before enabling protection.',twoFactorMethod:'Two-factor authentication method',authenticatorApp:'Authenticator app',mobileNumber:'Mobile phone number',sendSmsCode:'Send SMS code',smsVerificationCode:'SMS verification code',smsDemoDelivery:'Local demo delivery for {phone}: code {code}',smsInvalidPhone:'Enter a valid international number, for example +385 91 234 5678.',smsCodeSent:'The code is ready for verification.',activeSessions:'Active sessions',activeSessionsHint:'Review devices and sign out sessions you no longer use.',logoutOtherDevices:'Sign out all other devices',currentSession:'This device',localSessionIp:'IP: local session',sessionLocation:'Location: {location}',sessionStarted:'Active since {date}',otherSessionsLoggedOut:'Signed out other sessions: {count}.',noOtherSessions:'There are no other active devices.',smsMfaDescription:'Receive a one-time code through the SMS adapter on your verified number.',smsUnlockHint:'Enter the SMS code or an unused recovery code.'
  });
  Object.assign(translations.hr, {
    localMfaNotice:'Ovo je lokalni demo adapter: prijava, MFA i popis sesija vrijede samo u ovom profilu preglednika. Produkcija zahtijeva serverski identitet i sigurnu dostavu kodova.',
    activeSessions:'Lokalne sesije preglednika',activeSessionsHint:'Prikazane su samo kartice i prozori ovog profila preglednika, ne udaljeni uređaji.',logoutOtherDevices:'Odjavi ostale lokalne sesije',currentSession:'Ova lokalna sesija',localSessionIp:'Lokalni demo adapter',sessionLocation:'Vremenska zona: {location}',otherSessionsLoggedOut:'Odjavljeno je drugih lokalnih sesija: {count}.',noOtherSessions:'Nema drugih lokalnih sesija.',
    smsMfaDescription:'Lokalni SMS demo adapter prikazuje jednokratni kod u aplikaciji; produkcija zahtijeva stvarnog pružatelja dostave.',smsUnlockHint:'Unesite lokalni demo SMS kod ili neiskorišteni recovery kod.',disableSmsCode:'SMS kod ili recovery kod',sendDisableSmsCode:'Pošalji kod za isključivanje',smsDisableDelivery:'Lokalni demo kod za isključivanje za {phone}: {code}'
  });
  Object.assign(translations.en, {
    localMfaNotice:'This is a local demo adapter: sign-in, MFA and session listings apply only to this browser profile. Production requires a server-side identity service and secure code delivery.',
    activeSessions:'Local browser sessions',activeSessionsHint:'Only tabs and windows in this browser profile are shown, not remote devices.',logoutOtherDevices:'Sign out other local sessions',currentSession:'This local session',localSessionIp:'Local demo adapter',sessionLocation:'Timezone: {location}',otherSessionsLoggedOut:'Signed out other local sessions: {count}.',noOtherSessions:'There are no other local sessions.',
    smsMfaDescription:'The local SMS demo adapter displays a one-time code in the app; production requires a real delivery provider.',smsUnlockHint:'Enter the local demo SMS code or an unused recovery code.',disableSmsCode:'SMS code or recovery code',sendDisableSmsCode:'Send disable code',smsDisableDelivery:'Local demo disable code for {phone}: {code}'
  });

  let selectedSettingsTab = 'general';
  let selectedMfaMethod = MerSecurity.normalizeMfaMethod(appState.mfa?.method) || MerSecurity.MFA_METHODS.AUTHENTICATOR;
  let pendingEnrollment = null;
  let pendingSmsChallenge = null;
  let pendingSmsUnlockChallenge = null;
  let pendingSmsDisableChallenge = null;
  let visibleRecoveryCodes = [];
  let importStage = null;
  let importPage = 0;
  let pendingBulkOverride = null;
  let lastBulkOverride = null;
  let editingGoalId = null;
  const importPageSize = 50;

  function selectSettingsTab(tab) {
    selectedSettingsTab = ['general', 'security', 'automation'].includes(tab) ? tab : 'general';
    $$('[data-settings-tab]').forEach(button => { const active=button.dataset.settingsTab===selectedSettingsTab;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1; });
    $$('[data-settings-panel]').forEach(panel => { const active=panel.dataset.settingsPanel===selectedSettingsTab;panel.hidden=!active;panel.classList.toggle('active',active); });
  }

  function openSettings(tab='general') {
    toggleAccountMenu(false);
    renderPremiumSettings();
    selectSettingsTab(tab);
    if(!$('#bankSettingsModal').open)openModal($('#bankSettingsModal'));
  }

  window.MerSettings=Object.freeze({open:openSettings,selectTab:selectSettingsTab});

  function preferredDate(value, includeTime=false) {
    const iso=String(value||'').slice(0,10);
    if(!validStoredDate(iso))return '—';
    if(appState.settings.dateFormat==='iso'&&!includeTime)return iso;
    const date=new Date(String(value).includes('T')?value:`${iso}T12:00:00`);
    const options=includeTime?{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}:{day:'numeric',month:appState.settings.dateFormat==='us'?'numeric':'short',year:'numeric'};
    options.timeZone=appState.settings.timezone||'Europe/Zagreb';
    return new Intl.DateTimeFormat(appState.settings.dateFormat==='us'?'en-US':locale(),options).format(date);
  }

  formatIsoDate = value => preferredDate(value);
  formatTransactionDate = function premiumTransactionDate(iso) {
    const dateKey=String(iso).slice(0,10);
    const yesterdayDate=new Date(`${appReferenceDate}T12:00:00Z`);yesterdayDate.setUTCDate(yesterdayDate.getUTCDate()-1);
    const key=dateKey===appReferenceDate?'dateToday':dateKey===yesterdayDate.toISOString().slice(0,10)?'dateYesterday':null;
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
    $('#settingsLanguage').value=currentLang;
    $('#hideBalances').checked=Boolean(appState.settings.hideBalances);
    $('#importProfileBadge').textContent=t(state.accountLabel);
    $('#rulesProfileBadge').textContent=t(state.accountLabel);
    $('#demoResetCard').hidden=!Boolean(window.MerAuthProvider?.currentSession?.()?.demo);
    renderMfa();renderActiveSessions();renderAutomationRules();renderImportReview();
  }

  function renderMfa() {
    const enabled=Boolean(appState.mfa.enabled);
    const method=enabled?(MerSecurity.normalizeMfaMethod(appState.mfa.method)||MerSecurity.MFA_METHODS.AUTHENTICATOR):selectedMfaMethod;
    $('#mfaStatus').textContent=t(enabled?'mfaEnabled':'mfaDisabled');
    $('#mfaStatus').classList.toggle('green-pill',enabled);
    $$('[data-mfa-method]').forEach(button=>{const active=button.dataset.mfaMethod===method;button.setAttribute('aria-pressed',String(active));button.disabled=enabled;});
    $('.security-card [data-i18n="authenticatorApps"]').textContent=t(method==='sms'?'mobileNumber':'authenticatorApps');
    $('.security-card [data-i18n="mfaDescription"]').textContent=t(method==='sms'?'smsMfaDescription':'mfaDescription');
    $('#startMfa').hidden=enabled||method==='sms';
    $('#mfaDisable').hidden=!enabled;
    $('#mfaDisableCodeLabel').textContent=t(method==='sms'?'disableSmsCode':'disableCode');
    $('#sendMfaDisableSmsCode').hidden=!enabled||method!=='sms';
    $('#mfaDisableSmsDelivery').hidden=!enabled||method!=='sms'||!pendingSmsDisableChallenge;
    if(pendingSmsDisableChallenge)$('#mfaDisableSmsDelivery').textContent=t('smsDisableDelivery',{phone:pendingSmsDisableChallenge.maskedPhone,code:pendingSmsDisableChallenge.demoCode});
    $('#mfaSetup').hidden=enabled||method!=='authenticator'||!pendingEnrollment;
    $('#mfaSmsSetup').hidden=enabled||method!=='sms';
    $('#mfaSmsVerify').hidden=!pendingSmsChallenge;
    $('#recoveryPanel').hidden=visibleRecoveryCodes.length===0;
    if(pendingEnrollment)$('#mfaSecret').textContent=pendingEnrollment.secret.match(/.{1,4}/g).join(' ');
    $('#recoveryCodes').innerHTML=visibleRecoveryCodes.map(code=>`<code>${code}</code>`).join('');
  }

  function renderActiveSessions() {
    const sessions=window.MerAuthProvider?.listActiveSessions?.()||[],location=appState.settings.timezone||'Europe/Zagreb';
    $('#activeSessionList').innerHTML=sessions.length?sessions.map(session=>`<article class="active-session-item"><span class="active-session-device"><svg aria-hidden="true"><use href="#icon-card"></use></svg></span><div class="active-session-copy"><strong>${escapeHtml(session.label||t('currentSession'))}</strong><small>${t('localSessionIp')} · ${t('sessionLocation',{location:escapeHtml(location)})}</small><small>${t('sessionStarted',{date:preferredDate(new Date(session.issuedAt).toISOString(),true)})}</small></div>${session.current?`<span class="active-session-current">${t('currentSession')}</span>`:''}</article>`).join(''):`<div class="notification-empty">${t('noOtherSessions')}</div>`;
    $('#logoutOtherSessions').disabled=sessions.filter(session=>!session.current).length===0;
  }

  async function prepareSmsUnlockChallenge() {
    if(!appState.mfa.enabled||appState.mfa.method!=='sms'||!appState.mfa.phoneNumber){pendingSmsUnlockChallenge=null;$('#mfaUnlockDelivery').hidden=true;return;}
    pendingSmsUnlockChallenge=await MerSecurity.createSmsChallenge(appState.mfa.phoneNumber);
    $('#mfaUnlockDelivery').textContent=t('smsDemoDelivery',{phone:pendingSmsUnlockChallenge.maskedPhone,code:pendingSmsUnlockChallenge.demoCode});
    $('#mfaUnlockDelivery').hidden=false;
    $('#mfaLockScreen [data-i18n="unlockHint"]').textContent=t('smsUnlockHint');
  }
  function resetMfaEphemeralState() {
    selectedMfaMethod=MerSecurity.MFA_METHODS.AUTHENTICATOR;
    pendingEnrollment=null;
    pendingSmsChallenge=null;
    pendingSmsUnlockChallenge=null;
    pendingSmsDisableChallenge=null;
    visibleRecoveryCodes=[];
    $('#mfaUnlockDelivery').hidden=true;
    $('#mfaDisableSmsDelivery').hidden=true;
    $('#mfaLockScreen [data-i18n="unlockHint"]').textContent=t('unlockHint');
  }
  window.MerSecurityUi=Object.freeze({prepareUnlock:()=>runAsyncAction(prepareSmsUnlockChallenge,'mfaInvalid'),renderSessions:renderActiveSessions,reset:resetMfaEphemeralState});

  async function verifyMfaCode(code, consume=true) {
    if(appState.mfa.method==='sms'&&pendingSmsUnlockChallenge&&await MerSecurity.validateSmsChallenge(pendingSmsUnlockChallenge,code))return true;
    if(appState.mfa.method!=='sms'&&/^\d{6}$/.test(String(code||'').trim())&&await MerSecurity.validateTotp(appState.mfa.secret,String(code).trim()))return true;
    const recovery=await MerSecurity.consumeRecoveryCode(code,appState.mfa.recoveryCodeHashes);
    if(recovery.valid&&consume){appState.mfa.recoveryCodeHashes=recovery.remainingHashes;save();}
    return recovery.valid;
  }

  async function verifyDisableMfaCode(code) {
    if(appState.mfa.method!=='sms')return verifyMfaCode(code);
    if(pendingSmsDisableChallenge&&await MerSecurity.validateSmsChallenge(pendingSmsDisableChallenge,code))return true;
    const recovery=await MerSecurity.consumeRecoveryCode(code,appState.mfa.recoveryCodeHashes);
    if(recovery.valid){appState.mfa.recoveryCodeHashes=recovery.remainingHashes;save('mfa-recovery-code-consumed');}
    return recovery.valid;
  }

  function downloadFile(name,content,type) {
    const blob=new Blob([content],{type});const link=document.createElement('a');link.download=name;link.href=URL.createObjectURL(blob);document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),0);
  }

  function safeCsvText(value){const text=String(value??'');return /^[=+\-@\t]/.test(text)?`'${text}`:text;}
  function csvCell(value){const text=String(value??'');return /[",\r\n]/.test(text)?`"${text.replaceAll('"','""')}"`:text;}

  function exportActiveProfileCsv() {
    const labels=currentLang==='hr'
      ? ['ID','Vrijeme','Datum','Opis','Vrsta','Kategorija','Iznos','Valuta','Izvor','Status pregleda']
      : ['ID','Timestamp','Date','Description','Type','Category','Amount','Currency','Source','Review status'];
    const rows=[labels];
    (state.transactions||[]).filter(tx=>tx&&Number.isFinite(Number(tx.amount))).slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).forEach(tx=>{
      const type=MerCore.transactionType(tx),timestamp=String(tx.timestamp||tx.date||''),category=type==='income'?incomeCategoryName(tx.category):categoryName(tx.category);
      rows.push([safeCsvText(tx.id||''),safeCsvText(timestamp),timestamp.slice(0,10),safeCsvText(tx.name||''),currentLang==='hr'?(type==='income'?'Prihod':'Trošak'):type,safeCsvText(category),Number(tx.amount).toFixed(2),safeCsvText(tx.currency||appState.settings.currency),safeCsvText(tx.source||'Manual'),tx.needsReview?(currentLang==='hr'?'Potreban pregled':'Needs review'):(currentLang==='hr'?'Potvrđeno':'Confirmed')]);
    });
    downloadFile(`mer-${appState.activeAccount}-transactions-${appReferenceDate}.csv`,`\ufeff${rows.map(row=>row.map(csvCell).join(',')).join('\r\n')}`,'text/csv;charset=utf-8');showToast(t('dataExported'));
  }

  function exportBudgetPlanCsv() {
    const spentByCategory=MerCore.categoryExpenseTotals(state.transactions,'monthly',appReferenceDate);
    const categories=(state.categories||[]).map(category=>{const spent=Number(spentByCategory[category.id]||0),limit=Math.max(0,Number(category.limit)||0);return {category,spent,limit,remaining:limit-spent,usage:limit>0?spent/limit*100:spent>0?100:0};});
    const totals=categories.reduce((sum,item)=>({spent:sum.spent+item.spent,limit:sum.limit+item.limit,remaining:sum.remaining+item.remaining}),{spent:0,limit:0,remaining:0});
    const hr=currentLang==='hr',currencyCode=appState.settings.currency;
    const rows=[
      [hr?'Izvješće':'Report',hr?'Mjesečni plan budžeta':'Monthly budget plan'],
      [hr?'Profil':'Profile',safeCsvText(state.accountName)],
      [hr?'Mjesec':'Month',appReferenceDate.slice(0,7)],
      [hr?'Valuta':'Currency',currencyCode],
      [],
      [hr?'Sažetak':'Summary',hr?'Iznos':'Amount'],
      [hr?'Ukupni limit':'Total limit',totals.limit.toFixed(2)],
      [hr?'Ukupno potrošeno':'Total spent',totals.spent.toFixed(2)],
      [hr?'Ukupno preostalo':'Total remaining',totals.remaining.toFixed(2)],
      [],
      [hr?'Kategorija':'Category',hr?'Potrošeno':'Spent',hr?'Limit':'Limit',hr?'Preostalo':'Remaining',hr?'Iskorištenost (%)':'Usage (%)',hr?'Valuta':'Currency']
    ];
    categories.forEach(item=>rows.push([safeCsvText(categoryName(item.category.id)),item.spent.toFixed(2),item.limit.toFixed(2),item.remaining.toFixed(2),item.usage.toFixed(1),currencyCode]));
    downloadFile(`mer-${appState.activeAccount}-budget-${appReferenceDate.slice(0,7)}.csv`,`\ufeff${rows.map(row=>row.map(csvCell).join(',')).join('\r\n')}`,'text/csv;charset=utf-8');
    showToast(t('csvExported'));
  }

  function exportInsightsReportCsv() {
    const totals=MerCore.transactionTotals(state.transactions,insightsTimeframe,appReferenceDate);
    const byCategory=MerCore.categoryExpenseTotals(state.transactions,insightsTimeframe,appReferenceDate);
    const filtered=MerCore.filterTransactions(state.transactions,insightsTimeframe,appReferenceDate).filter(tx=>tx&&Number.isFinite(Number(tx.amount)));
    const hr=currentLang==='hr',label=hr?{metric:'Pokazatelj',value:'Vrijednost',category:'Kategorija',amount:'Trošak',share:'Udio troškova (%)',income:'Ukupni prihodi',expenses:'Ukupni troškovi',net:'Neto ukupno',rate:'Stopa štednje (%)'}:{metric:'Metric',value:'Value',category:'Category',amount:'Expense',share:'Expense share (%)',income:'Total income',expenses:'Total expenses',net:'Net total',rate:'Savings rate (%)'};
    const savingsRate=totals.income>0?(totals.net/totals.income)*100:null;
    const timeframeLabel=t({daily:'daily',monthly:'monthly',ytd:'yearToDate',all:'allTime'}[insightsTimeframe]||'monthly');
    const rows=[
      [hr?'Izvješće':'Report',hr?'Snimka analitike':'Analytics snapshot'],
      [hr?'Profil':'Profile',safeCsvText(state.accountName)],
      [hr?'Razdoblje':'Timeframe',timeframeLabel],
      [hr?'Datum izvješća':'Report date',appReferenceDate],
      [hr?'Valuta':'Currency',appState.settings.currency],
      [hr?'Broj transakcija':'Transaction count',String(filtered.length)],
      [],
      [label.metric,label.value],
      [label.income,Number(totals.income||0).toFixed(2)],
      [label.expenses,Number(totals.expenses||0).toFixed(2)],
      [label.net,Number(totals.net||0).toFixed(2)],
      [label.rate,savingsRate===null?'—':savingsRate.toFixed(1)],
      [],
      [label.category,label.amount,label.share]
    ];
    Object.entries(byCategory).filter(([,amount])=>Number(amount)>0).sort((a,b)=>b[1]-a[1]).forEach(([categoryId,amount])=>rows.push([safeCsvText(categoryName(categoryId)),Number(amount).toFixed(2),totals.expenses>0?(Number(amount)/totals.expenses*100).toFixed(1):'0.0']));
    downloadFile(`mer-${appState.activeAccount}-insights-${insightsTimeframe}.csv`,`\ufeff${rows.map(row=>row.map(csvCell).join(',')).join('\r\n')}`,'text/csv;charset=utf-8');
    showToast(t('csvExported'));
  }

  function openGlobalImport() {
    closeCardMenus();
    if($('#transactionModal').open)closeModal($('#transactionModal'));
    if($('#budgetDataModal').open)closeModal($('#budgetDataModal'));
    if($('#bankSettingsModal').open)closeModal($('#bankSettingsModal'));
    if(importStage&&!MerImport.stageBelongsToProfile(importStage,appState.activeAccount)){
      importStage=null;pendingBulkOverride=null;lastBulkOverride=null;showToast(t('importProfileChanged'));
    }
    $('#importProfileBadge').textContent=t(state.accountLabel);
    renderImportReview();
    if(!$('#importDataModal').open)openModal($('#importDataModal'));
  }

  function categoryOptions(type,selected) {
    const categories=type==='income'?state.incomeCategories:state.categories;
    return categories.map(category=>`<option value="${category.id}" ${category.id===selected?'selected':''}>${escapeHtml(type==='income'?incomeCategoryName(category.id):categoryName(category.id))}</option>`).join('');
  }

  function stageImport(result,fileName) {
    importStage=MerImport.createReviewStage(result,fileName,appState.activeAccount);importPage=0;pendingBulkOverride=null;lastBulkOverride=null;renderImportReview();
  }

  function renderBulkOverrideState() {
    const confirmation=$('#bulkOverrideConfirmation'),undo=$('#bulkOverrideUndoBar');
    confirmation.hidden=!pendingBulkOverride;
    undo.hidden=!lastBulkOverride;
    if(pendingBulkOverride)$('#bulkOverrideConfirmationCopy').textContent=t('bulkOverrideCopy',{count:pendingBulkOverride.count,category:pendingBulkOverride.categoryLabel});
    if(lastBulkOverride)$('#bulkOverrideUndoCopy').textContent=t('bulkOverrideApplied',{count:lastBulkOverride.snapshot.length});
  }

  function invalidateBulkUndo() { lastBulkOverride=null;renderBulkOverrideState(); }

  function renderImportReview() {
    const review=$('#importReview');if(!review)return;
    if(importStage&&!MerImport.stageBelongsToProfile(importStage,appState.activeAccount)){importStage=null;pendingBulkOverride=null;lastBulkOverride=null;}
    review.hidden=!importStage;
    if(!importStage){renderBulkOverrideState();return;}
    const rows=importStage.reviewRows||[];const pages=Math.max(1,Math.ceil(rows.length/importPageSize));importPage=Math.min(importPage,pages-1);
    $('#importSummary').textContent=t('importSummary',{ready:rows.filter(row=>!row.excluded).length,duplicates:importStage.duplicates||0,invalid:importStage.invalidRows?.length||0});
    $('#importPageLabel').textContent=t('importPage',{page:importPage+1,pages});$('#importPrev').disabled=importPage===0;$('#importNext').disabled=importPage>=pages-1;
    const slice=rows.slice(importPage*importPageSize,(importPage+1)*importPageSize);
    $('#importReviewRows').innerHTML=slice.map((row,offset)=>{const index=importPage*importPageSize+offset;return `<tr class="${row.needsReview?'needs-review':''}"><td data-label="${t('include')}"><input type="checkbox" data-import-include="${index}" ${row.excluded?'':'checked'} aria-label="${t('include')}"></td><td data-label="${t('date')}"><input type="date" value="${row.date}" data-import-date="${index}" aria-label="${t('date')}"></td><td data-label="${t('description')}"><input type="text" value="${escapeHtml(row.name)}" data-import-name="${index}" aria-label="${t('description')}"></td><td data-label="${t('amount')}"><input type="number" min="0.01" step="0.01" value="${row.amount}" data-import-amount="${index}" aria-label="${t('amount')}"></td><td data-label="${t('type')}"><select data-import-type="${index}" aria-label="${t('type')}"><option value="expense" ${row.type==='expense'?'selected':''}>${t('expense')}</option><option value="income" ${row.type==='income'?'selected':''}>${t('income')}</option></select></td><td data-label="${t('category')}"><select data-import-category="${index}" aria-label="${t('category')}">${categoryOptions(row.type,row.category)}</select></td></tr>`;}).join('');
    $$('[data-import-include]').forEach(input=>input.addEventListener('change',()=>{rows[Number(input.dataset.importInclude)].excluded=!input.checked;$('#importSummary').textContent=t('importSummary',{ready:rows.filter(row=>!row.excluded).length,duplicates:importStage.duplicates||0,invalid:importStage.invalidRows?.length||0});}));
    $$('[data-import-type]').forEach(select=>select.addEventListener('change',()=>{const index=Number(select.dataset.importType),row=rows[index];row.type=select.value;row.category=(row.type==='income'?state.incomeCategories:state.categories)[0]?.id;row.needsReview=false;row.categoryConfidence='manual-review';row.categorizationRule='row-review';pendingBulkOverride=null;invalidateBulkUndo();renderImportReview();}));
    $$('[data-import-category]').forEach(select=>select.addEventListener('change',()=>{const row=rows[Number(select.dataset.importCategory)];row.category=select.value;row.needsReview=false;row.categoryConfidence='manual-review';row.categorizationRule='row-review';pendingBulkOverride=null;invalidateBulkUndo();}));
    $$('[data-import-date]').forEach(input=>input.addEventListener('change',()=>{rows[Number(input.dataset.importDate)].date=input.value;}));
    $$('[data-import-name]').forEach(input=>input.addEventListener('change',()=>{rows[Number(input.dataset.importName)].name=input.value.trim();}));
    $$('[data-import-amount]').forEach(input=>input.addEventListener('change',()=>{rows[Number(input.dataset.importAmount)].amount=Math.abs(Number(input.value)||0);}));
    $('#bulkImportCategory').innerHTML=categoryOptions($('#bulkImportType').value,$('#bulkImportCategory').value);
    renderBulkOverrideState();
  }

  async function readImportFile(file) {
    try {
      if(!file||file.size>MerImport.MAX_TEXT_LENGTH)throw new Error('file-too-large');
      let result;
      if(/\.xlsx?$/i.test(file.name)){
        if(!window.XLSX){showToast(t('excelUnavailable'));return;}
        const workbook=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true,sheetRows:MerImport.MAX_IMPORT_ROWS+2});const sheet=workbook.Sheets[workbook.SheetNames[0]];if(!sheet)throw new Error('empty-workbook');const rows=XLSX.utils.sheet_to_json(sheet,{header:1,raw:true,defval:''});result=MerImport.parseRows(rows,state,{dateFormat:appState.settings.dateFormat});
      }else if(/\.(xml|camt)$/i.test(file.name))result=MerAccounting.parseCamt053(await file.text(),state);
      else result=MerImport.parseCsvImport(await file.text(),state,{dateFormat:appState.settings.dateFormat});
      stageImport(result,file.name);
    }catch(error){window.MerRuntime?.report?.(error,{silent:true});showToast(t('importFailed'));}
  }

  function loadLargeSample() {
    const rows=[['Date','Description','Amount','Type']];
    for(let index=1;index<=520;index+=1){const day=String(index%28+1).padStart(2,'0'),income=index%13===0;const names=income?`Freelance client ${index}`:[`Konzum Market ${index}`,`Uber ride ${index}`,`Netflix plan ${index}`,`Unknown vendor ${index}`][index%4];rows.push([`${appReferenceDate.slice(0,7)}-${day}`,names,income?500+index:-(5+(index%73)),income?'Income':'Expense']);}
    stageImport(MerImport.parseRows(rows,state,{dateFormat:appState.settings.dateFormat}),'mer-demo-520.csv');
  }

  function requestBulkOverride() {
    if(!importStage||!MerImport.stageBelongsToProfile(importStage,appState.activeAccount)){showToast(t('importProfileChanged'));importStage=null;renderImportReview();return;}
    const count=importStage.reviewRows.filter(row=>row&&!row.excluded).length;
    if(!count)return;
    const type=$('#bulkImportType').value,category=$('#bulkImportCategory').value,categoryLabel=$('#bulkImportCategory').selectedOptions[0]?.textContent||category;
    pendingBulkOverride={type,category,categoryLabel,count};
    renderBulkOverrideState();
    $('#bulkOverrideConfirmation').focus?.({preventScroll:true});
  }

  function confirmBulkOverride() {
    if(!pendingBulkOverride||!importStage)return;
    const result=MerImport.applyBulkOverride(importStage,appState.activeAccount,pendingBulkOverride);
    if(!result.valid){pendingBulkOverride=null;showToast(t('importProfileChanged'));renderImportReview();return;}
    lastBulkOverride={profileId:appState.activeAccount,snapshot:result.snapshot};
    pendingBulkOverride=null;
    renderImportReview();
  }

  function undoLastBulkOverride() {
    if(!lastBulkOverride||!importStage)return;
    const result=MerImport.undoBulkOverride(importStage,appState.activeAccount,lastBulkOverride.snapshot);
    lastBulkOverride=null;pendingBulkOverride=null;
    if(!result.valid){showToast(t('importProfileChanged'));importStage=null;}else showToast(t('bulkOverrideUndone'));
    renderImportReview();
  }

  function resetDemoWorkspace() {
    if(!window.MerAuthProvider?.currentSession?.()?.demo){showToast(t('demoResetUnavailable'));return false;}
    appState.accounts.personal=normalizeProfile(structuredClone(personalDefaults),personalDefaults);
    appState.accounts.business=normalizeProfile(structuredClone(businessDefaults),businessDefaults);
    appState.bankConnections=[];
    appState.activeAccount='personal';
    state=appState.accounts.personal;
    Object.values(appState.accounts).forEach(alignSavingsHistory);
    importStage=null;pendingBulkOverride=null;lastBulkOverride=null;activityReviewOnly=false;
    save('demo-reset');
    showView('overview');
    showToast(t('demoResetComplete'));
    return true;
  }

  function renderAutomationRules() {
    if(!$('#automationRuleList'))return;
    const rules=state.automationRules||[];
    $('#automationRuleList').innerHTML=rules.length
      ? `<div class="automation-rule-list-heading"><strong>${t('activeRules')}</strong><span>${rules.length}</span></div>${rules.map(rule=>`<article class="automation-rule"><div class="automation-rule-side"><small>${t('ruleIf')}</small><span>${t('ruleExampleContains')}</span><strong>“${escapeHtml(rule.keyword)}”</strong></div><span class="automation-rule-arrow" aria-hidden="true">→</span><div class="automation-rule-side result"><small>${t('ruleThen')}</small><span>${t('ruleAssignCategory')}</span><strong>${escapeHtml(rule.type==='income'?incomeCategoryName(rule.category):categoryName(rule.category))}</strong></div><span class="rule-type-pill">${t(rule.type)}</span><button type="button" class="icon-button small danger-icon" data-delete-rule="${rule.id}" aria-label="${t('deleteRule')}"><svg aria-hidden="true"><use href="#icon-x"></use></svg></button></article>`).join('')}`
      : `<div class="rules-empty-state"><span class="rules-empty-icon" aria-hidden="true">◎</span><div class="rules-empty-copy"><strong>${t('noRulesTitle')}</strong><p>${t('noRulesBody')}</p></div><div class="rules-example"><small>${t('ruleExample')}</small><div><span class="rule-step-badge">${t('ruleIf')}</span><span>${t('ruleExampleContains')}</span><strong>“Uber”</strong><span aria-hidden="true">→</span><span class="rule-step-badge then">${t('ruleThen')}</span><strong>${t('transport')}</strong></div></div></div>`;
    $$('[data-delete-rule]').forEach(button=>button.addEventListener('click',()=>{state.automationRules=state.automationRules.filter(rule=>rule.id!==button.dataset.deleteRule);save();renderAutomationRules();showToast(t('ruleDeleted'));}));
    renderRuleCategorySelect();
  }

  function renderRuleCategorySelect(){const type=$('#ruleType').value||'expense';$('#ruleCategory').innerHTML=categoryOptions(type,$('#ruleCategory').value);}

  function primaryGoal(){return state.goalBuckets.find(goal=>goal.primary)||state.goalBuckets[0];}
  function renderGoals() {
    const goals=state.goalBuckets||[];const primary=primaryGoal();if(!primary)return;
    const primaryResult=MerCore.validateSavingsGoal(primary),pct=Math.round(primaryResult.percent||0);
    $('#overviewView .goal-panel h2').textContent=primary.name;$('#goalCurrent').textContent=currency(primary.current,true);$('#goalOf').textContent=t('goalOf',{target:currency(primary.target,true)});$('#goalPercent').textContent=`${pct}%`;$('#goalProgress').style.width=`${pct}%`;$('#goalProgressTrack').setAttribute('aria-valuenow',String(pct));
    $('#savingsView .savings-hero h2').textContent=primary.name;$('#savingsHeroCurrent').textContent=currency(primary.current,true);$('#savingsHeroTarget').textContent=t('goalTargetOf',{target:currency(primary.target,true)});$('#savingsHeroProgress').style.width=`${pct}%`;$('#savingsHeroTrack').setAttribute('aria-valuenow',String(pct));$('#savingsHeroTrack').setAttribute('aria-valuetext',`${pct}% · ${currency(primary.current,true)} ${t('goalTargetOf',{target:currency(primary.target,true)})}`);$('#stillNeeded').textContent=currency(primaryResult.remaining,true);if(primary.dueDate)$('#savingsFinish').textContent=preferredDate(primary.dueDate);
    const milestones=$$('#savingsView .savings-milestones small');if(milestones.length===3){milestones[0].textContent=currency(0,true);milestones[1].textContent=currency(primary.target/2,true);milestones[2].textContent=currency(primary.target,true);}
    $('#goalBucketGrid').innerHTML=goals.map(goal=>{const result=MerCore.validateSavingsGoal(goal),percent=Math.round(result.percent||0),metrics=MerAccounting.goalMetrics(goal,appReferenceDate);return `<article class="goal-bucket-card rich-goal-card" data-layout-card="goal-${escapeHtml(goal.id)}"><div class="goal-bucket-head"><div class="goal-progress-ring" style="--goal-progress:${percent}" role="progressbar" aria-label="${escapeHtml(goal.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" aria-valuetext="${percent}% · ${currency(goal.current,true)} ${t('goalOf',{target:currency(goal.target,true)})}"><svg viewBox="0 0 36 36" aria-hidden="true" focusable="false"><circle class="goal-ring-track" cx="18" cy="18" r="15.5" pathLength="100"></circle><circle class="goal-ring-value" cx="18" cy="18" r="15.5" pathLength="100"></circle></svg><span>${percent}%</span></div><div class="goal-bucket-title"><strong>${escapeHtml(goal.name)}</strong><small>${goal.primary?t('primaryGoal'):(goal.dueDate?t('goalDue',{date:preferredDate(goal.dueDate)}):t('goalNoDate'))}</small></div><button type="button" class="icon-button small" data-edit-goal="${goal.id}" aria-label="${t('editGoal')}"><svg aria-hidden="true"><use href="#icon-edit"></use></svg></button></div><div class="goal-bucket-values"><strong>${currency(goal.current,true)}</strong><span>${t('goalOf',{target:currency(goal.target,true)})}</span></div><div class="goal-linear-track" aria-hidden="true"><span style="width:${percent}%"></span></div><div class="goal-metric-grid"><span><small>${t('monthlyRequired')}</small><strong>${metrics.monthlyRequired===null?'—':currency(metrics.monthlyRequired,true)}</strong></span><span><small>${goal.dueDate?t('daysToGoal',{days:metrics.daysRemaining??0}):t('goalNoDate')}</small><strong>${currency(result.remaining,true)}</strong></span></div><button type="button" class="roundup-toggle ${goal.roundUpsEnabled?'active':''}" data-toggle-roundup="${goal.id}" aria-pressed="${Boolean(goal.roundUpsEnabled)}"><span><strong>${t('roundUps')}</strong><small>${t('roundUpsHint')}</small></span><i></i></button></article>`;}).join('');
    $$('[data-edit-goal]').forEach(button=>button.addEventListener('click',()=>openGoalEditor(button.dataset.editGoal)));
    $$('[data-toggle-roundup]').forEach(button=>button.addEventListener('click',()=>{const chosen=state.goalBuckets.find(goal=>goal.id===button.dataset.toggleRoundup);if(!chosen)return;const enable=!chosen.roundUpsEnabled;state.goalBuckets.forEach(goal=>{goal.roundUpsEnabled=false;});chosen.roundUpsEnabled=enable;save('roundup-goal-toggle');showToast(t('settingsSaved'));}));
  }

  function openGoalEditor(id=null) {
    editingGoalId=id;const goal=id?state.goalBuckets.find(item=>item.id===id):null;$('#goalForm').reset();$('#goalModalTitle').textContent=t(goal?'editGoal':'newSavingsGoal');$('#goalNameInput').value=goal?.name||'';$('#goalTargetInput').value=goal?.target||'';$('#goalCurrentInput').value=goal?.current||0;$('#goalDueDateInput').value=goal?.dueDate||'';$('#goalPrimaryInput').checked=Boolean(goal?.primary);$('#deleteSavingsGoal').hidden=!goal;openModal($('#goalModal'));setTimeout(()=>$('#goalNameInput').focus(),50);
  }

  function renderPremium() { applyPrivacy();renderGoals();if($('#bankSettingsModal').open)renderPremiumSettings(); }
  const originalRenderAll=renderAll;
  renderAll=function renderAllWithPremium(){originalRenderAll();renderPremium();};

  $$('[data-settings-tab]').forEach(button=>button.addEventListener('click',()=>selectSettingsTab(button.dataset.settingsTab)));
  $('#manageSettings').addEventListener('click',()=>openSettings('general'));
  $('#bankSettingsModal').addEventListener('close',()=>{visibleRecoveryCodes=[];pendingEnrollment=null;pendingSmsChallenge=null;pendingSmsDisableChallenge=null;$('#mfaDisableCode').value='';renderMfa();});
  ['baseCurrency','dateFormat','timezone','hideBalances'].forEach(id=>$('#'+id).addEventListener('change',()=>{appState.settings.currency=$('#baseCurrency').value;appState.settings.dateFormat=$('#dateFormat').value;appState.settings.timezone=$('#timezone').value;appState.settings.hideBalances=$('#hideBalances').checked;save('settings-change');showToast(t('settingsSaved'));}));
  $('#settingsLanguage').addEventListener('change',event=>setLanguage(event.target.value));
  $('#layoutEditToggle').addEventListener('click',()=>closeModal($('#bankSettingsModal')));
  $$('[data-open-global-import]').forEach(button=>button.addEventListener('click',openGlobalImport));
  $$('[data-export-active]').forEach(button=>button.addEventListener('click',exportActiveProfileCsv));
  $$('[data-export-budget]').forEach(button=>button.addEventListener('click',()=>{closeCardMenus();if($('#budgetDataModal').open)closeModal($('#budgetDataModal'));exportBudgetPlanCsv();}));
  $$('[data-export-insights]').forEach(button=>button.addEventListener('click',exportInsightsReportCsv));

  $('#changePasswordForm').addEventListener('submit',event=>{event.preventDefault();runAsyncAction(async()=>{const feedback=$('#passwordChangeFeedback'),result=await window.MerAuthProvider?.changePassword?.({currentPassword:$('#currentPasswordInput').value,newPassword:$('#newPasswordInput').value,confirmPassword:$('#confirmNewPasswordInput').value});const errorKeys={DEMO_READ_ONLY:'demoPasswordUnavailable',INVALID_CURRENT_PASSWORD:'invalidCurrentPassword',PASSWORD_MISMATCH:'passwordMismatch',PASSWORD_REUSED:'passwordReused',WEAK_PASSWORD:'passwordWeak'};feedback.className=`security-form-feedback ${result?.ok?'success':'error'}`;feedback.textContent=t(result?.ok?'passwordUpdated':(errorKeys[result?.code]||'passwordChangeFailed'));if(result?.ok){window.MerMfaState?.activate?.(result.session);window.MerMfaUnlock?.mark?.(result.session);event.currentTarget.reset();renderActiveSessions();}},'passwordChangeFailed');});
  $('#logoutOtherSessions').addEventListener('click',()=>{const result=window.MerAuthProvider?.revokeOtherSessions?.();if(!result?.ok){showToast(t('passwordChangeFailed'));return;}renderActiveSessions();showToast(t('otherSessionsLoggedOut',{count:result.revoked}));});
  $('#mfaMethodSelector').addEventListener('click',event=>{const choice=event.target.closest('[data-mfa-method]');if(!choice||appState.mfa.enabled)return;selectedMfaMethod=MerSecurity.normalizeMfaMethod(choice.dataset.mfaMethod)||MerSecurity.MFA_METHODS.AUTHENTICATOR;pendingEnrollment=null;pendingSmsChallenge=null;visibleRecoveryCodes=[];renderMfa();});
  $('#startMfa').addEventListener('click',()=>runAsyncAction(async()=>{pendingEnrollment=await MerSecurity.createEnrollment(state.accountName);visibleRecoveryCodes=[];renderMfa();},'mfaInvalid'));
  $('#copyMfaSecret').addEventListener('click',()=>runAsyncAction(async()=>{if(!pendingEnrollment)return;if(!navigator.clipboard?.writeText)throw new Error('clipboard-unavailable');await navigator.clipboard.writeText(pendingEnrollment.secret);showToast(t('secretCopied'));},'mfaInvalid'));
  $('#confirmMfa').addEventListener('click',()=>runAsyncAction(async()=>{if(!pendingEnrollment||!await MerSecurity.validateTotp(pendingEnrollment.secret,$('#mfaVerificationCode').value)){showToast(t('mfaInvalid'));return;}appState.mfa=MerSecurity.createMfaMethodState({enabled:true,method:'authenticator',secret:pendingEnrollment.secret,recoveryCodeHashes:pendingEnrollment.recoveryCodeHashes,enabledAt:new Date().toISOString()});visibleRecoveryCodes=pendingEnrollment.recoveryCodes;pendingEnrollment=null;window.MerMfaUnlock?.mark?.();save('mfa-enable-authenticator');renderMfa();showToast(t('mfaReady'));},'mfaInvalid'));
  $('#sendMfaSmsCode').addEventListener('click',()=>runAsyncAction(async()=>{const phone=MerSecurity.normalizeSmsDestination($('#mfaSmsPhone').value);if(!phone){showToast(t('smsInvalidPhone'));return;}pendingSmsChallenge=await MerSecurity.createSmsChallenge(phone);$('#mfaSmsDemoDelivery').textContent=t('smsDemoDelivery',{phone:pendingSmsChallenge.maskedPhone,code:pendingSmsChallenge.demoCode});renderMfa();$('#mfaSmsCode').focus({preventScroll:true});showToast(t('smsCodeSent'));},'mfaInvalid'));
  $('#confirmSmsMfa').addEventListener('click',()=>runAsyncAction(async()=>{if(!pendingSmsChallenge||!await MerSecurity.validateSmsChallenge(pendingSmsChallenge,$('#mfaSmsCode').value)){showToast(t('mfaInvalid'));return;}const recoveryCodes=MerSecurity.generateRecoveryCodes(),recoveryCodeHashes=await Promise.all(recoveryCodes.map(MerSecurity.hashRecoveryCode));appState.mfa=MerSecurity.createMfaMethodState({enabled:true,method:'sms',phoneNumber:$('#mfaSmsPhone').value,recoveryCodeHashes,enabledAt:new Date().toISOString()});visibleRecoveryCodes=recoveryCodes;pendingSmsChallenge=null;window.MerMfaUnlock?.mark?.();save('mfa-enable-sms');renderMfa();showToast(t('mfaReady'));},'mfaInvalid'));
  $('#downloadRecoveryCodes').addEventListener('click',()=>downloadFile('mer-recovery-codes.txt',visibleRecoveryCodes.join('\r\n'),'text/plain;charset=utf-8'));
  $('#sendMfaDisableSmsCode').addEventListener('click',()=>runAsyncAction(async()=>{if(!appState.mfa.enabled||appState.mfa.method!=='sms'||!appState.mfa.phoneNumber)return;pendingSmsDisableChallenge=await MerSecurity.createSmsChallenge(appState.mfa.phoneNumber);renderMfa();$('#mfaDisableCode').focus({preventScroll:true});showToast(t('smsCodeSent'));},'mfaInvalid'));
  $('#disableMfa').addEventListener('click',()=>runAsyncAction(async()=>{if(!await verifyDisableMfaCode($('#mfaDisableCode').value)){showToast(t('mfaInvalid'));return;}appState.mfa=MerSecurity.createMfaMethodState({});window.MerMfaUnlock?.clear?.();visibleRecoveryCodes=[];pendingSmsUnlockChallenge=null;pendingSmsDisableChallenge=null;$('#mfaDisableCode').value='';save('mfa-disable');renderMfa();showToast(t('mfaRemoved'));},'mfaInvalid'));
  $('#mfaUnlockForm').addEventListener('submit',event=>{event.preventDefault();runAsyncAction(async()=>{if(!await verifyMfaCode($('#mfaUnlockCode').value)){ $('#mfaUnlockError').textContent=t('unlockError');return;}if(!window.MerMfaUnlock?.mark?.()){ $('#mfaUnlockError').textContent=t('unlockError');return;}pendingSmsUnlockChallenge=null;window.MerAuthSecurityUi?.completeUnlock?.();},'mfaInvalid');});

  $('#importFile').addEventListener('change',()=>{const file=$('#importFile').files?.[0];if(file)readImportFile(file);});$('#loadImportSample').addEventListener('click',loadLargeSample);$('#importPrev').addEventListener('click',()=>{importPage=Math.max(0,importPage-1);renderImportReview();});$('#importNext').addEventListener('click',()=>{importPage+=1;renderImportReview();});
  $('#bulkImportType').addEventListener('change',()=>{pendingBulkOverride=null;$('#bulkImportCategory').innerHTML=categoryOptions($('#bulkImportType').value);renderBulkOverrideState();});
  $('#bulkImportCategory').addEventListener('change',()=>{pendingBulkOverride=null;renderBulkOverrideState();});
  $('#applyBulkImport').addEventListener('click',requestBulkOverride);
  $('#bulkOverrideCancel').addEventListener('click',()=>{pendingBulkOverride=null;renderBulkOverrideState();});
  $('#bulkOverrideConfirm').addEventListener('click',confirmBulkOverride);
  $('#undoBulkOverride').addEventListener('click',undoLastBulkOverride);
  $('#confirmImport').addEventListener('click',()=>{if(!importStage)return;const stagedDuplicates=importStage.duplicates||0,result=MerImport.commitReviewStage(state,importStage,appState.activeAccount);if(result.error){importStage=null;pendingBulkOverride=null;lastBulkOverride=null;renderImportReview();showToast(t('importProfileChanged'));return;}result.imported.forEach(tx=>MerAccounting.applyRoundUp(state,tx));const duplicates=stagedDuplicates+result.duplicates;importStage=null;pendingBulkOverride=null;lastBulkOverride=null;$('#importFile').value='';save('bulk-import');closeModal($('#importDataModal'));showToast(t('importFinished',{count:result.imported.length,duplicates}));});

  $('#resetDemoData').addEventListener('click',()=>openModal($('#demoResetModal')));
  $('#confirmDemoReset').addEventListener('click',resetDemoWorkspace);

  $('#ruleType').addEventListener('change',renderRuleCategorySelect);$('#automationRuleForm').addEventListener('submit',event=>{event.preventDefault();const keyword=$('#ruleKeyword').value.trim();if(!keyword){showToast(t('categoryNameRequired'));return;}if(state.automationRules.some(rule=>rule.keyword.toLocaleLowerCase()===keyword.toLocaleLowerCase())){showToast(t('ruleExists'));return;}state.automationRules.push({id:uniqueId('rule'),keyword:keyword.slice(0,60),type:$('#ruleType').value==='income'?'income':'expense',category:$('#ruleCategory').value,enabled:true});save();event.target.reset();renderAutomationRules();showToast(t('ruleSaved'));});

  $('#addSavingsGoal').addEventListener('click',()=>openGoalEditor());$('#goalForm').addEventListener('submit',event=>{event.preventDefault();const payload={name:$('#goalNameInput').value.trim(),target:Number($('#goalTargetInput').value),current:Number($('#goalCurrentInput').value),dueDate:$('#goalDueDateInput').value,primary:$('#goalPrimaryInput').checked,icon:'◎'};const validation=MerCore.validateSavingsGoal(payload);if(!validation.valid){showToast(t('goalInvalid'));return;}if(payload.primary)state.goalBuckets.forEach(goal=>{goal.primary=false;});const existing=editingGoalId?state.goalBuckets.find(goal=>goal.id===editingGoalId):null;if(existing)Object.assign(existing,payload);else state.goalBuckets.push({id:uniqueId('goal'),...payload});if(!state.goalBuckets.some(goal=>goal.primary))state.goalBuckets[0].primary=true;save(existing?'savings-goal-edit':'savings-goal-add');closeModal($('#goalModal'));showToast(t('goalSaved'));editingGoalId=null;});
  $('#deleteSavingsGoal').addEventListener('click',()=>{const goal=state.goalBuckets.find(item=>item.id===editingGoalId);if(!goal)return;if(state.goalBuckets.length===1){showToast(t('atLeastOneGoal'));return;}if(goal.current>0){showToast(t('goalHasBalance'));return;}state.goalBuckets=state.goalBuckets.filter(item=>item.id!==goal.id);state.savingsEntries=state.savingsEntries.filter(entry=>entry.goalId!==goal.id);if(goal.primary)state.goalBuckets[0].primary=true;save('savings-goal-delete');closeModal($('#goalModal'));showToast(t('goalDeleted'));editingGoalId=null;});

  applyStaticTranslations();renderAll();selectSettingsTab(selectedSettingsTab);
})();
