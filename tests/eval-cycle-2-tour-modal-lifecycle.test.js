'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const MerOnboardingCore = require('../onboarding-core.js');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'onboarding.js'), 'utf8');

// Execute the real tour adapter without requiring a browser or replacing its
// state machine. This small DOM models the native-dialog ownership boundaries;
// responsive pixel geometry remains covered by the separate viewport tests.
function harness({ width = 1440, height = 900, asynchronousClose = false } = {}) {
  const nodes = new Map();
  const aliases = new Map();
  const calls = [];
  const frames = new Map();
  const timers = new Map();
  let sequence = 0;
  let document;
  const classes = () => {
    const values = new Set();
    return {
      add:(...items) => items.forEach(item => values.add(item)),
      remove:(...items) => items.forEach(item => values.delete(item)),
      contains:item => values.has(item),
      toggle(item, force) { const active = force === undefined ? !values.has(item) : force; if (active) values.add(item); else values.delete(item); return active; }
    };
  };

  class Element {
    constructor(id = '', tagName = 'DIV') {
      this.id = id;
      this.tagName = tagName.toUpperCase();
      this.children = [];
      this.parentNode = null;
      this.classList = classes();
      this.attributes = new Map();
      this.listeners = new Map();
      this.dataset = {};
      this.style = { setProperty(name, value) { this[name] = value; }, getPropertyValue(name) { return this[name] || ''; }, removeProperty(name) { delete this[name]; } };
      this.hidden = false;
      this.open = false;
      this.inert = false;
      this.disabled = false;
      this.textContent = '';
      this.innerHTML = '';
      this.scrollHeight = id === 'onboardingPopover' ? 250 : 200;
      this.rect = { left:360, top:100, right:1040, bottom:420, width:680, height:320 };
      if (id) nodes.set(id, this);
    }
    get parentElement() { return this.parentNode; }
    get nextSibling() { if (!this.parentNode) return null; return this.parentNode.children[this.parentNode.children.indexOf(this) + 1] || null; }
    get isConnected() { return this === document.body || Boolean(this.parentNode?.isConnected); }
    appendChild(child) { child.remove(); this.children.push(child); child.parentNode = this; return child; }
    append(...children) { children.forEach(child => this.appendChild(child)); }
    prepend(child) { this.insertBefore(child, this.children[0] || null); }
    insertBefore(child, before) { child.remove(); const index = before ? this.children.indexOf(before) : -1; if (index < 0) this.children.push(child); else this.children.splice(index, 0, child); child.parentNode = this; return child; }
    remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(child => child !== this); this.parentNode = null; }
    replaceChildren(...children) { this.children.forEach(child => { child.parentNode = null; }); this.children = []; this.append(...children); }
    contains(element) { return this === element || this.children.some(child => child.contains(element)); }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    hasAttribute(name) { return this.attributes.has(name); }
    removeAttribute(name) { this.attributes.delete(name); }
    addEventListener(type, listener) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(listener); }
    removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
    dispatch(type, properties = {}) {
      const event = { type, target:this, currentTarget:this, defaultPrevented:false, preventDefault() { this.defaultPrevented = true; }, stopPropagation() {}, stopImmediatePropagation() { this.stopped = true; }, ...properties };
      for (const listener of [...(this.listeners.get(type) || [])]) { listener(event); if (event.stopped) break; }
      return event;
    }
    click() { if (!this.disabled) this.dispatch('click'); }
    focus() { document.activeElement = this; }
    scrollIntoView() {
      const host = this.closest('dialog');
      if (!host?.style.getPropertyValue('--tour-panel-top')) return;
      const body = host.querySelector('.settings-modal-body, .help-assistant-body');
      if (!body || !body.contains(this)) return;
      const rect = body.getBoundingClientRect();
      this.rect = { ...this.rect, left:rect.left, right:rect.right, width:rect.width, top:rect.top, bottom:rect.top + this.rect.height };
      calls.push(['scroll-target', this.id]);
    }
    getBoundingClientRect() {
      if (['settingsBody', 'helpBody'].includes(this.id)) {
        const host = this.closest('dialog');
        const panelTop = Number.parseFloat(host.style.getPropertyValue('--tour-panel-top'));
        if (Number.isFinite(panelTop)) {
          const top = panelTop + 72, bottom = panelTop + Number.parseFloat(host.style.getPropertyValue('--tour-panel-height')) - 12;
          return { left:28, right:width - 28, top, bottom, width:width - 56, height:Math.max(1, bottom - top) };
        }
      }
      return { ...this.rect };
    }
    getClientRects() { for (let ancestor = this; ancestor; ancestor = ancestor.parentNode) if (ancestor.hidden || (ancestor.tagName === 'DIALOG' && !ancestor.open)) return []; return this.isConnected ? [this.getBoundingClientRect()] : []; }
    descendants() { return this.children.flatMap(child => [child, ...child.descendants()]); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    querySelectorAll(selector) {
      if (selector.includes('button:not') || selector.includes('input:not')) return this.descendants().filter(element => ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName) && !element.disabled);
      if (selector.includes(',')) return selector.split(',').flatMap(part => this.querySelectorAll(part.trim()));
      const direct = aliases.get(selector) || (selector.startsWith('#') ? nodes.get(selector.slice(1)) : null);
      if (direct && this.contains(direct)) return [direct];
      if (selector === '[data-close-modal]') return this.descendants().filter(element => element.hasAttribute('data-close-modal'));
      return [];
    }
    closest(selector) { for (let element = this; element; element = element.parentNode) { if (selector.includes('dialog') && element.tagName === 'DIALOG') return element; if (selector.startsWith('#') && element.id === selector.slice(1)) return element; } return null; }
    showModal() { this.open = true; calls.push(['show', this.id]); }
    close() {
      if (!this.open) return;
      this.open = false;
      calls.push(['close', this.id, nodes.get('onboardingTour').parentNode?.id]);
      if (asynchronousClose) timers.set(++sequence, () => this.dispatch('close'));
      else this.dispatch('close');
    }
  }

  document = new Element('document');
  document.body = new Element('body', 'BODY');
  document.documentElement = new Element('html', 'HTML');
  document.activeElement = null;
  document.createElement = tagName => new Element('', tagName);
  document.querySelector = selector => document.querySelectorAll(selector)[0] || null;
  document.querySelectorAll = selector => {
    if (selector === 'dialog[open]' || selector === '.modal[open]') return [...nodes.values()].filter(element => element.tagName === 'DIALOG' && element.open);
    if (selector === '[data-settings-tab]') return [...nodes.values()].filter(element => element.dataset.settingsTab);
    if (selector.includes('tour-context-active')) return [...nodes.values()].filter(element => element.classList.contains('tour-context-active'));
    const element = aliases.get(selector) || (selector.startsWith('#') ? nodes.get(selector.slice(1)) : null);
    return element ? [element] : [];
  };
  const add = (id, parent = document.body, tagName = 'DIV') => { const element = new Element(id, tagName); parent.appendChild(element); return element; };
  const shell = add('appShell');
  const sidebar = add('sidebar', shell);
  const main = add('main', shell);
  add('menuToggle', main, 'BUTTON');
  add('openSettings', sidebar, 'BUTTON');
  add('openHelpAssistant', sidebar, 'BUTTON');
  const sidebarAction = add('sidebarTransaction', sidebar, 'BUTTON');
  aliases.set('#sidebar .sidebar-transaction-button[data-open-transaction]', sidebarAction);
  const navLinks = {};
  for (const view of ['overview', 'budgets', 'savings', 'activity', 'insights']) {
    const panel = add(`${view}View`, main);
    panel.hidden = view !== 'overview';
    const nav = add(`${view}Nav`, sidebar, 'BUTTON');
    nav.innerHTML = view;
    nav.rect = { left:12, top:100, width:220, height:44, right:232, bottom:144 };
    aliases.set(`.nav-item[data-view="${view}"]`, nav);
    navLinks[view] = nav;
  }
  for (const step of MerOnboardingCore.DEFAULT_STEPS.slice(0, 5)) {
    if (document.querySelector(step.target)) continue;
    const target = add(`${step.id}Feature`, nodes.get(`${step.view}View`));
    aliases.set(step.target, target);
  }
  const settings = add('bankSettingsModal', document.body, 'DIALOG');
  const settingsClose = add('settingsClose', settings, 'BUTTON');
  settingsClose.setAttribute('data-close-modal', '');
  const settingsBody = add('settingsBody', settings);
  aliases.set('#bankSettingsModal .settings-modal-body', settingsBody);
  aliases.set('.settings-modal-body', settingsBody);
  for (const tab of ['general', 'security', 'automation']) {
    const button = add(`settingsTab-${tab}`, settingsBody, 'BUTTON');
    button.dataset.settingsTab = tab;
  }
  const preferences = add('settingsTourPreferences', settingsBody);
  add('settingsLanguage', preferences, 'SELECT');
  add('themeToggle', preferences, 'BUTTON');
  add('layoutEditToggle', preferences, 'BUTTON');
  const password = add('changePasswordForm', settingsBody, 'FORM');
  add('currentPasswordInput', password, 'INPUT');
  const mfa = add('settingsTourMfa', settingsBody);
  add('startMfa', mfa, 'BUTTON');

  const tour = add('onboardingTour');
  tour.hidden = true;
  const spotlight = add('onboardingSpotlight', tour);
  add('onboardingContextSpotlight', tour);
  const popover = add('onboardingPopover', tour);
  popover.rect = { left:20, top:20, width:340, height:250, right:360, bottom:270 };
  for (const id of ['onboardingTitle', 'onboardingBody', 'onboardingProgress', 'onboardingProgressBar', 'onboardingSubstep']) add(id, popover);
  const tip = add('onboardingTip', popover);
  const tipText = add('onboardingTipText', tip, 'SPAN');
  aliases.set('#onboardingTip span', tipText);
  for (const id of ['onboardingClose', 'onboardingPrevious', 'onboardingNext', 'onboardingSkip']) add(id, popover, 'BUTTON');
  const help = add('helpAssistantModal', document.body, 'DIALOG');
  const helpClose = add('helpClose', help, 'BUTTON');
  helpClose.setAttribute('data-close-modal', '');
  const helpBody = add('helpBody', help);
  aliases.set('#helpAssistantModal .help-assistant-body', helpBody);
  aliases.set('.help-assistant-body', helpBody);
  const conversation = add('helpTourConversation', helpBody);
  add('helpAssistantInput', conversation, 'TEXTAREA');
  add('helpAssistantSend', conversation, 'BUTTON');
  const originalSibling = tour.nextSibling;
  const storage = new Map();
  const closeModal = modal => modal?.close();
  settingsClose.addEventListener('click', () => closeModal(settings));
  helpClose.addEventListener('click', () => closeModal(help));
  const selectTab = tab => { calls.push(['tab', tab]); preferences.hidden = tab !== 'general'; password.hidden = tab !== 'security'; mfa.hidden = tab !== 'security'; };
  for (const button of document.querySelectorAll('[data-settings-tab]')) button.addEventListener('click', () => selectTab(button.dataset.settingsTab));
  const context = {
    document, HTMLElement:Element, MerOnboardingCore,
    translations:{ hr:{}, en:{} }, currentLang:'hr', activeView:'overview',
    applyStaticTranslations() {}, t:key => ({ onboardingBack:'Natrag', onboardingNext:'Dalje', finishTour:'Završi' }[key] || key),
    $:selector => document.querySelector(selector), $$:selector => document.querySelectorAll(selector),
    localStorage:{ getItem:key => storage.get(key) || null, setItem:(key, value) => storage.set(key, value) },
    setTimeout:(callback) => { const id = ++sequence; timers.set(id, callback); return id; }, clearTimeout:id => timers.delete(id),
    requestAnimationFrame:callback => { const id = ++sequence; frames.set(id, callback); return id; }, cancelAnimationFrame:id => frames.delete(id),
    ResizeObserver:class { observe() {} disconnect() {} },
    closeModal,
    showView(view) { calls.push(['view', view]); document.querySelectorAll('dialog[open]').forEach(closeModal); context.activeView = view; for (const name of Object.keys(navLinks)) nodes.get(`${name}View`).hidden = name !== view; },
    openSidebar:() => sidebar.classList.add('open'), closeSidebar:() => sidebar.classList.remove('open')
  };
  context.window = {
    MerOnboardingCore, innerWidth:width, innerHeight:height,
    matchMedia:query => ({ matches:query.includes('prefers-reduced') || (query.includes('max-width') && width <= 768) }),
    addEventListener() {}, removeEventListener() {},
    MerAuthProvider:{ currentSession:() => ({ userId:'tour-eval-user' }) },
    MerSettings:{ open(tab) { calls.push(['settings', tab]); selectTab(tab); if (!settings.open) settings.showModal(); }, selectTab },
    MerAssistantUi:{ close() { calls.push(['assistant-close']); }, openHelp(mode) { calls.push(['help', mode]); if (!help.open) help.showModal(); }, ask() { throw new Error('The tour must never send an AI request'); } }
  };
  vm.runInNewContext(source, context, { filename:'onboarding.js' });
  const flush = () => { for (let round = 0; round < 15 && (frames.size || timers.size); round += 1) { const pending = [...frames.values(), ...timers.values()]; frames.clear(); timers.clear(); pending.forEach(callback => callback()); } };
  const click = id => { nodes.get(id).click(); flush(); };
  const start = () => { assert.equal(context.window.MerOnboardingUi.restart(nodes.get('openSettings')), true); flush(); };
  const next = count => { for (let index = 0; index < (count || 1); index += 1) click('onboardingNext'); };
  return { nodes, document, calls, context, navLinks, shell, settings, help, tour, spotlight, originalSibling, start, next, click, flush };
}

