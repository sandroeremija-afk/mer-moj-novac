const test = require('node:test');
const assert = require('node:assert/strict');
const MerCore = require('../core.js');
const MerStateStore = require('../state-store.js');
const MerDemoData = require('../demo-data.js');

function initialized(referenceDate) {
  const state = MerDemoData.createDemoAppState(referenceDate);
  const store = MerStateStore.createStore(state, { referenceDate });
  return { state, store, personal:state.accounts.personal, business:state.accounts.business };
}

for (const referenceDate of ['2026-09-04', '2026-10-01', '2027-01-01', '2027-02-28', '2028-02-29', '2028-12-31']) {
  test(`healthy demo balances are transaction-derived and stable on ${referenceDate}`, () => {
    const { personal, business } = initialized(referenceDate);
    assert.equal(personal.availableBalance, 2840);
    assert.equal(personal.derived.monthly.expenses, 820);
    assert.equal(personal.derived.monthlyContributions, 450);
    assert.equal(personal.derived.monthly.income, 3500);
    assert.equal(personal.derived.monthly.net, 2680);
    assert.equal(personal.derived.financials.safeToSpend, 1080);
    assert.equal(personal.derived.financials.monthlyBudget, 1900);
    assert.equal(personal.derived.financials.unallocatedBudget, 260);
    assert.equal(personal.financialOpeningBalance, 0);
    assert.equal(personal.derived.allTime.net - personal.savingsBalance, 2840);
    assert.equal(business.availableBalance, 8000);
    for (const profile of [personal, business]) {
      assert.ok(profile.derived.financials.safeToSpend > 0);
      assert.ok(profile.derived.financials.unallocatedBudget >= 0);
      assert.equal(profile.derived.financials.overBudget, 0);
      Object.values(profile.derived.categoryMetrics).forEach(category => {
        assert.equal(category.percent, 50);
        assert.equal(category.level, 'green');
        assert.equal(category.warning, null);
      });
      profile.transactions.forEach(transaction => {
        assert.ok(transaction.date.slice(0, 10) <= referenceDate);
        assert.equal(transaction.status, 'posted');
        assert.equal(transaction.profileId, profile.profileId);
      });
      profile.recurring.forEach(rule => {
        assert.ok(rule.startDate > referenceDate);
        assert.deepEqual(MerCore.occurrencesBetween(rule, rule.lastProcessed, referenceDate), []);
      });
    }
  });
}

test('demo reset factories return fresh isolated data and never mutate an existing user store', () => {
  const { state, store, personal } = initialized('2026-09-04');
  const beforeBusiness = JSON.stringify(state.accounts.business);
  const original = MerDemoData.createDemoProfiles('2026-09-04');
  personal.transactions.push({ id:'personal-added', profileId:'personal', type:'income', amount:200, category:'salary', date:'2026-09-04T08:00:00' });
  store.commit('income-add');
  assert.equal(personal.availableBalance, 3040);
  assert.equal(personal.derived.financials.safeToSpend, 1280);
  // updatedAt is intentionally recalculated for both profiles, so compare financial state.
  const initialBusiness = JSON.parse(beforeBusiness);
  assert.equal(state.accounts.business.availableBalance, initialBusiness.availableBalance);
  assert.deepEqual(state.accounts.business.transactions, initialBusiness.transactions);
  const fresh = MerDemoData.createDemoProfiles('2026-09-04');
  assert.deepEqual(fresh, original);
  fresh.personal.categories[0].limit = 1;
  fresh.personal.incomeCategories[0].id = 'changed';
  assert.equal(original.personal.categories[0].limit, 480);
  assert.equal(fresh.business.incomeCategories[0].id, 'salary');
  assert.equal(state.accounts.personal.availableBalance, 3040);
});

test('demo seeding uses the requested timezone and rejects malformed reference dates', () => {
  assert.equal(MerDemoData.referenceDay(new Date('2026-09-30T22:30:00Z'), 'Europe/Zagreb'), '2026-10-01');
  assert.equal(MerDemoData.referenceDay(new Date('2026-09-30T22:30:00Z'), 'America/New_York'), '2026-09-30');
  for (const value of ['bad', '2027-02-29', '2026-13-01', new Date(NaN)]) assert.throws(() => MerDemoData.createDemoProfiles(value));
});

test('repeated reactive recalculation does not change seed totals or create expense rows', () => {
  const { state, store, personal } = initialized('2026-09-04');
  const personalCount = personal.transactions.length;
  const businessCount = state.accounts.business.transactions.length;
  for (let index = 0; index < 20; index += 1) store.switchAccount(index % 2 ? 'personal' : 'business');
  assert.equal(personal.availableBalance, 2840);
  assert.equal(personal.spent, 820);
  assert.equal(personal.derived.monthlyContributions, 450);
  assert.equal(personal.transactions.length, personalCount);
  assert.equal(state.accounts.business.transactions.length, businessCount);
});
