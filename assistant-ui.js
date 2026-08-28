(function initializeHelpAssistant() {
  Object.assign(translations.hr, {
    helpCenter:'CENTAR ZA POMOĆ', helpAssistant:'Pomoć & AI Asistent', helpAssistantIntro:'Odaberite modul i pronađite odgovor bez napuštanja ovog prozora.', guideFaq:'Vodič & FAQ', aiAssistant:'AI ASISTENT', assistantWidgetTitle:'Vaš financijski suputnik', openAiAssistant:'Otvori AI financijskog asistenta', closeAiAssistant:'Zatvori AI asistenta', faqModuleFilters:'Odaberite modul za pomoć', helpModeTabs:'Način pomoći', helpModeFaq:'Pitanja po modulu', helpModeAi:'Pitaj AI', restartTourFromHelp:'Pokreni vodič ponovno', restartTourFromHelpHint:'Ponovno istaknite ključne kontrole korak po korak.',
    helpOverviewHint:'Stanje i dnevni tempo', helpBudgetsHint:'Limiti i mjesečni plan', helpSavingsHint:'Ciljevi i zaokruživanja', helpActivityHint:'Transakcije i filtri', helpInsightsHint:'Trendovi i izvještaji',
    faqSafeQuestion:'Što je Zaštita budžeta?', faqPaceQuestion:'Kako se računa Dnevni tempo?', faqSafeAnswer:'Sigurno za potrošiti je mjesečni prihod umanjen za evidentirane mjesečne troškove. Dodatni prihod odmah povećava taj iznos.', faqPaceAnswer:'Preostali sigurni iznos dijeli se s brojem preostalih dana u tekućem mjesecu.',
    faqBudgetLimitQuestion:'Kako postaviti limit kategorije?', faqBudgetLimitAnswer:'U Budžetima otvorite kategoriju, unesite mjesečni limit i spremite. Sve povezane kartice odmah se preračunavaju.', faqBudgetWarningQuestion:'Blokira li prekoračenje unos troška?', faqBudgetWarningAnswer:'Ne. Žuto i crveno upozorenje signaliziraju 80% i 100%, ali stvarni trošak uvijek možete evidentirati.',
    faqGoalQuestion:'Kako dodati cilj i uplatu?', faqGoalAnswer:'U Štednji izradite namjenski cilj, zatim gumbom Nova uplata odaberite cilj i iznos.', faqRoundupQuestion:'Kako rade zaokruživanja?', faqRoundupAnswer:'Uključite zaokruživanje na željenom cilju. Razlika do sljedećeg cijelog iznosa usmjerava se u taj cilj.',
    faqWhereTransactions:'Gdje dodajem i uređujem transakcije?', faqTransactionsAnswer:'Dodajte ih gumbom Dodaj transakciju, a uredite izravno u modulu Aktivnost.', faqActivityFiltersQuestion:'Kako pronaći određenu transakciju?', faqActivityFiltersAnswer:'Kombinirajte pretragu, raspon datuma, kategoriju, vrstu i sortiranje iznosa iznad popisa.',
    faqTimeframeQuestion:'Kako promijeniti razdoblje izvještaja?', faqTimeframeAnswer:'U Uvidima odaberite Danas, Ovaj mjesec, Ova godina ili Sve vrijeme; grafovi se osvježavaju zajedno.', faqSavingsRateQuestion:'Što pokazuje stopa štednje?', faqSavingsRateAnswer:'Pokazuje udio prihoda koji ostaje nakon troškova u odabranom razdoblju.',
    faqBalancePrivacyQuestion:'Kako privremeno sakriti iznose?', faqBalancePrivacyAnswer:'U Korisničkim postavkama uključite Sakrij stanje. Iznosi se maskiraju na Pregledu bez brisanja podataka.', faqCategoryManageQuestion:'Kako upravljati većim brojem kategorija?', faqCategoryManageAnswer:'U Budžetima odaberite Prikaži sve. U proširenom prikazu možete pretraživati, dodavati i uređivati limite.', faqEmergencyFundQuestion:'Kako procijeniti cilj fonda za hitne slučajeve?', faqEmergencyFundAnswer:'Kao početnu smjernicu odaberite nekoliko mjeseci osnovnih troškova, a zatim cilj prilagodite stabilnosti prihoda i obvezama.', faqImportedSourceQuestion:'Kako prepoznati ručni i bankovni unos?', faqImportedSourceAnswer:'Svaka stavka u Aktivnosti ima oznaku izvora, primjerice Ručno ili Auto: naziv banke, te se i dalje može urediti i kategorizirati.', faqNetTotalQuestion:'Što znači Neto ukupno?', faqNetTotalAnswer:'Neto ukupno je prihod umanjen za troškove u odabranom razdoblju. Promjena filtra odmah osvježava pokazatelje i grafikone.',
    suggestedQuestions:'Predložena pitanja', promptSafe:'Kako se računa Zaštita budžeta?', promptSavings:'Kako mogu povećati stopu štednje?', promptLimit:'Kako postaviti mjesečni limit?', askAssistant:'Pitajte AI asistenta', assistantPlaceholder:'Upišite pitanje...', send:'Pošalji', assistantWidgetDisclaimer:'AI odgovor je informativan i ne zamjenjuje profesionalni financijski savjet.', assistantDisclaimer:'AI odgovor je informativan i ne zamjenjuje profesionalni financijski savjet. Šalju se samo zbirni iznosi aktivnog profila.', assistantWelcome:'Pozdrav! Mogu objasniti MER pokazatelje, pomoći pronaći funkciju i dati smjernice na temelju zbirnih iznosa aktivnog profila.', assistantThinking:'Provjeravam vaš upit…', assistantLocal:'Lokalni vodič', assistantRemote:'AI odgovor', assistantError:'Odgovor trenutačno nije dostupan. Pokušajte ponovno.'
  });
  Object.assign(translations.en, {
    helpCenter:'HELP CENTRE', helpAssistant:'Help & AI Assistant', helpAssistantIntro:'Choose a module and find an answer without leaving this window.', guideFaq:'Guide & FAQ', aiAssistant:'AI ASSISTANT', assistantWidgetTitle:'Your financial companion', openAiAssistant:'Open AI financial assistant', closeAiAssistant:'Close AI assistant', faqModuleFilters:'Choose a help module', helpModeTabs:'Help mode', helpModeFaq:'Module questions', helpModeAi:'Ask AI', restartTourFromHelp:'Restart guided tour', restartTourFromHelpHint:'Highlight the key controls again, step by step.',
    helpOverviewHint:'Balance and daily pace', helpBudgetsHint:'Limits and monthly plan', helpSavingsHint:'Goals and round-ups', helpActivityHint:'Transactions and filters', helpInsightsHint:'Trends and reports',
    faqSafeQuestion:'What is Budget Protection?', faqPaceQuestion:'How is Daily Pace calculated?', faqSafeAnswer:'Safe to spend is monthly income minus recorded monthly expenses. New income increases it immediately.', faqPaceAnswer:'The remaining safe amount is divided by the number of days left in the current month.',
    faqBudgetLimitQuestion:'How do I set a category limit?', faqBudgetLimitAnswer:'Open a category in Budgets, enter its monthly limit and save. Every connected card recalculates immediately.', faqBudgetWarningQuestion:'Does overspending block an expense?', faqBudgetWarningAnswer:'No. Yellow and red warnings mark 80% and 100%, but you can always record the real expense.',
    faqGoalQuestion:'How do I add a goal and deposit?', faqGoalAnswer:'Create a goal in Savings, then use New deposit to choose the goal and amount.', faqRoundupQuestion:'How do round-ups work?', faqRoundupAnswer:'Enable round-ups on one goal. The difference to the next whole amount is routed to that goal.',
    faqWhereTransactions:'Where do I add and edit transactions?', faqTransactionsAnswer:'Add them with Add transaction and edit them directly in Activity.', faqActivityFiltersQuestion:'How do I find a specific transaction?', faqActivityFiltersAnswer:'Combine search, date range, category, type and amount sorting above the list.',
    faqTimeframeQuestion:'How do I change the report timeframe?', faqTimeframeAnswer:'In Insights choose Today, This month, This year or All time; every chart updates together.', faqSavingsRateQuestion:'What does savings rate show?', faqSavingsRateAnswer:'It is the share of income left after expenses in the selected timeframe.',
    faqBalancePrivacyQuestion:'How do I temporarily hide amounts?', faqBalancePrivacyAnswer:'Enable Hide balances in User settings. Amounts are masked on Overview without deleting any data.', faqCategoryManageQuestion:'How do I manage many categories?', faqCategoryManageAnswer:'Choose Show all in Budgets. The expanded view lets you search, add and edit category limits.', faqEmergencyFundQuestion:'How should I estimate an emergency-fund target?', faqEmergencyFundAnswer:'A useful starting point is several months of essential expenses, adjusted for income stability and financial obligations.', faqImportedSourceQuestion:'How do I distinguish manual and bank entries?', faqImportedSourceAnswer:'Each Activity item shows its source, such as Manual or Auto: bank name, and can still be edited or recategorized.', faqNetTotalQuestion:'What does Net Total mean?', faqNetTotalAnswer:'Net Total is income minus expenses for the selected period. Changing the filter refreshes every metric and chart immediately.',
    suggestedQuestions:'Suggested questions', promptSafe:'How is Safe to Spend calculated?', promptSavings:'How can I improve my savings rate?', promptLimit:'How do I set a monthly limit?', askAssistant:'Ask the AI assistant', assistantPlaceholder:'Type a question...', send:'Send', assistantWidgetDisclaimer:'AI responses are informational and do not replace professional financial advice.', assistantDisclaimer:'AI responses are informational and do not replace professional financial advice. Only active-profile aggregate amounts are sent.', assistantWelcome:'Hello! I can explain MER metrics, help you find a feature, and provide guidance using aggregate totals from the active profile.', assistantThinking:'Reviewing your question…', assistantLocal:'Local guide', assistantRemote:'AI response', assistantError:'A response is not available right now. Please try again.'
  });
  applyStaticTranslations();

  const modal = $('#helpAssistantModal');
  const assistantFab = $('#assistantFab');
  const assistantWidget = $('#assistantWidget');
  const assistantWidgetClose = $('#assistantWidgetClose');
  const widgetForm = $('#assistantForm');
  const helpBody = modal?.querySelector('.help-assistant-body');
  const helpFaqPanel = $('#helpFaqPanel');
  if (!modal || !assistantFab || !assistantWidget || !assistantWidgetClose || !widgetForm || !helpBody || !helpFaqPanel || !window.MerFinancialAssistant) return;

  function svgIcon(symbol) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    svg.setAttribute('aria-hidden', 'true');
    use.setAttribute('href', `#icon-${symbol}`);
    svg.append(use);
    return svg;
  }

  function createHelpExtensions() {
    const toolbar = document.createElement('div');
    toolbar.className = 'help-modal-toolbar';

    const modes = document.createElement('div');
    modes.className = 'help-mode-tabs';
    modes.setAttribute('role', 'tablist');
    modes.setAttribute('aria-label', t('helpModeTabs'));
    modes.dataset.i18nAria = 'helpModeTabs';

    const faqMode = document.createElement('button');
    faqMode.type = 'button';
    faqMode.id = 'helpFaqMode';
    faqMode.className = 'active';
    faqMode.setAttribute('role', 'tab');
    faqMode.setAttribute('aria-selected', 'true');
    faqMode.setAttribute('aria-controls', 'helpFaqPanel');
    faqMode.dataset.helpMode = 'faq';
    faqMode.dataset.i18n = 'helpModeFaq';
    faqMode.textContent = t('helpModeFaq');

    const aiMode = document.createElement('button');
    aiMode.type = 'button';
    aiMode.id = 'helpAiMode';
    aiMode.setAttribute('role', 'tab');
    aiMode.setAttribute('aria-selected', 'false');
    aiMode.setAttribute('aria-controls', 'helpModalAiPanel');
    aiMode.dataset.helpMode = 'assistant';
    aiMode.dataset.i18n = 'helpModeAi';
    aiMode.textContent = t('helpModeAi');
    modes.append(faqMode, aiMode);

    const restart = document.createElement('button');
    restart.type = 'button';
    restart.id = 'helpRestartOnboarding';
    restart.className = 'secondary-button compact-button help-tour-restart';
    restart.setAttribute('aria-controls', 'onboardingTour');
    restart.setAttribute('aria-label', t('restartTourFromHelpHint'));
    restart.dataset.i18nAria = 'restartTourFromHelpHint';
    restart.append(svgIcon('compass'));
    const restartText = document.createElement('span');
    restartText.dataset.i18n = 'restartTourFromHelp';
    restartText.textContent = t('restartTourFromHelp');
    restart.append(restartText);
    toolbar.append(modes, restart);
    helpBody.before(toolbar);

    helpFaqPanel.setAttribute('role', 'tabpanel');
    helpFaqPanel.setAttribute('aria-labelledby', 'helpFaqMode');

    const aiPanel = document.createElement('section');
    aiPanel.className = 'help-panel assistant-panel help-modal-assistant-panel';
    aiPanel.id = 'helpModalAiPanel';
    aiPanel.setAttribute('role', 'tabpanel');
    aiPanel.setAttribute('aria-labelledby', 'helpAiMode');
    aiPanel.hidden = true;

    const messages = document.createElement('ol');
    messages.className = 'assistant-messages';
    messages.id = 'helpAssistantMessages';
    messages.setAttribute('role', 'log');
    messages.setAttribute('aria-live', 'polite');
    messages.setAttribute('aria-relevant', 'additions');

    const suggestions = document.createElement('div');
    suggestions.className = 'assistant-suggestions';
    suggestions.setAttribute('aria-label', t('suggestedQuestions'));
    suggestions.dataset.i18nAria = 'suggestedQuestions';
    [
      ['promptSafe', 'Kako se računa Zaštita budžeta?', 'How is Safe to Spend calculated?'],
      ['promptSavings', 'Kako mogu povećati stopu štednje?', 'How can I improve my savings rate?'],
      ['promptLimit', 'Kako postaviti mjesečni limit?', 'How do I set a monthly limit?']
    ].forEach(([key, prompt, promptEn]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'assistant-suggestion';
      button.dataset.aiPrompt = prompt;
      button.dataset.aiPromptEn = promptEn;
      button.dataset.i18n = key;
      button.textContent = t(key);
      suggestions.append(button);
    });

    const form = document.createElement('form');
    form.className = 'assistant-composer';
    form.id = 'helpAssistantForm';
    const label = document.createElement('label');
    label.className = 'sr-only';
    label.htmlFor = 'helpAssistantInput';
    label.dataset.i18n = 'askAssistant';
    label.textContent = t('askAssistant');
    const input = document.createElement('textarea');
    input.id = 'helpAssistantInput';
    input.rows = 1;
    input.maxLength = 1000;
    input.required = true;
    input.setAttribute('aria-label', t('askAssistant'));
    input.dataset.i18nAria = 'askAssistant';
    input.placeholder = t('assistantPlaceholder');
    input.dataset.i18nPlaceholder = 'assistantPlaceholder';
    const send = document.createElement('button');
    send.type = 'submit';
    send.className = 'primary-button';
    send.id = 'helpAssistantSend';
    const sendText = document.createElement('span');
    sendText.dataset.i18n = 'send';
    sendText.textContent = t('send');
    send.append(sendText, svgIcon('up'));
    form.append(label, input, send);

    const status = document.createElement('p');
    status.className = 'assistant-status';
    status.id = 'helpAssistantStatus';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const disclaimer = document.createElement('p');
    disclaimer.className = 'assistant-disclaimer';
    disclaimer.dataset.i18n = 'assistantDisclaimer';
    disclaimer.textContent = t('assistantDisclaimer');
    aiPanel.append(messages, suggestions, form, status, disclaimer);
    helpBody.append(aiPanel);

    const extraFaqs = [
      ['overview', 'faqBalancePrivacyQuestion', 'faqBalancePrivacyAnswer'],
      ['budgets', 'faqCategoryManageQuestion', 'faqCategoryManageAnswer'],
      ['savings', 'faqEmergencyFundQuestion', 'faqEmergencyFundAnswer'],
      ['activity', 'faqImportedSourceQuestion', 'faqImportedSourceAnswer'],
      ['insights', 'faqNetTotalQuestion', 'faqNetTotalAnswer']
    ];
    const faqList = helpFaqPanel.querySelector('.faq-list');
    extraFaqs.forEach(([moduleName, questionKey, answerKey]) => {
      const details = document.createElement('details');
      details.dataset.faqModule = moduleName;
      details.hidden = moduleName !== 'overview';
      const summary = document.createElement('summary');
      const question = document.createElement('span');
      question.dataset.i18n = questionKey;
      question.textContent = t(questionKey);
      summary.append(question, svgIcon('chevron'));
      const answer = document.createElement('p');
      answer.dataset.i18n = answerKey;
      answer.textContent = t(answerKey);
      details.append(summary, answer);
      faqList?.append(details);
    });

    return { toolbar, faqMode, aiMode, restart, aiPanel, messages, suggestions, form, input, send, status };
  }

  const helpUi = createHelpExtensions();
  applyStaticTranslations();
  const histories = new Map();
  let activeRequest = null;
  let restoreFocus = null;
  const assistantSurfaces = [
    { root:assistantWidget, messages:$('#assistantMessages'), form:widgetForm, input:$('#assistantInput'), send:$('#assistantSend'), status:$('#assistantStatus') },
    { root:helpUi.aiPanel, messages:helpUi.messages, form:helpUi.form, input:helpUi.input, send:helpUi.send, status:helpUi.status }
  ];

  function assistantSessionKey() {
    const session = window.MerAuthProvider?.currentSession?.();
    return String(session?.userId || session?.email || (session?.demo ? 'demo-user' : 'anonymous'))
      .trim()
      .toLocaleLowerCase('en');
  }

  function profileHistory(profileId) {
    const key = `${assistantSessionKey()}::${profileId}`;
    if (!histories.has(key)) histories.set(key, [{ id:`welcome-${profileId}`, role:'assistant', content:t('assistantWelcome'), source:'local' }]);
    return histories.get(key);
  }

  function financialContextFor(profileId) {
    const snapshot = reactiveStore.snapshot(profileId, 'monthly');
    const profile = snapshot?.profile;
    const totals = snapshot?.totals || { income:0, expenses:0, net:0 };
    const plan = snapshot?.budget || {};
    const topEntry = Object.entries(snapshot?.derived?.categorySpending || {}).sort((a,b) => b[1] - a[1])[0];
    const topCategory = profile?.categories?.find(category => category.id === topEntry?.[0]);
    return {
      currency:appState.settings.currency || 'EUR',
      totalIncome:totals.income,
      totalExpenses:totals.expenses,
      netTotal:totals.net,
      safeToSpend:plan.safeRemaining,
      dailySafe:plan.safeDaily,
      savingsBalance:profile?.savingsBalance,
      savingsTarget:profile?.savingsTarget,
      daysRemaining:plan.days,
      topCategory:topCategory?.name || topEntry?.[0] || '',
      topCategorySpent:topEntry?.[1] || 0
    };
  }

  function renderMessages() {
    assistantSurfaces.forEach(surface => {
      const list = surface.messages;
      list.replaceChildren();
      profileHistory(appState.activeAccount).forEach(message => {
        const item = document.createElement('li');
        item.className = `assistant-message ${message.role}`;
        const content = document.createElement('span');
        content.textContent = message.content;
        item.append(content);
        if (message.role === 'assistant') {
          const source = document.createElement('small');
          source.textContent = t(message.source === 'remote' ? 'assistantRemote' : 'assistantLocal');
          item.append(source);
        }
        list.append(item);
      });
      requestAnimationFrame(() => { list.scrollTop=list.scrollHeight; });
    });
  }

  function setAssistantBusy(busy, statusKey = '') {
    assistantSurfaces.forEach(surface => {
      surface.send.disabled = busy;
      surface.status.textContent = statusKey ? t(statusKey) : '';
    });
  }

  function selectFaqModule(moduleName = 'overview') {
    const selected = ['overview','budgets','savings','activity','insights'].includes(moduleName) ? moduleName : 'overview';
    $$('[data-faq-filter]').forEach(button => {
      const active = button.dataset.faqFilter === selected;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    $$('[data-faq-module]').forEach(entry => {
      const modules = String(entry.dataset.faqModule || '').split(/\s+/);
      entry.hidden = !modules.includes(selected);
      if (entry.hidden) entry.open = false;
    });
  }

  function selectHelpMode(mode = 'faq', { focus = false } = {}) {
    const selected = mode === 'assistant' ? 'assistant' : 'faq';
    $$('[data-help-mode]').forEach(button => {
      const active = button.dataset.helpMode === selected;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    helpFaqPanel.hidden = selected !== 'faq';
    helpUi.aiPanel.hidden = selected !== 'assistant';
    helpBody.classList.toggle('assistant-mode', selected === 'assistant');
    if (selected === 'assistant') {
      renderMessages();
      if (focus) setTimeout(() => helpUi.input.focus({ preventScroll:true }), 30);
    }
  }

  function bindRovingTabs(selector, select) {
    const buttons = $$(selector);
    buttons.forEach(button => button.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const current = buttons.indexOf(button);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus({ preventScroll:true });
      select(buttons[next]);
    }));
  }

  function openAssistant() {
    if (modal.open) modal.querySelector('[data-close-modal]')?.click();
    restoreFocus = document.activeElement;
    assistantWidget.hidden = false;
    assistantFab.setAttribute('aria-expanded', String(true));
    renderMessages();
    setTimeout(() => $('#assistantInput').focus({ preventScroll:true }), 30);
  }

  function closeAssistant({ focus = true } = {}) {
    activeRequest?.abort();
    activeRequest = null;
    setAssistantBusy(false);
    assistantWidget.hidden = true;
    assistantFab.setAttribute('aria-expanded', String(false));
    if (focus) {
      const target = restoreFocus?.isConnected ? restoreFocus : assistantFab;
      target.focus({ preventScroll:true });
    }
    restoreFocus = null;
  }

  async function submitAssistantMessage(rawMessage) {
    const message = String(rawMessage || '').trim().slice(0, MerFinancialAssistant.MAX_MESSAGE_LENGTH || 1000);
    if (!message) return;
    const requestProfileId = appState.activeAccount;
    const history = profileHistory(requestProfileId);
    history.push({ id:`user-${Date.now()}`, role:'user', content:message, source:'local' });
    renderMessages();
    assistantSurfaces.forEach(surface => { surface.input.value = ''; });
    setAssistantBusy(true, 'assistantThinking');
    activeRequest?.abort();
    const requestController = new AbortController();
    requestController.profileId = requestProfileId;
    activeRequest = requestController;
    try {
      const messages = history.map(({ role, content }) => ({ role, content }));
      const locale = currentLang;
      const profileId = requestProfileId;
      const financialContext = financialContextFor(requestProfileId);
      const signal = requestController.signal;
      const response = await MerFinancialAssistant.ask({messages,locale,profileId,financialContext,signal});
      if (signal.aborted || appState.activeAccount !== requestProfileId) return;
      history.push(response);
      if (history.length > 24) history.splice(1, history.length - 24);
      renderMessages();
      setAssistantBusy(false);
    } catch (error) {
      if (!requestController.signal.aborted && appState.activeAccount === requestProfileId) setAssistantBusy(false, 'assistantError');
    } finally {
      if (activeRequest === requestController) {
        activeRequest = null;
        if (appState.activeAccount === requestProfileId) setAssistantBusy(false);
      }
    }
  }

  function resetAssistantSession() {
    activeRequest?.abort();
    activeRequest = null;
    histories.clear();
    setAssistantBusy(false);
    closeAssistant({ focus:false });
    if (modal.open) closeModal(modal);
    selectHelpMode('faq');
  }

  $('#openHelpAssistant').addEventListener('click', () => {
    if (!assistantWidget.hidden) closeAssistant({ focus:false });
    selectHelpMode('faq');
    selectFaqModule('overview');
    openModal(modal);
  });
  $$('[data-faq-filter]').forEach(button => button.addEventListener('click', () => selectFaqModule(button.dataset.faqFilter)));
  $$('[data-help-mode]').forEach(button => button.addEventListener('click', () => selectHelpMode(button.dataset.helpMode, { focus:true })));
  bindRovingTabs('[data-faq-filter]', button => selectFaqModule(button.dataset.faqFilter));
  bindRovingTabs('[data-help-mode]', button => selectHelpMode(button.dataset.helpMode));
  $$('[data-help-settings]').forEach(button => button.addEventListener('click', () => { const tab=button.dataset.helpSettings;closeModal(modal);setTimeout(() => window.MerSettings?.open(tab), 30); }));
  $$('[data-ai-prompt]').forEach(button => button.addEventListener('click', () => submitAssistantMessage(currentLang==='en'?button.dataset.aiPromptEn:button.dataset.aiPrompt)));
  assistantSurfaces.forEach(surface => {
    surface.form.addEventListener('submit', event => { event.preventDefault();submitAssistantMessage(surface.input.value); });
    surface.input.addEventListener('keydown', event => { if (event.key==='Enter'&&!event.shiftKey){event.preventDefault();surface.form.requestSubmit();} });
  });
  helpUi.restart.addEventListener('click', () => {
    closeModal(modal);
    setTimeout(() => window.MerOnboardingUi?.restart?.($('#openHelpAssistant')), 30);
  });
  assistantFab.addEventListener('click', () => { if (assistantWidget.hidden) openAssistant();else closeAssistant(); });
  assistantWidgetClose.addEventListener('click', () => closeAssistant());
  document.addEventListener('click', event => {
    if (!assistantWidget.hidden && !assistantWidget.contains(event.target) && !assistantFab.contains(event.target)) closeAssistant({ focus:false });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !assistantWidget.hidden) { event.preventDefault();closeAssistant(); }
  });
  modal.addEventListener('close', () => {
    activeRequest?.abort();
    activeRequest = null;
    setAssistantBusy(false);
    selectHelpMode('faq');
  });
  reactiveStore.subscribe(event => {
    if (activeRequest && event.activeAccount !== activeRequest.profileId) {
      const request = activeRequest;
      activeRequest = null;
      request.abort();
      setAssistantBusy(false);
    }
    if (!assistantWidget.hidden || (modal.open && !helpUi.aiPanel.hidden)) renderMessages();
  });

  window.MerAssistantUi = Object.freeze({ open:openAssistant, close:() => closeAssistant({ focus:false }), render:renderMessages, resetSession:resetAssistantSession });
})();
