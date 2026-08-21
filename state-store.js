(function exposeMerStateStore(root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./core.js') : root.MerCore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerStateStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerStateStore(MerCore) {
  if (!MerCore) throw new Error('MerCore is required before MerStateStore');

  const finiteAmount = value => Math.max(0, Number(value) || 0);

  function savingsTotal(profile) {
    return (profile.goalBuckets || []).reduce((sum, goal) => sum + finiteAmount(goal.current), 0);
  }

  function initializeBalanceAnchor(profile) {
    if (Number.isFinite(Number(profile.reactiveBalanceAnchor))) return Number(profile.reactiveBalanceAnchor);
    const allTime = MerCore.transactionTotals(profile.transactions || [], 'all', '2026-08-20');
    profile.reactiveBalanceAnchor = finiteAmount(profile.availableBalance) - allTime.income + allTime.expenses + savingsTotal(profile);
    return profile.reactiveBalanceAnchor;
  }

  function recalculateProfile(profile, referenceDate = '2026-08-20') {
    if (!profile) return null;
    profile.transactions = Array.isArray(profile.transactions) ? profile.transactions : [];
    profile.categories = Array.isArray(profile.categories) ? profile.categories : [];
    profile.goalBuckets = Array.isArray(profile.goalBuckets) ? profile.goalBuckets : [];

    const balanceAnchor = initializeBalanceAnchor(profile);
    const monthly = MerCore.transactionTotals(profile.transactions, 'monthly', referenceDate);
    const allTime = MerCore.transactionTotals(profile.transactions, 'all', referenceDate);
    const categorySpending = profile.transactions.reduce((totals, transaction) => {
      if (MerCore.transactionType(transaction) !== 'expense' || !String(transaction.date || '').startsWith(String(referenceDate).slice(0, 7))) return totals;
      const categoryId = transaction.category || 'other';
      totals[categoryId] = (totals[categoryId] || 0) + finiteAmount(transaction.amount);
      return totals;
    }, {});

    profile.categories.forEach(category => { category.spent = categorySpending[category.id] || 0; });
    profile.spent = monthly.expenses;
    profile.savingsBalance = savingsTotal(profile);
    const primaryGoal = profile.goalBuckets.find(goal => goal.primary) || profile.goalBuckets[0];
    if (primaryGoal) profile.savingsGoal = finiteAmount(primaryGoal.target) || 1;
    profile.availableBalance = balanceAnchor + allTime.income - allTime.expenses - profile.savingsBalance;
    profile.derived = {
      monthly,
      allTime,
      categorySpending,
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
        totals: MerCore.transactionTotals(profile.transactions || [], timeframe, referenceDate),
        budget: MerCore.calculateBudget(profile, 12),
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
