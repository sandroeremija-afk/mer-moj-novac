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
    ['Glavni pregled', 'Ovdje u svakom trenutku vidite koliko novca imate na raspolaganju i brzi pregled mjesečne potrošnje.'],
    ['Unos transakcija', 'Jednim klikom možete ručno unijeti novi trošak ili prihod, ili uvoziti izvod iz vaše banke.'],
    ['Mjesečni budžeti', 'Postavite granice potrošnje po kategorijama (hrana, prijevoz, režije) kako biste lakše uštedjeli.'],
    ['Ciljevi štednje', 'Pratite napredak svojih fondova za hitne slučajeve i postavite automatska pravila zaokruživanja.'],
    ['Analitika i izvješća', 'Usporedite prihode i troškove po razdobljima. Odaberite dan, mjesec, godinu ili cijelu povijest.']
  ];
  MerOnboarding.DEFAULT_STEPS.forEach((step, index) => {
    assert.equal(step.copy.hr.title, expected[index][0]);
    assert.equal(step.copy.hr.description, expected[index][1]);
    assert.ok(step.copy.en.title.length > 4);
    assert.ok(step.copy.en.description.length > 20);
  });
});

test('evaluation cycle 1: module steps carry a real sidebar context selector for simultaneous highlighting', () => {
  for (const step of MerOnboarding.DEFAULT_STEPS.filter(step => step.view)) {
    assert.equal(step.contextTarget, `.nav-item[data-view="${step.view}"]`);
  }
  assert.ok(MerOnboarding.DEFAULT_STEPS.every(step => !step.surface && !step.substeps), 'the five-step tour never opens a secondary dialog or filler substep');
});

test('evaluation cycle 1: module features point at the requested high-value surfaces', () => {
  const byId = Object.fromEntries(MerOnboarding.DEFAULT_STEPS.map(step => [step.id, step]));
  assert.equal(byId.overview.target, '#overviewView .summary-grid');
  assert.equal(byId.budgets.target, '#budgetsView .table-panel');
  assert.equal(byId.savings.target, '#savingsView .goal-buckets-panel');
  assert.equal(byId.insights.target, '#insightsView');
  assert.equal(byId.insights.mobileTarget, '#insightsView');
  for (const id of ['overview', 'budgets', 'savings', 'insights']) {
    assert.equal(byId[id].mobileTarget, byId[id].target, 'mobile retains meaningful containers rather than thin borders');
  }
  assert.equal(byId.settings, undefined);
  assert.equal(byId.help, undefined);
  assert.doesNotMatch(JSON.stringify(MerOnboarding.DEFAULT_STEPS), /Financijsko zdravlje|Podjela računa|healthScore|splitBill|TRENUTAČNI MODUL/i);
});
