(function initializeOnboarding() {
  Object.assign(translations.hr, {
    helpAssistant:'Pomoć & AI Asistent', helpAssistantHint:'Vodič i financijska pitanja',
    onboardingTourCardTitle:'Interaktivni vodič', onboardingSettingsHint:'Ponovno prođite kroz najvažnije module i postavke.', restartOnboarding:'Pokreni vodič ponovno', onboardingSteps:'Koraci vodiča', skipTour:'Preskoči', onboardingBack:'Natrag', onboardingNext:'Dalje', finishTour:'Završi',
    onboardingTransactionTitle:'Zabilježite stvarno stanje', onboardingTransactionBody:'Gumb Dodaj transakciju uvijek je pri vrhu bočne navigacije. Njime unosite prihod ili trošak.', onboardingTransactionTip:'Upozorenje vas informira, ali ne zaustavlja unos. Svaki unos odmah osvježava sve iznose i grafikone.',
    onboardingOverviewTitle:'Zaštita budžeta u stvarnom vremenu', onboardingOverviewBody:'Ovdje vidite koliko danas možete sigurno potrošiti.', onboardingOverviewTip:'Novi prihod odmah povećava raspoloživi iznos.',
    onboardingBudgetsTitle:'Smjernice, ne zabrane', onboardingBudgetsBody:'Postavite mjesečni limit za svaku kategoriju i pratite potrošnju bojama.', onboardingBudgetsTip:'Žuto upozorenje pojavljuje se na 80%, a crveno na 100%.',
    onboardingSavingsTitle:'Ciljevi s jasnim sljedećim korakom', onboardingSavingsBody:'Ovdje pratite fond, ciljeve, rokove i zaokruživanje sitniša.', onboardingSavingsTip:'Zaokruživanje možete usmjeriti u jedan aktivni cilj.',
    onboardingInsightsTitle:'Pretvorite brojke u odluke', onboardingInsightsBody:'Usporedite prihode, troškove i štednju kroz odabrano razdoblje.', onboardingInsightsTip:'Odaberite dan, mjesec, godinu ili sveukupni prikaz.',
    onboardingSettingsTip:'Podaci Osobnog i Poslovnog profila ostaju odvojeni.', onboardingHelpTip:'AI odgovor uvijek provjerite prije važne financijske odluke.'
  });
  Object.assign(translations.en, {
    helpAssistant:'Help & AI Assistant', helpAssistantHint:'Guide and money questions',
    onboardingTourCardTitle:'Interactive tour', onboardingSettingsHint:'Walk through the key modules and settings again.', restartOnboarding:'Re-run tour', onboardingSteps:'Tour steps', skipTour:'Skip', onboardingBack:'Back', onboardingNext:'Next', finishTour:'Finish',
    onboardingTransactionTitle:'Record financial reality', onboardingTransactionBody:'The Add transaction button always sits at the top of the sidebar. Use it to enter income or an expense.', onboardingTransactionTip:'Budget overages warn you but never block saving. Each entry instantly refreshes every total and chart.',
    onboardingOverviewTitle:'Real-time Budget Protection', onboardingOverviewBody:'This card combines monthly income and expenses into your safe-to-spend amount and daily pace.', onboardingOverviewTip:'New income immediately increases both safe and daily available amounts.',
    onboardingBudgetsTitle:'Guardrails, not roadblocks', onboardingBudgetsBody:'Set monthly category limits and follow green, yellow and red spending thresholds.', onboardingBudgetsTip:'Warnings appear at 80% and 100% of a category limit.',
    onboardingSavingsTitle:'Goals with a clear next step', onboardingSavingsBody:'Your fund, goal buckets, deadlines and round-ups show exactly how close you are to each goal.', onboardingSavingsTip:'Round-ups can be routed to one active savings goal.',
    onboardingInsightsTitle:'Turn numbers into decisions', onboardingInsightsBody:'Insights connects net total, spending mix, merchants, monthly trends and savings rate.', onboardingInsightsTip:'Choose daily, monthly, year-to-date or all-time analysis.',
    onboardingSettingsTip:'Personal and Business profile data stays separate.', onboardingHelpTip:'Always verify AI answers before important financial decisions.'
  });
  applyStaticTranslations();

  const tour = $('#onboardingTour');
  const spotlight = $('#onboardingSpotlight');
  const contextSpotlight = $('#onboardingContextSpotlight');
  const popover = $('#onboardingPopover');
  const appShell = $('#appShell');
  if (!tour || !spotlight || !contextSpotlight || !popover || !appShell || !window.MerOnboardingCore) return;

  let controller = null;
  let pendingSession = null;
  let currentTarget = null;
  let currentContextLink = null;
  let renderedContextLink = null;
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
  function mobileViewport() { return window.matchMedia('(max-width: 768px)').matches; }
  function reducedMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  function viewportBounds() {
    const visual = window.visualViewport;
    return visual
      ? { left:visual.offsetLeft, top:visual.offsetTop, width:visual.width, height:visual.height }
      : { left:0, top:0, width:window.innerWidth, height:window.innerHeight };
  }

  function clearContextSpotlight() {
    contextSpotlight.classList.remove('is-visible', 'is-docked');
    contextSpotlight.replaceChildren();
    contextSpotlight.removeAttribute('style');
    renderedContextLink = null;
  }

  function releaseTarget({ preserveContext = false } = {}) {
    clearTimeout(settleTimer);
    settleTimer = 0;
    resizeObserver?.disconnect();
    resizeObserver = null;
    if (currentTarget) {
      currentTarget.classList.remove('tour-target-active');
      if (previousDescription === null) currentTarget.removeAttribute('aria-describedby');
      else currentTarget.setAttribute('aria-describedby', previousDescription);
    }
    currentContextLink?.classList.remove('tour-context-active');
    if (!preserveContext) clearContextSpotlight();
    currentContextLink = null;
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

  function fitPopoverToViewport(viewport) {
    const availableHeight = Math.max(1, viewport.height - 24);
    popover.classList.toggle('is-compact', mobileViewport() || viewport.height < 720);
    popover.classList.remove('is-condensed');
    if (popover.scrollHeight > availableHeight) popover.classList.add('is-condensed');
    const rect = popover.getBoundingClientRect();
    return {
      width:Math.min(rect.width || 340, Math.max(1, viewport.width - 24)),
      height:Math.min(popover.scrollHeight || rect.height || 240, availableHeight)
    };
  }

  function spotlightLayout(targetRect, popoverSize, viewport, allowPartialTarget = false) {
    return MerOnboardingCore.computeSpotlightLayout({
      targetRect,
      popoverSize,
      viewport,
      preferredPlacement:controller?.snapshot().step.placement,
      allowPartialTarget,
      padding:8,
      gap:14,
      edge:12
    });
  }

  function scheduleGeometry() {
    cancelAnimationFrame(geometryFrame);
    geometryFrame = requestAnimationFrame(positionSpotlight);
  }

  function overlaps(first, second, gap = 0) {
    if (!first || !second) return false;
    return first.left < second.right + gap && first.right > second.left - gap && first.top < second.bottom + gap && first.bottom > second.top - gap;
  }

  function overlapArea(first, second) {
    if (!first || !second) return 0;
    return Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left))
      * Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
  }

  function contextSpotlightRect(linkRect, targetRect, popoverRect, viewport) {
    const right = viewport.left + viewport.width;
    const bottom = viewport.top + viewport.height;
    const linkIsVisible = linkRect && linkRect.width > 0 && linkRect.height > 0
      && linkRect.right > viewport.left && linkRect.left < right && linkRect.bottom > viewport.top && linkRect.top < bottom;
    const exact = linkIsVisible
      ? { left:linkRect.left - 4, top:linkRect.top - 4, width:linkRect.width + 8, height:linkRect.height + 8, right:linkRect.right + 4, bottom:linkRect.bottom + 4 }
      : null;
    if (exact && !overlaps(exact, targetRect, 8) && !overlaps(exact, popoverRect, 8)) return { ...exact, docked:false, overlapsPopover:false };

    const width = Math.min(196, Math.max(150, viewport.width - 24));
    const height = 48;
    const edge = 12;
    const candidates = [
      { left:viewport.left + edge, top:viewport.top + edge },
      { left:right - width - edge, top:viewport.top + edge },
      { left:viewport.left + edge, top:bottom - height - edge },
      { left:right - width - edge, top:bottom - height - edge },
      { left:viewport.left + edge, top:Math.max(viewport.top + edge, popoverRect.top - height - 12) },
      { left:viewport.left + edge, top:Math.min(bottom - height - edge, popoverRect.bottom + 12) }
    ].map(item => ({ ...item, width, height, right:item.left + width, bottom:item.top + height }));
    const safe = candidates.find(candidate => !overlaps(candidate, targetRect, 10) && !overlaps(candidate, popoverRect, 10));
    const selected = safe || [...candidates].sort((first, second) => overlapArea(first, popoverRect) - overlapArea(second, popoverRect) || overlapArea(first, targetRect) - overlapArea(second, targetRect))[0];
    return { left:selected.left, top:selected.top, width:selected.width, height:selected.height, docked:true, overlapsPopover:overlaps(selected, popoverRect) };
  }

  function renderContextSpotlight(targetRect, popoverRect, viewport) {
    if (!currentContextLink) {
      contextSpotlight.classList.remove('is-visible', 'is-docked');
      contextSpotlight.replaceChildren();
      contextSpotlight.removeAttribute('style');
      return;
    }
    const contextRect = contextSpotlightRect(currentContextLink.getBoundingClientRect(), targetRect, popoverRect, viewport);
    if (renderedContextLink !== currentContextLink) {
      const content = document.createElement('div');
      content.className = 'onboarding-context-spotlight-content';
      content.setAttribute('aria-hidden', 'true');
      content.innerHTML = currentContextLink.innerHTML;
      contextSpotlight.replaceChildren(content);
      renderedContextLink = currentContextLink;
    }
    contextSpotlight.classList.toggle('is-docked', contextRect.docked);
    contextSpotlight.classList.add('is-visible');
    Object.assign(contextSpotlight.style, {
      left:`${contextRect.left}px`, top:`${contextRect.top}px`, width:`${contextRect.width}px`, height:`${contextRect.height}px`
    });
  }

  function positionSpotlight() {
    geometryFrame = 0;
    if (tour.hidden || !currentTarget?.isConnected) return;
    const targetRect = currentTarget.getBoundingClientRect();
    const viewport = viewportBounds();
    let popoverSize = fitPopoverToViewport(viewport);
    let layout = spotlightLayout(targetRect, popoverSize, viewport);
    if (layout.popover.overlapsTarget && !popover.classList.contains('is-condensed')) {
      popover.classList.add('is-condensed');
      const compactRect = popover.getBoundingClientRect();
      popoverSize = { width:Math.min(compactRect.width || 340, Math.max(1, viewport.width - 24)), height:Math.min(popover.scrollHeight || compactRect.height || 200, Math.max(1, viewport.height - 24)) };
      layout = spotlightLayout(targetRect, popoverSize, viewport);
    }
    if (layout.popover.overlapsTarget) layout = spotlightLayout(targetRect, popoverSize, viewport, true);
    Object.assign(spotlight.style, {
      left:`${layout.spotlight.left}px`, top:`${layout.spotlight.top}px`, width:`${layout.spotlight.width}px`, height:`${layout.spotlight.height}px`
    });
    spotlight.dataset.partialTarget = String(Boolean(layout.spotlight.partial));
    Object.assign(popover.style, {
      left:`${layout.popover.left}px`,
      top:`${layout.popover.top}px`,
      maxWidth:`${layout.popover.width}px`
    });
    popover.dataset.placement = layout.popover.placement;
    renderContextSpotlight(
      { left:layout.spotlight.left, top:layout.spotlight.top, right:layout.spotlight.left + layout.spotlight.width, bottom:layout.spotlight.top + layout.spotlight.height },
      { left:layout.popover.left, top:layout.popover.top, right:layout.popover.left + layout.popover.width, bottom:layout.popover.top + layout.popover.height },
      viewport
    );
  }

  function previewStep(step) {
    releaseTarget({ preserveContext:true });
    tour.classList.add('is-positioning');
    if (step.view && typeof showView === 'function') showView(step.view);
    if (mobileViewport() && step.openSidebar) openSidebar();
    else if (mobileViewport()) closeSidebar();

    currentTarget = targetFor(step);
    currentContextLink = step.contextTarget ? document.querySelector(step.contextTarget) : null;
    currentContextLink?.classList.add('tour-context-active');
    previousDescription = currentTarget.getAttribute('aria-describedby');
    currentTarget.setAttribute('aria-describedby', 'onboardingBody');
    currentTarget.classList.add('tour-target-active');
    currentTarget.scrollIntoView({ behavior:reducedMotion()?'auto':'smooth', block:mobileViewport()?'start':'center', inline:'nearest' });
    resizeObserver = new ResizeObserver(scheduleGeometry);
    resizeObserver.observe(currentTarget);
    if (currentContextLink && currentContextLink !== currentTarget) resizeObserver.observe(currentContextLink);
    requestAnimationFrame(() => requestAnimationFrame(scheduleGeometry));
    settleTimer = setTimeout(() => {
      positionSpotlight();
      requestAnimationFrame(() => tour.classList.remove('is-positioning'));
    }, reducedMotion() ? 40 : (mobileViewport() ? 520 : 120));
  }

  function render(snapshot = controller?.snapshot()) {
    if (!snapshot) return;
    const step = snapshot.step;
    const stepNumber = snapshot.stepIndex + 1;
    popover.style.removeProperty('max-width');
    popover.classList.remove('is-compact', 'is-condensed');
    const localizedCopy = step.copy?.[currentLang];
    $('#onboardingTitle').textContent = localizedCopy?.title || t(step.titleKey);
    $('#onboardingBody').textContent = localizedCopy?.description || t(step.bodyKey);
    $('#onboardingTip span').textContent = t(stepKey(step, 'Tip'));
    $('#onboardingProgress').textContent = currentLang === 'hr' ? `Korak ${stepNumber} od ${controller.steps.length}` : `Step ${stepNumber} of ${controller.steps.length}`;
    $('#onboardingProgressBar').style.width = `${stepNumber / controller.steps.length * 100}%`;
    $('#onboardingPrevious').hidden = snapshot.stepIndex === 0;
    $('#onboardingNext').textContent = t(snapshot.stepIndex === controller.steps.length - 1 ? 'finishTour' : 'onboardingNext');
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
  window.MerOnboardingUi = Object.freeze({
    onSessionStarted(session) { pendingSession=session;if (!document.body.classList.contains('mfa-locked')) openTour(); },
    resume() { if (pendingSession && !document.body.classList.contains('mfa-locked')) openTour(); },
    close() { if (!tour.hidden) { if (controller?.snapshot().open) controller.dismiss();closeTourSurface({ restoreView:false, focus:false }); } },
    restart(returnTarget = null) { return openTour({ force:true, returnTarget }); }
  });
})();
