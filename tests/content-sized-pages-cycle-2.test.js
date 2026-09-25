'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const stylesheet = 'layout-density.css';
const css = fs.existsSync(path.join(root, stylesheet)) ? read(stylesheet) : '';

// These are source-contract tests, not a replacement for browser geometry checks.
// Retain media ancestry so a phone-only reset cannot conceal a desktop regression.
function parseRules(source, media = []) {
  const rules = [], clean = source.replace(/\/\*[\s\S]*?\*\//g, '');
  let cursor = 0;
  while (cursor < clean.length) {
    const open = clean.indexOf('{', cursor);
    if (open < 0) break;
    const selector = clean.slice(cursor, open).trim();
    let end = open + 1, depth = 1;
    while (end < clean.length && depth) {
      if (clean[end] === '{') depth++;
      if (clean[end] === '}') depth--;
      end++;
    }
    assert.equal(depth, 0, 'Density stylesheet has balanced rules');
    const body = clean.slice(open + 1, end - 1);
    if (selector.startsWith('@media')) rules.push(...parseRules(body, [...media, selector]));
    else if (!selector.startsWith('@')) rules.push({ selector, body, media });
    cursor = end;
  }
  return rules;
}
function splitSelectors(value) {
  let depth = 0, start = 0;
  const selectors = [];
  for (let index = 0; index < value.length; index++) {
    if ('(['.includes(value[index])) depth++;
    if (')]'.includes(value[index])) depth--;
    if (value[index] === ',' && !depth) { selectors.push(value.slice(start, index)); start = index + 1; }
  }
  selectors.push(value.slice(start));
  return selectors.map(selector => selector.trim().replace(/\s*>\s*/g, '>').replace(/\s+/g, ' '));
}
const rules = parseRules(css);
function declarations(selectors, width, height = 900) {
  const accepted = (Array.isArray(selectors) ? selectors : [selectors]).flatMap(splitSelectors);
  const result = {};
  for (const rule of rules) {
    const applies = rule.media.every(query => [...query.matchAll(/\((min|max)-(width|height)\s*:\s*(\d+)px\)/g)].every(([, bound, dimension, amount]) => {
      const actual = dimension === 'width' ? width : height;
      return bound === 'min' ? actual >= Number(amount) : actual <= Number(amount);
    }));
    if (!applies || !splitSelectors(rule.selector).some(selector => accepted.includes(selector))) continue;
    for (const item of rule.body.split(';')) {
      const colon = item.indexOf(':');
      if (colon > 0) result[item.slice(0, colon).trim()] = item.slice(colon + 1).trim().replace(/\s+/g, ' ');
    }
  }
  return result;
}
function intrinsicTracks(value, message) {
  assert.ok(value, message + ' must explicitly override the previous filling track');
  assert.doesNotMatch(value, /(?:\d*\.)?\d+fr|\d(?:dvh|vh|%)/, message + ' cannot consume remaining viewport space');
}
function nonGrowingFlex(rule, message) {
  assert.ok(/^(?:none|initial|0\s+(?:0|1)\s+(?:auto|max-content|fit-content))$/.test(rule.flex || '') || rule['flex-grow'] === '0', message);
}
const insightGrid = '#insightsView > .advanced-insights-grid';
const insightCard = '#insightsView > .advanced-insights-grid > .insight-visual-card';
const overviewGrid = '#overviewView > .dashboard-grid';
const overviewCards = '#overviewView > .dashboard-grid > :is(.safe-panel,.budget-panel)';

test('content-sized page overrides load after every legacy page stylesheet and ship offline', () => {
  assert.ok(css.trim(), 'Add the scoped layout-density.css overrides');
  const links = [...read('index.html').matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(match => match[1].split('?')[0]);
  assert.equal(links.at(-1), stylesheet, 'Production and development use the final density overrides');
  assert.match(read('scripts/build.js'), /suiteCss\.push\([^)]*['"]layout-density\.css['"]/, 'The offline bundle contains the stylesheet');
});

test('desktop Insights uses intrinsic page and analysis tracks instead of filling the viewport', () => {
  for (const [width, height] of [[1100, 720], [1366, 768], [1440, 900], [1920, 1080], [2560, 1440]]) {
    const page = declarations('#insightsView:not([hidden])', width, height);
    assert.equal(page['align-content'], 'start', `${width}: Insights content stays at the top`);
    intrinsicTracks(page['grid-template-rows'], `${width}: Insights page rows`);
    const grid = declarations(insightGrid, width, height);
    assert.equal(grid['align-content'], 'start', `${width}: analysis rows are not stretched`);
    intrinsicTracks(grid['grid-template-rows'] || grid['grid-auto-rows'], `${width}: analysis rows`);
  }
});

test('analysis cards retain content height on phones, tablets, laptops and large desktops', () => {
  for (const width of [375, 414, 768, 1024, 1366, 1920, 2560]) {
    const card = declarations([insightCard, '#insightsView .advanced-insights-grid > .insight-visual-card'], width);
    assert.ok(['auto', 'fit-content', 'max-content'].includes(card.height), `${width}: remove the previous height:100%`);
    assert.equal(card['min-height'], '0', `${width}: remove inherited minimum card heights`);
    assert.doesNotMatch(card.overflow || '', /hidden|clip/, 'Do not fake fitting by hiding financial data');
  }
});

test('Insights internal plots and captions cannot reintroduce artificial spare vertical space', () => {
  for (const width of [375, 768, 1366, 1920]) {
    const monthly = declarations('#insightsView #monthlyBarChart', width);
    nonGrowingFlex(monthly, `${width}: monthly comparison uses its six rows, not spare height`);
    intrinsicTracks(monthly['grid-auto-rows'], `${width}: monthly comparison row size`);
    assert.equal(monthly['align-content'], 'start');
    const structure = declarations(['#insightsView .expense-structure-card #expenseStructureSummary', '#insightsView #expenseStructureSummary'], width);
    nonGrowingFlex(structure, `${width}: fixed/flexible summary is content-sized`);
    assert.ok(['start', 'flex-start'].includes(structure['justify-content']));
    const caption = declarations(['#insightsView > .advanced-insights-grid .insight-caption', '#insightsView .advanced-insights-grid .insight-caption'], width);
    assert.ok(caption['margin-top'] && caption['margin-top'] !== 'auto', `${width}: captions do not push content to the bottom`);
  }
});

test('Overview removes imposed desktop row heights including the spending-alert variant', () => {
  for (const [width, height] of [[1100, 720], [1366, 768], [1920, 1080]]) {
    for (const selector of [overviewGrid, '#overviewView:has(.spending-anomaly-alert:not([hidden])) > .dashboard-grid']) {
      const row = declarations(selector, width, height);
      nonGrowingFlex(row, `${width}: Overview row uses content height with or without an alert`);
      intrinsicTracks(row['grid-template-rows'], `${width}: Overview row`);
    }
  }
});

test('Overview cards and their inner budget/ring content do not distribute excess vertical space', () => {
  for (const width of [375, 414, 768, 1024, 1366, 1920]) {
    const card = declarations(overviewCards, width);
    assert.ok(['auto', 'fit-content', 'max-content'].includes(card.height), `${width}: Overview cards are not percentage-height boxes`);
    assert.ok(['start', 'flex-start'].includes(card['justify-content']), `${width}: no space-between card stretching`);
    nonGrowingFlex(declarations('#overviewView .safe-content', width), `${width}: safe-to-spend content does not grow`);
    const list = declarations('#overviewView .budget-list', width);
    nonGrowingFlex(list, `${width}: tracked categories do not grow`);
    intrinsicTracks(list['grid-auto-rows'], `${width}: tracked category rows`);
  }
});

test('mobile and tablet page cards remain an explicit grid in natural vertical flow', () => {
  for (const width of [375, 414, 768, 1024]) {
    const overview = declarations(overviewGrid, width);
    assert.equal(overview.display, 'grid', `${width}: gap requires grid, not the legacy block reset`);
    intrinsicTracks(overview['grid-template-rows'], `${width}: natural Overview rows`);
    const insights = declarations(insightGrid, width);
    assert.equal(insights['align-content'], 'start');
    intrinsicTracks(insights['grid-template-rows'] || insights['grid-auto-rows'], `${width}: natural Insights rows`);
  }
});

test('content sizing preserves the existing live chart targets, privacy formatting and deep-dive routes', () => {
  const html = read('index.html');
  for (const id of ['safeDaily', 'safeRemaining', 'categoryDonut', 'monthlyBarChart', 'expenseStructureSummary', 'topCategoryValue', 'momValue']) {
    assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1, id);
  }
  for (const rule of rules.filter(rule => /#(?:overview|insights)View/.test(rule.selector))) {
    assert.doesNotMatch(rule.body, /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?:[;}\s]|$)/, 'Density fixes must not hide content');
  }
  assert.match(read('styles.css'), /\[hidden\]\s*\{\s*display:\s*none\s*!important/, 'Inactive modules remain hidden');
  assert.match(read('zero-scroll.css'), /\[data-page-hidden="true"\][^}]*display:none !important/, 'Pagination visibility remains intact');
});
