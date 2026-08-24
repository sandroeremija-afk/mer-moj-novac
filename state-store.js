(function exposeMerStateStore(root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./core.js') : root.MerCore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerStateStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerStateStore(MerCore) {
  if (!MerCore) throw new Error('MerCore is required before MerStateStore');

  const finiteAmount = value => Math.max(0, MerCore.financialAmount(value));

  function savingsTotal(profile) {
    return MerCore.roundMoney((profile.goalBuckets || []).reduce((sum, goal) => sum + finiteAmount(goal.current), 0));
  }

  function initializeBalanceAnchor(profile, referenceDate) {
    if (Number.isFinite(Number(profile.reactiveBalanceAnchor))) return Number(profile.reactiveBalanceAnchor);
    const allTime = MerCore.transactionTotals(profile.transactions || [], 'all', referenceDate);
    profile.reactiveBalanceAnchor = MerCore.roundMoney(MerCore.financialAmount(profile.availableBalance) - allTime.income + allTime.expenses + savingsTotal(profile));
    return profile.reactiveBalanceAnchor;
  }

  function savingsContributions(entries, timeframe, referenceDate) {
    const total = MerCore.filterTransactions(entries || [], timeframe, referenceDate).reduce((sum, entry) => sum + MerCore.financialAmount(entry.amount), 0);
    return Math.max(0, MerCore.roundMoney(total));
  }

  function recalculateProfile(profile, referenceDate = '2026-08-20') {
    if (!profile) return null;
    profile.transactions = Array.isArray(profile.transactions) ? profile.transactions : [];
    profile.categories = Array.isArray(profile.categories) ? profile.categories : [];
    profile.goalBuckets = Array.isArray(profile.goalBuckets) ? profile.goalBuckets : [];

    profile.savingsEntries = Array.isArray(profile.savingsEntries) ? profile.savingsEntries : [];
    const balanceAnchor = initializeBalanceAnchor(profile, referenceDate);
    const totalsByTimeframe = Object.fromEntries(['daily','monthly','ytd','all'].map(timeframe => [timeframe, MerCore.transactionTotals(profile.transactions, timeframe, referenceDate)]));
    const monthly = totalsByTimeframe.monthly;
    const allTime = totalsByTimeframe.all;
    const categorySpending = MerCore.categoryExpenseTotals(profile.transactions, 'monthly', referenceDate);

    profile.categories.forEach(category => { category.spent = categorySpending[category.id] || 0; });
    profile.spent = monthly.expenses;
    profile.savingsBalance = savingsTotal(profile);
    const primaryGoal = profile.goalBuckets.find(goal => goal.primary) || profile.goalBuckets[0];
    if (primaryGoal) profile.savingsGoal = finiteAmount(primaryGoal.target) || 1;
    profile.availableBalance = MerCore.roundMoney(balanceAnchor + allTime.income - allTime.expenses - profile.savingsBalance);
    const reference = new Date(`${String(referenceDate).slice(0, 10)}T12:00:00Z`);
    const daysRemaining = Math.max(1, MerCore.daysInMonth(reference.getUTCFullYear(), reference.getUTCMonth()) - reference.getUTCDate() + 1);
    const budget = MerCore.calculateBudget(profile, daysRemaining);
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
      availableBalance: profile.availableBalance,
      updatedAt: new Date().toISOString()
    };
    return profile.derived;
  }

  function createStore(initialState, options = {}) {
    if (!initialState?.accounts) throw new Error('A state object with accounts is required');
    let state = initialState;
    let revision = 0;
    const listeners = new Set();
    const referenceDate = options.referenceDate || '2026-08-20';

    const recalculateAll = () => Object.values(state.accounts).forEach(profile => recalculateProfile(profile, referenceDate));
    recalculateAll();

    function notify(reason) {
      revision += 1;
      const event = { state, reason, revision, activeAccount: state.activeAccount, activeProfile: state.accounts[state.activeAccount] };
      listeners.forEach(listener => listener(event));
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
        budget: profile.derived?.budget || MerCore.calculateBudget(profile, 12),
        derived: profile.derived,
        revision
      };
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
      recalculate: recalculateAll
    };
  }

  return { createStore, recalculateProfile };
});
