(function exposeMerEnterpriseCore(root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./core.js') : root.MerCore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerEnterpriseCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerEnterpriseCore(MerCore) {
  'use strict';
  const DAY = 86400000;
  const MAX_CENTS = 100000000000000;
  const cents = value => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(-MAX_CENTS, Math.min(MAX_CENTS, Math.round((number + Math.sign(number) * Number.EPSILON) * 100))) : 0;
  };
  const positive = value => Math.max(0, cents(value));
  const list = value => Array.isArray(value) ? value : [];
  const iso = value => MerCore.transactionDate({ date:value instanceof Date ? Number.isFinite(value.getTime()) ? value.toISOString() : '' : value });
  const dayNumber = value => Date.parse(`${value}T00:00:00Z`) / DAY;
  const addDays = (date, days) => new Date((dayNumber(date) + days) * DAY).toISOString().slice(0, 10);
  const referenceDay = value => iso(value || new Date()) || new Date().toISOString().slice(0, 10);
  const profileKey = (profile, options = {}) => options.profileId || profile?.profileId || (profile?.accountLabel === 'businessAccount' ? 'business' : 'personal');
  const sameProfile = (item, key) => item && (!item.profileId || item.profileId === key);
  const merchantKey = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\b(pos|card|payment|placanje|kartica)\b/g, ' ').replace(/\b\d{3,}\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
  const monthNumber = date => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7));
  const median = values => { const sorted = [...values].sort((a, b) => a - b); return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0; };

  // Import IDs/hashes are stable across retries. The last record wins so edits are respected.
  function transactionsFor(profile, reference, options = {}, includeFuture = false) {
    const key = profileKey(profile, options), seen = new Map();
    if (profile?.profileId && profile.profileId !== key) return [];
    list(profile?.transactions).forEach((tx, index) => {
      const date = iso(tx?.date);
      if (!sameProfile(tx, key) || tx.offlineDraft === true || tx.status === 'draft' || !date || (!includeFuture && date > reference) || !Number.isFinite(Number(tx.amount))) return;
      const identity = tx.importHash ? `import:${tx.importHash}` : tx.bankTransactionId ? `bank:${tx.bankConnectionId || ''}:${tx.bankTransactionId}` : tx.id ? `id:${tx.id}` : `row:${index}`;
      seen.set(identity, { ...tx, date, amountCents:cents(tx.amount) });
    });
    return [...seen.values()];
  }

  function recurringPatterns(profile, referenceValue, options = {}) {
    const reference = referenceDay(referenceValue), start = addDays(reference, -89), groups = new Map();
    transactionsFor(profile, reference, options).filter(tx => tx.type !== 'income' && tx.amountCents > 0 && tx.date >= start).forEach(tx => {
      const merchant = merchantKey(tx.merchantName || tx.title || tx.name);
      if (!merchant) return;
      // Demo/migrated monthly summaries represent many purchases, not one recurring vendor.
      if (tx.isAggregate === true || /^(prethodni (mjesecni|poslovni) troskovi|historical monthly expenses)$/.test(merchant)) return;
      const key = `${merchant}|${tx.currency || options.currency || 'EUR'}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(tx);
    });
    const patterns = [];
    groups.forEach((rows, key) => {
      rows.sort((a, b) => a.date.localeCompare(b.date));
      const monthly = new Map();
      rows.forEach(tx => { const month = tx.date.slice(0, 7); if (!monthly.has(month)) monthly.set(month, []); monthly.get(month).push(tx); });
      // Frequent shopping is not a subscription: exactly one charge in each observed month.
      if (monthly.size < 2 || [...monthly.values()].some(items => items.length !== 1)) return;
      const gaps = rows.slice(1).map((tx, index) => dayNumber(tx.date) - dayNumber(rows[index].date));
      if (gaps.some(gap => gap < 21 || gap > 40) || rows.slice(1).some((tx, index) => monthNumber(tx.date) - monthNumber(rows[index].date) !== 1)) return;
      const latest = rows[rows.length - 1], previous = rows[rows.length - 2];
      if (dayNumber(reference) - dayNumber(latest.date) > 40) return;
      const typical = median(rows.map(tx => tx.amountCents));
      if (Math.max(...rows.map(tx => tx.amountCents)) > Math.min(...rows.map(tx => tx.amountCents)) * 2) return;
      const latestDay = Number(latest.date.slice(8, 10));
      const allMonthEnd = rows.every(tx => Number(tx.date.slice(8, 10)) >= MerCore.daysInMonth(Number(tx.date.slice(0, 4)), Number(tx.date.slice(5, 7)) - 1) - 1);
      const day = allMonthEnd ? 31 : latestDay;
      const nextDate = MerCore.nextOccurrence({ day, enabled:true }, reference, false);
      const increaseCents = Math.max(0, latest.amountCents - previous.amountCents);
      patterns.push({
        id:`pattern-${MerCore.stableTransactionHash(key)}`, merchant:latest.merchantName || latest.title || latest.name,
        merchantKey:key.split('|')[0], categoryId:latest.category || latest.categoryId || 'other', currency:latest.currency || options.currency || 'EUR',
        amountCents:latest.amountCents, typicalCents:typical, previousCents:previous.amountCents,
        increaseCents, increasePercent:previous.amountCents ? Math.round(increaseCents / previous.amountCents * 10000) / 100 : 0,
        count:rows.length, day, nextDate, confidence:rows.length >= 3 ? 'high' : 'medium', lastDate:latest.date
      });
    });
    return patterns.sort((a, b) => b.amountCents - a.amountCents);
  }

  function subscriptionRadar(profile, reference, options = {}) {
    return recurringPatterns(profile, reference, options).map(pattern => ({ ...pattern, priceHike:pattern.increaseCents > 0, inferred:true }));
  }

  function forecastCashFlow(profile, referenceValue, options = {}) {
    const reference = referenceDay(referenceValue), key = profileKey(profile, options), through = addDays(reference, 30);
    const currency = String(options.currency || profile?.currency || 'EUR').toUpperCase();
    const posted = transactionsFor(profile, reference, options).filter(tx => !tx.currency || tx.currency === currency);
    const foreignCurrencyCount = transactionsFor(profile, reference, options).filter(tx => tx.currency && tx.currency !== currency).length;
    const incomeCents = posted.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amountCents, 0);
    const expenseCents = posted.filter(tx => tx.type !== 'income').reduce((sum, tx) => sum + tx.amountCents, 0);
    const reservedCents = list(profile?.goalBuckets).filter(goal => sameProfile(goal, key)).reduce((sum, goal) => sum + positive(goal.current), 0);
    const hasOpening = Number.isFinite(Number(profile?.financialOpeningBalance));
    // MerCore's available balance already subtracts goal balances. Never subtract reserves twice.
    const availableCents = hasOpening ? cents(profile.financialOpeningBalance) + incomeCents - expenseCents - reservedCents : cents(profile?.availableBalance);
    const patterns = recurringPatterns(profile, reference, options).filter(pattern => pattern.currency === currency);
    const bills = [], addBill = bill => { if (bill.date > reference && bill.date <= through) bills.push(bill); };
    const scheduled = transactionsFor(profile, reference, options, true).filter(tx => tx.date > reference && tx.type !== 'income' && tx.amountCents > 0 && (!tx.currency || tx.currency === currency));
    scheduled.forEach(tx => addBill({ id:`scheduled-${tx.id}`, merchant:tx.title || tx.name || 'Planirana uplata', merchantKey:merchantKey(tx.merchantName || tx.title || tx.name), date:tx.date, amountCents:tx.amountCents, source:'scheduled', confidence:'confirmed' }));
    const recurring = list(profile?.recurring).filter(rule => rule?.enabled !== false && sameProfile(rule, key) && positive(rule.amount) > 0 && (!rule.currency || rule.currency === currency));
    recurring.forEach(rule => {
      MerCore.occurrencesBetween(rule, reference, through, 2).forEach(date => {
        const merchant = merchantKey(rule.name || rule.title);
        if (!bills.some(bill => bill.merchantKey === merchant && Math.abs(dayNumber(bill.date) - dayNumber(date)) <= 3)) addBill({ id:`rule-${rule.id}-${date}`, merchant:rule.name || rule.title, merchantKey:merchant, date, amountCents:positive(rule.amount), source:'rule', confidence:'confirmed' });
      });
    });
    patterns.forEach(pattern => {
      if (!bills.some(bill => bill.merchantKey === pattern.merchantKey && Math.abs(dayNumber(bill.date) - dayNumber(pattern.nextDate)) <= 7)) addBill({ id:pattern.id, merchant:pattern.merchant, merchantKey:pattern.merchantKey, date:pattern.nextDate, amountCents:pattern.amountCents, source:'pattern', confidence:pattern.confidence });
    });
    bills.sort((a, b) => a.date.localeCompare(b.date));
    const predictedBillsCents = bills.reduce((sum, bill) => sum + bill.amountCents, 0);
    const safeToSpendCents = availableCents - predictedBillsCents;
    const daysRemaining = MerCore.daysInMonth(Number(reference.slice(0, 4)), Number(reference.slice(5, 7)) - 1) - Number(reference.slice(8, 10)) + 1;
    let rolling = availableCents;
    const series = [{ date:reference, balanceCents:availableCents }];
    for (let index = 1; index <= 30; index += 1) {
      const date = addDays(reference, index);
      rolling -= bills.filter(bill => bill.date === date).reduce((sum, bill) => sum + bill.amountCents, 0);
      series.push({ date, balanceCents:rolling });
    }
    const recent = posted.filter(tx => tx.date >= addDays(reference, -29));
    const recentExpenses = recent.filter(tx => tx.type !== 'income').reduce((sum, tx) => sum + tx.amountCents, 0);
    return { profileId:key, referenceDate:reference, throughDate:through, currency, availableCents, incomeCents, expenseCents, reservedCents, predictedBillsCents, safeToSpendCents, dailySafeCents:Math.floor(safeToSpendCents / 30), daysRemaining, horizonDays:30, bills, patterns, radar:subscriptionRadar(profile, reference, options).filter(item => item.currency === currency), series, confidence:patterns.length ? 'estimated' : 'limited-history', foreignCurrencyCount, health:safeToSpendCents <= 0 || recentExpenses > Math.max(0, availableCents) ? 'amber' : 'emerald' };
  }

  function simulatePurchase(profile, purchaseAmount, referenceValue, options = {}) {
    const number = Number(purchaseAmount);
    if (!Number.isFinite(number) || number < 0 || number * 100 > MAX_CENTS) return { valid:false, reason:'invalid-amount' };
    const forecast = forecastCashFlow(profile, referenceValue, options), purchaseCents = cents(number);
    const monthlyContributionCents = positive(options.monthlyContribution ?? profile?.savingsTarget);
    const goals = list(profile?.goalBuckets).filter(goal => sameProfile(goal, forecast.profileId));
    const weights = goals.map(goal => Math.max(0, positive(goal.target) - positive(goal.current)));
    const totalRemaining = weights.reduce((sum, value) => sum + value, 0);
    const freeCashCents = Math.max(0, forecast.safeToSpendCents);
    const divertedSavingsCents = Math.max(0, purchaseCents - freeCashCents);
    const simulatedGoals = goals.map((goal, index) => {
      const remainingCents = weights[index], share = totalRemaining ? remainingCents / totalRemaining : 0;
      const contributionCents = Math.floor(monthlyContributionCents * share);
      const divertedCents = Math.round(divertedSavingsCents * share);
      const monthsBefore = remainingCents === 0 ? 0 : contributionCents ? Math.ceil(remainingCents / contributionCents) : null;
      const monthsAfter = remainingCents === 0 ? 0 : contributionCents ? Math.ceil((remainingCents + divertedCents) / contributionCents) : null;
      const estimated = months => months === null || months > 1200 ? null : addDays(forecast.referenceDate, Math.ceil(months * 365.25 / 12));
      return { goalId:goal.id, name:goal.name, remainingCents, monthlyContributionCents:contributionCents, monthsBefore, monthsAfter, delayMonths:monthsBefore === null || monthsAfter === null ? null : monthsAfter - monthsBefore, originalDate:estimated(monthsBefore), simulatedDate:estimated(monthsAfter) };
    });
    return { valid:true, purchaseCents, safeBeforeCents:forecast.safeToSpendCents, safeAfterCents:forecast.safeToSpendCents - purchaseCents, divertedSavingsCents, goals:simulatedGoals, assumption:'Purchase first uses uncommitted cash; the remainder defers planned savings contributions proportionally across unfinished goals.' };
  }

  function validatePaydayRule(rule, profile) {
    if (!rule || !Number.isFinite(Number(rule.minimumAmount)) || Number(rule.minimumAmount) < 0) return { valid:false, reason:'invalid-threshold' };
    if (rule.startDate && !iso(rule.startDate)) return { valid:false, reason:'invalid-date' };
    const allocations = list(rule.allocations), ids = new Set();
    if (!allocations.length) return { valid:false, reason:'missing-allocations' };
    for (const allocation of allocations) {
      if (!list(profile?.goalBuckets).some(goal => goal.id === allocation.goalId && sameProfile(goal, profileKey(profile))) || ids.has(allocation.goalId)) return { valid:false, reason:'invalid-goal' };
      ids.add(allocation.goalId);
      if (!Number.isFinite(Number(allocation.percent)) || Number(allocation.percent) <= 0 || Number(allocation.percent) > 100) return { valid:false, reason:'invalid-percent' };
    }
    const totalPercent = allocations.reduce((sum, allocation) => sum + Number(allocation.percent), 0);
    return { valid:totalPercent <= 100, reason:totalPercent > 100 ? 'over-allocation' : null, totalPercent };
  }

  function reconcileAutomations(profile, referenceValue, options = {}) {
    if (!profile || typeof profile !== 'object') return { changed:false, allocations:0, totalCents:0 };
    const reference = referenceDay(referenceValue), key = profileKey(profile, options);
    if (profile.profileId && profile.profileId !== key) return { changed:false, allocations:0, totalCents:0 };
    const enterprise = profile.enterprise || {}, rules = list(enterprise.paydayRules).filter(rule => rule?.enabled !== false && validatePaydayRule(rule, profile).valid);
    const taxEnabled = key === 'business' && enterprise.taxVault?.enabled === true;
    const taxGoalId = 'enterprise-tax-vault-business';
    const rate = 25;
    const baseCurrency = /^[A-Z]{3}$/.test(options.currency || profile.currency || '') ? options.currency || profile.currency : 'EUR';
    let configurationChanged = false;
    // A display-preference change must never reverse a previously funded allocation.
    // Bind each automation to its original currency; there is no implicit FX conversion.
    rules.forEach(rule => { if (!/^[A-Z]{3}$/.test(rule.currency || '')) { rule.currency = baseCurrency; configurationChanged = true; } });
    if (taxEnabled && !/^[A-Z]{3}$/.test(enterprise.taxVault.currency || '')) { enterprise.taxVault.currency = baseCurrency; configurationChanged = true; }
    const previous = list(profile.savingsEntries).filter(entry => entry?.sourceType === 'enterprise-automation' && entry.profileId === key);
    const manual = list(profile.savingsEntries).filter(entry => !previous.includes(entry));
    const desired = [];
    const incomes = transactionsFor(profile, reference, options).filter(tx => tx.type === 'income' && tx.amountCents > 0);
    const entry = (tx, kind, goalId, amountCents) => ({ id:`enterprise:${key}:${kind}:${tx.id || tx.importHash}:${goalId}`, profileId:key, transactionId:tx.id, currency:tx.currency || baseCurrency, sourceType:'enterprise-automation', source:'Automation', automationKind:kind, goalId, amount:amountCents / 100, date:`${tx.date}T12:00:00`, note:kind === 'tax' ? 'PDV pričuva iz B2B uplate (25% neto)' : 'Automatska raspodjela prihoda', locked:true });
    incomes.forEach(tx => {
      let remaining = tx.amountCents;
      if (taxEnabled && tx.isB2B === true && (!tx.currency || tx.currency === enterprise.taxVault.currency) && (!enterprise.taxVault.startDate || tx.date >= enterprise.taxVault.startDate)) {
        const tax = Math.round(tx.amountCents * rate / (100 + rate));
        if (tax) { desired.push(entry(tx, 'tax', taxGoalId, tax)); remaining -= tax; }
      }
      rules.forEach(rule => {
        if ((tx.currency && tx.currency !== rule.currency) || tx.amountCents <= positive(rule.minimumAmount) || (rule.startDate && tx.date < rule.startDate)) return;
        rule.allocations.forEach(allocation => {
          const amount = Math.min(remaining, Math.round(tx.amountCents * Number(allocation.percent) / 100));
          if (amount > 0) { desired.push(entry(tx, `payday-${rule.id}`, allocation.goalId, amount)); remaining -= amount; }
        });
      });
    });
    const previousTotals = {}, desiredTotals = {};
    previous.forEach(item => { previousTotals[item.goalId] = (previousTotals[item.goalId] || 0) + positive(item.amount); });
    desired.forEach(item => { desiredTotals[item.goalId] = (desiredTotals[item.goalId] || 0) + positive(item.amount); });
    let changed = configurationChanged || JSON.stringify(previous) !== JSON.stringify(desired);
    profile.goalBuckets = list(profile.goalBuckets);
    if (desiredTotals[taxGoalId] && !profile.goalBuckets.some(goal => goal.id === taxGoalId)) {
      profile.goalBuckets.push({ id:taxGoalId, profileId:key, name:'Porezni trezor', current:0, target:desiredTotals[taxGoalId] / 100, primary:false, roundUpsEnabled:false, taxVault:true });
      changed = true;
    }
    profile.goalBuckets.forEach(goal => {
      if (!sameProfile(goal, key)) return;
      const delta = (desiredTotals[goal.id] || 0) - (previousTotals[goal.id] || 0);
      if (delta) { goal.current = Math.max(0, positive(goal.current) + delta) / 100; changed = true; }
      if (goal.id === taxGoalId) goal.target = Math.max(1, positive(goal.current) / 100);
    });
    if (changed) profile.savingsEntries = [...manual, ...desired];
    return { changed, allocations:desired.length, totalCents:desired.reduce((sum, item) => sum + positive(item.amount), 0), taxReservedCents:desiredTotals[taxGoalId] || 0 };
  }

  function anonymizedForecast(forecast) {
    return { currency:forecast.currency, horizonDays:30, availableCents:forecast.availableCents, safeToSpendCents:forecast.safeToSpendCents, predictedBillsCents:forecast.predictedBillsCents, reservedCents:forecast.reservedCents,
      patterns:list(forecast.patterns).slice(0, 30).map((pattern, index) => ({ pattern:index + 1, amountCents:pattern.amountCents, previousCents:pattern.previousCents, observations:pattern.count, daysUntil:Math.max(0, dayNumber(pattern.nextDate) - dayNumber(forecast.referenceDate)), confidence:pattern.confidence })),
      scheduled:list(forecast.bills).filter(bill => bill.source !== 'pattern').slice(0, 30).map(bill => ({ amountCents:bill.amountCents, daysUntil:Math.max(0, dayNumber(bill.date) - dayNumber(forecast.referenceDate)) })) };
  }

  return Object.freeze({ cents, transactionsFor, recurringPatterns, subscriptionRadar, forecastCashFlow, simulatePurchase, validatePaydayRule, reconcileAutomations, anonymizedForecast });
});
