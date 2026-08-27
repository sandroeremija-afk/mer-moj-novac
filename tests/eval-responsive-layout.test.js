const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const premium = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');

test('evaluation cycle 1: tablet and mobile use natural vertical flow without horizontal page overflow', () => {
  assert.match(css, /@media \(max-width:1024px\) \{[\s\S]*?html \{[\s\S]*?overflow-x:hidden;[\s\S]*?overflow-y:auto;/);
  assert.match(css, /@media \(max-width:1024px\) \{[\s\S]*?\.app-shell \{[\s\S]*?height:auto;[\s\S]*?min-height:100dvh;[\s\S]*?overflow:visible;/);
  assert.match(css, /@media \(max-width:1024px\) \{[\s\S]*?\.summary-grid,[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media \(max-width:1024px\) \{[\s\S]*?\.budget-row \{[\s\S]*?grid-template-columns:minmax\(140px,1\.2fr\) minmax\(120px,1\.5fr\) 44px/);
  assert.match(css, /@media \(max-width:767px\) \{[\s\S]*?\.summary-grid,[\s\S]*?grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /@media \(min-width:1921px\) \{[\s\S]*?\.page \{ max-width:1800px; \}/);
});

test('evaluation cycle 1: navigation and header adapt below the mobile breakpoint', () => {
  assert.match(css, /@media \(max-width:767px\) \{[\s\S]*?\.sidebar \{[\s\S]*?width:min\(86vw,300px\);[\s\S]*?overflow-y:auto;/);
  assert.match(css, /@media \(max-width:560px\) \{[\s\S]*?grid-template-areas:[\s\S]*?"menu title"[\s\S]*?"actions actions"/);
  assert.match(css, /@media \(max-width:560px\) \{[\s\S]*?\.topbar \{[\s\S]*?flex:0 0 auto;/);
  assert.match(app, /if\(window\.innerWidth>=768\)closeSidebar\(\)/);
  assert.match(app, /window\.matchMedia\('\(max-width:560px\)'\)\.matches/);
});

test('evaluation cycle 2: touch targets and mobile dialogs meet the interaction contract', () => {
  assert.match(css, /@media \(max-width:1024px\), \(pointer:coarse\) \{[\s\S]*?min-height:44px/);
  assert.match(css, /\.icon-button,[\s\S]*?\.card-action-trigger \{[\s\S]*?width:44px;[\s\S]*?height:44px;/);
  assert.match(css, /@media \(max-width:767px\) \{[\s\S]*?\.modal,[\s\S]*?inset:auto 8px 0;[\s\S]*?width:calc\(100vw - 16px\);[\s\S]*?max-height:94dvh;[\s\S]*?border-radius:18px 18px 0 0;/);
  assert.match(css, /\.premium-settings\[open\] \{[\s\S]*?height:90dvh;[\s\S]*?overflow:hidden;/);
  assert.match(css, /\.notification-center \{[\s\S]*?position:fixed;[\s\S]*?max-height:calc\(100dvh - 90px\);/);
});

test('evaluation cycle 2: shared modal, import, account and chart handlers remain intact', () => {
  assert.match(app, /\$\$\('\[data-open-transaction\]'\)/);
  assert.match(premium, /\$\$\('\[data-open-global-import\]'\)/);
  assert.match(app, /\$\$\('\[data-account\]'\)/);
  assert.match(app, /\$\$\('\[data-insight-detail\]'\)/);
  assert.match(app, /modal\.addEventListener\('click',event=>/);
});
