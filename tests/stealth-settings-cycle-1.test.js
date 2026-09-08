'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const demo = require('../demo-data.js');

const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const app = read('app.js');
const html = read('index.html');
const enterprise = read('enterprise-ui.js');
const premium = read('premium.js');

function settingsNormalizer() {
  const source = app.match(/function normalizeAppSettings\(settings=\{\}\)\{[^\n]+\}/)?.[0];
  assert.ok(source, 'the centralized settings normalizer remains available');
  const context = {
    Intl,
    supportedCurrencies:new Set(['EUR', 'USD', 'GBP', 'CHF']),
    normalizeLayoutOrders:value => value || {}
  };
  vm.createContext(context);
  vm.runInContext(`${source};this.normalize=normalizeAppSettings;`, context);
  return context.normalize;
}

function settingsPane(name) {
  const section = html.match(new RegExp(`<section[^>]*data-settings-panel="${name}"[^>]*>([\\s\\S]*?)(?=<section[^>]*data-settings-panel=|<\\/dialog>)`));
  assert.ok(section, `${name} settings pane exists`);
  return section[1];
}

test('cycle 1: new and legacy missing preferences keep privacy and idle auto-lock opt-in', () => {
  const normalize = settingsNormalizer();
  for (const input of [undefined, {}, {currency:'EUR'}, {hideBalances:false, autoLockEnabled:false}]) {
    const settings = normalize(input);
    assert.equal(settings.hideBalances, false);
    assert.equal(settings.autoLockEnabled, false);
  }
  const state = demo.createDemoAppState(new Date('2026-09-08T10:00:00Z'));
  assert.equal(state.settings.hideBalances, false, 'fresh demo does not hide balances');
  assert.equal(state.settings.autoLockEnabled, false, 'fresh demo does not start an inactivity lock');
});

test('cycle 1: explicit existing preferences survive normalization without changing account data', () => {
  const normalize = settingsNormalizer();
  const input = {
    hideBalances:true,
    autoLockEnabled:true,
    currency:'USD',
    dateFormat:'iso',
    timezone:'UTC',
    layoutOrders:{personal:{summary:{desktop:['income', 'expense']}}}
  };
  const original = JSON.stringify(input);
  const result = normalize(input);
  assert.equal(result.hideBalances, true);
  assert.equal(result.autoLockEnabled, true);
  assert.equal(result.currency, 'USD');
  assert.equal(result.dateFormat, 'iso');
  assert.equal(result.timezone, 'UTC');
  assert.equal(JSON.stringify(result.layoutOrders), JSON.stringify(input.layoutOrders));
  assert.equal(JSON.stringify(input), original, 'normalization does not mutate the persisted settings');
});

test('cycle 1: only a real true value enables automatic locking', () => {
  const normalize = settingsNormalizer();
  for (const value of [false, undefined, null, '', 'true', 'false', 0, 1, [], {}]) {
    assert.equal(normalize({autoLockEnabled:value}).autoLockEnabled, false, `must not opt in from ${JSON.stringify(value)}`);
  }
  assert.equal(normalize({autoLockEnabled:true}).autoLockEnabled, true);
});

test('cycle 1: privacy lives in General and the default-off lock switch lives in Security', () => {
  const general = settingsPane('general');
  const security = settingsPane('security');
  const privacy = general.match(/<input\b[^>]*\bid="hideBalances"[^>]*>/)?.[0];
  const autoLock = enterprise.match(/<input\b[^>]*\bid="autoLockEnabled"[^>]*>/)?.[0];
  assert.ok(privacy, 'General exposes the privacy preference');
  assert.ok(autoLock, 'Security exposes the inactivity preference');
  assert.match(privacy, /\btype="checkbox"/);
  assert.match(autoLock, /\btype="checkbox"/);
  assert.match(autoLock, /\brole="switch"/);
  assert.doesNotMatch(privacy, /\bchecked(?:\s|=|>)/);
  assert.doesNotMatch(autoLock, /\bchecked(?:\s|=|>)/);
  assert.match(enterprise, /document\.querySelector\('\[data-settings-panel="security"\]'\)\.prepend\(autoLockSetting\)/,
    'the dynamic switch is mounted inside the Security pane');
  assert.match(enterprise, /Automatsko zaključavanje \(10 min neaktivnosti\)/);
  assert.doesNotMatch(general, /id="autoLockEnabled"/);
  assert.doesNotMatch(security, /id="hideBalances"/);
  assert.equal((html.match(/id="hideBalances"/g) || []).length, 1);
  assert.equal(((html + enterprise).match(/id="autoLockEnabled"/g) || []).length, 1);
});

