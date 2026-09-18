'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const rules = source => [...source.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(match => ({selector:match[1].trim(), declarations:match[2]}));
function rule(file, selector) {
  const result = rules(read(file)).find(item => item.selector === selector);
  assert.ok(result, `${file}: ${selector}`);
  return result.declarations;
}

test('static Settings pages size from their content without changing the hosted tour', () => {
  const outer = rule('settings-enhancements.css', 'html body #bankSettingsModal:not(.tour-modal-host)[open]');
  assert.match(outer, /height:fit-content;/);
  assert.match(outer, /min-height:0;/);
  assert.match(outer, /max-height:calc\(100dvh - 32px\)/);
  const pane = rule('settings-enhancements.css', '#bankSettingsModal:not(.tour-modal-host) .settings-pane.active');
  assert.match(pane, /flex:0 0 auto;height:auto;min-height:0/);
  const body = rule('settings-enhancements.css', 'html body #bankSettingsModal:not(.tour-modal-host) .settings-modal-body');
  assert.match(body, /flex:0 0 auto;min-height:0;overflow:visible/);
  assert.match(rule('settings-enhancements.css', '#bankSettingsModal:not(.tour-modal-host) .settings-action-row>span'), /min-height:0/);
  assert.match(rule('settings-enhancements.css', '#bankSettingsModal .settings-action-row>span'), /min-height:38px/);
  assert.match(read('settings-enhancements.css'), /#bankSettingsModal\.tour-modal-host #settingsTourPreferences \{ margin:0; \}/);
});

test('Export and Transfer have intrinsic dialog/form/body heights and compact accessible choice cards', () => {
  assert.match(rule('export-ui.css', '#izvozModal.export-dialog[open],#activityTransferModal.export-dialog[open]'), /height:fit-content;min-height:0/);
  assert.match(rule('export-ui.css', '#exportForm'), /flex:0 0 auto;height:auto;min-height:0/);
  assert.match(rule('export-ui.css', '.export-body'), /flex:0 0 auto;min-height:0/);
  assert.match(rule('export-ui.css', '.export-body'), /overflow:visible/);
  // The class-qualified selector outranks the later compact popup min-height:90px.
  assert.match(rule('export-ui.css', '#activityTransferModal.export-dialog .export-transfer-choices>button'), /min-height:44px/);
  assert.match(read('export-ui.css'), /max-block-size:min\(90dvh,calc\(var\(--ui-visual-height,100dvh\) - 20px\)\)/);
  assert.match(read('export-ui.css'), /@media\(max-width:640px\)/);
});

test('Receipt static pages are intrinsic without overriding the live camera frame', () => {
  assert.match(rule('receipt.css', 'html body dialog.receipt-dialog:not(:has(.receipt-camera-preview))[open]'), /height:fit-content;min-height:0/);
  assert.match(rule('receipt.css', '.receipt-dialog:not(:has(.receipt-camera-preview)) .receipt-body,\n.receipt-dialog .receipt-form'), /flex:0 0 auto;height:auto;min-height:0/);
  assert.match(rule('receipt.css', '.receipt-dialog .receipt-body'), /overflow:visible/);
  assert.match(rule('receipt.css', '.receipt-dialog .receipt-camera-preview'), /min-height:160px/);
  assert.match(rule('receipt.css', '.receipt-dialog .receipt-camera-preview video'), /max-height:35dvh/);
  assert.match(read('receipt.css'), /html body dialog\.receipt-dialog\[open\]\{padding:0;max-height:calc\(100dvh - 20px\)\}/);
});

test('density changes keep static footers non-shrinking with a separate bottom-left navigation lane', () => {
  assert.match(rule('export-ui.css', '.export-footer'), /flex-shrink:0/);
  assert.match(rule('receipt.css', '.receipt-footer'), /flex:none/);
  assert.match(rule('settings-enhancements.css', '#bankSettingsModal>.mer-modal-footer'), /min-height:0/);
  const footer = read('modal-footer.css');
  assert.match(footer, /\[data-footer-left\][^{]*\{\s*margin-right:auto; margin-left:0; flex:0 0 auto/);
  assert.match(footer, /flex-wrap:wrap/);
  assert.match(footer, /\[data-footer-left\] \{\s*position:static; min-height:44px/);
});
