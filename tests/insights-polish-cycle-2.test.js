'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'insights-polish.css'), 'utf8');

test('Summary is four equal desktop cards, two on tablet, one on phones', () => {
  assert.match(css, /#insightsView > \.insights-kpis \{[^}]*display:grid;[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\);[^}]*align-items:stretch;/);
  assert.match(css, /@media \(max-width:1024px\) \{[\s\S]*?\.insights-kpis \{ grid-template-columns:repeat\(2,minmax\(0,1fr\)\);/);
  assert.match(css, /@media \(max-width:600px\) \{[\s\S]*?\.insights-kpis \{ grid-template-columns:minmax\(0,1fr\);/);
  assert.match(css, /\.insights-kpis > \.summary-card \{[^}]*min-width:0;[^}]*min-height:0;/);
});

test('Analysis fills three equal desktop columns, yielding to natural single-column tablet/mobile flow', () => {
  assert.match(css, /#insightsView > \.advanced-insights-grid \{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\);[^}]*gap:24px;/);
  assert.match(css, /@media \(max-width:1024px\) \{[\s\S]*?\.advanced-insights-grid \{ grid-template-columns:minmax\(0,1fr\);/);
  assert.match(css, /@media \(min-width:1025px\) and \(max-height:800px\)/);
  assert.doesNotMatch(css, /overflow(?:-y|-x)?:\s*(?:auto|scroll)/, 'presentation changes do not introduce nested card scroll surfaces');
});

test('Compact gauge retains its aspect ratio, readable percentage, and no ellipsis', () => {
  assert.match(css, /\.insights-rate-summary \.savings-gauge \{[^}]*width:min\(100%,144px\);[^}]*aspect-ratio:2 \/ 1;/);
  assert.match(css, /\.savings-gauge strong \{[^}]*font-size:clamp\([^}]*overflow:visible;[^}]*text-overflow:clip;[^}]*white-space:nowrap;/);
  assert.match(css, /\.insight-caption span \{ white-space:normal; overflow-wrap:anywhere;/);
  assert.doesNotMatch(css, /(?:html|body|#appShell)\s*\{/, 'Insights polish remains scoped to the Insights module');
});
