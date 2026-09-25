'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = file => fs.readFileSync(require.resolve('../' + file), 'utf8');
const app = read('app.js'), html = read('index.html'), premium = read('premium.js');

test('dashboard greeting is neutral in Croatian, English and initial markup', () => {
  const context = {};
  vm.runInNewContext(app.slice(0, app.indexOf('const categoryMeta')) + ';this.copy=translations;', context);
  assert.equal(context.copy.hr.dashboardGreeting, 'Pozdrav, Mer');
  assert.equal(context.copy.en.dashboardGreeting, 'Hello, Mer');
  assert.doesNotMatch(app, /(?:Dobro jutro|Good morning),/);
  assert.match(html, /<h1 id="contextHeaderTitle">Pozdrav, Mer<\/h1>/);
});

test('live overview header renders the neutral greeting after language changes at any time', () => {
  const nodes = new Map(['#contextHeaderTitle', '#contextHeaderSubtitle', '#contextHeader'].map(id => [id, {
    textContent:'', attributes:{}, setAttribute(key, value) { this.attributes[key] = value; }
  }]));
  const context = { currentLang:'hr', activeView:'overview', document:{querySelector:selector => nodes.get(selector)} };
  vm.createContext(context);
  const translator = app.slice(app.indexOf('const t ='), app.indexOf('const locale ='));
  const renderer = app.slice(app.indexOf('function renderModuleTitle('), app.indexOf('function showView('));
  vm.runInContext(app.slice(0, app.indexOf('const categoryMeta')) + translator + renderer, context);
  for (const [language, expected] of [['hr','Pozdrav, Mer'], ['en','Hello, Mer'], ['hr','Pozdrav, Mer']]) {
    context.currentLang = language;
    for (const hour of ['08','21']) {
      context.renderModuleTitle(new Date(`2026-09-25T${hour}:00:00Z`));
      assert.equal(nodes.get('#contextHeaderTitle').textContent, expected);
      assert.equal(nodes.get('#contextHeader').attributes['data-view'], 'overview');
    }
  }
});

test('base currency keeps its localized label, options and change handler without the info button', () => {
  const currencyIndex = html.indexOf('<select id="baseCurrency">');
  assert.ok(currencyIndex >= 0, 'currency selector remains available');
  const labelStart = html.lastIndexOf('<label>', currencyIndex), labelEnd = html.indexOf('</label>', currencyIndex);
  assert.ok(labelStart >= 0 && labelEnd > currencyIndex, 'currency retains an implicit accessible label');
  const currencyLabel = html.slice(labelStart, labelEnd + 8);
  assert.match(currencyLabel, /data-i18n="baseCurrency">Osnovna valuta<\/span>/);
  assert.match(currencyLabel, /<select id="baseCurrency">/);
  assert.deepEqual([...currencyLabel.matchAll(/<option value="([A-Z]{3})"/g)].map(match => match[1]), ['EUR','USD','GBP','CHF']);
  assert.doesNotMatch(currencyLabel, /<button\b|info-button|baseCurrencyHint|baseCurrencyInfo/);
  assert.doesNotMatch(html, /data-tooltip-key="baseCurrencyHint"/);
  assert.match(premium, /\['baseCurrency','dateFormat','timezone','hideBalances'\]\.forEach\(id=>\$\('#'\+id\)\.addEventListener\('change'/);
  assert.match(premium, /appState\.settings\.currency=\$\('#baseCurrency'\)\.value/);
});
