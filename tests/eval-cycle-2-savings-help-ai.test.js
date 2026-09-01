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

test('evaluation cycle 2: Savings merges the weekly insight into one equal-height recommendation card', () => {
  const savingsStart = html.indexOf('id="savingsView"');
  const savingsEnd = html.indexOf('id="activityView"', savingsStart);
  const savings = html.slice(savingsStart, savingsEnd);
  const layoutStart = savings.indexOf('class="savings-layout"');
  const layoutEnd = savings.indexOf('</section>', layoutStart);
  const topLayout = savings.slice(layoutStart, layoutEnd);
  const recommendationStart = savings.indexOf('id="savingsRecommendationCard"', layoutStart);
  const recommendationEnd = savings.indexOf('</aside>', recommendationStart);
  const recommendation = savings.slice(recommendationStart, recommendationEnd);

  assert.equal((topLayout.match(/class="[^"]*\bpanel\b/g) || []).length, 2);
  assert.equal((savings.match(/id="savingsRecommendationCard"/g) || []).length, 1);
  assert.match(recommendation, /recommendation-badge[\s\S]*?recommendation-stat[\s\S]*?recommendation-weekly[\s\S]*?id="tipSavings"[\s\S]*?recommendation-action/);
  assert.doesNotMatch(savings, /\bsavings-side-stack\b|\bweekly-review-card\b|id="openPlan"/);

  const unifiedMarker = css.indexOf('/* Unified Savings recommendation');
  const unified = css.slice(unifiedMarker);
  const desktopStart = unified.indexOf('@media (min-width:1025px) {');
  const desktopEnd = unified.indexOf('@media (min-width:1025px) and', desktopStart);
  const desktop = unified.slice(desktopStart, desktopEnd);
  const cardRule = cssRule('#savingsView .savings-insight-card', unified.slice(0, desktopStart));
  const layoutRule = cssRule('#savingsView > .savings-layout', desktop);

  assert.match(cardRule, /height:100%/);
  assert.match(cardRule, /display:flex/);
  assert.match(cardRule, /flex-direction:column/);
  assert.match(cardRule, /justify-content:space-between/);
  assert.match(cardRule, /padding:20px/);
  assert.match(layoutRule, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(layoutRule, /gap:20px/);
  assert.match(layoutRule, /align-items:stretch/);
  assert.match(desktop, /#savingsView \.savings-top-card \{ grid-column:span 2; \}/);
  assert.match(desktop, /#savingsView \.unified-recommendation-card \{ grid-column:span 1; \}/);
  assert.match(desktop, /#savingsView \.savings-hero,\s*#savingsView \.savings-insight-card \{[^}]*height:100%[^}]*padding:20px/s);
});

test('evaluation cycle 2: Savings preserves the fixed desktop canvas and fluid mobile flow', () => {
  const unified = css.slice(css.indexOf('/* Unified Savings recommendation'));
  assert.match(css, /#savingsView \{[^}]*display:flex;[^}]*min-height:0;[^}]*overflow:hidden;/);
  assert.match(unified, /@media \(min-width:1025px\) \{[\s\S]*?#savingsView \{[^}]*grid-template-rows:auto clamp\(226px,29dvh,252px\) minmax\(0,1fr\)/);
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
