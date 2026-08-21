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

test('cycle 2: each module scrolls inside the shell while Overview and Activity use dedicated panes', () => {
  assert.match(css, /\.view \{[^}]*height:100%;[^}]*overflow-y:auto/s);
  assert.match(css, /#overviewView[^}]*overflow:hidden/);
  assert.match(css, /#overviewView > \.dashboard-grid[^}]*overflow-y:auto/);
  assert.match(css, /#activityView[^}]*overflow:hidden/);
  assert.match(css, /\.transaction-list[^}]*overflow-y:auto/);
  assert.match(css, /\.budget-table[^}]*overflow-y:auto/);
  assert.match(css, /\.recurring-list[^}]*overflow-y:auto/);
  assert.match(css, /\.savings-entry-list[^}]*overflow-y:auto/);
  assert.match(css, /\.notification-list[^}]*overflow-y:auto/);
});

test('cycle 2: settings and import review remain usable without escaping the viewport', () => {
  assert.match(css, /\.premium-settings\[open\][^}]*max-height:calc\(100dvh - 24px\)[^}]*overflow:hidden/);
  assert.match(css, /\.settings-pane\.active[^}]*overflow-y:auto/);
  assert.match(css, /\.import-table-wrap[^}]*scrollbar-gutter:stable/);
  assert.match(css, /@media \(max-height:720px\)/);
  assert.match(css, /@media \(max-width:800px\)/);
  assert.match(css, /@media \(max-width:540px\)/);
});

test('cycle 2: Budget, Activity and Insights expose symmetrical import/export pairs', () => {
  for (const view of ['budgetsView', 'activityView', 'insightsView']) {
    const start = html.indexOf(`id="${view}"`);
    const end = html.indexOf('</section>', start);
    const heading = html.slice(start, end);
    assert.match(heading, /class="data-action-pair"/);
    assert.match(heading, /data-open-global-import/);
    assert.match(heading, /data-export-active/);
  }
});

test('cycle 2: Add Transaction offers batch import and paired active-profile export', () => {
  const start = html.indexOf('id="transactionModal"');
  const end = html.indexOf('</dialog>', start);
  const modal = html.slice(start, end);
  assert.match(modal, /class="bulk-entry-card"/);
  assert.match(modal, /data-open-global-import/);
  assert.match(modal, /data-export-active/);
  assert.match(modal, /data-i18n="bulkImport"/);
});

test('cycle 2: Settings provides both JSON and CSV/Excel import/export pairs', () => {
  assert.match(html, /id="settingsImportJson"/);
  assert.match(html, /id="settingsExportJson"/);
  assert.match(html, /id="settingsImportJsonFile"[^>]*accept="application\/json,\.json"/);
  assert.match(html, /data-open-global-import/);
  assert.match(html, /id="settingsExportAllCsv"/);
  assert.match(html, /settings-footer data-action-pair/);
  const importPaneStart = html.indexOf('data-settings-panel="import"');
  const importPaneEnd = html.indexOf('</section>', importPaneStart);
  const importPane = html.slice(importPaneStart, importPaneEnd);
  assert.match(importPane, /class="data-action-pair"/);
  assert.match(importPane, /id="importFile"/);
  assert.match(importPane, /data-export-active/);
});

test('cycle 2: centralized store loads before application bootstrap', () => {
  const storeIndex = html.indexOf('<script src="state-store.js"></script>');
  const appIndex = html.indexOf('<script src="app.js"></script>');
  assert.ok(storeIndex > 0);
  assert.ok(storeIndex < appIndex);
});
