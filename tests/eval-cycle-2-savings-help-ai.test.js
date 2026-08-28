'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const javascript = fs.readdirSync(root)
  .filter(file => file.endsWith('.js'))
  .map(file => fs.readFileSync(path.join(root, file), 'utf8'))
  .join('\n');

function elementMarkup(id, closingTag) {
  const idIndex = html.indexOf(`id="${id}"`);
  assert.ok(idIndex >= 0, `${id} exists`);
  const openIndex = html.lastIndexOf('<', idIndex);
  const endIndex = html.indexOf(`</${closingTag}>`, idIndex);
  assert.ok(endIndex > idIndex, `${id} has a closing ${closingTag} tag`);
  return html.slice(openIndex, endIndex + closingTag.length + 3);
}

function cssRule(selector, source = css) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `${selector} has a CSS rule`);
  return match[1];
}

test('evaluation cycle 2: Savings keeps Weekly Review compact instead of stretching it into a third column', () => {
  const savingsStart = html.indexOf('id="savingsView"');
  const savingsEnd = html.indexOf('id="activityView"', savingsStart);
  const savings = html.slice(savingsStart, savingsEnd);
  const stackStart = savings.indexOf('class="savings-side-stack"');
  const recommendation = savings.indexOf('class="panel recommendation-panel"', stackStart);
  const weekly = savings.indexOf('class="panel weekly-review-card"', recommendation);
  assert.ok(stackStart >= 0 && recommendation > stackStart && weekly > recommendation);

  const desktopStart = css.indexOf('@media (min-width:1025px)', css.indexOf('/* Savings occupies'));
  const desktopEnd = css.indexOf('@media (min-width:1025px) and', desktopStart);
  const stackRule = cssRule('#savingsView .savings-side-stack', css.slice(desktopStart, desktopEnd));
  assert.match(stackRule, /display:flex/);
  assert.match(stackRule, /flex-direction:column/);
  assert.match(stackRule, /justify-content:space-between/);
  assert.match(stackRule, /gap:16px/);
  assert.doesNotMatch(css, /\.savings-side-stack\s*\{[^}]*display\s*:\s*contents/);
  assert.doesNotMatch(css, /#savingsView \.savings-side-stack\s*\{[^}]*display\s*:\s*contents/);

  const weeklyRule = cssRule('.weekly-review-card');
  assert.match(weeklyRule, /display:grid/);
  assert.match(weeklyRule, /padding:(?:1[012]|[0-9])px\s+(?:1[0-4]|[0-9])px/);
  assert.match(weeklyRule, /gap:(?:1[0-2]|[0-9])px/);
  assert.match(css, /@media \(max-width:1024px\)[\s\S]*?\.savings-side-stack \{ grid-template-rows:auto auto; \}/);
});

test('evaluation cycle 2: Savings preserves the fixed desktop canvas and fluid mobile flow', () => {
  assert.match(css, /#savingsView \{[^}]*display:flex;[^}]*min-height:0;[^}]*overflow:hidden;/);
  assert.match(css, /@media \(min-width:1025px\) \{[\s\S]*?#savingsView > \.goal-buckets-panel \{[\s\S]*?height:100%;[\s\S]*?overflow:visible;/);
  assert.match(css, /@media \(max-width:1024px\) \{[\s\S]*?#savingsView \{[\s\S]*?height:auto;[\s\S]*?overflow:visible;/);
  assert.match(css, /@media \(max-height:720px\) and \(min-width:1025px\)/);
});

test('evaluation cycle 2: Help and AI Assistant sits immediately above the anchored profile block', () => {
  const sidebar = html.slice(html.indexOf('id="sidebar"'), html.indexOf('</aside>'));
  assert.match(sidebar, /id="openHelpAssistant"[^>]*aria-controls="helpAssistantModal"[^>]*aria-haspopup="dialog"/);
  assert.match(sidebar, /id="openHelpAssistant"[\s\S]*?<\/button>\s*<div class="sidebar-bottom">/);
  assert.match(cssRule('.help-assistant-trigger'), /margin-top:auto/);
  assert.match(cssRule('.sidebar-bottom'), /margin-top:0/);
});

test('evaluation cycle 2: Help modal exposes contextual FAQ and the FAB owns the accessible chat surface', () => {
  const modal = elementMarkup('helpAssistantModal', 'dialog');
  assert.match(modal, /<dialog[^>]*class="[^"]*\bmodal\b[^"]*"/);
  assert.match(modal, /aria-labelledby="helpAssistantTitle"/);
  assert.ok((modal.match(/<details\b/g) || []).length >= 4, 'FAQ includes at least four expandable answers');
  assert.match(modal, /Zaštita budžeta/);
  assert.match(modal, /Dnevni tempo/);
  assert.match(modal, /data-faq-filter=/);
  assert.doesNotMatch(modal, /data-help-view=/);

  const widget = elementMarkup('assistantWidget', 'section');
  assert.match(widget, /id="assistantMessages"[^>]*role="log"[^>]*aria-live="polite"[^>]*aria-relevant="additions"/);
  assert.match(widget, /id="assistantForm"/);
  assert.match(widget, /id="assistantInput"[^>]*(?:aria-label|aria-labelledby)=/);
  assert.equal((widget.match(/data-ai-prompt=/g) || []).length, 2, 'floating chat keeps both starter prompts visible at once');
});

test('evaluation cycle 2: assistant requests are adapter-ready, profile scoped and race safe', () => {
  assert.match(javascript, /MerFinancialAssistant/);
  assert.match(javascript, /ask\s*\(\s*\{\s*messages\s*,\s*locale\s*,\s*profileId\s*,\s*financialContext\s*,\s*signal\s*\}\s*\)/);
  assert.match(javascript, /\/api\/assistant/);
  assert.match(javascript, /AbortController/);
  assert.match(javascript, /requestProfileId[\s\S]*appState\.activeAccount\s*!==\s*requestProfileId/);
  assert.match(javascript, /\[data-ai-prompt\][\s\S]*addEventListener\('click'/);
  assert.match(javascript, /assistantForm[\s\S]*addEventListener\('submit'/);
});

test('evaluation cycle 2: Help and floating assistant remain bounded and touch friendly on mobile', () => {
  assert.match(cssRule('.help-assistant-trigger'), /min-height:44px/);
  assert.match(cssRule('.assistant-fab'), /min-height:44px/);
  assert.match(css, /\.assistant-suggestion\s*\{[^}]*min-height:44px/);
  assert.match(css, /\.assistant-messages\s*\{[^}]*overflow-y:auto/);
  assert.match(css, /@media \(max-width:767px\) \{[\s\S]*?\.help-assistant-modal[^}]*\{[^}]*width:calc\(100vw - 16px\);[^}]*max-height:90dvh;/);
  assert.match(css, /@media \(max-width:767px\) \{[\s\S]*?\.assistant-widget[^}]*\{[^}]*(?:width:calc\(100vw - 24px\)|inset-inline:12px)/);
  assert.match(css, /@media \(max-width:1024px\) \{[\s\S]*?#savingsView \{[^}]*padding-bottom:40px/);
  assert.match(javascript, /\$\$\('\.modal'\)\.forEach\([\s\S]*?MerRuntime\.bindDialogBackdropDismiss\(modal/);
});
