'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const polish = read('insights-polish.css');
const density = read('layout-density.css');

function rule(css, selector) {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const match = blocks.findLast(block => block[1].trim() === selector);
  assert.ok(match, `Missing rule: ${selector}`);
  return match[2];
}

test('savings rate arc has a definite half-circle canvas and explicitly positioned layers', () => {
  const gauge = rule(density, '#insightsView .insights-rate-summary .savings-gauge');
  assert.match(gauge, /width:128px;\s*height:64px;\s*min-height:64px;\s*flex:0 0 auto/);
  const arc = rule(polish, '#insightsView .insights-rate-summary .savings-gauge::before');
  assert.match(arc, /inset:0 auto auto 0/);
  assert.match(arc, /width:100%;\s*height:200%;\s*aspect-ratio:auto/);
  const hole = rule(polish, '#insightsView .insights-rate-summary .savings-gauge::after');
  assert.match(hole, /inset:26% auto auto 13%/);
  assert.match(hole, /width:74%;\s*height:148%;\s*aspect-ratio:auto/);
  // A 2:1 clipping box produces two concentric circles with a visible 13% ring.
  const width = 128, height = 64;
  assert.equal(width, height * 2);
  assert.equal(width * .74, height * 1.48);
  assert.equal(width * .13, height * .26);
  assert.ok(width * .13 > 10);
});

test('larger category chart scales proportionally without increasing phone section height unnecessarily', () => {
  assert.match(density, /#insightsView #categoryDonut \{ width:clamp\(170px,calc\(25dvh - 10px\),230px\); height:auto; aspect-ratio:1; max-height:none; \}/);
  assert.match(density, /#insightsView #categoryDonut::before \{ inset:14%; \}/);
  const phone = density.slice(density.lastIndexOf('@media (max-width:700px)'));
  assert.match(phone, /\.donut-layout \{ grid-template-columns:176px minmax\(0,1fr\); gap:10px/);
  assert.match(phone, /#categoryDonut \{ width:176px; \}/);
  assert.doesNotMatch(rule(polish, '#insightsView .insights-rate-summary .savings-gauge::before'), /background:/, 'Keep the reactive conic-gradient and current savings rate');
  assert.match(read('app.js'), /setProperty\('--gauge-value',`\$\{gaugePercent\*1\.8\}deg`\)/);
});

test('short desktop donut card recovers spacing while retaining its larger chart and all labels', () => {
  const compact = density.match(/@media \(min-width:1201px\) and \(max-height:800px\) \{([\s\S]*?)\n\}/)?.[1];
  assert.ok(compact, 'The 720px desktop height needs its own spacing budget');
  assert.match(compact, /\.donut-card \{ padding:12px; gap:4px; \}/);
  assert.match(compact, /\.donut-layout \{ gap:8px; \}/);
  assert.match(compact, /\.insight-caption \{ margin-top:0; padding-top:6px; \}/);
  assert.doesNotMatch(compact, /display:none|overflow:hidden|font-size|height:/, 'Keep chart dimensions, readable text and every data label');
  const recoveredSpace = (16 - 12) * 2 + (8 - 4) * 2 + (14 - 8) + (4 - 0) + (8 - 6);
  assert.ok(recoveredSpace >= 28, 'At least 28px is returned to the 720px viewport');
});
