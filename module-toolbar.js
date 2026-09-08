(function moduleToolbar(root) {
  'use strict';
  const doc = root.document;
  if (!doc || root.MerModuleToolbar) return;
  const views = [
    ['overviewView', 'Pregled', 'Overview'], ['budgetsView', 'Budžeti', 'Budgets'],
    ['savingsView', 'Štednja', 'Savings'], ['activityView', 'Aktivnost', 'Activity'],
    ['insightsView', 'Uvidi', 'Insights']
  ];
  const records = [];
  let active = null, refreshQueued = false, positionFrame = 0;
  const english = () => doc.documentElement.lang === 'en';
  const copy = (hr, en) => english() ? en : hr;
  const setText = (node, text) => { if (node.textContent !== text) node.textContent = text; };
  const setAttribute = (node, key, value) => { if (node.getAttribute(key) !== value) node.setAttribute(key, value); };

  function available(record) {
    return [...record.menu.querySelectorAll('button, a[href]')].filter(node => {
      if (node.disabled || node.getAttribute('aria-disabled') === 'true') return false;
      for (let parent = node; parent && parent !== record.menu; parent = parent.parentElement) {
        if (parent.hidden || root.getComputedStyle(parent).display === 'none') return false;
      }
      return true;
    });
  }

  function returnFocusTarget(element) {
    const menu = element?.closest?.('.module-toolbar-menu');
    return records.find(record => record.menu === menu)?.trigger || element;
  }

  function closeAll({restoreFocus = false} = {}) {
    const record = active;
    if (!record) return;
    active = null;
    setAttribute(record.trigger, 'aria-expanded', 'false');
    if (typeof record.menu.hidePopover === 'function') {
      try { record.menu.hidePopover(); } catch { /* A modal may already have closed the popover. */ }
    }
    record.menu.hidden = true;
    record.menu.removeAttribute('data-open');
    if (restoreFocus && !record.view.hidden && record.trigger.isConnected) record.trigger.focus({preventScroll:true});
  }

  function place(record) {
    if (active !== record) return;
    const viewport = root.visualViewport;
    const leftEdge = (viewport?.offsetLeft || 0) + 12;
    const topEdge = (viewport?.offsetTop || 0) + 12;
    const width = viewport?.width || root.innerWidth;
    const height = viewport?.height || root.innerHeight;
    const rightEdge = leftEdge + width - 24, bottomEdge = topEdge + height - 24;
    const anchor = record.trigger.getBoundingClientRect();
    record.menu.style.width = `${Math.min(310, Math.max(44, width - 24))}px`;
    record.menu.style.maxHeight = `${Math.max(44, height - 24)}px`;
    const bounds = record.menu.getBoundingClientRect();
    const wantedHeight = Math.min(record.menu.scrollHeight + 2, height - 24);
    const below = Math.max(0, bottomEdge - anchor.bottom - 8);
    const above = Math.max(0, anchor.top - topEdge - 8);
    const downward = wantedHeight <= below || below >= above;
    const space = downward ? below : above;
    const shownHeight = Math.min(wantedHeight, Math.max(44, space));
    record.menu.style.maxHeight = `${Math.max(44, space)}px`;
    record.menu.style.left = `${Math.max(leftEdge, Math.min(anchor.right - bounds.width, rightEdge - bounds.width))}px`;
    record.menu.style.top = `${Math.max(topEdge, Math.min(downward ? anchor.bottom + 8 : anchor.top - shownHeight - 8, bottomEdge - shownHeight))}px`;
  }

  function positionSoon() {
    if (!active || positionFrame) return;
    positionFrame = root.requestAnimationFrame(() => { positionFrame = 0; if (active) place(active); });
  }

  function focusItem(record, index) {
    const items = available(record);
    if (!items.length) { closeAll({restoreFocus:true}); return; }
    const selected = items[(index + items.length) % items.length];
    items.forEach(item => { item.tabIndex = item === selected ? 0 : -1; });
    selected.focus({preventScroll:true});
    selected.scrollIntoView?.({block:'nearest', inline:'nearest'});
  }

  function open(record, last = false) {
    closeAll();
    if (record.view.hidden || !available(record).length || doc.querySelector('dialog[open]')) return;
    active = record;
    record.menu.hidden = false;
    record.menu.setAttribute('data-open', '');
    setAttribute(record.trigger, 'aria-expanded', 'true');
    if (typeof record.menu.showPopover === 'function') record.menu.showPopover();
    place(record);
    focusItem(record, last ? available(record).length - 1 : 0);
  }

  function refresh() {
    refreshQueued = false;
    for (const record of records) {
      const {heading, menu, wrap, trigger, caption, view} = record;
      // Move original nodes, never clone or recreate a transaction/export listener.
      let keptPrimary = false;
      [...heading.children].forEach(node => {
        if (node === wrap) return;
        if (node.matches('button.primary-button') && !keptPrimary) { keptPrimary = true; return; }
        node.classList.remove('primary-button');
        if (node.matches('button')) node.classList.add('secondary-button');
        menu.append(node);
      });
      menu.querySelectorAll('button, a[href]').forEach(node => {
        setAttribute(node, 'role', 'menuitem');
        if (!node.hasAttribute('tabindex')) node.tabIndex = -1;
      });
      menu.querySelectorAll('.data-action-pair').forEach(node => setAttribute(node, 'role', 'none'));
      setText(caption, copy('Više opcija', 'More options'));
      setAttribute(trigger, 'aria-label', `${caption.textContent} — ${english() ? record.en : record.hr}`);
      const empty = available(record).length === 0;
      if (wrap.hidden !== empty) wrap.hidden = empty;
      if (active === record && (view.hidden || empty || doc.querySelector('dialog[open]'))) closeAll();
    }
    positionSoon();
  }

  function refreshSoon() {
    if (refreshQueued) return;
    refreshQueued = true;
    root.queueMicrotask(refresh);
  }

  for (const [id, hr, en] of views) {
    const view = doc.getElementById(id), heading = view?.querySelector('.heading-actions');
    if (!heading) continue;
    heading.classList.add('module-toolbar');
    const wrap = doc.createElement('div'); wrap.className = 'module-toolbar-wrap';
    const trigger = doc.createElement('button'); trigger.type = 'button'; trigger.className = 'secondary-button module-toolbar-trigger';
    trigger.id = `${id}MoreOptions`; trigger.setAttribute('aria-haspopup', 'menu'); trigger.setAttribute('aria-expanded', 'false');
    const icon = doc.createElementNS('http://www.w3.org/2000/svg', 'svg'); icon.setAttribute('aria-hidden', 'true');
    const use = doc.createElementNS('http://www.w3.org/2000/svg', 'use'); use.setAttribute('href', '#icon-more'); icon.append(use);
    const caption = doc.createElement('span'); trigger.append(icon, caption);
    const menu = doc.createElement('div'); menu.id = `${id}OptionsMenu`; menu.className = 'module-toolbar-menu';
    menu.setAttribute('role', 'menu'); menu.setAttribute('aria-labelledby', trigger.id); menu.setAttribute('popover', 'auto'); menu.hidden = true;
    trigger.setAttribute('aria-controls', menu.id); wrap.append(trigger, menu); heading.prepend(wrap);
    const record = {view, heading, wrap, trigger, menu, caption, hr, en}; records.push(record);
    trigger.addEventListener('click', () => active === record ? closeAll({restoreFocus:true}) : open(record));
    trigger.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(record, event.key === 'ArrowUp'); }
    });
    // Capture closes before the original click listener opens its modal; its return
    // focus is the visible trigger, not an action in an already dismissed popover.
    menu.addEventListener('click', event => {
      if (event.target.closest('[role="menuitem"]')) closeAll({restoreFocus:true});
    }, true);
    menu.addEventListener('keydown', event => {
      const items = available(record), index = items.indexOf(doc.activeElement);
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        focusItem(record, event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : index + (event.key === 'ArrowUp' ? -1 : 1));
      } else if (event.key === 'Tab') closeAll({restoreFocus:true});
    });
    menu.addEventListener('toggle', event => { if (event.newState === 'closed' && active === record) closeAll(); });
  }
  doc.addEventListener('keydown', event => {
    if (!active || event.defaultPrevented || event.key !== 'Escape') return;
    event.preventDefault(); event.stopPropagation(); closeAll({restoreFocus:true});
  }, true);
  doc.addEventListener('pointerdown', event => { if (active && !active.wrap.contains(event.target)) closeAll(); }, true);
  doc.addEventListener('focusin', event => { if (active && !active.wrap.contains(event.target)) closeAll(); });
  doc.addEventListener('toggle', event => { if (event.target.matches?.('dialog[open]')) closeAll(); }, true);
  root.addEventListener('resize', positionSoon);
  root.addEventListener('scroll', event => { if (active && !active.menu.contains(event.target)) positionSoon(); }, true);
  root.visualViewport?.addEventListener('resize', positionSoon);
  root.visualViewport?.addEventListener('scroll', positionSoon);
  root.addEventListener('mer-security-status', () => closeAll());
  root.addEventListener('mer:auth-change', () => closeAll());
  if (root.MutationObserver) {
    const observer = new root.MutationObserver(refreshSoon);
    records.forEach(record => {
      observer.observe(record.heading, {childList:true, subtree:true, attributes:true, attributeFilter:['hidden', 'disabled']});
      observer.observe(record.view, {attributes:true, attributeFilter:['hidden']});
    });
    observer.observe(doc.documentElement, {attributes:true, attributeFilter:['lang']});
  }
  root.MerModuleToolbar = Object.freeze({closeAll, returnFocusTarget, refresh});
  refresh();
})(window);
