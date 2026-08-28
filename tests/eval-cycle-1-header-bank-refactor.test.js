'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

test('evaluation cycle 1: dashboard greeting and global header control order are deterministic', () => {
  assert.match(app, /dashboardGreeting:'Dobro jutro, Sandro'/);
  assert.match(app, /title\.textContent=t\('dashboardGreeting'\)/);
  const header = html.slice(html.indexOf('<header class="topbar">'), html.indexOf('</header>'));
  const positions = ['systemDate','layoutEditToggle','themeToggle','notificationButton','headerBankButton'].map(id => header.indexOf(`id="${id}"`));
  assert.ok(positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1])));
  assert.ok(header.indexOf('class="language-switch"') < header.indexOf('id="headerBankButton"'));
  assert.equal((html.match(/data-layout-edit-toggle/g) || []).length, 1);
});

test('evaluation cycle 1: bank header state is active-profile isolated and exposes both connection actions', () => {
  assert.match(app, /function bankConnectionsFor\(profileId=appState\.activeAccount\)/);
  assert.match(app, /function renderBankSyncStatus\(\)\s*\{\s*const connections=bankConnectionsFor\(\)/);
  assert.match(app, /if\(bankConnectionsFor\(\)\.length\)return/);
  assert.match(app, /openBankSettings\(\)/);
  assert.match(html, /class="[^"]*bg-green-500 animate-pulse[^"]*"[^>]*id="headerBankDot"/);
  assert.match(html, /id="headerBankMenu"[^>]*role="menu"/);
  assert.match(html, /id="headerAddBank"/);
  assert.match(html, /id="headerManageBanks"/);
  assert.doesNotMatch(html, /id="bankSyncStrip"/);
});
