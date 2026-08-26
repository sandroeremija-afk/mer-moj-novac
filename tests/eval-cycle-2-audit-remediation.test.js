const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const premium = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'auth-ui.js'), 'utf8');
const interactiveSource = `${app}\n${premium}\n${auth}`;

function openingTag(id) {
  return html.match(new RegExp(`<[^>]+\\bid=["']${id}["'][^>]*>`, 'i'))?.[0] || '';
}

function expectId(id) {
  assert.match(html, new RegExp(`\\bid=["']${id}["']`, 'i'), `missing #${id}`);
}

function expectScriptReference(id) {
  assert.match(
    interactiveSource,
    new RegExp(`(?:["']#${id}["']|["']${id}["'])`),
    `missing interaction wiring for #${id}`
  );
}

test('cycle 2 audit: Budget language distinguishes the flexible pool from safe-to-spend', () => {
  const monthlyLabels = [...app.matchAll(/monthlyBudget\s*:\s*['"]([^'"]+)['"]/g)].map(match => match[1]);
  const remainingLabels = [...app.matchAll(/remainingBudget\s*:\s*['"]([^'"]+)['"]/g)].map(match => match[1]);

  assert.ok(monthlyLabels.some(label => /fleksibil/i.test(label)), 'Croatian budget label must explicitly say flexible');
  assert.ok(monthlyLabels.some(label => /flexible/i.test(label)), 'English budget label must explicitly say flexible');
  assert.ok(remainingLabels.some(label => /sigurno/i.test(label)), 'Croatian remaining label must explicitly say safe');
  assert.ok(remainingLabels.some(label => /safe/i.test(label)), 'English remaining label must explicitly say safe');

  const budgetsView = html.slice(html.indexOf('data-view-panel="budgets"'), html.indexOf('data-view-panel="savings"'));
  assert.match(budgetsView, /Fleksibilni[^<]*budžet/i);
  assert.match(budgetsView, /Sigurno[^<]*(?:preostaje|potroš)/i);
});

test('cycle 2 audit: bulk review exposes confirmation, cancellation, and one-step undo', () => {
  for (const id of [
    'bulkOverrideConfirmation',
    'bulkOverrideConfirm',
    'bulkOverrideCancel',
    'bulkOverrideUndoBar',
    'undoBulkOverride'
  ]) expectId(id);

  assert.match(openingTag('bulkOverrideConfirmation'), /role=["']alert["']/i);
  assert.match(openingTag('bulkOverrideConfirmation'), /\bhidden\b/i);
  assert.match(openingTag('bulkOverrideUndoBar'), /role=["']status["']/i);
  assert.match(openingTag('bulkOverrideUndoBar'), /aria-live=["']polite["']/i);
  for (const id of ['bulkOverrideConfirm', 'bulkOverrideCancel', 'undoBulkOverride']) expectScriptReference(id);
});

test('cycle 2 audit: demo reset is discoverable, confirmed, and wired', () => {
  for (const id of ['demoResetCard', 'resetDemoData', 'demoResetModal', 'confirmDemoReset']) expectId(id);

  assert.match(openingTag('demoResetModal'), /<dialog\b/i);
  assert.match(openingTag('demoResetModal'), /aria-labelledby=["'][^"']+["']/i);
  for (const id of ['resetDemoData', 'confirmDemoReset']) expectScriptReference(id);
});

test('cycle 2 audit: an over-budget plan offers recovery, auto-balance, and transfer controls', () => {
  for (const id of ['budgetRecovery', 'openBudgetTransfer', 'autoBalanceBudget', 'budgetTransferModal']) expectId(id);

  assert.match(openingTag('budgetTransferModal'), /<dialog\b/i);
  assert.match(openingTag('budgetTransferModal'), /aria-labelledby=["'][^"']+["']/i);
  for (const id of ['openBudgetTransfer', 'autoBalanceBudget']) expectScriptReference(id);
});

test('cycle 2 audit: notification updates are announced and Escape closes the center', () => {
  const listTag = openingTag('notificationList');
  assert.match(listTag, /aria-live=["']polite["']/i);

  const keydownStart = app.search(/document\.addEventListener\(\s*['"]keydown['"]/);
  assert.notEqual(keydownStart, -1, 'missing global keyboard handler');
  const escapeHandler = app.slice(keydownStart, keydownStart + 900);
  assert.match(escapeHandler, /Escape/);
  assert.match(escapeHandler, /(?:closeNotifications|closeAllOverlays)\s*\(/);
});

test('cycle 2 audit: over-cap states, short savings viewports, and native selects have CSS contracts', () => {
  assert.match(css, /\.(?:is-)?over-cap\b/i);
  assert.match(css, /\.(?:budget-)?overage(?:-amount|-label)?\b/i);
  assert.match(css, /(?:over-cap|overage)[^{}]*\{[^{}]*(?:var\(\s*--red\s*\)|#[a-f\d]{3,8})/i);

  const lowHeightRules = css.match(/@media\s*\(\s*max-height\s*:\s*\d+px\s*\)[\s\S]*?(?=@media\b|$)/gi) || [];
  assert.ok(
    lowHeightRules.some(rule => /#savingsView/.test(rule) && /(?:savings-layout|goal-bucket|savings-hero)/.test(rule)),
    'missing low-height desktop treatment for the Savings module'
  );

  assert.match(
    css,
    /[^{}]*\bselect\b[^{}]*\{[^{}]*(?:(?:-webkit-)?appearance)\s*:\s*none\b[^{}]*background-image/i,
    'select controls must use a branded shell while preserving native select semantics'
  );
});
