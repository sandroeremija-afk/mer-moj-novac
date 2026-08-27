(function initializeHelpAssistant() {
  Object.assign(translations.hr, {
    helpCenter:'CENTAR ZA POMOĆ', helpAssistant:'Pomoć & AI Asistent', helpAssistantIntro:'Brzo pronađite funkciju ili postavite pitanje o svojim financijama.', helpTabs:'Pomoć i AI', guideFaq:'Vodič & FAQ', aiAssistant:'AI Asistent',
    helpBudgetsHint:'Limiti i mjesečni plan', helpSavingsHint:'Ciljevi i zaokruživanja', helpActivityHint:'Sve transakcije i filtri', helpInsightsHint:'Trendovi i izvještaji',
    faqSafeQuestion:'Što je Zaštita budžeta?', faqPaceQuestion:'Kako se računa Dnevni tempo?', faqSafeAnswer:'Sigurno za potrošiti je mjesečni prihod umanjen za evidentirane mjesečne troškove. Dodatni prihod odmah povećava taj iznos.', faqPaceAnswer:'Preostali sigurni iznos dijeli se s brojem preostalih dana u tekućem mjesecu.', faqWhereTransactions:'Gdje dodajem i uređujem transakcije?', faqTransactionsAnswer:'Dodajte ih gumbom u bočnoj navigaciji, a uredite izravno u modulu Aktivnost.', faqBanksRules:'Gdje povezujem banku i postavljam pravila?', faqBanksRulesAnswer:'U Korisničkim postavkama otvorite Banke za veze ili Pravila za automatsku kategorizaciju.', openBanks:'Otvori Banke', openRules:'Otvori Pravila',
    suggestedQuestions:'Predložena pitanja', promptSafe:'Kako se računa Zaštita budžeta?', promptSavings:'Kako mogu povećati stopu štednje?', promptLimit:'Kako postaviti mjesečni limit?', askAssistant:'Pitajte AI asistenta', assistantPlaceholder:'Upišite pitanje...', send:'Pošalji', assistantDisclaimer:'AI odgovor je informativan i ne zamjenjuje profesionalni financijski savjet. Šalju se samo zbirni iznosi aktivnog profila.', assistantWelcome:'Pozdrav! Mogu objasniti MER pokazatelje, pomoći pronaći funkciju i dati smjernice na temelju zbirnih iznosa aktivnog profila.', assistantThinking:'Provjeravam vaš upit…', assistantLocal:'Lokalni vodič', assistantRemote:'AI odgovor', assistantError:'Odgovor trenutačno nije dostupan. Pokušajte ponovno.'
  });
  Object.assign(translations.en, {
    helpCenter:'HELP CENTRE', helpAssistant:'Help & AI Assistant', helpAssistantIntro:'Quickly find a feature or ask a question about your finances.', helpTabs:'Help and AI', guideFaq:'Guide & FAQ', aiAssistant:'AI Assistant',
    helpBudgetsHint:'Limits and monthly plan', helpSavingsHint:'Goals and round-ups', helpActivityHint:'All transactions and filters', helpInsightsHint:'Trends and reports',
    faqSafeQuestion:'What is Budget Protection?', faqPaceQuestion:'How is Daily Pace calculated?', faqSafeAnswer:'Safe to spend is monthly income minus recorded monthly expenses. New income increases it immediately.', faqPaceAnswer:'The remaining safe amount is divided by the number of days left in the current month.', faqWhereTransactions:'Where do I add and edit transactions?', faqTransactionsAnswer:'Add them from the sidebar button and edit them directly in Activity.', faqBanksRules:'Where do I connect a bank and set rules?', faqBanksRulesAnswer:'Open Banks in User settings for connections or Rules for automatic categorization.', openBanks:'Open Banks', openRules:'Open Rules',
    suggestedQuestions:'Suggested questions', promptSafe:'How is Safe to Spend calculated?', promptSavings:'How can I improve my savings rate?', promptLimit:'How do I set a monthly limit?', askAssistant:'Ask the AI assistant', assistantPlaceholder:'Type a question...', send:'Send', assistantDisclaimer:'AI responses are informational and do not replace professional financial advice. Only active-profile aggregate amounts are sent.', assistantWelcome:'Hello! I can explain MER metrics, help you find a feature, and provide guidance using aggregate totals from the active profile.', assistantThinking:'Reviewing your question…', assistantLocal:'Local guide', assistantRemote:'AI response', assistantError:'A response is not available right now. Please try again.'
  });
  applyStaticTranslations();

  const modal = $('#helpAssistantModal');
  const assistantForm = $('#assistantForm');
  if (!modal || !assistantForm || !window.MerFinancialAssistant) return;
  const histories = new Map();
  let activeRequest = null;

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

  function selectHelpTab(tab) {
    const selected = tab === 'assistant' ? 'assistant' : 'faq';
    $$('[data-help-tab]').forEach(button => { const active=button.dataset.helpTab===selected;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1; });
    $$('[data-help-panel]').forEach(panel => { const active=panel.dataset.helpPanel===selected;panel.hidden=!active;panel.classList.toggle('active',active); });
    if (selected === 'assistant') { renderMessages();setTimeout(() => $('#assistantInput').focus(), 30); }
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

  $('#openHelpAssistant').addEventListener('click', () => { selectHelpTab('faq');renderMessages();openModal(modal); });
  $$('[data-help-tab]').forEach(button => button.addEventListener('click', () => selectHelpTab(button.dataset.helpTab)));
  $$('[data-help-view]').forEach(button => button.addEventListener('click', () => { closeModal(modal);showView(button.dataset.helpView); }));
  $$('[data-help-settings]').forEach(button => button.addEventListener('click', () => { const tab=button.dataset.helpSettings;closeModal(modal);setTimeout(() => window.MerSettings?.open(tab), 30); }));
  $$('[data-ai-prompt]').forEach(button=>button.addEventListener('click',()=>{selectHelpTab('assistant');submitAssistantMessage(currentLang==='en'?button.dataset.aiPromptEn:button.dataset.aiPrompt);}));
  assistantForm.addEventListener('submit', event => { event.preventDefault();submitAssistantMessage($('#assistantInput').value); });
  $('#assistantInput').addEventListener('keydown', event => { if (event.key==='Enter'&&!event.shiftKey){event.preventDefault();assistantForm.requestSubmit();} });
  modal.addEventListener('close', () => { activeRequest?.abort();activeRequest=null;$('#assistantStatus').textContent=''; });
  reactiveStore.subscribe(event => {
    if (activeRequest && event.activeAccount !== activeRequest.profileId) activeRequest.abort();
    if (modal.open) renderMessages();
  });
})();
