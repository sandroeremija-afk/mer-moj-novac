'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const MerOnboarding = require('../onboarding-core.js');

test('evaluation cycle 1: the guided journey starts on Dashboard and keeps Add Transaction as step 2', () => {
  const ids = MerOnboarding.DEFAULT_STEPS.map(step => step.id);
  assert.equal(ids[0], 'overview');
  assert.equal(ids[1], 'transaction');
  assert.equal(MerOnboarding.DEFAULT_STEPS[1].target, '#sidebar .sidebar-transaction-button[data-open-transaction]');
  assert.equal(MerOnboarding.DEFAULT_STEPS[1].openSidebar, true);
});

test('evaluation cycle 1: every module change spotlights its real sidebar link before page content', () => {
  const steps = MerOnboarding.DEFAULT_STEPS;
  for (const moduleName of ['budgets', 'savings', 'activity', 'insights']) {
    const navigationIndex = steps.findIndex(step => step.id === `${moduleName}Navigation`);
    const featureIndex = steps.findIndex(step => step.id === moduleName);
    assert.equal(featureIndex, navigationIndex + 1, `${moduleName} follows its navigation spotlight`);

    const navigation = steps[navigationIndex];
    assert.equal(navigation.view, moduleName);
    assert.equal(navigation.target, `.nav-item[data-view="${moduleName}"]`);
    assert.equal(navigation.mobileTarget, navigation.target);
    assert.equal(navigation.openSidebar, true);
    assert.equal(navigation.navigationStep, true);
  }
});

test('evaluation cycle 1: core financial module order remains Dashboard, Budgets, Savings, Activity', () => {
  const contentOrder = MerOnboarding.DEFAULT_STEPS.filter(step => !step.navigationStep).map(step => step.id);
  assert.ok(contentOrder.indexOf('overview') < contentOrder.indexOf('budgets'));
  assert.ok(contentOrder.indexOf('budgets') < contentOrder.indexOf('savings'));
  assert.ok(contentOrder.indexOf('savings') < contentOrder.indexOf('activity'));
});
