'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const MerOnboarding = require('../onboarding-core.js');

test('evaluation cycle 1: the senior-friendly journey contains exactly five purposeful steps', () => {
  const ids = MerOnboarding.DEFAULT_STEPS.map(step => step.id);
  assert.deepEqual(ids, ['overview', 'transaction', 'budgets', 'savings', 'insights']);
  assert.equal(MerOnboarding.DEFAULT_STEPS[1].target, '#sidebar .sidebar-transaction-button[data-open-transaction]');
  assert.equal(MerOnboarding.DEFAULT_STEPS[1].openSidebar, true);
});

test('evaluation cycle 1: every step exposes the requested Croatian copy and an English equivalent', () => {
  const expected = [
    ['Vaš financijski pregled', 'Ovdje u svakom trenutku vidite koliko novca imate na raspolaganju i brzi pregled mjesečne potrošnje.'],
    ['Unos prihoda i troškova', 'Jednim klikom možete ručno unijeti novi trošak ili prihod, ili uvoziti izvod iz vaše banke.'],
    ['Mesečni plan i limiti', 'Postavite granice potrošnje po kategorijama (hrana, prijevoz, režije) kako biste lakše uštedjeli.'],
    ['Ciljevi štednje', 'Pratite napredak svojih fondova za hitne slučajeve i postavite automatska pravila zaokruživanja.'],
    ['Izvješća i analitika', 'Pregledajte kretanje prihoda i troškova po razdobljima te prilagodite postavke profila u bilo kojem trenutku.']
  ];
  MerOnboarding.DEFAULT_STEPS.forEach((step, index) => {
    assert.equal(step.copy.hr.title, expected[index][0]);
    assert.equal(step.copy.hr.description, expected[index][1]);
    assert.ok(step.copy.en.title.length > 4);
    assert.ok(step.copy.en.description.length > 20);
  });
});

test('evaluation cycle 1: module steps carry a real sidebar context selector for simultaneous highlighting', () => {
  for (const step of MerOnboarding.DEFAULT_STEPS) {
    assert.equal(step.contextTarget, `.nav-item[data-view="${step.view}"]`);
  }
});

test('evaluation cycle 1: module features point at the requested high-value surfaces', () => {
  const byId = Object.fromEntries(MerOnboarding.DEFAULT_STEPS.map(step => [step.id, step]));
  assert.equal(byId.overview.target, '#overviewView .summary-card.balance-card');
  assert.equal(byId.budgets.target, '#budgetsView .table-panel .panel-heading');
  assert.equal(byId.savings.target, '#savingsView .savings-hero');
  assert.equal(byId.insights.target, '#insightsView .monthly-bars-card');
  assert.equal(byId.insights.mobileTarget, '#insightsView .monthly-bars-card .panel-heading');
});
