'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'assistant-ui.js'), 'utf8');
const authUi = fs.readFileSync(path.join(root, 'auth-ui.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

function cssRule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`(?:^|})\\s*${escaped}\\s*\\{([^}]*)\\}`, 'm'));
  assert.ok(match, `${selector} has a CSS rule`);
  return match[1];
}

test('evaluation cycle 2: Help adds a second accessible AI surface without duplicating conversation state', () => {
  assert.match(ui, /id\s*=\s*'helpModalAiPanel'/);
  assert.match(ui, /id\s*=\s*'helpAssistantMessages'/);
  assert.match(ui, /id\s*=\s*'helpAssistantForm'/);
  assert.match(ui, /id\s*=\s*'helpAssistantInput'/);
  assert.match(ui, /helpUi\.aiPanel[\s\S]*helpUi\.messages[\s\S]*helpUi\.form/);
  assert.equal((ui.match(/const histories\s*=\s*new Map\(\)/g) || []).length, 1, 'both surfaces share one profile history map');
  assert.match(ui, /assistantSurfaces\.forEach\(surface\s*=>[\s\S]*surface\.messages/);
  assert.match(ui, /MerFinancialAssistant\.ask\s*\(\s*\{\s*messages\s*,\s*locale\s*,\s*profileId\s*,\s*financialContext\s*,\s*signal\s*\}\s*\)/);
});

test('evaluation cycle 2: Help FAQ and AI modes remain in-modal and keyboard-addressable', () => {
  assert.match(ui, /dataset\.helpMode\s*=\s*'faq'/);
  assert.match(ui, /dataset\.helpMode\s*=\s*'assistant'/);
  assert.match(ui, /setAttribute\('role',\s*'tablist'\)/);
  assert.match(ui, /setAttribute\('aria-controls',\s*'helpModalAiPanel'\)/);
  assert.match(ui, /function selectHelpMode\(/);
  assert.match(ui, /helpFaqPanel\.hidden\s*=\s*selected\s*!==\s*'faq'/);
  assert.match(ui, /helpUi\.aiPanel\.hidden\s*=\s*selected\s*!==\s*'assistant'/);
  assert.match(ui, /function bindRovingTabs\(/);
  assert.match(ui, /\['ArrowLeft','ArrowRight','Home','End'\]/);
  assert.doesNotMatch(ui, /\[data-help-mode\][\s\S]{0,500}showView\(/, 'switching Help modes never routes away');
});

test('evaluation cycle 2: every Help module receives expanded localized FAQ content', () => {
  for (const moduleName of ['overview', 'budgets', 'savings', 'activity', 'insights']) {
    assert.match(ui, new RegExp(`\\['${moduleName}',\\s*'faq`), `${moduleName} receives an additional FAQ entry`);
  }
  for (const key of ['faqBalancePrivacyQuestion', 'faqCategoryManageQuestion', 'faqEmergencyFundQuestion', 'faqImportedSourceQuestion', 'faqNetTotalQuestion']) {
    assert.ok((ui.match(new RegExp(`${key}:`, 'g')) || []).length >= 2, `${key} is translated in HR and EN`);
  }
  assert.match(ui, /String\(entry\.dataset\.faqModule[\s\S]*split\(\/\\s\+\//, 'filter supports reusable multi-module FAQ entries');
});

test('evaluation cycle 2: floating quick prompts fit as two wrapped columns without a scrollbar', () => {
  const suggestions = cssRule('.assistant-suggestions');
  assert.match(suggestions, /width:100%/);
  assert.match(suggestions, /min-width:0/);
  assert.match(suggestions, /max-width:100%/);
  assert.match(suggestions, /flex-wrap:nowrap/);
  assert.match(suggestions, /overflow-x:auto/);
  assert.match(suggestions, /overflow-y:hidden/);
  assert.match(suggestions, /white-space:nowrap/);
  assert.match(suggestions, /scroll-snap-type:x proximity/);
  assert.match(suggestions, /touch-action:pan-x/);
  assert.match(suggestions, /box-sizing:border-box/);
  const widgetMatches = [...css.matchAll(/\.assistant-widget \.assistant-suggestions\s*\{([^}]*)\}/g)];
  const widgetSuggestions = widgetMatches.at(-1)?.[1] || '';
  assert.match(widgetSuggestions, /width:calc\(100% - 24px\)/);
  assert.match(widgetSuggestions, /max-width:calc\(100% - 24px\)/);
  assert.match(widgetSuggestions, /margin-inline:12px/);
  assert.match(widgetSuggestions, /display:grid/);
  assert.match(widgetSuggestions, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(widgetSuggestions, /overflow:visible/);
  assert.match(widgetSuggestions, /white-space:normal/);
  assert.match(widgetSuggestions, /touch-action:auto/);
  const widgetChipMatches = [...css.matchAll(/\.assistant-widget \.assistant-suggestion\s*\{([^}]*)\}/g)];
  const widgetChip = widgetChipMatches.at(-1)?.[1] || '';
  assert.match(widgetChip, /width:100%/);
  assert.match(widgetChip, /min-width:0/);
  assert.match(widgetChip, /white-space:normal/);
  assert.doesNotMatch(ui, /enableHorizontalPromptDrag/);
});

test('evaluation cycle 2: Help exposes the sole manual restart-tour hook', () => {
  assert.match(ui, /id\s*=\s*'helpRestartOnboarding'/);
  assert.match(ui, /dataset\.i18n\s*=\s*'restartTourFromHelp'/);
  assert.match(ui, /window\.MerOnboardingUi\?\.restart/);
  assert.doesNotMatch(ui, /\$\('#restartOnboarding'\)/);
  assert.match(cssRule('.help-tour-restart'), /min-height:44px/);
});

test('evaluation cycle 2: assistant state is isolated by authenticated user and profile, then erased on logout', () => {
  assert.match(ui, /function assistantSessionKey\(\)[\s\S]*MerAuthProvider\?\.currentSession\?\.\(\)/);
  assert.match(ui, /session\?\.userId\s*\|\|\s*session\?\.email/);
  assert.match(ui, /const key\s*=\s*`\$\{assistantSessionKey\(\)\}::\$\{profileId\}`/);
  assert.match(ui, /function resetAssistantSession\(\)[\s\S]*activeRequest\?\.abort\(\)[\s\S]*histories\.clear\(\)[\s\S]*closeAssistant\(\{ focus:false \}\)/);
  assert.match(ui, /resetSession:resetAssistantSession/);
  assert.match(authUi, /function showAuth\(\)[\s\S]*MerAssistantUi\?\.resetSession\?\.\(\)/);
});

test('evaluation cycle 2: aborted assistant requests cannot freeze or race newer requests', () => {
  assert.match(ui, /finally\s*\{\s*if \(activeRequest === requestController\)\s*\{[\s\S]*activeRequest = null;[\s\S]*setAssistantBusy\(false\)/);
  assert.match(ui, /if \(activeRequest && event\.activeAccount !== activeRequest\.profileId\)\s*\{[\s\S]*activeRequest = null;[\s\S]*request\.abort\(\);[\s\S]*setAssistantBusy\(false\)/);
  assert.doesNotMatch(ui, /finally\s*\{[^}]*assistantSurfaces\.forEach/, 'a stale finally block never re-enables a newer request');
});
