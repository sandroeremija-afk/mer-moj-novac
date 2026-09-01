'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.resolve(__dirname, '..', 'styles.css'), 'utf8');

test('evaluation cycle 2: connecting mode removes the bank body scrollbar while preserving long-list fallback', () => {
  assert.match(css, /\.connected-banks-modal-body \{[^}]*overflow-y:auto/);
  assert.match(css, /\.connected-banks-modal\.is-connecting \.connected-banks-modal-body \{[^}]*overflow:hidden;[^}]*scrollbar-gutter:auto;/);
  assert.match(css, /\.bank-connect-step \{[^}]*overflow:visible;/);
  assert.match(css, /\.bank-connections-view\[hidden\],[\s\S]*\.bank-connect-step\[hidden\][\s\S]*display:none !important;/);
});

test('evaluation cycle 2: mobile bank wizard auto-sizes inside the visual viewport', () => {
  assert.match(css, /@media \(max-width:767px\) \{[\s\S]*\.premium-settings\.connected-banks-modal\[open\] \{[^}]*height:auto;[^}]*max-height:min\(90dvh,calc\(var\(--ui-visual-height\) - 16px\)\);/);
  assert.match(css, /\.bank-credentials-grid \{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.bank-connection-wizard \.bank-account-picker > div \{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test('evaluation cycle 2: tooltip surface stays inside the dialog top layer and supports touch actions', () => {
  assert.match(css, /\.bank-action-tooltip \{[^}]*position:fixed;[^}]*pointer-events:none;/);
  assert.match(css, /\.bank-action-button \{[^}]*touch-action:manipulation;/);
});
