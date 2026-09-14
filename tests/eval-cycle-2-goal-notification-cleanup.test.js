'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const html = read('index.html');
const premium = read('premium.js');
const vaults = read('vaults-ui.js');
const details = read('savings-minimal.js');
const hierarchy = read('notification-hierarchy.css');

test('goal creation and editing contain no icon picker or icon payload', () => {
  for (const source of [html, premium, vaults]) {
    assert.doesNotMatch(source, /goalIconInput|goalIconLabel|vaultIconSuggestions|vault-icon-field/);
  }
  const submit = premium.split('\n').find(line => line.includes("$('#goalForm').addEventListener('submit'"));
  assert.ok(submit, 'goal form submit handler must exist');
  assert.doesNotMatch(submit, /\bicon\s*:/);
  assert.match(submit, /Object\.assign\(existing,payload\)/, 'editing retains legacy fields outside the editable payload');
});

test('goal summaries and details retain progress while omitting decorative goal icons', () => {
  for (const source of [premium, vaults, details]) {
    assert.doesNotMatch(source, /goal\.icon|class="(?:vault-goal-icon|vaults-emblem|savings-detail-icon)"/);
  }
  assert.match(premium, /class="goal-progress-ring"/);
  assert.match(vaults, /class="vaults-progress-ring"/);
  assert.match(details, /class="savings-detail-goal"><h3>\$\{esc\(goal\.name\)\}<\/h3>/);
  assert.match(details, /class="savings-detail-progress" role="progressbar"/);
});

test('notification hierarchy is loaded for both source and production builds', () => {
  assert.match(html, /<link rel="stylesheet" href="notification-hierarchy\.css">/);
  assert.ok(html.indexOf('href="notification-hierarchy.css"') > html.indexOf('href="ui-consistency.css"'));
  assert.match(read('scripts/build.js'), /suiteCss\.push\([^;]*'notification-hierarchy\.css'/);
  assert.match(hierarchy, /\.notification-copy > strong\s*\{[^}]*font-size:16px;[^}]*font-weight:600;/);
  assert.match(hierarchy, /\.notification-empty\s*\{[^}]*font-size:14px;/);
  assert.match(hierarchy, /\.notification-actions \.link-button\s*\{[^}]*font-size:12px;[^}]*font-weight:500;/);
  assert.match(hierarchy, /\.notification-actions \.resolve-alert-button\s*\{[^}]*font-weight:400;/);
});
