const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

function dialogMarkup(id) {
  const start = html.indexOf(`id="${id}"`);
  assert.ok(start >= 0, `${id} exists`);
  const open = html.lastIndexOf('<dialog', start);
  return html.slice(open, html.indexOf('</dialog>', start));
}

test('evaluation cycle 1: contextual titles replace every generic topbar module label', () => {
  assert.doesNotMatch(html, /id="activeModuleTitle"/);
  assert.match(html, /id="contextHeaderTitle"/);
  assert.match(html, /id="contextHeaderSubtitle"/);
  assert.match(app, /budgets:\{title:'monthlyPlan',subtitle:'budgetsSubtitle'\}/);
  assert.match(app, /savings:\{title:'yourFuture',subtitle:'savingsSubtitle'\}/);
  assert.match(app, /activity:\{title:'moneyMovement',subtitle:'activitySubtitle'\}/);
  assert.match(app, /insights:\{title:'reports',subtitle:'insightsSubtitle'\}/);
  assert.equal((html.match(/class="page-heading[^\"]*actions-only-heading"/g) || []).length, 5);
});

test('evaluation cycle 1: Dashboard places Add Transaction directly after Adjust Plan', () => {
  const overview = html.slice(html.indexOf('id="overviewView"'), html.indexOf('class="bank-sync-strip"'));
  const adjust = overview.indexOf('data-open-assessment');
  const add = overview.indexOf('data-open-transaction', adjust);
  assert.ok(adjust >= 0 && add > adjust);
  assert.match(overview.slice(add), /data-i18n="addTransaction"/);
});

test('evaluation cycle 1: every commit form exposes Cancel next to its primary action', () => {
  for (const id of ['budgetTransferModal', 'transactionModal', 'assessmentModal', 'budgetModal', 'savingsModal', 'goalModal', 'recurringModal', 'incomeCategoryModal']) {
    const modal = dialogMarkup(id);
    assert.match(modal, /class="modal-actions/);
    assert.match(modal, /data-close-modal data-i18n="cancel"/);
  }
  assert.match(dialogMarkup('importDataModal'), /class="modal-actions import-commit-actions"[\s\S]*data-close-modal data-i18n="cancel"[\s\S]*id="confirmImport"/);
  assert.match(dialogMarkup('passwordResetModal'), /id="cancelPasswordReset"[^>]*data-auth-copy="cancel"/);
});

test('evaluation cycle 1: native backdrop dismissal remains centralized and mobile keeps a tappable backdrop', () => {
  assert.match(app, /MerRuntime\.bindDialogBackdropDismiss\(modal,\(\)=>closeModal\(modal\)\)/);
  assert.doesNotMatch(app, /modal\.addEventListener\('click'/);
  assert.match(css, /inset:auto 8px 0;/);
  assert.match(css, /max-height:90dvh;/);
  assert.doesNotMatch(css.slice(css.indexOf('Contextual workspace header')), /width:100vw;[\s\S]*height:100dvh;[\s\S]*border-radius:0;/);
});

test('evaluation cycle 1: weekly review lives only in Savings and the account switcher owns the sidebar bottom', () => {
  const sidebar = html.slice(html.indexOf('id="sidebar"'), html.indexOf('</aside>'));
  const savings = html.slice(html.indexOf('id="savingsView"'), html.indexOf('id="activityView"'));
  assert.doesNotMatch(sidebar, /weeklyCheck|tipSavings|openPlan/);
  assert.match(savings, /class="panel weekly-review-card"/);
  assert.match(savings, /id="tipSavings"/);
  assert.match(savings, /id="openPlan"/);
  assert.match(css, /\.sidebar-bottom \{ margin-top:auto; flex:0 0 auto; \}/);
});
