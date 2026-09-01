const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const MerCore = require('../core.js');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

test('evaluation cycle 2: Activity paginates filtered records in immutable groups of eight', () => {
  const source = Array.from({ length:21 }, (_, index) => ({ id:`tx-${index + 1}` }));
  const snapshot = JSON.stringify(source);
  const first = MerCore.paginateItems(source, 1);
  const second = MerCore.paginateItems(source, 2);
  const last = MerCore.paginateItems(source, 99);

  assert.equal(first.pageSize, 8);
  assert.equal(first.totalPages, 3);
  assert.deepEqual(first.items.map(item=>item.id), source.slice(0, 8).map(item=>item.id));
  assert.deepEqual(second.items.map(item=>item.id), source.slice(8, 16).map(item=>item.id));
  assert.equal(last.page, 3, 'out-of-range pages clamp after deleting or filtering records');
  assert.deepEqual(last.items.map(item=>item.id), source.slice(16).map(item=>item.id));
  assert.equal(JSON.stringify(source), snapshot, 'pagination never mutates global profile transactions');
});

test('evaluation cycle 2: Activity pagination fails soft for empty and malformed inputs', () => {
  assert.deepEqual(MerCore.paginateItems(null, -10), {
    items:[], page:1, pageSize:8, totalItems:0, totalPages:1, startIndex:0, endIndex:0
  });
  const fallback = MerCore.paginateItems([1, 2, 3], 'bad', 0);
  assert.equal(fallback.page, 1);
  assert.equal(fallback.pageSize, 8);
  assert.deepEqual(fallback.items, [1, 2, 3]);
});

test('evaluation cycle 2: Activity exposes accessible page and continuous-scroll controls', () => {
  assert.match(index, /id="activityPagesMode"[^>]+data-activity-view-mode="pages"[^>]+aria-pressed="true"/);
  assert.match(index, /id="activityContinuousMode"[^>]+data-activity-view-mode="continuous"[^>]+aria-pressed="false"/);
  assert.match(index, /Prikaži sve \(Kontinuirani scroll\)/);
  assert.match(index, /id="activityPreviousPage"[^>]+data-i18n="previousPage">Prethodna/);
  assert.match(index, /id="activityPageNumbers"/);
  assert.match(index, /id="activityNextPage"[^>]+data-i18n="nextPage">Sljedeća/);
  assert.match(index, /id="activityPagination"[^>]+data-i18n-aria="activityPagination"/);
});

test('evaluation cycle 2: filtered results feed either the current page or continuous list', () => {
  assert.match(app, /const ACTIVITY_PAGE_SIZE = 8;/);
  assert.match(app, /const pagination=MerCore\.paginateItems\(filtered,activityPage,ACTIVITY_PAGE_SIZE\);/);
  assert.match(app, /const visibleTransactions=activityViewMode==='continuous'\?filtered:pagination\.items;/);
  assert.match(app, /\$\('#transactionList'\)\.innerHTML = visibleTransactions\.map/);
  assert.match(app, /function renderActivityFromFirstPage\(\)\{activityPage=1;renderActivity\(\);\}/);
  assert.match(app, /activityReviewOnly=false;activityPage=1;processDueRecurring/);
  assert.match(app, /max-width: 520px/);
  assert.match(app, /activityPageNumbers \[aria-current="page"\][\s\S]*?focus/);
});

test('evaluation cycle 2: pagination remains touch-friendly and responsive', () => {
  assert.match(styles, /\.activity-view-switcher button \{[\s\S]*?white-space:nowrap;/);
  assert.match(styles, /\.activity-pagination \{[\s\S]*?justify-content:center;/);
  assert.match(styles, /@media \(max-width:767px\)[\s\S]*?\.activity-view-toolbar \{ align-items:stretch; flex-direction:column;/);
  assert.match(styles, /\.activity-page-button \{ min-width:36px; min-height:44px; \}/);
});