test('cycle 2: Insights uses its full content and settings removes the obsolete nav highlight', () => {
  const env = harness();
  env.start();
  env.next(4);
  assert.equal(env.nodes.get('insightsView').classList.contains('tour-target-active'), true);
  assert.equal(env.navLinks.insights.classList.contains('tour-context-active'), true);
  assert.equal(env.nodes.get('onboardingProgress').textContent, 'Korak 5 od 7');
  env.next();
  assert.equal(env.settings.open, true);
  assert.equal(env.tour.parentNode, env.settings, 'the guide must enter the dialog native top layer');
  assert.equal(env.settings.classList.contains('tour-modal-host'), true);
  assert.equal(env.navLinks.insights.classList.contains('tour-context-active'), false);
  assert.equal(env.nodes.get('onboardingContextSpotlight').classList.contains('is-visible'), false);
  assert.equal(env.nodes.get('settingsTourPreferences').classList.contains('tour-target-active'), true);
  assert.equal(env.nodes.get('onboardingProgress').textContent, 'Korak 6 od 7');
});

test('cycle 2: General, password and MFA stay in one open settings dialog then Help opens once', () => {
  const env = harness();
  env.start();
  env.next(5);
  env.next();
  assert.equal(env.nodes.get('changePasswordForm').classList.contains('tour-target-active'), true);
  env.next();
  assert.equal(env.nodes.get('settingsTourMfa').classList.contains('tour-target-active'), true);
  assert.equal(env.calls.filter(call => call[0] === 'show' && call[1] === 'bankSettingsModal').length, 1);
  assert.equal(env.calls.filter(call => call[0] === 'close').length, 0, 'substeps must not close/reopen the modal');
  env.next();
  assert.equal(env.settings.open, false);
  assert.equal(env.help.open, true);
  assert.equal(env.tour.parentNode, env.help);
  assert.equal(env.nodes.get('helpTourConversation').classList.contains('tour-target-active'), true);
  assert.equal(env.nodes.get('onboardingProgress').textContent, 'Korak 7 od 7');
  assert.equal(env.navLinks.insights.classList.contains('tour-context-active'), false);
  assert.equal(env.calls.find(call => call[0] === 'close' && call[1] === 'bankSettingsModal')[2], 'body', 'detach the guide before closing its former host');
  assert.ok(env.calls.some(call => call[0] === 'help' && call[1] === 'assistant'));
});

