const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

test('cycle 2: browser root and application shell are locked to the dynamic viewport', () => {
  assert.match(css, /html, body \{[^}]*height:100%[^}]*overflow:hidden/s);
  assert.match(css, /body \{[^}]*height:100vh;[^}]*height:100dvh/s);
  assert.match(css, /\.app-shell \{[^}]*height:100vh;[^}]*height:100dvh;[^}]*overflow:hidden/s);
  assert.match(css, /\.main \{[^}]*height:100vh;[^}]*height:100dvh;[^}]*overflow:hidden/s);
  assert.match(css, /\.page \{[^}]*min-height:0;[^}]*overflow:hidden/s);
  assert.doesNotMatch(app, /window\.scrollTo/);
});

test('cycle 1: only Activity keeps an internal vertical scrolling window', () => {
  assert.match(css, /\.view \{[^}]*height:100%;[^}]*overflow:hidden/s);
  assert.match(css, /#overviewView[^}]*overflow:hidden/);
  assert.match(css, /#overviewView > \.dashboard-grid[^}]*overflow:visible/);
  assert.match(css, /#activityView[^}]*overflow:hidden/);
  assert.match(css, /\.transaction-list[^}]*overflow-y:auto/);
  assert.match(css, /\.budget-table, \.recurring-list,[^}]*max-height:none;[^}]*overflow:visible/s);
  assert.doesNotMatch(css, /\.settings-pane\.active[^}]*overflow-y:auto/);
  assert.doesNotMatch(css, /#overviewView > \.dashboard-grid[^}]*overflow-y:auto/);
});

test('cycle 1: secondary content uses progressive disclosure while the large import review owns its table scroll', () => {
  assert.match(css, /\.premium-settings\[open\][^}]*max-height:min\(90dvh,calc\(100dvh - 24px\)\)[^}]*overflow:hidden/);
  assert.match(css, /\.settings-pane\.active[^}]*overflow:visible/);
  assert.match(css, /\.import-table-wrap[^}]*scrollbar-gutter:stable/);
  for (const modal of ['overviewDetailsModal', 'budgetDetailsModal', 'savingsDetailsModal']) {
    assert.match(html, new RegExp(`id="${modal}"`));
    assert.match(html, new RegExp(`data-open-detail="${modal}"`));
  }
  assert.match(html, /id="insightsDetailsModal"/);
  assert.doesNotMatch(html, /data-open-detail="insightsDetailsModal"/, 'Insights no longer exposes the redundant report-details trigger');
  assert.match(app, /\$\$\('\[data-open-detail\]'\)/);
  assert.match(css, /@media \(max-height:720px\)/);
  assert.match(css, /@media \(max-width:767px\)/);
  assert.match(css, /@media \(max-width:540px\)/);
});

test('cycle 2: data actions are contextual to Budget, Activity and Insights', () => {
  const viewHeading = view => {
    const start = html.indexOf(`id="${view}"`);
    const next = html.indexOf('<section class="view"', start);
    const end = next >= 0 ? next : html.indexOf('</main>', start);
    return html.slice(start, end);
  };
  const budgets = viewHeading('budgetsView');
  const activity = viewHeading('activityView');
  const insights = viewHeading('insightsView');
  assert.match(budgets, /data-open-detail="budgetDataModal"/);
  assert.match(budgets, /id="budgetDataModal"/);
  assert.doesNotMatch(budgets, /data-open-global-import/);
  assert.match(budgets, /data-export-budget/);
  assert.doesNotMatch(budgets.slice(0, budgets.indexOf('<dialog')), /data-open-assessment/);
  assert.match(activity, /class="data-action-pair"/);
  assert.match(activity, /data-open-global-import/);
  assert.match(activity, /data-export-active/);
  assert.match(insights, /data-export-insights/);
  assert.doesNotMatch(insights, /data-open-global-import|data-export-active/);
});

test('cycle 2: Add Transaction offers batch import without an unrelated export action', () => {
  const start = html.indexOf('id="transactionModal"');
  const end = html.indexOf('</dialog>', start);
  const modal = html.slice(start, end);
  assert.match(modal, /class="bulk-entry-card"/);
  assert.match(modal, /data-open-global-import/);
  assert.doesNotMatch(modal, /data-export-active/);
  assert.match(modal, /data-i18n="bulkImport"/);
});

