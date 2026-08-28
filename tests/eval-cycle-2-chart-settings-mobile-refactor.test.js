'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const premium = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');

function settingsPanel(name) {
  const start = html.indexOf(`data-settings-panel="${name}"`);
  assert.ok(start >= 0, `${name} Settings panel exists`);
  const next = html.indexOf('data-settings-panel=', start + 1);
  return html.slice(start, next < 0 ? html.indexOf('</dialog>', start) : next);
}

test('evaluation cycle 2: data transfer belongs only to Banks and Settings has no tour action', () => {
  assert.doesNotMatch(settingsPanel('general'), /dataPortability|settingsImportJson|settingsExportAllCsv/);
  assert.match(settingsPanel('banks'), /dataPortability/);
  assert.match(settingsPanel('banks'), /id="settingsImportJson"/);
  assert.match(settingsPanel('banks'), /id="settingsExportJson"/);
  assert.match(settingsPanel('banks'), /id="settingsExportAllCsv"/);
  assert.doesNotMatch(html, /id="restartOnboarding"/);
  assert.match(premium, /dataPortability:'Prijenos podataka'/);
});

test('evaluation cycle 2: Insights labels and donut metrics never rely on ellipsis', () => {
  assert.match(app, /merchantBreakdown:'NAJVEĆI PRIMATELJI'/);
  assert.match(app, /donutDisplay=donutExact\.length>12\?compactChartCurrency\(expenseTotal\):donutExact/);
  assert.match(app, /donutTotal\.title=donutExact/);
  const donutRules = [...css.matchAll(/\.category-donut strong\s*\{([^}]*)\}/g)];
  const finalRule = donutRules.at(-1)?.[1] || '';
  assert.match(finalRule, /overflow:visible/);
  assert.match(finalRule, /text-overflow:clip/);
  assert.doesNotMatch(finalRule, /text-overflow:ellipsis/);
});

test('evaluation cycle 2: mobile savings goals and assistant prompts have no nested horizontal or vertical scroller', () => {
  const phone = css.slice(css.lastIndexOf('@media (max-width:414px)'));
  assert.match(phone, /#savingsView \.goal-bucket-grid \{[^}]*max-height:none[^}]*overflow:visible/);
  assert.doesNotMatch(phone, /#savingsView \.goal-bucket-grid \{[^}]*overflow-y:auto/);
  const widgetRules = [...css.matchAll(/\.assistant-widget \.assistant-suggestions\s*\{([^}]*)\}/g)];
  const widgetRule = widgetRules.at(-1)?.[1] || '';
  assert.match(widgetRule, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(widgetRule, /overflow:visible/);
  assert.doesNotMatch(widgetRule, /overflow-x:auto/);
  const widgetStart = html.indexOf('id="assistantWidget"');
  const widgetEnd = html.indexOf('</section>', widgetStart);
  assert.equal((html.slice(widgetStart, widgetEnd).match(/data-ai-prompt=/g) || []).length, 2);
});

