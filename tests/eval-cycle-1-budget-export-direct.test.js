'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const premium = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');

test('cycle 1: Croatian budget action uses the requested copy', () => {
  assert.match(app, /budgetDataActions:'Izvoz budžeta'/);
  assert.match(html, /data-export-budget[\s\S]*data-i18n="budgetDataActions">Izvoz budžeta<\/span>/);
});

test('cycle 1: one click invokes contextual CSV export without opening a modal', () => {
  assert.doesNotMatch(html, /id="budgetDataModal"|data-open-detail="budgetDataModal"/);
  assert.match(premium, /\$\$\('\[data-export-budget\]'\)\.forEach\(button=>button\.addEventListener\('click',\(\)=>\{closeCardMenus\(\);exportBudgetPlanCsv\(\);\}\)\);/);
  assert.match(premium, /function exportBudgetPlanCsv\(\)[\s\S]*?downloadFile\(exportFileName\('budget'\)/);
});
