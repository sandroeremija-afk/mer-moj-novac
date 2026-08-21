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
      spentPercent: monthlyBudget ? spent / monthlyBudget * 100 : 100
    };
  }

  function budgetThreshold(spent, limit) {
    const safeLimit = Number(limit) || 0;
    const percent = safeLimit > 0 ? Number(spent || 0) / safeLimit * 100 : 100;
    return {
      percent,
      level: percent >= 100 ? 'red' : percent >= 80 ? 'yellow' : 'green',
      warning: percent >= 100 ? 'exceeded' : percent >= 80 ? 'near' : null
    };
  }

  function daysInMonth(year, monthIndex) {
    return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  }

  function dateOnly(value) {
    if (value instanceof Date) return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) throw new Error('Invalid ISO date');
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
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
    const from = dateOnly(fromValue);
    const start = rule.startDate ? dateOnly(rule.startDate) : new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
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
    const through = dateOnly(throughInclusiveValue);
    const dates = [];
    let cursor = dateOnly(fromExclusiveValue);
    for (let index = 0; index < max; index += 1) {
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

  function transactionType(transaction) {
    return transaction && transaction.type === 'income' ? 'income' : 'expense';
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
    const descriptor = String(rawTransaction?.description || rawTransaction?.merchantName || rawTransaction?.remittanceInformationUnstructured || '').toLocaleLowerCase('en');
    const expenseIds = new Set((profile?.categories || []).map(category => category.id));
    const incomeIds = new Set((profile?.incomeCategories || []).map(category => category.id));
    const pickExpense = (...ids) => ids.find(id => expenseIds.has(id));
    const pickIncome = (...ids) => ids.find(id => incomeIds.has(id));

    if (isIncome) {
      if (/pla[cć]a|salary|payroll|wage/.test(descriptor)) return { category: pickIncome('salary') || 'otherIncome', confidence: 'rule', rule: 'salary' };
      if (/upwork|freelance|invoice|client payment|honorar/.test(descriptor)) return { category: pickIncome('freelance') || 'otherIncome', confidence: 'rule', rule: 'freelance' };
      if (/gift|dar|poklon/.test(descriptor)) return { category: pickIncome('gift') || 'otherIncome', confidence: 'rule', rule: 'gift' };
      return { category: pickIncome('otherIncome') || (profile?.incomeCategories?.[0]?.id ?? 'otherIncome'), confidence: 'fallback', rule: null };
    }

    if (/uber|bolt|zet|ina|petrol|fuel|taxi|autobus|tramvaj/.test(descriptor)) return { category: pickExpense('transport', 'travel', 'other') || profile?.categories?.[0]?.id, confidence: 'rule', rule: 'transport' };
    if (/konzum|lidl|spar|supermarket|\bmarket\b|restaurant|restoran|wolt|glovo|pekara/.test(descriptor)) return { category: pickExpense('food', 'other') || profile?.categories?.[0]?.id, confidence: 'rule', rule: 'food' };
    if (/netflix|spotify|cinema|kino|steam|playstation/.test(descriptor)) return { category: pickExpense('entertainment', 'software', 'other') || profile?.categories?.[0]?.id, confidence: 'rule', rule: 'entertainment' };
    if (/amazon|h&m|dm |zara|shop|store|trgovina/.test(descriptor)) return { category: pickExpense('shopping', 'office', 'other') || profile?.categories?.[0]?.id, confidence: 'rule', rule: 'shopping' };
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
      needsReview: category.confidence === 'fallback'
    };
  }

  function importBankTransactions(profile, connection, rawTransactions) {
    if (!profile || !connection || !Array.isArray(rawTransactions)) return { imported: [], duplicates: 0, invalid: rawTransactions?.length || 0, uncategorized: 0 };
    profile.transactions = profile.transactions || [];
    const knownIds = new Set(profile.transactions.flatMap(transaction => [transaction.bankTransactionId, transaction.importHash].filter(Boolean)));
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
    const reference = dateOnly(referenceValue);
    const referenceIso = isoDate(reference);
    const monthPrefix = referenceIso.slice(0, 7);
    const yearPrefix = referenceIso.slice(0, 4);
    const normalized = timeframe === 'yearly' || timeframe === 'this-year' ? 'ytd' : timeframe;
    return (transactions || []).filter(transaction => {
      const date = String(transaction.date || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
      if (normalized === 'daily') return date === referenceIso;
      if (normalized === 'monthly') return date.startsWith(monthPrefix) && date <= referenceIso;
      if (normalized === 'ytd') return date.startsWith(yearPrefix) && date <= referenceIso;
      return normalized === 'all';
    });
  }

  function transactionTotals(transactions, timeframe = 'monthly', referenceValue = new Date()) {
    const filtered = filterTransactions(transactions, timeframe, referenceValue);
    const totals = filtered.reduce((result, transaction) => {
      const amount = Math.max(0, Number(transaction.amount) || 0);
      if (transactionType(transaction) === 'income') result.income += amount;
      else result.expenses += amount;
      return result;
    }, { income: 0, expenses: 0 });
    totals.net = totals.income - totals.expenses;
    totals.savingsRate = totals.income > 0 ? totals.net / totals.income * 100 : null;
    totals.count = filtered.length;
    return totals;
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
      return sum + Math.max(0, Number(transaction.amount) || 0);
    }, 0);
    const current = expenseTotal(currentPrefix);
    const previous = expenseTotal(previousPrefix);
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
    const totals = {};
    let expenseTotal = 0;
    filterTransactions(transactions, timeframe, referenceValue).forEach(transaction => {
      if (transactionType(transaction) !== 'expense') return;
      const amount = Math.max(0, Number(transaction.amount) || 0);
      const category = transaction.category || 'other';
      totals[category] = (totals[category] || 0) + amount;
      expenseTotal += amount;
    });
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
      const amount = Math.max(0, Number(transaction.amount) || 0);
      if (transactionType(transaction) === 'income') grouped[key].income += amount;
      else grouped[key].expenses += amount;
      grouped[key].net = grouped[key].income - grouped[key].expenses;
    });
    return Object.values(grouped).sort((a, b) => a.key.localeCompare(b.key));
  }

  function csvEscape(value) {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }

  function monthlyExpenseCsv(profile, monthPrefix = '2026-08') {
    const rows = [['Date', 'Description', 'Category', 'Amount (EUR)']];
    (profile.transactions || []).filter(tx => transactionType(tx) === 'expense' && String(tx.date).startsWith(monthPrefix)).forEach(tx => rows.push([String(tx.date).slice(0, 10), tx.name, tx.category, Number(tx.amount).toFixed(2)]));
    const total = rows.slice(1).reduce((sum, row) => sum + Number(row[3]), 0);
    rows.push(['', 'TOTAL', '', total.toFixed(2)]);
    return rows.map(row => row.map(csvEscape).join(',')).join('\r\n');
  }

  return {
    clone,
    createAccountStore,
    calculateBudget,
    budgetThreshold,
    daysInMonth,
    nextOccurrence,
    occurrencesBetween,
    validateCategoryLimit,
    transactionType,
    stableTransactionHash,
    autoCategorizeBankTransaction,
    normalizeBankTransaction,
    importBankTransactions,
    filterTransactions,
    transactionTotals,
    monthOverMonthExpenses,
    topExpenseCategory,
    groupCashflow,
    monthlyExpenseCsv
  };
});
