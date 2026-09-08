(function expose(root, factory) {
  'use strict';
  const api = factory(typeof module === 'object' && module.exports ? require('./core.js') : root.MerCore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerEngagement = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function create(Core) {
  'use strict';
  const cents = value => { const number = Number(value); return Number.isFinite(number) && Math.abs(number) <= 1e11 ? Math.round((number + Math.sign(number) * Number.EPSILON) * 100) : 0; };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  function validDay(day) { return /^\d{4}-\d{2}-\d{2}$/.test(day || '') && Number.isFinite(Date.parse(`${day}T00:00:00Z`)) && new Date(`${day}T00:00:00Z`).toISOString().slice(0,10) === day; }
  function previousMonth(reference) {
    if (!validDay(reference)) throw new TypeError('Invalid reference date');
    const date = new Date(`${reference.slice(0,7)}-01T00:00:00Z`); date.setUTCMonth(date.getUTCMonth() - 1); return date.toISOString().slice(0,7);
  }
  function scoped(profile, options) {
    const profileId = options.profileId || profile.profileId;
    if (!profileId || (profile.profileId && profileId !== profile.profileId)) throw new TypeError('Profile mismatch');
    const reference = options.referenceDate;
    if (!validDay(reference)) throw new TypeError('Invalid reference date');
    const currency = options.currency || profile.currency || 'EUR';
    const matches = row => row && (!row.profileId || row.profileId === profileId) && (row.currency || currency) === currency;
    const effective = row => matches(row) && !row.offlineDraft && !['cancelled','canceled','rejected','reversed','void','failed'].includes(String(row.status||'').toLowerCase()) && !(row.status === 'pending' && row.scheduled !== true) && validDay(String(row.date || '').slice(0,10)) && Core.isTransactionEffective(row, reference);
    return {profileId, reference, currency, matches, effective};
  }
  function monthlySummary(profile, options = {}) {
    const scope = scoped(profile, options), month = options.month || previousMonth(scope.reference);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || month > scope.reference.slice(0,7)) throw new TypeError('Invalid summary month');
    const transactions = (profile.transactions || []).filter(row => scope.effective(row) && row.date.slice(0,7) === month);
    const savings = (profile.savingsEntries || []).filter(row => scope.effective(row) && row.date.slice(0,7) === month);
    const grouped = new Map(); let income = 0, expenses = 0, biggest = null;
    for (const row of transactions) {
      const amount = cents(row.amount), type = Core.transactionType(row);
      if (type === 'income') income += amount;
      else if (type === 'expense') { expenses += amount; const id = row.categoryId || row.category || 'other'; grouped.set(id, (grouped.get(id) || 0) + amount); if (amount > 0 && (!biggest || amount > biggest.amountCents)) biggest = {id:row.id, name:String(row.name || row.merchantName || row.title || ''), amountCents:amount}; }
    }
    const goals = new Set((profile.goalBuckets || []).filter(scope.matches).map(goal => goal.id));
    // Roundups are part of deposits, not an additional amount to add a second time.
    let saved = 0, roundups = 0, vaults = 0;
    for (const row of savings) { const amount = cents(row.amount); saved += amount; if (goals.has(row.goalId)) vaults += amount; if (row.sourceType === 'roundup' || row.sourceType === 'round-up' || String(row.automationType || '').includes('roundup') || String(row.id || '').startsWith('roundup-')) roundups += amount; }
    const categories = [...grouped].filter(([, amount]) => amount > 0).sort((a,b) => b[1] - a[1]);
    const hasData = transactions.length + savings.length > 0;
    const badge = !hasData ? 'start' : income > 0 && saved / income >= .2 ? 'saver' : income > 0 && expenses <= income * .8 ? 'disciplined' : 'aware';
    return {month,profileId:scope.profileId,currency:scope.currency,incomeCents:income,expenseCents:expenses,netCents:income-expenses,savedCents:saved,vaultCents:vaults,roundupCents:roundups,topCategory:categories[0] ? {id:categories[0][0],amountCents:categories[0][1]} : null,biggest,hasData,badge,transactionCount:transactions.length};
  }
  function health(profile, options = {}) {
    const scope = scoped(profile, options), summary = monthlySummary(profile,{...options,month:scope.reference.slice(0,7)});
    const categories = (profile.categories || []).filter(scope.matches).map(category => {
      const spent = (profile.transactions || []).filter(row => scope.effective(row) && row.date.slice(0,7) === scope.reference.slice(0,7) && Core.transactionType(row) === 'expense' && (row.categoryId || row.category) === category.id).reduce((sum,row) => sum + cents(row.amount),0);
      return {id:category.id,limitCents:Math.max(0,cents(category.limit)),spentCents:Math.max(0,spent)};
    });
    const unknownSpent=(profile.transactions||[]).filter(row=>scope.effective(row)&&row.date.slice(0,7)===scope.reference.slice(0,7)&&Core.transactionType(row)==='expense'&&!categories.some(category=>category.id===(row.categoryId||row.category))).reduce((sum,row)=>sum+cents(row.amount),0);
    const totalLimit = categories.reduce((sum,item) => sum + item.limitCents,0), over = Math.max(0,unknownSpent)+categories.reduce((sum,item) => sum + Math.max(0,item.spentCents-item.limitCents),0);
    const savingsRate = summary.incomeCents > 0 ? Math.max(0,summary.savedCents) / summary.incomeCents : 0;
    const emergency = (profile.goalBuckets || []).filter(scope.matches).find(goal => goal.isEmergencyFund || goal.primary) || null;
    const essentials = Math.max(0,cents(profile.bills));
    const bufferMonths = essentials > 0 ? Math.max(0,cents(emergency?.current)) / essentials : 0;
    const adherence = totalLimit > 0 ? clamp(1-over/totalLimit,0,1) : 0;
    const score = summary.incomeCents > 0 ? Math.round(clamp(savingsRate/.2,0,1)*40 + adherence*35 + clamp(bufferMonths/6,0,1)*25) : null;
    return {...summary,score,savingsRate,bufferMonths,adherence,categories,totalLimitCents:totalLimit,overCents:over,recommendations:[savingsRate < .2 ? 'save' : 'keep-saving',over > 0 ? 'rebalance' : totalLimit > 0 ? 'keep-budget' : 'set-budget',essentials <= 0 ? 'set-essentials' : bufferMonths < 6 ? 'buffer' : 'keep-buffer']};
  }
  function rebalance(profile, options = {}) {
    const current = health(profile,options), rows = current.categories.map(row => ({...row,newLimitCents:row.limitCents}));
    let need = rows.reduce((sum,row) => sum + Math.max(0,row.spentCents-row.limitCents),0);
    const wanted = need;
    for (const row of [...rows].sort((a,b) => (b.limitCents-b.spentCents)-(a.limitCents-a.spentCents))) { const take = Math.min(need,Math.max(0,row.limitCents-row.spentCents)); row.newLimitCents -= take; need -= take; }
    let available = wanted-need;
    for (const row of rows) { const add = Math.min(available,Math.max(0,row.spentCents-row.limitCents)); row.newLimitCents += add; available -= add; }
    return {rows,shortfallCents:need,changed:rows.some(row => row.limitCents !== row.newLimitCents),totalCents:current.totalLimitCents};
  }
  function applyRebalance(profile, proposal, options) {
    const fresh = rebalance(profile,options);
    if (JSON.stringify(fresh) !== JSON.stringify(proposal)) throw new Error('STALE_PROPOSAL');
    const scope=scoped(profile,options);
    for (const row of fresh.rows) { const category = profile.categories.find(item => scope.matches(item)&&item.id === row.id); category.limit = row.newLimitCents/100; }
    return fresh.changed;
  }
  function wrappedKey(userId, profileId, reference) { return `${encodeURIComponent(userId)}:${encodeURIComponent(profileId)}:${previousMonth(reference)}`; }
  function shouldAutoOpen(profile, userId, options) { return Boolean(userId && options.referenceDate?.endsWith('-01') && !profile.engagement?.wrappedSeen?.[wrappedKey(userId,options.profileId,options.referenceDate)]); }
  return {cents,previousMonth,monthlySummary,health,rebalance,applyRebalance,wrappedKey,shouldAutoOpen};
});
