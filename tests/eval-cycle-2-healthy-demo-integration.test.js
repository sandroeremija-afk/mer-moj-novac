const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const MerCore = require('../core.js');
const MerStateStore = require('../state-store.js');
const MerDemoData = require('../demo-data.js');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('app.js');
const premium = read('premium.js');
const html = read('index.html');
const resetSource = premium.slice(premium.indexOf('function resetDemoWorkspace()'), premium.indexOf('function renderAutomationRules()'));
const startupSource = app.slice(app.indexOf('const initialDemoProfiles ='), app.indexOf('const safeIdentifier='));
const overviewSource = app.slice(app.indexOf('function renderOverview()'), app.indexOf('function compactChartCurrency('));
const alignHistorySource = app.slice(app.indexOf('function alignSavingsHistory('), app.indexOf('Object.values(appState.accounts).forEach(alignSavingsHistory);'));

test('healthy demo module is loaded after its engine and before app startup in source and production manifests', () => {
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"?]+)(?:\?[^\"]*)?"/g)].map(match => match[1]);
  assert.ok(scripts.indexOf('demo-data.js') > scripts.indexOf('core.js'));
  assert.ok(scripts.indexOf('demo-data.js') < scripts.indexOf('app.js'));
  for (const file of ['scripts/build.js', 'scripts/preflight.js']) {
    const manifest = read(file).match(/const jsFiles\s*=\s*(\[[^;]+\]);/);
    assert.ok(manifest, `${file} declares a script manifest`);
    const files = vm.runInNewContext(manifest[1]);
    assert.ok(files.includes('demo-data.js'), `${file} includes the seed module`);
  }
});

function resetHarness(demo = true) {
  let now = '2026-09-30T22:30:00Z';
  const createdDates = [], saves = [], toasts = [], reactiveSnapshots = [];
  const initialState = MerDemoData.createDemoAppState('2026-09-01');
  initialState.settings = { timezone:'Europe/Zagreb', currency:'CHF', language:'en' };
  initialState.bankConnections = [{ id:'existing-connection', profileId:'business' }];
  initialState.activeAccount = 'business';
  initialState.accounts.personal.transactions.push({ id:'user-trial', type:'expense', amount:123, date:'2026-09-02T08:00:00' });
  const reactiveStore = MerStateStore.createStore(initialState, { referenceDate:'2026-09-01' });
  const context = {
    Date:class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : [now])); } },
    window:{ MerAuthProvider:{ currentSession:() => ({ demo }) } },
    MerDemoData:{ createProfiles:reference => { createdDates.push(reference); return MerDemoData.createProfiles(reference); } },
    dateInTimezone:(date, timezone) => MerDemoData.referenceDay(date, timezone),
    appState:initialState, state:initialState.accounts.business, appReferenceDate:'2026-09-01', activeMonth:8, reactiveStore,
    personalDefaults:MerDemoData.createProfiles('2026-08-01').personal,
    businessDefaults:MerDemoData.createProfiles('2026-08-01').business,
    normalizeProfile:profile => profile,
    save:reason => { reactiveStore.commit(reason); saves.push(reason); },
    showView:() => {}, showToast:value => toasts.push(value), t:key => key,
    importStage:{ rows:[] }, pendingBulkOverride:{}, lastBulkOverride:{}, activityReviewOnly:true
  };
  reactiveStore.subscribe(event => reactiveSnapshots.push({
    reason:event.reason, reference:context.appReferenceDate,
    month:context.activeMonth, historyMonth:event.activeProfile.savingsHistoryReferenceMonth,
    available:event.activeProfile.availableBalance, spent:event.activeProfile.spent,
    saved:event.activeProfile.derived.monthlyContributions,
    importStage:context.importStage, reviewOnly:context.activityReviewOnly
  }));
  const reset = vm.runInNewContext(`${alignHistorySource}\n${resetSource}\nresetDemoWorkspace;`, context);
  return { reset, context, createdDates, saves, toasts, reactiveSnapshots, setNow:value => { now = value; } };
}

test('explicit demo reset generates data for the live local date instead of page-load defaults', () => {
  const harness = resetHarness();
  const settings = harness.context.appState.settings;
  assert.equal(harness.reset(), true);
  assert.deepEqual(harness.createdDates, ['2026-10-01']);
  assert.equal(harness.context.appState.accounts.personal.savingsHistoryReferenceMonth, '2026-10');
  assert.equal(harness.context.appState.accounts.personal.availableBalance, 2840);
  assert.equal(harness.context.appState.accounts.personal.spent, 820);
  assert.equal(harness.context.appState.accounts.personal.derived.monthlyContributions, 450);
  assert.equal(harness.context.appReferenceDate, '2026-10-01');
  assert.equal(harness.context.activeMonth, 9);
  assert.equal(harness.context.appState.accounts.personal.transactions.some(transaction => transaction.id === 'user-trial'), false);
  assert.equal(harness.context.appState.settings, settings);
  assert.equal(harness.context.appState.bankConnections.length, 0);
  assert.equal(harness.context.appState.activeAccount, 'personal');
  assert.equal(harness.context.state, harness.context.appState.accounts.personal);
  assert.deepEqual(harness.saves, ['demo-reset']);
  assert.deepEqual(harness.toasts, ['demoResetComplete']);
  harness.setNow('2026-10-31T23:30:00Z');
  harness.reset();
  assert.deepEqual(harness.createdDates, ['2026-10-01', '2026-11-01']);
  assert.equal(harness.context.appState.accounts.personal.savingsHistoryReferenceMonth, '2026-11');
  assert.equal(harness.context.appState.accounts.personal.availableBalance, 2840);
  assert.equal(harness.context.appState.accounts.personal.spent, 820);
  assert.equal(harness.context.appState.accounts.personal.derived.monthlyContributions, 450);
  assert.equal(harness.context.appReferenceDate, '2026-11-01');
  assert.equal(harness.context.activeMonth, 10);
  assert.deepEqual(harness.reactiveSnapshots.map(snapshot => snapshot.reason), ['reference-date-change', 'demo-reset', 'reference-date-change', 'demo-reset']);
  for (const snapshot of harness.reactiveSnapshots) {
    assert.equal(snapshot.reference.slice(0, 7), snapshot.historyMonth);
    assert.equal(Number(snapshot.reference.slice(5, 7)) - 1, snapshot.month);
    assert.equal(snapshot.available, 2840);
    assert.equal(snapshot.spent, 820);
    assert.equal(snapshot.saved, 450);
    assert.equal(snapshot.importStage, null);
    assert.equal(snapshot.reviewOnly, false);
  }
});

