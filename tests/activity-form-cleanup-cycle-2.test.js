'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('activity result count follows the page controls, not the search field', () => {
  const html = read('index.html');
  const activity = html.slice(html.indexOf('id="activityView"'), html.indexOf('id="insightsView"'));
  assert.ok(activity.indexOf('id="activityResultSummary"') > activity.indexOf('id="activityNextPage"'));
  assert.equal((activity.match(/id="activityResultSummary"/g) || []).length, 1);
  assert.match(read('styles.css'), /\.activity-result-summary\s*\{[^}]*text-align:center/);
});

test('fluid controls do not overwrite the activity search icon gutter', () => {
  const fluid = read('fluid-layout.css');
  assert.doesNotMatch(fluid, /activity-toolbar :is\(input,select,button\)/);
  assert.match(fluid, /activity-toolbar input\s*\{[^}]*min-height:var\(--fluid-control\)/);
  assert.match(read('styles.css'), /\.search-field input\s*\{ padding: 0 12px 0 38px/);
});

test('manual transaction form no longer loads the separate AI sentence editor', () => {
  assert.doesNotMatch(read('index.html'), /<script src="natural-input-ui\.js"/);
  assert.doesNotMatch(read('index.html'), /<script src="engagement-init\.js"/);
  assert.doesNotMatch(read('scripts/build.js'), /'natural-input-ui\.js'/);
  assert.match(read('index.html'), /id="transactionForm"/);
  assert.match(read('index.html'), /src="assistant-ui\.js(?:\?[^\"]*)?"/);
});

test('phone card form reserves normal-flow space for validation and footer actions', () => {
  assert.match(read('modal-space.css'), /dialog#transactionModal\[open\][^{]*\{[^}]*max-height:calc\(var\(--ui-visual-height,100dvh\) - 16px\)/);
  assert.match(read('modal-space.css'), /#transactionModal #transactionForm \.mer-modal-footer\s*\{[^}]*position:static/);
  assert.match(read('natural-input-ui.css'), /\.transaction-payment-card\[hidden\]\{display:none\}/);
});
