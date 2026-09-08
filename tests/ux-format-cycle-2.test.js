'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../core.js');

const numericText = value => value.replaceAll('\u2212', '-').replace(/[^0-9.,-]/g, '');
const currencies = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'KWD', 'BHD'];

test('cycle 2: currency policy preserves cents across supported and foreign receipt currencies', () => {
  for (const currency of currencies) {
    for (const [locale, expected] of [['hr-HR', '1.234,50'], ['en-IE', '1,234.50']]) {
      assert.equal(numericText(core.formatCurrency(1234.5, {currency, locale})), expected, `${currency} in ${locale}`);
      assert.equal(numericText(core.formatCurrency(-1234.5, {currency, locale})), `-${expected}`, `negative ${currency} in ${locale}`);
    }
  }
});

test('cycle 2: rounded zero never carries decimals or a minus sign in any currency', () => {
  for (const currency of currencies) {
    for (const value of [0, -0, 0.004, -0.004, NaN, Infinity, undefined]) {
      assert.equal(numericText(core.formatCurrency(value, {currency, locale:'hr-HR'})), '0', `${currency}, ${String(value)}`);
    }
  }
});

test('cycle 2: only whole category budget limits opt out of the two decimal policy', () => {
  for (const currency of currencies) {
    assert.equal(numericText(core.formatCurrency(150, {currency, locale:'hr-HR'})), '150,00');
    assert.equal(numericText(core.formatCurrency(150, {currency, locale:'hr-HR', categoryBudgetLimit:true})), '150');
    assert.equal(numericText(core.formatCurrency(150.01, {currency, locale:'hr-HR', categoryBudgetLimit:true})), '150,01');
  }
});

test('cycle 2: exact cent inputs remain unchanged over positive and negative display ranges', () => {
  for (const cents of [1, 9, 10, 99, 101, 123456, 99999999999, 1000000000000]) {
    for (const sign of [1, -1]) {
      const rendered = core.formatCurrency(sign * cents / 100, {currency:'EUR', locale:'en-IE'});
      const actual = Number(numericText(rendered).replaceAll(',', ''));
      assert.equal(Math.round(actual * 100), sign * cents, `${sign * cents} cents`);
    }
  }
});

function pointerHarness() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'runtime.js'), 'utf8');
  const window = {PointerEvent:function PointerEvent() {}, addEventListener() {}, location:{reload() {}}};
  vm.runInNewContext(source, {window, document:{}});
  const listeners = new Map();
  const dialog = {
    addEventListener(type, listener) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(listener); },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
    getBoundingClientRect:() => ({left:16, right:359, top:24, bottom:600}),
    emit(type, values = {}) {
      const event = {target:dialog, pointerId:1, isPrimary:true, button:0, clientX:8, clientY:8, ...values};
      for (const listener of listeners.get(type) || []) listener(event);
    }
  };
  let closed = 0;
  const unbind = window.MerRuntime.bindDialogBackdropDismiss(dialog, () => { closed += 1; });
  return {dialog, unbind, closed:() => closed};
}

test('cycle 2: a touch backdrop dismisses only after the same primary pointer releases', () => {
  const env = pointerHarness();
  env.dialog.emit('pointerdown');
  env.dialog.emit('pointerup', {pointerId:2});
  assert.equal(env.closed(), 0);
  env.dialog.emit('pointerup');
  assert.equal(env.closed(), 1);
  env.dialog.emit('pointerdown', {isPrimary:false, pointerId:2});
  env.dialog.emit('pointerup', {isPrimary:false, pointerId:2});
  assert.equal(env.closed(), 1);
});

test('cycle 2: canceled touches and drags from dialog content do not dismiss it', () => {
  const env = pointerHarness();
  env.dialog.emit('pointerdown');
  env.dialog.emit('pointercancel');
  env.dialog.emit('pointerup');
  assert.equal(env.closed(), 0);
  env.dialog.emit('pointerdown', {target:{tagName:'INPUT'}, clientX:50, clientY:100});
  env.dialog.emit('pointerup');
  assert.equal(env.closed(), 0);
  env.dialog.emit('pointerdown');
  env.dialog.emit('close');
  env.dialog.emit('pointerup');
  assert.equal(env.closed(), 0);
  env.unbind();
  env.dialog.emit('pointerdown');
  env.dialog.emit('pointerup');
  assert.equal(env.closed(), 0);
});

