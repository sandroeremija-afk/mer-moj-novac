(function exposeMerFinancialAssistant(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    const client = api.createAssistantClient();
    root.MerFinancialAssistant = Object.freeze({ ...api, ask: client.ask });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerAssistantCore() {
  const MAX_MESSAGE_LENGTH = 1000;
  const MAX_HISTORY = 12;
  const CONTEXT_KEYS = Object.freeze(['currency', 'totalIncome', 'totalExpenses', 'netTotal', 'safeToSpend', 'dailySafe', 'savingsBalance', 'savingsTarget', 'daysRemaining', 'topCategory', 'topCategorySpent']);

  const assistantId = () => globalThis.crypto?.randomUUID?.() || `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const cleanText = (value, limit) => String(value || '').trim().replace(/\u0000/g, '').slice(0, limit);

  function sanitizeMessages(messages) {
    return (Array.isArray(messages) ? messages : [])
      .filter(message => message && (message.role === 'user' || message.role === 'assistant'))
      .map(message => ({ role:message.role, content:cleanText(message.content, message.role === 'user' ? MAX_MESSAGE_LENGTH : 4000) }))
      .filter(message => message.content)
      .slice(-MAX_HISTORY);
  }

  function sanitizeFinancialContext(context) {
    const source = context && typeof context === 'object' ? context : {};
    return Object.fromEntries(CONTEXT_KEYS.flatMap(key => {
      if (!(key in source)) return [];
      if (key === 'currency' || key === 'topCategory') return [[key, cleanText(source[key], 80)]];
      const value = Number(source[key]);
      return Number.isFinite(value) ? [[key, value]] : [];
    }));
  }

  function amount(value, currency, locale) {
    return new Intl.NumberFormat(locale === 'en' ? 'en-IE' : 'hr-HR', { style:'currency', currency:currency || 'EUR', maximumFractionDigits:2 }).format(Number(value) || 0);
  }

  function localReply(message, context = {}, locale = 'hr') {
    const text = cleanText(message, MAX_MESSAGE_LENGTH).toLocaleLowerCase(locale === 'en' ? 'en' : 'hr');
    const english = locale === 'en';
    const currency = context.currency || 'EUR';
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
        ? 'Local guidance: open User settings, then Banks to connect an account or Rules to create an If/Then auto-categorization rule.'
        : 'Lokalni vodič: otvorite Korisničke postavke, zatim Banke za povezivanje računa ili Pravila za If/Then auto-kategorizaciju.';
    }
    return english
      ? 'Local guidance is available while the AI service is not connected. Try asking about safe to spend, daily pace, savings, budgets, banks, or rules.'
      : 'Dostupan je lokalni vodič dok AI usluga nije povezana. Pitajte o sigurnom iznosu, dnevnom tempu, štednji, budžetima, bankama ili pravilima.';
  }

  function createAssistantClient(options = {}) {
    const endpoint = options.endpoint || '/api/assistant';
    const fetchImpl = options.fetchImpl || globalThis.fetch?.bind(globalThis);
    const timeoutMs = Math.max(100, Number(options.timeoutMs) || 8000);

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
        const content = cleanText(result?.message || result?.content, 4000);
        if (!content) return fallback();
        return Object.freeze({ id:cleanText(result?.id, 100) || assistantId(), role:'assistant', content, source:'remote' });
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

  return Object.freeze({ MAX_MESSAGE_LENGTH, MAX_HISTORY, CONTEXT_KEYS, sanitizeMessages, sanitizeFinancialContext, localReply, createAssistantClient, createFinancialAssistant:createAssistantClient });
});