test('cycle 2: Settings owns preferences while import and export stay contextual', () => {
  const settingsStart = html.indexOf('id="bankSettingsModal"');
  const settingsEnd = html.indexOf('</dialog>', settingsStart);
  const settings = html.slice(settingsStart, settingsEnd);
  const generalStart = settings.indexOf('data-settings-panel="general"');
  const generalEnd = settings.indexOf('data-settings-panel=', generalStart + 1);
  const general = settings.slice(generalStart, generalEnd < 0 ? settings.length : generalEnd);
  assert.match(general, /id="settingsLanguage"/);
  assert.match(general, /id="themeToggle"/);
  assert.match(general, /id="layoutEditToggle"/);
  assert.doesNotMatch(settings, /data-settings-tab="import"/);
  assert.doesNotMatch(settings, /data-settings-panel="import"/);
  assert.doesNotMatch(settings, /data-open-global-import/);
  assert.doesNotMatch(settings, /dataPortability|settingsImportJson|settingsExportJson|settingsExportAllCsv|settingsExportCsv|settingsImportJsonFile/);
  assert.match(html, /id="importDataModal"/);
  assert.match(html, /id="importFile"/);
  assert.match(html, /id="budgetDataModal"/);
  assert.match(html, /data-export-budget/);
  assert.match(html, /data-export-insights/);
});

test('cycle 2: account dropdown is clean and the sidebar/header order is stable', () => {
  const accountStart = html.indexOf('id="accountMenu"');
  const accountEnd = html.indexOf('</div>', accountStart);
  const accountMenu = html.slice(accountStart, accountEnd);
  assert.doesNotMatch(accountMenu, /data-open-global-import/);
  assert.doesNotMatch(accountMenu, /id="exportCsv"/);
  assert.match(accountMenu, /data-account="personal"/);
  assert.match(accountMenu, /data-account="business"/);
  const sidebarIndex = html.indexOf('id="sidebar"');
  const brandIndex = html.indexOf('class="brand"', sidebarIndex);
  const sidebarTransactionIndex = html.indexOf('class="primary-button sidebar-transaction-button"', brandIndex);
  const navIndex = html.indexOf('class="nav-list"', sidebarTransactionIndex);
  assert.ok(sidebarIndex < brandIndex && brandIndex < sidebarTransactionIndex && sidebarTransactionIndex < navIndex);
  const moduleIndex = html.indexOf('id="contextHeader"');
  const actionsIndex = html.indexOf('class="top-actions"', moduleIndex);
  const dateIndex = html.indexOf('class="date-switcher"', actionsIndex);
  const clusterIndex = html.indexOf('class="header-action-cluster"', dateIndex);
  const notificationIndex = html.indexOf('class="notification-wrap"', clusterIndex);
  const bankIndex = html.indexOf('id="headerBankButton"', notificationIndex);
  assert.ok(moduleIndex > 0 && moduleIndex < actionsIndex);
  assert.doesNotMatch(html, /id="activeModuleTitle"/);
  assert.ok(actionsIndex < dateIndex && dateIndex < clusterIndex && clusterIndex < notificationIndex && notificationIndex < bankIndex);
  const sidebarMarkup = html.slice(sidebarIndex, html.indexOf('</aside>', sidebarIndex));
  assert.doesNotMatch(sidebarMarkup, /id="themeToggle"/);
  const headerMarkup = html.slice(actionsIndex, html.indexOf('</header>', actionsIndex));
  assert.doesNotMatch(headerMarkup, /id="themeToggle"|id="layoutEditToggle"|class="language-switch"|data-lang=/);
  assert.doesNotMatch(headerMarkup, /data-open-transaction/);
  assert.doesNotMatch(html, /id="systemTime"/);
  assert.match(app, /const moduleTitleKeys = \{overview:'navOverview',budgets:'navBudgets',savings:'navSavings',activity:'navActivity',insights:'navInsights'\}/);
  assert.match(app, /function renderModuleTitle\(now=new Date\(\)\)/);
});

test('cycle 2: centralized store loads before application bootstrap', () => {
  const storeIndex = html.search(/<script src="state-store\.js(?:\?[^\"]*)?"><\/script>/);
  const appIndex = html.search(/<script src="app\.js(?:\?[^\"]*)?"><\/script>/);
  assert.ok(storeIndex > 0);
  assert.ok(storeIndex < appIndex);
});
