(function initializeLayoutPersonalization() {
  'use strict';

  Object.assign(translations.hr, {
    customizeLayout:'Uredi',
    finishLayout:'Završi prilagodbu',
    layoutEditStarted:'Raspored je otključan. Povucite kartice ili koristite Alt + strelice.',
    layoutEditFinished:'Prilagođeni raspored je spremljen.',
    layoutEditActive:'Način prilagodbe rasporeda je aktivan',
    saveAndFinish:'Spremi i završi',
    layoutCardHint:'Povucite za promjenu mjesta',
    layoutCardMoved:'Kartica je premještena na poziciju {position} od {total}.'
  });
  Object.assign(translations.en, {
    customizeLayout:'Edit',
    finishLayout:'Finish customizing',
    layoutEditStarted:'Layout unlocked. Drag cards or use Alt + arrow keys.',
    layoutEditFinished:'Your custom layout has been saved.',
    layoutEditActive:'Layout customization mode is active',
    saveAndFinish:'Save and finish',
    layoutCardHint:'Drag to reposition',
    layoutCardMoved:'Card moved to position {position} of {total}.'
  });
  applyStaticTranslations();

  const core = window.MerLayoutCore;
  const toggles = $$('[data-layout-edit-toggle]');
  const liveRegion = $('#layoutLiveRegion');
  const editStatus = $('#layoutEditStatus');
  const finishButton = $('#layoutEditFinish');
  if (!core || !toggles.length || !liveRegion) return;
  let persistentStorage = null;
  try { persistentStorage = window.localStorage; } catch { persistentStorage = null; }

  const storeCache = new Map();
  const canonicalOrders = new Map([...document.querySelectorAll('[data-layout-grid]')].map(grid => [grid.dataset.layoutGrid, [...grid.children].filter(child => child instanceof HTMLElement && child.hasAttribute('data-layout-card')).map(card => card.dataset.layoutCard).filter(Boolean)]));
  const initializedGrids = new WeakSet();
  let editing = false;
  let nativeDrag = null;
  let pointerDrag = null;
  let suppressClickUntil = 0;
  let syncFrame = 0;
  let resizeTimer = 0;

  const grids = () => [...document.querySelectorAll('[data-layout-grid]')];
  const directCards = grid => [...grid.children].filter(child => child instanceof HTMLElement && child.hasAttribute('data-layout-card'));
  const cardIds = grid => directCards(grid).map(card => card.dataset.layoutCard).filter(Boolean);
  const context = () => core.responsiveContext(window.innerWidth);
  const activeProfileId = () => appState?.activeAccount === 'business' ? 'business' : 'personal';
  const userScope = () => {
    const session = window.MerAuthProvider?.currentSession?.();
    const userId = session?.userId || session?.email || (session?.demo ? 'demo' : 'local');
    const authenticatedScope = core.sanitizeScopeId(userId, 'local').slice(0, 64);
    return `${authenticatedScope}--${activeProfileId()}`;
  };

  function settingsOrder(gridId, responsiveContext, create = false) {
    if (!appState?.settings || typeof appState.settings !== 'object') return null;
    if (!appState.settings.layoutOrders || typeof appState.settings.layoutOrders !== 'object') {
      if (!create) return null;
      appState.settings.layoutOrders = {};
    }
    const scopeId = userScope();
    if (!appState.settings.layoutOrders[scopeId] || typeof appState.settings.layoutOrders[scopeId] !== 'object') {
      if (!create) return null;
      appState.settings.layoutOrders[scopeId] = {};
    }
    if (!appState.settings.layoutOrders[scopeId][gridId] || typeof appState.settings.layoutOrders[scopeId][gridId] !== 'object') {
      if (!create) return null;
      appState.settings.layoutOrders[scopeId][gridId] = {};
    }
    return appState.settings.layoutOrders[scopeId][gridId][responsiveContext] || null;
  }

  function writeSettingsOrder(gridId, responsiveContext, order) {
    settingsOrder(gridId, responsiveContext, true);
    appState.settings.layoutOrders[userScope()][gridId][responsiveContext] = [...order];
  }

  function storeFor(grid) {
    const ids = cardIds(grid);
    if (!ids.length) return null;
    const gridId = grid.dataset.layoutGrid;
    const canonical = core.normalizeOrder(ids, canonicalOrders.get(gridId) || ids);
    const key = `${userScope()}|${gridId}|${[...ids].sort().join('|')}`;
    if (!storeCache.has(key)) {
      storeCache.set(key, core.createLayoutStore({
        storage:persistentStorage,
        profileId:userScope(),
        moduleId:gridId,
        allowedCardIds:canonical,
        defaultsByContext:{ mobile:canonical, tablet:canonical, desktop:canonical, wide:canonical }
      }));
    }
    return storeCache.get(key);
  }

  function orderFor(grid) {
    const store = storeFor(grid);
    if (!store) return [];
    const responsiveContext = context();
    const mirrored = settingsOrder(grid.dataset.layoutGrid, responsiveContext);
    if (!store.snapshot(responsiveContext).saved && Array.isArray(mirrored)) store.set(mirrored, responsiveContext);
    return store.get(responsiveContext);
  }

  function placeCards(grid, order) {
    const cards = new Map(directCards(grid).map(card => [card.dataset.layoutCard, card]));
    const normalized = core.normalizeOrder([...cards.keys()], order);
    if (cardIds(grid).join('|') === normalized.join('|')) return;
    const sentinel = [...grid.children].find(child => !child.hasAttribute?.('data-layout-card')) || null;
    normalized.forEach(id => {
      const card = cards.get(id);
      if (card) grid.insertBefore(card, sentinel);
    });
  }

  function announcePosition(grid, cardId) {
    const order = cardIds(grid);
    const position = Math.max(0, order.indexOf(cardId)) + 1;
    liveRegion.textContent = t('layoutCardMoved', { position, total:order.length });
  }

  function persistOrder(grid, order, movedCardId) {
    const store = storeFor(grid);
    if (!store) return;
    const responsiveContext = context();
    const normalized = store.set(order, responsiveContext);
    writeSettingsOrder(grid.dataset.layoutGrid, responsiveContext, normalized);
    placeCards(grid, normalized);
    if (typeof save === 'function') save('layout-reorder');
    if (movedCardId) announcePosition(grid, movedCardId);
  }

  function interactiveTarget(target) {
    return Boolean(target?.closest?.('button,a,input,select,textarea,label,summary,[contenteditable="true"]'));
  }

  function ensureDragHandle(card) {
    let handle = [...card.children].find(child => child.classList?.contains('layout-drag-handle'));
    if (!handle) {
      handle = document.createElement('button');
      handle.type = 'button';
      handle.className = 'layout-drag-handle';
      handle.textContent = '⋮⋮';
      card.prepend(handle);
    }
    handle.draggable = true;
    handle.dataset.layoutHint = t('layoutCardHint');
    handle.setAttribute('aria-label', t('layoutCardHint'));
    return handle;
  }

  function updateCardEditingState(card) {
    if (editing) {
      if (!card.dataset.layoutHadTabindex) {
        card.dataset.layoutHadTabindex = card.hasAttribute('tabindex') ? 'true' : 'false';
        card.dataset.layoutOriginalTabindex = card.getAttribute('tabindex') || '';
      }
      if (!card.hasAttribute('tabindex')) card.tabIndex = 0;
      card.draggable = true;
      card.setAttribute('aria-grabbed', 'false');
      card.dataset.layoutHint = t('layoutCardHint');
      ensureDragHandle(card);
    } else {
      card.draggable = false;
      card.removeAttribute('aria-grabbed');
      delete card.dataset.layoutHint;
      [...card.children].find(child => child.classList?.contains('layout-drag-handle'))?.remove();
      if (card.dataset.layoutHadTabindex === 'false') card.removeAttribute('tabindex');
      else if (card.dataset.layoutHadTabindex === 'true') card.setAttribute('tabindex', card.dataset.layoutOriginalTabindex);
      delete card.dataset.layoutHadTabindex;
      delete card.dataset.layoutOriginalTabindex;
      card.classList.remove('layout-card-dragging', 'layout-card-drop-before', 'layout-card-drop-after');
    }
  }

  function wireGrid(grid) {
    if (initializedGrids.has(grid)) return;
    initializedGrids.add(grid);
    grid.addEventListener('dragstart', event => {
      const card = event.target.closest?.('[data-layout-card]');
      const fromHandle = Boolean(event.target.closest?.('.layout-drag-handle'));
      if (!editing || !card || card.parentElement !== grid || (interactiveTarget(event.target) && !fromHandle)) {
        event.preventDefault();
        return;
      }
      cancelPointerDrag();
      nativeDrag = { grid, card, moved:false };
      card.classList.add('layout-card-dragging');
      card.setAttribute('aria-grabbed', 'true');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', card.dataset.layoutCard);
    });
    grid.addEventListener('dragover', event => {
      if (!nativeDrag || nativeDrag.grid !== grid) return;
      event.preventDefault();
      const target = event.target.closest?.('[data-layout-card]');
      if (!target || target === nativeDrag.card || target.parentElement !== grid) return;
      directCards(grid).forEach(card => card.classList.remove('layout-card-drop-before', 'layout-card-drop-after'));
      const rect = target.getBoundingClientRect();
      const after = placementForPoint(grid, target, event.clientX, event.clientY) === 'after';
      target.classList.add(after ? 'layout-card-drop-after' : 'layout-card-drop-before');
      nativeDrag.target = target;
      nativeDrag.placement = after ? 'after' : 'before';
    });
    grid.addEventListener('drop', event => {
      if (!nativeDrag || nativeDrag.grid !== grid) return;
      event.preventDefault();
      const { card, target, placement } = nativeDrag;
      if (target && target !== card) {
        const order = core.moveItem(orderFor(grid), card.dataset.layoutCard, target.dataset.layoutCard, { placement, allowedCardIds:cardIds(grid) });
        nativeDrag.moved = true;
        persistOrder(grid, order, card.dataset.layoutCard);
        suppressClickUntil = performance.now() + 300;
      }
    });
    grid.addEventListener('dragend', () => {
      cancelNativeDrag();
    });
  }

  function clearDragPresentation(grid) {
    if (!grid) return;
    directCards(grid).forEach(card => {
      card.classList.remove('layout-card-dragging', 'layout-card-drop-before', 'layout-card-drop-after');
      if (editing) card.setAttribute('aria-grabbed', 'false');
    });
  }

  function cancelNativeDrag() {
    clearDragPresentation(nativeDrag?.grid);
    nativeDrag = null;
  }

  function placementForPoint(grid, target, clientX, clientY) {
    const rect = target.getBoundingClientRect();
    const columns = getComputedStyle(grid).gridTemplateColumns
      .split(/\s+/)
      .filter(Boolean).length;
    return columns > 1
      ? (clientX >= rect.left + rect.width / 2 ? 'after' : 'before')
      : (clientY >= rect.top + rect.height / 2 ? 'after' : 'before');
  }

  function syncGrid(grid) {
    wireGrid(grid);
    placeCards(grid, orderFor(grid));
    directCards(grid).forEach(updateCardEditingState);
  }

  function syncToggles() {
    toggles.forEach(toggle => {
      const labelText = t(editing ? 'finishLayout' : 'customizeLayout');
      toggle.setAttribute('aria-pressed', String(editing));
      toggle.setAttribute('aria-label', labelText);
      toggle.classList.toggle('active', editing);
      const label = toggle.querySelector('span');
      if (label) label.textContent = labelText;
    });
    if (editStatus) editStatus.hidden = !editing;
  }

  function syncAll() {
    cancelAnimationFrame(syncFrame);
    syncFrame = 0;
    syncToggles();
    grids().forEach(syncGrid);
  }

  function scheduleSync() {
    if (syncFrame) return;
    syncFrame = requestAnimationFrame(syncAll);
  }

  function setEditing(next, { notify = true } = {}) {
    if (!next) {
      cancelNativeDrag();
      cancelPointerDrag();
    }
    editing = Boolean(next);
    document.body.classList.toggle('layout-editing', editing);
    syncToggles();
    grids().forEach(grid => directCards(grid).forEach(updateCardEditingState));
    if (notify && typeof showToast === 'function') showToast(t(editing ? 'layoutEditStarted' : 'layoutEditFinished'));
  }

  toggles.forEach(toggle => toggle.addEventListener('click', () => setEditing(!editing)));
  finishButton?.addEventListener('click', () => setEditing(false));
  document.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil && event.target.closest?.('[data-layout-card]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented) return;
    if (event.key === 'Escape' && editing) { setEditing(false);return; }
    if (!editing || !event.altKey || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
    const card = event.target.closest?.('[data-layout-card]');
    const grid = card?.parentElement;
    if (!card || !grid?.hasAttribute('data-layout-grid')) return;
    if (interactiveTarget(event.target) && !event.target.closest?.('.layout-drag-handle')) return;
    event.preventDefault();
    const delta = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
    const order = core.moveItem(orderFor(grid), card.dataset.layoutCard, delta, { allowedCardIds:cardIds(grid) });
    persistOrder(grid, order, card.dataset.layoutCard);
    card.focus({ preventScroll:true });
  });

  document.addEventListener('pointerdown', event => {
    if (!editing || event.pointerType === 'mouse' || event.button !== 0 || !event.target.closest?.('.layout-drag-handle')) return;
    const card = event.target.closest?.('[data-layout-card]');
    const grid = card?.parentElement;
    if (!card || !grid?.hasAttribute('data-layout-grid')) return;
    const order = orderFor(grid);
    pointerDrag = { pointerId:event.pointerId, card, grid, x:event.clientX, y:event.clientY, order:[...order], initialOrder:[...order], moved:false, reordered:false };
    card.setPointerCapture?.(event.pointerId);
  }, true);
  document.addEventListener('pointermove', event => {
    if (!pointerDrag || event.pointerId !== pointerDrag.pointerId) return;
    const distance = Math.hypot(event.clientX - pointerDrag.x, event.clientY - pointerDrag.y);
    if (!pointerDrag.moved && distance < 8) return;
    event.preventDefault();
    pointerDrag.moved = true;
    pointerDrag.card.classList.add('layout-card-dragging');
    pointerDrag.card.setAttribute('aria-grabbed', 'true');
    const target = document.elementsFromPoint(event.clientX, event.clientY)
      .map(element => element.closest?.('[data-layout-card]'))
      .find(card => card && card !== pointerDrag.card && card.parentElement === pointerDrag.grid);
    if (!target) return;
    const placement = placementForPoint(pointerDrag.grid, target, event.clientX, event.clientY);
    const next = core.moveItem(pointerDrag.order, pointerDrag.card.dataset.layoutCard, target.dataset.layoutCard, { placement, allowedCardIds:cardIds(pointerDrag.grid) });
    if (next.join('|') === pointerDrag.order.join('|')) return;
    pointerDrag.order = [...next];
    pointerDrag.reordered = true;
    placeCards(pointerDrag.grid, next);
  }, { capture:true, passive:false });
  function settlePointerDrag({ commit = false, pointerId = pointerDrag?.pointerId } = {}) {
    if (!pointerDrag || pointerId !== pointerDrag.pointerId) return;
    const { grid, card, order, initialOrder, moved, reordered } = pointerDrag;
    pointerDrag = null;
    if (card.hasPointerCapture?.(pointerId)) card.releasePointerCapture(pointerId);
    clearDragPresentation(grid);
    if (commit && reordered) {
      persistOrder(grid, order, card.dataset.layoutCard);
    } else if (reordered) {
      placeCards(grid, initialOrder);
    }
    if (moved) {
      suppressClickUntil = performance.now() + 350;
    }
  }
  function finishPointerDrag(event) { settlePointerDrag({ commit:true, pointerId:event.pointerId }); }
  function cancelPointerDrag(event) { settlePointerDrag({ commit:false, pointerId:event?.pointerId ?? pointerDrag?.pointerId }); }
  document.addEventListener('pointerup', finishPointerDrag, true);
  document.addEventListener('pointercancel', cancelPointerDrag, true);
  document.addEventListener('lostpointercapture', cancelPointerDrag, true);

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(scheduleSync, 120);
  });
  const observer = new MutationObserver(mutations => {
    if (mutations.some(mutation => mutation.type === 'childList' || mutation.attributeName === 'hidden')) scheduleSync();
  });
  observer.observe($('#appShell'), { subtree:true, childList:true, attributes:true, attributeFilter:['hidden'] });
  reactiveStore.subscribe(event => {
    if (event.reason === 'account-switch') {
      cancelNativeDrag();
      cancelPointerDrag();
    }
    scheduleSync();
  });

  syncAll();
  window.MerLayoutUi = Object.freeze({
    enable:() => setEditing(true),
    disable:options => setEditing(false, options),
    toggle:() => setEditing(!editing),
    sync:syncAll,
    isEditing:() => editing
  });
})();
