'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

function rule(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...source.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g'))];
  assert.ok(matches.length, `${selector} has a CSS rule`);
  return matches.map(match => match[1]).join('\n');
}

function savingsMarkup() {
  const start = html.indexOf('id="savingsView"');
  const end = html.indexOf('id="activityView"', start);
  assert.ok(start >= 0 && end > start, 'Savings view is present');
  return html.slice(start, end);
}

test('evaluation cycle 1: Savings preserves a predictable hero, unified recommendation, and goals hierarchy', () => {
  const savings = savingsMarkup();
  const layout = savings.indexOf('class="savings-layout"');
  const hero = savings.indexOf('class="panel savings-hero savings-top-card"', layout);
  const recommendation = savings.indexOf('class="panel recommendation-panel savings-insight-card unified-recommendation-card"', hero);
  const goals = savings.indexOf('class="panel goal-buckets-panel"', recommendation);
  const layoutEnd = savings.indexOf('</section>', layout);
  const topLayout = savings.slice(layout, layoutEnd);
  const unifiedEnd = savings.indexOf('</aside>', recommendation);
  const unified = savings.slice(recommendation, unifiedEnd);

  assert.ok(layout >= 0 && hero > layout && recommendation > hero, 'hero and unified recommendation are direct Savings peers');
  assert.equal((topLayout.match(/class="[^"]*\bpanel\b/g) || []).length, 2, 'top layout owns exactly two cards');
  assert.equal((savings.match(/\bsavings-insight-card\b/g) || []).length, 1, 'Savings owns exactly one unified recommendation card');
  assert.match(unified, /id="savingsRecommendationCard"/);
  assert.ok(goals > recommendation, 'goal targets remain a separate lower panel');
  assert.match(unified, /recommendation-header[\s\S]*?<h2[^>]*data-i18n="merRecommendation"[\s\S]*?class="status-pill recommendation-badge"[^>]*data-i18n="healthyReserve"[\s\S]*?recommendation-stat[\s\S]*?id="coverageMonths"[\s\S]*?recommendation-weekly[\s\S]*?data-i18n="onTrackSave"[\s\S]*?id="tipSavings"[\s\S]*?data-open-assessment[\s\S]*?data-i18n="reviewStrategy"/);
  assert.doesNotMatch(savings, /\bsavings-side-stack\b|\bweekly-review-card\b|id="openPlan"/);
  assert.match(savings, /goal-buckets-panel[\s\S]*?id="goalBucketGrid"/);
});

