'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const html = read('index.html');
const start = html.indexOf('<section class="view" id="savingsView"');
const end = html.indexOf('<section class="view" id="activityView"', start);
const markup = html.slice(start, end);

// Inspect actual parentage instead of counting nested cards as direct siblings.
function tree(source) {
  const root = { children:[] }, stack = [root], nodes = [];
  const voidTags = new Set(['input','img','br','hr','meta','link','source','area','base','embed','param','track','wbr']);
  for (const match of source.matchAll(/<(\/?)([a-z][\w-]*)\b([^>]*)>/gi)) {
    const [, closing, tag, raw] = match;
    if (closing) {
      assert.equal(stack.at(-1).tag, tag, 'Savings markup closes the matching element');
      stack.pop();
    } else {
      const attributes = Object.fromEntries([...raw.matchAll(/([\w-]+)="([^"]*)"/g)].map(item => [item[1], item[2]]));
      const node = { tag, attributes, children:[], parent:stack.at(-1) };
      node.parent.children.push(node); nodes.push(node);
      if (!voidTags.has(tag) && !/\/\s*$/.test(raw)) stack.push(node);
    }
  }
  assert.equal(stack.length, 1, 'Savings section remains balanced');
  return nodes;
}
const nodes = tree(markup);
const hasClass = (node, name) => (node.attributes.class || '').split(/\s+/).includes(name);
const byClass = name => nodes.filter(node => hasClass(node, name));
const byId = id => nodes.find(node => node.attributes.id === id);
const css = read('layout-density.css').replace(/\/\*[\s\S]*?\*\//g, '');
function cssRule(selector, source = css) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escaped}\\s*\\{([^{}]*)\\}`));
  assert.ok(match, `Missing scoped density rule: ${selector}`);
  return Object.fromEntries(match[1].split(';').map(item => {
    const colon = item.indexOf(':');
    return [item.slice(0, colon).trim(), item.slice(colon + 1).trim()];
  }).filter(([name]) => name));
}
function mediaRules(query) {
  const index = css.indexOf(`@media (${query})`);
  assert.ok(index >= 0, `Missing density breakpoint: ${query}`);
  const start = css.indexOf('{', index);
  let depth = 1, end = start + 1;
  while (end < css.length && depth) {
    if (css[end] === '{') depth++;
    if (css[end] === '}') depth--;
    end++;
  }
  assert.equal(depth, 0);
  return css.slice(start + 1, end - 1);
}

test('Savings top row contains the history chart and one contextual right column', () => {
  const [layout] = byClass('savings-layout');
  assert.ok(layout);
  assert.equal(layout.children.length, 2);
  assert.ok(hasClass(layout.children[0], 'savings-history-card'));
  assert.equal(layout.children[0].attributes['data-layout-card'], 'savings-history');
  const context = layout.children[1];
  assert.ok(hasClass(context, 'savings-context-column'));
  assert.equal(context.children.length, 2);
  assert.equal(context.children[0], byId('savingsRecommendationCard'));
  assert.equal(context.children[0].tag, 'aside');
  assert.ok(hasClass(context.children[1], 'savings-aggregate-card'));
  assert.equal(context.children[1].tag, 'article');
  assert.equal(byClass('savings-context-column').length, 1);
});

test('Savings goals remain a direct module child after the full top row', () => {
  const view = byId('savingsView'), [layout] = byClass('savings-layout'), [goals] = byClass('goal-buckets-panel');
  assert.equal(layout.parent, view);
  assert.equal(goals.parent, view);
  assert.ok(view.children.indexOf(goals) > view.children.indexOf(layout));
  assert.ok(!view.children.some(node => hasClass(node, 'savings-aggregate-card')));
  assert.equal(byId('goalBucketGrid').attributes['data-layout-grid'], 'savings-goals');
  assert.match(read('onboarding-core.js'), /id:'savings', view:'savings', target:'#savingsView \.goal-buckets-panel'/);
});

test('moving cards preserves unique live IDs, chart accessibility and financial privacy markers', () => {
  const ids = ['contributionChart','yearSaved','savingsHistorySvg','savingsChartPoints','savingsChartAxis','savingsChartTooltip','chartTotalSaved','savingsMonthlyAverage','savingsBestMonth','savingsTrendBadge','coverageMonths','tipSavings','savingsAggregateTitle','savingsHeroCurrent','savingsHeroTarget','savingsHeroTrack','savingsHeroProgress','savingsAggregateRemaining','savingsAggregateActiveGoals'];
  for (const id of ids) assert.equal(nodes.filter(node => node.attributes.id === id).length, 1, id);
  assert.equal(byId('contributionChart').attributes.tabindex, '0');
  assert.equal(byId('contributionChart').attributes.role, 'group');
  assert.equal(byId('savingsHeroTrack').attributes.role, 'progressbar');
  assert.equal(byId('savingsHeroTrack').attributes['data-i18n-aria'], 'aggregateSavingsProgress');
  for (const id of ['savingsHeroCurrent','savingsHeroTarget','savingsAggregateRemaining']) assert.match(markup, new RegExp(`id="${id}" data-monetary`));
  const recommendation = byId('savingsRecommendationCard');
  assert.ok(recommendation.children.some(node => node.attributes['data-i18n'] === 'reviewStrategy' && node.attributes['aria-controls'] === 'savingsStrategyModal'));
});

test('context column declares one desktop track and clears legacy aggregate grid spans', () => {
  const column = cssRule('#savingsView .savings-context-column');
  assert.equal(column.display, 'grid');
  assert.match(column['grid-template-columns'], /^minmax\(0,\s*1fr\)$/);
  assert.equal(column['min-width'], '0');
  assert.equal(column['align-content'], 'start');
  for (const selector of ['#savingsView .savings-aggregate-card', '#savingsView #savingsRecommendationCard']) {
    const rule = cssRule(selector);
    assert.equal(rule['grid-area'], 'auto', 'Old span-two placement must not create an implicit context column');
    assert.equal(rule.height, 'auto');
    assert.equal(rule['min-height'], '0');
    assert.equal(rule['justify-content'], 'flex-start');
  }
  assert.match(cssRule('#savingsView .savings-context-column', mediaRules('max-width:1200px'))['grid-template-columns'], /^repeat\(2,\s*minmax\(0,\s*1fr\)\)$/);
  assert.match(cssRule('#savingsView .savings-context-column', mediaRules('max-width:700px'))['grid-template-columns'], /^minmax\(0,\s*1fr\)$/);
});

test('Savings uses intrinsic rows and compact sections instead of a page scroll fallback', () => {
  const view = cssRule(':is(#overviewView,#insightsView,#savingsView):not([hidden])');
  assert.equal(view.height, 'auto');
  assert.equal(view['min-height'], '0');
  assert.equal(view.overflow, 'visible');
  const grid = cssRule('#savingsView:not([hidden])');
  assert.equal(grid['grid-template-rows'], 'auto auto auto');
  assert.equal(grid['align-content'], 'start');
  const top = cssRule('#savingsView > .savings-layout');
  assert.equal(top.height, 'auto');
  assert.equal(top.overflow, 'visible');
  assert.equal(top['grid-area'], 'auto');
  const page = cssRule('.page:has(> :is(#insightsView,#savingsView).active)');
  assert.equal(page.overflow, 'hidden', 'Compact section navigation replaces outer scrolling');
  assert.match(css, /\.module-page-tabs button\[aria-pressed="true"\]/, 'Visible navigation identifies the selected content group');
  assert.match(css, /\[data-module-hidden="true"\]/, 'Only explicit section selection can hide a group');
  assert.match(read('responsive-ui.js'), /MerModulePages/, 'Responsive group controller keeps every section reachable');
  assert.doesNotMatch(css, /(?:^|})\s*(?:html|body)\s*\{/, 'The fallback must not unlock the outer browser document');
});

test('phone Savings toolbar has two equal tracks and does not stretch the primary action across both', () => {
  const phone = mediaRules('max-width:560px');
  const actions = cssRule('#appShell #savingsView > .actions-only-heading .heading-actions', phone);
  assert.equal(actions.display, 'grid');
  assert.match(actions['grid-template-columns'], /^repeat\(2,\s*minmax\(0,\s*1fr\)\)$/);
  const button = cssRule('#appShell #savingsView > .actions-only-heading .heading-actions > button', phone);
  assert.equal(button['grid-column'], 'auto', 'Reset the legacy full-width primary action');
  assert.equal(button['min-width'], '0');
  assert.equal(button.height, 'auto');
  const [heading] = byClass('actions-only-heading');
  const actionsNode = heading.children.find(node => hasClass(node, 'heading-actions'));
  assert.equal(actionsNode.children.length, 4);
  assert.equal(actionsNode.children.filter(node => hasClass(node, 'primary-button')).length, 1);
});

test('goal cards have intrinsic heights and wrap safely rather than rebuilding a filling row', () => {
  const panel = cssRule('#savingsView > .goal-buckets-panel');
  assert.equal(panel['grid-area'], 'auto');
  assert.equal(panel.height, 'auto');
  assert.equal(panel.overflow, 'visible');
  const grid = cssRule('#savingsView .goal-bucket-grid');
  assert.equal(grid.flex, '0 0 auto');
  assert.equal(grid.height, 'auto');
  assert.equal(grid['min-height'], '0');
  assert.equal(grid['max-height'], 'none');
  assert.equal(grid['grid-auto-rows'], 'auto');
  assert.equal(grid['align-content'], 'start');
  assert.match(grid['grid-template-columns'], /^repeat\(auto-fit,\s*minmax\(min\(100%,\s*\d+px\),\s*1fr\)\)$/);
  const card = cssRule('#savingsView .goal-bucket-card');
  assert.equal(card.height, 'auto');
  assert.equal(card['min-height'], '0');
  assert.equal(card['justify-content'], 'flex-start');
  const wider = cssRule('#savingsView .goal-bucket-card', mediaRules('min-width:701px'));
  assert.equal(wider.display, 'grid');
  assert.match(wider['grid-template-columns'], /^minmax\(0,\s*1fr\) auto$/);
  assert.match(cssRule('#savingsView .goal-bucket-grid', mediaRules('max-width:700px'))['grid-template-columns'], /^minmax\(0,\s*1fr\)$/);
});
