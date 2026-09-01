const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('evaluation cycle 2: Details uses a capped card with one bounded internal scroll window', () => {
  assert.match(css, /\.modal \{[^}]*max-height:min\(90dvh,calc\(100dvh - 24px\)\)[^}]*overflow:hidden/s);
  assert.match(css, /\.detail-modal\[open\] \{[^}]*display:flex[^}]*flex-direction:column[^}]*overflow:hidden/s);
  assert.match(css, /\.detail-modal-grid \{[^}]*min-height:0[^}]*display:grid[^}]*flex:1 1 auto[^}]*overflow-x:hidden[^}]*overflow-y:auto[^}]*overscroll-behavior:contain[^}]*scrollbar-gutter:stable/s);
  assert.match(css, /\.detail-modal-grid::\-webkit-scrollbar-thumb \{[^}]*background:var\(--line-strong\)/s);
});

test('evaluation cycle 2: 375, 414 and 768 pixel layouts collapse Details and contain its chart', () => {
  assert.match(css, /@media \(max-width:768px\) \{[\s\S]*?\.detail-modal \{[^}]*width:calc\(100vw - 16px\)[^}]*max-height:90dvh[^}]*padding:54px 14px/);
  assert.match(css, /@media \(max-width:768px\) \{[\s\S]*?\.detail-modal-grid,[\s\S]*?\.overview-detail-grid \{ grid-template-columns:minmax\(0,1fr\); \}/);
  assert.match(css, /\.overview-detail-grid \.panel-heading,[\s\S]*?\.overview-detail-grid \.legend \{ flex-wrap:wrap; \}/);
  assert.match(css, /\.overview-detail-grid \.line-chart svg \{ width:100%; max-width:100%; height:auto; \}/);
});

test('evaluation cycle 2: Dashboard Details keeps every chart and final action inside the scroll region', () => {
  const start = html.indexOf('id="overviewDetailsModal"');
  const end = html.indexOf('</dialog>', start);
  const modal = html.slice(start, end);
  assert.ok(start >= 0);
  assert.match(modal, /class="detail-modal-grid overview-detail-grid"/);
  assert.match(modal, /class="panel chart-panel"[\s\S]*class="line-chart"/);
  assert.match(modal, /class="panel goal-panel"[\s\S]*data-open-savings/);
  assert.match(modal, /class="panel upcoming-panel"[\s\S]*data-detail-route="activity"[^>]*data-clear-activity-filters/);
});
