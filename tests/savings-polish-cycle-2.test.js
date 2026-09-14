'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync(require.resolve('../savings-minimal.css'),'utf8'),source=fs.readFileSync(require.resolve('../savings-minimal.js'),'utf8');
test('Cycle 2: MER recommendation has restrained theme-aware brand tint and unchanged live metrics',()=>{
  assert.match(css,/#savingsView #savingsRecommendationCard \{[^}]*background:linear-gradient\(135deg,color-mix\(in srgb,var\(--green\) 10%/);
  assert.match(css,/\[data-theme="dark"\] #savingsView #savingsRecommendationCard \{[^}]*background:linear-gradient/);
  assert.match(source,/coverageLabel.textContent = say\('Pokrivenost', 'Coverage'\)/);
});
test('Cycle 2: chart controls are visible, keyboard reachable and independent from card detail navigation',()=>{
  assert.doesNotMatch(css,/#savingsView \.savings-chart-(?:points|tooltip),/);
  assert.match(css,/savings-chart-tooltip\[hidden\] \{ display:none/);
  assert.match(css,/savings-chart-tooltip \{[^}]*font-size:12px[^}]*transform:none/);
  assert.match(css,/touch-action:pan-y/);assert.match(css,/savings-chart-point \{ width:44px; height:44px/);
  assert.match(css,/\.balances-hidden #savingsChartTooltip,\.enterprise-stealth #savingsChartTooltip \{ filter:blur\(7px\)/);
  assert.match(source,/contributionChart'\)\?\.setAttribute\('tabindex', '0'\)/);
  assert.match(source,/closest\('button,a,input,select,textarea,\.layout-drag-handle,#contributionChart'\)/);
  assert.match(source,/card.setAttribute\('role', 'group'\)/);assert.match(source,/doc.createElement\(kind === 'history' \? 'button' : 'span'\)/);
});
test('Cycle 2: goal progress badge is larger and generic title glyphs do not duplicate it',()=>{
  assert.match(css,/goal-progress-ring \{ width:64px; height:64px; flex-basis:64px/);
  assert.match(css,/goal-progress-ring span \{ font-size:16px/);
  assert.match(css,/rich-goal-card \.goal-bucket-head \{ grid-template-columns:64px minmax\(0,1fr\)/);
  assert.match(source,/icon\.textContent\.trim\(\)\)\) icon\.remove\(\)/);
  assert.doesNotMatch(source,/goal\.icon\s*=/,'custom icons remain stored and available in goal details/editor');
});
test('Cycle 2: strategy reparents live nodes into a single scroll body between stationary header and footer',()=>{
  assert.match(source,/strategy\.prepend\(header, body\)/);assert.match(source,/actions\?\.classList\.add\('savings-strategy-footer'\)/);
  assert.match(source,/header\.append\(closeButton\)/);assert.match(source,/\.filter\(node => node !== actions\)\.forEach\(node => body\.append\(node\)\)/);
  assert.match(css,/#savingsStrategyModal\.modal\[open\] \{[^}]*max-height:90dvh[^}]*overflow:hidden/);
  assert.match(css,/savings-strategy-body \{[^}]*min-height:0[^}]*overflow-y:auto[^}]*scrollbar-width:thin/);
  assert.match(css,/savings-strategy-footer \{[^}]*flex:0 0 auto[^}]*safe-area-inset-bottom/);
  assert.match(css,/savings-strategy-header \.modal-close \{ position:static[^}]*width:44px; height:44px/);
  assert.match(css,/@media\(max-width:560px\)[\s\S]*savings-strategy-body \{ padding:16px 16px 20px/);
});
test('Cycle 2: relocated strategy insight resets old icon grid tracks and scoped typography',()=>{
  assert.match(css,/#savingsStrategyModal \.recommendation-weekly \{ display:block; width:100%; min-width:0/);
  assert.match(css,/#savingsView #savingsStrategyModal \.weekly-review-copy p \{[^}]*font-size:14px[^}]*white-space:normal/);
  assert.match(css,/savings-strategy-summary > \.recommendation-icon \{ grid-area:auto; width:40px; height:40px/);
  assert.match(css,/savings-strategy-summary \{ grid-template-columns:40px minmax\(0,1fr\)/);
});
