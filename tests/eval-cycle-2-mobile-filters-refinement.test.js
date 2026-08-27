const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

test('evaluation cycle 2: Activity exposes date, category, type, amount sorting and reset controls', () => {
  for (const id of ['activityDateFrom', 'activityDateTo', 'activityFilter', 'activityTypeFilter', 'activitySort', 'clearActivityFilters']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /value="amount-desc"/);
  assert.match(html, /value="amount-asc"/);
  assert.match(app, /MerCore\.filterActivityTransactions\(state,\{/);
  assert.match(app, /dateFrom:\$\('#activityDateFrom'\)\.value/);
  assert.match(app, /sort,\s*reviewOnly:activityReviewOnly/);
  assert.match(app, /\['activityFilter','activityTypeFilter','activityDateFrom','activityDateTo','activitySort'\]/);
});

test('evaluation cycle 2: the 375px Settings sheet is bounded and scrolls only its body', () => {
  assert.match(html, /class="settings-modal-body"/);
  assert.match(css, /\.premium-settings\[open\] \{[\s\S]*?height:90dvh;[\s\S]*?max-height:90dvh;[\s\S]*?overflow:hidden;/);
  assert.match(css, /\.premium-settings \.settings-modal-body \{[^}]*flex:1 1 auto;[^}]*overflow-y:auto;/);
  assert.match(css, /\.premium-settings \.settings-tabs \{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test('evaluation cycle 2: MER recommendation and weekly review cannot overflow a narrow Savings canvas', () => {
  assert.match(css, /#savingsView \.recommendation-panel \{[\s\S]*?width:100%;[\s\S]*?min-width:0;[\s\S]*?overflow:hidden;/);
  assert.match(css, /#savingsView \.recommendation-panel h2,[\s\S]*?overflow-wrap:anywhere/);
  assert.match(css, /\.weekly-review-card \{ grid-template-columns:38px minmax\(0,1fr\); \}/);
  assert.match(css, /\.weekly-review-card \.link-button \{ grid-column:2; justify-self:start; \}/);
});

test('evaluation cycle 2: Activity toolbar becomes one fluid column on mobile without horizontal overflow', () => {
  assert.match(css, /@media \(max-width:767px\) \{[\s\S]*?\.activity-toolbar \{ display:grid; grid-template-columns:minmax\(0,1fr\);/);
  assert.match(css, /\.activity-toolbar > \* \{ width:100%; \}/);
  assert.match(css, /\.filter-field input \{[\s\S]*?min-width:0;/);
});
