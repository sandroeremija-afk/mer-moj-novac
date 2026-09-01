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

test('evaluation cycle 2: the 375px Settings and standalone Banks sheets are bounded with internal body scrolling', () => {
  assert.match(html, /class="settings-modal-body"/);
  const bankStart = html.indexOf('id="connectedBanksModal"');
  const bankEnd = html.indexOf('</dialog>', bankStart);
  const banks = html.slice(bankStart, bankEnd);
  assert.ok(bankStart >= 0 && bankEnd > bankStart);
  assert.match(banks, /class="[^"]*connected-banks-modal[^"]*"/);
  assert.match(banks, /class="connected-banks-modal-body"/);
  assert.match(css, /\.premium-settings\[open\] \{[\s\S]*?height:90dvh;[\s\S]*?max-height:90dvh;[\s\S]*?overflow:hidden;/);
  assert.match(css, /\.settings-modal-body,\s*\.connected-banks-modal-body \{[^}]*flex:1 1 auto;[^}]*overflow-x:hidden;[^}]*overflow-y:auto;/);
  assert.match(css, /\.premium-settings \.settings-modal-body,\s*\.premium-settings \.connected-banks-modal-body \{[^}]*flex:1 1 auto;[^}]*overflow-y:auto;/);
  assert.match(css, /\.connected-banks-modal-body \{[^}]*flex:1 1 auto;[^}]*overflow-x:hidden;[^}]*overflow-y:auto;/);
  assert.match(css, /\.premium-settings \.settings-tabs \{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});

test('evaluation cycle 2: the unified MER recommendation uses natural mobile flow without hiding its weekly insight', () => {
  const savings = html.slice(html.indexOf('id="savingsView"'), html.indexOf('id="activityView"'));
  const unifiedMarker = css.indexOf('/* Unified Savings recommendation');
  const unified = css.slice(unifiedMarker);
  const mobileStart = unified.indexOf('@media (max-width:1024px)');
  const phoneStart = unified.indexOf('@media (max-width:414px)', mobileStart);
  const mobile = unified.slice(mobileStart, phoneStart);
  const phoneEnd = unified.indexOf('[data-theme="dark"]', phoneStart);
  const phone = unified.slice(phoneStart, phoneEnd);

  assert.equal((savings.match(/id="savingsRecommendationCard"/g) || []).length, 1);
  assert.match(savings, /id="savingsRecommendationCard"[\s\S]*?recommendation-badge[\s\S]*?recommendation-weekly[\s\S]*?id="tipSavings"[\s\S]*?recommendation-action/);
  assert.doesNotMatch(savings, /\bsavings-side-stack\b|\bweekly-review-card\b|id="openPlan"/);
  assert.match(mobile, /#savingsView > \.savings-layout \{[^}]*grid-template-columns:1fr[^}]*align-items:stretch/);
  assert.match(mobile, /#savingsView \.savings-hero,\s*#savingsView \.savings-insight-card \{[^}]*width:100%[^}]*height:auto[^}]*min-height:0/s);
  assert.match(mobile, /#savingsView \.savings-insight-card \{[^}]*overflow:visible/);
  assert.match(phone, /#savingsView \.savings-insight-card > \.recommendation-action \{[^}]*min-height:44px/);
  assert.doesNotMatch(`${mobile}\n${phone}`, /#savingsView \.recommendation-weekly\s*\{[^}]*(?:display:none|visibility:hidden)/);
});

test('evaluation cycle 2: Activity keeps search and filter trigger compact while the mobile panel flows in one column', () => {
  assert.match(css, /@media \(max-width:767px\) \{[\s\S]*?\.activity-toolbar \{ display:grid; grid-template-columns:minmax\(0,1fr\) auto;/);
  assert.match(css, /\.activity-filter-panel \{ width:100%; max-height:min\(68dvh,520px\); grid-template-columns:minmax\(0,1fr\); \}/);
  assert.match(css, /\.filter-field input \{[\s\S]*?min-width:0;/);
});
