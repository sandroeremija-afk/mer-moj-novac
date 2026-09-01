const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'auth-ui.js'), 'utf8');
const responsive = fs.readFileSync(path.join(root, 'responsive-ui.js'), 'utf8');

test('evaluation cycle 1: native dialog backdrops own blur and the legacy layer can never intercept input', () => {
  assert.match(css, /\.modal-backdrop \{[^}]*display:none !important[^}]*pointer-events:none/s);
  assert.match(css, /\.modal::backdrop \{[^}]*background:rgba\(10,30,25,\.48\)[^}]*backdrop-filter:blur\(3px\)/s);
  assert.match(app, /function syncModalLayer\(\)/);
  assert.match(app, /function closeAllOverlays\(\)/);
  assert.match(app, /document\.body\.classList\.remove\('modal-active'\)/);
  assert.match(app, /\$\('#modalBackdrop'\)\.hidden=true/);
});

test('evaluation cycle 1: every application dialog closes through X, Escape, and a paired backdrop press', () => {
  const dialogs = html.match(/<dialog class="modal\b/g) || [];
  const closeButtons = html.match(/data-close-modal/g) || [];
  assert.ok(dialogs.length >= 10);
  assert.ok(closeButtons.length >= dialogs.length, 'each dialog has a close control; confirmation dialogs may expose an additional cancel action');
  assert.match(app, /\$\$\('\.modal'\)\.forEach\(modal=>\{/);
  assert.match(app, /modal\.addEventListener\('cancel'/);
  assert.match(app, /MerRuntime\.bindDialogBackdropDismiss\(modal,\(\)=>closeModal\(modal\)\)/);
  assert.match(auth, /MerRuntime\.bindDialogBackdropDismiss\(passwordResetModal, closePasswordReset\)/);
  assert.doesNotMatch(app, /modal\.addEventListener\('click'/);
  assert.doesNotMatch(auth, /passwordResetModal\.addEventListener\('click'/);
});

test('evaluation cycle 1: cross-module navigation clears modal, menu, tooltip, and notification state', () => {
  assert.match(app, /function showView\(view\) \{\s*closeAllOverlays\(\);/s);
  assert.match(app, /\$\$\('\.modal\[open\]'\)\.forEach\(modal=>modal\.close\(\)\)/);
  assert.match(app, /closeCardMenus\(\);\s*closeNotifications\(\);\s*toggleAccountMenu\(false\)/s);
  assert.match(html, /id="upcomingActionMenu"[^>]*role="menu"[^>]*hidden/);
  assert.match(html, /id="upcomingActionMenu"[\s\S]*?data-detail-route="activity"[^>]*data-clear-activity-filters/);
  assert.match(html, /id="emergencyGoalMenu"[^>]*role="menu"[^>]*hidden/);
  assert.match(html, /id="emergencyGoalMenu"[\s\S]*?data-detail-route="savings"/);
  assert.match(app, /\$\$\('\[data-card-menu\]'\)/);
  assert.doesNotMatch(app, /\[data-card-menu\][\s\S]{0,180}event\.stopPropagation\(\)/, 'the responsive menu positioner receives trigger clicks');
  assert.match(app, /document\.addEventListener\('click',event=>\{\s*const button=event\.target\.closest\?\.\('\[data-detail-route\]'\)[\s\S]*resetActivityFilters\(\{render:false\}\)[\s\S]*showView\(target\)/);
  assert.doesNotMatch(app, /\$\$\('\[data-detail-route\]'\)\.forEach/, 'detail actions use delegated events so rerenders cannot detach navigation');
  assert.match(app, /function resetActivityFilters\(\{render=true\}=\{\}\)[\s\S]*activitySearch'\)\.value=''[\s\S]*activityFilter'\)\.value='all'[\s\S]*activityTypeFilter'\)\.value='all'[\s\S]*activityDateFrom'\)\.value=''[\s\S]*activityDateTo'\)\.value=''[\s\S]*activitySort'\)\.value='date-desc'[\s\S]*activityReviewOnly=false/);
  assert.match(css, /#overviewDetailsModal :is\(\.goal-panel,\.upcoming-panel\) \{[^}]*overflow:visible;/);
  assert.match(responsive, /function floatingBounds\(menu\)[\s\S]*menu\.closest\?\.\('dialog\[open\]'\)[\s\S]*Math\.min\(viewport\.left \+ viewport\.width, rect\.right\)/);
  assert.match(responsive, /function positionMenu\(menu\)[\s\S]*?const bounds = floatingBounds\(menu\);/);
  assert.match(responsive, /const containingDialog = menu\.closest\?\.\('dialog\[open\]'\)[\s\S]*left:`\$\{placement\.left - offsetLeft\}px`[\s\S]*top:`\$\{placement\.top - offsetTop\}px`/);
});
