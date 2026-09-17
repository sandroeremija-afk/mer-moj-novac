'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const styles = read('styles.css');
const rules = source => [...source.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(match => ({selector:match[1].trim(), declarations:match[2]}));

test('cycle 2: shared dialog and list overrides replace the legacy scrolling fallback', () => {
  const html=read('index.html'), zeroScroll=read('zero-scroll.css');
  assert.ok(html.indexOf('href="zero-scroll.css"')>html.indexOf('href="styles.css'), 'zero-scroll rules follow the legacy layout');
  assert.ok(rules(zeroScroll).some(rule=>rule.selector==='dialog.modal:not(.tour-modal-host)'&&/overflow\s*:\s*hidden/.test(rule.declarations)));
  assert.ok(rules(zeroScroll).some(rule=>rule.selector==='dialog .mer-paged-list'&&/overflow\s*:\s*visible/.test(rule.declarations)));
  assert.match(zeroScroll,/\[data-page-hidden="true"\][^}]*display:none !important/);
  assert.match(read('pagination.js'),/aria-controls/);
  assert.match(read('sections.js'),/aria-controls/);
});

test('cycle 2: static tool bodies use reachable sections and pages without a body scrollbar', () => {
  for (const [file, selector] of [
    ['enterprise.css', '.enterprise-dialog-body'],
    ['planning.css', '.planning-body'],
    ['receipt.css', '.receipt-dialog .receipt-body'],
    ['invoice.css', '.invoice-dialog .invoice-body'],
    ['settings-enhancements.css', 'html body #bankSettingsModal:not(.tour-modal-host) .settings-modal-body']
  ]) {
    const bodyRule = rules(read(file)).filter(rule=>rule.selector===selector&&/overflow\s*:/.test(rule.declarations)).at(-1);
    assert.ok(bodyRule, `${selector} has a scoped final override`);
    assert.match(bodyRule.declarations,/overflow\s*:\s*visible/,`${selector} no longer owns an inner scrollbar`);
    assert.doesNotMatch(bodyRule.declarations,/overflow-y\s*:\s*(auto|scroll)/);
  }
  for(const file of ['receipt-ui.js','invoice-ui.js']){
    assert.match(read(file),/MerSections\.attach/);
    assert.match(read(file),/MerPagination\?\.attach/);
  }
  assert.match(read('planning-ui.js'),/role="tabpanel"/);
  for(const file of ['enterprise-ui.js','planning-ui.js']){
    assert.match(read(file),/MerPagination\?\.attach/);
  }
  const savingsRule=rules(read('list-pagination.css')).find(rule=>rule.selector.includes('#savingsDetailsModal #savingsEntryList')&&/overflow\s*:\s*visible/.test(rule.declarations));
  assert.ok(savingsRule,'savings deposits use natural height with page navigation');
  assert.match(read('app.js'),/renderListPagination\('#savingsEntryList'/);
});

test('cycle 2: AI message history retains its dedicated scrolling exception',()=>{
  const messageRule=rules(read('zero-scroll.css')).find(rule=>rule.selector.includes('#assistantWidget .assistant-messages')&&/overflow-y\s*:\s*auto/.test(rule.declarations));
  assert.ok(messageRule,'conversation history remains reachable as messages accumulate');
  assert.match(messageRule.declarations,/min-height\s*:\s*0/);
  assert.match(messageRule.declarations,/scrollbar-width\s*:\s*thin/);
});

test('cycle 2: planning dialog uses dvh after the vh fallback for mobile browser chrome', () => {
  const planning = rules(read('planning.css')).find(rule => rule.selector === '.planning-dialog' && /max-height\s*:\s*90vh/.test(rule.declarations));
  assert.ok(planning);
  assert.match(planning.declarations, /max-height\s*:\s*90vh\s*;\s*max-height\s*:\s*90dvh\s*;/);
  assert.match(planning.declarations, /overflow\s*:\s*hidden/);
});
