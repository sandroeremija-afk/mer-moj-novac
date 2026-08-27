(function initializeHelpAssistant() {
  Object.assign(translations.hr, {
    helpCenter:'CENTAR ZA POMOĆ', helpAssistant:'Pomoć & AI Asistent', helpAssistantIntro:'Odaberite modul i pronađite odgovor bez napuštanja ovog prozora.', guideFaq:'Vodič & FAQ', aiAssistant:'AI ASISTENT', assistantWidgetTitle:'Vaš financijski suputnik', openAiAssistant:'Otvori AI financijskog asistenta', closeAiAssistant:'Zatvori AI asistenta', faqModuleFilters:'Odaberite modul za pomoć',
    helpOverviewHint:'Stanje i dnevni tempo', helpBudgetsHint:'Limiti i mjesečni plan', helpSavingsHint:'Ciljevi i zaokruživanja', helpActivityHint:'Transakcije i filtri', helpInsightsHint:'Trendovi i izvještaji',
    faqSafeQuestion:'Što je Zaštita budžeta?', faqPaceQuestion:'Kako se računa Dnevni tempo?', faqSafeAnswer:'Sigurno za potrošiti je mjesečni prihod umanjen za evidentirane mjesečne troškove. Dodatni prihod odmah povećava taj iznos.', faqPaceAnswer:'Preostali sigurni iznos dijeli se s brojem preostalih dana u tekućem mjesecu.',
    faqBudgetLimitQuestion:'Kako postaviti limit kategorije?', faqBudgetLimitAnswer:'U Budžetima otvorite kategoriju, unesite mjesečni limit i spremite. Sve povezane kartice odmah se preračunavaju.', faqBudgetWarningQuestion:'Blokira li prekoračenje unos troška?', faqBudgetWarningAnswer:'Ne. Žuto i crveno upozorenje signaliziraju 80% i 100%, ali stvarni trošak uvijek možete evidentirati.',
    faqGoalQuestion:'Kako dodati cilj i uplatu?', faqGoalAnswer:'U Štednji izradite namjenski cilj, zatim gumbom Nova uplata odaberite cilj i iznos.', faqRoundupQuestion:'Kako rade zaokruživanja?', faqRoundupAnswer:'Uključite zaokruživanje na željenom cilju. Razlika do sljedećeg cijelog iznosa usmjerava se u taj cilj.',
    faqWhereTransactions:'Gdje dodajem i uređujem transakcije?', faqTransactionsAnswer:'Dodajte ih gumbom Dodaj transakciju, a uredite izravno u modulu Aktivnost.', faqActivityFiltersQuestion:'Kako pronaći određenu transakciju?', faqActivityFiltersAnswer:'Kombinirajte pretragu, raspon datuma, kategoriju, vrstu i sortiranje iznosa iznad popisa.',
    faqTimeframeQuestion:'Kako promijeniti razdoblje izvještaja?', faqTimeframeAnswer:'U Uvidima odaberite Danas, Ovaj mjesec, Ova godina ili Sve vrijeme; grafovi se osvježavaju zajedno.', faqSavingsRateQuestion:'Što pokazuje stopa štednje?', faqSavingsRateAnswer:'Pokazuje udio prihoda koji ostaje nakon troškova u odabranom razdoblju.',
    suggestedQuestions:'Predložena pitanja', promptSafe:'Kako se računa Zaštita budžeta?', promptSavings:'Kako mogu povećati stopu štednje?', promptLimit:'Kako postaviti mjesečni limit?', askAssistant:'Pitajte AI asistenta', assistantPlaceholder:'Upišite pitanje...', send:'Pošalji', assistantDisclaimer:'AI odgovor je informativan i ne zamjenjuje profesionalni financijski savjet. Šalju se samo zbirni iznosi aktivnog profila.', assistantWelcome:'Pozdrav! Mogu objasniti MER pokazatelje, pomoći pronaći funkciju i dati smjernice na temelju zbirnih iznosa aktivnog profila.', assistantThinking:'Provjeravam vaš upit…', assistantLocal:'Lokalni vodič', assistantRemote:'AI odgovor', assistantError:'Odgovor trenutačno nije dostupan. Pokušajte ponovno.'
  });
  Object.assign(translations.en, {
    helpCenter:'HELP CENTRE', helpAssistant:'Help & AI Assistant', helpAssistantIntro:'Choose a module and find an answer without leaving this window.', guideFaq:'Guide & FAQ', aiAssistant:'AI ASSISTANT', assistantWidgetTitle:'Your financial companion', openAiAssistant:'Open AI financial assistant', closeAiAssistant:'Close AI assistant', faqModuleFilters:'Choose a help module',
    helpOverviewHint:'Balance and daily pace', helpBudgetsHint:'Limits and monthly plan', helpSavingsHint:'Goals and round-ups', helpActivityHint:'Transactions and filters', helpInsightsHint:'Trends and reports',
    faqSafeQuestion:'What is Budget Protection?', faqPaceQuestion:'How is Daily Pace calculated?', faqSafeAnswer:'Safe to spend is monthly income minus recorded monthly expenses. New income increases it immediately.', faqPaceAnswer:'The remaining safe amount is divided by the number of days left in the current month.',
    faqBudgetLimitQuestion:'How do I set a category limit?', faqBudgetLimitAnswer:'Open a category in Budgets, enter its monthly limit and save. Every connected card recalculates immediately.', faqBudgetWarningQuestion:'Does overspending block an expense?', faqBudgetWarningAnswer:'No. Yellow and red warnings mark 80% and 100%, but you can always record the real expense.',
    faqGoalQuestion:'How do I add a goal and deposit?', faqGoalAnswer:'Create a goal in Savings, then use New deposit to choose the goal and amount.', faqRoundupQuestion:'How do round-ups work?', faqRoundupAnswer:'Enable round-ups on one goal. The difference to the next whole amount is routed to that goal.',
    faqWhereTransactions:'Where do I add and edit transactions?', faqTransactionsAnswer:'Add them with Add transaction and edit them directly in Activity.', faqActivityFiltersQuestion:'How do I find a specific transaction?', faqActivityFiltersAnswer:'Combine search, date range, category, type and amount sorting above the list.',
    faqTimeframeQuestion:'How do I change the report timeframe?', faqTimeframeAnswer:'In Insights choose Today, This month, This year or All time; every chart updates together.', faqSavingsRateQuestion:'What does savings rate show?', faqSavingsRateAnswer:'It is the share of income left after expenses in the selected timeframe.',
    suggestedQuestions:'Suggested questions', promptSafe:'How is Safe to Spend calculated?', promptSavings:'How can I improve my savings rate?', promptLimit:'How do I set a monthly limit?', askAssistant:'Ask the AI assistant', assistantPlaceholder:'Type a question...', send:'Send', assistantDisclaimer:'AI responses are informational and do not replace professional financial advice. Only active-profile aggregate amounts are sent.', assistantWelcome:'Hello! I can explain MER metrics, help you find a feature, and provide guidance using aggregate totals from the active profile.', assistantThinking:'Reviewing your question…', assistantLocal:'Local guide', assistantRemote:'AI response', assistantError:'A response is not available right now. Please try again.'
  });
  applyStaticTranslations();

  const modal = $('#helpAssistantModal');
  const assistantFab = $('#assistantFab');
  const assistantWidget = $('#assistantWidget');
  const assistantWidgetClose = $('#assistantWidgetClose');
  const assistantForm = $('#assistantForm');
  if (!modal || !assistantFab || !assistantWidget || !assistantWidgetClose || !assistantForm || !window.MerFinancialAssistant) return;
  const histories = new Map();
  let activeRequest = null;
  let restoreFocus = null;

  function profileHistory(profileId) {
    if (!histories.has(profileId)) histories.set(profileId, [{ id:`welcome-${profileId}`, role:'assistant', content:t('assistantWelcome'), source:'local' }]);
    return histories.get(profileId);
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
    const list = $('#assistantMessages');
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
      entry.hidden = entry.dataset.faqModule !== selected;
      if (entry.hidden) entry.open = false;
    });
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
    $('#assistantStatus').textContent = '';
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
    $('#assistantInput').value = '';
    $('#assistantStatus').textContent = t('assistantThinking');
    $('#assistantSend').disabled = true;
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
      $('#assistantStatus').textContent = '';
    } catch (error) {
      if (!requestController.signal.aborted && appState.activeAccount === requestProfileId) $('#assistantStatus').textContent = t('assistantError');
    } finally {
      if (activeRequest === requestController) activeRequest = null;
      if (appState.activeAccount === requestProfileId) $('#assistantSend').disabled = false;
    }
  }

  $('#openHelpAssistant').addEventListener('click', () => {
    if (!assistantWidget.hidden) closeAssistant({ focus:false });
    selectFaqModule('overview');
    openModal(modal);
  });
  $$('[data-faq-filter]').forEach(button => button.addEventListener('click', () => selectFaqModule(button.dataset.faqFilter)));
  $$('[data-help-settings]').forEach(button => button.addEventListener('click', () => { const tab=button.dataset.helpSettings;closeModal(modal);setTimeout(() => window.MerSettings?.open(tab), 30); }));
  $$('[data-ai-prompt]').forEach(button => button.addEventListener('click', () => submitAssistantMessage(currentLang==='en'?button.dataset.aiPromptEn:button.dataset.aiPrompt)));
  assistantForm.addEventListener('submit', event => { event.preventDefault();submitAssistantMessage($('#assistantInput').value); });
  $('#assistantInput').addEventListener('keydown', event => { if (event.key==='Enter'&&!event.shiftKey){event.preventDefault();assistantForm.requestSubmit();} });
  assistantFab.addEventListener('click', () => { if (assistantWidget.hidden) openAssistant();else closeAssistant(); });
  assistantWidgetClose.addEventListener('click', () => closeAssistant());
  document.addEventListener('click', event => {
    if (!assistantWidget.hidden && !assistantWidget.contains(event.target) && !assistantFab.contains(event.target)) closeAssistant({ focus:false });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !assistantWidget.hidden) { event.preventDefault();closeAssistant(); }
  });
  reactiveStore.subscribe(event => {
    if (activeRequest && event.activeAccount !== activeRequest.profileId) activeRequest.abort();
    if (!assistantWidget.hidden) renderMessages();
  });

  window.MerAssistantUi = Object.freeze({ open:openAssistant, close:() => closeAssistant({ focus:false }), render:renderMessages });
})();
