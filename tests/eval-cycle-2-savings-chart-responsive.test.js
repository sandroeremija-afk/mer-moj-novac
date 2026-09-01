'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const marker = css.indexOf('/* Savings visual system:');
assert.ok(marker >= 0, 'final savings visualization layer exists');
const finalCss = css.slice(marker);

function media(startToken, nextToken) {
  const start = finalCss.indexOf(startToken);
  assert.ok(start >= 0, `${startToken} exists`);
  const end = nextToken ? finalCss.indexOf(nextToken, start + startToken.length) : finalCss.length;
  return finalCss.slice(start, end < 0 ? finalCss.length : end);
}

test('evaluation cycle 2: laptop and desktop charts fill their bounded card without nested scrolling', () => {
  const desktop = media('@media (min-width:1025px) {', '@media (min-width:1025px) and (max-height:820px)');
  assert.match(desktop, /grid-template-columns:minmax\(360px,\.98fr\) minmax\(0,1\.36fr\)/);
  assert.match(desktop, /grid-template-rows:auto clamp\(200px,26dvh,224px\) minmax\(0,1fr\)/);
  assert.match(desktop, /#savingsView > \.savings-history-card \{[^}]*height:100%[^}]*overflow:hidden/);
  assert.match(desktop, /#savingsView \.savings-area-chart,[\s\S]*?min-height:112px/);
  assert.match(desktop, /#savingsView \.goal-bucket-grid \{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)[^}]*overflow:visible/);
  assert.doesNotMatch(desktop, /goal-bucket-grid[^}]*overflow-y:(?:auto|scroll)/);
});

test('evaluation cycle 2: 1366 by 768 compacts chart and goals without removing their information', () => {
  const compact = media('@media (min-width:1025px) and (max-height:820px)', '@media (max-width:1024px)');
  assert.match(compact, /grid-template-rows:auto clamp\(184px,24dvh,198px\) minmax\(0,1fr\)/);
  assert.match(compact, /#savingsView \.savings-area-chart,[\s\S]*?min-height:94px/);
  assert.match(compact, /#savingsView \.goal-progress-ring \{ width:36px; height:36px/);
  assert.doesNotMatch(compact, /(?:goal-metric-grid|roundup-toggle)[^}]*display:none/);
});

test('evaluation cycle 2: 375 and 414 layouts keep chart labels, tooltips and goals visible', () => {
  const tablet = media('@media (max-width:1024px)', '@media (max-width:414px)');
  const phone = media('@media (max-width:414px)', '[data-theme="dark"]');
  assert.match(tablet, /#savingsView \{[^}]*display:block[^}]*height:auto[^}]*overflow:visible/);
  assert.match(tablet, /goal-bucket-grid[^}]*max-height:none[^}]*overflow-y:visible/);
  assert.match(phone, /goal-bucket-grid[^}]*overflow-y:visible/);
  assert.match(phone, /savings-chart-point \{ width:44px; height:44px/);
  assert.match(phone, /savings-chart-axis \.axis-label-optional \{ visibility:hidden/);
  assert.match(phone, /savings-chart-tooltip \{ max-width:124px/);
  assert.doesNotMatch(phone, /(?:savings-area-chart|goal-bucket-grid)[^}]*overflow-y:(?:auto|scroll)/);
});

test('evaluation cycle 2: graph and ring motion respects reduced-motion preferences', () => {
  assert.match(finalCss, /@media \(prefers-reduced-motion:reduce\)[\s\S]*?#savingsView \.savings-area-line,[\s\S]*?#savingsView \.goal-ring-value,[\s\S]*?transition:none/);
});

