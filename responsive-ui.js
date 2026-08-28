(function initializeResponsiveUi(global, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.MerResponsiveUI = api;
  if (!global?.document) return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', api.init, { once:true });
  else api.init();
})(typeof globalThis !== 'undefined' ? globalThis : this, function responsiveUiFactory() {
  'use strict';

  const BREAKPOINTS = Object.freeze({ compact:640, tablet:1024, wide:1600 });
  const chartSelector = [
    '.line-chart', '.contribution-chart', '.cashflow-chart', '.monthly-bars',
    '.donut-layout', '.category-donut', '.savings-gauge', '.insight-expanded-chart',
    '.expanded-month-chart', '.expanded-donut-layout', '.expanded-savings-layout'
  ].join(',');
  let initialized = false;
  let refreshFrame = 0;
  let mutationObserver = null;
  let chartObserver = null;
  let eventController = null;
  let sidebarWasOpen = false;
  let sidebarReturnFocus = null;
  const sidebarInertState = new Map();
  const observedCharts = new WeakSet();

  function finite(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, minimum, maximum) {
    if (maximum < minimum) return minimum;
    return Math.min(Math.max(value, minimum), maximum);
  }

  function viewportMode(width) {
    const inlineSize = Math.max(0, finite(width));
    if (inlineSize <= BREAKPOINTS.compact) return 'compact';
    if (inlineSize <= BREAKPOINTS.tablet) return 'tablet';
    if (inlineSize > BREAKPOINTS.wide) return 'wide';
    return 'desktop';
  }

  function chartDensity(width) {
    const inlineSize = Math.max(0, finite(width));
    if (inlineSize < 360) return 'compact';
    if (inlineSize < 720) return 'regular';
    return 'spacious';
  }

  function computeFloatingPosition({ triggerRect = {}, menuSize = {}, viewport = {}, gap = 8, edge = 12 } = {}) {
    const bounds = {
      left:finite(viewport.left),
      top:finite(viewport.top),
      width:Math.max(1, finite(viewport.width, 1)),
      height:Math.max(1, finite(viewport.height, 1))
    };
    const right = bounds.left + bounds.width;
    const bottom = bounds.top + bounds.height;
    const trigger = {
      left:finite(triggerRect.left),
      right:finite(triggerRect.right, finite(triggerRect.left)),
      top:finite(triggerRect.top),
      bottom:finite(triggerRect.bottom, finite(triggerRect.top))
    };
    const safeEdge = Math.max(0, finite(edge, 12));
    const safeGap = Math.max(0, finite(gap, 8));
    const availableWidth = Math.max(1, bounds.width - safeEdge * 2);
    const width = Math.min(Math.max(180, finite(menuSize.width, 180)), availableWidth);
    const requestedHeight = Math.max(44, finite(menuSize.height, 44));
    const spaceBelow = bottom - safeEdge - trigger.bottom - safeGap;
    const spaceAbove = trigger.top - bounds.top - safeEdge - safeGap;
    const side = spaceBelow >= Math.min(requestedHeight, 220) || spaceBelow >= spaceAbove ? 'bottom' : 'top';
    const maximumHeight = Math.max(88, side === 'bottom' ? spaceBelow : spaceAbove);
    const height = Math.min(requestedHeight, maximumHeight);
    const proposedTop = side === 'bottom' ? trigger.bottom + safeGap : trigger.top - safeGap - height;
    return Object.freeze({
      left:clamp(trigger.right - width, bounds.left + safeEdge, right - safeEdge - width),
      top:clamp(proposedTop, bounds.top + safeEdge, bottom - safeEdge - height),
      width,
      maxHeight:maximumHeight,
      side
    });
  }

  function viewportBounds() {
    const visual = window.visualViewport;
    return visual
      ? { left:visual.offsetLeft, top:visual.offsetTop, width:visual.width, height:visual.height }
      : { left:0, top:0, width:window.innerWidth, height:window.innerHeight };
  }

  function elements(scope, selector) {
    const matches = scope instanceof Element && scope.matches(selector) ? [scope] : [];
    return matches.concat([...scope.querySelectorAll(selector)]);
  }

  function setUi(scope, selector, primitive) {
    elements(scope, selector).forEach(element => { element.dataset.ui = primitive; });
  }

  function markPrimitives(scope = document) {
    setUi(scope, 'dialog.modal, dialog.auth-reset-modal', 'dialog');
    setUi(scope, '.modal-actions', 'dialog-footer');
    setUi(scope, '.detail-modal-grid, .settings-modal-body, .help-assistant-body', 'scroll-area');
    setUi(scope, '.card-action-menu, .account-menu', 'menu');
    setUi(scope, '.notification-center, .app-tooltip', 'popover');
    setUi(scope, '.settings-tabs, .help-nav-grid, .timeframe-switch, .transaction-type-switch, .auth-tabs', 'tabs');
    setUi(scope, '.import-table-wrap', 'table-viewport');
    setUi(scope, '.import-table', 'table');
    setUi(scope, chartSelector, 'chart');
    elements(scope, '.assessment-modal').forEach(wizard => { wizard.dataset.uiKind = 'wizard'; });
    setUi(scope, '.assessment-step', 'wizard-step');
    setUi(scope, '.onboarding-popover', 'tour-popover');
    setUi(scope, '.assistant-widget', 'floating-panel');
    setUi(scope, '.faq-list details', 'accordion-item');
    setUi(scope, 'select', 'select');

    const accountMenu = document.querySelector('#accountMenu');
    if (accountMenu) accountMenu.setAttribute('role', 'menu');
    const mfaLock = document.querySelector('#mfaLockScreen');
    if (mfaLock) { mfaLock.setAttribute('role', 'dialog'); mfaLock.setAttribute('aria-modal', 'true'); }
    elements(scope, '#accountMenu [data-account]').forEach(option => option.setAttribute('role', 'menuitemradio'));
    elements(scope, '#accountMenu .settings-option').forEach(option => option.setAttribute('role', 'menuitem'));
    elements(scope, '.card-action-menu').forEach(menu => menu.setAttribute('role', 'menu'));
    wireTabSemantics();
  }

  function wireTabSemantics() {
    document.querySelectorAll('[data-settings-tab]').forEach(tab => {
      const key = tab.dataset.settingsTab;
      const panel = document.querySelector(`[data-settings-panel="${CSS.escape(key)}"]`);
      tab.id ||= `settings-tab-${key}`;
      tab.setAttribute('role', 'tab');
      if (!panel) return;
      panel.id ||= `settings-panel-${key}`;
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
    });
    const authPairs = [['authLoginTab','loginForm'],['authRegisterTab','registerForm']];
    authPairs.forEach(([tabId,panelId]) => {
      const tab = document.getElementById(tabId);
      const panel = document.getElementById(panelId);
      if (!tab || !panel) return;
      tab.setAttribute('aria-controls', panelId);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tabId);
    });
    const helpPanel = document.getElementById('helpFaqPanel');
    document.querySelectorAll('[data-faq-filter]').forEach(tab => {
      tab.setAttribute('aria-controls', helpPanel?.id || 'helpFaqPanel');
    });
  }

  function syncPrimitiveStates() {
    const mode = document.documentElement.dataset.viewport || viewportMode(viewportBounds().width);
    const dialogOpen = Boolean(document.querySelector('dialog[open]'));
    document.documentElement.classList.toggle('ui-dialog-open', dialogOpen);
    document.body?.classList.toggle('ui-dialog-open', dialogOpen);
    document.querySelectorAll('[data-ui="dialog"]').forEach(dialog => {
      dialog.dataset.state = dialog.open ? 'open' : 'closed';
      dialog.dataset.presentation = mode === 'compact' ? 'sheet' : 'dialog';
    });
    document.querySelectorAll('[data-ui="menu"], [data-ui="popover"], [data-ui="floating-panel"]').forEach(surface => {
      surface.dataset.state = surface.hidden ? 'closed' : 'open';
    });
    document.querySelectorAll('[data-ui="tabs"] button').forEach(tab => {
      const active = tab.classList.contains('active') || tab.getAttribute('aria-selected') === 'true' || tab.getAttribute('aria-pressed') === 'true';
      tab.dataset.state = active ? 'active' : 'inactive';
    });
    document.querySelectorAll('#accountMenu [data-account]').forEach(option => {
      option.setAttribute('aria-checked', String(option.classList.contains('active')));
    });
    document.querySelectorAll('[data-ui="accordion-item"]').forEach(item => {
      item.dataset.state = item.open ? 'open' : 'closed';
    });
  }

  function syncViewport() {
    const bounds = viewportBounds();
    const root = document.documentElement;
    root.dataset.viewport = viewportMode(bounds.width);
    root.style.setProperty('--ui-visual-height', `${Math.round(bounds.height)}px`);
    root.style.setProperty('--ui-visual-width', `${Math.round(bounds.width)}px`);
    root.style.setProperty('--ui-visual-top', `${Math.round(bounds.top)}px`);
    root.style.setProperty('--ui-visual-left', `${Math.round(bounds.left)}px`);
    root.style.setProperty('--ui-visual-bottom', `${Math.max(0, Math.round(window.innerHeight - bounds.top - bounds.height))}px`);
    syncPrimitiveStates();
    syncSidebarSheet();
  }

  function setSidebarBackgroundInert(inert) {
    const targets = ['.main', '#assistantFab', '#assistantWidget']
      .map(selector => document.querySelector(selector))
      .filter(Boolean);
    if (inert) {
      targets.forEach(target => {
        if (!sidebarInertState.has(target)) sidebarInertState.set(target, Boolean(target.inert));
        target.inert = true;
      });
      return;
    }
    sidebarInertState.forEach((previous, target) => { if (target.isConnected) target.inert = previous; });
    sidebarInertState.clear();
  }

  function syncSidebarSheet() {
    const sidebar = document.querySelector('#sidebar');
    const main = document.querySelector('.main');
    if (!sidebar || !main) return;
    const drawerViewport = viewportBounds().width <= 768;
    const open = drawerViewport && sidebar.classList.contains('open');
    sidebar.dataset.ui = drawerViewport ? 'sheet' : 'sidebar';
    sidebar.dataset.state = open ? 'open' : 'closed';
    if (open && !sidebarWasOpen) {
      sidebarReturnFocus = document.activeElement;
      sidebar.setAttribute('role', 'dialog');
      sidebar.setAttribute('aria-modal', 'true');
      setSidebarBackgroundInert(true);
      requestAnimationFrame(() => (sidebar.querySelector('.nav-item.active') || sidebar.querySelector('button,a'))?.focus({ preventScroll:true }));
    } else if (!open && sidebarWasOpen) {
      setSidebarBackgroundInert(false);
      sidebar.removeAttribute('role');
      sidebar.removeAttribute('aria-modal');
      const returnTarget = sidebarReturnFocus?.isConnected ? sidebarReturnFocus : document.querySelector('#menuToggle');
      if (drawerViewport && !document.querySelector('dialog[open]')) requestAnimationFrame(() => returnTarget?.focus({ preventScroll:true }));
      sidebarReturnFocus = null;
    } else if (!drawerViewport) {
      setSidebarBackgroundInert(false);
      sidebar.removeAttribute('role');
      sidebar.removeAttribute('aria-modal');
    }
    sidebarWasOpen = open;
  }

  function labelResponsiveTable(table) {
    const labels = [...table.querySelectorAll('thead th')].map(header => header.textContent.trim());
    table.querySelectorAll('tbody tr').forEach(row => {
      [...row.children].forEach((cell, index) => {
        if (cell.matches('td,th')) cell.dataset.label = labels[index] || '';
      });
    });
  }

  function labelResponsiveTables() {
    document.querySelectorAll('[data-ui="table"]').forEach(labelResponsiveTable);
  }

  function observeCharts(scope = document) {
    if (!chartObserver || typeof ResizeObserver === 'undefined') return;
    elements(scope, chartSelector).forEach(chart => {
      if (chart.classList.contains('contribution-chart')) chart.style.setProperty('--chart-columns', String(Math.max(1, chart.childElementCount)));
      if (observedCharts.has(chart)) return;
      observedCharts.add(chart);
      chartObserver.observe(chart);
      chart.dataset.chartDensity = chartDensity(chart.getBoundingClientRect().width);
    });
  }

  function clearFloatingPosition(menu) {
    delete menu.dataset.floating;
    delete menu.dataset.side;
    for (const property of ['left','top','right','bottom','width','max-height']) menu.style.removeProperty(property);
  }

  function positionMenu(menu) {
    if (menu.hidden || !menu.classList.contains('card-action-menu')) {
      if (menu.hidden) clearFloatingPosition(menu);
      return;
    }
    const trigger = document.querySelector(`[aria-controls="${CSS.escape(menu.id)}"]`);
    if (!trigger) return;
    const bounds = viewportBounds();
    const menuRect = menu.getBoundingClientRect();
    const placement = computeFloatingPosition({
      triggerRect:trigger.getBoundingClientRect(),
      menuSize:{ width:menuRect.width, height:menu.scrollHeight || menuRect.height },
      viewport:bounds
    });
    menu.dataset.floating = 'true';
    menu.dataset.side = placement.side;
    Object.assign(menu.style, {
      left:`${placement.left}px`, top:`${placement.top}px`, right:'auto', bottom:'auto',
      width:`${placement.width}px`, maxHeight:`${placement.maxHeight}px`
    });
  }

  function positionOpenMenus() {
    document.querySelectorAll('.card-action-menu').forEach(positionMenu);
  }

  function focusMenuItem(menu, direction) {
    const items = [...menu.querySelectorAll('[role="menuitem"], [role="menuitemradio"], button:not([disabled])')]
      .filter(item => !item.hidden && item.getClientRects().length);
    if (!items.length) return;
    const current = items.indexOf(document.activeElement);
    let next = 0;
    if (direction === 'end') next = items.length - 1;
    else if (direction === 'next') next = current < 0 ? 0 : (current + 1) % items.length;
    else if (direction === 'previous') next = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length;
    items[next].focus({ preventScroll:true });
  }

  function handleMenuKeyboard(event) {
    const menu = event.target.closest?.('[data-ui="menu"]');
    if (menu && event.key === 'Escape') {
      const trigger = menu.id ? document.querySelector(`[aria-controls="${CSS.escape(menu.id)}"]`) : null;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (trigger?.getAttribute('aria-expanded') === 'true') trigger.click();
      else menu.hidden = true;
      requestAnimationFrame(() => trigger?.focus({ preventScroll:true }));
      return;
    }
    if (menu && ['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
      event.preventDefault();
      focusMenuItem(menu, event.key === 'ArrowDown' ? 'next' : event.key === 'ArrowUp' ? 'previous' : event.key === 'End' ? 'end' : 'start');
      return;
    }
    const trigger = event.target.closest?.('[aria-controls]');
    if (!trigger || event.key !== 'ArrowDown') return;
    const controlled = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!controlled?.matches('[data-ui="menu"]')) return;
    event.preventDefault();
    if (controlled.hidden) trigger.click();
    requestAnimationFrame(() => focusMenuItem(controlled, 'start'));
  }

  function handleTabKeyboard(event) {
    const tab = event.target.closest?.('[role="tab"]');
    if (tab?.matches('[data-help-mode],[data-faq-filter]')) return;
    const list = tab?.closest?.('[role="tablist"], [data-ui="tabs"]');
    if (!tab || !list || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    const tabs = [...list.querySelectorAll('[role="tab"]')].filter(item => !item.disabled && !item.hidden);
    if (tabs.length < 2) return;
    event.preventDefault();
    const current = Math.max(0, tabs.indexOf(tab));
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : event.key === 'ArrowRight' ? (current + 1) % tabs.length : (current - 1 + tabs.length) % tabs.length;
    tabs[next].focus({ preventScroll:true });
    tabs[next].click();
  }

  function handleSidebarKeyboard(event) {
    const sidebar = document.querySelector('#sidebar');
    if (!sidebarWasOpen || !sidebar) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (typeof window.closeSidebar === 'function') window.closeSidebar();
      else document.querySelector('#menuToggle')?.click();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...sidebar.querySelectorAll('button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')]
      .filter(item => !item.hidden && item.getClientRects().length);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault();last.focus({ preventScroll:true }); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault();first.focus({ preventScroll:true }); }
  }

  function handleMenuTriggerClick(event) {
    const trigger = event.target.closest?.('[aria-controls]');
    const controlled = trigger && document.getElementById(trigger.getAttribute('aria-controls'));
    if (!controlled?.matches('[data-ui="menu"]')) return;
    requestAnimationFrame(() => {
      positionMenu(controlled);
      if (!controlled.hidden) focusMenuItem(controlled, 'start');
    });
  }

  function refresh() {
    refreshFrame = 0;
    markPrimitives();
    syncViewport();
    labelResponsiveTables();
    observeCharts();
    positionOpenMenus();
  }

  function scheduleRefresh() {
    if (refreshFrame) return;
    refreshFrame = requestAnimationFrame(refresh);
  }

  function init() {
    if (initialized || typeof document === 'undefined') return;
    initialized = true;
    eventController = new AbortController();
    const signal = eventController.signal;
    chartObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(entries => {
      entries.forEach(entry => { entry.target.dataset.chartDensity = chartDensity(entry.contentRect.width); });
    });
    mutationObserver = new MutationObserver(scheduleRefresh);
    mutationObserver.observe(document.body, {
      subtree:true,
      childList:true,
      attributes:true,
      attributeFilter:['hidden','open','class','aria-selected','aria-pressed']
    });
    window.addEventListener('resize', scheduleRefresh, { signal, passive:true });
    window.addEventListener('scroll', positionOpenMenus, { signal, passive:true, capture:true });
    window.visualViewport?.addEventListener('resize', scheduleRefresh, { signal, passive:true });
    window.visualViewport?.addEventListener('scroll', scheduleRefresh, { signal, passive:true });
    document.addEventListener('keydown', handleMenuKeyboard, { signal, capture:true });
    document.addEventListener('keydown', handleTabKeyboard, { signal, capture:true });
    document.addEventListener('keydown', handleSidebarKeyboard, { signal, capture:true });
    document.addEventListener('click', handleMenuTriggerClick, { signal });
    refresh();
  }

  function destroy() {
    if (!initialized) return;
    cancelAnimationFrame(refreshFrame);
    refreshFrame = 0;
    mutationObserver?.disconnect();
    chartObserver?.disconnect();
    eventController?.abort();
    mutationObserver = null;
    chartObserver = null;
    eventController = null;
    setSidebarBackgroundInert(false);
    const sidebar = document.querySelector('#sidebar');
    sidebar?.removeAttribute('role');
    sidebar?.removeAttribute('aria-modal');
    document.querySelectorAll('.card-action-menu').forEach(clearFloatingPosition);
    document.querySelectorAll('[data-chart-density]').forEach(chart => chart.removeAttribute('data-chart-density'));
    document.querySelectorAll('[data-state],[data-presentation]').forEach(element => {
      element.removeAttribute('data-state');
      element.removeAttribute('data-presentation');
    });
    document.querySelectorAll('[data-ui-kind]').forEach(element => element.removeAttribute('data-ui-kind'));
    const root = document.documentElement;
    root.removeAttribute('data-viewport');
    root.classList.remove('ui-dialog-open');
    document.body?.classList.remove('ui-dialog-open');
    ['--ui-visual-height','--ui-visual-width','--ui-visual-top','--ui-visual-left','--ui-visual-bottom']
      .forEach(property => root.style.removeProperty(property));
    sidebarWasOpen = false;
    sidebarReturnFocus = null;
    initialized = false;
  }

  return Object.freeze({ BREAKPOINTS, chartDensity, computeFloatingPosition, destroy, init, labelResponsiveTable, viewportMode });
});
