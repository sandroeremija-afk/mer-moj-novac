'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=file=>fs.readFileSync(require.resolve('../'+file),'utf8');
const source=read('savings-minimal.js'),css=read('savings-minimal.css');
test('Summary cards are keyboard accessible and never intercept layout drags',()=>{
  assert.match(source,/setAttribute\('role', 'button'\)/);assert.match(source,/setAttribute\('aria-haspopup', 'dialog'\)/);
  assert.match(source,/\['Enter', ' '\]\.includes\(event.key\)/);assert.match(source,/classList.contains\('layout-editing'\)/);
  assert.match(source,/renderAggregate\(s\)/);assert.doesNotMatch(source,/'#savingsView \.savings-hero'\), 'goal'/);
  assert.match(source,/'#goalBucketGrid \.goal-bucket-card'/);assert.match(source,/card.contains\(selection.anchorNode\)/);
});
test('Details preserve shared node IDs and bridge back to real edit, deposit and automation forms',()=>{
  assert.match(source,/historyBody.append\(kpis\)/);assert.match(source,/historyBody.prepend\(summary\)/);
  assert.match(source,/\.before\(weekly\)/);assert.match(source,/bridge\(\).openGoalEditor\(goalId\)/);assert.match(source,/bridge\(\).openDeposit\(goalId\)/);
  assert.match(source,/MerVaultsUI\?\.open\('automation', goalId\)/);assert.doesNotMatch(source,/localStorage|reactiveStore\.update|\.mutate\(/);
  assert.match(read('premium.js'),/MerSavingsMinimal\?\.refresh\(\)/);
});
test('History trend has explicit localized context and decorative summary arrows stay out of accessibility names',()=>{
  assert.match(source,/row.append\(label, trend\)/);
  assert.match(source,/trendLabel.textContent = say\('U odnosu na prethodni mjesec', 'Compared with the previous month'\)/);
  assert.match(source,/hint.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(source,/card.setAttribute\('aria-label', label\)/);
});
test('Relocated weekly insight remains visible in strategy dialog nested inside Savings view',()=>{
  assert.match(css,/#savingsView #savingsRecommendationCard \.recommendation-weekly,/);
  assert.doesNotMatch(css,/#savingsView \.recommendation-weekly,/);
  assert.match(css,/#savingsStrategyModal \.recommendation-weekly \{/);
});
test('Detail dialogs share safe backdrop, Escape, current profile validation and clean close lifecycle',()=>{
  assert.match(source,/bindDialogBackdropDismiss\(dialog, \(\) => close\(dialog\)\)/);
  assert.match(source,/addEventListener\('cancel'/);assert.match(source,/addEventListener\('close'/);
  assert.match(source,/if \(!sameOwner\(s, owner\)\) \{ close\(active\); return; \}/);
  assert.match(source,/sameOwner\(snapshot\(\), owner\)/);assert.match(source,/bridge\(\).openModal\(active\)/);
});
test('Savings cards hide granular controls only in summary; dialogs own bounded list scroll and stable footer',()=>{
  assert.match(css,/#savingsView \.goal-metric-grid/);assert.match(css,/#savingsView \.roundup-toggle/);
  assert.match(css,/max-height:90dvh/);assert.match(css,/\.savings-detail-body \{ min-height:0; overflow:auto;/);
  assert.match(css,/\.savings-detail-header,\.savings-detail-footer \{[^}]*flex:0 0 auto/);
  assert.match(css,/@media\(max-width:560px\)/);assert.match(css,/\.goal-bucket-grid \{ grid-template-columns:1fr;/);
  assert.match(css,/font-size:24px/);assert.match(css,/min-height:44px/);assert.match(css,/scrollbar-color:var\(--mer-scrollbar-thumb/);
});
