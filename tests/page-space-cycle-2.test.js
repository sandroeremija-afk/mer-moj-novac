'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = file => fs.readFileSync(require.resolve('../' + file), 'utf8');
const css = read('page-space.css');

function declarations(selector) {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const block = [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .find(match => match[1].split(',').map(part => part.trim()).includes(selector));
  assert.ok(block, `Missing scoped layout rule: ${selector}`);
  return block[2];
}

test('space-filling stays desktop-only and does not alter dialogs, hidden rows, or state', () => {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  assert.match(source, /^@media \(min-width:1025px\)\s*\{/);
  const desktop = source.slice(0, source.indexOf('@media (max-width:640px)')).trim();
  let depth = 0;
  const firstBrace = desktop.indexOf('{');
  for (let index = firstBrace; index < desktop.length; index += 1) {
    if (desktop[index] === '{') depth += 1;
    if (desktop[index] === '}') depth -= 1;
    if (depth === 0) assert.equal(index, desktop.length - 1, 'Space-filling overrides stay in the desktop media query');
  }
  assert.doesNotMatch(source, /dialog|Modal|\[data-page-hidden|\[data-section-hidden|position:\s*(?:fixed|absolute)|!important/);
  assert.match(read('zero-scroll.css'), /\[data-page-hidden="true"\][^}]*display:none !important/);
});

test('phone budget rows use two shrinkable tracks rather than clipping the inherited tablet grid', () => {
  const mobile = css.slice(css.indexOf('@media (max-width:640px)'));
  assert.match(mobile, /^@media \(max-width:640px\)/);
  assert.doesNotMatch(mobile, /overflow:\s*(?:hidden|clip)|display:none|flex:1|height:/);
  assert.match(declarations('#budgetsView #budgetTable .budget-row'), /grid-template-columns:minmax\(0,1fr\) 44px/);
  const progress = declarations('#budgetsView #budgetTable .budget-row-progress');
  assert.match(progress, /grid-column:1 \/ -1;\s*grid-row:2/);
  assert.match(progress, /grid-template-columns:minmax\(0,1fr\) max-content/);
  assert.match(declarations('#budgetsView #budgetTable .budget-category'), /min-width:0/);
  assert.match(declarations('#budgetsView #budgetTable .edit-budget'), /grid-column:2; grid-row:1/);
});

test('overview fills remaining canvas with and without a spending alert', () => {
  for (const selector of ['#overviewView > .dashboard-grid', '#overviewView:has(.spending-anomaly-alert:not([hidden])) > .dashboard-grid']) {
    const rule = declarations(selector);
    assert.match(rule, /flex:1 1 0/);
    assert.match(rule, /max-height:none/);
    assert.match(rule, /min-height:0/);
  }
});

test('budget page stretches only the visible rows and retains a nonshrinking pager and allocation footer', () => {
  assert.match(declarations('#budgetsView #budgetTableWindow'), /flex-direction:column/);
  assert.match(declarations('#budgetsView #budgetTableWindow'), /flex:1 1 0/);
  assert.match(declarations('#budgetsView #budgetTable'), /grid-auto-rows:minmax\(0,1fr\)/);
  const pager = declarations('#budgetsView #budgetTableWindow > .mer-pagination');
  assert.match(pager, /flex:0 0 auto/);
  assert.match(pager, /margin-top:auto/);
  assert.match(css, /#budgetsView > \.table-panel > :is\(\.allocation-bar,\.allocation-foot\)[^}]*flex:0 0 auto/);
});

test('activity keeps date headings intrinsic and fills empty-state and transaction space separately', () => {
  assert.match(declarations('#activityView #transactionList'), /display:flex/);
  assert.match(declarations('#activityView #transactionList > .transaction-date'), /flex:0 0 auto/);
  assert.match(declarations('#activityView #transactionList > .transaction-item'), /flex:1 1 0/);
  assert.match(declarations('#activityView #transactionList:empty'), /flex:0 0 auto/);
  assert.match(declarations('#activityView #activityEmpty:not([hidden])'), /align-content:center/);
  assert.match(declarations('#activityView #activityPagination'), /margin-top:auto/);
});

test('insights and savings charts use remaining card space without height caps on their page grids', () => {
  assert.match(declarations('#insightsView > .advanced-insights-grid'), /max-height:none/);
  assert.match(declarations('#insightsView #categoryDonut'), /aspect-ratio:1/);
  assert.match(declarations('#insightsView #categoryDonut'), /max-width:100%/);
  assert.match(declarations('#insightsView #monthlyBarChart'), /grid-auto-rows:minmax\(0,1fr\)/);
  assert.match(declarations('#savingsView .savings-area-chart'), /flex:1 1 0; min-height:0/);
  assert.match(declarations('#savingsView #savingsHistorySvg'), /height:100%/);
});

test('page space stylesheet ships after the existing cascade in source and offline bundle', () => {
  const html = read('index.html');
  assert.ok(html.indexOf('page-space.css') > html.indexOf('modal-space.css'));
  assert.match(read('scripts/build.js'), /suiteCss\.push\([^)]*'page-space.css'/);
});

test('larger donut scales short amounts while preserving compact long-value fit tiers', () => {
  assert.match(declarations('#insightsView #donutTotal[data-fit="regular"]'), /font-size:clamp\(12px,11\.5cqi,22px\)/);
  assert.doesNotMatch(css, /#donutTotal\[data-fit="(?:medium|small)"\]/);
  const renderer = read('app.js');
  assert.match(renderer, /donutExact\.length>12\?compactChartCurrency\(expenseTotal\):donutExact/);
  assert.match(renderer, /donutDisplay\.length>10\?'small':donutDisplay\.length>8\?'medium':'regular'/);
  assert.match(read('responsive-ui.js'), /'\.category-donut'/, 'donut remains an inline-size chart container for cqi sizing');
  assert.match(read('styles.css'), /\[data-ui="chart"\][^{]*\{[^}]*container-type:inline-size/);
});
