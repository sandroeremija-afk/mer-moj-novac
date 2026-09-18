(function exposeMerAnomalies(root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./core.js') : root.MerCore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerAnomalies = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerAnomalies(Core) {
  'use strict';
  const DAY = 86400000;
  const MAX_AMOUNT = 1e12;
  const list = value => Array.isArray(value) ? value : [];
  const currencyCode = value => typeof value === 'string' && /^[A-Z]{3}$/.test(value.toUpperCase()) ? value.toUpperCase() : '';
  const label = value => typeof value === 'string' ? value.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 80) : '';
  const day = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Core.transactionDate({date:value}) === value ? value : null;
  const addDays = (value, count) => new Date(Date.parse(`${value}T00:00:00Z`) + count * DAY).toISOString().slice(0, 10);
  const cents = value => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= MAX_AMOUNT ? Math.round((value + Math.sign(value) * Number.EPSILON) * 100) : null;
  const sameProfile = (record, profileId) => record && (!record.profileId || record.profileId === profileId);

  function referenceDay(value, timezone) {
    if (!(value instanceof Date)) return day(value);
    if (!Number.isFinite(value.getTime())) return null;
    if (!timezone) return day(value.toISOString().slice(0, 10));
    try {
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(value).map(part => [part.type,part.value]));
      return day(`${parts.year}-${parts.month}-${parts.day}`);
    } catch { return null; }
  }

  function detect(profile, referenceValue = new Date(), options = {}) {
    const profileId = options.profileId || profile?.profileId || (profile?.accountLabel === 'businessAccount' ? 'business' : 'personal');
    const currency = currencyCode(options.currency || profile?.currency || 'EUR');
    const referenceDate = referenceDay(referenceValue, options.timezone);
    const result = {profileId,currency,referenceDate,currentStart:null,currentEnd:referenceDate,baselineStart:null,baselineEnd:null,hasHistory:false,categories:[],anomalies:[]};
    if (!referenceDate || !currency || !profile || profile.profileId && profile.profileId !== profileId) return result;
    result.currentStart = addDays(referenceDate, -6);
    result.baselineEnd = addDays(referenceDate, -7);
    result.baselineStart = addDays(referenceDate, -34);
    const seen = new Map();
    list(profile.transactions).forEach((transaction, index) => {
      if (!transaction || typeof transaction !== 'object' || Array.isArray(transaction) || !sameProfile(transaction, profileId)) return;
      const identity = transaction.importHash ? `import:${transaction.importHash}` : transaction.bankTransactionId ? `bank:${transaction.connectionId || transaction.bankConnectionId || ''}:${transaction.bankTransactionId}` : transaction.id ? `id:${transaction.id}` : `row:${index}`;
      seen.set(identity, transaction);
    });
    // Deduplicate before eligibility: a later correction can invalidate a formerly
    // booked record, including its currency, date and contribution to history.
    const rows = [...seen.values()].flatMap(transaction => {
      if (transaction.offlineDraft === true || ['draft','cancelled','canceled','rejected','failed'].includes(transaction.status) || transaction.status === 'pending' && transaction.scheduled !== true) return [];
      if (transaction.type && !['income','expense'].includes(transaction.type)) return [];
      if (currencyCode(transaction.currency || profile.currency || currency) !== currency) return [];
      const date = Core.transactionDate(transaction), amountCents = cents(transaction.amount);
      return !date || date > referenceDate || amountCents === null ? [] : [{...transaction,date,amountCents}];
    });
    // An older booked record establishes that all 28 baseline days are observed.
    // Missing category weeks then count as zero; a newly started ledger does not.
    result.hasHistory = rows.some(transaction => transaction.date <= result.baselineStart);
    const groups = new Map();
    rows.forEach(transaction => {
      if (Core.transactionType(transaction) !== 'expense' || transaction.date < result.baselineStart) return;
      const categoryId = String(transaction.category || transaction.categoryId || 'other');
      if (!groups.has(categoryId)) groups.set(categoryId, {categoryId,currentCents:0,baselineCents:0,valid:true});
      const group = groups.get(categoryId), key = transaction.date >= result.currentStart ? 'currentCents' : 'baselineCents';
      group[key] += transaction.amountCents;
      if (!Number.isSafeInteger(group[key]) || Math.abs(group[key]) > MAX_AMOUNT * 100) group.valid = false;
    });
    result.categories = [...groups.values()].filter(group => group.valid).map(group => {
      const category = list(profile.categories).find(item => sameProfile(item, profileId) && String(item.id) === group.categoryId);
      const current = group.currentCents / 100, average = group.baselineCents / 400;
      // Compare integer cents before rounding the four-week mean or percentage.
      const flagged = result.hasHistory && group.baselineCents > 0 && BigInt(group.currentCents) * 40n >= BigInt(group.baselineCents) * 13n;
      return {categoryId:group.categoryId,category:label(category?.name || category?.nameKey || group.categoryId),current,average,delta:current-average,growthPercent:group.baselineCents > 0 ? (group.currentCents * 4 / group.baselineCents - 1) * 100 : null,flagged};
    }).sort((left,right) => right.delta-left.delta || left.categoryId.localeCompare(right.categoryId));
    result.anomalies = result.categories.filter(category => category.flagged);
    return result;
  }

  // Only compact aggregate facts cross the AI boundary. Names remain untrusted
  // data, dates must form the exact comparison windows, derived values are rebuilt.
  function sanitizeAnomalies(value, currency) {
    if (!currencyCode(currency)) return [];
    return list(value).slice(0, 5).flatMap(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item) || currencyCode(item.currency) !== currency) return [];
      const category = label(item.category), currentStart = day(item.currentStart), currentEnd = day(item.currentEnd), baselineStart = day(item.baselineStart), baselineEnd = day(item.baselineEnd);
      const currentCents = cents(item.current);
      const baselineCents = typeof item.average === 'number' && Number.isFinite(item.average) && item.average > 0 && item.average <= MAX_AMOUNT / 4 ? Math.round(item.average * 400) : null;
      if (!category || !currentStart || !currentEnd || !baselineStart || !baselineEnd || currentCents === null || baselineCents === null || baselineCents <= 0) return [];
      if (Math.abs(item.current * 100-currentCents) > 0.0001 || Math.abs(item.average * 400-baselineCents) > 0.0001) return [];
      if (addDays(currentStart, 6) !== currentEnd || addDays(baselineStart, 27) !== baselineEnd || addDays(baselineEnd, 1) !== currentStart) return [];
      if (BigInt(currentCents) * 40n < BigInt(baselineCents) * 13n) return [];
      const current = currentCents / 100, average = baselineCents / 400;
      return [{category,current,average,delta:current-average,growthPercent:(currentCents * 4 / baselineCents - 1) * 100,currency,currentStart,currentEnd,baselineStart,baselineEnd}];
    });
  }

  function assistantContext(result, categoryLabel) {
    return sanitizeAnomalies(list(result?.anomalies).map(item => ({...item,category:typeof categoryLabel === 'function' ? categoryLabel(item) : item.category,currency:result.currency,currentStart:result.currentStart,currentEnd:result.currentEnd,baselineStart:result.baselineStart,baselineEnd:result.baselineEnd})), result?.currency);
  }

  return Object.freeze({detect,referenceDay,sanitizeAnomalies,assistantContext});
});
