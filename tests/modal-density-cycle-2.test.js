'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const styles = read('styles.css');
const rules = source => [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(match => ({selector:match[1].trim(), declarations:match[2]}));

test('cycle 2: structured dialogs opt out of the generic outer scrolling fallback', () => {
  const fallback = rules(styles).filter(rule => rule.selector.startsWith('[data-ui="dialog"]:not(.detail-modal)') && /overflow-y\s*:\s*auto/.test(rule.declarations));
  assert.equal(fallback.length, 1, 'one recognizable outer-scroll fallback remains for unstructured dialogs');
  for (const className of ['premium-settings', 'import-data-modal', 'budget-categories-modal', 'help-assistant-modal', 'subscriptions-modal', 'enterprise-dialog', 'planning-dialog', 'receipt-dialog', 'household-dialog', 'savings-entries-modal', 'assessment-modal']) {
    assert.ok(fallback[0].selector.includes(`:not(.${className})`), `${className} must not receive a second outer scrollbar`);
  }
  assert.match(fallback[0].declarations, /overflow-x\s*:\s*hidden/);
});

test('cycle 2: long tool content retains its one bounded body scroll owner', () => {
  for (const [file, selector] of [
    ['enterprise.css', '.enterprise-dialog-body'],
    ['planning.css', '.planning-body'],
    ['receipt.css', '.receipt-body'],
    ['household.css', '.household-body'],
    ['styles.css', '.savings-entry-list-all']
  ]) {
    const bodyRule = rules(read(file)).find(rule => rule.selector === selector && /overflow-y\s*:\s*auto/.test(rule.declarations));
    assert.ok(bodyRule, `${selector} retains scroll access for long data`);
    assert.match(bodyRule.declarations, /min-height\s*:\s*0/, `${selector} can shrink within its dialog`);
  }
  const settingsBody = rules(styles).find(rule => rule.selector.split(',').map(part => part.trim()).includes('.settings-modal-body') && /overflow-y\s*:\s*auto/.test(rule.declarations));
  assert.ok(settingsBody, 'Settings keeps its single body scrollbar');
  assert.ok(rules(styles).some(rule => rule.selector === '.settings-modal-body .settings-pane.active' && /overflow\s*:\s*visible/.test(rule.declarations)), 'Settings panels must not introduce nested scrollbars');
});

test('cycle 2: planning dialog uses dvh after the vh fallback for mobile browser chrome', () => {
  const planning = rules(read('planning.css')).find(rule => rule.selector === '.planning-dialog' && /max-height\s*:\s*90vh/.test(rule.declarations));
  assert.ok(planning);
  assert.match(planning.declarations, /max-height\s*:\s*90vh\s*;\s*max-height\s*:\s*90dvh\s*;/);
  assert.match(planning.declarations, /overflow\s*:\s*hidden/);
});
