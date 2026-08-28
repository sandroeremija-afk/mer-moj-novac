(function exposeMerCore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerCore() {
  const clone = value => JSON.parse(JSON.stringify(value));

  function createAccountStore(personal, business, options = {}) {
    return {
      version: 5,
      language: options.language === 'en' ? 'en' : 'hr',
      theme: options.theme === 'dark' ? 'dark' : 'light',
      activeAccount: options.activeAccount === 'business' ? 'business' : 'personal',
      accounts: { personal: clone(personal), business: clone(business) }
    };
  }

  function calculateBudget(profile, daysRemaining = 12) {
    const income = Math.max(0, Number(profile.income) || 0);
    const bills = Math.max(0, Number(profile.bills) || 0);
    const savingsTarget = Math.max(0, Number(profile.savingsTarget) || 0);
    const guard = Math.max(0, Math.min(1, Number(profile.guard) || 0));
    const spent = Math.max(0, Number(profile.spent) || 0);
    const buffer = income * guard;
    const monthlyBudget = Math.max(0, income - bills - savingsTarget - buffer);
    const safeRemaining = Math.max(0, monthlyBudget - spent);
    return {
      buffer,
      monthlyBudget,
      safeRemaining,
      safeDaily: safeRemaining / Math.max(1, Number(daysRemaining) || 1),
      days: Math.max(1, Number(daysRemaining) || 1),
      spentPercent: monthlyBudget ? spent / monthlyBudget * 100 : spent > 0 ? 100 : 0
    };
  }

  function budgetSeverity(percent) {
    const safePercent = Math.max(0, Number(percent) || 0);
    if (safePercent >= 100) return 'exceeded';
    if (safePercent >= 95) return 'almost';
    if (safePercent >= 80) return 'near';
    return null;
  }

  function budgetThreshold(spent, limit) {
    const safeLimit = Number(limit) || 0;
    const safeSpent = Math.max(0, Number(spent) || 0);
    const percent = safeLimit > 0 ? safeSpent / safeLimit * 100 : safeSpent > 0 ? 100 : 0;
    return {
      percent,
      level: percent >= 100 ? 'red' : percent >= 80 ? 'yellow' : 'green',
      warning: budgetSeverity(percent)
    };
  }

  function groupBudgetAlerts(alerts) {
    const items = Array.isArray(alerts) ? alerts.filter(Boolean) : [];
    if (items.length < 2) return items.slice();
    return [{
      key:'budget:group',
      grouped:true,
      priority:Math.max(...items.map(item=>Number(item.priority)||0)),
      type:items.some(item=>item.type==='danger')?'danger':'warning',
      children:items.slice()
    }];
  }

  function assessExpenseImpact(input = {}) {
    const amount = Math.max(0, financialAmount(input.amount));
    const editingAmount = Math.max(0, financialAmount(input.editingAmount));
    const currentSpent = Math.max(0, financialAmount(input.currentSpent) - editingAmount);
    const monthlyBudget = Math.max(0, financialAmount(input.monthlyBudget));
    const categorySpent = Math.max(0, financialAmount(input.categorySpent) - (input.editingSameCategory ? editingAmount : 0));
    const categoryLimit = Math.max(0, financialAmount(input.categoryLimit));
    const dailyBudget = Math.max(0, financialAmount(input.dailyBudget));
    const monthlyAfter = roundMoney(currentSpent + amount);
    const categoryAfter = roundMoney(categorySpent + amount);
    const monthlyOver = Math.max(0, roundMoney(monthlyAfter - monthlyBudget));
    const categoryOver = Math.max(0, roundMoney(categoryAfter - categoryLimit));
    const dailyOver = dailyBudget > 0 ? Math.max(0, roundMoney(amount - dailyBudget)) : 0;
    const categoryThreshold = budgetThreshold(categoryAfter, categoryLimit);
    const warning = monthlyOver > 0 ? 'monthly-over' : categoryOver > 0 ? 'category-over' : dailyOver > 0 ? 'daily-over' : categoryThreshold.warning ? 'category-near' : null;
    return {
      valid: amount > 0,
      allowed: amount > 0,
      amount,
      monthlyAfter,
      categoryAfter,
      monthlyRemaining:Math.max(0, roundMoney(monthlyBudget - monthlyAfter)),
      categoryRemaining:Math.max(0, roundMoney(categoryLimit - categoryAfter)),
      monthlyOver,
      categoryOver,
      dailyOver,
      categoryPercent:categoryThreshold.percent,
      warning,
      level:warning === 'monthly-over' || warning === 'category-over' ? 'danger' : warning ? 'warning' : amount > 0 ? 'success' : ''
    };
  }

  function daysInMonth(year, monthIndex) {
    return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  }

  function dateOnly(value) {
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) throw new Error('Invalid ISO date');
      return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
    }
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) throw new Error('Invalid ISO date');
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) throw new Error('Invalid ISO date');
    return date;
  }

  function isoDate(date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  }

  function monthlyCandidate(year, monthIndex, day) {
    const normalizedYear = year + Math.floor(monthIndex / 12);
    const normalizedMonth = ((monthIndex % 12) + 12) % 12;
    return new Date(Date.UTC(normalizedYear, normalizedMonth, Math.min(Math.max(1, day), daysInMonth(normalizedYear, normalizedMonth))));
  }

  function nextOccurrence(rule, fromValue, inclusive = false) {
    if (!rule || rule.enabled === false) return null;
    let from;
    let start;
    try {
      from = dateOnly(fromValue);
      start = rule.startDate ? dateOnly(rule.startDate) : new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
    } catch {
      return null;
    }
    const day = Math.max(1, Math.min(31, Number(rule.day) || 1));
    let year = from.getUTCFullYear();
    let month = from.getUTCMonth();
    let candidate = monthlyCandidate(year, month, day);
    const beforeBoundary = inclusive ? candidate < from : candidate <= from;
    if (beforeBoundary) candidate = monthlyCandidate(year, month + 1, day);
    while (candidate < start) candidate = monthlyCandidate(candidate.getUTCFullYear(), candidate.getUTCMonth() + 1, day);
    return isoDate(candidate);
  }

  function occurrencesBetween(rule, fromExclusiveValue, throughInclusiveValue, max = 120) {
    if (!rule || rule.enabled === false) return [];
    let through;
    let cursor;
    try {
      through = dateOnly(throughInclusiveValue);
      cursor = dateOnly(fromExclusiveValue);
    } catch {
      return [];
    }
    const dates = [];
    const safeMaximum = Math.max(0, Math.min(1200, Math.floor(Number(max) || 0)));
    for (let index = 0; index < safeMaximum; index += 1) {
      const next = nextOccurrence(rule, cursor, false);
      if (!next) break;
      const date = dateOnly(next);
      if (date > through) break;
      dates.push(next);
      cursor = date;
    }
    return dates;
  }

  function validateCategoryLimit(value, spent, otherAllocated, monthlyBudget) {
    const limit = Number(value);
    const minimum = Math.max(0, Number(spent) || 0);
    const maximum = Math.max(minimum, (Number(monthlyBudget) || 0) - (Number(otherAllocated) || 0));
    if (!Number.isFinite(limit) || limit < 0) return { valid: false, reason: 'invalid', minimum, maximum };
    if (limit < minimum) return { valid: false, reason: 'below-spent', minimum, maximum };
    if (limit > maximum + .001) return { valid: false, reason: 'over-allocation', minimum, maximum };
    return { valid: true, reason: null, minimum, maximum };
  }

  function transferBudgetAllocation(categories, fromCategoryId, toCategoryId, amount) {
    const list = Array.isArray(categories) ? categories : [];
    const from = list.find(category => category?.id === fromCategoryId);
    const to = list.find(category => category?.id === toCategoryId);
    const requested = roundMoney(amount);
    if (!from || !to || from === to) return { valid:false, reason:'invalid-categories', amount:0 };
    if (!Number.isFinite(requested) || requested <= 0) return { valid:false, reason:'invalid-amount', amount:0 };
    const donorHeadroom = Math.max(0, roundMoney(financialAmount(from.limit) - financialAmount(from.spent)));
    const targetOverage = Math.max(0, roundMoney(financialAmount(to.spent) - financialAmount(to.limit)));
    if (donorHeadroom <= 0) return { valid:false, reason:'no-headroom', amount:0, donorHeadroom, targetOverage };
    if (targetOverage <= 0) return { valid:false, reason:'target-covered', amount:0, donorHeadroom, targetOverage };
    const transferred = Math.min(requested, donorHeadroom, targetOverage);
    if (transferred <= 0) return { valid:false, reason:'invalid-amount', amount:0, donorHeadroom, targetOverage };
    const totalBefore = roundMoney(list.reduce((sum, category) => sum + Math.max(0, financialAmount(category?.limit)), 0));
    from.limit = Math.max(financialAmount(from.spent), roundMoney(financialAmount(from.limit) - transferred));
    to.limit = roundMoney(financialAmount(to.limit) + transferred);
    const totalAfter = roundMoney(list.reduce((sum, category) => sum + Math.max(0, financialAmount(category?.limit)), 0));
    return { valid:true, reason:null, amount:transferred, donorHeadroom, targetOverage, fromId:from.id, toId:to.id, totalBefore, totalAfter };
  }

  function trimBudgetAllocation(categories, monthlyBudget) {
    const list = Array.isArray(categories) ? categories : [];
    const budget = Math.max(0, roundMoney(monthlyBudget));
    const allocatedBefore = roundMoney(list.reduce((sum, category) => sum + Math.max(0, financialAmount(category?.limit)), 0));
    let remaining = Math.max(0, roundMoney(allocatedBefore - budget));
    const reductions = [];
    const candidates = list.map(category => ({
      category,
      headroom:Math.max(0, roundMoney(financialAmount(category?.limit) - financialAmount(category?.spent)))
    })).filter(item => item.headroom > 0).sort((left, right) => right.headroom - left.headroom || String(left.category.id).localeCompare(String(right.category.id)));
    candidates.forEach(item => {
      if (remaining <= 0) return;
      const amount = Math.min(item.headroom, remaining);
      item.category.limit = roundMoney(financialAmount(item.category.limit) - amount);
      reductions.push({ categoryId:item.category.id, amount });
      remaining = Math.max(0, roundMoney(remaining - amount));
    });
    const allocatedAfter = roundMoney(list.reduce((sum, category) => sum + Math.max(0, financialAmount(category?.limit)), 0));
    return {
      valid:allocatedBefore > budget,
      resolved:remaining <= 0,
      reason:allocatedBefore <= budget ? 'not-over-allocated' : remaining > 0 ? 'spending-floor' : null,
      reduced:roundMoney(allocatedBefore - allocatedAfter),
      remaining,
      allocatedBefore,
      allocatedAfter,
      reductions
    };
  }

  function transactionType(transaction) {
    return transaction && transaction.type === 'income' ? 'income' : 'expense';
  }

  function financialAmount(value) {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
  }

  function roundMoney(value) {
    const amount = financialAmount(value);
    return Math.round((amount + Math.sign(amount) * Number.EPSILON) * 100) / 100;
  }

  function ratioPercent(value, total, maximum = Infinity) {
    const safeValue = Math.max(0, financialAmount(value));
    const safeTotal = Math.max(0, financialAmount(total));
    if (!safeTotal) return 0;
    return Math.min(maximum, safeValue / safeTotal * 100);
  }

  function stableTransactionHash(value) {
    const text = Array.isArray(value) ? value.join('|') : String(value ?? '');
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `tx-${(hash >>> 0).toString(16).padStart(8, '0')}`;
  }

  function autoCategorizeBankTransaction(rawTransaction, profile) {
    const amountValue = Number(rawTransaction?.amount ?? rawTransaction?.transactionAmount?.amount ?? 0);
    const indicator = String(rawTransaction?.creditDebitIndicator || '').toUpperCase();
    const isIncome = indicator === 'CRDT' || (indicator !== 'DBIT' && amountValue > 0);
    const descriptor = String(rawTransaction?.description || rawTransaction?.merchantName || rawTransaction?.remittanceInformationUnstructured || '').toLocaleLowerCase('en').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const expenseIds = new Set((profile?.categories || []).map(category => category.id));
    const incomeIds = new Set((profile?.incomeCategories || []).map(category => category.id));
    const pickExpense = (...ids) => ids.find(id => expenseIds.has(id));
    const pickIncome = (...ids) => ids.find(id => incomeIds.has(id));

    const customRule = (profile?.automationRules || []).find(rule => {
      const keyword = String(rule.keyword || '').trim().toLocaleLowerCase('en');
      return rule.enabled !== false && keyword && descriptor.includes(keyword) && (!rule.type || rule.type === (isIncome ? 'income' : 'expense'));
    });
    if (customRule) {
      const allowed = isIncome ? incomeIds : expenseIds;
      if (allowed.has(customRule.category)) return { category: customRule.category, confidence: 'custom-rule', rule: customRule.id || customRule.keyword };
    }

    if (isIncome) {
      if (/pla[cć]a|salary|payroll|wage/.test(descriptor)) return { category: pickIncome('salary') || 'otherIncome', confidence: 'rule', rule: 'salary' };
      if (/upwork|freelance|invoice|client payment|honorar/.test(descriptor)) return { category: pickIncome('freelance') || 'otherIncome', confidence: 'rule', rule: 'freelance' };
      if (/gift|dar|poklon/.test(descriptor)) return { category: pickIncome('gift') || 'otherIncome', confidence: 'rule', rule: 'gift' };
      return { category: pickIncome('otherIncome') || (profile?.incomeCategories?.[0]?.id ?? 'otherIncome'), confidence: 'fallback', rule: null };
    }

    if (/uber|bolt|\bzet\b|\bhz\b|croatia airlines|petrol|\bina\b|shell|lukoil|fuel|taxi|autobus|tramvaj/.test(descriptor)) return { category: pickExpense('transport', 'travel', 'other') || profile?.categories?.[0]?.id, confidence: 'rule', rule: 'transport' };
    if (/konzum|lidl|interspar|\bspar\b|plodine|eurospin|studenac|supermarket|\bmarket\b|restaurant|restoran|wolt|glovo|pekara/.test(descriptor)) return { category: pickExpense('food', 'other') || profile?.categories?.[0]?.id, confidence: 'rule', rule: 'groceries' };
    if (/(^|\s)dm(\s|$)|muller|bipa|drogerij|pharmacy|ljekarn/.test(descriptor)) return { category: pickExpense('healthBeauty', 'shopping', 'office', 'other') || profile?.categories?.[0]?.id, confidence: 'rule', rule: 'health-beauty' };
    if (/eventim|entrio|cinestar|caffe|nightclub|netflix|spotify|cinema|kino|steam|playstation/.test(descriptor)) return { category: pickExpense('entertainment', 'software', 'other') || profile?.categories?.[0]?.id, confidence: 'rule', rule: 'entertainment' };
    if (/\bhep\b|t-com|hrvatski telekom|\ba1\b|telemach|zagreb holding|komunal|vodovod|utilities/.test(descriptor)) return { category: pickExpense('utilities', 'other', 'office') || profile?.categories?.[0]?.id, confidence: 'rule', rule: 'utilities' };
    if (/amazon|h&m|zara|shop|store|trgovina/.test(descriptor)) return { category: pickExpense('shopping', 'office', 'other') || profile?.categories?.[0]?.id, confidence: 'rule', rule: 'shopping' };
    if (/adobe|microsoft|github|software|hosting|cloud/.test(descriptor)) return { category: pickExpense('software', 'office', 'other') || profile?.categories?.[0]?.id, confidence: 'rule', rule: 'software' };
    if (/google ads|meta ads|marketing|advertising/.test(descriptor)) return { category: pickExpense('marketing', 'other') || profile?.categories?.[0]?.id, confidence: 'rule', rule: 'marketing' };
    if (/airlines|airways|hotel|booking|travel|putovanje/.test(descriptor)) return { category: pickExpense('travel', 'transport', 'other') || profile?.categories?.[0]?.id, confidence: 'rule', rule: 'travel' };
    return { category: pickExpense('other') || profile?.categories?.[0]?.id, confidence: 'fallback', rule: null };
  }

  function normalizeBankTransaction(rawTransaction, connection, profile) {
    if (!rawTransaction || !connection) return null;
    const rawAmount = Number(rawTransaction.amount ?? rawTransaction.transactionAmount?.amount);
    if (!Number.isFinite(rawAmount) || rawAmount === 0) return null;
    const indicator = String(rawTransaction.creditDebitIndicator || '').toUpperCase();
    const type = indicator === 'CRDT' || (indicator !== 'DBIT' && rawAmount > 0) ? 'income' : 'expense';
    const amount = Math.abs(rawAmount);
    const dateValue = String(rawTransaction.bookedAt || rawTransaction.bookingDate || rawTransaction.date || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return null;
    const name = String(rawTransaction.description || rawTransaction.merchantName || rawTransaction.remittanceInformationUnstructured || 'Bank transaction').trim().slice(0, 100);
    const externalId = String(rawTransaction.id || rawTransaction.transactionId || '').trim();
    const identityParts = [connection.providerId, connection.accountId, externalId || dateValue, amount.toFixed(2), name.toLocaleLowerCase('en')];
    const importHash = stableTransactionHash(identityParts);
    const category = autoCategorizeBankTransaction({ ...rawTransaction, amount: type === 'income' ? amount : -amount }, profile);
    return {
      id: `bank-${connection.id}-${importHash}`,
      type,
      name,
      amount,
      category: category.category,
      date: `${dateValue}T12:00:00`,
      source: `Auto: ${connection.institution}`,
      sourceType: 'auto',
      connectionId: connection.id,
      bankTransactionId: externalId ? `${connection.providerId}:${connection.accountId}:${externalId}` : importHash,
      importHash,
      categoryConfidence: category.confidence,
      categorizationRule: category.rule,
      needsReview: category.confidence === 'fallback',
      provider: connection.providerId,
      accountId: connection.accountId,
      iban: String(rawTransaction.iban || connection.iban || ''),
      bic: String(rawTransaction.bic || connection.bic || ''),
      merchantName: String(rawTransaction.merchantName || name),
      timestamp: String(rawTransaction.timestamp || rawTransaction.bookedAt || rawTransaction.bookingDate || dateValue),
      currency: String(rawTransaction.currency || rawTransaction.transactionAmount?.currency || connection.currency || 'EUR').toUpperCase()
    };
  }

  function greetingFor(dateValue = new Date(), language = 'hr', displayName = '') {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    const hour = Number.isNaN(date.getTime()) ? 12 : date.getHours();
    const firstName = String(displayName || '').trim().split(/\s+/)[0] || (language === 'en' ? 'there' : 'natrag');
    if (language === 'en') return `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${firstName}.`;
    return `${hour < 12 ? 'Dobro jutro' : hour < 18 ? 'Dobar dan' : 'Dobra večer'}, ${firstName}.`;
  }

  function importBankTransactions(profile, connection, rawTransactions) {
    if (!profile || !connection || !Array.isArray(rawTransactions)) return { imported: [], duplicates: 0, invalid: rawTransactions?.length || 0, uncategorized: 0 };
    profile.transactions = profile.transactions || [];
    const knownIds = new Set(profile.transactions.filter(transaction=>transaction&&typeof transaction==='object').flatMap(transaction => [transaction.bankTransactionId, transaction.importHash].filter(Boolean)));
    const imported = [];
    let duplicates = 0;
    let invalid = 0;
    rawTransactions.forEach(rawTransaction => {
      const transaction = normalizeBankTransaction(rawTransaction, connection, profile);
      if (!transaction) { invalid += 1; return; }
      if (knownIds.has(transaction.bankTransactionId) || knownIds.has(transaction.importHash)) { duplicates += 1; return; }
      knownIds.add(transaction.bankTransactionId);
      knownIds.add(transaction.importHash);
      imported.push(transaction);
    });
    if (imported.length) profile.transactions.unshift(...imported);
    return { imported, duplicates, invalid, uncategorized: imported.filter(transaction => transaction.needsReview).length };
  }

  function filterTransactions(transactions, timeframe = 'monthly', referenceValue = new Date()) {
    let reference;
    try { reference = dateOnly(referenceValue); } catch { return []; }
    const referenceIso = isoDate(reference);
    const monthPrefix = referenceIso.slice(0, 7);
    const yearPrefix = referenceIso.slice(0, 4);
    const normalized = timeframe === 'yearly' || timeframe === 'this-year' ? 'ytd' : timeframe;
    return (transactions || []).filter(transaction => {
      if (!transaction || typeof transaction !== 'object') return false;
      const date = String(transaction.date || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
      try { if (isoDate(dateOnly(date)) !== date) return false; } catch { return false; }
      if (normalized === 'daily') return date === referenceIso;
      if (normalized === 'monthly') return date.startsWith(monthPrefix) && date <= referenceIso;
      if (normalized === 'ytd') return date.startsWith(yearPrefix) && date <= referenceIso;
      return normalized === 'all' && date <= referenceIso;
    });
  }

  function normalizeActivitySearch(value) {
    return String(value ?? '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLocaleLowerCase();
  }

  function activityFilterDate(value) {
    if (!value) return null;
    try {
      const candidate = String(value).slice(0, 10);
      return isoDate(dateOnly(candidate));
    } catch {
      return null;
    }
  }

  function filterActivityTransactions(source, filters = {}) {
    const transactions = Array.isArray(source)
      ? source
      : Array.isArray(source?.transactions)
        ? source.transactions
        : [];
    const query = normalizeActivitySearch(filters.query ?? filters.search);
    const typeFilter = filters.type === 'income' || filters.type === 'expense' ? filters.type : 'all';
    const categoryFilter = String(filters.category ?? filters.categoryId ?? 'all');
    const categoryLabels = filters.categoryLabels && typeof filters.categoryLabels === 'object' ? filters.categoryLabels : {};
    const reviewOnly = filters.reviewOnly === true;
    let dateFrom = activityFilterDate(filters.dateFrom ?? filters.startDate);
    let dateTo = activityFilterDate(filters.dateTo ?? filters.endDate);
    if (dateFrom && dateTo && dateFrom > dateTo) [dateFrom, dateTo] = [dateTo, dateFrom];
    const sort = ['amount-asc', 'amount-desc', 'date-asc', 'date-desc'].includes(filters.sort)
      ? filters.sort
      : 'date-desc';

    const rows = transactions.map((transaction, index) => {
      const type = transactionType(transaction);
      const category = String(transaction?.category ?? '');
      const categoryKey = type === 'income' ? `income:${category}` : category;
      let categoryLabel = categoryLabels[categoryKey] ?? categoryLabels[category] ?? category;
      if (typeof filters.getCategoryLabel === 'function') {
        try { categoryLabel = filters.getCategoryLabel(transaction, type) ?? categoryLabel; } catch { /* keep deterministic fallback */ }
      }
      const parsedTimestamp = Date.parse(String(transaction?.date ?? ''));
      return {
        transaction,
        index,
        type,
        category,
        date:activityFilterDate(transaction?.date),
        timestamp:Number.isFinite(parsedTimestamp) ? parsedTimestamp : null,
        amount:Math.abs(financialAmount(transaction?.amount)),
        searchable:normalizeActivitySearch([
          transaction?.name,
          transaction?.merchantName,
          transaction?.description,
          transaction?.source,
          category,
          categoryLabel
        ].filter(Boolean).join(' '))
      };
    }).filter(row => {
      if (!row.transaction || typeof row.transaction !== 'object') return false;
      if (reviewOnly && !row.transaction.needsReview) return false;
      if (typeFilter !== 'all' && row.type !== typeFilter) return false;
      if (categoryFilter !== 'all') {
        const incomeCategory = categoryFilter.startsWith('income:');
        const expectedCategory = incomeCategory ? categoryFilter.slice(7) : categoryFilter;
        if (row.category !== expectedCategory || row.type !== (incomeCategory ? 'income' : 'expense')) return false;
      }
      if (query && !row.searchable.includes(query)) return false;
      if ((dateFrom || dateTo) && !row.date) return false;
      if (dateFrom && row.date < dateFrom) return false;
      if (dateTo && row.date > dateTo) return false;
      return true;
    });

    rows.sort((left, right) => {
      if (sort === 'amount-asc' || sort === 'amount-desc') {
        const difference = left.amount - right.amount;
        if (difference) return sort === 'amount-asc' ? difference : -difference;
      } else {
        if (left.timestamp === null && right.timestamp !== null) return 1;
        if (left.timestamp !== null && right.timestamp === null) return -1;
        if (left.timestamp !== right.timestamp) return sort === 'date-asc'
          ? left.timestamp - right.timestamp
          : right.timestamp - left.timestamp;
      }
      return left.index - right.index;
    });
    return rows.map(row => row.transaction);
  }

  function transactionTotals(transactions, timeframe = 'monthly', referenceValue = new Date()) {
    const filtered = filterTransactions(transactions, timeframe, referenceValue);
    const totals = filtered.reduce((result, transaction) => {
      const amount = financialAmount(transaction.amount);
      if (transactionType(transaction) === 'income') result.income += amount;
      else result.expenses += amount;
      return result;
    }, { income: 0, expenses: 0 });
    totals.income = Math.max(0, roundMoney(totals.income));
    totals.expenses = Math.max(0, roundMoney(totals.expenses));
    totals.net = totals.income - totals.expenses;
    totals.net = roundMoney(totals.net);
    totals.savingsRate = totals.income > 0 ? Math.round(totals.net / totals.income * 100000000) / 1000000 : null;
    totals.count = filtered.length;
    return totals;
  }

  function calculateFinancials(profile, referenceValue = new Date(), options = {}) {
    const reference = dateOnly(referenceValue);
    const transactions = Array.isArray(profile?.transactions) ? profile.transactions : [];
    const monthly = transactionTotals(transactions, 'monthly', reference);
    const allTime = transactionTotals(transactions, 'all', reference);
    const plannedIncome = Math.max(0, financialAmount(profile?.income));
    const bills = Math.max(0, financialAmount(profile?.bills));
    const savingsTarget = Math.max(0, financialAmount(profile?.savingsTarget));
    const guard = Math.max(0, Math.min(1, financialAmount(profile?.guard)));
    const buffer = roundMoney(plannedIncome * guard);
    const protectedCommitments = roundMoney(bills + savingsTarget + buffer);
    const incomeAdjustment = roundMoney(monthly.income - plannedIncome);
    const spendablePool = roundMoney(monthly.income - protectedCommitments);
    const monthlyBudget = Math.max(0, spendablePool);
    const safeToSpend = roundMoney(spendablePool - monthly.expenses);
    const configuredDays = Number(options.daysRemaining);
    const days = Number.isFinite(configuredDays) && configuredDays > 0
      ? Math.max(1, Math.floor(configuredDays))
      : Math.max(1, daysInMonth(reference.getUTCFullYear(), reference.getUTCMonth()) - reference.getUTCDate() + 1);
    const safeDaily = roundMoney(safeToSpend / days);
    const openingBalance = financialAmount(options.openingBalance ?? profile?.financialOpeningBalance ?? profile?.reactiveBalanceAnchor);
    const savingsBalance = Math.max(0, financialAmount(options.savingsBalance ?? profile?.savingsBalance));
    const availableBalance = roundMoney(openingBalance + allTime.net - savingsBalance);
    const allocatedBudget = roundMoney((profile?.categories || []).reduce((sum, category) => sum + Math.max(0, financialAmount(category.limit)), 0));
    const unallocatedBudget = roundMoney(monthlyBudget - allocatedBudget);
    const spentPercent = monthlyBudget > 0 ? monthly.expenses / monthlyBudget * 100 : monthly.expenses > 0 ? 100 : 0;
    const safePercent = monthlyBudget > 0 ? Math.max(0, Math.min(100, safeToSpend / monthlyBudget * 100)) : 0;
    return {
      monthly,
      allTime,
      availableBalance,
      openingBalance,
      savingsBalance,
      plannedIncome,
      monthlyIncome:monthly.income,
      monthlyExpenses:monthly.expenses,
      cashFlowNet:monthly.net,
      bills,
      savingsTarget,
      guard,
      buffer,
      protectedCommitments,
      incomeAdjustment,
      spendablePool,
      monthlyBudget,
      allocatedBudget,
      unallocatedBudget,
      safeToSpend,
      safeRemaining:safeToSpend,
      safeDaily,
      days,
      spentPercent,
      safePercent,
      overBudget:Math.max(0, roundMoney(-safeToSpend))
    };
  }

  const FinancialEngine = Object.freeze({ calculate:calculateFinancials });

  function categoryExpenseTotals(transactions, timeframe = 'monthly', referenceValue = new Date()) {
    const signedTotals = {};
    filterTransactions(transactions, timeframe, referenceValue).forEach(transaction => {
      if (transactionType(transaction) !== 'expense') return;
      const category = transaction.category || 'other';
      signedTotals[category] = (signedTotals[category] || 0) + financialAmount(transaction.amount);
    });
    return Object.fromEntries(Object.entries(signedTotals).map(([category, amount]) => [category, Math.max(0, roundMoney(amount))]));
  }

  function proportionalSegments(entries, valueSelector = entry => entry[1]) {
    const normalized = (entries || []).map(entry => ({ entry, value:Math.max(0, financialAmount(valueSelector(entry))) })).filter(item => item.value > 0);
    const total = normalized.reduce((sum, item) => sum + item.value, 0);
    let cursor = 0;
    return normalized.map((item, index) => {
      const start = cursor;
      const end = index === normalized.length - 1 ? 100 : cursor + item.value / total * 100;
      cursor = end;
      return { entry:item.entry, value:item.value, start, end, percent:end - start };
    });
  }

  function chartDomain(values, options = {}) {
    const safeValues = (values || []).map(financialAmount).filter(Number.isFinite);
    const includeZero = options.includeZero !== false;
    const padding = Math.max(0, financialAmount(options.padding ?? 0.08));
    let min = safeValues.length ? Math.min(...safeValues) : 0;
    let max = safeValues.length ? Math.max(...safeValues) : 0;
    if (includeZero) { min = Math.min(0, min); max = Math.max(0, max); }
    if (min === max) {
      const fallback = Math.max(1, Math.abs(min) * 0.1);
      min -= includeZero && min >= 0 ? min : fallback;
      max += fallback;
    } else {
      const span = max - min;
      if (!includeZero || min < 0) min -= span * padding;
      max += span * padding;
    }
    return { min, max, span:Math.max(Number.EPSILON, max - min) };
  }

  function scaleChartValue(value, domain, size = 100, minimumVisible = 0) {
    const safeDomain = domain || chartDomain([value]);
    const safeSize = Math.max(0, financialAmount(size));
    const amount = financialAmount(value);
    const ratio = (amount - safeDomain.min) / Math.max(Number.EPSILON, safeDomain.span);
    const scaled = Math.max(0, Math.min(safeSize, ratio * safeSize));
    return amount === 0 ? 0 : Math.min(safeSize, Math.max(Math.max(0, financialAmount(minimumVisible)), scaled));
  }

  function cumulativeSpendingSeries(transactions, referenceValue, monthlyBudget = 0) {
    const reference = dateOnly(referenceValue);
    const year = reference.getUTCFullYear();
    const month = reference.getUTCMonth();
    const totalDays = daysInMonth(year, month);
    const throughDay = reference.getUTCDate();
    const prefix = monthPrefix(year, month);
    const daily = Array.from({ length:totalDays }, () => 0);
    (transactions || []).forEach(transaction => {
      if (!transaction || typeof transaction !== 'object') return;
      if (transactionType(transaction) !== 'expense') return;
      const date = String(transaction.date || '').slice(0, 10);
      if (!date.startsWith(prefix) || date > isoDate(reference)) return;
      const day = Number(date.slice(8, 10));
      if (day >= 1 && day <= totalDays) daily[day - 1] += financialAmount(transaction.amount);
    });
    let running = 0;
    const safeBudget = Math.max(0, financialAmount(monthlyBudget));
    return Array.from({ length:totalDays }, (_, index) => {
      running = Math.max(0, roundMoney(running + daily[index]));
      const day = index + 1;
      return { day, actual:day <= throughDay ? running : null, planned:safeBudget * day / totalDays };
    });
  }

  function monthPrefix(year, monthIndex) {
    const normalizedYear = year + Math.floor(monthIndex / 12);
    const normalizedMonth = ((monthIndex % 12) + 12) % 12;
    return `${normalizedYear}-${String(normalizedMonth + 1).padStart(2, '0')}`;
  }

  function monthOverMonthExpenses(transactions, referenceValue = new Date()) {
    const reference = dateOnly(referenceValue);
    const currentPrefix = monthPrefix(reference.getUTCFullYear(), reference.getUTCMonth());
    const previousPrefix = monthPrefix(reference.getUTCFullYear(), reference.getUTCMonth() - 1);
    const expenseTotal = prefix => (transactions || []).reduce((sum, transaction) => {
      if (transactionType(transaction) !== 'expense' || !String(transaction.date || '').startsWith(prefix)) return sum;
      return sum + financialAmount(transaction.amount);
    }, 0);
    const current = Math.max(0, roundMoney(expenseTotal(currentPrefix)));
    const previous = Math.max(0, roundMoney(expenseTotal(previousPrefix)));
    const change = current - previous;
    return {
      current,
      previous,
      change,
      percent: previous > 0 ? change / previous * 100 : null,
      direction: change > 0.005 ? 'up' : change < -0.005 ? 'down' : 'flat'
    };
  }

  function topExpenseCategory(transactions, timeframe = 'monthly', referenceValue = new Date()) {
    const totals = categoryExpenseTotals(transactions, timeframe, referenceValue);
    const expenseTotal = Object.values(totals).reduce((sum, amount) => sum + amount, 0);
    const result = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
    if (!result) return null;
    return { category: result[0], amount: result[1], share: expenseTotal ? result[1] / expenseTotal * 100 : 0 };
  }

  function groupCashflow(transactions, timeframe = 'monthly', referenceValue = new Date()) {
    const filtered = filterTransactions(transactions, timeframe, referenceValue);
    const normalized = timeframe === 'yearly' || timeframe === 'this-year' ? 'ytd' : timeframe;
    const grouped = {};
    filtered.forEach(transaction => {
      const date = String(transaction.date).slice(0, 10);
      const key = normalized === 'all' ? date.slice(0, 4) : normalized === 'ytd' ? date.slice(0, 7) : normalized === 'daily' ? date : date;
      if (!grouped[key]) grouped[key] = { key, income: 0, expenses: 0, net: 0 };
      const amount = financialAmount(transaction.amount);
      if (transactionType(transaction) === 'income') grouped[key].income += amount;
      else grouped[key].expenses += amount;
    });
    Object.values(grouped).forEach(item => {
      item.income = Math.max(0, roundMoney(item.income));
      item.expenses = Math.max(0, roundMoney(item.expenses));
      item.net = roundMoney(item.income - item.expenses);
    });
    return Object.values(grouped).sort((a, b) => a.key.localeCompare(b.key));
  }

  function csvEscape(value) {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }

  function monthlyExpenseCsv(profile, monthPrefix = new Date().toISOString().slice(0,7), currency = 'EUR') {
    const rows = [['Date', 'Description', 'Category', `Amount (${currency})`]];
    (profile.transactions || []).filter(tx => tx && transactionType(tx) === 'expense' && String(tx.date || '').startsWith(monthPrefix) && Number.isFinite(Number(tx.amount))).forEach(tx => rows.push([String(tx.date).slice(0, 10), tx.name || '', tx.category || 'other', Number(tx.amount).toFixed(2)]));
    const total = rows.slice(1).reduce((sum, row) => sum + Number(row[3]), 0);
    rows.push(['', 'TOTAL', '', total.toFixed(2)]);
    return rows.map(row => row.map(csvEscape).join(',')).join('\r\n');
  }

  function validateSavingsGoal(goal) {
    const name = String(goal?.name || '').trim();
    const target = Number(goal?.target);
    const current = Number(goal?.current);
    const dueDate = String(goal?.dueDate || '');
    if (!name) return { valid: false, reason: 'missing-name' };
    if (!Number.isFinite(target) || target <= 0) return { valid: false, reason: 'invalid-target' };
    if (!Number.isFinite(current) || current < 0) return { valid: false, reason: 'invalid-current' };
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return { valid: false, reason: 'invalid-date' };
    return { valid: true, reason: null, percent: Math.min(100, current / target * 100), remaining: Math.max(0, target - current) };
  }

  function applySavingsContribution(profile, goalId, amount, direction = 1) {
    const goal = (profile?.goalBuckets || []).find(item => item.id === goalId);
    const value = Number(amount) * Number(direction);
    if (!goal || !Number.isFinite(value) || value === 0 || goal.current + value < 0) return { valid: false, reason: 'invalid-contribution' };
    goal.current += value;
    profile.savingsBalance = (profile.goalBuckets || []).reduce((sum, item) => sum + Math.max(0, Number(item.current) || 0), 0);
    return { valid: true, goal, totalSavings: profile.savingsBalance };
  }

  return {
    clone,
    createAccountStore,
    calculateBudget,
    budgetSeverity,
    budgetThreshold,
    groupBudgetAlerts,
    assessExpenseImpact,
    daysInMonth,
    nextOccurrence,
    occurrencesBetween,
    validateCategoryLimit,
    transferBudgetAllocation,
    trimBudgetAllocation,
    transactionType,
    financialAmount,
    roundMoney,
    ratioPercent,
    stableTransactionHash,
    autoCategorizeBankTransaction,
    normalizeBankTransaction,
    importBankTransactions,
    filterTransactions,
    filterActivityTransactions,
    transactionTotals,
    calculateFinancials,
    FinancialEngine,
    categoryExpenseTotals,
    proportionalSegments,
    chartDomain,
    scaleChartValue,
    cumulativeSpendingSeries,
    monthOverMonthExpenses,
    topExpenseCategory,
    groupCashflow,
    monthlyExpenseCsv,
    validateSavingsGoal,
    applySavingsContribution,
    greetingFor
  };
});
