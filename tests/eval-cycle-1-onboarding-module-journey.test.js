'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const MerOnboarding = require('../onboarding-core.js');

test('evaluation cycle 1: the senior-friendly journey contains exactly seven purposeful steps', () => {
  const ids = MerOnboarding.DEFAULT_STEPS.map(step => step.id);
  assert.deepEqual(ids, ['overview', 'transaction', 'budgets', 'savings', 'insights', 'settings', 'help']);
  assert.equal(MerOnboarding.DEFAULT_STEPS[1].target, '#sidebar .sidebar-transaction-button[data-open-transaction]');
  assert.equal(MerOnboarding.DEFAULT_STEPS[1].openSidebar, true);
});

test('evaluation cycle 1: every step exposes the requested Croatian copy and an English equivalent', () => {
  const expected = [
    ['Glavni pregled', 'Ovdje u svakom trenutku vidite koliko novca imate na raspolaganju i brzi pregled mjesečne potrošnje.'],
    ['Unos transakcija', 'Jednim klikom možete ručno unijeti novi trošak ili prihod, ili uvoziti izvod iz vaše banke.'],
    ['Mjesečni budžeti', 'Postavite granice potrošnje po kategorijama (hrana, prijevoz, režije) kako biste lakše uštedjeli.'],
    ['Ciljevi štednje', 'Pratite napredak svojih fondova za hitne slučajeve i postavite automatska pravila zaokruživanja.'],
    ['Analitika i izvješća', 'Usporedite prihode i troškove po razdobljima. Odaberite dan, mjesec, godinu ili cijelu povijest.'],
    ['Postavke po vašoj mjeri', 'U Općim postavkama birajte temu i raspored. U ostalim odjeljcima podesite jezik, privatnost i zaštitu računa.'],
    ['Pomoć i AI asistent', 'U čestim pitanjima pronađite upute za svaki dio aplikacije. Odaberite Pitaj AI za razgovor i objašnjenja svojih financija.']
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
  assert.ok(MerOnboarding.DEFAULT_STEPS.every(step => !step.substeps), 'all seven steps have one clear purpose and no filler substeps');
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
  assert.equal(byId.settings.surface, 'settings');
  assert.equal(byId.settings.settingsTab, 'general');
  assert.equal(byId.settings.target, '#settingsTourPreferences');
  assert.equal(byId.settings.contextTarget, '#openSettings');
  assert.equal(byId.help.surface, 'help');
  assert.equal(byId.help.helpMode, 'faq');
  assert.equal(byId.help.target, '#helpAssistantModal .help-assistant-body');
  assert.equal(byId.help.contextTarget, '#openHelpAssistant');
  assert.equal(byId.settings.view, undefined, 'opening a surface must not reactivate Insights');
  assert.equal(byId.help.view, undefined);
  assert.doesNotMatch(JSON.stringify(MerOnboarding.DEFAULT_STEPS), /Financijsko zdravlje|Podjela računa|healthScore|splitBill|TRENUTAČNI MODUL/i);
});
