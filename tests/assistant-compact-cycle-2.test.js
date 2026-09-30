'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = name => fs.readFileSync(require.resolve('../' + name), 'utf8');
const source = read('assistant-ui.js');

test('compact chat keeps a short localized AI footer and a discoverable data-processing explanation in Help', () => {
  const context = { translations:{hr:{}, en:{}}, applyStaticTranslations() {} };
  vm.createContext(context);
  const start = source.indexOf('  Object.assign(translations.hr,');
  const end = source.indexOf('  const modal =', start);
  vm.runInContext(source.slice(start, end), context);
  for (const language of ['hr', 'en']) {
    const copy = context.translations[language];
    assert.equal(copy.assistantDisclaimer, copy.assistantWidgetDisclaimer);
    assert.ok(copy.assistantDisclaimer.length < 85, 'the footer is one short notice, not a data-policy paragraph');
    assert.doesNotMatch(copy.assistantDisclaimer, /OpenAI|preglednika|browser/);
    assert.match(copy.faqAssistantPrivacyAnswer, /OpenAI/);
    assert.ok(copy.faqAssistantPrivacyQuestion);
  }
  assert.match(context.translations.hr.assistantDisclaimer, /umjetnom inteligencijom/);
  assert.match(context.translations.hr.faqAssistantPrivacyAnswer, /zbirni financijski iznosi aktivnog profila/);
  assert.match(context.translations.hr.faqAssistantPrivacyAnswer, /poruku zatim šaljete sami/);
  assert.match(source, /\['overview', 'faqAssistantPrivacyQuestion', 'faqAssistantPrivacyAnswer'\]/);
});

test('neither chat surface renders question templates or auto-submits a suggestion', () => {
  const html = read('index.html');
  const widgetStart = html.indexOf('id="assistantWidget"');
  const widget = html.slice(widgetStart, html.indexOf('</section>', widgetStart));
  assert.doesNotMatch(widget, /assistant-suggestion|data-ai-prompt/);
  assert.doesNotMatch(source, /dataset\.aiPrompt|suggestions\.append|\$\$\('\[data-ai-prompt\]'/);
  assert.match(source, /conversation\.append\(form\)/, 'the existing tour target still contains the real composer');
  assert.match(source, /form\.append\(label, input, send\)/);
  assert.match(source, /MerFinancialAssistant\.ask\(\{messages,locale,profileId,financialContext,signal\}\)/, 'the requested cleanup does not bypass the existing request context');
});

test('chat leaves the message stream flexible while empty status and speech notes take no footer space', () => {
  const css = read('assistant-voice.css');
  assert.match(css, /#helpAssistantModal #helpAssistantMessages,#assistantWidget #assistantMessages\{flex:1 1 0;min-height:0\}/);
  assert.match(css, /\.assistant-status:empty[^}]*\{display:none\}/);
  assert.match(css, /\.assistant-voice-meta:not\(:has\(\.assistant-voice-status:not\(\[hidden\]\)\)\)\{margin:0\}/);
  assert.match(css, /\.assistant-disclaimer\{[^}]*font-size:11px;line-height:1\.4;text-align:center/);
  assert.match(read('assistant-voice.js'), /hint\.className='assistant-voice-hint sr-only'/);
  assert.match(read('zero-scroll.css'), /#helpModalAiPanel \.assistant-messages\s*\{[^}]*overflow-y:auto/, 'long conversations remain scrollable inside the fixed parent');
});
