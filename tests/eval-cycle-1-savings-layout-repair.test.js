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
  const goalCard = rule(desktop, '#savingsView .goal-bucket-card');
  const weekly = rule(css, '.weekly-review-card');

  assert.match(stack, /min-height\s*:\s*0/);
  assert.match(stack, /grid-template-rows\s*:\s*minmax\(0\s*,\s*1fr\)\s+auto/);
  assert.doesNotMatch(recommendation, /overflow(?:-y)?\s*:\s*hidden/, 'recommendation actions must not be hard-clipped');
  assert.doesNotMatch(goalCard, /overflow(?:-y)?\s*:\s*hidden/, 'goal controls must not be hard-clipped');
  assert.match(goalCard, /height\s*:\s*auto/);
  assert.match(weekly, /padding\s*:\s*(?:1[012]|[0-9])px\s+(?:1[0-4]|[0-9])px/);

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

test('evaluation cycle 1: phone Savings goals use a bounded touch-scroll window with safe trailing space', () => {
  const phoneStart = css.lastIndexOf('@media (max-width:414px)');
  assert.ok(phoneStart >= 0, 'a phone-specific Savings repair exists');
  const phone = css.slice(phoneStart, css.indexOf('/* Profile-isolated', phoneStart));
  const panel = rule(phone, '#savingsView > .goal-buckets-panel');
  const grid = rule(phone, '#savingsView .goal-bucket-grid');
  const card = rule(phone, '#savingsView .goal-bucket-card');

  assert.match(panel, /display\s*:\s*flex/);
  assert.match(panel, /min-height\s*:\s*0/);
  assert.match(panel, /overflow\s*:\s*hidden/);
  assert.match(grid, /min-height\s*:\s*0/);
  assert.match(grid, /max-height\s*:\s*min\(62dvh\s*,\s*560px\)/);
  assert.match(grid, /overflow-y\s*:\s*auto/);
  assert.match(grid, /grid-auto-rows\s*:\s*max-content/);
  assert.match(grid, /padding\s*:\s*0 5px calc\(24px \+ env\(safe-area-inset-bottom\)\) 0/);
  assert.match(grid, /touch-action\s*:\s*pan-y/);
  assert.match(card, /flex-shrink\s*:\s*0/);
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
