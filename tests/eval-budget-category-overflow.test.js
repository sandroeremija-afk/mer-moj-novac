const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

test('evaluation cycle 1: Budgets owns a bounded desktop category window without root scrolling', () => {
  assert.match(html, /class="budget-table-window" id="budgetTableWindow"[\s\S]*?id="budgetTable"/);
  assert.match(css, /@media \(min-width:1025px\) \{[\s\S]*?#budgetsView \{[^}]*display:flex;[^}]*overflow:hidden;/);
  assert.match(css, /#budgetsView > \.table-panel \{[^}]*min-height:0;[^}]*flex:1 1 auto;[^}]*overflow:hidden;/);
  assert.match(css, /#budgetsView \.budget-table-window \{[^}]*flex:1 1 auto;[^}]*overflow-y:auto;[^}]*scrollbar-gutter:stable;/);
  assert.match(css, /\.budget-table-window::\-webkit-scrollbar-thumb,[\s\S]*?background:var\(--line-strong\)/);
});

test('evaluation cycle 1: tablet and mobile retain the established natural page flow', () => {
  assert.match(css, /@media \(max-width:1024px\) \{[\s\S]*?\.budget-table-window \{[^}]*max-height:none;[^}]*overflow:visible;/);
});

test('evaluation cycle 2: expanded category manager provides search, status filters and add/edit actions', () => {
  const start = html.indexOf('id="budgetCategoriesModal"');
  const end = html.indexOf('</dialog>', start);
  const modal = html.slice(start, end);
  assert.ok(start >= 0, 'budget category modal must exist');
  assert.match(modal, /id="budgetCategorySearch"/);
  assert.match(modal, /id="budgetCategoryStatusFilter"/);
  assert.match(modal, /value="available"[\s\S]*?value="warning"[\s\S]*?value="exceeded"/);
  assert.match(modal, /id="budgetCategoryManagerAdd"/);
  assert.match(modal, /id="budgetCategoryModalList"/);
  assert.match(app, /budgetCategoryStatusFilter'\)\.addEventListener\('change',renderBudgetCategoryManager\)/);
  assert.match(app, /budgetCategoryModalList'\)\.addEventListener\('click',handleBudgetEdit\)/);
});

test('evaluation cycle 2: category mutations commit to the central store and return to the live manager', () => {
  assert.match(app, /save\(cat\?'category-edit':'category-add'\)/);
  assert.match(app, /if\(returnToBudgetManager\)\{returnToBudgetManager=false;openBudgetCategoryManager\(\);\}/);
  assert.match(app, /if\(\$\('#budgetCategoriesModal'\)\.open\)renderBudgetCategoryManager\(\)/);
  assert.match(app, /modal\.addEventListener\('click',event=>[\s\S]*?if\(outside\)closeModal\(modal\)/);
});

test('search alignment cycle 1: manager search reserves a clean icon and text lane', () => {
  assert.match(css, /\.budget-manager-toolbar \.search-field > svg \{[^}]*position:absolute;[^}]*top:50%;[^}]*left:14px;[^}]*pointer-events:none;[^}]*transform:translateY\(-50%\);/s);
  assert.match(css, /\.budget-manager-toolbar \.search-field > input \{[^}]*padding:0 14px 0 46px;[^}]*line-height:44px;/s);
});

test('search alignment cycle 2: manager search remains wired to reactive filtering', () => {
  assert.match(html, /id="budgetCategorySearch" type="search"/);
  assert.match(app, /budgetCategorySearch'\)\.addEventListener\('input',renderBudgetCategoryManager\)/);
  assert.match(app, /categoryName\(cat\.id\)\.toLocaleLowerCase\(locale\(\)\)\.includes\(query\)/);
});
