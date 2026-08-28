'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const assistantUi = fs.readFileSync(path.join(root, 'assistant-ui.js'), 'utf8');

function elementMarkup(id, closingTag) {
  const idIndex = html.indexOf(`id="${id}"`);
  assert.ok(idIndex >= 0, `${id} exists`);
  const openIndex = html.lastIndexOf('<', idIndex);
  const endIndex = html.indexOf(`</${closingTag}>`, idIndex);
  assert.ok(endIndex > idIndex, `${id} has a closing ${closingTag} tag`);
  return html.slice(openIndex, endIndex + closingTag.length + 3);
}

function cssRule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `${selector} has a CSS rule`);
  return match[1];
}

test('evaluation cycle 2: AI assistant is a compact fixed FAB and non-modal popup', () => {
  const fabIndex = html.indexOf('id="assistantFab"');
  const widgetIndex = html.indexOf('id="assistantWidget"');
  assert.ok(fabIndex >= 0, 'assistant FAB exists');
  assert.ok(widgetIndex >= 0, 'assistant popup exists');

  const fabOpen = html.slice(html.lastIndexOf('<', fabIndex), html.indexOf('>', fabIndex) + 1);
  assert.match(fabOpen, /aria-controls="assistantWidget"/);
  assert.match(fabOpen, /aria-expanded="false"/);
  assert.match(fabOpen, /aria-label=/);

  const widgetOpen = html.slice(html.lastIndexOf('<', widgetIndex), html.indexOf('>', widgetIndex) + 1);
  assert.doesNotMatch(widgetOpen, /^<dialog\b/, 'compact assistant is not a blocking modal dialog');
  assert.match(widgetOpen, /role="dialog"/);
  assert.match(widgetOpen, /aria-labelledby=/);
  assert.match(widgetOpen, /hidden/);

  const fabRule = cssRule('.assistant-fab');
  assert.match(fabRule, /position:fixed/);
  assert.match(fabRule, /bottom:/);
  assert.match(fabRule, /right:/);
  assert.match(fabRule, /z-index:(?:[5-9]\d|[1-9]\d{2,})/);
  assert.match(fabRule, /min-(?:width|inline-size):44px/);
  assert.match(fabRule, /min-(?:height|block-size):44px/);

  const widgetRule = cssRule('.assistant-widget');
  assert.match(widgetRule, /position:fixed/);
  assert.match(widgetRule, /max-height:/);
  assert.match(widgetRule, /overflow:hidden/);
  assert.match(css, /@media \(max-width:767px\)[\s\S]*?\.assistant-widget\s*\{[^}]*(?:width:calc\(100vw\s*-\s*24px\)|inset-inline:12px)/);
});

test('evaluation cycle 2: floating chat owns one accessible conversation surface backed by the global adapter', () => {
  const widget = elementMarkup('assistantWidget', 'section');
  assert.match(widget, /id="assistantWidgetClose"[^>]*aria-label=/);
  assert.match(widget, /id="assistantMessages"[^>]*role="log"[^>]*aria-live="polite"/);
  assert.match(widget, /id="assistantForm"/);
  assert.match(widget, /id="assistantInput"[^>]*(?:aria-label|aria-labelledby)=/);
  assert.equal((widget.match(/data-ai-prompt=/g) || []).length, 2, 'widget exposes both quick prompts without a scroller');

  const help = elementMarkup('helpAssistantModal', 'dialog');
  assert.doesNotMatch(help, /id="assistantMessages"|id="assistantForm"/, 'chat surface is not duplicated in the full Help dialog');
  assert.equal((assistantUi.match(/const histories\s*=\s*new Map\(\)/g) || []).length, 1, 'one profile-scoped history store is used');
  assert.match(assistantUi, /MerFinancialAssistant\.ask\s*\(\s*\{\s*messages\s*,\s*locale\s*,\s*profileId\s*,\s*financialContext\s*,\s*signal\s*\}\s*\)/);
  assert.match(assistantUi, /profileHistory\(appState\.activeAccount\)/);
});

test('evaluation cycle 2: FAB popup has explicit, keyboard-safe open and close behavior', () => {
  assert.match(assistantUi, /assistantFab[\s\S]*addEventListener\('click'/);
  assert.match(assistantUi, /assistantWidgetClose[\s\S]*addEventListener\('click'/);
  assert.match(assistantUi, /setAttribute\('aria-expanded',\s*String\(/);
  assert.match(assistantUi, /(?:event|e)\.key\s*===\s*'Escape'/);
  assert.match(assistantUi, /assistantWidget\.hidden\s*=/);
  assert.match(assistantUi, /activeRequest\?\.abort\(\)/, 'closing or switching profile aborts stale assistant work');
});

test('evaluation cycle 2: Help module buttons filter contextual FAQ without routing away', () => {
  const help = elementMarkup('helpAssistantModal', 'dialog');
  const filters = [...help.matchAll(/data-faq-filter="([^"]+)"/g)].map(match => match[1]);
  for (const moduleName of ['overview', 'budgets', 'savings', 'activity', 'insights']) {
    assert.ok(filters.includes(moduleName), `${moduleName} FAQ filter exists`);
  }
  assert.doesNotMatch(help, /data-help-view=/, 'FAQ module controls are not application navigation links');
  assert.ok((help.match(/data-faq-module=/g) || []).length >= 5, 'FAQ entries declare their module context');

  assert.match(assistantUi, /\[data-faq-filter\][\s\S]*addEventListener\('click'/);
  assert.match(assistantUi, /\[data-faq-module\]/);
  assert.match(assistantUi, /(?:entry|detail|item)\.hidden\s*=/);

  const faqHandlerStart = assistantUi.search(/\$\$\('\[data-faq-filter\]'\)/);
  assert.ok(faqHandlerStart >= 0, 'FAQ filter handler is registered');
  const faqHandler = assistantUi.slice(faqHandlerStart, faqHandlerStart + 600);
  assert.doesNotMatch(faqHandler, /showView\(|closeModal\(/, 'filtering stays inside Help and does not navigate or dismiss');
});
