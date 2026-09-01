'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

test('evaluation cycle 1: dashboard greeting and streamlined global header order are deterministic', () => {
  assert.match(app, /dashboardGreeting:'Dobro jutro, Mer'/);
  assert.match(html, /id="accountName">Moj eRačun/);
  assert.match(html, /id="accountLabel"[^>]*data-i18n="personalAccount">Osobni račun/);
  assert.match(app, /\$\('#accountAvatar'\)\.textContent=state\.initials;[\s\S]*?\$\('#accountName'\)\.textContent=state\.accountName;[\s\S]*?\$\('#accountLabel'\)\.textContent=t\(state\.accountLabel\)/);
  assert.match(app, /title\.textContent=t\('dashboardGreeting'\)/);
  const header = html.slice(html.indexOf('<header class="topbar">'), html.indexOf('</header>'));
  const positions = ['systemDate','notificationButton','headerBankButton'].map(id => header.indexOf(`id="${id}"`));
  assert.ok(positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1])));
  assert.doesNotMatch(header, /id="(?:layoutEditToggle|themeToggle|settingsLanguage)"|class="language-switch"|data-lang=/);
  const generalStart = html.indexOf('data-settings-panel="general"');
  const generalEnd = html.indexOf('data-settings-panel="security"', generalStart);
  const general = html.slice(generalStart, generalEnd);
  for (const id of ['settingsLanguage','themeToggle','layoutEditToggle']) assert.match(general, new RegExp(`id="${id}"`));
  assert.equal((html.match(/data-layout-edit-toggle/g) || []).length, 1);
});

test('evaluation cycle 1: bank header state is active-profile isolated and opens its standalone dialog directly', () => {
  assert.match(app, /function bankConnectionsFor\(profileId=appState\.activeAccount\)/);
  assert.match(app, /function renderBankSyncStatus\(\)\s*\{\s*const connections=bankConnectionsFor\(\)/);
  assert.match(app, /\$\('#headerBankButton'\)\.addEventListener\('click',openBankSettings\)/);
  assert.match(app, /function openBankSettings\(\)[\s\S]*openModal\(\$\('#connectedBanksModal'\)\)/);
  assert.match(html, /class="[^"]*bg-green-500 animate-pulse[^"]*"[^>]*id="headerBankDot"/);
  assert.match(html, /id="headerBankButton"[^>]*aria-controls="connectedBanksModal"[^>]*aria-haspopup="dialog"/);
  assert.match(html, /id="connectedBanksModal"[^>]*aria-labelledby="connectedBanksModalTitle"/);
  assert.doesNotMatch(html, /id="headerBankMenu"|id="headerAddBank"|id="headerManageBanks"/);
  assert.doesNotMatch(html, /id="bankSyncStrip"/);
});
