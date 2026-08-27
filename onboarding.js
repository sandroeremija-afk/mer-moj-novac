(function initializeOnboarding() {
  Object.assign(translations.hr, {
    helpAssistant:'Pomoć & AI Asistent', helpAssistantHint:'Vodič i financijska pitanja',
    onboardingSettingsTitle:'Vodič kroz aplikaciju', onboardingSettingsHint:'Ponovno prođite kroz najvažnije module i postavke.', restartOnboarding:'Pokreni vodič', onboardingSteps:'Koraci vodiča', skipTour:'Preskoči vodič', finishTour:'Otvori postavke',
    onboardingWelcomeTitle:'Dobro došli u Moj novac', onboardingWelcomeBody:'U nekoliko kratkih koraka upoznajte pregled, budžete, štednju, aktivnost, uvide i najvažnije postavke.',
    onboardingOverviewTitle:'Sve važno na jednom pregledu', onboardingOverviewBody:'Pregled prikazuje raspoloživo stanje, siguran iznos za potrošnju, dnevni tempo i ono što slijedi.',
    onboardingBudgetsTitle:'Postavite smjernice, ne zabrane', onboardingBudgetsBody:'U Budžetima postavite mjesečni limit za svaku kategoriju. Pragovi vas upozoravaju, ali stvarne transakcije uvijek možete evidentirati.',
    onboardingSavingsTitle:'Pretvorite namjere u ciljeve', onboardingSavingsBody:'Štednja povezuje fond za hitne slučajeve, ciljane pretince i zaokruživanja u jasan plan napretka.',
    onboardingActivityTitle:'Svaki zapis ostaje pod kontrolom', onboardingActivityBody:'U Aktivnosti pretražujte, filtrirajte i izravno uređujte ručne i automatski uvezene prihode i troškove.',
    onboardingInsightsTitle:'Trendovi koji vode boljoj odluci', onboardingInsightsBody:'Uvidi uspoređuju prihode i troškove, stopu štednje, trgovce i kategorije kroz odabrano razdoblje.',
    onboardingSettingsTitle:'Povežite banke i automatizirajte pravila', onboardingSettingsBody:'U Korisničkim postavkama otvorite Banke za povezivanje računa ili Pravila za If/Then auto-kategorizaciju. Limite uređujete u Budžetima.',
    onboardingWelcomeTip:'Osobni i Poslovni podaci uvijek ostaju potpuno odvojeni.', onboardingOverviewTip:'Dodavanje prihoda ili troška odmah osvježava sve povezane kartice.', onboardingBudgetsTip:'Upozorenja se uključuju na 80% i 100% iskorištenosti limita.', onboardingSavingsTip:'Zaokruživanje sitniša možete usmjeriti u samo jedan aktivni cilj.', onboardingActivityTip:'Filtri rade samo nad aktivnim Osobnim ili Poslovnim profilom.', onboardingInsightsTip:'Promijenite razdoblje za dnevni, mjesečni, godišnji ili sveukupni prikaz.', onboardingSettingsTip:'Nakon završetka otvorit ćemo Pravila kako biste vidjeli praktičan If/Then primjer.',
    onboardingWelcomeLabel:'Dobrodošli', onboardingOverviewLabel:'Pregled', onboardingBudgetsLabel:'Budžeti', onboardingSavingsLabel:'Štednja', onboardingActivityLabel:'Aktivnost', onboardingInsightsLabel:'Uvidi', onboardingSettingsLabel:'Postavke'
  });
  Object.assign(translations.en, {
    helpAssistant:'Help & AI Assistant', helpAssistantHint:'Guide and money questions',
    onboardingSettingsTitle:'Application tour', onboardingSettingsHint:'Walk through the key modules and settings again.', restartOnboarding:'Start tour', onboardingSteps:'Tour steps', skipTour:'Skip tour', finishTour:'Open settings',
    onboardingWelcomeTitle:'Welcome to My money', onboardingWelcomeBody:'Take a short tour of Overview, Budgets, Savings, Activity, Insights and the most important settings.',
    onboardingOverviewTitle:'Everything important at a glance', onboardingOverviewBody:'Overview shows your available balance, safe-to-spend amount, daily pace and what is coming next.',
    onboardingBudgetsTitle:'Set guardrails, not roadblocks', onboardingBudgetsBody:'Set a monthly category limit in Budgets. Thresholds warn you, while real transactions can always be recorded.',
    onboardingSavingsTitle:'Turn intentions into goals', onboardingSavingsBody:'Savings brings your emergency fund, goal buckets and round-ups together in one clear progress plan.',
    onboardingActivityTitle:'Keep every record under control', onboardingActivityBody:'Use Activity to search, filter and directly edit manual and automatically imported income and expenses.',
    onboardingInsightsTitle:'Trends that support better decisions', onboardingInsightsBody:'Insights compares income, expenses, savings rate, merchants and categories across your selected timeframe.',
    onboardingSettingsTitle:'Connect banks and automate rules', onboardingSettingsBody:'Open Banks in User settings to connect accounts, or Rules for If/Then auto-categorization. Category limits live in Budgets.',
    onboardingWelcomeTip:'Personal and Business data always remain completely isolated.', onboardingOverviewTip:'Adding income or an expense instantly refreshes every connected card.', onboardingBudgetsTip:'Warnings appear at 80% and 100% of a category limit.', onboardingSavingsTip:'Round-ups can be routed to one active savings goal.', onboardingActivityTip:'Filters only read the active Personal or Business profile.', onboardingInsightsTip:'Change the timeframe for daily, monthly, year-to-date or all-time analysis.', onboardingSettingsTip:'When you finish, we will open Rules so you can see a practical If/Then example.',
    onboardingWelcomeLabel:'Welcome', onboardingOverviewLabel:'Overview', onboardingBudgetsLabel:'Budgets', onboardingSavingsLabel:'Savings', onboardingActivityLabel:'Activity', onboardingInsightsLabel:'Insights', onboardingSettingsLabel:'Settings'
  });
  applyStaticTranslations();

  const modal = $('#onboardingModal');
  if (!modal || !window.MerOnboardingCore) return;
  const stepIcons = { welcome:'compass', overview:'grid', budgets:'wallet', savings:'target', activity:'list', insights:'chart', settings:'sliders' };
  let controller = null;
  let pendingSession = null;
  let closingFromAction = false;

  function userIdFor(session) { return session?.userId || session?.email || 'anonymous'; }
  function createController(session) { return MerOnboardingCore.createOnboardingController({ storage:localStorage, userId:userIdFor(session) }); }
  function stepKey(step, suffix) { return `onboarding${step.id[0].toUpperCase()}${step.id.slice(1)}${suffix}`; }

  function previewModule(stepId) {
    if (!moduleTitleKeys[stepId]) return;
    activeView = stepId;
    $$('[data-view-panel]').forEach(panel => { const active=panel.dataset.viewPanel===stepId;panel.hidden=!active;panel.classList.toggle('active',active); });
    $$('.nav-item').forEach(item => { const active=item.dataset.view===stepId;item.classList.toggle('active',active);if(active)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current'); });
    renderModuleTitle();
  }

  function render(snapshot = controller?.snapshot()) {
    if (!snapshot) return;
    const steps = controller.steps;
    const step = steps[snapshot.stepIndex];
    const stepNumber = snapshot.stepIndex + 1;
    $('#onboardingTitle').textContent = t(step.titleKey);
    $('#onboardingBody').textContent = t(step.bodyKey);
    $('#onboardingEyebrow').textContent = t(stepKey(step, 'Label')).toLocaleUpperCase(locale());
    $('#onboardingProgress').textContent = currentLang === 'hr' ? `Korak ${stepNumber} od ${steps.length}` : `Step ${stepNumber} of ${steps.length}`;
    $('#onboardingProgressBar').style.width = `${stepNumber / steps.length * 100}%`;
    $('#onboardingIcon').innerHTML = `<svg aria-hidden="true"><use href="#icon-${stepIcons[step.id] || 'compass'}"></use></svg>`;
    $('#onboardingTip span').textContent = t(stepKey(step, 'Tip'));
    $('#onboardingPrevious').hidden = snapshot.stepIndex === 0;
    $('#onboardingNext').textContent = t(snapshot.stepIndex === steps.length - 1 ? 'finishTour' : 'continue');
    $('#onboardingStepList').innerHTML = steps.map((item,index) => `<div class="onboarding-rail-step ${index===snapshot.stepIndex?'active':index<snapshot.stepIndex?'done':''}"><i>${index<snapshot.stepIndex?'✓':index+1}</i><span>${escapeHtml(t(stepKey(item, 'Label')))}</span></div>`).join('');
    previewModule(step.id);
  }

  function openTour({ force = false } = {}) {
    const session = pendingSession || window.MerAuthProvider?.currentSession?.();
    if (!session || document.body.classList.contains('mfa-locked')) return false;
    controller = createController(session);
    const snapshot = controller.start({ force });
    if (!snapshot.open) return false;
    render(snapshot);
    openModal(modal);
    return true;
  }

  function finishTour(openSettingsAfter = false) {
    if (!controller) return;
    controller.complete();
    closingFromAction = true;
    closeModal(modal);
    closingFromAction = false;
    if (openSettingsAfter) setTimeout(() => window.MerSettings?.open('automation'), 30);
  }

  function dismissTour() {
    if (controller?.snapshot().open) controller.dismiss();
    closingFromAction = true;
    closeModal(modal);
    closingFromAction = false;
  }

  $('#onboardingPrevious').addEventListener('click', () => render(controller?.previous()));
  $('#onboardingNext').addEventListener('click', () => {
    const snapshot = controller?.snapshot();
    if (!snapshot) return;
    if (snapshot.stepIndex === controller.steps.length - 1) { finishTour(true);return; }
    render(controller.next());
  });
  $('#onboardingSkip').addEventListener('click', dismissTour);
  $('#restartOnboarding').addEventListener('click', () => {
    const authenticatedUserId = window.MerAuthProvider?.currentSession?.()?.userId;
    const session = window.MerAuthProvider?.currentSession?.();
    if (!session) return;
    if (authenticatedUserId && !session.userId) session.userId = authenticatedUserId;
    closeModal($('#bankSettingsModal'));
    pendingSession = session;
    controller = createController(session);
    const snapshot = controller.start({ force:true });
    render(snapshot);
    setTimeout(() => openModal(modal), 30);
  });
  modal.addEventListener('close', () => {
    if (!closingFromAction && controller?.snapshot().open) controller.dismiss();
  });

  window.MerOnboardingUi = Object.freeze({
    onSessionStarted(session) { pendingSession=session;if (!document.body.classList.contains('mfa-locked')) openTour(); },
    resume() { if (pendingSession && !document.body.classList.contains('mfa-locked')) openTour(); },
    close() { if (modal.open) dismissTour(); },
    restart() { return openTour({ force:true }); }
  });
})();
