'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const I = require('../insight-core.js');
const Core = require('../core.js');

const profile = (id = 'personal') => ({ profileId:id, financialOpeningBalance:100, transactions:[], categories:[{ id:'utilities', name:'Režije' }, { id:'food', name:'Hrana' }, { id:'other', name:'Ostalo' }], recurring:[], savingsEntries:[], goalBuckets:[] });
const tx = (id, amount, type = 'expense', date = '2026-09-01', category = 'food', extra = {}) => ({ id, amount, type, date, category, profileId:'personal', ...extra });

test('fixed versus flexible expenses reconcile signed cent totals and classify transparently', () => {
  const p = profile();
  p.recurring = [{ id:'gym', name:'Teretana', category:'other', profileId:'personal' }];
  p.transactions = [tx('rent', 500, 'expense', '2026-09-01', 'utilities'), tx('market', 123.45), tx('gym', 24.55, 'expense', '2026-09-01', 'other', { recurringId:'gym' }), tx('income', 1000, 'income')];
  const result = I.expenseStructure(p, 'monthly', '2026-09-18');
  assert.equal(result.fixed, 524.55);
  assert.equal(result.variable, 123.45);
  assert.equal(result.total, 648);
  assert.equal(result.fixedShare + result.variableShare, 100);
  assert.equal(result.count, 3);
  assert.equal(result.categories.reduce((sum, category) => sum + Math.round(category.amount * 100), 0), 64800);
  assert.equal(result.total, Core.transactionTotals(p.transactions, 'monthly', '2026-09-18').expenses);
  assert.deepEqual(result.categories.find(category => category.categoryId === 'utilities').reasons, ['category-rule']);
  assert.match(result.classificationNote, /explicit-override-then-recurring/);
});

test('transaction overrides precede category and recurring classifications, including explicit false', () => {
  const p = profile();
  p.categories.push({ id:'custom', expenseBehavior:'fixed' });
  assert.deepEqual(I.classifyExpense(tx('a', 1, 'expense', '2026-09-01', 'utilities', { fixed:false }), p), { behavior:'variable', reason:'transaction-override' });
  assert.equal(I.classifyExpense(tx('a', 1, 'expense', '2026-09-01', 'custom'), p).behavior, 'fixed');
  assert.equal(I.classifyExpense(tx('a', 1, 'expense', '2026-09-01', 'custom', { expenseBehavior:'flexible', recurringId:'gym' }), p).behavior, 'variable');
  assert.equal(I.classifyExpense(tx('a', 1, 'expense', '2026-09-01', 'food', { isFixed:true }), p).behavior, 'fixed');
});

test('known fixed merchant rules are word based and recurring names do not classify an entire category', () => {
  const p = profile();
  p.recurring = [{ id:'gym', name:'Teretana', category:'other' }];
  assert.equal(I.classifyExpense(tx('a', 50, 'expense', '2026-09-01', 'other', { name:'Teretana' }), p).reason, 'recurring');
  assert.equal(I.classifyExpense(tx('b', 50, 'expense', '2026-09-01', 'other', { name:'Shopping trip' }), p).behavior, 'variable');
  assert.equal(I.classifyExpense(tx('c', 50, 'expense', '2026-09-01', 'other', { name:'HEP Opskrba' }), p).behavior, 'fixed');
  assert.equal(I.classifyExpense(tx('d', 50, 'expense', '2026-09-01', 'other', { name:'Shepherd restaurant' }), p).behavior, 'variable');
});

test('negative corrections remain in totals while visualization shares stay finite and bounded', () => {
  const p = profile();
  p.transactions = [tx('fixed-refund', -500, 'expense', '2026-09-01', 'utilities'), tx('variable', 100), tx('refund', -25, 'expense', '2026-09-01', 'other')];
  const result = I.expenseStructure(p, 'monthly', '2026-09-18');
  assert.equal(result.total, -425);
  assert.equal(result.fixed, -500);
  assert.equal(result.variable, 75);
  assert.deepEqual([result.fixedShare, result.variableShare], [0, 100]);
  assert.equal(result.hasCorrections, true);
  assert.equal(result.adjustedShares, true);
  assert.equal(result.shareDisclosure, 'positive-bucket-shares-after-refunds');
  assert.equal(result.categoryShareDisclosure, 'positive-category-shares-after-refunds');
  assert.ok(result.categories.every(category => Number.isFinite(category.share) && category.share >= 0 && category.share <= 100));
});

test('zero and refund-only data never produces NaN or a fake positive expense ratio', () => {
  const p = profile();
  let result = I.expenseStructure(p, 'monthly', '2026-09-18');
  assert.deepEqual([result.fixedShare, result.variableShare, result.total], [0, 0, 0]);
  p.transactions = [tx('refund', -20)];
  result = I.expenseStructure(p, 'monthly', '2026-09-18');
  assert.deepEqual([result.fixedShare, result.variableShare, result.total], [0, 0, -20]);
});

