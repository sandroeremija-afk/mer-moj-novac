'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const source = name => fs.readFileSync(path.join(root,name),'utf8');

test('personal-data UI states the local identity limit and uses named, bounded form fields',() => {
  const html = source('index.html'), premium = source('premium.js');
  assert.match(html,/data-settings-tab="personal"/);assert.match(html,/data-settings-panel="personal"/);
  for (const name of ['firstName','lastName','oib','address']) assert.match(html,new RegExp(`name="${name}"`));
  assert.match(html,/personalOibHint[^>]*data-i18n="personalOibHint"/);
  assert.match(premium,/do not perform identity verification \(KYC\)/);
  assert.match(source('app.js'),/personalData:window\.MerSettingsEnhancements\.normalizePersonalData\(settings\.personalData\)/);
  assert.match(source('settings-enhancements.js'),/await flush\(\)/);
});

test('all security topics are exposed as native radio choices while existing deep links retain routing',() => {
  const popup = source('popup-layout.js');
  assert.match(popup,/createElement\('fieldset'\)/);assert.match(popup,/type="radio" name="settingsTopic"/);
  assert.doesNotMatch(popup,/<select id="settingsTopic"/);
  assert.match(popup,/choice\.checked=choice\.value===selected/);
  assert.match(popup,/MerPopupLayout=Object\.freeze\(\{revealTarget\}\)/);
  assert.match(source('popup-layout.css'),/input:focus-visible/);
});

test('settings use content-sized desktop grids with a measured small-screen fallback and three-row rule pages',() => {
  const css = source('settings-enhancements.css'), premium = source('premium.js'), html = source('index.html');
  assert.match(css,/height:auto;max-height:calc\(100dvh - 32px\)/);
  assert.match(css,/\.settings-modal-body\s*\{[^}]*overflow-y:auto/);
  assert.match(css,/\.settings-modal-body\[data-content-fits="true"\]\s*\{[^}]*overflow-y:hidden/);
  assert.match(css,/\.settings-personal-grid\s*\{[^}]*grid-template-columns:minmax\(0,1\.25fr\) minmax\(0,1fr\)/);
  assert.match(css,/\.security-access-grid\s*\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1\.15fr\)/);
  assert.match(css,/#automationRuleList\s*\{[^}]*overflow:visible/);
  assert.match(html,/id="rulesPrevious"[^>]*aria-controls="automationRuleList"/);
  assert.match(html,/id="rulesNext"[^>]*aria-controls="automationRuleList"/);
  assert.match(premium,/\['general', 'personal', 'security', 'automation'\]/);
  assert.match(premium,/\['ArrowLeft','ArrowRight','Home','End'\]/);
  assert.match(premium,/page\.items\.map/);
});