test('cycle 2: Back crosses Help and Settings boundaries symmetrically without stale ownership', () => {
  const env = harness();
  env.start();
  env.next(8);
  env.click('onboardingPrevious');
  assert.equal(env.help.open, false);
  assert.equal(env.settings.open, true);
  assert.equal(env.tour.parentNode, env.settings);
  assert.equal(env.nodes.get('settingsTourMfa').classList.contains('tour-target-active'), true);
  env.click('onboardingPrevious');
  assert.equal(env.nodes.get('changePasswordForm').classList.contains('tour-target-active'), true);
  env.click('onboardingPrevious');
  assert.equal(env.nodes.get('settingsTourPreferences').classList.contains('tour-target-active'), true);
  env.click('onboardingPrevious');
  assert.equal(env.settings.open, false);
  assert.equal(env.tour.parentNode, env.document.body);
  assert.equal(env.tour.nextSibling, env.originalSibling);
  assert.equal(env.navLinks.insights.classList.contains('tour-context-active'), true);
  assert.equal(env.tour.hidden, false);
});

test('cycle 2: closing either owned modal ends the guide and restores the original parent and interaction', () => {
  for (const count of [5, 8]) {
    const env = harness();
    env.start();
    env.next(count);
    const host = count === 5 ? env.settings : env.help;
    host.close();
    env.flush();
    assert.equal(env.tour.hidden, true);
    assert.equal(env.tour.parentNode, env.document.body);
    assert.equal(env.tour.nextSibling, env.originalSibling);
    assert.equal(env.shell.inert, false);
    assert.equal(host.classList.contains('tour-modal-host'), false);
    assert.equal(env.document.body.classList.contains('tour-active'), false);
    assert.equal(env.nodes.get('onboardingContextSpotlight').classList.contains('is-visible'), false);
    env.start();
    assert.equal(env.nodes.get('onboardingProgress').textContent, 'Korak 1 od 7');
    assert.equal(env.settings.open || env.help.open, false);
  }
});

