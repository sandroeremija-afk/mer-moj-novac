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

test('all security actions share one overview while existing deep links retain routing',() => {
  const popup = source('popup-layout.js');
  assert.match(popup,/settings-security-overview/);assert.match(popup,/\['password','Lozinka','Password'/);
  assert.doesNotMatch(popup,/type="radio" name="settingsTopic"|security-access-tabs|generalViews|personalViews/);
  assert.match(popup,/button\.dataset\.securityFlow=key/);
  assert.match(popup,/MerPopupLayout=Object\.freeze\(\{revealTarget\}\)/);
  assert.match(source('popup-layout.css'),/input:focus-visible/);
});

test('settings use complete pages without an inner scroller and three-row rule pages',() => {
  const css = source('settings-enhancements.css'), premium = source('premium.js'), html = source('index.html');
  assert.match(css,/height:fit-content;max-height:calc\(100dvh - 32px\)/);
  assert.match(css,/\.settings-modal-body\s*\{[^}]*overflow:visible/);
  assert.doesNotMatch(css,/\.settings-modal-body\s*\{[^}]*overflow-y:auto/);
  assert.match(css,/\.settings-personal-grid\s*\{[^}]*display:block/);
  assert.match(css,/\.settings-security-overview\s*\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/#automationRuleList\s*\{[^}]*overflow:visible/);
  assert.match(html,/id="rulesPrevious"[^>]*aria-controls="automationRuleList"/);
  assert.match(html,/id="rulesNext"[^>]*aria-controls="automationRuleList"/);
  assert.match(premium,/\['general', 'personal', 'security', 'automation'\]/);
  assert.match(premium,/\['ArrowLeft','ArrowRight','Home','End'\]/);
  assert.match(premium,/page\.items\.map/);
});
