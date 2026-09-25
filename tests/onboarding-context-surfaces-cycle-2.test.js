'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname,'../security-tour.css'),'utf8');
const source = fs.readFileSync(path.join(__dirname,'../onboarding.js'),'utf8');

test('tour backdrop reveals original controls and keeps reduced-motion support', () => {
  assert.match(css,/\.onboarding-backdrop\s*\{[^}]*position:fixed;[^}]*pointer-events:none;[^}]*transition:clip-path/);
  assert.match(css,/\.onboarding-tour \.onboarding-spotlight\s*\{[^}]*box-shadow:0 0 0 5px/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\s*\{\s*\.onboarding-backdrop\s*\{ transition:none;/);
  assert.doesNotMatch(source,/\.innerHTML\s*=|cloneNode|docked:true/);
});

test('mobile settings preserve native context and bound content instead of cropping controls', () => {
  assert.match(css,/dialog\.tour-modal-host\[data-tour-step\]\s*\{[^}]*display:flex;[^}]*min-height:0;/);
  assert.match(css,/\.tour-modal-host\[data-tour-step\] > h2,[\s\S]*?display:block;[^}]*padding-right:40px/);
  assert.match(css,/\.settings-modal-body\s*\{[^}]*flex:1 1 auto;[^}]*min-height:0;[^}]*overflow-y:auto;[^}]*overflow-x:hidden/);
  assert.match(css,/\.settings-tabs\s*\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css,/\.settings-tabs button\s*\{[^}]*min-inline-size:0;[^}]*min-height:44px;[^}]*white-space:normal/);
  assert.match(css,/\[data-settings-panel="general"\] > :not\(:has\(#hideBalances\)\)/,'privacy ancestors must not be hidden');
  assert.match(css,/\[data-tour-step="personal"\] \.personal-data-fields\s*\{ grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/\[data-tour-step="personal"\] \.personal-data-intro\s*\{ display:none;/,'tour copy replaces only the duplicate introduction, not actual fields');
  assert.match(css,/\[data-tour-step="privacy"\]\[open\]\s*\{ height:auto;max-height:var\(--tour-panel-height/,'short privacy and security flows do not fill blank space');
});

test('live Help walkthrough keeps a visible title, actual mode controls and composer', () => {
  assert.match(css,/\[data-tour-step="help"\] > \.help-assistant-heading\s*\{ display:block/);
  assert.match(css,/\[data-tour-step="help"\] \.help-modal-toolbar\s*\{ margin:0;/);
  assert.match(css,/\[data-tour-step="help"\] \.help-assistant-body\s*\{[^}]*min-height:0;[^}]*overflow-y:auto/);
  assert.doesNotMatch(css,/(?:#helpTourConversation|\.assistant-composer|\.help-mode-tabs)\s*\{[^}]*display:none/);
  assert.doesNotMatch(css,/\.assistant-messages\s*\{[^}]*display:none/,'a user who submits during the guide must be able to read the reply');
  assert.match(css,/\.assistant-messages:not\(:has\(\.user\)\)\s*\{ display:none/);
});
