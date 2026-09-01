'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const MerCore = require('../core.js');

const referenceDate = '2026-08-20';
const transactions = [
  { id:'prior-income', type:'income', amount:1000, category:'salary', date:'2025-12-31T08:00:00' },
  { id:'prior-expense', type:'expense', amount:100, category:'legacy', date:'2025-12-31T17:00:00' },
  { id:'january-income', type:'income', amount:200, category:'salary', date:'2026-01-10T08:00:00' },
  { id:'january-expense', type:'expense', amount:20, category:'bills', date:'2026-01-10T17:00:00' },
  { id:'july-income', type:'income', amount:300, category:'freelance', date:'2026-07-31T08:00:00' },
  { id:'july-expense', type:'expense', amount:30, category:'travel', date:'2026-07-31T17:00:00' },
  { id:'month-income', type:'income', amount:400, category:'salary', date:'2026-08-01T08:00:00' },
  { id:'month-expense', type:'expense', amount:40, category:'food', date:'2026-08-01T17:00:00' },
  { id:'today-income', type:'income', amount:500, category:'salary', date:'2026-08-20T08:15:00' },
  { id:'today-expense', type:'expense', amount:50, category:'food', date:'2026-08-20T17:30:00' },
  { id:'future-income', type:'income', amount:9000, category:'salary', date:'2026-08-21T08:00:00' },
  { id:'invalid-expense', type:'expense', amount:9000, category:'food', date:'2026-02-31T08:00:00' }
];

const expected = {
  daily:{ granularity:'hour', income:500, expenses:50, net:450, count:2, keys:['08:00','17:00'] },
  monthly:{ granularity:'day', income:900, expenses:90, net:810, count:4, keys:['2026-08-01','2026-08-20'] },
  ytd:{ granularity:'month', income:1400, expenses:140, net:1260, count:8, keys:['2026-01','2026-07','2026-08'] },
  all:{ granularity:'year', income:2400, expenses:240, net:2160, count:10, keys:['2025','2026'] }
};

test('evaluation cycle 1: Insights report totals and sparse series are exact for every supported timeframe', () => {
  for (const [timeframe, result] of Object.entries(expected)) {
    const report = MerCore.buildInsightsReport(transactions, timeframe, referenceDate);
    assert.equal(report.timeframe, timeframe);
    assert.equal(report.granularity, result.granularity);
    assert.deepEqual(report.totals, {
      income:result.income,
      expenses:result.expenses,
      net:result.net,
      savingsRate:90,
      count:result.count
    });
    assert.equal(report.transactionCount, result.count);
    assert.deepEqual(report.series.map(item => item.key), result.keys);
    assert.equal(report.series.reduce((sum, item) => sum + item.income, 0), result.income);
    assert.equal(report.series.reduce((sum, item) => sum + item.expenses, 0), result.expenses);
    assert.equal(report.series.reduce((sum, item) => sum + item.count, 0), result.count);
  }

  assert.deepEqual(MerCore.buildInsightsReport(transactions, 'daily', referenceDate).series, [
    { key:'08:00', income:500, expenses:0, net:500, count:1 },
    { key:'17:00', income:0, expenses:50, net:-50, count:1 }
  ]);
});

test('evaluation cycle 1: Insights report canonicalizes aliases and falls back safely', () => {
  const ytd = MerCore.buildInsightsReport(transactions, 'ytd', referenceDate);
  assert.deepEqual(MerCore.buildInsightsReport(transactions, 'yearly', referenceDate), ytd);
  assert.deepEqual(MerCore.buildInsightsReport(transactions, 'this-year', referenceDate), ytd);
  assert.deepEqual(
    MerCore.buildInsightsReport(transactions, 'unsupported', referenceDate),
    MerCore.buildInsightsReport(transactions, 'monthly', referenceDate)
  );
  assert.equal(MerCore.buildInsightsReport(transactions, 'unsupported', referenceDate).timeframe, 'monthly');
});

test('evaluation cycle 1: category aggregates match filtered expenses without mutating or mixing inputs', () => {
  const before = JSON.stringify(transactions);
  const reports = Object.fromEntries(['daily','monthly','ytd','all'].map(timeframe => [timeframe, MerCore.buildInsightsReport(transactions, timeframe, referenceDate)]));

  assert.deepEqual(reports.daily.categories, [{ category:'food', amount:50, share:100 }]);
  assert.deepEqual(reports.monthly.categories, [{ category:'food', amount:90, share:100 }]);
  assert.deepEqual(reports.ytd.categories.map(item => [item.category,item.amount]), [['food',90],['travel',30],['bills',20]]);
  assert.deepEqual(reports.all.categories.map(item => [item.category,item.amount]), [['legacy',100],['food',90],['travel',30],['bills',20]]);
  for (const report of Object.values(reports)) {
    assert.equal(report.categories.reduce((sum, item) => sum + item.amount, 0), report.totals.expenses);
    assert.ok(Math.abs(report.categories.reduce((sum, item) => sum + item.share, 0) - 100) <= 0.02);
  }
  assert.equal(JSON.stringify(transactions), before, 'building a report is pure');

  const business = MerCore.buildInsightsReport([
    { id:'business-only', type:'expense', amount:75, category:'software', date:'2026-08-20T12:00:00' }
  ], 'daily', referenceDate);
  assert.deepEqual(business.categories, [{ category:'software', amount:75, share:100 }]);
  assert.doesNotMatch(JSON.stringify(business), /food|salary|personal/i);
});
