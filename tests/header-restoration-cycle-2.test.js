'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const html = read('index.html');
const css = read('header-actions.css');
const enterprise = read('enterprise-ui.js');

function heading(view) {
  const start = html.indexOf(`id="${view}View"`);
  const end = html.indexOf('\n', html.indexOf('class="page-heading actions-only-heading"', start));
  assert.ok(start >= 0 && end > start, `${view} keeps a module action toolbar`);
  return html.slice(start, end);
}

function declarations(selector) {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, `CSS selector exists: ${selector}`);
  return css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
}

test('cycle 2: original module action buttons are no longer reparented into overflow menus', () => {
  for (const file of ['index.html', 'app.js', 'scripts/build.js', 'scripts/preflight.js']) {
    assert.doesNotMatch(read(file), /module-toolbar\.(?:js|css)|MerModuleToolbar/, file);
  }
  assert.doesNotMatch(html, /module-toolbar-trigger|Više opcija/);
  assert.match(html, /href="header-actions\.css"/);
  assert.match(read('scripts/build.js'), /header-actions\.css/);
});

test('cycle 2: all five modules retain visible direct header actions and original primary entry routes', () => {
  for (const [view, primary] of [
    ['overview', 'data-open-transaction'], ['budgets', 'id="addCategory"'],
    ['savings', 'data-open-savings'], ['activity', 'data-open-transaction'],
    ['insights', 'data-open-transaction']
  ]) {
    const toolbar = heading(view);
    assert.match(toolbar, new RegExp(primary));
    assert.match(toolbar, /class="primary-button"/);
    assert.match(toolbar, /class="secondary-button"/);
    assert.doesNotMatch(toolbar, /role="menuitem"|popover|module-toolbar/);
  }
  assert.match(heading('overview'), /data-open-assessment/);
  assert.match(heading('overview'), /overviewDetailsModal/);
  assert.match(heading('budgets'), /budgetDetailsModal/);
  assert.match(heading('savings'), /savingsDetailsModal/);
  assert.match(heading('savings'), /data-open-assessment/);
  assert.match(enterprise, /querySelector\('#overviewView \.heading-actions'\)\.prepend\(toolbar\)/);
  assert.match(enterprise, /querySelector\('#activityView \.heading-actions'\)\?\.prepend\(receiptTrigger\)/);
});

test('cycle 2: Activity has one transfer entry and Savings exposes its contextual export entry', () => {
  const activity = heading('activity');
  assert.equal((activity.match(/data-activity-transfer/g) || []).length, 1);
  assert.match(activity, /Uvoz \/ Izvoz/);
  assert.doesNotMatch(activity, /data-open-global-import|data-export-active|data-action-pair/);
  assert.match(heading('savings'), /data-export-savings/);
});

test('cycle 2: restored action labels cannot inherit the old icon-only mobile clipping styles', () => {
  const labels = declarations('#appShell .actions-only-heading .heading-actions > button > span');
  for (const rule of ['display:block', 'position:static', 'width:auto', 'height:auto', 'overflow:visible', 'clip:auto', 'clip-path:none', 'white-space:normal']) {
    assert.ok(labels.includes(rule), rule);
  }
  const toolbar = declarations('#appShell .actions-only-heading .heading-actions');
  assert.match(toolbar, /flex-wrap:wrap/);
  assert.match(toolbar, /min-width:0/);
  assert.match(toolbar, /max-width:100%/);
  assert.match(css, /@media \(max-width:600px\)[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /> button\[hidden\] \{ display:none; \}/);
  assert.match(declarations('#appShell .actions-only-heading .heading-actions > button'), /min-height:44px/);
});

test('cycle 2: all Settings checkboxes keep a white surface and a dark checkmark in either theme', () => {
  const normal = declarations('#bankSettingsModal input[type="checkbox"]');
  const checked = declarations('#bankSettingsModal input[type="checkbox"]:checked');
  assert.match(normal, /appearance:none/);
  assert.match(normal, /background-color:#fff/);
  assert.match(normal, /color-scheme:light/);
  assert.match(normal, /border:1\.5px solid #475569/);
  assert.match(checked, /background-color:#fff/);
  assert.match(checked, /stroke='%23182b24'/);
  assert.match(checked, /background-image:url\("data:image\/svg\+xml/);
  assert.doesNotMatch(css, /\[data-theme=.*input\[type="checkbox"\]/, 'no dark-mode override can recolor the white square');
  assert.match(html, /type="checkbox" role="switch" id="hideBalances"/);
  assert.match(enterprise, /type="checkbox" role="switch" id="autoLockEnabled"/);
});

test('cycle 2: Settings checkbox labels remain touchable, focusable, and usable in forced colors', () => {
  const checkbox = declarations('#bankSettingsModal input[type="checkbox"]');
  assert.match(checkbox, /width:22px !important/);
  assert.match(checkbox, /height:22px !important/);
  assert.match(declarations('#bankSettingsModal label:has(> input[type="checkbox"])'), /min-height:44px/);
  assert.match(declarations('#bankSettingsModal input[type="checkbox"]:focus-visible'), /outline:3px solid/);
  assert.match(declarations('#bankSettingsModal input[type="checkbox"]:disabled'), /cursor:not-allowed/);
  assert.match(css, /@media \(forced-colors:active\)[\s\S]*appearance:auto;[\s\S]*forced-color-adjust:auto/);
  assert.doesNotMatch(css, /pointer-events:none|display:none[^}]*input|visibility:hidden/);
});
