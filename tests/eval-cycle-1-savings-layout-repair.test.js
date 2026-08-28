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

test('evaluation cycle 1: Savings preserves a predictable hero, side stack, weekly review, and goals hierarchy', () => {
  const savings = savingsMarkup();
  const layout = savings.indexOf('class="savings-layout"');
  const hero = savings.indexOf('class="panel savings-hero"', layout);
  const stack = savings.indexOf('class="savings-side-stack"', hero);
  const recommendation = savings.indexOf('class="panel recommendation-panel"', stack);
  const weekly = savings.indexOf('class="panel weekly-review-card"', recommendation);
  const goals = savings.indexOf('class="panel goal-buckets-panel"', weekly);

  assert.ok(layout >= 0 && hero > layout && stack > hero, 'hero and side stack remain siblings in Savings');
  assert.ok(recommendation > stack && weekly > recommendation, 'Weekly Review follows MER recommendation in the side stack');
  assert.ok(goals > weekly, 'goal targets remain a separate lower panel');
  assert.match(savings, /weekly-review-card[\s\S]*?id="openPlan"/);
  assert.match(savings, /recommendation-panel[\s\S]*?data-open-assessment/);
  assert.match(savings, /goal-buckets-panel[\s\S]*?id="goalBucketGrid"/);
});

test('evaluation cycle 1: fixed desktop Savings contains nested grids without clipping interactive card content', () => {
  const repairMarker = css.indexOf('/* Savings occupies');
  const desktopStart = css.indexOf('@media (min-width:1025px)', repairMarker);
  const desktopEnd = css.indexOf('@media (min-width:1025px) and', desktopStart);
  assert.ok(repairMarker >= 0 && desktopStart > repairMarker && desktopEnd > desktopStart, 'a bounded desktop Savings override exists');
  const desktop = css.slice(desktopStart, desktopEnd);
  const stack = rule(desktop, '#savingsView .savings-side-stack');
  const recommendation = rule(desktop, '#savingsView .recommendation-panel');
  const goalsPanel = rule(desktop, '#savingsView > .goal-buckets-panel');
  const goalsGrid = rule(desktop, '#savingsView .goal-bucket-grid');
  const goalCard = rule(desktop, '#savingsView .goal-bucket-card');
  const compactDesktop = css.slice(css.lastIndexOf('@media (min-width:1025px) {'));
  const savingsLayout = rule(compactDesktop, '#savingsView > .savings-layout');
  const compactHero = rule(compactDesktop, '#savingsView .savings-hero');
  const compactStack = rule(compactDesktop, '#savingsView .savings-side-stack');
  const weekly = rule(css, '.weekly-review-card');

  assert.match(stack, /min-height\s*:\s*0/);
  assert.match(stack, /display\s*:\s*flex/);
  assert.match(stack, /flex-direction\s*:\s*column/);
  assert.match(stack, /justify-content\s*:\s*space-between/);
  assert.doesNotMatch(recommendation, /overflow(?:-y)?\s*:\s*hidden/, 'recommendation actions must not be hard-clipped');
  assert.match(goalsPanel, /overflow\s*:\s*visible/, 'the goals panel must not clip its cards');
  assert.match(goalsGrid, /overflow\s*:\s*visible/, 'the goals grid must not own a nested scrollbar');
  assert.match(goalsGrid, /grid-template-columns\s*:\s*repeat\(auto-fit\s*,\s*minmax\(170px\s*,\s*1fr\)\)/, 'desktop goals fit one adaptive row before creating another');
  assert.doesNotMatch(goalCard, /overflow(?:-y)?\s*:\s*hidden/, 'goal controls must not be hard-clipped');
  assert.match(goalCard, /height\s*:\s*auto/);
  assert.match(savingsLayout, /align-items\s*:\s*stretch/, 'both top columns must share an exact bottom edge');
  assert.match(compactHero, /height\s*:\s*100%/);
  assert.match(compactHero, /align-self\s*:\s*stretch/);
  assert.match(compactHero, /justify-content\s*:\s*space-between/);
  assert.match(compactHero, /padding\s*:\s*16px 18px/);
  assert.match(compactStack, /height\s*:\s*100%/);
  assert.match(weekly, /padding\s*:\s*(?:1[012]|[0-9])px\s+(?:1[0-4]|[0-9])px/);
  assert.match(css, /@media \(min-width:1025px\) and \(max-width:1200px\) \{[\s\S]*?weekly-review-card \.link-button \{[^}]*width:44px[^}]*min-width:44px/s, 'narrow desktop keeps the weekly action compact without removing its accessible label');
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
  const mobileStart = css.lastIndexOf('@media (max-width:1024px)');
  assert.ok(mobileStart >= 0, 'mobile Savings override exists');
  const mobile = css.slice(mobileStart);

  assert.match(mobile, /#savingsView\s*\{[^}]*display\s*:\s*block[^}]*height\s*:\s*auto[^}]*overflow\s*:\s*visible/s);
  assert.match(mobile, /#savingsView\s+\.savings-hero,[\s\S]*?#savingsView\s+>\s+\.goal-buckets-panel\s*\{[^}]*height\s*:\s*auto[^}]*overflow\s*:\s*visible/s);
  assert.match(mobile, /#savingsView\s+\.goal-bucket-grid\s*\{[^}]*overflow\s*:\s*visible[^}]*grid-auto-rows\s*:\s*auto/s);
  assert.match(mobile, /#savingsView\s+\.goal-bucket-card\s*\{[^}]*height\s*:\s*auto[^}]*overflow\s*:\s*visible/s);
});

test('evaluation cycle 1: phone Savings goals use natural page flow without a nested scrollbar', () => {
  const phoneStart = css.lastIndexOf('@media (max-width:414px)');
  assert.ok(phoneStart >= 0, 'a phone-specific Savings repair exists');
  const phone = css.slice(phoneStart, css.indexOf('/* Profile-isolated', phoneStart));
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
  assert.match(css.slice(css.lastIndexOf('@media (max-width:1024px)')), /#savingsView\s*\{[^}]*padding-bottom\s*:\s*40px/, 'mobile Savings reserves a safe zone for the floating assistant');
  assert.match(css, /@media \(max-width:1024px\) \{[\s\S]*?body:has\(#savingsView:not\(\[hidden\]\)\) \.assistant-fab \{[^}]*position:absolute/, 'touch layouts dock the Savings assistant after the content instead of covering goal actions');
  assert.match(html, /id="goalBucketGrid"[^>]*tabindex="0"[^>]*aria-labelledby="savingsGoalsHeading"/);
});

test('evaluation cycle 1: laptop-height Savings progressively discloses secondary copy before controls are clipped', () => {
  const compactBlocks = [...css.matchAll(/@media \(max-height:820px\) and \(min-width:(?:801|1025)px\) \{([\s\S]*?)(?=\n@media|$)/g)]
    .map(match => match[1]);

  assert.ok(compactBlocks.length, 'a compact desktop-height override exists');
  assert.ok(
    compactBlocks.some(block => /#savingsView\s+\.savings-milestones\s*\{[^}]*display\s*:\s*none/.test(block)),
    'secondary milestone labels are disclosed elsewhere before they consume the laptop-height canvas'
  );
  assert.ok(
    compactBlocks.some(block => /#savingsView\s+\.recommendation-panel\s*>\s*p:not\(\.overline\)\s*\{[^}]*display\s*:\s*none/.test(block)),
    'secondary recommendation copy is disclosed elsewhere before the strategy action is clipped'
  );
});
