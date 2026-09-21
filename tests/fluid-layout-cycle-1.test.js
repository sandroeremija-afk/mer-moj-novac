'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = file => fs.readFileSync(require.resolve('../' + file), 'utf8');
const css = read('fluid-layout.css');

test('fluid scale is bounded by both viewport dimensions and leaves mobile flow unchanged', () => {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  assert.match(source, /^@media \(min-width:1025px\)\s*\{/);
  assert.match(source, /--fluid-step:clamp\(0px,min\(calc\(\(100vw - 1366px\) \* \.025\),calc\(\(100dvh - 768px\) \* \.025\)\),16px\)/);
  let depth = 0;
  for (let index = source.indexOf('{'); index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (!depth) assert.equal(index, source.length - 1, 'No styles leak out of the desktop media query');
  }
  assert.doesNotMatch(source, /overflow:\s*(?:hidden|clip)|display:none|transform:|zoom:|!important/);
});

test('all four desktop targets enlarge the whole hierarchy without unbounded controls or metrics', () => {
  const summary = css.match(/--fluid-summary-height:clamp\((\d+)px,calc\((\d+)dvh - (\d+)px\),(\d+)px\)/);
  assert.ok(summary);
  const [, min, rate, offset, max] = summary.map(Number);
  const clamp = (value, lower, upper) => Math.max(lower, Math.min(value, upper));
  const sizes = [[1366,768],[1440,900],[1920,1080],[2560,1440]].map(([width,height]) => {
    const step = clamp(Math.min((width - 1366) * .025, (height - 768) * .025), 0, 16);
    return { height, summary:clamp(height * rate / 100 - offset,min,max), metric:28 + step, control:44 + step * .75, pad:20 + step * .75 };
  });
  for (let index = 1; index < sizes.length; index += 1) {
    for (const property of ['summary','metric','control','pad']) assert.ok(sizes[index][property] > sizes[index - 1][property], property + ' grows with the page');
  }
  assert.ok(sizes[2].summary >= 220 && sizes[2].summary <= 260, '1080p summary shares spare height with the lower cards');
  assert.equal(sizes[3].metric,44);
  assert.equal(sizes[3].control,56);
  assert.ok(sizes.every(size => size.summary / size.height >= .19 && size.summary / size.height <= .24));
  assert.match(css, /--fluid-control:calc\(44px \+ var\(--fluid-step\) \* \.75\)/);
  assert.match(css, /--fluid-metric:calc\(28px \+ var\(--fluid-step\)\)/);
});

test('summary, savings hero, and insights rows grow before their remaining-space rows', () => {
  assert.match(css, /:is\(#overviewView,#budgetsView\) > \.summary-grid \{[^}]*min-height:var\(--fluid-summary-height\)/);
  assert.match(css, /#savingsView \{[^}]*grid-template-rows:auto clamp\(218px,calc\(30dvh \+ var\(--fluid-step\) \* 3\),480px\) minmax\(0,1fr\)/);
  assert.match(css, /#insightsView:not\(\[hidden\]\) \{[^}]*grid-template-rows:auto minmax\(var\(--fluid-summary-height\),auto\) minmax\(0,1fr\)/);
  assert.match(css, /#activityView #transactionList \.transaction-amount[^}]*var\(--fluid-step\)/);
  assert.match(css, /#budgetsView #budgetTable \.budget-category strong/);
});

test('a single visible savings goal fills its row without unhiding paginated goals', () => {
  assert.match(css, /#goalBucketGrid:not\(:has\(> \.goal-bucket-card:not\(\[data-page-hidden="true"\]\):not\(\[hidden\]\) ~ \.goal-bucket-card:not\(\[data-page-hidden="true"\]\):not\(\[hidden\]\)\)\)\s*\{\s*grid-template-columns:minmax\(0,1fr\)/);
  assert.match(read('zero-scroll.css'), /\[data-page-hidden="true"\][^}]*display:none !important/);
  assert.match(read('premium.js'), /pageSize:window\.innerWidth<=800\?1:2,itemSelector:'\.goal-bucket-card'/);
});

test('larger financial values retain wrapping and long donut values keep their fit tiers', () => {
  assert.match(css, /\.summary-value \{[^}]*overflow-wrap:anywhere/);
  assert.match(css, /#donutTotal\[data-fit="regular"\]/);
  assert.doesNotMatch(css, /#donutTotal\[data-fit="(?:medium|small)"\]/);
  assert.match(read('page-space.css'), /@media \(max-width:640px\)[\s\S]*grid-template-columns:minmax\(0,1fr\) 44px/);
});

test('fluid stylesheet is last in the page cascade and included in the production bundle', () => {
  const html = read('index.html');
  assert.ok(html.indexOf('fluid-layout.css') > html.indexOf('page-space.css'));
  assert.match(read('scripts/build.js'), /suiteCss\.push\([^)]*'fluid-layout.css'/);
});

test('module action controls outrank legacy header rules and topbar controls inherit the same scale', () => {
  assert.match(read('header-actions.css'), /#appShell \.actions-only-heading \.heading-actions > button \{[^}]*min-height:44px/);
  assert.match(css, /#appShell \.page > \.view > \.actions-only-heading \.heading-actions > button,[^{]*\{[^}]*min-height:var\(--fluid-control\)/);
  assert.match(css, /#appShell \{[^}]*--fluid-step:[^}]*--fluid-control:/);
  assert.match(css, /#appShell \.topbar :is\(\.header-layout-toggle,\.notification-button\),[^{]*\{[^}]*width:var\(--fluid-control\);[^}]*height:var\(--fluid-control\)/);
  assert.match(css, /#appShell \.topbar \.header-bank-button \{[^}]*min-height:var\(--fluid-control\);[^}]*font-size:calc\(13px \+ var\(--fluid-step\) \* \.1875\)/);
  assert.match(css, /#appShell \.topbar \.header-action-cluster > \.enterprise-header-controls > \.icon-button,[^{]*\{[^}]*height:var\(--fluid-control\)/);
  assert.match(css, /#appShell \.topbar \.header-action-cluster > \.enterprise-header-controls > \.icon-button > svg,[^{]*\{[^}]*width:calc\(18px \+ var\(--fluid-step\) \* \.25\)/);
  assert.match(css, /\.heading-actions > button > svg \{[^}]*flex-basis:calc\(17px \+ var\(--fluid-step\) \* \.25\)/);
});
