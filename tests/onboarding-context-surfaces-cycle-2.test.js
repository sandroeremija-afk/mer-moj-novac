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
  assert.match(css,/body\.tour-active dialog\[open\]::backdrop\s*\{ background:transparent;backdrop-filter:none;/,'native backdrops must not dim or blur the real context control');
});

test('compact tour reserves room for the original bottom-left sidebar entry', () => {
  assert.match(css,/body\[data-tour-sidebar-context\] #sidebar\s*\{[\s\S]*?inset:auto auto 12px 12px;[\s\S]*?transform:none/);
  assert.match(css,/body\[data-tour-sidebar-context="settings"\] #sidebar > #openHelpAssistant/);
  assert.match(css,/body\[data-tour-sidebar-context="help"\] #sidebar > \.sidebar-bottom/);
  assert.match(source,/viewport\.top \+ viewport\.height - panelTop - contextReserve/);
  assert.match(source,/document\.body\.removeAttribute\('data-tour-sidebar-context'\)/);
  assert.match(source,/appShell\.inert = true/);
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
  assert.match(css,/\[data-tour-step="personal"\]\[open\]\s*\{ padding:10px;gap:4px;/,'personal form keeps all fields and actions above the account context');
  assert.match(css,/\[data-tour-step="privacy"\]\[open\]\s*\{ height:auto;max-height:var\(--tour-panel-height/,'short privacy and security flows do not fill blank space');
});

test('live Help walkthrough keeps a visible title, actual mode controls and composer', () => {
  assert.match(css,/\[data-tour-step="help"\] > \.help-assistant-heading\s*\{ display:block/);
  assert.match(css,/\[data-tour-step="help"\] \.help-modal-toolbar\s*\{ margin:0;/);
  assert.match(css,/\[data-tour-step="help"\] \.help-assistant-body\s*\{[^}]*min-height:0;[^}]*overflow-y:auto/);
  assert.doesNotMatch(css,/(?:#helpTourConversation|\.assistant-composer|\.help-mode-tabs)\s*\{[^}]*display:none/);
  assert.doesNotMatch(css,/\.assistant-messages\s*\{[^}]*display:none/,'a user who submits during the guide must be able to read the reply');
  assert.match(css,/\.assistant-messages:not\(:has\(\.user\)\)\s*\{ display:none/);
  assert.match(css,/\.help-assistant-heading > :is\(svg,\.help-heading-icon,\.help-modal-icon\)/,'the actual decorative modal icon must not consume a separate row');
  assert.match(css,/\.assistant-suggestions\s*\{ display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,'all three sample questions remain visible in two rows');
  assert.match(css,/html body #helpAssistantModal\.tour-modal-host\[data-tour-step="help"\] #helpTourConversation\s*\{[^}]*gap:4px;/,'compact gap wins over the earlier ID-scoped rule');
  assert.match(css,/html body #helpAssistantModal\.tour-modal-host\[data-tour-step="help"\] \.assistant-suggestion\s*\{[^}]*min-height:44px;[^}]*padding:6px;font-size:12px;/,'readable questions retain full touch targets without inherited large padding');
  assert.match(css,/html body #helpAssistantModal\.tour-modal-host\[data-tour-step="help"\] #helpAssistantInput\s*\{ height:44px;min-height:44px;max-height:44px;/,'voice-enabled input does not inherit the old 64px tour height');
  assert.doesNotMatch(css,/\.assistant-voice-(?:hint|meta)\s*\{[^}]*display:none/,'voice privacy copy must remain visible');
});
