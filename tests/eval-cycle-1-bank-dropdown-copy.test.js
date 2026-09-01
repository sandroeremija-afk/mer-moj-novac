'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
test('evaluation cycle 1: header and account bank triggers open the standalone dialog directly', () => {
  const trigger = html.match(/<button[^>]*id="headerBankButton"[^>]*>/)?.[0] || '';
  assert.match(trigger, /aria-controls="connectedBanksModal"/);
  assert.match(trigger, /aria-haspopup="dialog"/);
  assert.doesNotMatch(trigger, /data-card-menu=/);
  assert.doesNotMatch(html, /id="headerBankMenu"/);
  assert.match(app, /#headerBankButton'\)\.addEventListener\('click',openBankSettings\)/);
  assert.match(app, /#manageBanks'\)\.addEventListener\('click',openBankSettings\)/);
});

test('evaluation cycle 1: standalone bank dialog retains status, sync, list, add and profile mapping', () => {
  const start = html.indexOf('id="connectedBanksModal"');
  const end = html.indexOf('</dialog>', start);
  const modal = html.slice(start, end);
  assert.ok(start >= 0 && end > start);
  for (const id of ['bankSyncStatus', 'syncNow', 'bankConnectionList', 'startBankConnection', 'bankProfileSelect']) {
    assert.match(modal, new RegExp(`id="${id}"`));
  }
  assert.match(app, /status\.textContent=error\?connectionStatusLabel\(error\)\.text:`\$\{lastSyncedLabel\(latest\)\} · \$\{t\('backgroundSync'\)\}`/);
  assert.match(app, /data-map-bank="\$\{connection\.id\}"/);
  assert.match(app, /function openBankSettings\(\)[\s\S]*?renderBankSettings\(\)[\s\S]*?openModal\(\$\('#connectedBanksModal'\)\)/);
});

test('evaluation cycle 1: Activity uses the requested Croatian filter reset copy', () => {
  assert.match(app, /clearFilters:'Očisti filtere'/);
  assert.match(html, /id="clearActivityFilters"[^>]*data-i18n="clearFilters">Očisti filtere<\/button>/);
  assert.doesNotMatch(app, /Očisti filtre/);
  assert.doesNotMatch(html, /Očisti filtre/);
});
