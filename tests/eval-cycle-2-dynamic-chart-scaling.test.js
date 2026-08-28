const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const MerCore = require('../core.js');

test('evaluation cycle 2: a 99-to-1 donut distribution closes exactly at 100 percent', () => {
  const segments = MerCore.proportionalSegments([['dominant',990_000],['small',10_000]]);
  assert.equal(segments.length, 2);
  assert.equal(segments[0].percent, 99);
  assert.equal(segments[1].percent, 1);
  assert.equal(segments[0].start, 0);
  assert.equal(segments.at(-1).end, 100);
});

test('evaluation cycle 2: evenly distributed slices remain proportional without floating gaps', () => {
  const segments = MerCore.proportionalSegments([['a',25],['b',25],['c',25],['d',25]]);
  assert.deepEqual(segments.map(item=>item.percent), [25,25,25,25]);
  assert.equal(segments.at(-1).end, 100);
});

test('evaluation cycle 2: chart bounds expand beyond extreme values and preserve small bars', () => {
  const domain = MerCore.chartDomain([0,10_000,1_000_000]);
  const tallest = MerCore.scaleChartValue(1_000_000,domain,168,5);
  const smallest = MerCore.scaleChartValue(10_000,domain,168,5);
  assert.ok(domain.max > 1_000_000);
  assert.ok(tallest > 150 && tallest < 168);
  assert.ok(smallest >= 5 && smallest < tallest);
  assert.equal(MerCore.scaleChartValue(0,domain,168,5), 0);
});

test('evaluation cycle 2: progress thresholds preserve uncapped math while UI widths can clamp', () => {
  assert.deepEqual(MerCore.budgetThreshold(0,0), { percent:0, level:'green', warning:null });
  assert.deepEqual(MerCore.budgetThreshold(7999,10000), { percent:79.99000000000001, level:'green', warning:null });
  assert.equal(MerCore.budgetThreshold(800,1000).warning, 'near');
  assert.equal(MerCore.budgetThreshold(9499,10000).warning, 'near');
  assert.equal(MerCore.budgetThreshold(950,1000).warning, 'almost');
  assert.equal(MerCore.budgetThreshold(9999,10000).warning, 'almost');
  assert.equal(MerCore.budgetThreshold(1000,1000).level, 'red');
  assert.equal(MerCore.budgetThreshold(1500,1000).percent, 150);
});

test('evaluation cycle 2: cumulative pace uses live transactions and a dynamic month length', () => {
  const series = MerCore.cumulativeSpendingSeries([
    { type:'expense', amount:999_999.99, date:'2028-02-01T10:00:00' },
    { type:'expense', amount:-99.99, date:'2028-02-29T10:00:00' }
  ],'2028-02-29',1_000_000);
  assert.equal(series.length, 29);
  assert.equal(series[0].actual, 999_999.99);
  assert.equal(series.at(-1).actual, 999_900);
  assert.equal(series.at(-1).planned, 1_000_000);
});

test('evaluation cycle 2: every application chart consumes shared dynamic scale helpers', () => {
  const root = path.resolve(__dirname,'..');
  const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
  assert.match(app,/renderSpendingPaceChart/);
  assert.match(app,/MerCore\.cumulativeSpendingSeries/);
  assert.ok((app.match(/MerCore\.chartDomain/g)||[]).length >= 5);
  assert.ok((app.match(/MerCore\.scaleChartValue/g)||[]).length >= 8);
  assert.ok((app.match(/MerCore\.proportionalSegments/g)||[]).length >= 2);
  assert.doesNotMatch(app,/income\/(?:seriesMax|max)\*\d+/);
});