test('evaluation cycle 1: fixed desktop Savings contains nested grids without clipping interactive card content', () => {
  const repairMarker = css.indexOf('/* Savings occupies');
  const desktopStart = css.indexOf('@media (min-width:1025px)', repairMarker);
  const desktopEnd = css.indexOf('@media (min-width:1025px) and', desktopStart);
  assert.ok(repairMarker >= 0 && desktopStart > repairMarker && desktopEnd > desktopStart, 'a bounded desktop Savings override exists');
  const desktop = css.slice(desktopStart, desktopEnd);
  const goalsPanel = rule(desktop, '#savingsView > .goal-buckets-panel');
  const goalsGrid = rule(desktop, '#savingsView .goal-bucket-grid');
  const goalCard = rule(desktop, '#savingsView .goal-bucket-card');
  const unifiedMarker = css.indexOf('/* Unified Savings recommendation');
  const unified = css.slice(unifiedMarker);
  const unifiedDesktopStart = unified.indexOf('@media (min-width:1025px) {');
  const unifiedDesktopEnd = unified.indexOf('@media (min-width:1025px) and', unifiedDesktopStart);
  const unifiedBase = unified.slice(0, unifiedDesktopStart);
  const unifiedDesktop = unified.slice(unifiedDesktopStart, unifiedDesktopEnd);
  const unifiedCard = rule(unifiedBase, '#savingsView .savings-insight-card');
  const unifiedAction = rule(unifiedBase, '#savingsView .savings-insight-card > .recommendation-action');
  const unifiedLayout = rule(unifiedDesktop, '#savingsView > .savings-layout');

  assert.ok(unifiedMarker >= 0 && unifiedDesktopStart > 0 && unifiedDesktopEnd > unifiedDesktopStart, 'the final unified-card layer exists');
  assert.match(unifiedCard, /height\s*:\s*100%/);
  assert.match(unifiedCard, /display\s*:\s*flex/);
  assert.match(unifiedCard, /flex-direction\s*:\s*column/);
  assert.match(unifiedCard, /justify-content\s*:\s*space-between/);
  assert.match(unifiedCard, /padding\s*:\s*20px/);
  assert.match(unifiedLayout, /display\s*:\s*grid/);
  assert.match(unifiedLayout, /grid-template-columns\s*:\s*repeat\(3\s*,\s*minmax\(0\s*,\s*1fr\)\)/, 'desktop uses the explicit three-column grid');
  assert.match(unifiedLayout, /gap\s*:\s*20px/);
  assert.match(unifiedLayout, /align-items\s*:\s*stretch/, 'both top columns must share an exact bottom edge');
  assert.match(unifiedDesktop, /#savingsView \.savings-top-card\s*\{[^}]*grid-column\s*:\s*span 2/);
  assert.match(unifiedDesktop, /#savingsView \.unified-recommendation-card\s*\{[^}]*grid-column\s*:\s*span 1/);
  assert.match(unifiedDesktop, /#savingsView \.savings-hero,\s*#savingsView \.savings-insight-card\s*\{[^}]*height\s*:\s*100%[^}]*min-height\s*:\s*0[^}]*padding\s*:\s*20px/s, 'both direct cards consume the same stretched row height and padding');
  assert.match(unifiedAction, /position\s*:\s*static/);
  assert.match(unifiedAction, /width\s*:\s*100%/);
  assert.match(unifiedAction, /align-self\s*:\s*stretch/);
  assert.match(goalsPanel, /overflow\s*:\s*visible/, 'the goals panel must not clip its cards');
  assert.match(goalsGrid, /overflow\s*:\s*visible/, 'the goals grid must not own a nested scrollbar');
  assert.match(goalsGrid, /grid-template-columns\s*:\s*repeat\(auto-fit\s*,\s*minmax\(170px\s*,\s*1fr\)\)/, 'desktop goals fit one adaptive row before creating another');
  assert.doesNotMatch(goalCard, /overflow(?:-y)?\s*:\s*hidden/, 'goal controls must not be hard-clipped');
  assert.match(goalCard, /height\s*:\s*auto/);
  assert.match(css, /body:has\(#savingsView:not\(\[hidden\]\)\) \.assistant-fab \{[^}]*right:8px[^}]*width:44px[^}]*height:44px/s, 'the narrow-desktop FAB stays outside Savings goal controls');

  const allGoalRules = [...css.matchAll(/#savingsView \.goal-bucket-grid\s*\{([^}]*)\}/g)].map(match => match[1]);
  assert.ok(allGoalRules.length, 'Savings goal-grid rules exist');
  assert.ok(allGoalRules.every(declarations => !/overflow-y\s*:\s*(?:auto|scroll)/.test(declarations)), 'no cascade layer may restore a nested desktop goal scrollbar');

  assert.doesNotMatch(
    desktop,
    /#savingsView\s*\{[^}]*grid-template-rows\s*:\s*auto\s+minmax\(0\s*,\s*[\d.]+fr\)\s+minmax\(0\s*,\s*[\d.]+fr\)/s,
    'desktop rows must be content-aware rather than forcing both card regions into fixed fractions'
  );
});

test('evaluation cycle 1: touch layouts restore natural flow and never inherit desktop clipping', () => {
  const visualizationMarker = css.indexOf('/* Savings visual system:');
  const visualizationMobileStart = css.indexOf('@media (max-width:1024px)', visualizationMarker);
  const visualizationMobileEnd = css.indexOf('@media (max-width:414px)', visualizationMobileStart);
  const visualizationMobile = css.slice(visualizationMobileStart, visualizationMobileEnd);
  const unifiedMarker = css.indexOf('/* Unified Savings recommendation');
  const unifiedMobileStart = css.indexOf('@media (max-width:1024px)', unifiedMarker);
  const unifiedMobileEnd = css.indexOf('@media (max-width:414px)', unifiedMobileStart);
  const unifiedMobile = css.slice(unifiedMobileStart, unifiedMobileEnd);

  assert.ok(visualizationMobileStart >= 0 && unifiedMobileStart >= 0, 'mobile Savings overrides exist');
  assert.match(visualizationMobile, /#savingsView\s*\{[^}]*display\s*:\s*block[^}]*height\s*:\s*auto[^}]*overflow\s*:\s*visible/s);
  assert.match(visualizationMobile, /#savingsView\s+\.goal-bucket-grid\s*\{[^}]*overflow\s*:\s*visible[^}]*grid-auto-rows\s*:\s*auto/s);
  assert.match(visualizationMobile, /#savingsView\s+\.goal-bucket-card\s*\{[^}]*height\s*:\s*auto[^}]*overflow\s*:\s*visible/s);
  assert.match(unifiedMobile, /#savingsView\s*>\s*\.savings-layout\s*\{[^}]*grid-template-columns\s*:\s*1fr[^}]*align-items\s*:\s*stretch/s);
  assert.match(unifiedMobile, /#savingsView \.savings-hero,\s*#savingsView \.savings-insight-card\s*\{[^}]*width\s*:\s*100%[^}]*height\s*:\s*auto[^}]*min-height\s*:\s*0/s);
  assert.match(unifiedMobile, /#savingsView \.savings-insight-card\s*\{[^}]*overflow\s*:\s*visible/s);
});

test('evaluation cycle 1: phone Savings goals use natural page flow without a nested scrollbar', () => {
  const visualizationMarker = css.indexOf('/* Savings visual system:');
  const visualizationMobileStart = css.indexOf('@media (max-width:1024px)', visualizationMarker);
  const visualizationMobileEnd = css.indexOf('@media (max-width:414px)', visualizationMobileStart);
  const visualizationMobile = css.slice(visualizationMobileStart, visualizationMobileEnd);
  const phoneStart = css.indexOf('@media (max-width:414px)', visualizationMarker);
  assert.ok(phoneStart >= 0, 'a phone-specific Savings repair exists');
  const phone = css.slice(phoneStart, css.indexOf('[data-theme="dark"]', phoneStart));
  const panel = rule(phone, '#savingsView > .goal-buckets-panel');
  const grid = rule(phone, '#savingsView .goal-bucket-grid');
  const card = rule(phone, '#savingsView .goal-bucket-card');

  assert.match(panel, /display\s*:\s*block/);
  assert.match(panel, /min-height\s*:\s*0/);
  assert.match(panel, /overflow\s*:\s*visible/);
  assert.match(grid, /min-height\s*:\s*0/);
  assert.match(grid, /max-height\s*:\s*none/);
  assert.match(grid, /overflow-x\s*:\s*visible/);
  assert.match(grid, /overflow-y\s*:\s*visible/);
  assert.match(grid, /grid-auto-rows\s*:\s*auto/);
  assert.match(grid, /padding\s*:\s*0 0 calc\(4px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(grid, /touch-action\s*:\s*auto/);
  assert.match(grid, /scrollbar-width\s*:\s*none/);
  assert.match(card, /flex-shrink\s*:\s*0/);
  assert.match(card, /padding\s*:\s*8px 9px/);
  assert.match(visualizationMobile, /#savingsView\s*\{[^}]*padding-bottom\s*:\s*40px/, 'mobile Savings reserves a safe zone for the floating assistant');
  assert.match(css, /@media \(max-width:1024px\) \{[\s\S]*?body:has\(#savingsView:not\(\[hidden\]\)\) \.assistant-fab \{[^}]*position:absolute/, 'touch layouts dock the Savings assistant after the content instead of covering goal actions');
  assert.match(html, /id="goalBucketGrid"[^>]*tabindex="0"[^>]*aria-labelledby="savingsGoalsHeading"/);
});

test('evaluation cycle 1: laptop-height Savings progressively discloses secondary copy before controls are clipped', () => {
  const compactBlocks = [...css.matchAll(/@media \(max-height:820px\) and \(min-width:(?:801|1025)px\) \{([\s\S]*?)(?=\n@media|$)/g)]
    .map(match => match[1]);
  const unifiedMarker = css.indexOf('/* Unified Savings recommendation');
  const unifiedCompactStart = css.indexOf('@media (min-width:1025px) and (max-height:820px)', unifiedMarker);
  const unifiedCompactEnd = css.indexOf('@media (max-width:1024px)', unifiedCompactStart);
  const unifiedCompact = css.slice(unifiedCompactStart, unifiedCompactEnd);

  assert.ok(compactBlocks.length, 'a compact desktop-height override exists');
  assert.ok(
    compactBlocks.some(block => /#savingsView\s+\.savings-milestones\s*\{[^}]*display\s*:\s*none/.test(block)),
    'secondary milestone labels are disclosed elsewhere before they consume the laptop-height canvas'
  );
  assert.match(unifiedCompact, /#savingsView \.savings-hero,\s*#savingsView \.savings-insight-card\s*\{[^}]*padding\s*:\s*16px 20px/s, 'both top cards compact symmetrically at laptop height');
  assert.doesNotMatch(unifiedCompact, /#savingsView \.recommendation-weekly\s*\{[^}]*(?:display\s*:\s*none|visibility\s*:\s*hidden)/, 'the inline weekly insight remains visible');
  assert.ok(
    compactBlocks.some(block => /#savingsView\s+\.rich-goal-card\s*\{[^}]*padding\s*:\s*9px/.test(block)),
    'goal cards use compact laptop padding so the roundup row remains visible'
  );
  assert.ok(
    compactBlocks.some(block => /#savingsView\s+\.roundup-toggle\s*\{[^}]*min-height\s*:\s*36px/.test(block)),
    'the compact laptop roundup remains present and usable'
  );
  assert.doesNotMatch(css, /#savingsView\s+\.roundup-toggle\s*\{[^}]*(?:display\s*:\s*none|visibility\s*:\s*hidden)/);
});
