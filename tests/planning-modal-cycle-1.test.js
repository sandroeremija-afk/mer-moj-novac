'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Core = require('../core.js');
const Planning = require('../planning-core.js');
const source = fs.readFileSync(require.resolve('../planning-ui.js'), 'utf8');

// A small DOM harness executes the UI module and its real input/click handlers.
// It deliberately retains element identity, so replacing an active form fails tests.
class Element {
  constructor(tag, document) {
    this.tagName = tag.toLowerCase(); this.document = document; this.children = []; this.attributes = {};
    this.dataset = {}; this.listeners = new Map(); this.open = false; this.hidden = false;
    this.disabled = false; this.value = ''; this.className = ''; this.id = '';
    this.classList = {contains:name => this.className.split(/\s+/).includes(name)};
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
    if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
    if (['id','type','value','min','max','name'].includes(name)) this[name] = value;
    if (name === 'class') this.className = value;
    if (['disabled','hidden'].includes(name)) this[name] = true;
  }
  append(child) {child.parentElement = this; this.children.push(child);}
  set innerHTML(value) {
    this._html = value; this.children.forEach(child => {child.parentElement = null;}); this.children = [];
    const stack = [this], voidTags = new Set(['input','br','hr','img','meta','link']);
    for (const match of value.matchAll(/<(\/?)([a-z][\w-]*)(\s+(?:[^>"']|"[^"]*"|'[^']*')*)?\s*(\/?)>/gi)) {
      const [, closing, tag, raw = '', selfClosing] = match;
      if (closing) {if (stack.length > 1) stack.pop(); continue;}
      const child = new Element(tag, this.document);
      for (const attribute of raw.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
        child.setAttribute(attribute[1], attribute[2] ?? attribute[3] ?? attribute[4] ?? '');
      }
      stack.at(-1).append(child);
      if (!voidTags.has(tag.toLowerCase()) && !selfClosing && !raw.trimEnd().endsWith('/')) stack.push(child);
    }
  }
  get innerHTML() {return this._html || '';}
  matches(selector) {
    if (selector.startsWith('#')) return this.id === selector.slice(1);
    if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
    const attribute = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if (attribute) return Object.hasOwn(this.attributes, attribute[1]) && (attribute[2] === undefined || this.attributes[attribute[1]] === attribute[2]);
    return this.tagName === selector;
  }
  querySelectorAll(selector) {
    const selectors = selector.split(',').map(item => item.trim()), found = [];
    const visit = node => node.children.forEach(child => {if(selectors.some(item => child.matches(item)))found.push(child);visit(child);});
    visit(this); return found;
  }
  querySelector(selector) {return this.querySelectorAll(selector)[0] || null;}
  closest(selector) {return this.matches(selector) ? this : this.parentElement?.closest(selector) || null;}
  addEventListener(name, callback) {if(!this.listeners.has(name))this.listeners.set(name, []);this.listeners.get(name).push(callback);}
  dispatch(name, data = {}) {
    const event = {target:this, defaultPrevented:false, preventDefault(){this.defaultPrevented=true;}, ...data};
    for (let node = this; node; node = name === 'input' || name === 'click' ? node.parentElement : null) {
      event.currentTarget = node;
      for (const callback of node.listeners.get(name) || []) callback(event);
      node[`on${name}`]?.(event);
    }
    return event;
  }
  click() {return this.dispatch('click');}
  focus() {this.document.activeElement = this;}
  showModal() {assert.equal(this.document.body.querySelectorAll('dialog').filter(node => node.open).length, 0);this.open = true;}
  close() {this.open = false;this.dispatch('close');}
}
function harness() {
  const document = {hidden:false, activeElement:null, addEventListener(){}};
  document.body = new Element('body', document);
  document.createElement = tag => new Element(tag, document);
  document.getElementById = id => document.body.querySelector(`#${id}`);
  const account = (id, income, savings) => ({profileId:id, accountName:id, income, savingsBalance:savings, savingsTarget:income/5,
    derived:{monthly:{income, expenses:income/2}}, enterprise:{renewals:[]}, transactions:[], goalBuckets:[]});
  const appState = {activeAccount:'personal', settings:{currency:'EUR', timezone:'Europe/Zagreb'},
    accounts:{personal:account('personal', 4000, 10000), business:account('business', 12000, 50000)}};
  const updates = [], subscriptions = [], backCalls = [];
  const reactiveStore = {
    subscribe:callback => subscriptions.push(callback),
    update(reason, change) {updates.push(reason);change(appState, appState.accounts[appState.activeAccount]);subscriptions.forEach(callback => callback());}
  };
  const window = {document, MerCore:Core, MerPlanningCore:Planning, dispatchEvent(){},
    MerRuntime:{bindDialogBackdropDismiss(dialog, callback){dialog.dismissBackdrop = callback;}},
    MerEnterpriseBridge:{openModal:dialog => dialog.showModal(), closeModal:dialog => dialog.close()},
    MerPlanNavigation:{back(dialog){backCalls.push(dialog.id);dialog.close();}}};
  const context = vm.createContext({window, document, appState, currentLang:'en', reactiveStore, showToast(){},
    CustomEvent:class {constructor(type, options){this.type=type;Object.assign(this, options);}},
    FormData:class {constructor(form){this.form=form;}get(name){return this.form.querySelector(`[name="${name}"]`)?.value ?? null;}}, Intl, Date, URL, Blob, setTimeout});
  vm.runInContext(source, context);
  const get = id => document.getElementById(id);
  const input = (id, value) => {const node=get(id);node.focus();node.value=String(value);node.dispatch('input');return node;};
  const switchProfile = id => {appState.activeAccount=id;subscriptions.forEach(callback => callback());};
  return {window, document, appState, reactiveStore, updates, backCalls, get, input, switchProfile, ui:window.MerPlanningUI};
}

{
  const h = harness();
  h.ui.open('fire');
  const fire = h.get('fireSimulatorModal'), renewals = h.get('subscriptionRenewalsModal');
  assert.equal(fire.open, true);assert.equal(renewals.open, false);
  assert.equal(fire.tagName, 'dialog');assert.equal(renewals.tagName, 'dialog');
  assert.equal(h.get('planningModal'), null);
  assert.equal(fire.querySelectorAll('[data-planning-tab]').length, 0);
  assert.equal(renewals.querySelector('#fireInputs'), null);
  assert.equal(fire.querySelector('#renewalForm'), null);
  assert.equal(fire.querySelector('[data-planning-back]').hidden, false);
  const before = h.get('fireProjection').innerHTML;
  h.input('fire-savingsRate', 50);
  assert.equal(h.get('fire-monthlyContribution').value, '2000');
  assert.equal(h.get('fireSavingsRateValue').textContent, '50.0%');
  assert.notEqual(h.get('fireProjection').innerHTML, before, 'savings slider recomputes the target date and chart');
  assert.deepEqual(h.updates, [], 'moving a slider cannot write profile finances');
  assert.equal(h.appState.accounts.personal.enterprise.firePlan, undefined);
  const form = h.get('fireInputs'), field = h.input('fire-annualReturn', 7.5);
  h.reactiveStore.update('unrelated-setting', state => {state.settings.theme='dark';});
  assert.equal(h.get('fireInputs'), form, 'store renders retain the existing form');
  assert.equal(h.get('fire-annualReturn'), field);
  assert.equal(h.document.activeElement, field);
  assert.equal(field.value, '7.5');
  fire.querySelector('[data-planning-back]').click();
  assert.deepEqual(h.backCalls, ['fireSimulatorModal']);
  assert.equal(fire.open, false);
  h.ui.open('fire');
  assert.equal(h.get('fire-annualReturn').value, '7.5');
  assert.equal(h.get('fire-monthlyContribution').value, '2000', 'Back retains this profile’s scenario');
  h.input('fire-netWorth', '');
  assert.equal(h.get('saveFirePlan').disabled, true);
  h.ui.render();
  assert.equal(h.get('fire-netWorth').value, '', 'an unfinished numeric edit survives rendering');
  h.input('fire-netWorth', 750000);
  assert.equal(h.get('saveFirePlan').disabled, false);
  h.get('saveFirePlan').click();
  assert.equal(h.appState.accounts.personal.enterprise.firePlan.netWorth, 750000);
  assert.equal(h.appState.accounts.personal.enterprise.firePlan.annualReturn, 7.5);
  assert.equal(h.appState.accounts.personal.savingsBalance, 10000, 'saving assumptions does not change finance totals');
  assert.equal(h.appState.accounts.personal.savingsTarget, 800);
  h.ui.open('renewals');
  assert.equal(fire.open, false);assert.equal(renewals.open, true);
  assert.ok(renewals.querySelector('#renewalForm'));
  assert.equal(renewals.querySelector('[data-planning-back]').hidden, false);
  const editor = h.get('renewalForm'), name = editor.querySelector('input');
  name.value = 'Unfinished renewal';name.focus();
  h.reactiveStore.update('unrelated-setting', state => {state.settings.theme='light';});
  assert.equal(h.get('renewalForm'), editor);
  assert.equal(name.value, 'Unfinished renewal');assert.equal(h.document.activeElement, name);
  renewals.querySelector('[data-planning-back]').click();
  assert.deepEqual(h.backCalls, ['fireSimulatorModal','subscriptionRenewalsModal']);
  h.ui.open('renewals');assert.equal(h.get('renewalForm'), editor);
  assert.equal(renewals.dispatch('cancel').defaultPrevented, true);assert.equal(renewals.open, false);
  h.ui.open('fire');fire.dismissBackdrop();assert.equal(fire.open, false);
  delete h.window.MerPlanNavigation;
  h.ui.open('fire');fire.querySelector('[data-planning-back]').click();assert.equal(fire.open, false, 'Back closes without a navigation manager');
}
{
  const h = harness();h.ui.open('fire');h.input('fire-netWorth', 123456);
  h.switchProfile('business');
  assert.equal(h.get('fireSimulatorModal').open, false, 'profile switch closes the old profile’s dialog');
  h.ui.open('fire');
  assert.equal(h.get('fire-netWorth').value, '50000');
  assert.equal(h.get('fire-monthlyContribution').value, '2400');
  h.input('fire-annualReturn', 6);
  h.reactiveStore.update('new-business-balance', (_, account) => {account.savingsBalance=88000;account.derived.monthly.income=16000;});
  assert.equal(h.get('fire-netWorth').value, '88000', 'untouched defaults remain reactive');
  assert.equal(h.get('fireSavingsRateValue').textContent, '15.0%');
  h.switchProfile('personal');h.ui.open('fire');
  assert.equal(h.get('fire-netWorth').value, '123456', 'personal draft survives a round trip without sharing business values');
  assert.equal(h.get('fire-annualReturn').value, '5');
  h.ui.close();
  h.appState.accounts.personal = {...h.appState.accounts.personal, savingsBalance:42};
  h.ui.open('fire');
  assert.equal(h.get('fire-netWorth').value, '42', 'replacing an account or user cannot inherit an old in-memory draft');
  h.switchProfile('business');h.ui.open('renewals');
  assert.equal(h.get('planningRenewals').querySelector('.planning-tax'), null, 'tax vault has its own module');
}
{
  const h = harness();h.appState.accounts.personal.income=0;h.appState.accounts.personal.derived.monthly.income=0;
  h.ui.open('fire');
  assert.equal(h.get('fire-savingsRate').disabled, true);
  assert.equal(h.get('fireSavingsRateValue').textContent, '—');
  h.input('fire-monthlyContribution', 300);
  assert.equal(h.get('saveFirePlan').disabled, false, 'direct contribution remains available with no income');
}
{
  const h = harness();h.ui.open('renewals');
  const form = h.get('renewalForm');
  const values = {name:'Annual workspace', cadence:'annual', anchorDate:'2027-09-08', amount:'250', currency:'EUR'};
  for (const [name, value] of Object.entries(values)) form.querySelector(`[name="${name}"]`).value = value;
  form.dispatch('submit');
  const rule = h.appState.accounts.personal.enterprise.renewals[0];
  assert.equal(rule.name, 'Annual workspace');assert.equal(rule.amount, 250);
  assert.notEqual(h.get('renewalForm'), form, 'successful Save starts a fresh editor');
  h.get('planningRenewals').querySelector(`[data-edit-renewal="${rule.id}"]`).click();
  const edit = h.get('renewalForm');
  assert.equal(edit.querySelector('[name="name"]').value, 'Annual workspace');
  edit.querySelector('[name="cadence"]').value = 'annual';
  edit.querySelector('[name="amount"]').value = '300';
  edit.dispatch('submit');
  assert.equal(h.appState.accounts.personal.enterprise.renewals.length, 1);
  assert.equal(h.appState.accounts.personal.enterprise.renewals[0].amount, 300);
  assert.equal(h.appState.accounts.personal.enterprise.renewals[0].previousAmount, 250);
  h.get('planningRenewals').querySelector(`[data-delete-renewal="${rule.id}"]`).click();
  assert.equal(h.appState.accounts.personal.enterprise.renewals.length, 0);
  assert.equal(h.appState.accounts.business.enterprise.renewals.length, 0, 'renewal edits stay in the active profile');
}
process.stdout.write('Planning modal cycle 1: independent dialogs, Back/Escape/backdrop, live FIRE controls, profile drafts and stable renewal forms passed.\n');
