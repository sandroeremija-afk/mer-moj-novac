const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const assistantUi = fs.readFileSync(path.join(root, 'assistant-ui.js'), 'utf8');

test('evaluation cycle 2: Dashboard Detalji uses one live category report and fully wrapping labels', () => {
  const start = html.indexOf('id="overviewDetailsModal"');
  const end = html.indexOf('</dialog>', start);
  const modal = html.slice(start, end);
  assert.match(modal, /id="overviewVisualBreakdown"/);
  assert.doesNotMatch(modal, /upcoming-panel|goal-panel|line-chart/);
  assert.match(app, /function renderOverviewBreakdown\(\)/);
  assert.match(app, /categorySummarySlices\(categories\)/);
  const singlePage = fs.readFileSync(path.join(root, 'single-page-popups.css'), 'utf8');
  assert.match(singlePage, /#overviewDetailsModal \{ width:min\(900px/);
  assert.match(singlePage, /overflow-wrap:anywhere; overflow:visible; white-space:normal; text-overflow:clip/);
});

test('evaluation cycle 2: Budgets owns a 350px internal category scroll area and no bottom-right actions', () => {
  const start = html.indexOf('id="budgetsView"');
  const end = html.indexOf('id="savingsView"', start);
  const budgets = html.slice(start, end);
  assert.doesNotMatch(budgets, /class="allocation-actions"/);
  assert.doesNotMatch(budgets, /id="manageBudgetCategories"/);
  assert.match(css, /\.budget-table-window \{[^}]*max-height:350px;[^}]*overflow-y:auto;[^}]*scrollbar-gutter:stable;/);
  assert.match(app, /manageBudgetCategories'\)\?\.addEventListener/);
});

test('evaluation cycle 2: each Insights analysis card has one clean h2 title', () => {
  const start = html.indexOf('class="advanced-insights-grid"');
  const end = html.indexOf('id="insightsDetailsModal"', start);
  const cards = html.slice(start, end);
  assert.doesNotMatch(cards, /<p class="overline"/);
  for (const key of ['categoryDonutTitle', 'incomeVsExpenses', 'fixedVsVariableExpenses']) {
    assert.equal((cards.match(new RegExp(`<h2 data-i18n="${key}"`, 'g')) || []).length, 1);
  }
  assert.doesNotMatch(cards, /data-layout-card="savings-rate"/, 'the savings rate belongs to the top summary row');
});

test('evaluation cycle 2: floating AI widget omits the aggregate-profile sentence only', () => {
  const start = html.indexOf('class="assistant-widget"');
  const end = html.indexOf('</section>', start);
  const widget = html.slice(start, end);
  assert.match(widget, /data-i18n="assistantWidgetDisclaimer"/);
  assert.doesNotMatch(widget, /Šalju se samo zbirni iznosi aktivnog profila\./);
  assert.match(assistantUi, /assistantWidgetDisclaimer:'AI odgovor je informativan i ne zamjenjuje profesionalni financijski savjet\.'/);
  assert.match(assistantUi, /assistantWidgetDisclaimer:'AI responses are informational and do not replace professional financial advice\.'/);
});
