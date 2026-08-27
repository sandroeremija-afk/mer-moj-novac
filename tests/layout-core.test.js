'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Layout = require('../layout-core.js');

class MemoryStorage {
  constructor(seed = {}) { this.values = new Map(Object.entries(seed)); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
}

const cards = ['safe-to-spend', 'budget-tracker', 'cash-flow', 'savings-goal'];
const defaults = {
  desktop:cards,
  tablet:['safe-to-spend', 'cash-flow', 'budget-tracker', 'savings-goal'],
  mobile:['safe-to-spend', 'budget-tracker', 'savings-goal', 'cash-flow']
};

test('layout core sanitizes stale, duplicate, malformed, and missing card IDs', () => {
  const input = ['cash-flow', 'unknown', 'cash-flow', null, '', 'safe-to-spend'];
  const result = Layout.sanitizeCardIds(input, cards, defaults.desktop);
  assert.deepEqual(result, ['cash-flow', 'safe-to-spend', 'budget-tracker', 'savings-goal']);
  assert.equal(Object.isFrozen(result), true);
  assert.deepEqual(Layout.normalizeOrder(cards, input), result);
});

test('layout core reorders named cards without mutating the caller', () => {
  const original = [...cards];
  assert.deepEqual(Layout.reorderCardIds(original, 'cash-flow', 'safe-to-spend'), ['cash-flow', 'safe-to-spend', 'budget-tracker', 'savings-goal']);
  assert.deepEqual(Layout.reorderCardIds(original, 'safe-to-spend', 'cash-flow', { placement:'after' }), ['budget-tracker', 'cash-flow', 'safe-to-spend', 'savings-goal']);
  assert.deepEqual(Layout.reorderCardIds(original, 'savings-goal', 0), ['savings-goal', 'safe-to-spend', 'budget-tracker', 'cash-flow']);
  assert.deepEqual(original, cards);
  assert.deepEqual(Layout.reorderCardIds(original, 'missing', 0), cards);
  assert.deepEqual(Layout.moveItem(original, 'cash-flow', -2), ['cash-flow', 'safe-to-spend', 'budget-tracker', 'savings-goal']);
  assert.deepEqual(Layout.moveItem(original, 'safe-to-spend', 2), ['budget-tracker', 'cash-flow', 'safe-to-spend', 'savings-goal']);
});

test('layout core maps widths to stable responsive contexts', () => {
  assert.equal(Layout.responsiveContext(375), 'mobile');
  assert.equal(Layout.responsiveContext({ width:820 }), 'tablet');
  assert.equal(Layout.responsiveContext(1366), 'desktop');
  assert.equal(Layout.responsiveContext(1920), 'wide');
  assert.equal(Layout.responsiveContext('not-a-width'), 'desktop');
});

test('responsive fallback uses the requested context default and never an incompatible saved context', () => {
  const resolvedMobile = Layout.resolveResponsiveOrder({
    context:'mobile',
    storedByContext:{ desktop:['cash-flow', 'safe-to-spend', 'budget-tracker', 'savings-goal'] },
    defaultsByContext:defaults,
    allowedCardIds:cards
  });
  assert.deepEqual(resolvedMobile, defaults.mobile);

  const resolvedWide = Layout.resolveResponsiveOrder({
    context:'wide',
    storedByContext:{},
    defaultsByContext:defaults,
    allowedCardIds:cards
  });
  assert.deepEqual(resolvedWide, defaults.desktop);
});

test('layout persistence is isolated by profile and module', () => {
  const storage = new MemoryStorage();
  const options = { storage, allowedCardIds:cards, defaultsByContext:defaults, now:() => Date.parse('2026-08-27T12:00:00.000Z') };
  const personalOverview = Layout.createLayoutStore({ ...options, profileId:'Personal', moduleId:'Overview' });
  const businessOverview = Layout.createLayoutStore({ ...options, profileId:'Business', moduleId:'Overview' });
  const personalSavings = Layout.createLayoutStore({ ...options, profileId:'Personal', moduleId:'Savings' });

  personalOverview.set(['cash-flow', 'safe-to-spend', 'budget-tracker', 'savings-goal'], 'desktop');
  businessOverview.set(['budget-tracker', 'safe-to-spend', 'cash-flow', 'savings-goal'], 'desktop');
  personalSavings.set(['savings-goal', 'safe-to-spend', 'budget-tracker', 'cash-flow'], 'desktop');

  assert.deepEqual(personalOverview.get('desktop'), ['cash-flow', 'safe-to-spend', 'budget-tracker', 'savings-goal']);
  assert.deepEqual(businessOverview.get('desktop'), ['budget-tracker', 'safe-to-spend', 'cash-flow', 'savings-goal']);
  assert.deepEqual(personalSavings.get('desktop'), ['savings-goal', 'safe-to-spend', 'budget-tracker', 'cash-flow']);
  assert.deepEqual([...storage.values.keys()].sort(), [
    'mer-layout-v1:business:overview',
    'mer-layout-v1:personal:overview',
    'mer-layout-v1:personal:savings'
  ]);
});

test('userId and gridId aliases create the same stable persistence scope', () => {
  const storage = new MemoryStorage();
  const aliasStore = Layout.createLayoutStore({ storage, userId:' Alex@example.com ', gridId:'Main Dashboard', allowedCardIds:cards });
  aliasStore.set(['cash-flow', 'safe-to-spend', 'budget-tracker', 'savings-goal']);
  assert.equal(aliasStore.key, 'mer-layout-v1:alex-example.com:main-dashboard');
  const restored = Layout.createLayoutStore({ storage, profileId:'alex@example.com', moduleId:'main dashboard', allowedCardIds:cards });
  assert.deepEqual(restored.get(), ['cash-flow', 'safe-to-spend', 'budget-tracker', 'savings-goal']);
});

test('layout store repairs old orders when cards are removed or added', () => {
  const storage = new MemoryStorage({
    'mer-layout-v1:personal:overview':JSON.stringify({
      version:1,
      contexts:{ desktop:['legacy-card', 'cash-flow', 'safe-to-spend'] }
    })
  });
  const store = Layout.createLayoutStore({ storage, profileId:'personal', moduleId:'overview', allowedCardIds:cards, defaultsByContext:defaults });
  assert.deepEqual(store.get('desktop'), ['cash-flow', 'safe-to-spend', 'budget-tracker', 'savings-goal']);
});

test('layout core accepts normalized goal card IDs longer than the old 80-character cap', () => {
  const longGoalCardId = `goal-${'a'.repeat(100)}`;
  const store = Layout.createLayoutStore({
    storage:new MemoryStorage(),
    profileId:'personal',
    moduleId:'savings-goals',
    allowedCardIds:[longGoalCardId]
  });
  assert.deepEqual(store.get('mobile'), [longGoalCardId]);
  assert.ok(longGoalCardId.length > 80);
  assert.ok(longGoalCardId.length <= Layout.MAX_CARD_ID_LENGTH);
});

test('layout store moves, resets one context, and preserves the other responsive context', () => {
  const storage = new MemoryStorage();
  const store = Layout.createLayoutStore({ storage, profileId:'personal', moduleId:'overview', allowedCardIds:cards, defaultsByContext:defaults });
  store.set(['cash-flow', 'safe-to-spend', 'budget-tracker', 'savings-goal'], 'desktop');
  store.set(['savings-goal', 'safe-to-spend', 'budget-tracker', 'cash-flow'], 'mobile');
  assert.deepEqual(store.move('cash-flow', 0, { context:'desktop' }), ['cash-flow', 'safe-to-spend', 'budget-tracker', 'savings-goal']);
  assert.equal(store.snapshot('desktop').saved, true);
  assert.deepEqual(store.reset('desktop'), defaults.desktop);
  assert.equal(store.snapshot('desktop').saved, false);
  assert.deepEqual(store.get('mobile'), ['savings-goal', 'safe-to-spend', 'budget-tracker', 'cash-flow']);
});

test('corrupt or unavailable storage degrades to isolated in-memory persistence', () => {
  const corrupt = new MemoryStorage({ 'mer-layout-v1:personal:overview':'{not-json' });
  const repaired = Layout.createLayoutStore({ storage:corrupt, profileId:'personal', moduleId:'overview', allowedCardIds:cards, defaultsByContext:defaults });
  assert.deepEqual(repaired.get('desktop'), defaults.desktop);

  const blockedStorage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); }
  };
  const memory = Layout.createLayoutStore({ storage:blockedStorage, profileId:'personal', moduleId:'overview', allowedCardIds:cards, defaultsByContext:defaults });
  memory.set(['cash-flow', 'safe-to-spend', 'budget-tracker', 'savings-goal'], 'desktop');
  assert.deepEqual(memory.get('desktop'), ['cash-flow', 'safe-to-spend', 'budget-tracker', 'savings-goal']);
  assert.equal(memory.snapshot('desktop').storageAvailable, false);
});
