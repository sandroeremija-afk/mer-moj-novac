const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

test('evaluation cycle 2: spending pace expands across the Details modal without clipping', () => {
  assert.match(css, /\.overview-detail-grid \{ grid-template-columns:repeat\(2,minmax\(0,1fr\)\); \}/);
  assert.match(css, /\.overview-detail-grid \.chart-panel \{[^}]*width:100%[^}]*grid-column:1 \/ -1/s);
  assert.match(css, /\.overview-detail-grid \.line-chart svg \{[^}]*width:100%[^}]*max-height:none[^}]*aspect-ratio:660 \/ 220/s);
});

test('evaluation cycle 2: Budget import has one primary import action and no leftover export action', () => {
  const start = html.indexOf('id="importDataModal"');
  const end = html.indexOf('</dialog>', start);
  const modal = html.slice(start, end);
  assert.match(modal, /id="importFile"/);
  assert.match(modal, /class="primary-button file-button"/);
  assert.doesNotMatch(modal, /data-export-active/);
  assert.match(css, /#budgetsView \.budget-category strong \{ font-size:\.8125rem/);
  assert.match(css, /#budgetsView \.budget-row-value \{ font-size:\.8125rem/);
});

test('evaluation cycle 2: Savings ring and Activity rows use explicit, centered and legible sizing', () => {
  assert.match(css, /\.goal-progress-ring span \{[^}]*position:absolute[^}]*inset:0[^}]*display:grid[^}]*place-items:center[^}]*line-height:1[^}]*text-align:center/s);
  assert.match(css, /#activityView \.transaction-item \{ grid-template-columns:42px[^}]*36px; \}/);
  assert.match(css, /\.transaction-copy strong \{[^}]*font-size: \.875rem/s);
  assert.match(css, /\.transaction-amount \{ font-size: \.875rem/);
  assert.match(css, /\.transaction-source \{[^}]*min-height: 22px[^}]*font-size: \.625rem/s);
});

test('evaluation cycle 2: every Insights KPI and chart card expands through one reactive deep-dive modal', () => {
  const cards = html.match(/data-insight-detail="[^"]+"/g) || [];
  assert.equal(cards.length, 7);
  for (const kind of ['net','income','expenses','category','cashflow','merchants','savings-rate']) {
    assert.match(html, new RegExp(`data-insight-detail="${kind}"`));
  }
  assert.match(html, /id="insightChartModal"/);
  assert.match(html, /id="insightExpandedMetrics"/);
  assert.match(html, /id="insightExpandedChart"/);
  assert.match(html, /id="insightExpandedBreakdown"/);
  assert.match(app, /function renderInsightDetail\(kind\)/);
  assert.match(app, /MerAccounting\.monthSeries\(state\.transactions,appReferenceDate,12\)/);
  assert.match(app, /const categoryDomain=MerCore\.chartDomain\(categories\.map\(\(\[,amount\]\)=>amount\)\)/);
  assert.match(app, /kind==='merchants'[\s\S]*?categoryName\(id\)[\s\S]*?copy\.ofExpenses/);
  assert.doesNotMatch(app, /merchantTotal=/);
  assert.match(app, /function openInsightDetail\(kind\)/);
  assert.match(app, /if\(\$\('#insightChartModal'\)\?\.open&&activeInsightDetail\)renderInsightDetail\(activeInsightDetail\)/);
  assert.match(css, /\.insight-expanded-modal \{ width:min\(1060px/);
  assert.match(css, /\.insight-clickable:hover/);
});

