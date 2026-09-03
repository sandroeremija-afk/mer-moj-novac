(function exposeMerStateStore(root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./core.js') : root.MerCore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerStateStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerStateStore(MerCore) {
  if (!MerCore) throw new Error('MerCore is required before MerStateStore');

  const finiteAmount = value => Math.max(0, MerCore.financialAmount(value));
  const safeReferenceDate = value => {
    const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(!match)return null;
    const date=new Date(Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3])));
    return date.getUTCFullYear()===Number(match[1])&&date.getUTCMonth()===Number(match[2])-1&&date.getUTCDate()===Number(match[3])?match[0]:null;
  };

  function savingsTotal(profile) {
    return MerCore.roundMoney((profile.goalBuckets || []).reduce((sum, goal) => sum + finiteAmount(goal?.current), 0));
  }

  function initializeBalanceAnchor(profile, referenceDate, currentSavings) {
    if (Number.isFinite(Number(profile.financialOpeningBalance))) return Number(profile.financialOpeningBalance);
    if (Number.isFinite(Number(profile.reactiveBalanceAnchor))) {
      profile.financialOpeningBalance = MerCore.roundMoney(Number(profile.reactiveBalanceAnchor));
      return profile.financialOpeningBalance;
    }
    const allTime = MerCore.transactionTotals(profile.transactions || [], 'all', referenceDate);
    profile.financialOpeningBalance = MerCore.roundMoney(MerCore.financialAmount(profile.availableBalance) - allTime.net + currentSavings);
    profile.reactiveBalanceAnchor = profile.financialOpeningBalance;
    return profile.financialOpeningBalance;
  }

  function savingsContributions(entries, timeframe, referenceDate) {
    const total = MerCore.filterTransactions(entries || [], timeframe, referenceDate).reduce((sum, entry) => sum + MerCore.financialAmount(entry.amount), 0);
    return Math.max(0, MerCore.roundMoney(total));
  }

  function recalculateProfile(profile, referenceDate = new Date().toISOString().slice(0,10)) {
    if (!profile) return null;
    profile.transactions = Array.isArray(profile.transactions) ? profile.transactions : [];
    profile.transactions.forEach(transaction => MerCore.updateTransactionSchedule(transaction, referenceDate));
    profile.categories = Array.isArray(profile.categories) ? profile.categories.filter(category=>category&&typeof category==='object'&&category.id) : [];
    profile.goalBuckets = Array.isArray(profile.goalBuckets) ? profile.goalBuckets.filter(goal=>goal&&typeof goal==='object') : [];

    profile.savingsEntries = Array.isArray(profile.savingsEntries) ? profile.savingsEntries : [];
    profile.savingsBalance = savingsTotal(profile);
    const balanceAnchor = initializeBalanceAnchor(profile, referenceDate, profile.savingsBalance);
    const financials = MerCore.FinancialEngine.calculate(profile, referenceDate, { openingBalance:balanceAnchor, savingsBalance:profile.savingsBalance });
    const totalsByTimeframe = Object.fromEntries(['daily','monthly','ytd','all'].map(timeframe => [timeframe, timeframe === 'monthly' ? financials.monthly : timeframe === 'all' ? financials.allTime : MerCore.transactionTotals(profile.transactions, timeframe, referenceDate)]));
    const monthly = financials.monthly;
    const allTime = financials.allTime;
    const categorySpending = MerCore.categoryExpenseTotals(profile.transactions, 'monthly', referenceDate);

    profile.categories.forEach(category => { category.spent = categorySpending[category.id] || 0; });
    profile.spent = monthly.expenses;
    const primaryGoal = profile.goalBuckets.find(goal => goal.primary) || profile.goalBuckets[0];
    if (primaryGoal) profile.savingsGoal = finiteAmount(primaryGoal.target) || 1;
    profile.availableBalance = financials.availableBalance;
    const budget = financials;
    const categoryMetrics = Object.fromEntries(profile.categories.map(category => {
      const spent = categorySpending[category.id] || 0;
      const limit = finiteAmount(category.limit);
      const threshold = MerCore.budgetThreshold(spent, limit);
      return [category.id, { id:category.id, spent, limit, remaining:Math.max(0, MerCore.roundMoney(limit - spent)), ...threshold }];
    }));
    const monthlyContributions = savingsContributions(profile.savingsEntries, 'monthly', referenceDate);
    const savingsByTimeframe = Object.fromEntries(['daily','monthly','ytd','all'].map(timeframe => [timeframe, savingsContributions(profile.savingsEntries, timeframe, referenceDate)]));
    const categorySegments = MerCore.proportionalSegments(Object.entries(categorySpending));
    profile.derived = {
      monthly,
      allTime,
      financials,
      totalsByTimeframe,
      budget,
      categorySpending,
      categoryMetrics,
      categorySegments,
      monthlySavings:monthly.net,
      monthlyContributions,
      savingsByTimeframe,
      spendingSeries:MerCore.cumulativeSpendingSeries(profile.transactions, referenceDate, budget.monthlyBudget),
      savingsBalance: profile.savingsBalance,
      availableBalance: financials.availableBalance,
      updatedAt: new Date().toISOString()
    };
    return profile.derived;
  }

  function createStore(initialState, options = {}) {
    if (!initialState?.accounts) throw new Error('A state object with accounts is required');
    let state = initialState;
    let revision = 0;
    const listeners = new Set();
    let referenceDate = safeReferenceDate(options.referenceDate) || new Date().toISOString().slice(0,10);

    const recalculateAll = () => Object.values(state.accounts).forEach(profile => recalculateProfile(profile, referenceDate));
    recalculateAll();

    function notify(reason) {
      revision += 1;
      const event = { state, reason, revision, activeAccount: state.activeAccount, activeProfile: state.accounts[state.activeAccount] };
      listeners.forEach(listener => { try { listener(event); } catch(error) { globalThis.MerRuntime?.report?.(error); } });
      return event;
    }

    function commit(reason = 'state-change') {
      recalculateAll();
      return notify(reason);
    }

    function update(reason, mutation) {
      if (typeof mutation !== 'function') throw new TypeError('Store update requires a mutation function');
      mutation(state, state.accounts[state.activeAccount]);
      return commit(reason);
    }

    function switchAccount(accountId) {
      if (!state.accounts[accountId]) return false;
      state.activeAccount = accountId;
      commit('account-switch');
      return true;
    }

    function subscribe(listener) {
      if (typeof listener !== 'function') throw new TypeError('Store subscriber must be a function');
      listeners.add(listener);
      return () => listeners.delete(listener);
    }

    function snapshot(accountId = state.activeAccount, timeframe = 'monthly') {
      const profile = state.accounts[accountId];
      if (!profile) return null;
      return {
        accountId,
        profile,
        totals: profile.derived?.totalsByTimeframe?.[timeframe] || MerCore.transactionTotals(profile.transactions || [], timeframe, referenceDate),
        budget: profile.derived?.financials || MerCore.FinancialEngine.calculate(profile, referenceDate, { openingBalance:profile.financialOpeningBalance, savingsBalance:profile.savingsBalance }),
        derived: profile.derived,
        revision
      };
    }

    function setReferenceDate(nextReferenceDate) {
      const normalized=safeReferenceDate(nextReferenceDate);
      if(!normalized||normalized===referenceDate)return false;
      referenceDate=normalized;
      commit('reference-date-change');
      return true;
    }

    return {
      getState: () => state,
      getActiveProfile: () => state.accounts[state.activeAccount],
      getRevision: () => revision,
      snapshot,
      subscribe,
      commit,
      update,
      switchAccount,
      setReferenceDate,
      recalculate: recalculateAll
    };
  }

  return { createStore, recalculateProfile };
});