test('cycle 1: no hidden-money trigger or stale button dereference remains in the top header', () => {
  const topbar = html.match(/<header class="topbar">([\s\S]*?)<\/header>/)?.[1];
  assert.ok(topbar);
  assert.doesNotMatch(topbar, /stealthToggle|hideBalances|Sakrij iznose|Privatni način/);
  assert.doesNotMatch(enterprise, /stealthToggle/);
  assert.match(enterprise, /function toggleStealth\(/, 'privacy shortcut functionality remains');
});

function shortcutHarness() {
  const start = enterprise.indexOf("document.addEventListener('keydown',event=>{", enterprise.indexOf('function toggleStealth'));
  const end = enterprise.indexOf('\n  });', start);
  assert.ok(start >= 0 && end > start, 'global privacy shortcut listener is present');
  let listener;
  let toggles = 0;
  const shell = {hidden:false};
  const security = {locked:false, isLocked() { return this.locked; }};
  vm.runInNewContext(enterprise.slice(start, end + '\n  });'.length), {
    document:{addEventListener(type, handler) { assert.equal(type, 'keydown'); listener = handler; }},
    window:{MerEnterpriseSecurity:security},
    el:id => id === 'appShell' ? shell : undefined,
    toggleStealth:() => { toggles += 1; },
    commandDialog:{open:false}, closeModal() {}, openCommands() {}
  });
  return {
    shell, security,
    press(options = {}) {
      let prevented = false;
      listener({key:'h', ctrlKey:false, metaKey:false, shiftKey:true, preventDefault() { prevented = true; }, ...options});
      return {toggles, prevented};
    }
  };
}

test('cycle 1: Ctrl/Command Shift H remains functional and is blocked before login and while locked', () => {
  const shortcut = shortcutHarness();
  assert.deepEqual(shortcut.press({ctrlKey:true}), {toggles:1, prevented:true});
  assert.deepEqual(shortcut.press({metaKey:true, key:'H'}), {toggles:2, prevented:true});
  assert.deepEqual(shortcut.press(), {toggles:2, prevented:false}, 'plain Shift H must not toggle privacy');
  assert.deepEqual(shortcut.press({ctrlKey:true, shiftKey:false}), {toggles:2, prevented:false});
  shortcut.shell.hidden = true;
  assert.deepEqual(shortcut.press({ctrlKey:true}), {toggles:2, prevented:false});
  shortcut.shell.hidden = false;
  shortcut.security.locked = true;
  assert.deepEqual(shortcut.press({metaKey:true}), {toggles:2, prevented:false});
});

test('cycle 1: Settings checkbox renders the current global privacy state in both directions', () => {
  const render = premium.match(/function renderPremiumSettings\(\) \{([\s\S]*?)\n  \}/)?.[0];
  assert.ok(render);
  const nodes = new Map();
  const appState = {settings:{currency:'EUR', dateFormat:'locale', timezone:'Europe/Zagreb', hideBalances:false, autoLockEnabled:false}};
  const context = {
    appState, currentLang:'hr', state:{accountLabel:'personalAccount'},
    $:id => { if (!nodes.has(id)) nodes.set(id, {}); return nodes.get(id); },
    window:{MerAuthProvider:{currentSession:() => ({demo:true})}, MerEnterpriseSecurity:{syncAutoLock() {}}},
    t:value => value,
    renderMfa() {}, renderActiveSessions() {}, renderAutomationRules() {}, renderImportReview() {}
  };
  vm.createContext(context);
  vm.runInContext(`${render};this.render=renderPremiumSettings;`, context);
  for (const hidden of [false, true, false]) {
    appState.settings.hideBalances = hidden;
    context.render();
    assert.equal(nodes.get('#hideBalances').checked, hidden);
  }
});

test('cycle 1: Security switch changes only its reactive preference and immediately resynchronizes the timer', () => {
  const start = enterprise.indexOf("el('autoLockEnabled').addEventListener('change',event=>{");
  const end = enterprise.indexOf('\n  });', start);
  assert.ok(start >= 0 && end > start);
  const render = enterprise.match(/function renderSecurity\(\)\{([\s\S]*?)\n  \}/)?.[0];
  assert.ok(render);
  const appState = {settings:{hideBalances:true, autoLockEnabled:false}, activeAccount:'personal', accounts:{personal:{balance:2840},business:{balance:9600}}};
  const accountsBefore = JSON.stringify(appState.accounts);
  const nodes = new Map();
  let change;
  let syncs = 0;
  let changes = 0;
  const context = {
    appState,
    el:id => {
      if (!nodes.has(id)) nodes.set(id, {addEventListener(type, callback) { assert.equal(type, 'change'); change = callback; }});
      return nodes.get(id);
    },
    window:{MerEnterpriseSecurity:{syncAutoLock() { syncs += 1; },status:() => ({demo:true, canInstall:false, encrypted:false})}},
    reactiveStore:{update(reason, mutate) { assert.equal(reason, 'auto-lock-preference'); changes += 1; mutate(appState); }},
    copy:hr => hr, showToast() {}, pinButton:{}, installButton:{}, securityStatus:{}
  };
  vm.createContext(context);
  vm.runInContext(`${enterprise.slice(start, end + '\n  });'.length)}\n${render};this.renderSecurity=renderSecurity;`, context);
  context.renderSecurity();
  assert.equal(nodes.get('autoLockEnabled').checked, false);
  for (const enabled of [true, false, true]) {
    change({target:{checked:enabled}});
    context.renderSecurity();
    assert.equal(appState.settings.autoLockEnabled, enabled);
    assert.equal(nodes.get('autoLockEnabled').checked, enabled);
    assert.equal(appState.settings.hideBalances, true, 'changing auto-lock preserves the independent privacy option');
    assert.equal(JSON.stringify(appState.accounts), accountsBefore, 'settings changes preserve both financial workspaces');
  }
  assert.equal(changes, 3);
  assert.equal(syncs, 3);
  assert.equal(nodes.get('autoLockLabel').textContent, 'Automatsko zaključavanje (10 min neaktivnosti)');
});

test('cycle 1: changing Settings tabs resets inherited body scroll so the first preference stays visible', () => {
  const select = premium.match(/function selectSettingsTab\(tab\) \{([\s\S]*?)\n  \}/)?.[0];
  assert.ok(select);
  function element(name, kind) {
    return {
      dataset:{[kind]:name}, attributes:{}, classes:{},
      classList:{toggle(key, value) { this.owner.classes[key] = value; }},
      setAttribute(key, value) { this.attributes[key] = value; }
    };
  }
  const tabs = ['general', 'security', 'automation'].map(name => element(name, 'settingsTab'));
  const panels = ['general', 'security', 'automation'].map(name => element(name, 'settingsPanel'));
  for (const node of [...tabs, ...panels]) node.classList.owner = node;
  let body = {scrollTop:560};
  const context = {
    selectedSettingsTab:'general',
    $:selector => { assert.equal(selector, '#bankSettingsModal .settings-modal-body'); return body; },
    $$:selector => {
      assert.ok(['[data-settings-tab]', '[data-settings-panel]'].includes(selector));
      return selector === '[data-settings-tab]' ? tabs : panels;
    }
  };
  vm.createContext(context);
  vm.runInContext(`${select};this.select=selectSettingsTab;`, context);
  for (const [requested, expected] of [['security', 'security'], ['automation', 'automation'], ['general', 'general'], ['unknown', 'general']]) {
    body.scrollTop = 560;
    context.select(requested);
    assert.equal(body.scrollTop, 0, `${requested}: old tab scroll cannot hide the next tab's first control`);
    assert.equal(context.selectedSettingsTab, expected);
    for (const tab of tabs) {
      const active = tab.dataset.settingsTab === expected;
      assert.equal(tab.classes.active, active);
      assert.equal(tab.attributes['aria-selected'], String(active));
      assert.equal(tab.tabIndex, active ? 0 : -1);
    }
    for (const panel of panels) {
      const active = panel.dataset.settingsPanel === expected;
      assert.equal(panel.hidden, !active);
      assert.equal(panel.classes.active, active);
    }
  }
  body = null;
  assert.doesNotThrow(() => context.select('security'), 'missing scroll wrapper during teardown remains safe');
});
