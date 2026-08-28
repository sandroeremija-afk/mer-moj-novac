const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const premium = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');
const responsive = fs.readFileSync(path.join(root, 'responsive-ui.js'), 'utf8');
const build = fs.readFileSync(path.join(root, 'scripts', 'build.js'), 'utf8');

test('evaluation cycle 2: dialogs become safe-area bottom sheets with a reachable sticky footer on phones', () => {
  const mobile = css.slice(css.indexOf('@media (max-width:640px)'));
  assert.match(mobile, /\[data-ui="dialog"\] \{[\s\S]*?max-block-size:min\(92dvh,calc\(var\(--ui-visual-height\) - 8px\)\)/);
  assert.match(mobile, /min-block-size:0/);
  assert.match(mobile, /\[data-ui="dialog"\]\[open\]\s*\{\s*min-block-size:0;/);
  assert.match(mobile, /env\(safe-area-inset-bottom\)/);
  assert.match(mobile, /\[data-ui="dialog"\] \[data-ui="dialog-footer"\] \{[\s\S]*?position:sticky/);
  assert.match(mobile, /\.premium-settings\[open\],[\s\S]*?\.detail-modal,[\s\S]*?\.subscriptions-modal/);
  assert.match(css, /@media \(max-height:540px\) and \(max-width:1024px\)/);
  assert.match(css, /html\.ui-dialog-open,[\s\S]*?body\.ui-dialog-open \{ overflow:hidden !important/);
  assert.match(responsive, /classList\.toggle\('ui-dialog-open', dialogOpen\)/);
});

test('evaluation cycle 2: large review tables turn into labeled touch cards instead of overflowing', () => {
  assert.match(css, /\[data-ui="table"\] thead \{[\s\S]*?clip:rect\(0,0,0,0\)/);
  assert.match(css, /\[data-ui="table"\] tr \{[\s\S]*?display:grid/);
  assert.match(css, /\[data-ui="table"\] td::before \{[\s\S]*?content:attr\(data-label\)/);
  assert.match(premium, /data-label="\$\{t\('include'\)\}"/);
  assert.match(premium, /data-label="\$\{t\('description'\)\}"/);
  assert.match(premium, /data-label="\$\{t\('amount'\)\}"/);
  assert.match(premium, /aria-label="\$\{t\('category'\)\}"/);
  assert.match(css, /\.import-data-modal \.import-review:not\(\[hidden\]\) \{ overflow-y:auto/);
});

test('evaluation cycle 2: charts reflow, scroll only where useful, and preserve extreme signed ratios', () => {
  assert.match(css, /\[data-ui="chart"\] \{\s*min-inline-size:0/);
  assert.match(css, /\.detail-modal \.cashflow-chart \{[\s\S]*?overflow-x:auto/);
  assert.match(css, /\.contribution-chart \{[\s\S]*?grid-template-columns:repeat\(var\(--chart-columns,8\)/);
  assert.match(css, /\.expanded-month-chart \{ min-inline-size:0 !important; inline-size:100%/);
  assert.match(app, /rateMax=Math\.max\(\.\.\.validRates\.map\(item=>Math\.abs\(item\.rate\)\),1\)/);
  assert.match(app, /Math\.abs\(item\.rate\)\/rateMax\*100/);
  assert.match(premium, /milestones\[1\]\.textContent=currency\(primary\.target\/2,true\)/);
});

test('evaluation cycle 2: dropdown menus are collision-aware and fully keyboard operable', () => {
  assert.match(responsive, /computeFloatingPosition\(/);
  assert.match(responsive, /menu\.dataset\.side = placement\.side/);
  assert.match(responsive, /maxHeight:`\$\{placement\.maxHeight\}px`/);
  assert.match(responsive, /function focusMenuItem\(menu, direction\)/);
  assert.match(responsive, /requestAnimationFrame\(\(\) => focusMenuItem\(controlled, 'start'\)\)/);
  assert.match(css, /\.card-action-menu\[data-floating="true"\] \{[\s\S]*?position:fixed/);
});

test('evaluation cycle 2: wizards and long secondary panels preserve headers and actions while bodies scroll', () => {
  assert.match(css, /\[data-ui-kind="wizard"\]\[open\] \{[\s\S]*?display:flex;[\s\S]*?overflow:hidden/);
  assert.match(css, /\[data-ui-kind="wizard"\] \[data-ui="wizard-step"\]\.active \{[\s\S]*?overflow-y:auto/);
  assert.match(css, /\.subscriptions-modal \.subscription-list \{[\s\S]*?flex:1 1 auto;[\s\S]*?overflow-y:auto/);
  assert.match(css, /\[data-ui="tour-popover"\] \{[\s\S]*?overflow-y:auto/);
  assert.match(responsive, /wizard\.dataset\.uiKind = 'wizard'/);
});

test('evaluation cycle 2: touch, tablet, laptop and sidebar edge breakpoints stay bounded', () => {
  assert.match(css, /@media \(max-width:1440px\) and \(min-width:769px\) \{[\s\S]*?\.activity-filter-panel \{ grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media \(max-width:820px\) \{[\s\S]*?\.budget-manager-row \{ grid-template-columns:minmax\(0,1fr\) 44px/);
  assert.match(css, /@media \(max-width:768px\) \{[\s\S]*?\.sidebar \{[\s\S]*?transform:translateX\(-100%\)/);
  assert.match(css, /@media screen and \(max-width:1024px\), \(pointer:coarse\) \{[\s\S]*?min-block-size:44px/);
  assert.match(css, /#activityView \.transaction-item \{ grid-template-columns:42px minmax\(0,1fr\) auto 44px/);
  assert.match(build, /cssDescendantToken/);
  assert.match(build, /CSS descendant selector integrity failed/);
});

test('evaluation cycle 2: responsive charts and savings rings expose dynamic accessible summaries', () => {
  assert.match(html, /id="categoryDonut" role="img" aria-label="Potrošnja po kategoriji"/);
  assert.match(html, /id="monthlyBarChart" role="img"/);
  assert.match(html, /id="savingsGauge" role="img"/);
  assert.match(html, /id="savingsHeroTrack" role="progressbar"[^>]*aria-valuenow="62"/);
  assert.match(app, /categoryDonut'\)\.setAttribute\('aria-label'/);
  assert.match(app, /monthlyBarChart'\)\.setAttribute\('aria-label'/);
  assert.match(app, /contributionChart'\)\.setAttribute\('aria-label'/);
  assert.match(premium, /class="goal-progress-ring"[^`]*role="progressbar"[^`]*aria-valuenow="\$\{percent\}"/);
});
