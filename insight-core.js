(function exposeMerInsights(root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./core.js') : root.MerCore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerInsights = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerInsights(Core) {
  'use strict';
  const list = value => Array.isArray(value) ? value : [];
  const money = value => Core.roundMoney(value);
  const cents = value => Math.round((Number(value) + Math.sign(Number(value)) * Number.EPSILON) * 100);
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const timeframeKey = value => ['yearly', 'this-year'].includes(value) ? 'ytd' : ['daily', 'monthly', 'ytd', 'all'].includes(value) ? value : 'monthly';
  const profileKey = (profile, options) => options.profileId || profile?.profileId || (profile?.accountLabel === 'businessAccount' ? 'business' : 'personal');
  const belongs = (item, id) => item && (!item.profileId || item.profileId === id);

  function referenceDay(value, timezone) {
    if (value instanceof Date && timezone && Number.isFinite(value.getTime())) {
      try {
        const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone:timezone, year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(value).map(part => [part.type, part.value]));
        return `${parts.year}-${parts.month}-${parts.day}`;
      } catch { return null; }
    }
    return Core.transactionDate({ date:value instanceof Date ? Number.isFinite(value.getTime()) ? value.toISOString() : '' : value });
  }

  // Match the central store's booked calendar-day semantics, including scheduled
  // transactions that become effective on their date. Do not infer future income.
  function records(profile, reference, options = {}) {
    const id = profileKey(profile, options);
    if (!reference || (profile?.profileId && profile.profileId !== id)) return [];
    return Core.filterTransactions(list(profile?.transactions), 'all', reference).filter(transaction =>
      belongs(transaction, id) && transaction.type !== 'transfer' && transaction.type !== 'savings' &&
      Number.isFinite(Number(transaction.amount)) && Number.isSafeInteger(cents(transaction.amount))
    );
  }

  function explicitBehavior(record) {
    if (['fixed', 'variable', 'flexible'].includes(record?.expenseBehavior)) return record.expenseBehavior === 'fixed' ? 'fixed' : 'variable';
    if (typeof record?.fixed === 'boolean') return record.fixed ? 'fixed' : 'variable';
    if (typeof record?.isFixed === 'boolean') return record.isFixed ? 'fixed' : 'variable';
    return null;
  }

  function classifyExpense(transaction, profile = {}, options = {}) {
    const id = profileKey(profile, options);
    const categoryId = String(transaction?.category || transaction?.categoryId || 'other');
    const category = list(profile.categories).find(item => belongs(item, id) && String(item.id) === categoryId);
    const transactionBehavior = explicitBehavior(transaction);
    if (transactionBehavior) return { behavior:transactionBehavior, reason:'transaction-override' };
    const categoryBehavior = explicitBehavior(category);
    if (categoryBehavior) return { behavior:categoryBehavior, reason:'category-override' };
    const name = normalize(transaction?.name || transaction?.merchant || transaction?.title || transaction?.rawDescription);
    const recurring = list(profile.recurring).find(rule => belongs(rule, id) && (
      transaction?.recurringId && String(rule.id) === String(transaction.recurringId) ||
      name && name === normalize(rule.name) && (!rule.category || rule.category === categoryId)
    ));
    if (recurring || transaction?.recurringId) return { behavior:'fixed', reason:'recurring' };
    const categoryText = normalize([categoryId, category?.name, category?.nameKey].filter(Boolean).join(' '));
    if (/\b(utilities|bills|housing|rent|insurance|subscriptions|rezije|stanovanje|najam|najamnina|osiguranje|pretplate)\b/.test(categoryText)) return { behavior:'fixed', reason:'category-rule' };
    if (/\b(hep|holding|vodovod|cistoca|najam|najamnina|rent|mortgage|hipoteka|insurance|osiguranje|internet|telemach|netflix|spotify|pretplata|subscription)\b|\bt com\b|\bhrvatski telekom\b/.test(name)) return { behavior:'fixed', reason:'merchant-rule' };
    return { behavior:'variable', reason:'default-variable' };
  }

  function growthPercent(current, previous) {
    return !Number.isFinite(current) || !Number.isFinite(previous) || previous === 0 ? null : money((current - previous) / Math.abs(previous) * 100);
  }

  function expenseStructure(profile, timeframe = 'monthly', referenceValue = new Date(), options = {}) {
    const reference = referenceDay(referenceValue, options.timezone);
    const canonical = timeframeKey(timeframe);
    const selected = reference ? Core.filterTransactions(records(profile, reference, options), canonical, reference).filter(transaction => Core.transactionType(transaction) === 'expense') : [];
    const grouped = new Map();
    let fixedCents = 0, variableCents = 0, hasCorrections = false;
    for (const transaction of selected) {
      const amount = cents(transaction.amount), classification = classifyExpense(transaction, profile, options);
      const categoryId = String(transaction.category || transaction.categoryId || 'other');
      const category = list(profile?.categories).find(item => belongs(item, profileKey(profile, options)) && String(item.id) === categoryId);
      const key = `${classification.behavior}:${categoryId}`;
      if (!grouped.has(key)) grouped.set(key, { categoryId, category:categoryId, label:String(category?.name || category?.nameKey || categoryId), behavior:classification.behavior, amountCents:0, count:0, reasons:new Set() });
      const bucket = grouped.get(key);
      bucket.amountCents += amount; bucket.count += 1; bucket.reasons.add(classification.reason);
      if (classification.behavior === 'fixed') fixedCents += amount;
      else variableCents += amount;
      hasCorrections ||= amount < 0;
    }
    const positiveTotal = Math.max(0, fixedCents) + Math.max(0, variableCents);
    const fixedShare = positiveTotal ? money(Math.max(0, fixedCents) / positiveTotal * 100) : 0;
    const variableShare = positiveTotal ? money(100 - fixedShare) : 0;
    const categoryPositiveTotal = [...grouped.values()].reduce((sum, category) => sum + Math.max(0, category.amountCents), 0);
    const categories = [...grouped.values()].map(({ amountCents, reasons, ...category }) => ({ ...category, amount:amountCents / 100, share:categoryPositiveTotal ? money(Math.max(0, amountCents) / categoryPositiveTotal * 100) : 0, reasons:[...reasons] })).sort((left, right) => right.amount - left.amount || left.categoryId.localeCompare(right.categoryId));
    return {
      timeframe:canonical, fixed:fixedCents / 100, variable:variableCents / 100, total:(fixedCents + variableCents) / 100,
      fixedShare, variableShare, categories, count:selected.length, hasCorrections,
      adjustedShares:fixedCents < 0 || variableCents < 0,
      classificationNote:'explicit-override-then-recurring-then-known-fixed-default-variable',
      shareDisclosure:fixedCents < 0 || variableCents < 0 ? 'positive-bucket-shares-after-refunds' : 'net-expense-shares',
      categoryShareDisclosure:[...grouped.values()].some(category => category.amountCents < 0) ? 'positive-category-shares-after-refunds' : 'net-expense-shares'
    };
  }

  function periodStart(timeframe, reference, all) {
    if (timeframe === 'daily') return reference;
    if (timeframe === 'monthly') return `${reference.slice(0, 7)}-01`;
    if (timeframe === 'ytd') return `${reference.slice(0, 4)}-01-01`;
    return all.length ? all.reduce((first, transaction) => Core.transactionDate(transaction) < first ? Core.transactionDate(transaction) : first, reference).slice(0, 7) + '-01' : `${reference.slice(0, 7)}-01`;
  }

  function bucketPlan(timeframe, start, reference) {
    if (timeframe === 'daily') return { granularity:'hour', keys:Array.from({ length:24 }, (_, hour) => `${reference}T${String(hour).padStart(2, '0')}:00`), key:transaction => `${reference}T${String(transaction.date).match(/T([01]\d|2[0-3]):/)?.[1] || '00'}:00` };
    if (timeframe === 'monthly') return { granularity:'day', keys:Array.from({ length:Number(reference.slice(8, 10)) }, (_, index) => `${reference.slice(0, 7)}-${String(index + 1).padStart(2, '0')}`), key:transaction => Core.transactionDate(transaction) };
    const startYear = Number(start.slice(0, 4)), endYear = Number(reference.slice(0, 4));
    const startMonth = startYear * 12 + Number(start.slice(5, 7)) - 1, endMonth = endYear * 12 + Number(reference.slice(5, 7)) - 1;
    if (endMonth - startMonth < 60) {
      return { granularity:'month', keys:Array.from({ length:endMonth - startMonth + 1 }, (_, index) => {
        const month = startMonth + index;
        return `${String(Math.floor(month / 12)).padStart(4, '0')}-${String(month % 12 + 1).padStart(2, '0')}`;
      }), key:transaction => Core.transactionDate(transaction).slice(0, 7) };
    }
    const yearSpan = Math.max(1, Math.ceil((endYear - startYear + 1) / 60));
    const key = year => {
      const first = startYear + Math.floor((year - startYear) / yearSpan) * yearSpan;
      return yearSpan === 1 ? String(first) : `${first}–${Math.min(endYear, first + yearSpan - 1)}`;
    };
    return { granularity:yearSpan === 1 ? 'year' : 'year-range', keys:Array.from({ length:Math.ceil((endYear - startYear + 1) / yearSpan) }, (_, index) => key(startYear + index * yearSpan)), key:transaction => key(Number(Core.transactionDate(transaction).slice(0, 4))) };
  }

  function transactionSeries(profile, timeframe = 'monthly', referenceValue = new Date(), options = {}) {
    const reference = referenceDay(referenceValue, options.timezone), canonical = timeframeKey(timeframe);
    const mismatch = profile?.profileId && profile.profileId !== profileKey(profile, options);
    const initial = mismatch ? 0 : Number(options.openingBalance ?? profile?.financialOpeningBalance ?? profile?.reactiveBalanceAnchor ?? 0);
    const anchor = Number.isFinite(initial) && Number.isSafeInteger(cents(initial)) ? cents(initial) : 0;
    const all = records(profile, reference, options);
    if (!reference) return { timeframe:canonical, granularity:'day', openingBalance:anchor / 100, closingBalance:anchor / 100, totals:{ income:0, expenses:0, net:0, count:0 }, series:[], disclosure:'cash-balance-not-net-worth', valid:false };
    const start = periodStart(canonical, reference, all), plan = bucketPlan(canonical, start, reference);
    const selected = Core.filterTransactions(all, canonical, reference), buckets = new Map(plan.keys.map(key => [key, { key, date:key, income:0, expenses:0, net:0, balance:0, count:0 }]));
    let opening = anchor;
    for (const transaction of all) if (Core.transactionDate(transaction) < start) opening += (Core.transactionType(transaction) === 'income' ? 1 : -1) * cents(transaction.amount);
    for (const transaction of selected) {
      const bucket = buckets.get(plan.key(transaction));
      if (!bucket) continue;
      bucket[Core.transactionType(transaction) === 'income' ? 'income' : 'expenses'] += cents(transaction.amount);
      bucket.count += 1;
    }
    let balance = opening, previous = null, income = 0, expenses = 0;
    const series = [...buckets.values()].map(bucket => {
      income += bucket.income; expenses += bucket.expenses;
      balance += bucket.income - bucket.expenses;
      const point = { ...bucket, income:bucket.income / 100, expenses:bucket.expenses / 100, net:(bucket.income - bucket.expenses) / 100, balance:balance / 100 };
      point.growth = {
        income:previous ? growthPercent(point.income, previous.income) : null,
        expenses:previous ? growthPercent(point.expenses, previous.expenses) : null,
        net:previous ? growthPercent(point.net, previous.net) : null,
        balance:growthPercent(point.balance, previous ? previous.balance : opening / 100)
      };
      previous = point;
      return point;
    });
    return {
      timeframe:canonical, granularity:plan.granularity, startDate:start, endDate:reference,
      openingBalance:opening / 100, closingBalance:balance / 100,
      totals:{ income:income / 100, expenses:expenses / 100, net:(income - expenses) / 100, count:selected.length },
      series, disclosure:'cash-balance-not-net-worth', valid:true
    };
  }

  function cumulativeSeries(profile, timeframe = 'monthly', referenceValue = new Date(), options = {}) {
    return transactionSeries(profile, timeframe, referenceValue, options);
  }

  function comparableRange(timeframe, reference) {
    if (timeframe === 'all') return null;
    const year = Number(reference.slice(0, 4)), month = Number(reference.slice(5, 7)), day = Number(reference.slice(8, 10));
    const iso = date => Core.transactionDate({ date:date.toISOString() });
    if (timeframe === 'daily') {
      const previous = new Date(`${reference}T12:00:00Z`);
      previous.setUTCDate(previous.getUTCDate() - 1);
      const date = iso(previous);
      return date ? { start:date, end:date } : null;
    }
    const previousYear = timeframe === 'ytd' || month === 1 ? year - 1 : year;
    const previousMonth = timeframe === 'ytd' ? month : month === 1 ? 12 : month - 1;
    const lastDay = new Date(Date.UTC(previousYear, previousMonth, 0)).getUTCDate();
    const end = Core.transactionDate({ date:`${String(previousYear).padStart(4, '0')}-${String(previousMonth).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}` });
    return end ? { start:timeframe === 'ytd' ? `${end.slice(0, 4)}-01-01` : `${end.slice(0, 7)}-01`, end } : null;
  }

  // Period comparisons use equal elapsed calendar ranges, not a partial current
  // month against an entire previous month. Corrections remain signed amounts.
  function metricBreakdown(profile, kind = 'income', timeframe = 'monthly', referenceValue = new Date(), options = {}) {
    const canonical = timeframeKey(timeframe), reference = referenceDay(referenceValue, options.timezone);
    const metric = kind === 'net' ? 'net' : ['expense', 'expenses'].includes(kind) ? 'expenses' : 'income';
    const id = profileKey(profile, options), mismatch = profile?.profileId && profile.profileId !== id;
    const invalid = reason => ({ kind:metric, timeframe:canonical, current:0, previous:null, change:null, growth:null, currentStart:null, currentEnd:reference, previousStart:null, previousEnd:null, count:0, previousCount:0, categories:[], hasCorrections:false, shareDisclosure:'nonnegative-category-shares', valid:false, error:reason });
    if (!reference || mismatch) return invalid(!reference ? 'invalid-reference' : 'profile-mismatch');
    const all = records(profile, reference, options);
    const start = periodStart(canonical, reference, all), prior = comparableRange(canonical, reference);
    const currentRecords = [], previousRecords = [], grouped = new Map();
    let current = 0, previous = 0, hasCorrections = false, safe = true;
    const collect = (transaction, period) => {
      const type = Core.transactionType(transaction);
      if (metric !== 'net' && type !== (metric === 'income' ? 'income' : 'expense')) return;
      const amount = cents(transaction.amount) * (metric === 'net' && type === 'expense' ? -1 : 1);
      const categoryId = String(transaction.category || transaction.categoryId || (type === 'income' ? 'otherIncome' : 'other'));
      const catalog = type === 'income' ? profile?.incomeCategories : profile?.categories;
      const category = list(catalog).find(item => belongs(item, id) && String(item.id) === categoryId);
      const key = `${type}:${categoryId}`;
      if (!grouped.has(key)) grouped.set(key, { categoryId, category:categoryId, label:String(category?.name || category?.nameKey || categoryId), customLabel:Boolean(category?.name), type, currentCents:0, previousCents:0, count:0, previousCount:0 });
      const row = grouped.get(key);
      if (period === 'current') {
        current += amount; row.currentCents += amount; row.count += 1; currentRecords.push(transaction);
      } else {
        previous += amount; row.previousCents += amount; row.previousCount += 1; previousRecords.push(transaction);
      }
      safe &&= [current, previous, row.currentCents, row.previousCents].every(Number.isSafeInteger);
      hasCorrections ||= Number(transaction.amount) < 0;
    };
    for (const transaction of all) {
      const date = Core.transactionDate(transaction);
      if (date >= start && date <= reference) collect(transaction, 'current');
      else if (prior && date >= prior.start && date <= prior.end) collect(transaction, 'previous');
    }
    if (!safe || !Number.isSafeInteger(current - previous) || [...grouped.values()].some(row => !Number.isSafeInteger(row.currentCents - row.previousCents))) return invalid('amount-overflow');
    const positive = [...grouped.values()].reduce((sum, row) => sum + Math.max(0, row.currentCents), 0);
    if (!Number.isSafeInteger(positive)) return invalid('amount-overflow');
    const categories = [...grouped.values()].map(({ currentCents, previousCents, ...row }) => ({
      ...row, amount:currentCents / 100, current:currentCents / 100,
      previous:prior ? previousCents / 100 : null, change:prior ? (currentCents - previousCents) / 100 : null,
      growth:prior ? growthPercent(currentCents, previousCents) : null,
      share:positive ? money(Math.max(0, currentCents) / positive * 100) : 0
    })).sort((left, right) => right.amount - left.amount || left.categoryId.localeCompare(right.categoryId) || left.type.localeCompare(right.type));
    return {
      kind:metric, timeframe:canonical, current:current / 100, previous:prior ? previous / 100 : null,
      change:prior ? (current - previous) / 100 : null, growth:prior ? growthPercent(current, previous) : null,
      currentStart:start, currentEnd:reference, previousStart:prior?.start || null, previousEnd:prior?.end || null,
      count:currentRecords.length, previousCount:previousRecords.length, categories, hasCorrections,
      shareDisclosure:categories.some(row => row.amount < 0) ? 'positive-category-shares-after-corrections' : 'nonnegative-category-shares', valid:true
    };
  }

  return Object.freeze({ classifyExpense, expenseStructure, growthPercent, transactionSeries, cumulativeSeries, metricBreakdown });
});
