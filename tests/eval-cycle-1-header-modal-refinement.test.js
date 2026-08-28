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
  for (const title of ["monthlyPlan:'Mjesečni plan'", "yourFuture:'Vaša budućnost'", "moneyMovement:'Kretanje novca'", "reports:'Izvještaji'", "monthlyPlan:'Monthly plan'", "yourFuture:'Your future'", "moneyMovement:'Money movement'", "reports:'Reports'"]) {
    assert.ok(app.includes(title), `${title} uses sentence case`);
  }
  const contextTitleRule = css.match(/\.context-header h1\s*\{([^}]*)\}/)?.[1] || '';
  assert.doesNotMatch(contextTitleRule, /text-transform\s*:\s*uppercase/);
});

test('evaluation cycle 1: one icon-only layout control lives between the Date and theme controls', () => {
  assert.equal((html.match(/data-layout-edit-toggle/g) || []).length, 1);
  const topbar = html.slice(html.indexOf('<header class="topbar">'), html.indexOf('</header>'));
  const date = topbar.indexOf('id="systemDate"');
  const layout = topbar.indexOf('id="layoutEditToggle"');
  const theme = topbar.indexOf('id="themeToggle"');
  assert.ok(date >= 0 && layout > date && theme > layout);
  assert.match(topbar, /class="[^"]*icon-button[^"]*"[^>]*id="layoutEditToggle"/);
  assert.doesNotMatch(html.slice(html.indexOf('<div class="page">')), /data-layout-edit-toggle/);
  assert.match(css, /\.actions-only-heading\s*\{[^}]*display:flex[^}]*justify-content:flex-end/);
});

test('evaluation cycle 1: the sidebar is the sole Add Transaction entry point', () => {
  const modalStart = html.indexOf('id="transactionModal"');
  const applicationShell = html.slice(html.indexOf('id="appShell"'), modalStart);
  assert.equal((applicationShell.match(/data-open-transaction/g) || []).length, 1);
  assert.match(applicationShell, /class="primary-button sidebar-transaction-button" data-open-transaction/);
  assert.doesNotMatch(applicationShell.slice(applicationShell.indexOf('<div class="page">')), /data-open-transaction/);
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
