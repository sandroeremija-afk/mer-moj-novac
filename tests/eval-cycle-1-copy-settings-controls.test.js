'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const layoutUi = fs.readFileSync(path.join(root, 'layout-ui.js'), 'utf8');

function dialog(id) {
  const idIndex = html.indexOf(`id="${id}"`);
  assert.ok(idIndex >= 0, `${id} exists`);
  const start = html.lastIndexOf('<dialog', idIndex);
  return html.slice(start, html.indexOf('</dialog>', idIndex));
}

test('evaluation cycle 1: Insights uses the requested Croatian all-period copy everywhere', () => {
  assert.match(html, /data-timeframe="all" data-i18n="allTime">Sveukupno</);
  assert.match(app, /allTime:'Sveukupno'/);
  assert.doesNotMatch(html, /data-timeframe="all"[^>]*>Sve vrijeme</);
});

test('evaluation cycle 1: Add Transaction keeps Import but removes Export and the idle disclaimer', () => {
  const transaction = dialog('transactionModal');
  assert.match(transaction, /data-open-global-import/);
  assert.doesNotMatch(transaction, /data-export-active|data-i18n="exportDataShort"/);
  assert.match(transaction, /id="spendCheck"[^>]*hidden><\/div>/);
  assert.doesNotMatch(transaction, /Zaštita budžeta je spremna|Unesite iznos za provjeru utjecaja/);
  assert.match(app, /function resetTransactionCheck\(\)[\s\S]*check\.hidden=true;[\s\S]*check\.replaceChildren\(\)/);
  assert.match(app, /const check=\$\('#spendCheck'\);[\s\S]*if\(!rawAmount\)\{resetTransactionCheck\(\);return false;\}[\s\S]*check\.hidden=false/);
});

test('evaluation cycle 1: Connected Banks omits the redundant profile-isolation notice', () => {
  const banks = dialog('connectedBanksModal');
  assert.doesNotMatch(banks, /class="isolation-note"|profileIsolationTitle|profileIsolationBody/);
  assert.doesNotMatch(banks, /Odvajanje profila je uključeno|Sinkronizirane transakcije zapisuju se samo/);
  assert.match(banks, /id="bankSyncStatus"/);
  assert.match(banks, /id="bankProfileSelect"/);
});

test('evaluation cycle 1: General Settings exposes explicit theme states and one clean layout action', () => {
  const start = html.indexOf('data-settings-panel="general"');
  const end = html.indexOf('data-settings-panel="security"', start);
  const general = html.slice(start, end);
  assert.match(general, /data-i18n="appTheme">Tema aplikacije</);
  assert.match(general, /id="themeToggle"[^>]*role="group"/);
  assert.match(general, /data-theme-choice="light"[\s\S]*data-i18n="lightTheme">Svijetla</);
  assert.match(general, /data-theme-choice="dark"[\s\S]*data-i18n="darkTheme">Tamna</);
  assert.match(general, /data-i18n="dashboardLayout">Raspored nadzorne ploče</);
  assert.match(general, /id="layoutEditToggle"[\s\S]*data-i18n="editLayout">Uredi</);
  assert.doesNotMatch(general, /data-i18n="darkMode">Tamni način|Prilagodi raspored<\/span>/);
  assert.match(app, /function setTheme\(nextTheme\)/);
  assert.match(app, /event\.target\.closest\('\[data-theme-choice\]'\)/);
  assert.match(layoutUi, /customizeLayout:'Uredi'/);
});
