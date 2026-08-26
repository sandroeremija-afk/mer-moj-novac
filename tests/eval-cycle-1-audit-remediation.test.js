const test = require('node:test');
const assert = require('node:assert/strict');
const MerCore = require('../core.js');
const MerImport = require('../import-core.js');
const MerAccounting = require('../accounting-core.js');

function importProfile(label = 'personalAccount') {
  return {
    accountLabel: label,
    categories: [
      { id: 'food', spent: 0, limit: 300 },
      { id: 'transport', spent: 0, limit: 200 },
      { id: 'other', spent: 0, limit: 100 }
    ],
    incomeCategories: [{ id: 'salary' }, { id: 'otherIncome' }],
    automationRules: [],
    transactions: []
  };
}

test('audit cycle 1: budget transfers preserve allocation math and cannot reach another profile', () => {
  const personal = [
    { id: 'food', spent: 80, limit: 200 },
    { id: 'office', spent: 260, limit: 100 }
  ];
  const business = [
    { id: 'business-donor', spent: 10, limit: 500 },
    { id: 'business-target', spent: 200, limit: 50 }
  ];
  const businessBefore = structuredClone(business);

  const result = MerCore.transferBudgetAllocation(personal, 'food', 'office', 150);

  assert.equal(result.valid, true);
  assert.equal(result.amount, 120, 'the transfer is capped at donor headroom');
  assert.equal(result.totalBefore, 300);
  assert.equal(result.totalAfter, 300);
  assert.equal(personal[0].limit, personal[0].spent, 'the donor never falls below recorded spending');
  assert.equal(personal[1].limit, 220);
  assert.deepEqual(business, businessBefore, 'Personal rebalancing cannot mutate Business categories');

  const personalBeforeInvalidTransfer = structuredClone(personal);
  const rejected = MerCore.transferBudgetAllocation(personal, 'business-donor', 'office', 10);
  assert.equal(rejected.valid, false);
  assert.equal(rejected.reason, 'invalid-categories');
  assert.deepEqual(personal, personalBeforeInvalidTransfer);
  assert.deepEqual(business, businessBefore);
});

test('audit cycle 1: trimming removes only unused headroom and reports an irreducible spending floor', () => {
  const personal = [
    { id: 'food', spent: 80, limit: 200 },
    { id: 'transport', spent: 50, limit: 150 },
    { id: 'utilities', spent: 20, limit: 20 }
  ];
  const business = [{ id: 'office', spent: 90, limit: 300 }];
  const businessBefore = structuredClone(business);

  const result = MerCore.trimBudgetAllocation(personal, 270);

  assert.equal(result.valid, true);
  assert.equal(result.resolved, true);
  assert.equal(result.allocatedBefore, 370);
  assert.equal(result.reduced, 100);
  assert.equal(result.allocatedAfter, 270);
  assert.equal(result.remaining, 0);
  personal.forEach(category => assert.ok(category.limit >= category.spent));
  assert.deepEqual(business, businessBefore, 'trimming an active profile cannot bleed into another profile');

  const spendingFloor = [
    { id: 'rent', spent: 120, limit: 120 },
    { id: 'food', spent: 80, limit: 80 }
  ];
  const unresolved = MerCore.trimBudgetAllocation(spendingFloor, 150);
  assert.equal(unresolved.valid, true);
  assert.equal(unresolved.resolved, false);
  assert.equal(unresolved.reason, 'spending-floor');
  assert.equal(unresolved.remaining, 50);
  assert.equal(unresolved.allocatedAfter, 200);
  assert.deepEqual(spendingFloor.map(category => category.limit), [120, 80]);
});

test('audit cycle 1: review stages reject profile changes and bulk undo restores every reviewed field', () => {
  const personal = importProfile();
  const parsed = MerImport.parseCsvImport(
    'Date,Description,Amount,Type\n' +
    '2026-08-18,Konzum,-20,Expense\n' +
    '2026-08-19,Uber,-30,Expense\n' +
    '2026-08-20,Unknown vendor,-40,Expense',
    personal
  );
  parsed.reviewRows[1].excluded = true;
  const stage = MerImport.createReviewStage(parsed, 'audit-review.csv', 'personal');
  const before = structuredClone(stage.reviewRows);

  assert.equal(stage.profileId, 'personal');
  assert.equal(stage.fileName, 'audit-review.csv');
  const wrongProfile = MerImport.applyBulkOverride(stage, 'business', { type: 'expense', category: 'transport' });
  assert.deepEqual(wrongProfile, { valid: false, reason: 'profile-changed', count: 0, snapshot: [] });
  assert.deepEqual(stage.reviewRows, before);

  const applied = MerImport.applyBulkOverride(stage, 'personal', { type: 'expense', category: 'transport' });
  assert.equal(applied.valid, true);
  assert.equal(applied.count, 2);
  assert.equal(stage.reviewRows[0].category, 'transport');
  assert.equal(stage.reviewRows[0].categoryConfidence, 'manual-review');
  assert.equal(stage.reviewRows[0].categorizationRule, 'bulk-review');
  assert.deepEqual(stage.reviewRows[1], before[1], 'excluded rows are not overridden');
  assert.equal(stage.reviewRows[2].needsReview, false);

  const rejectedUndo = MerImport.undoBulkOverride(stage, 'business', applied.snapshot);
  assert.deepEqual(rejectedUndo, { valid: false, reason: 'profile-changed', count: 0 });
  assert.equal(stage.reviewRows[0].category, 'transport');

  const undone = MerImport.undoBulkOverride(stage, 'personal', applied.snapshot);
  assert.deepEqual(undone, { valid: true, reason: null, count: 2 });
  assert.deepEqual(stage.reviewRows, before, 'undo restores type, category, review state, confidence and rule metadata');
});

