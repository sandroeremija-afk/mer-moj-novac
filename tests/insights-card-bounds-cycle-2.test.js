const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('Insights owns a bounded desktop chart row instead of overflowing block flow', () => {
  const css = fs.readFileSync(require.resolve('../financial-polish.css'), 'utf8');
  assert.match(css, /#insightsView:not\(\[hidden\]\)\s*\{[^}]*grid-template-rows:auto auto minmax\(0,1fr\)/);
  assert.match(css, /#insightsView > #insightsFilters\s*\{[^}]*grid-area:1 \/ 1/);
  assert.match(css, /#insightsView > \.page-heading\s*\{[^}]*grid-area:1 \/ 2/);
  assert.match(css, /#insightsView > \.advanced-insights-grid\s*\{[^}]*grid-area:3 \/ 1 \/ 4 \/ -1/);
  assert.match(css, /\.insight-caption\s*\{[^}]*flex-shrink:0/);
  assert.match(css, /\.insight-caption :is\(strong,span\)\s*\{[^}]*font-size:12px[^}]*white-space:normal[^}]*overflow-wrap:anywhere/);
  assert.match(css, /@media\(max-width:1024px\)\s*\{[^}]*height:auto; min-height:min-content; padding-bottom:24px/);
});

test('responsive chart layout retains all three live financial targets and footer values', () => {
  const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
  for (const id of ['categoryDonut', 'monthlyBarChart', 'expenseStructureSummary', 'topCategoryValue', 'topCategoryContext', 'momValue', 'momContext']) {
    assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1);
  }
  for (const card of ['category-spending', 'cashflow-history', 'top-merchants']) assert.ok(html.includes(`data-layout-card="${card}"`));
});
