'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

test('evaluation cycle 1: one unlink click opens an accessible confirmation dialog', () => {
  const start = html.indexOf('id="unlinkBankModal"');
  const end = html.indexOf('</dialog>', start);
  const dialog = html.slice(start, end);
  assert.ok(start > -1 && end > start);
  assert.match(dialog, /role="alertdialog"/);
  assert.match(dialog, /Jeste li sigurni da želite prekinuti vezu s ovom bankom\/karticom\?/);
  assert.match(dialog, /id="confirmBankUnlink"[^>]*data-i18n="unlinkBankConfirm">Prekini vezu/);
  assert.match(dialog, /data-close-modal[^>]*data-i18n="unlinkBankCancel">Odustani/);
  assert.match(app, /function requestUnlinkBank\(button\)[\s\S]*?pendingBankUnlinkId=connection\.id;[\s\S]*?modal\.showModal\(\)/);
  assert.doesNotMatch(app, /dataset\.confirmUnlink|setTimeout\(\(\)=>\{if\(button\.isConnected\)/);
  assert.match(app, /const modal=\$\$\('\.modal\[open\]'\)\.at\(-1\)/);
});

test('evaluation cycle 1: confirmed unlink removes only the requested connection through the reactive save path', () => {
  const start = app.indexOf('function confirmBankUnlink()');
  const end = app.indexOf('async function connectSelectedBankAccounts', start);
  const handler = app.slice(start, end);
  assert.match(handler, /filter\(connection=>connection\.id!==connectionId\)/);
  assert.match(handler, /save\('bank-unlink'\)/);
  assert.match(handler, /renderBankSettings\(\)/);
  assert.match(handler, /showToast\(t\('connectionUnlinked'\)\)/);
});

test('evaluation cycle 1: missing account selection stays blocked with inline visual and accessible feedback', () => {
  assert.match(html, /id="bankAccountPicker"[^>]*aria-describedby="bankAccountSelectionError"/);
  assert.match(html, /id="bankAccountSelectionError"[^>]*role="alert"[^>]*aria-live="polite"[^>]*hidden>Molimo označite banku ili karticu prije nastavka\./);
  assert.match(app, /if\(!selected\.length\)\{setBankAccountSelectionError\(true\);[\s\S]*?\.focus\(\{preventScroll:true\}\);return;\}/);
  assert.match(app, /event\.target\.matches\('input\[name="bankAccount"\]'\)&&event\.target\.checked\)setBankAccountSelectionError\(false\)/);
  assert.match(app, /bankConnectForm'\)\.addEventListener\('submit',event=>\{event\.preventDefault\(\);runAsyncAction\(connectSelectedBankAccounts\);\}\)/);
  assert.match(css, /\.bank-account-picker\.has-error\s*\{[^}]*border-color:#ef4444;[^}]*box-shadow:0 0 0 3px rgba\(239,68,68,\.2\)/);
});
