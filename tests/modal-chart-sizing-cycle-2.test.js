'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync(require.resolve('../insight-refinement.css'),'utf8');
const forecastCss=fs.readFileSync(require.resolve('../enterprise.css'),'utf8');

test('detailed chart sizing overrides are scoped to modal content and release obsolete viewport minima',()=>{
  const scoped=css.slice(css.indexOf('/* Detailed reports use their content height'));
  assert.match(scoped,/dialog#insightChartModal\[open\]\{[^}]*height:fit-content;block-size:fit-content;min-height:0;min-block-size:0;max-height:calc\(100dvh - 32px\)/,'content reports override physical and logical native-dialog stretching');
  assert.match(scoped,/#insightChartModal>#insightExpandedChart\{[^}]*flex:1 1 0/);
  assert.match(scoped,/\.insight-plot-window>\.insight-trend-svg\{[^}]*height:100%;min-height:0;max-height:none/);
  assert.match(scoped,/\.expanded-month-bars\{height:auto;min-height:0;flex:1 1 0/);
  assert.match(scoped,/grid-template-rows:minmax\(110px,1fr\) auto/);
  assert.match(scoped,/:has\(#insightExpandedChart>\.notification-empty\)\[open\]\{height:fit-content;block-size:fit-content\}/,'empty reports shrink around their message and retained category context');
  assert.match(scoped,/height:min\(780px,calc\(100dvh - 32px\)\);block-size:min\(780px,calc\(100dvh - 32px\)\)/,'canvas exceptions retain an explicit physical and logical height');
  assert.doesNotMatch(scoped,/#insightsView|\.summary-card|\.advanced-insights-grid/,'dashboard chart/card sizing remains untouched');
});

test('cash-flow modal allocates spare body space to its chart rather than an auto footer margin',()=>{
  const scoped=forecastCss.slice(forecastCss.indexOf('/* The plot owns the available body height'));
  assert.match(scoped,/dialog#intelligenceModal\[open\]\{[^}]*min-height:0/);
  assert.match(scoped,/\.enterprise-dialog-body\{[^}]*flex:1 1 0;min-height:0/);
  assert.match(scoped,/\.forecast-chart>svg\{flex:1 1 0;min-height:120px;max-height:none/);
  assert.match(scoped,/>\.enterprise-footer\{margin-top:0/);
});
