'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const responsive = fs.readFileSync(path.join(root, 'responsive-ui.js'), 'utf8');

test('evaluation cycle 1: the header bank menu stays anchored to its relative trigger container', () => {
  assert.match(html, /class="card-action-wrap header-bank-wrap"[\s\S]*?id="headerBankButton"[\s\S]*?id="headerBankMenu"/);
  assert.match(css, /\.header-bank-wrap \{[^}]*position:relative;[^}]*z-index:50;/);
  assert.match(css, /\.header-bank-menu \{[\s\S]*?position:absolute;[\s\S]*?z-index:50;[\s\S]*?top:calc\(100% \+ 8px\);[\s\S]*?right:0;[\s\S]*?left:auto;/);
  assert.match(css, /\.header-bank-menu \{[\s\S]*?padding:10px;[\s\S]*?border:1px solid var\(--line\);[\s\S]*?background:var\(--panel\);[\s\S]*?box-shadow:/);
  assert.match(responsive, /menu\.classList\.contains\('header-bank-menu'\)[\s\S]*?clearFloatingPosition\(menu\);[\s\S]*?return;/);
});

test('evaluation cycle 1: bank status, account list and management actions remain complete', () => {
  const start = html.indexOf('id="headerBankMenu"');
  const end = html.indexOf('</div></div>', start);
  const menu = html.slice(start, end);
  for (const id of ['bankSyncStatus', 'headerBankAccountList', 'syncNow', 'headerAddBank', 'headerManageBanks']) {
    assert.match(menu, new RegExp(`id="${id}"`));
  }
  assert.match(app, /status\.textContent=error\?connectionStatusLabel\(error\)\.text:`\$\{lastSyncedLabel\(latest\)\} · \$\{t\('backgroundSync'\)\}`/);
  assert.match(app, /class="header-bank-account"/);
});

test('evaluation cycle 1: Activity uses the requested Croatian filter reset copy', () => {
  assert.match(app, /clearFilters:'Očisti filtere'/);
  assert.match(html, /id="clearActivityFilters"[^>]*data-i18n="clearFilters">Očisti filtere<\/button>/);
  assert.doesNotMatch(app, /Očisti filtre/);
  assert.doesNotMatch(html, /Očisti filtre/);
});

