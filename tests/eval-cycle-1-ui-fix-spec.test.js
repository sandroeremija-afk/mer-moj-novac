const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const MerCore = require('../core.js');

const root = path.join(__dirname,'..');
const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
const premium = fs.readFileSync(path.join(root,'premium.js'),'utf8');
const authUi = fs.readFileSync(path.join(root,'auth-ui.js'),'utf8');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');

test('evaluation cycle 1: budget severity has exact raw-percentage branches', () => {
  assert.equal(MerCore.budgetSeverity(79.999),null);
  assert.equal(MerCore.budgetSeverity(80),'near');
  assert.equal(MerCore.budgetSeverity(94.999),'near');
  assert.equal(MerCore.budgetSeverity(95),'almost');
  assert.equal(MerCore.budgetSeverity(99.999),'almost');
  assert.equal(MerCore.budgetSeverity(100),'exceeded');
  assert.equal(MerCore.budgetSeverity(240),'exceeded');
  for (const copy of [
    'Blizu granice — {percent}% potrošeno',
    'Granica gotovo dosegnuta — {percent}% potrošeno',
    'Budžet premašen — {percent}% potrošeno'
  ]) assert.ok(app.includes(copy),copy);
});

test('evaluation cycle 1: notification grouping preserves one item and collapses many before badge counting', () => {
  const one = { key:'budget:food', priority:3, type:'warning' };
  assert.deepEqual(MerCore.groupBudgetAlerts([]),[]);
  assert.deepEqual(MerCore.groupBudgetAlerts([one]),[one]);
  const grouped = MerCore.groupBudgetAlerts([one,{key:'budget:rent',priority:4,type:'danger'}]);
  assert.equal(grouped.length,1);
  assert.equal(grouped[0].grouped,true);
  assert.equal(grouped[0].type,'danger');
  assert.equal(grouped[0].children.length,2);
  assert.match(app,/MerCore\.groupBudgetAlerts\(budgetAlerts\)/);
  assert.match(app,/<details class="notification-budget-group">/);
});

test('evaluation cycle 1: demo goal repair and high-contribution warning are integrated without a model change', () => {
  assert.match(app,/id:'goal-personal-laptop',name:'Novi laptop',target:2400/);
  assert.match(app,/function repairDemoGoalSeed\(\)/);
  assert.match(app,/\^moze\$\/i/);
  assert.match(authUi,/repairGoalSeed\?\.\(\)/);
  assert.match(premium,/monthlyRequired>monthlyNetIncome\*\.8/);
  assert.match(premium,/goal-contribution-warning/);
  assert.ok(app.includes('Ovaj cilj zahtijeva vrlo visoku mjesečnu uplatu — razmislite o produljenju roka'));
});

test('evaluation cycle 1: sidebar owns transaction entry and activity reuses category visuals', () => {
  const shell = html.slice(html.indexOf('id="appShell"'),html.indexOf('id="transactionModal"'));
  assert.equal((shell.match(/data-open-transaction/g)||[]).length,1);
  assert.match(shell,/sidebar-transaction-button[^>]*data-open-transaction/);
  assert.match(app,/renderBudgetLists\(\)[\s\S]*categoryVisual\(cat\)/);
  assert.match(app,/function budgetCategoryRow[\s\S]*categoryVisual\(cat\)/);
  assert.match(app,/function renderActivity[\s\S]*categoryVisual\(txCategory\)/);
  assert.match(app,/transaction-item \$\{type\}[\s\S]*category-icon \$\{meta\.className\}/);
});

test('evaluation cycle 1: exact overview, helper, and login microcopy is present', () => {
  assert.ok(app.includes("budgetOf:'{percent}% potrošeno · fleksibilni budžet {budget}'"));
  assert.ok(app.includes("impactPrompt:'Unesite iznos da provjerimo utjecaj na proračun'"));
  assert.match(app,/resetTransactionCheck\(\)[\s\S]*t\('impactPrompt'\)/);
  assert.match(html,/id="loginEmail"[^>]*placeholder="ime@tvrtka\.hr"/);
  assert.match(html,/id="loginPassword"[^>]*placeholder="Unesite lozinku"/);
  assert.match(authUi,/data-auth-placeholder/);
});
