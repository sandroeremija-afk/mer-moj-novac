'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

function accountOption(accountId) {
  const match = html.match(new RegExp(`<button[^>]*class="[^"]*account-option[^"]*"[^>]*data-account="${accountId}"[^>]*>([\\s\\S]*?)<\\/button>`));
  assert.ok(match, `Missing ${accountId} account option`);
  return match[1];
}

test('evaluation cycle 1: collapsed trigger defaults to the requested Personal profile identity', () => {
  assert.match(html, /id="accountAvatar">ME<\/span>/);
  assert.match(html, /id="accountName">Moj eRačun<\/strong>/);
  assert.match(html, /id="accountLabel"[^>]*data-i18n="personalAccount">Osobni račun<\/small>/);
});

test('evaluation cycle 1: expanded switcher exposes exact Personal and Business labels', () => {
  const personal = accountOption('personal');
  const business = accountOption('business');

  assert.match(personal, /class="avatar small-avatar"[^>]*>ME<\/span>/);
  assert.match(personal, /<strong>Moj eRačun<\/strong>/);
  assert.match(personal, /data-i18n="personalAccount">Osobni račun<\/small>/);

  assert.match(business, /class="avatar small-avatar business-avatar"[^>]*>E(?:R|L)<\/span>/);
  assert.match(business, /<strong>Elektronički računi d\.o\.o\.<\/strong>/);
  assert.match(business, /data-i18n="businessAccount">Poslovni račun<\/small>/);
});

test('evaluation cycle 1: persisted profile defaults use the same presentation labels as the switcher', () => {
  assert.match(app, /const personalDefaults\s*=\s*\{[\s\S]*?accountName:'Moj eRačun',[\s\S]*?accountLabel:'personalAccount',[\s\S]*?initials:'ME'/);
  assert.match(app, /const businessDefaults\s*=\s*\{[\s\S]*?accountName:'Elektronički računi d\.o\.o\.',[\s\S]*?accountLabel:'businessAccount',[\s\S]*?initials:'E(?:R|L)'/);
});
