'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../module-toolbar.js'), 'utf8');
const css = fs.readFileSync(require.resolve('../module-toolbar.css'), 'utf8');

// Execute the real enhancement against DOM nodes with bubbling/capture listeners.
// Identity assertions ensure the controls retain their original application handlers.
class Node {
  constructor(tag, doc) {
    this.tagName = tag; this.ownerDocument = doc; this.children = []; this.listeners = new Map();
    this.attributes = new Map(); this.style = {}; this.className = ''; this.hidden = false;
    this.disabled = false; this.scrollHeight = 320; this._text = '';
    this.classList = {
      contains: value => this.className.split(/\s+/).includes(value),
      add: value => { if (!this.classList.contains(value)) this.className += ` ${value}`; },
      remove: value => { this.className = this.className.split(/\s+/).filter(item => item !== value).join(' '); }
    };
  }
  get isConnected() { return this === this.ownerDocument || Boolean(this.parentElement?.isConnected); }
  get tabIndex() { return Number(this.getAttribute('tabindex') || 0); }
  set tabIndex(value) { this.setAttribute('tabindex', String(value)); }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this._text = value; this.children.forEach(child => { child.parentElement = null; }); this.children = []; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  hasAttribute(name) { return this.attributes.has(name); }
  removeAttribute(name) { this.attributes.delete(name); }
  append(...nodes) {
    for (const node of nodes) {
      if (node.parentElement) node.parentElement.children = node.parentElement.children.filter(child => child !== node);
      node.parentElement = this; this.children.push(node);
    }
  }
  prepend(node) { this.append(node); this.children = [node, ...this.children.filter(child => child !== node)]; }
  contains(node) { return this === node || this.children.some(child => child.contains(node)); }
  matches(selector) {
    return selector.split(',').some(part => {
      const value = part.trim();
      if (value.startsWith('#')) return this.id === value.slice(1);
      const match = value.match(/^([a-z]+)?(?:\.([\w-]+))?(?:\[([\w-]+)(?:="([^"]*)")?\])?$/);
      if (!match) throw new Error(`Unhandled test selector ${value}`);
      const [, tag, cls, attr, wanted] = match;
      return (!tag || tag === this.tagName) && (!cls || this.classList.contains(cls)) &&
        (!attr || (attr === 'open' ? this.open : this.hasAttribute(attr)) && (wanted === undefined || this.getAttribute(attr) === wanted));
    });
  }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
  querySelectorAll(selector) {
    const result = [];
    for (const child of this.children) { if (child.matches(selector)) result.push(child); result.push(...child.querySelectorAll(selector)); }
    return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  addEventListener(type, listener, capture = false) {
    const listeners = this.listeners.get(type) || []; listeners.push({listener, capture:!!capture}); this.listeners.set(type, listeners);
  }
  dispatch(type, extra = {}) {
    const event = {type, target:this, defaultPrevented:false, propagationStopped:false,
      preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.propagationStopped = true; }, ...extra};
    const path = []; for (let node = this; node; node = node.parentElement) path.push(node);
    for (const capture of [true, false]) {
      for (const node of capture ? [...path].reverse() : path) {
        event.currentTarget = node;
        (node.listeners.get(type) || []).filter(item => item.capture === capture).forEach(item => item.listener(event));
        if (event.propagationStopped) return event;
      }
    }
    return event;
  }
  click() { return this.dispatch('click'); }
  focus() { this.ownerDocument.activeElement = this; this.dispatch('focusin'); }
  scrollIntoView() {}
  getBoundingClientRect() {
    return this.rect || (this.classList.contains('module-toolbar-menu') ? {width:310, height:322, top:0, bottom:322, left:0, right:310} : {top:92, bottom:136, left:178, right:332, width:154, height:44});
  }
  showPopover() { this.popoverOpen = true; }
  hidePopover() { this.popoverOpen = false; }
}

function harness() {
  const document = new Node('document'); document.ownerDocument = document;
  document.documentElement = new Node('html', document); document.documentElement.lang = 'hr';
  document.body = new Node('body', document); document.append(document.documentElement); document.documentElement.append(document.body);
  document.createElement = tag => new Node(tag, document);
  document.createElementNS = (_, tag) => new Node(tag, document);
  document.getElementById = id => document.querySelector(`#${id}`);
  const calls = [], existing = {}, frames = [], microtasks = [];
  const button = (id, label, cls) => { const node = document.createElement('button'); node.id = id; node.textContent = label; node.className = cls; return node; };
  const ids = ['overviewView', 'budgetsView', 'savingsView', 'activityView', 'insightsView'];
  ids.forEach((id, index) => {
    const view = document.createElement('section'); view.id = id; view.hidden = index !== 0;
    const heading = document.createElement('div'); heading.className = 'heading-actions'; view.append(heading); document.body.append(view);
    const first = button(`${id}Detail`, 'Detalji', 'secondary-button');
    const second = button(`${id}Export`, 'Izvoz', 'secondary-button');
    const primary = button(`${id}Primary`, 'Dodaj transakciju', 'primary-button');
    first.addEventListener('click', () => calls.push({id:first.id, focused:document.activeElement?.id}));
    second.addEventListener('click', () => calls.push({id:second.id, focused:document.activeElement?.id}));
    const pair = document.createElement('div'); pair.className = 'data-action-pair'; pair.append(first, second);
    if (id === 'activityView') heading.append(pair, primary); else heading.append(first, second, primary);
    existing[id] = {view, heading, first, second, primary, pair};
  });
  const business = button('openEnterpriseInvoice', 'e-Račun', 'secondary-button'); business.hidden = true;
  const offline = button('offlineStatus', 'Nacrti · 2', 'offline-status'); offline.hidden = true;
  existing.overviewView.heading.prepend(business); existing.activityView.heading.prepend(offline);
  const events = new Node('window', document);
  const window = {document, innerWidth:375, innerHeight:667,
    getComputedStyle:node => ({display:node.hidden ? 'none' : 'flex'}),
    requestAnimationFrame:callback => { frames.push(callback); return frames.length; },
    queueMicrotask:callback => microtasks.push(callback),
    addEventListener:events.addEventListener.bind(events)};
  vm.runInNewContext(source, {window});
  const get = id => document.getElementById(id);
  const flush = () => { while (microtasks.length) microtasks.shift()(); while (frames.length) frames.shift()(); };
  const switchView = id => { Object.entries(existing).forEach(([key, value]) => { value.view.hidden = key !== id; }); window.MerModuleToolbar.refresh(); flush(); };
  return {window, document, existing, calls, business, offline, get, flush, switchView, events, ui:window.MerModuleToolbar};
}

{
  const h = harness();
  for (const [id, original] of Object.entries(h.existing)) {
    const menu = h.get(`${id}OptionsMenu`);
    assert.equal(original.heading.children.filter(node => node.classList.contains('primary-button')).length, 1);
    assert.ok(menu.contains(original.first)); assert.ok(menu.contains(original.second));
    assert.equal(h.get(original.first.id), original.first, 'Original node and bound handler must survive');
    assert.equal(h.get(`${id}MoreOptions`).getAttribute('aria-haspopup'), 'menu');
    assert.equal(menu.getAttribute('role'), 'menu');
    assert.equal(menu.hidden, true);
    if (id === 'activityView') assert.ok(menu.contains(original.pair), 'Grouped import/export wrapper retained');
  }
  assert.ok(h.get('overviewViewOptionsMenu').contains(h.business));
  assert.ok(h.get('activityViewOptionsMenu').contains(h.offline));
  h.ui.refresh(); h.ui.refresh();
  assert.equal(h.document.querySelectorAll('.module-toolbar-trigger').length, 5, 'Refresh never duplicates menus');
}

{
  const h = harness(), trigger = h.get('overviewViewMoreOptions'), menu = h.get('overviewViewOptionsMenu');
  trigger.click();
  assert.equal(menu.hidden, false); assert.equal(menu.popoverOpen, true);
  assert.equal(h.document.activeElement, h.existing.overviewView.first, 'Hidden business action skipped');
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  h.existing.overviewView.first.dispatch('keydown', {key:'End'});
  assert.equal(h.document.activeElement, h.existing.overviewView.second);
  h.existing.overviewView.second.dispatch('keydown', {key:'ArrowDown'});
  assert.equal(h.document.activeElement, h.existing.overviewView.first, 'Arrow navigation wraps');
  h.existing.overviewView.first.dispatch('keydown', {key:'ArrowUp'});
  assert.equal(h.document.activeElement, h.existing.overviewView.second);
  h.existing.overviewView.second.dispatch('keydown', {key:'Home'});
  assert.equal(h.document.activeElement, h.existing.overviewView.first);
  h.existing.overviewView.first.click();
  assert.deepEqual(h.calls, [{id:'overviewViewDetail', focused:'overviewViewMoreOptions'}], 'Visible return focus restored before original modal listener');
  assert.equal(menu.hidden, true); assert.equal(menu.popoverOpen, false);
  assert.equal(h.ui.returnFocusTarget(h.existing.overviewView.second), trigger);
  assert.equal(h.ui.returnFocusTarget(h.existing.overviewView.primary), h.existing.overviewView.primary);
}

{
  const h = harness(), trigger = h.get('overviewViewMoreOptions'), menu = h.get('overviewViewOptionsMenu');
  trigger.dispatch('keydown', {key:'ArrowUp'});
  assert.equal(h.document.activeElement, h.existing.overviewView.second);
  const escape = h.document.activeElement.dispatch('keydown', {key:'Escape'});
  assert.equal(escape.defaultPrevented, true); assert.equal(menu.hidden, true); assert.equal(h.document.activeElement, trigger);
  trigger.click(); h.document.activeElement.dispatch('keydown', {key:'Tab'});
  assert.equal(menu.hidden, true); assert.equal(h.document.activeElement, trigger, 'Native Tab advances from visible trigger');
  trigger.click(); h.document.body.dispatch('pointerdown'); assert.equal(menu.hidden, true);
  trigger.click(); h.existing.overviewView.primary.focus(); assert.equal(menu.hidden, true);
  trigger.click(); h.switchView('budgetsView'); assert.equal(menu.hidden, true, 'Route change dismisses stale menu');
  h.get('budgetsViewMoreOptions').click(); h.ui.closeAll(); assert.equal(h.get('budgetsViewOptionsMenu').hidden, true);
}

{
  const h = harness(), trigger = h.get('overviewViewMoreOptions'), menu = h.get('overviewViewOptionsMenu');
  h.document.documentElement.lang = 'en'; h.ui.refresh();
  assert.equal(trigger.textContent, 'More options');
  assert.equal(trigger.getAttribute('aria-label'), 'More options — Overview');
  h.business.hidden = false; h.ui.refresh(); trigger.click();
  assert.equal(h.document.activeElement, h.business, 'Business-only action becomes reachable without rebinding');
  h.ui.closeAll(); h.business.hidden = true; trigger.click();
  assert.equal(h.document.activeElement, h.existing.overviewView.first, 'Personal profile does not expose business action');
  h.ui.closeAll();
  const modal = h.document.createElement('dialog'); modal.open = true; h.document.body.append(modal);
  trigger.click(); assert.equal(menu.hidden, true, 'Toolbar cannot open behind an active modal');
}

{
  const h = harness(), trigger = h.get('overviewViewMoreOptions'), menu = h.get('overviewViewOptionsMenu');
  trigger.click();
  assert.ok(parseFloat(menu.style.left) >= 12 && parseFloat(menu.style.left) + 310 <= 363, '375px popover stays in horizontal viewport');
  assert.ok(parseFloat(menu.style.top) >= 12);
  assert.ok(parseFloat(menu.style.top) + Math.min(menu.scrollHeight + 2, parseFloat(menu.style.maxHeight)) <= 655);
  h.ui.closeAll(); trigger.rect = {top:540, bottom:584, right:360, left:206, width:154, height:44}; trigger.click();
  assert.ok(parseFloat(menu.style.top) < 540, 'Near-bottom trigger opens upward');
  h.ui.closeAll(); h.window.innerWidth = 1440; h.window.innerHeight = 900; trigger.rect = {top:90,bottom:134,right:1400,left:1246,width:154,height:44}; trigger.click();
  assert.ok(parseFloat(menu.style.left) + 310 <= 1428, 'Desktop popover is bounded');
  assert.match(css, /min-height:48px/);
  assert.match(css, /overflow-x:hidden; overflow-y:auto/);
  assert.match(css, /\.data-action-pair\s*\{\s*display:contents/);
  assert.match(css, /line-height:1\.55/);
  assert.match(css, /clip:auto; clip-path:none; white-space:normal/);
}

console.log('Module toolbar cycle 2: identity, grouped actions, keyboard, focus return, profile visibility, locale, and 375/1440 bounds passed.');