test('non-demo users cannot run the demo reset or lose their current accounts', () => {
  const harness = resetHarness(false);
  const before = JSON.stringify(harness.context.appState);
  assert.equal(harness.reset(), false);
  assert.equal(JSON.stringify(harness.context.appState), before);
  assert.deepEqual(harness.createdDates, []);
  assert.deepEqual(harness.saves, []);
  assert.deepEqual(harness.toasts, ['demoResetUnavailable']);
});

for (const key of ['mer-money-v6', 'mer-money-v5', 'mer-money-v4']) {
  test(`startup preserves persisted financial records from ${key} rather than applying new demo defaults`, () => {
    const storedState = MerDemoData.createDemoAppState('2026-08-12');
    storedState.accounts.personal.availableBalance = 12345;
    storedState.accounts.personal.categories[0].limit = 987;
    storedState.accounts.personal.transactions = [{ id:'persisted-user-income', type:'income', amount:9999, category:'salary', date:'2026-08-12T08:00:00' }];
    storedState.accounts.business.availableBalance = 45678;
    storedState.activeAccount = 'business';
    const original = JSON.stringify(storedState);
    let writes = 0;
    const context = {
      MerDemoData, MerCore, structuredClone,
      localStorage:{ getItem:requested => requested === key ? original : null, setItem:() => { writes += 1; } }
    };
    const restored = vm.runInNewContext(`${startupSource}\nappState;`, context);
    assert.equal(restored.accounts.personal.availableBalance, 12345);
    assert.equal(restored.accounts.business.availableBalance, 45678);
    assert.equal(restored.accounts.personal.categories[0].limit, 987);
    assert.equal(restored.accounts.personal.transactions[0].id, 'persisted-user-income');
    assert.equal(restored.accounts.personal.transactions.length, 1);
    assert.equal(restored.activeAccount, 'business');
    assert.equal(writes, 0);
    assert.equal(JSON.stringify(storedState), original);
  });
}

test('Overview shows actual monthly deposits while live income still updates net and protection independently', () => {
  const appState = MerDemoData.createDemoAppState('2026-09-04');
  const store = MerStateStore.createStore(appState, { referenceDate:'2026-09-04' });
  const state = appState.accounts.personal;
  const elements = new Map();
  const select = selector => {
    if (!elements.has(selector)) elements.set(selector, { textContent:'', classList:{ toggle:() => {} }, style:{ setProperty:() => {} }, setAttribute:() => {} });
    return elements.get(selector);
  };
  const render = vm.runInNewContext(`${overviewSource}\nrenderOverview;`, {
    state, MerCore, getPlan:() => state.derived.financials,
    locale:() => 'hr-HR', appReferenceDate:'2026-09-04', activeMonth:8,
    $:select, currency:value => String(value), t:key => key,
    savingsFinishDate:() => '2027-09-04', renderSpendingPaceChart:() => {}
  });
  render();
  assert.equal(elements.get('#savedValue').textContent, '450');
  assert.equal(state.derived.monthlySavings, 2680);
  assert.equal(state.derived.monthly.net, 2680);
  state.transactions.push({ id:'bonus', type:'income', category:'salary', amount:200, date:'2026-09-04T08:00:00' });
  store.commit('income-add');
  render();
  assert.equal(elements.get('#savedValue').textContent, '450');
  assert.equal(elements.get('#availableBalance').textContent, '3040');
  assert.equal(elements.get('#safeRemaining').textContent, '1280');
  assert.equal(state.derived.monthly.net, 2880);
  const primary = state.goalBuckets[0];
  primary.current += 50;
  state.savingsEntries.push({ id:'new-saving', amount:50, goalId:primary.id, date:'2026-09-04T08:00:00' });
  store.commit('savings-add');
  render();
  assert.equal(elements.get('#savedValue').textContent, '500');
  assert.equal(elements.get('#availableBalance').textContent, '2990');
  assert.equal(state.derived.monthly.net, 2880);
  assert.match(html, /data-i18n="savingsDepositsOnly"/);
});