test('cycle 2: finish and Escape close owned surfaces, clear highlights and never submit AI prompts', () => {
  for (const finish of [true, false]) {
    const env = harness();
    env.start();
    env.next(8);
    if (finish) env.click('onboardingNext');
    else { env.document.dispatch('keydown', { key:'Escape' }); env.flush(); }
    assert.equal(env.tour.hidden, true);
    assert.equal(env.settings.open || env.help.open, false);
    assert.equal(env.tour.parentNode, env.document.body);
    assert.equal(env.shell.inert, false);
    assert.equal([...env.nodes.values()].some(element => element.classList.contains('tour-target-active') || element.classList.contains('tour-context-active')), false);
  }
  assert.doesNotMatch(source, /submitAssistantMessage\(|\.requestSubmit\(|MerFinancialAssistant\.ask\(/);
});

test('cycle 2: hosted keyboard scope includes real controls and suppresses duplicate dialog focus traps', () => {
  const env = harness();
  env.start();
  env.next(5);
  assert.equal(env.nodes.get('onboardingPopover').getAttribute('aria-modal'), 'false');
  env.nodes.get('settingsLanguage').focus();
  const controlTab = env.document.dispatch('keydown', { key:'Tab' });
  assert.equal(controlTab.defaultPrevented, false, 'Tab moves naturally from a real preferences control');
  assert.equal(controlTab.stopped, true, 'the enclosing native-dialog handler cannot trap a second time');
  env.nodes.get('onboardingSkip').focus();
  const lastTab = env.document.dispatch('keydown', { key:'Tab' });
  assert.equal(lastTab.defaultPrevented, true);
  assert.equal(env.document.activeElement.id, 'settingsClose');
  env.document.dispatch('keydown', { key:'Tab', shiftKey:true });
  assert.equal(env.document.activeElement.id, 'onboardingSkip');
  env.click('onboardingPrevious');
  assert.equal(env.nodes.get('onboardingPopover').getAttribute('aria-modal'), 'true');
});

test('cycle 2: clicking settings tabs updates the active substep and unrelated rules exit cleanly', () => {
  const env = harness();
  env.start();
  env.next(5);
  env.click('settingsTab-security');
  assert.equal(env.nodes.get('changePasswordForm').classList.contains('tour-target-active'), true);
  assert.equal(env.nodes.get('onboardingSubstep').textContent, 'Postavke · 2 / 3');
  env.click('settingsTab-general');
  assert.equal(env.nodes.get('settingsTourPreferences').classList.contains('tour-target-active'), true);
  assert.equal(env.nodes.get('onboardingSubstep').textContent, 'Postavke · 1 / 3');
  env.context.currentLang = 'en';
  env.nodes.get('settingsLanguage').dispatch('change');
  env.flush();
  assert.equal(env.nodes.get('onboardingTitle').textContent, 'Language, theme and layout');
  assert.equal(env.settings.open, true);
  env.click('settingsTab-automation');
  assert.equal(env.tour.hidden, true);
  assert.equal(env.settings.open, false);
  assert.equal(env.shell.inert, false);
});

test('cycle 2: queued native close events cannot dismiss a reopened host during rapid Back navigation', () => {
  const env = harness({ asynchronousClose:true });
  env.start();
  env.next(7);
  env.nodes.get('onboardingNext').click();
  assert.equal(env.help.open, true);
  env.nodes.get('onboardingPrevious').click();
  assert.equal(env.settings.open, true);
  env.flush();
  assert.equal(env.tour.hidden, false);
  assert.equal(env.tour.parentNode, env.settings);
  assert.equal(env.nodes.get('settingsTourMfa').classList.contains('tour-target-active'), true);
});

test('cycle 2: phone lifecycle keeps Settings and Help outside the inert app and restores interactivity', () => {
  for (const width of [375, 414, 768]) {
    const env = harness({ width });
    env.start();
    env.next(5);
    assert.equal(env.tour.parentNode, env.settings);
    assert.equal(env.shell.contains(env.settings), false);
    assert.equal(env.nodes.get('sidebar').classList.contains('open'), false);
    assert.equal(env.nodes.get('settingsTourPreferences').classList.contains('tour-target-active'), true);
    env.next(3);
    assert.equal(env.tour.parentNode, env.help);
    assert.equal(env.nodes.get('helpTourConversation').classList.contains('tour-target-active'), true);
    env.click('onboardingClose');
    assert.equal(env.settings.open || env.help.open, false);
    assert.equal(env.shell.inert, false);
    assert.equal(env.tour.parentNode, env.document.body);
  }
});

test('cycle 2: split phone and tablet surfaces reserve non-overlapping tooltip and modal lanes', () => {
  for (const [width, height] of [[375, 667], [414, 736], [768, 1024], [1024, 768]]) {
    const env = harness({ width, height });
    env.start();
    env.next(5);
    for (const offset of [0, 1, 2, 3]) {
      if (offset) env.next();
      const host = offset === 3 ? env.help : env.settings;
      const popover = env.nodes.get('onboardingPopover');
      const panelTop = Number.parseFloat(host.style.getPropertyValue('--tour-panel-top'));
      const panelHeight = Number.parseFloat(host.style.getPropertyValue('--tour-panel-height'));
      const tooltipTop = Number.parseFloat(popover.style.top);
      const tooltipLeft = Number.parseFloat(popover.style.left);
      const tooltipWidth = Number.parseFloat(popover.style.maxWidth);
      const body = host.querySelector('.settings-modal-body, .help-assistant-body').getBoundingClientRect();
      const highlightTop = Number.parseFloat(env.spotlight.style.top);
      const highlightBottom = highlightTop + Number.parseFloat(env.spotlight.style.height);
      assert.ok(Number.isFinite(panelTop) && Number.isFinite(panelHeight));
      assert.ok(tooltipTop >= 12);
      assert.ok(tooltipTop + popover.scrollHeight + 12 <= panelTop, 'tooltip must not cover the modal');
      assert.ok(panelTop + panelHeight <= height - 12, 'modal bottom must remain within the viewport');
      assert.ok(tooltipLeft >= 12 && tooltipLeft + tooltipWidth <= width - 12);
      assert.ok(highlightTop >= body.top - 8, 'highlight may not bleed above the scroll window');
      assert.ok(highlightBottom <= body.bottom + 8, 'highlight may not bleed below the scroll window');
    }
    env.click('onboardingClose');
    for (const host of [env.settings, env.help]) {
      assert.equal(host.style.getPropertyValue('--tour-panel-top'), '');
      assert.equal(host.style.getPropertyValue('--tour-panel-height'), '');
    }
  }
});