test('cumulative chart carries an opening balance from older effective records and is not a flow duplicate', () => {
  const p = profile();
  p.transactions = [tx('prior-pay', 1000, 'income', '2026-08-01'), tx('prior-expense', 200, 'expense', '2026-08-02'), tx('pay', 500, 'income', '2026-09-01'), tx('spend', 50, 'expense', '2026-09-02')];
  const result = I.cumulativeSeries(p, 'monthly', '2026-09-03');
  assert.equal(result.openingBalance, 900);
  assert.equal(result.closingBalance, 1350);
  assert.deepEqual(result.series.map(point => point.balance), [1400, 1350, 1350]);
  assert.deepEqual(result.series.map(point => point.net), [500, -50, 0]);
  assert.deepEqual(result.totals, { income:500, expenses:50, net:450, count:2 });
  assert.equal(result.disclosure, 'cash-balance-not-net-worth');
});

test('savings transfers do not lower tracked cash wealth and assets are not invented', () => {
  const p = profile();
  p.transactions = [tx('income', 1000, 'income'), tx('spend', 100), tx('internal', 450, 'transfer')];
  p.savingsEntries = [{ amount:450, date:'2026-09-01' }];
  p.savingsBalance = 450;
  p.goalBuckets = [{ current:450, target:5000 }];
  const result = I.cumulativeSeries(p, 'monthly', '2026-09-01');
  assert.equal(result.closingBalance, 1000);
  assert.equal(result.totals.expenses, 100);
  assert.equal(result.totals.count, 2);
});

test('foreign profiles, scheduled dates, drafts and invalid monetary records never leak into charts', () => {
  const p = profile();
  p.transactions = [tx('valid', 15), tx('foreign', 9000, 'expense', '2026-09-01', 'utilities', { profileId:'business' }), tx('future', 99, 'income', '2026-10-01'), tx('draft', 2, 'expense', '2026-09-01', 'food', { status:'draft' }), tx('offline', 3, 'expense', '2026-09-01', 'food', { offlineDraft:true }), tx('bad-date', 4, 'expense', '2026-02-30'), tx('nan', NaN), tx('infinite', Infinity), null];
  assert.deepEqual(I.transactionSeries(p, 'monthly', '2026-09-18').totals, { income:0, expenses:15, net:-15, count:1 });
  assert.equal(I.expenseStructure(p, 'monthly', '2026-09-18').total, 15);
  assert.equal(I.transactionSeries(p, 'all', '2026-09-18', { profileId:'business' }).closingBalance, 0);
  assert.equal(I.expenseStructure(p, 'all', '2026-09-18', { profileId:'business' }).total, 0);
});

test('future scheduled transactions become effective on arrival without cached chart state', () => {
  const p = profile();
  p.transactions = [tx('future', 200, 'income', '2026-09-19', 'salary', { status:'scheduled', scheduled:true })];
  assert.equal(I.cumulativeSeries(p, 'monthly', '2026-09-18').closingBalance, 100);
  assert.equal(I.cumulativeSeries(p, 'monthly', '2026-09-19').closingBalance, 300);
});

test('edits, deletes, imports and profile switches recalculate immediately without mutating the store', () => {
  const p = profile(), business = profile('business');
  p.transactions = [tx('one', 0.1), tx('two', 0.2)];
  business.transactions = [tx('business-income', 2000, 'income', '2026-09-01', 'salary', { profileId:'business' })];
  const before = JSON.stringify(p);
  assert.equal(I.expenseStructure(p, 'monthly', '2026-09-18').total, 0.3);
  assert.equal(JSON.stringify(p), before);
  p.transactions[0].amount = 100;
  assert.equal(I.cumulativeSeries(p, 'monthly', '2026-09-18').closingBalance, -0.2);
  p.transactions.splice(0, 1);
  assert.equal(I.expenseStructure(p, 'monthly', '2026-09-18').total, 0.2);
  p.transactions.push(...Array.from({ length:500 }, (_, index) => tx(`import-${index}`, 0.01)));
  assert.equal(I.expenseStructure(p, 'monthly', '2026-09-18').total, 5.2);
  assert.equal(I.cumulativeSeries(business, 'monthly', '2026-09-18').closingBalance, 2100);
  assert.equal(I.cumulativeSeries(p, 'monthly', '2026-09-18').closingBalance, 94.8);
});

