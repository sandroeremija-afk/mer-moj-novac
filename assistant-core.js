(function exposeMerFinancialAssistant(root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./anomaly-core.js') : root.MerAnomalies);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    const client = api.createAssistantClient();
    root.MerFinancialAssistant = Object.freeze({ ...api, ask: client.ask });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerAssistantCore(Anomalies) {
  const MAX_MESSAGE_LENGTH = 1000;
  const MAX_HISTORY = 12;
  const CONTEXT_KEYS = Object.freeze(['currency', 'totalIncome', 'totalExpenses', 'netTotal', 'safeToSpend', 'dailySafe', 'savingsBalance', 'savingsTarget', 'daysRemaining', 'topCategory', 'topCategorySpent']);

  const assistantId = () => globalThis.crypto?.randomUUID?.() || `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const cleanText = (value, limit) => String(value || '').trim().replace(/\u0000/g, '').slice(0, limit);
  const ACTION_PAGES = Object.freeze({ pregled:'overview', budzeti:'budgets', stednja:'savings', aktivnost:'activity', uvidi:'insights' });
  const validAmount = value => typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 999999999 && Math.abs(value * 100 - Math.round(value * 100)) < .00001;
  const actionText = (value, limit) => typeof value === 'string' && value.trim() && value.trim().length <= limit ? cleanText(value, limit) : '';

  // Treat tool output as untrusted data, never executable code or a saved record.
  function sanitizeActions(actions) {
    const ids = new Set();
    return (Array.isArray(actions) ? actions : []).slice(0, 3).flatMap(action => {
      if (!action || typeof action !== 'object' || !action.arguments || typeof action.arguments !== 'object') return [];
      const args = action.arguments;
      let safe;
      if (action.name === 'add_transaction' && validAmount(args.amount) && ['income', 'expense'].includes(args.type)) {
        const merchant = actionText(args.merchant, 100), category = actionText(args.category, 100);
        if (merchant && typeof args.category === 'string' && args.category.trim().length <= 100) safe = { amount:args.amount, merchant, category, type:args.type };
      } else if (action.name === 'create_savings_goal' && validAmount(args.target_amount)) {
        const goal_name = actionText(args.goal_name, 40);
        if (goal_name) safe = { goal_name, target_amount:args.target_amount };
      } else if (action.name === 'navigate_view' && Object.hasOwn(ACTION_PAGES, args.target_page)) {
        safe = { target_page:args.target_page };
      }
      const id = actionText(action.id, 120);
      if (!safe || !id || ids.has(id)) return [];
      ids.add(id);
      return [Object.freeze({ id, name:action.name, arguments:Object.freeze(safe) })];
    });
  }

  function prepareAction(action, context = {}) {
    const safe = sanitizeActions([action])[0];
    if (!safe) return null;
    const args = safe.arguments;
    if (safe.name === 'navigate_view') return { kind:'navigation', view:ACTION_PAGES[args.target_page] };
    if (safe.name === 'create_savings_goal') return { kind:'goal', draft:{ name:args.goal_name, target:args.target_amount, current:0 } };
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('hr').replace(/[^a-z0-9]+/g, ' ').trim();
    const desired = normalize(args.category);
    const categories = (Array.isArray(context.categories) ? context.categories : []).filter(category => category.type === args.type);
    const exact = categories.find(category => normalize(category.id) === desired || normalize(category.name) === desired);
    const matches = categories.filter(category => normalize(category.name).startsWith(`${desired} `));
    const category = exact || (matches.length === 1 ? matches[0] : null);
    return { kind:'transaction', draft:{ amount:args.amount, merchant:args.merchant, type:args.type, categoryId:category?.id || null, date:context.referenceDate, currency:context.currency || 'EUR' } };
  }

  function sanitizeMessages(messages) {
    return (Array.isArray(messages) ? messages : [])
      .filter(message => message && (message.role === 'user' || message.role === 'assistant'))
      .map(message => ({ role:message.role, content:cleanText(message.content, message.role === 'user' ? MAX_MESSAGE_LENGTH : 4000) }))
      .filter(message => message.content)
      .slice(-MAX_HISTORY);
  }

  function sanitizeFinancialContext(context) {
    const source = context && typeof context === 'object' && !Array.isArray(context) ? context : {};
    const result = Object.fromEntries(CONTEXT_KEYS.flatMap(key => {
      if (!(key in source)) return [];
      if (key === 'currency') {
        const value = typeof source[key] === 'string' ? source[key].trim().toUpperCase() : '';
        return /^[A-Z]{3}$/.test(value) ? [[key,value]] : [];
      }
      if (key === 'topCategory') return typeof source[key] === 'string' ? [[key,cleanText(source[key],80).replace(/[\u0000-\u001f\u007f]/g,'')]] : [];
      const value = source[key];
      return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1e12 ? [[key, value]] : [];
    }));
    const anomalies = Anomalies?.sanitizeAnomalies(source.spendingAnomalies, result.currency) || [];
    if (anomalies.length) result.spendingAnomalies = anomalies;
    return result;
  }

  function anomalyIntroduction(context, locale = 'hr', privateMode = false) {
    const safe = sanitizeFinancialContext(context), anomaly = safe.spendingAnomalies?.[0];
    if (!anomaly) return '';
    const english = locale === 'en';
    if (privateMode) return english
      ? 'A spending pattern changed this week. Amounts are hidden; when you are ready, we can review it together.'
      : 'Obrazac potrošnje promijenio se ovaj tjedan. Iznosi su skriveni; kad budete spremni, možemo ga zajedno pregledati.';
    const percent = new Intl.NumberFormat(english ? 'en-IE' : 'hr-HR', {maximumFractionDigits:1}).format(anomaly.growthPercent);
    return english
      ? `${anomaly.category}: spending in the last 7 days is ${percent}% above the weekly average of the preceding 4 weeks (${amount(anomaly.current,safe.currency,'en')} vs. ${amount(anomaly.average,safe.currency,'en')}). It may be a one-off purchase. We can review the category together.`
      : `${anomaly.category}: potrošnja u posljednjih 7 dana je ${percent}% iznad tjednog prosjeka prethodna 4 tjedna (${amount(anomaly.current,safe.currency,'hr')} prema ${amount(anomaly.average,safe.currency,'hr')}). Možda je riječ o jednokratnoj kupnji. Možemo zajedno pregledati kategoriju.`;
  }

  function amount(value, currency, locale) {
    const numeric=Number(value)||0,zero=Math.abs(numeric)<.005;
    return new Intl.NumberFormat(locale === 'en' ? 'en-IE' : 'hr-HR', { style:'currency', currency:currency || 'EUR', minimumFractionDigits:zero?0:2, maximumFractionDigits:zero?0:2 }).format(numeric);
  }

  function localReply(message, context = {}, locale = 'hr') {
    const text = cleanText(message, MAX_MESSAGE_LENGTH).toLocaleLowerCase(locale === 'en' ? 'en' : 'hr');
    const english = locale === 'en';
    const currency = context.currency || 'EUR';
    if (/anomal|odstup|porast|poveć|spike|unusual|increase|potrošnj|spending/.test(text)) {
      const introduction = anomalyIntroduction(context, locale);
      if (introduction) return `${english ? 'Local guidance: ' : 'Lokalni vodič: '}${introduction}`;
    }
    if (/zaštit|sigurno|safe|budget protection/.test(text)) {
      return english
        ? `Local guidance: your current safe-to-spend amount is ${amount(context.safeToSpend, currency, 'en')}. It is monthly income minus monthly expenses; your daily pace is ${amount(context.dailySafe, currency, 'en')}.`
        : `Lokalni vodič: trenutačno je sigurno za potrošiti ${amount(context.safeToSpend, currency, 'hr')}. Iznos je mjesečni prihod umanjen za mjesečne troškove, a dnevni tempo iznosi ${amount(context.dailySafe, currency, 'hr')}.`;
    }
    if (/dnev|tempo|daily/.test(text)) {
      return english
        ? `Local guidance: your daily safe-to-spend pace is ${amount(context.dailySafe, currency, 'en')}, based on ${Number(context.daysRemaining) || 0} days remaining in the month.`
        : `Lokalni vodič: vaš dnevni tempo iznosi ${amount(context.dailySafe, currency, 'hr')} za još ${Number(context.daysRemaining) || 0} dana u mjesecu.`;
    }
    if (/šted|saving|rate/.test(text)) {
      return english
        ? `Local guidance: you currently have ${amount(context.savingsBalance, currency, 'en')} in savings toward a target of ${amount(context.savingsTarget, currency, 'en')}. Review Savings to adjust goals or round-ups.`
        : `Lokalni vodič: trenutačno imate ${amount(context.savingsBalance, currency, 'hr')} štednje prema cilju od ${amount(context.savingsTarget, currency, 'hr')}. U Štednji možete prilagoditi ciljeve i zaokruživanja.`;
    }
    if (/limit|budžet|budget|kategor/.test(text)) {
      return english
        ? 'Local guidance: open Budgets, choose a category, and set its monthly limit. Limits warn you at thresholds but never block real transactions.'
        : 'Lokalni vodič: otvorite Budžete, odaberite kategoriju i postavite mjesečni limit. Limiti upozoravaju na pragove, ali ne blokiraju stvarne transakcije.';
    }
    if (/bank|pravil|rule|uvoz|import/.test(text)) {
      return english
        ? 'Local guidance: use Connected banks in the header to connect an account. For auto-categorization, open User settings, then Rules.'
        : 'Lokalni vodič: za povezivanje računa otvorite Povezane banke u zaglavlju. Za automatsku kategorizaciju otvorite Korisničke postavke, zatim Pravila.';
    }
    return english
      ? 'The AI service is temporarily unavailable. This local guide cannot prepare actions. You can still add entries manually or ask about safe to spend, savings and budgets.'
      : 'AI usluga trenutačno nije dostupna. Lokalni vodič ne može pripremiti radnje. Unose možete dodati ručno ili pitati o sigurnom iznosu, štednji i budžetima.';
  }

  function createAssistantClient(options = {}) {
    const endpoint = options.endpoint || '/api/ai/chat';
    const fetchImpl = options.fetchImpl || globalThis.fetch?.bind(globalThis);
    const timeoutMs = Math.max(100, Number(options.timeoutMs) || 30000);

    async function ask({messages,locale,profileId,financialContext,signal} = {}) {
      const safeMessages = sanitizeMessages(messages);
      const lastUser = [...safeMessages].reverse().find(message => message.role === 'user');
      if (!lastUser) throw new TypeError('A non-empty user message is required');
      const safeLocale = locale === 'en' ? 'en' : 'hr';
      const safeProfileId = profileId === 'business' ? 'business' : 'personal';
      const safeFinancialContext = sanitizeFinancialContext(financialContext);
      const fallback = () => Object.freeze({ id:assistantId(), role:'assistant', content:localReply(lastUser.content, safeFinancialContext, safeLocale), source:'local' });
      if (!fetchImpl) return fallback();

      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      let timedOut = false;
      const abortFromRequest = () => controller?.abort(signal?.reason);
      if (signal?.aborted) throw signal.reason || new DOMException('Aborted', 'AbortError');
      signal?.addEventListener?.('abort', abortFromRequest, { once:true });
      const timer = controller ? setTimeout(() => { timedOut = true;controller.abort(); }, timeoutMs) : null;
      try {
        const response = await fetchImpl(endpoint, {
          method:'POST',
          credentials:'same-origin',
          headers:{ Accept:'application/json', 'Content-Type':'application/json' },
          body:JSON.stringify({ messages:safeMessages, locale:safeLocale, profileId:safeProfileId, financialContext:safeFinancialContext }),
          signal:controller?.signal || signal
        });
        if (!response?.ok) return fallback();
        const result = await response.json();
        const actions = sanitizeActions(result?.actions);
        const content = cleanText(result?.message || result?.content, 4000) || (actions.length ? (safeLocale === 'en' ? 'Your action is ready to review.' : 'Vaša je radnja pripremljena za pregled.') : '');
        if (!content) return fallback();
        return Object.freeze({ id:cleanText(result?.id, 100) || assistantId(), role:'assistant', content, source:'remote', actions });
      } catch (error) {
        if (signal?.aborted && !timedOut) throw error;
        return fallback();
      } finally {
        if (timer) clearTimeout(timer);
        signal?.removeEventListener?.('abort', abortFromRequest);
      }
    }

    return Object.freeze({ ask });
  }

  return Object.freeze({ MAX_MESSAGE_LENGTH, MAX_HISTORY, CONTEXT_KEYS, ACTION_PAGES, sanitizeActions, prepareAction, sanitizeMessages, sanitizeFinancialContext, anomalyIntroduction, localReply, createAssistantClient, createFinancialAssistant:createAssistantClient });
});
