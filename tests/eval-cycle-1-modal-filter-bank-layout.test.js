const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

test('evaluation cycle 1: Banke places both CSV exports side by side in the same two-column grid', () => {
  const banksStart = html.indexOf('data-settings-panel="banks"');
  const banksEnd = html.indexOf('</section>', banksStart);
  const banks = html.slice(banksStart, banksEnd);
  const gridStart = banks.indexOf('<div class="export-grid">');
  const gridEnd = banks.indexOf('</div><input type="file"', gridStart);
  const grid = banks.slice(gridStart, gridEnd);
  assert.ok(gridStart >= 0 && gridEnd > gridStart);
  assert.match(grid, /id="settingsExportAllCsv"[\s\S]*id="settingsExportCsv"/);
  assert.equal((grid.match(/class="settings-export"/g) || []).length, 4);
  assert.match(css, /\.export-grid \{ display:grid; grid-template-columns:1fr 1fr; gap:10px; \}/);
});

test('evaluation cycle 1: wizard header reserves a dedicated close-button lane', () => {
  assert.match(css, /\.assessment-head \{[^}]*min-height:44px;[^}]*padding-inline-end:56px;/);
  assert.match(css, /\[data-ui="dialog"\] > \.modal-close \{[^}]*width:44px;[^}]*height:44px;/);
  assert.match(html, /class="assessment-head"[\s\S]*class="step-dots"/);
});

test('evaluation cycle 1: wizard step 3 cannot create horizontal scrolling', () => {
  assert.match(css, /\[data-ui-kind="wizard"\] \[data-ui="wizard-step"\]\.active \{[^}]*inline-size:100%;[^}]*max-inline-size:100%;[^}]*overflow-x:hidden;[^}]*overflow-y:auto;/);
  assert.match(css, /\.plan-preview \{[^}]*flex-wrap:wrap;/);
  assert.match(css, /\.plan-preview strong \{[^}]*overflow-wrap:anywhere;[^}]*white-space:normal;/);
  assert.match(css, /\.guard-options input \{[^}]*width:1px;[^}]*height:1px;[^}]*clip-path:inset\(50%\);/);
});

test('evaluation cycle 1: Activity exposes only search and Filteri until its popover is opened', () => {
  const activityStart = html.indexOf('id="activityView"');
  const activityEnd = html.indexOf('</section>', html.indexOf('activity-panel', activityStart));
  const activity = html.slice(activityStart, activityEnd);
  assert.match(activity, /id="activitySearch"[\s\S]*id="activityFiltersToggle"[^>]*aria-controls="activityFiltersPanel"[^>]*aria-expanded="false"/);
  assert.match(activity, /id="activityFiltersPanel" hidden[\s\S]*id="activityDateFrom"[\s\S]*id="clearActivityFilters"/);
  assert.match(app, /function setActivityFiltersOpen\(open\)[\s\S]*panel\.hidden=!open;[\s\S]*aria-expanded/);
  assert.match(app, /activityFiltersToggle'\)\.addEventListener\('click',\(\)=>setActivityFiltersOpen/);
});