test('day, month, year-to-date and all-time choose distinct correct domains and zero-filled buckets', () => {
  const p = profile();
  p.transactions = [tx('last-year', 100, 'income', '2025-12-31'), tx('january', 200, 'income', '2026-01-02'), tx('yesterday', 40, 'expense', '2026-09-17T09:00:00'), tx('today-income', 1000, 'income', '2026-09-18T08:30:00'), tx('today-expense', 50, 'expense', '2026-09-18T10:01:00')];
  const day = I.transactionSeries(p, 'daily', '2026-09-18');
  assert.equal(day.granularity, 'hour'); assert.equal(day.series.length, 24);
  assert.equal(day.openingBalance, 360);
  assert.equal(day.series[8].income, 1000); assert.equal(day.series[10].expenses, 50);
  const month = I.transactionSeries(p, 'monthly', '2026-09-18');
  assert.equal(month.granularity, 'day'); assert.equal(month.series.length, 18); assert.equal(month.totals.net, 910);
  const year = I.transactionSeries(p, 'ytd', '2026-09-18');
  assert.equal(year.granularity, 'month'); assert.equal(year.series.length, 9); assert.equal(year.totals.net, 1110);
  const all = I.transactionSeries(p, 'all', '2026-09-18');
  assert.equal(all.granularity, 'month'); assert.equal(all.series.length, 10); assert.equal(all.totals.net, 1210);
  assert.equal(all.closingBalance, day.closingBalance);
  assert.equal(month.closingBalance, year.closingBalance);
});

test('growth percentages compare consecutive buckets, handle negative bases and disclose undefined zero bases', () => {
  assert.equal(I.growthPercent(150, 100), 50);
  assert.equal(I.growthPercent(-50, -100), 50);
  assert.equal(I.growthPercent(100, 0), null);
  assert.equal(I.growthPercent(NaN, 0), null);
  const p = profile();
  p.transactions = [tx('pay1', 100, 'income', '2026-09-01'), tx('pay2', 150, 'income', '2026-09-02'), tx('cost1', 20, 'expense', '2026-09-01'), tx('cost2', 10, 'expense', '2026-09-02')];
  const series = I.transactionSeries(p, 'monthly', '2026-09-03').series;
  assert.equal(series[0].growth.income, null);
  assert.equal(series[1].growth.income, 50);
  assert.equal(series[1].growth.expenses, -50);
  assert.equal(series[2].growth.income, -100);
});

test('leap day, reference timezone rollover and booking-day timestamps preserve central date rules', () => {
  const p = profile();
  p.transactions = [tx('february', 10, 'income', '2024-02-29T23:30:00-05:00'), tx('march', 20, 'income', '2024-03-01')];
  const leap = I.transactionSeries(p, 'monthly', '2024-02-29');
  assert.equal(leap.series.length, 29); assert.equal(leap.totals.income, 10);
  const instant = new Date('2024-02-29T23:30:00Z');
  const zagreb = I.transactionSeries(p, 'daily', instant, { timezone:'Europe/Zagreb' });
  const newYork = I.transactionSeries(p, 'daily', instant, { timezone:'America/New_York' });
  assert.equal(zagreb.startDate, '2024-03-01'); assert.equal(zagreb.totals.income, 20);
  assert.equal(newYork.startDate, '2024-02-29'); assert.equal(newYork.totals.income, 10);
  assert.equal(newYork.series[23].income, 10, 'hour labels reflect the booked timestamp, not an invented conversion');
});

test('all-time buckets stay bounded for long histories without dropping money', () => {
  const p = profile();
  p.transactions = [tx('old', 10, 'income', '1900-01-01'), tx('middle', 20, 'income', '1970-01-01'), tx('new', 30, 'income', '2026-09-01')];
  const result = I.transactionSeries(p, 'all', '2026-09-18');
  assert.equal(result.granularity, 'year-range');
  assert.ok(result.series.length <= 60);
  assert.equal(result.closingBalance, 160); assert.equal(result.totals.income, 60);
  p.transactions[0].date = '2020-01-01'; p.transactions[1].date = '2021-01-01';
  assert.equal(I.transactionSeries(p, 'all', '2026-09-18').granularity, 'year');
});

test('large and negative chart values remain finite; no percentage hides an overdrawn balance', () => {
  const p = profile();
  p.transactions = [tx('huge', 1000000000.01, 'income'), tx('larger', 2000000000.02, 'expense', '2026-09-02'), tx('refund', -10.01, 'expense', '2026-09-03')];
  const result = I.cumulativeSeries(p, 'monthly', '2026-09-03');
  assert.equal(result.closingBalance, -999999890);
  assert.equal(result.series[2].expenses, -10.01);
  assert.ok(result.series.every(point => ['income', 'expenses', 'balance', 'net'].every(key => Number.isFinite(point[key]))));
});

test('malformed state and invalid dates return deterministic safe empty data', () => {
  for (const p of [null, {}, { transactions:null, categories:null }, { transactions:{}, categories:{} }]) {
    assert.equal(I.expenseStructure(p, 'monthly', 'bad').count, 0);
    assert.equal(I.transactionSeries(p, 'all', 'bad').valid, false);
    assert.equal(I.transactionSeries(p, 'monthly', '2026-09-18').totals.count, 0);
  }
  assert.equal(I.transactionSeries(profile(), 'daily', new Date('bad')).valid, false);
});