function planHarness() {
  const nodes = new Map(), frames = [], opened = [], closed = [];
  const state = {activeProfile:'personal', language:'en'};
  let locked = false;
  const document = {activeElement:null, getElementById:id => nodes.get(id), createElement:tag => node('', tag)};
  function node(id = '', tagName = 'DIV') {
    const item = {
      id, tagName:tagName.toUpperCase(), open:false, hidden:false, disabled:false, isConnected:true,
      dataset:{}, children:[], attributes:[],
      contains(target) { return this === target || this.children.some(child => child.contains(target)); },
      getClientRects() { return this.hidden || !this.isConnected ? [] : [{}]; },
      getAttribute(name) { return this.attributes.find(attr => attr.name === name)?.value ?? null; },
      closest(selector) { return selector === '[data-suite-action]' && this.dataset.suiteAction ? this : null; },
      addEventListener(type, callback) { this[type] = callback; },
      prepend(child) { this.children.unshift(child); },
      focus() { document.activeElement = this; },
      querySelector(selector) {
        if (selector === 'header') return this.children.find(child => child.tagName === 'HEADER') || null;
        if (selector === '[data-plan-back]') return this.descendants().find(child => child.dataset.planBack !== undefined) || null;
        return null;
      },
      descendants() { return this.children.flatMap(child => [child, ...child.descendants()]); },
      querySelectorAll(selector) {
        return this.descendants().filter(child => selector === '[data-suite-action]' ? Boolean(child.dataset.suiteAction) : ['BUTTON','INPUT','SELECT','TEXTAREA','A'].includes(child.tagName));
      }
    };
    if (id) nodes.set(id, item);
    return item;
  }
  const shell = node('appShell');
  const plan = node('intelligenceModal', 'DIALOG');
  const action = node('openReceiptFromPlan', 'BUTTON'); action.dataset.suiteAction = 'receipt'; plan.children.push(action);
  const receipt = node('receiptMatcherModal', 'DIALOG'); receipt.children.push(node('', 'HEADER'));
  const window = {
    MerEnterpriseBridge:{
      getState:() => state, currentUser:() => ({userId:'user-one'}),
      closeModal(dialog) { dialog.open = false; closed.push(dialog.id); }
    },
    MerEnterpriseUI:{openIntelligence(tab) { plan.open = true; opened.push(tab); }},
    MerEnterpriseSecurity:{isLocked:() => locked}
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'plan-navigation.js'), 'utf8'), {window, document, requestAnimationFrame:callback => frames.push(callback)});
  return {api:window.MerPlanNavigation, node, state, document, shell, plan, action, receipt, opened, closed, lock:() => { locked = true; }, flush:() => { while (frames.length) frames.shift()(); }};
}

test('cycle 2: receipt Back returns to Plan and restores its originating action', () => {
  const env = planHarness();
  env.plan.open = true; env.action.focus();
  env.api.enter(env.receipt); env.api.enhance(env.receipt);
  assert.ok(env.receipt.querySelector('[data-plan-back]'), 'the real receipt dialog receives a Back control');
  env.plan.open = false; env.receipt.open = true;
  env.api.back(env.receipt); env.flush();
  assert.deepEqual(env.closed, ['receiptMatcherModal']);
  assert.deepEqual(env.opened, ['forecast']);
  assert.equal(env.document.activeElement, env.action);
});

test('cycle 2: Back cannot reopen a Plan from another profile or a locked session', () => {
  for (const mutate of [env => { env.state.activeProfile = 'business'; }, env => env.lock(), env => { env.shell.hidden = true; }]) {
    const env = planHarness();
    env.plan.open = true; env.action.focus(); env.api.enter(env.receipt);
    env.plan.open = false; env.receipt.open = true; mutate(env);
    env.api.back(env.receipt); env.flush();
    assert.equal(env.receipt.open, false);
    assert.deepEqual(env.opened, []);
  }
});

