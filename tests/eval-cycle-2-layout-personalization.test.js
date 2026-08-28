'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Layout = require('../layout-core.js');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'layout-ui.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) || null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
}

test('evaluation cycle 2: the top header exposes one localized accessible layout edit toggle', () => {
  assert.match(html, /id="layoutEditToggle"[^>]*aria-pressed="false"/);
  assert.match(html, /id="layoutEditToggle"[\s\S]*?data-i18n="customizeLayout"/);
  assert.equal((html.match(/data-layout-edit-toggle/g) || []).length, 1);
  for (const moduleId of ['overview','budgets','savings','activity','insights']) {
    const start = html.indexOf(`data-view-panel="${moduleId}"`);
    const next = html.indexOf('data-view-panel=', start + 1);
    const moduleMarkup = html.slice(start, next < 0 ? html.length : next);
    assert.equal((moduleMarkup.match(/data-layout-edit-toggle/g) || []).length, 0, `${moduleId} does not duplicate the global control`);
  }
  assert.match(html, /id="layoutLiveRegion"[^>]*aria-live="polite"/);
  assert.match(ui, /customizeLayout:'Prilagodi raspored'/);
  assert.match(ui, /finishLayout:'Završi prilagodbu'/);
  assert.match(ui, /const toggles = \$\$\('\[data-layout-edit-toggle\]'\)/);
  assert.match(ui, /function syncToggles\(\)[\s\S]*toggles\.forEach/);
  assert.match(ui, /toggle\.setAttribute\('aria-label', labelText\)/, 'icon-only responsive controls keep a localized accessible name');
  assert.match(ui, /toggles\.forEach\(toggle => toggle\.addEventListener\('click'/);
});

test('evaluation cycle 2: customizable cards cover Dashboard, Budgets, Savings and Insights', () => {
  const gridIds = [...html.matchAll(/data-layout-grid="([^"]+)"/g)].map(match => match[1]);
  for (const id of ['overview-summary','overview-dashboard','budgets-summary','savings-goals','insights-kpis','insights-analysis']) {
    assert.ok(gridIds.includes(id), `${id} is registered as a snapping grid`);
  }
  assert.ok((html.match(/data-layout-card=/g) || []).length >= 14);
  assert.match(fs.readFileSync(path.join(root, 'premium.js'), 'utf8'), /data-layout-card="goal-\$\{escapeHtml\(goal\.id\)\}"/);
});

test('evaluation cycle 2: mouse, touch and keyboard all have reordering paths', () => {
  assert.match(ui, /addEventListener\('dragstart'/);
  assert.match(ui, /addEventListener\('dragover'/);
  assert.match(ui, /addEventListener\('drop'/);
  assert.match(ui, /addEventListener\('pointerdown'/);
  assert.match(ui, /addEventListener\('pointermove'/);
  assert.match(ui, /addEventListener\('pointerup'/);
  assert.match(ui, /event\.altKey[\s\S]*ArrowLeft[\s\S]*ArrowRight[\s\S]*ArrowUp[\s\S]*ArrowDown/);
  assert.match(ui, /interactiveTarget\(event\.target\)/, 'interactive controls are not hijacked as drag handles');
  assert.match(ui, /layout-drag-handle/, 'touch reordering starts from a dedicated handle so the page remains scrollable');
  assert.match(ui, /interactiveTarget\(event\.target\) && !event\.target\.closest\?\.\('\.layout-drag-handle'\)/, 'nested controls keep their Alt + arrow behavior');
  assert.match(ui, /addEventListener\('pointercancel', cancelPointerDrag/);
  assert.match(ui, /addEventListener\('lostpointercapture', cancelPointerDrag/);
  assert.match(ui, /else if \(reordered\)[\s\S]*placeCards\(grid, initialOrder\)/, 'a cancelled touch gesture restores its original order');
  assert.match(css, /touch-action:pan-y/, 'cards preserve natural vertical touch scrolling');
  assert.match(css, /\.layout-drag-handle[\s\S]*touch-action:none/, 'only the explicit drag handle captures a touch gesture');
});

test('evaluation cycle 2: 375, 1024 and 1920 widths keep separate safe grid orders', () => {
  const storage = new MemoryStorage();
  const cards = ['one','two','three'];
  const personal = Layout.createLayoutStore({ storage, profileId:'alex-personal', moduleId:'overview', allowedCardIds:cards });
  personal.set(['three','one','two'], 375);
  personal.set(['two','three','one'], 1024);
  personal.set(['one','three','two'], 1920);
  assert.deepEqual(personal.get(375), ['three','one','two']);
  assert.deepEqual(personal.get(1024), ['two','three','one']);
  assert.deepEqual(personal.get(1920), ['one','three','two']);
  assert.equal(Layout.responsiveContext(375), 'mobile');
  assert.equal(Layout.responsiveContext(1024), 'tablet');
  assert.equal(Layout.responsiveContext(1920), 'wide');
});

test('evaluation cycle 2: Personal and Business persisted layouts cannot bleed', () => {
  const storage = new MemoryStorage();
  const cards = ['one','two','three'];
  const personal = Layout.createLayoutStore({ storage, profileId:'user-personal', moduleId:'insights', allowedCardIds:cards });
  const business = Layout.createLayoutStore({ storage, profileId:'user-business', moduleId:'insights', allowedCardIds:cards });
  personal.set(['three','one','two'], 'desktop');
  assert.deepEqual(business.get('desktop'), cards);
  assert.notEqual(personal.key, business.key);
  assert.match(ui, /activeProfileId[\s\S]*userScope/);
  assert.match(ui, /authenticatedScope[\s\S]*--\$\{activeProfileId\(\)\}/, 'long user IDs retain an explicit Personal or Business suffix');
  assert.match(ui, /layoutOrders\[scopeId\]/, 'the global-state mirror is scoped by authenticated user and profile');
  assert.match(ui, /canonicalOrders[\s\S]*defaultsByContext:\{ mobile:canonical, tablet:canonical, desktop:canonical, wide:canonical \}/, 'a new profile starts from source order, not the active profile DOM order');
  assert.match(app, /layoutOrders:normalizeLayoutOrders\(settings\.layoutOrders\)/);
});

test('evaluation cycle 2: logout clears edit mode before another user can enter', () => {
  const authUi = fs.readFileSync(path.join(root, 'auth-ui.js'), 'utf8');
  assert.match(authUi, /function showAuth\(\)[\s\S]*MerLayoutUi\?\.disable\?\.\(\{ notify:false \}\)/);
  assert.match(ui, /disable:options\s*=>\s*setEditing\(false, options\)/);
});

test('evaluation cycle 2: personalization preserves responsive flow and one-pager boundaries', () => {
  assert.match(css, /body\.layout-editing \[data-layout-grid\] > \[data-layout-card\]/);
  assert.match(css, /@media \(max-width:1024px\)[\s\S]*body[\s\S]*overflow-y:auto/);
  assert.match(css, /html, body \{[^}]*height:100%[^}]*overflow:hidden/);
  assert.doesNotMatch(ui, /style\.(?:left|top|width|height)\s*=/, 'layout reordering never absolutely positions cards');
  assert.match(ui, /MutationObserver/, 'dynamic Savings goals are re-registered after state renders');
  assert.match(app, /event\.reason\s*!==\s*'layout-reorder'/, 'layout-only commits do not rebuild dynamic cards mid-drag');
  assert.match(css, /\.dashboard-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,minmax\(0,1fr\)\)/, 'either Dashboard card receives an equally safe track after reordering');
  assert.match(css, /\.advanced-insights-grid\s*\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/, 'Insights cards snap to symmetric tracks');
});

test('evaluation cycle 2: closing chat with Escape does not also exit layout editing', () => {
  assert.match(ui, /document\.addEventListener\('keydown', event => \{\s*if \(event\.defaultPrevented\) return;/);
});

test('evaluation cycle 2: production loads layout core before its interactive UI', () => {
  const coreIndex = html.indexOf('layout-core.js');
  const uiIndex = html.indexOf('layout-ui.js');
  assert.ok(coreIndex > 0 && uiIndex > coreIndex);
});
