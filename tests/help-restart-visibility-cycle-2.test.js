'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../assistant-ui.js'), 'utf8');

function fixture() {
  const document = { activeElement:null };
  const element = () => ({
    hidden:false, attributes:{}, classList:{toggle() {}},
    setAttribute(key, value) { this.attributes[key] = value; },
    focus(options) { document.activeElement = this; this.focusOptions = options; }
  });
  const faqMode = element(), aiMode = element();
  faqMode.dataset = { helpMode:'faq' };
  aiMode.dataset = { helpMode:'assistant' };
  const helpUi = { faqMode, aiMode, restart:element(), input:element(), aiPanel:element() };
  const timers = [], calls = [];
  const context = {
    document, helpUi, modal:{open:true}, helpFaqPanel:element(), helpBody:element(),
    $$:() => [faqMode, aiMode], voice:{stopAll:() => calls.push('stop-voice')},
    renderMessages:() => calls.push('render'), setTimeout:callback => timers.push(callback)
  };
  const start = source.indexOf('  function selectHelpMode(');
  const end = source.indexOf('  function bindRovingTabs(', start);
  assert.ok(start >= 0 && end > start);
  vm.createContext(context);
  vm.runInContext(source.slice(start, end), context);
  return { ...context, timers, calls, select:context.selectHelpMode };
}

test('AI mode removes restart from layout and keyboard navigation; FAQ restores it', () => {
  const ui = fixture();
  ui.select('faq');
  assert.equal(ui.helpUi.restart.hidden, false);
  ui.select('assistant');
  assert.equal(ui.helpUi.restart.hidden, true);
  assert.equal(ui.helpFaqPanel.hidden, true);
  assert.equal(ui.helpUi.aiPanel.hidden, false);
  assert.equal(ui.helpUi.aiMode.attributes['aria-selected'], 'true');
  ui.select('faq');
  assert.equal(ui.helpUi.restart.hidden, false);
  assert.equal(ui.helpUi.aiPanel.hidden, true);
  assert.equal(ui.helpUi.faqMode.attributes['aria-selected'], 'true');
  assert.equal(ui.timers.length, 0, 'a tour mode change never steals wizard focus');
  assert.match(fs.readFileSync(require.resolve('../styles.css'), 'utf8'), /\[hidden\]\s*\{\s*display:\s*none\s*!important/);
});

test('hiding the focused restart recovers focus to the visible AI tab without scrolling', () => {
  const ui = fixture();
  ui.document.activeElement = ui.helpUi.restart;
  ui.select('assistant');
  assert.equal(ui.document.activeElement, ui.helpUi.aiMode);
  assert.equal(ui.helpUi.aiMode.focusOptions.preventScroll, true);
  ui.document.activeElement = ui.helpUi.input;
  ui.select('assistant');
  assert.equal(ui.document.activeElement, ui.helpUi.input, 'existing chat focus is preserved');
  ui.document.activeElement = ui.helpUi.restart;
  ui.modal.open = false;
  ui.select('assistant');
  assert.equal(ui.document.activeElement, ui.helpUi.restart, 'closed dialogs cannot steal focus');
});

test('explicit AI tab activation retains composer focus and FAQ keeps the manual restart handler', () => {
  const ui = fixture();
  ui.select('assistant', { focus:true });
  assert.equal(ui.helpUi.restart.hidden, true);
  assert.equal(ui.timers.length, 1);
  ui.timers[0]();
  assert.equal(ui.document.activeElement, ui.helpUi.input);
  ui.select('unsupported-mode');
  assert.equal(ui.helpUi.restart.hidden, false, 'unsupported modes fall back to FAQ');
  assert.match(source, /helpUi\.restart\.addEventListener\('click', \(\) => \{\s*closeModal\(modal\);\s*setTimeout\(\(\) => window\.MerOnboardingUi\?\.restart/);
  assert.match(source, /modal\.addEventListener\('close',[\s\S]*if \(modal\.open\) return;[\s\S]*selectHelpMode\('faq'\)/);
});