test('cycle 2: redraw restores equivalent controls by ID or data identity', () => {
  for (const byId of [true, false]) {
    const env = planHarness(); env.receipt.open = true;
    const original = env.node(byId ? 'receiptManual' : '', 'BUTTON');
    original.attributes = byId ? [] : [{name:'data-household-tab', value:'members'}];
    env.receipt.children.push(original); original.focus();
    const restore = env.api.preserveFocus(env.receipt);
    original.isConnected = false; env.receipt.children = env.receipt.children.filter(child => child !== original);
    const replacement = env.node(byId ? 'receiptManual' : '', 'BUTTON'); replacement.attributes = [...original.attributes];
    env.receipt.children.push(replacement);
    restore();
    assert.equal(env.document.activeElement, replacement);
  }
});

test('cycle 2: redraw leaves outside focus untouched and skips a removed disabled control', () => {
  const env = planHarness(); env.receipt.open = true;
  env.action.focus(); const outside = env.api.preserveFocus(env.receipt); outside();
  assert.equal(env.document.activeElement, env.action);
  const original = env.node('lastPage', 'BUTTON'); env.receipt.children.push(original); original.focus();
  const restore = env.api.preserveFocus(env.receipt); original.isConnected = false;
  const disabled = env.node('lastPage', 'BUTTON'); disabled.disabled = true;
  const enabled = env.node('firstPage', 'BUTTON'); env.receipt.children = [disabled, enabled];
  restore();
  assert.equal(env.document.activeElement, enabled);
});

function namedFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} exists`);
  const body = source.indexOf('{', start);
  let depth = 0;
  for (let index = body; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}' && --depth === 0) return source.slice(start, index + 1);
  }
  assert.fail(`${name} has a complete body`);
}

function modalFocusHarness() {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const dialogs = [], document = {activeElement:null};
  const control = (id, options = {}) => ({id, hidden:false, disabled:false, visible:true, getClientRects() { return this.visible ? [{}] : []; }, focus() { document.activeElement = this; }, ...options});
  const dialog = (id, items = []) => {
    const modal = control(id, {open:true, items, contains(target) { return target === this || this.items.includes(target); }});
    dialogs.push(modal); return modal;
  };
  const scope = {
    document,
    $$(selector, modal) {
      return modal ? modal.items.filter(item => !item.disabled) : dialogs.filter(item => item.open);
    }
  };
  vm.createContext(scope);
  vm.runInContext(`${namedFunction(app, 'focusableElements')}\n${namedFunction(app, 'trapOpenModalFocus')}`, scope);
  const event = (values = {}) => ({key:'Tab', shiftKey:false, defaultPrevented:false, stopped:false, preventDefault() { this.defaultPrevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...values});
  const dispatch = values => { const key = event(values); scope.trapOpenModalFocus(key); return key; };
  return {document, control, dialog, scope, event, dispatch};
}

test('cycle 2: dynamic modal traps Shift+Tab at its first control and Tab at its last', () => {
  const env = modalFocusHarness();
  const first = env.control('fireBack'), middle = env.control('fireAmount'), last = env.control('fireClose');
  env.dialog('fireSimulatorModal', [first, middle, last]);
  first.focus(); assert.equal(env.dispatch({shiftKey:true}).defaultPrevented, true); assert.equal(env.document.activeElement, last);
  assert.equal(env.dispatch().defaultPrevented, true); assert.equal(env.document.activeElement, first);
  middle.focus(); assert.equal(env.dispatch().defaultPrevented, false); assert.equal(env.document.activeElement, middle);
});

test('cycle 2: dynamic modal recovers outside focus and excludes hidden and disabled controls', () => {
  const env = modalFocusHarness();
  const first = env.control('receiptBack'), last = env.control('receiptClose');
  env.dialog('receiptMatcherModal', [env.control('hidden', {hidden:true}), env.control('disabled', {disabled:true}), first, last, env.control('unrendered', {visible:false})]);
  const body = env.control('body'); body.focus();
  assert.equal(env.dispatch().defaultPrevented, true); assert.equal(env.document.activeElement, first);
  body.focus(); assert.equal(env.dispatch({shiftKey:true}).defaultPrevented, true); assert.equal(env.document.activeElement, last);
});

test('cycle 2: closed dialogs and already handled keys are untouched; empty dialog retains focus', () => {
  const env = modalFocusHarness();
  const first = env.control('first'), last = env.control('last');
  const modal = env.dialog('dynamicDialog', [first, last]);
  first.focus(); env.dispatch({shiftKey:true, defaultPrevented:true}); assert.equal(env.document.activeElement, first);
  assert.equal(env.dispatch({key:'Escape'}).defaultPrevented, false); assert.equal(env.document.activeElement, first);
  modal.open = false;
  assert.equal(env.dispatch({shiftKey:true}).defaultPrevented, false); assert.equal(env.document.activeElement, first);
  modal.open = true; modal.items = [];
  assert.equal(env.dispatch().defaultPrevented, true); assert.equal(env.document.activeElement, modal);
});

test('cycle 2: wizard capture owns its controls without a second modal trap', () => {
  const env = modalFocusHarness();
  const modalFirst = env.control('settingsClose'), modalLast = env.control('settingsLast');
  env.dialog('bankSettingsModal', [modalFirst, modalLast]);
  const wizardFirst = env.control('wizardFirst'), wizardMiddle = env.control('wizardMiddle'), wizardLast = env.control('wizardLast');
  const wizardItems = [wizardFirst, wizardMiddle, wizardLast];
  const onboarding = fs.readFileSync(path.join(__dirname, '..', 'onboarding.js'), 'utf8');
  Object.assign(env.scope, {tour:{hidden:false}, ownedDialog:null, popover:{contains:target => wizardItems.includes(target)}, focusableInPopover:() => wizardItems, dismissTour() {}});
  vm.runInContext(namedFunction(onboarding, 'handleTourKeydown'), env.scope);
  for (const [initial, expected, shiftKey] of [[wizardMiddle, wizardMiddle, false], [wizardFirst, wizardLast, true], [wizardLast, wizardFirst, false]]) {
    initial.focus(); const key = env.event({shiftKey});
    env.scope.handleTourKeydown(key);
    if (!key.stopped) env.scope.trapOpenModalFocus(key);
    assert.equal(key.stopped, true, 'wizard prevents its event reaching the bubbling dialog trap');
    assert.equal(env.document.activeElement, expected);
  }
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  assert.equal((app.match(/document\.addEventListener\('keydown',\s*trapOpenModalFocus\);/g) || []).length, 1, 'one bubbling modal trap handles dialogs created after startup');
  assert.match(onboarding, /document\.addEventListener\('keydown',\s*handleTourKeydown,\s*true\)/);
});

test('cycle 2: Plan toolbar dispatches each action once through its permanent delegated listener', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'enterprise-ui.js'), 'utf8');
  const listeners = source.split(/\r?\n/).filter(line => /^\s*suiteTools\.addEventListener\('click'/.test(line));
  assert.equal(listeners.filter(line => line.includes("const action=")).length, 1, 'the shared Plan tools listener is installed once');
  const callbacks = [], calls = [];
  vm.runInNewContext(listeners.join('\n'), {
    suiteTools:{addEventListener(type, callback) { assert.equal(type, 'click'); callbacks.push(callback); }},
    openTaxVault:() => calls.push('tax'),
    window:{MerReceiptUI:{open:() => calls.push('receipt')}, MerPlanningUI:{open:action => calls.push(action)}, MerHouseholdUI:{open:() => calls.push('household')}}
  });
  for (const action of ['receipt', 'fire', 'renewals', 'household', 'tax']) {
    for (const callback of callbacks) callback({target:{closest:() => ({dataset:{suiteAction:action}})}});
  }
  assert.deepEqual(calls, ['receipt', 'fire', 'renewals', 'household', 'tax']);
});