test('audit cycle 1: stage commit remains profile-bound and imports only included rows', () => {
  const personal = importProfile();
  const business = importProfile('businessAccount');
  const parsed = MerImport.parseCsvImport(
    'Date,Description,Amount,Type\n' +
    '2026-08-18,Konzum,-20,Expense\n' +
    '2026-08-19,Uber,-30,Expense\n' +
    '2026-08-20,Unknown vendor,-40,Expense',
    personal
  );
  parsed.reviewRows[1].excluded = true;
  const stage = MerImport.createReviewStage(parsed, 'audit-review.csv', 'personal');
  const applied = MerImport.applyBulkOverride(stage, 'personal', { type: 'expense', category: 'transport' });
  assert.equal(applied.count, 2);

  const rejected = MerImport.commitReviewStage(business, stage, 'business');
  assert.equal(rejected.error, 'profile-changed');
  assert.equal(rejected.imported.length, 0);
  assert.equal(business.transactions.length, 0);

  const committed = MerImport.commitReviewStage(personal, stage, 'personal');
  assert.equal(committed.imported.length, 2);
  assert.equal(committed.duplicates, 0);
  assert.equal(committed.invalid, 0);
  assert.equal(personal.transactions.length, 2);
  assert.ok(personal.transactions.every(transaction => transaction.category === 'transport'));
  assert.ok(personal.transactions.every(transaction => transaction.source === 'Import: audit-review.csv'));
  assert.equal(personal.transactions.some(transaction => transaction.name === 'Uber'), false, 'the excluded row is never committed');
  assert.equal(business.transactions.length, 0);
});

test('audit cycle 1: subscription renewal clamps month-end dates across leap and common years', () => {
  const leap = MerAccounting.detectSubscriptions([
    { id: 'leap', type: 'expense', name: 'Netflix', amount: 15.49, date: '2028-01-31T12:00:00', sourceType: 'manual' }
  ], '2028-02-01');
  assert.equal(leap.length, 1);
  assert.equal(leap[0].nextRenewal, '2028-02-29');
  assert.equal(leap[0].daysUntil, 28);

  const common = MerAccounting.detectSubscriptions([
    { id: 'common', type: 'expense', name: 'Spotify', amount: 9.99, date: '2027-01-31T12:00:00', sourceType: 'import' }
  ], '2027-02-01');
  assert.equal(common.length, 1);
  assert.equal(common[0].nextRenewal, '2027-02-28');
  assert.equal(common[0].daysUntil, 27);
});

test('audit cycle 1: subscription detection excludes stale, future and MAX MARKET false positives', () => {
  const reference = '2026-08-26';
  const subscriptions = MerAccounting.detectSubscriptions([
    { id: 'stale', type: 'expense', name: 'Spotify', amount: 9.99, date: '2026-04-01T12:00:00', sourceType: 'manual' },
    { id: 'future', type: 'expense', name: 'Netflix', amount: 15.49, date: '2026-09-10T12:00:00', sourceType: 'import' },
    { id: 'market', type: 'expense', name: 'MAX MARKET ZAGREB 1042', amount: 74.20, date: '2026-08-20T12:00:00', sourceType: 'auto' }
  ], reference);

  assert.deepEqual(subscriptions, []);

  const freshImport = MerAccounting.detectSubscriptions([
    { id: 'fresh', type: 'expense', name: 'Adobe Creative Cloud', amount: 24.59, date: '2026-08-15T12:00:00', sourceType: 'import' }
  ], reference);
  assert.equal(freshImport.length, 1, 'fresh imported subscriptions are eligible for detection');
  assert.equal(freshImport[0].confidence, 'merchant');
});
