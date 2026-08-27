(function initializeOnboarding() {
  Object.assign(translations.hr, {
    helpAssistant:'Pomoć & AI Asistent', helpAssistantHint:'Vodič i financijska pitanja',
    onboardingTourCardTitle:'Interaktivni vodič', onboardingSettingsHint:'Ponovno prođite kroz najvažnije module i postavke.', restartOnboarding:'Pokreni vodič ponovno', onboardingSteps:'Koraci vodiča', skipTour:'Preskoči', finishTour:'Završi',
    onboardingNavigationTitle:'Sve je nadohvat ruke', onboardingNavigationBody:'Bočna navigacija vodi do Pregleda, Budžeta, Štednje, Aktivnosti i Uvida — bez gubitka konteksta.', onboardingNavigationTip:'Osobni i Poslovni profil uvijek zadržavaju potpuno odvojene podatke.', onboardingNavigationLabel:'Navigacija',
    onboardingTransactionTitle:'Zabilježite stvarno stanje', onboardingTransactionBody:'Gumb Dodaj transakciju otvara isti obrazac za prihod ili trošak. Budžetsko prekoračenje upozorava, ali nikada ne blokira spremanje.', onboardingTransactionTip:'Novi iznos odmah osvježava stanje, budžete, štednju i grafikone.', onboardingTransactionLabel:'Transakcije',
    onboardingOverviewTitle:'Zaštita budžeta u stvarnom vremenu', onboardingOverviewBody:'Ova kartica povezuje mjesečne prihode i troškove u siguran iznos za potrošnju te dnevni tempo.', onboardingOverviewTip:'Dodatni prihod odmah povećava siguran i dnevni raspoloživi iznos.', onboardingOverviewLabel:'Pregled',
    onboardingBudgetsTitle:'Smjernice, ne zabrane', onboardingBudgetsBody:'Postavite mjesečne limite po kategorijama i pratite zelene, žute i crvene pragove potrošnje.', onboardingBudgetsTip:'Upozorenja se uključuju na 80% i 100% iskorištenosti limita.', onboardingBudgetsLabel:'Budžeti',
    onboardingSavingsTitle:'Ciljevi s jasnim sljedećim korakom', onboardingSavingsBody:'Fond, namjenski pretinci, rokovi i zaokruživanja zajedno pokazuju koliko ste blizu svakom cilju.', onboardingSavingsTip:'Zaokruživanje sitniša možete usmjeriti u jedan aktivni cilj.', onboardingSavingsLabel:'Štednja',
    onboardingActivityTitle:'Pronađite i uredite svaki zapis', onboardingActivityBody:'Pretraga, raspon datuma, kategorija i vrsta pomažu brzo pronaći ručne i automatski uvezene transakcije.', onboardingActivityTip:'Filtri uvijek rade samo nad trenutačno aktivnim profilom.', onboardingActivityLabel:'Aktivnost',
    onboardingInsightsTitle:'Pretvorite brojke u odluke', onboardingInsightsBody:'Uvidi povezuju neto iznos, strukturu potrošnje, trgovce, mjesečne trendove i stopu štednje.', onboardingInsightsTip:'Odaberite dnevni, mjesečni, godišnji ili sveukupni prikaz.', onboardingInsightsLabel:'Uvidi',
    onboardingSettingsTitle:'Postavke i automatizacija', onboardingSettingsBody:'Iz korisničkog izbornika povežite banke, odaberite privatnost i valutu ili uredite If/Then pravila kategorizacije.', onboardingSettingsTip:'Vodič možete ponovno pokrenuti iz Postavki u bilo kojem trenutku.', onboardingSettingsLabel:'Postavke'
  });
  Object.assign(translations.en, {
    helpAssistant:'Help & AI Assistant', helpAssistantHint:'Guide and money questions',
    onboardingTourCardTitle:'Interactive tour', onboardingSettingsHint:'Walk through the key modules and settings again.', restartOnboarding:'Re-run tour', onboardingSteps:'Tour steps', skipTour:'Skip', finishTour:'Finish',
    onboardingNavigationTitle:'Everything is within reach', onboardingNavigationBody:'The sidebar takes you to Overview, Budgets, Savings, Activity and Insights without losing context.', onboardingNavigationTip:'Personal and Business data always remain completely isolated.', onboardingNavigationLabel:'Navigation',
    onboardingTransactionTitle:'Record financial reality', onboardingTransactionBody:'Add transaction opens one form for income or expenses. Budget overages warn you but never block saving.', onboardingTransactionTip:'A new amount instantly refreshes balances, budgets, savings and charts.', onboardingTransactionLabel:'Transactions',
    onboardingOverviewTitle:'Real-time Budget Protection', onboardingOverviewBody:'This card combines monthly income and expenses into your safe-to-spend amount and daily pace.', onboardingOverviewTip:'New income immediately increases both safe and daily available amounts.', onboardingOverviewLabel:'Overview',
    onboardingBudgetsTitle:'Guardrails, not roadblocks', onboardingBudgetsBody:'Set monthly category limits and follow green, yellow and red spending thresholds.', onboardingBudgetsTip:'Warnings appear at 80% and 100% of a category limit.', onboardingBudgetsLabel:'Budgets',
    onboardingSavingsTitle:'Goals with a clear next step', onboardingSavingsBody:'Your fund, goal buckets, deadlines and round-ups show exactly how close you are to each goal.', onboardingSavingsTip:'Round-ups can be routed to one active savings goal.', onboardingSavingsLabel:'Savings',
    onboardingActivityTitle:'Find and edit every record', onboardingActivityBody:'Search, date range, category and type filters help locate manual and bank-imported transactions quickly.', onboardingActivityTip:'Filters only read the currently active profile.', onboardingActivityLabel:'Activity',
    onboardingInsightsTitle:'Turn numbers into decisions', onboardingInsightsBody:'Insights connects net total, spending mix, merchants, monthly trends and savings rate.', onboardingInsightsTip:'Choose daily, monthly, year-to-date or all-time analysis.', onboardingInsightsLabel:'Insights',
    onboardingSettingsTitle:'Settings and automation', onboardingSettingsBody:'From the user menu, connect banks, choose privacy and currency options, or edit If/Then categorization rules.', onboardingSettingsTip:'You can restart this tour from Settings at any time.', onboardingSettingsLabel:'Settings'
  });
  applyStaticTranslations();

  const tour = $('#onboardingTour');
  const spotlight = $('#onboardingSpotlight');
  const popover = $('#onboardingPopover');
  const appShell = $('#appShell');
  if (!tour || !spotlight || !popover || !appShell || !window.MerOnboardingCore) return;

  let controller = null;
  let pendingSession = null;
  let currentTarget = null;
  let previousDescription = null;
  let resizeObserver = null;
  let geometryFrame = 0;
  let settleTimer = 0;
  let startingView = 'overview';
  let startingSidebarOpen = false;
  let returnFocus = null;

  function userIdFor(session) { return session?.userId || session?.email || 'anonymous'; }
  function createController(session) { return MerOnboardingCore.createOnboardingController({ storage:localStorage, userId:userIdFor(session) }); }
  function controllerFor(session) {
    const normalizedUserId = MerOnboardingCore.cleanUserId(userIdFor(session));
    if (!controller || controller.snapshot().userId !== normalizedUserId) controller = createController(session);
    return controller;
  }
  function stepKey(step, suffix) { return `onboarding${step.id[0].toUpperCase()}${step.id.slice(1)}${suffix}`; }
  function mobileViewport() { return window.matchMedia('(max-width: 767px)').matches; }

  function viewportBounds() {
    const visual = window.visualViewport;
    return visual
      ? { left:visual.offsetLeft, top:visual.offsetTop, width:visual.width, height:visual.height }
      : { left:0, top:0, width:window.innerWidth, height:window.innerHeight };
  }

  function releaseTarget() {
    clearTimeout(settleTimer);
    settleTimer = 0;
    resizeObserver?.disconnect();
    resizeObserver = null;
    if (currentTarget) {
      currentTarget.classList.remove('tour-target-active');
      if (previousDescription === null) currentTarget.removeAttribute('aria-describedby');
      else currentTarget.setAttribute('aria-describedby', previousDescription);
    }
    currentTarget = null;
    previousDescription = null;
  }

  function visibleTarget(selector) {
    if (!selector) return null;
    const element = document.querySelector(selector);
    if (!element || element.hidden || !element.getClientRects().length) return null;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? element : null;
  }

  function targetFor(step) {
    if (mobileViewport() && !step.openSidebar) {
      const mobile = visibleTarget(step.mobileTarget);
      if (mobile) return mobile;
    }
    const primary = visibleTarget(step.target);
    if (primary) return primary;
    return visibleTarget(step.mobileTarget) || $('#menuToggle') || appShell;
  }

  function scheduleGeometry() {
    cancelAnimationFrame(geometryFrame);
    geometryFrame = requestAnimationFrame(positionSpotlight);
  }

  function positionSpotlight() {
    geometryFrame = 0;
    if (tour.hidden || !currentTarget?.isConnected) return;
    const targetRect = currentTarget.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const viewport = viewportBounds();
    const layout = MerOnboardingCore.computeSpotlightLayout({
      targetRect,
      popoverSize:{ width:Math.min(popoverRect.width || 340, Math.max(1, viewport.width - 24)), height:Math.min(popoverRect.height || 240, Math.max(1, viewport.height - 24)) },
      viewport,
      preferredPlacement:controller?.snapshot().step.placement,
      padding:8,
      gap:14,
      edge:12
    });
    Object.assign(spotlight.style, {
      left:`${layout.spotlight.left}px`, top:`${layout.spotlight.top}px`, width:`${layout.spotlight.width}px`, height:`${layout.spotlight.height}px`
    });
    Object.assign(popover.style, { left:`${layout.popover.left}px`, top:`${layout.popover.top}px` });
    popover.dataset.placement = layout.popover.placement;
  }

  function previewStep(step) {
    releaseTarget();
    tour.classList.add('is-positioning');
    if (step.view && typeof showView === 'function') showView(step.view);
    if (mobileViewport() && step.openSidebar) openSidebar();
    else if (mobileViewport()) closeSidebar();

    currentTarget = targetFor(step);
    previousDescription = currentTarget.getAttribute('aria-describedby');
    currentTarget.setAttribute('aria-describedby', 'onboardingBody');
    currentTarget.classList.add('tour-target-active');
    currentTarget.scrollIntoView({ behavior:'instant', block:'center', inline:'nearest' });
    resizeObserver = new ResizeObserver(scheduleGeometry);
    resizeObserver.observe(currentTarget);
    requestAnimationFrame(() => requestAnimationFrame(scheduleGeometry));
    settleTimer = setTimeout(() => {
      positionSpotlight();
      requestAnimationFrame(() => tour.classList.remove('is-positioning'));
    }, mobileViewport() ? 240 : 60);
  }

  function render(snapshot = controller?.snapshot()) {
    if (!snapshot) return;
    const step = snapshot.step;
    const stepNumber = snapshot.stepIndex + 1;
    $('#onboardingTitle').textContent = t(step.titleKey);
    $('#onboardingBody').textContent = t(step.bodyKey);
    $('#onboardingEyebrow').textContent = t(stepKey(step, 'Label')).toLocaleUpperCase(locale());
    $('#onboardingTip span').textContent = t(stepKey(step, 'Tip'));
    $('#onboardingProgress').textContent = currentLang === 'hr' ? `Korak ${stepNumber} od ${controller.steps.length}` : `Step ${stepNumber} of ${controller.steps.length}`;
    $('#onboardingProgressBar').style.width = `${stepNumber / controller.steps.length * 100}%`;
    $('#onboardingPrevious').hidden = snapshot.stepIndex === 0;
    $('#onboardingNext').textContent = t(snapshot.stepIndex === controller.steps.length - 1 ? 'finishTour' : 'continue');
    previewStep(step);
  }

  function installTourEvents() {
    window.addEventListener('resize', scheduleGeometry);
    window.addEventListener('scroll', scheduleGeometry, true);
    window.visualViewport?.addEventListener('resize', scheduleGeometry);
    window.visualViewport?.addEventListener('scroll', scheduleGeometry);
    document.addEventListener('keydown', handleTourKeydown, true);
  }

  function removeTourEvents() {
    window.removeEventListener('resize', scheduleGeometry);
    window.removeEventListener('scroll', scheduleGeometry, true);
    window.visualViewport?.removeEventListener('resize', scheduleGeometry);
    window.visualViewport?.removeEventListener('scroll', scheduleGeometry);
    document.removeEventListener('keydown', handleTourKeydown, true);
  }

  function focusableInPopover() {
    return [...popover.querySelectorAll('button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')].filter(element => !element.hidden && element.getClientRects().length);
  }

  function handleTourKeydown(event) {
    if (tour.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      dismissTour();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = focusableInPopover();
    if (!focusable.length) { event.preventDefault();popover.focus({ preventScroll:true });return; }
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault();last.focus({ preventScroll:true }); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault();first.focus({ preventScroll:true }); }
    else if (!popover.contains(document.activeElement)) { event.preventDefault();first.focus({ preventScroll:true }); }
  }

  function closeTourSurface({ restoreView = false, focus = true } = {}) {
    if (tour.hidden) return;
    releaseTarget();
    cancelAnimationFrame(geometryFrame);
    geometryFrame = 0;
    removeTourEvents();
    tour.hidden = true;
    tour.classList.remove('is-positioning');
    appShell.inert = false;
    document.body.classList.remove('tour-active');
    if (restoreView && typeof showView === 'function') showView(startingView);
    if (mobileViewport()) {
      if (startingSidebarOpen) openSidebar(); else closeSidebar();
    }
    if (focus) {
      const focusCandidate = returnFocus?.isConnected && returnFocus.getClientRects().length ? returnFocus : null;
      const target = focusCandidate || (mobileViewport() ? $('#menuToggle') : $('#openSettings'));
      target?.focus({ preventScroll:true });
    }
    returnFocus = null;
  }

  function openTour({ force = false, returnTarget = null } = {}) {
    const session = pendingSession || window.MerAuthProvider?.currentSession?.();
    if (!session || document.body.classList.contains('mfa-locked')) return false;
    controller = controllerFor(session);
    if (!tour.hidden && controller.snapshot().open) return true;
    const snapshot = controller.start({ force });
    if (!snapshot.open) return false;

    window.MerAssistantUi?.close();
    $$('dialog[open]').forEach(dialog => closeModal(dialog));
    startingView = activeView;
    startingSidebarOpen = $('#sidebar')?.classList.contains('open') || false;
    returnFocus = returnTarget || document.activeElement;
    tour.hidden = false;
    document.body.classList.add('tour-active');
    appShell.inert = true;
    installTourEvents();
    render(snapshot);
    setTimeout(() => $('#onboardingNext').focus({ preventScroll:true }), 30);
    return true;
  }

  function finishTour() {
    if (!controller) return;
    controller.complete();
    closeTourSurface({ restoreView:false });
  }

  function dismissTour() {
    if (controller?.snapshot().open) controller.dismiss();
    closeTourSurface({ restoreView:true });
  }

  $('#onboardingPrevious').addEventListener('click', () => render(controller?.previous()));
  $('#onboardingNext').addEventListener('click', () => {
    const snapshot = controller?.snapshot();
    if (!snapshot) return;
    if (snapshot.stepIndex === controller.steps.length - 1) { finishTour();return; }
    render(controller.next());
  });
  $('#onboardingSkip').addEventListener('click', dismissTour);
  $('#onboardingClose').addEventListener('click', dismissTour);
  function restartTourFrom(trigger, dialog) {
    const authenticatedUserId = window.MerAuthProvider?.currentSession?.()?.userId;
    const session = window.MerAuthProvider?.currentSession?.();
    if (!session) return false;
    if (authenticatedUserId && !session.userId) session.userId = authenticatedUserId;
    pendingSession = session;
    if (dialog?.open) closeModal(dialog);
    setTimeout(() => openTour({ force:true, returnTarget:trigger }), 30);
    return true;
  }

  $('#restartOnboarding').addEventListener('click', event => restartTourFrom($('#openSettings'), event.currentTarget.closest('dialog')));

  window.MerOnboardingUi = Object.freeze({
    onSessionStarted(session) { pendingSession=session;if (!document.body.classList.contains('mfa-locked')) openTour(); },
    resume() { if (pendingSession && !document.body.classList.contains('mfa-locked')) openTour(); },
    close() { if (!tour.hidden) { if (controller?.snapshot().open) controller.dismiss();closeTourSurface({ restoreView:false, focus:false }); } },
    restart(returnTarget = null) { return openTour({ force:true, returnTarget }); }
  });
})();
