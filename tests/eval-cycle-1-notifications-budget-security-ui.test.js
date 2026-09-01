'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

test('evaluation cycle 1: Open Banking count spacing survives production HTML minification', () => {
  assert.match(html, /class="bank-review-count" id="uncategorizedCountLabel">0 za pregled<\/strong><span id="uncategorizedCount" hidden>/);
  assert.match(css, /\.bank-review-count\s*\{[^}]*display:inline-block[^}]*white-space:nowrap/);
  assert.match(app, /needsReviewCount:'\{count\} za pregled'/);
  assert.match(app, /uncategorizedCountLabel'\)\.textContent=t\('needsReviewCount',\{count:reviewCount\}\)/);
  assert.doesNotMatch(html, /2za pregled/);
});

test('evaluation cycle 1: pending cards and warning surfaces expose profile-scoped resolution', () => {
  for (const id of ['resolveUncategorized', 'resolveReviewQueue', 'resolveBudgetRecovery']) {
    assert.match(html, new RegExp(`id="${id}"[\\s\\S]*?data-i18n="markResolved"`));
  }
  assert.match(app, /dismissedNotifications=Object\.fromEntries/);
  assert.match(app, /function notificationFingerprint/);
  assert.match(app, /data-notification-resolve/);
  assert.match(app, /function resolveNotification\([^)]*\)[\s\S]*?state\.dismissedNotifications=[\s\S]*?save\('notification-resolve'\)/);
  assert.match(app, /function buildNotifications\(\)[\s\S]*?isNotificationResolved\(item\)/);
});

test('evaluation cycle 1: resolving uncategorized activity exits review-only mode without a hidden filter', () => {
  assert.match(
    app,
    /const reviewItem=\{key:'uncategorized',fingerprint:uncategorizedNotificationFingerprint\(\)\};\s*if\(activityReviewOnly&&\(reviewCount===0\|\|isNotificationResolved\(reviewItem\)\)\)activityReviewOnly=false;/
  );
  assert.match(app, /reviewOnly:activityReviewOnly/);
});

test('evaluation cycle 1: recurring warning actions reveal the scheduled-payments dialog', () => {
  assert.match(app, /key:`recurring:\$\{rule\.id\}`[\s\S]*?view:'budgets',detailModal:'budgetDetailsModal'/);
  assert.match(app, /else if\(item\?\.detailModal\)openModal\(\$\(`#\$\{item\.detailModal\}`\)\)/);
  assert.match(html, /id="budgetDetailsModal"/);
});

test('evaluation cycle 1: notification resolution controls have contextual names and live regions', () => {
  assert.match(app, /resolveNotificationLabel:'Označi kao riješeno: \{title\}'/);
  assert.match(app, /resolveNotificationLabel:'Mark as resolved: \{title\}'/);
  assert.match(app, /data-notification-resolve="\$\{index\}" aria-label="\$\{escapeHtml\(t\('resolveNotificationLabel',\{title:item\.title\}\)\)\}"/);
  for (const [className,id] of [
    ['budget-recovery','budgetRecovery'],
    ['review-queue-banner','reviewQueueBanner'],
    ['bank-review-alert','uncategorizedBadge']
  ]) {
    assert.match(html, new RegExp(`class="${className}" id="${id}" role="status" aria-live="polite"`));
  }
});

test('evaluation cycle 1: the three Budget summary cards own distinct accessible brand accents', () => {
  for (const variant of ['flexible', 'remaining', 'allocation']) {
    assert.match(html, new RegExp(`budget-summary-card--${variant}`));
    assert.match(css, new RegExp(`#budgetsView \\.budget-summary-card--${variant}\\s*\\{[^}]*background:linear-gradient`));
  }
  assert.match(css, /\[data-theme="dark"\] #budgetsView \.budget-summary-card--remaining/);
  assert.match(css, /\.budget-summary-card\.is-negative,[\s\S]*?\.budget-summary-card\.is-over-allocated[\s\S]*?var\(--red-soft\)/);

  const finalDarkStatus = css.indexOf('[data-theme="dark"] #budgetsView .budget-summary-card.is-negative');
  const latestDarkVariant = Math.max(
    ...['flexible','remaining','allocation'].map(variant => css.indexOf(`[data-theme="dark"] #budgetsView .budget-summary-card--${variant}`))
  );
  assert.ok(finalDarkStatus > latestDarkVariant, 'dark negative/over-allocation status tint must override every normal dark card tint');
  assert.match(
    css.slice(finalDarkStatus),
    /^\[data-theme="dark"\] #budgetsView \.budget-summary-card\.is-negative,\s*\[data-theme="dark"\] #budgetsView \.budget-summary-card\.is-over-allocated\s*\{[^}]*rgba\(218,74,82,\.18\)/
  );
});

test('evaluation cycle 1: Security Settings expose password, selectable 2FA and session management', () => {
  assert.match(html, /id="changePasswordForm"[\s\S]*?id="currentPasswordInput"[\s\S]*?id="newPasswordInput"[\s\S]*?id="confirmNewPasswordInput"/);
  assert.match(html, /id="mfaMethodSelector"[\s\S]*?data-mfa-method="authenticator"[\s\S]*?data-mfa-method="sms"/);
  assert.match(html, /id="activeSessionList"[\s\S]*?id="logoutOtherSessions"/);
  assert.match(css, /\.security-form-grid\s*\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /@media \(max-width:767px\)[\s\S]*?\.security-form-grid\s*\{ grid-template-columns:1fr; \}/);
});
