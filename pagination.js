(function paginationModule(root) {
  'use strict';
  function paginate(items, requestedPage = 1, requestedSize = 4) {
    const rows = Array.isArray(items) ? items : [];
    const pageSize = Math.max(1, Math.min(6, Math.floor(Number(requestedSize) || 4)));
    const pages = Math.max(1, Math.ceil(rows.length / pageSize));
    const page = Math.max(1, Math.min(pages, Math.floor(Number(requestedPage) || 1)));
    return { page, pages, pageSize, total: rows.length, start: (page - 1) * pageSize, items: rows.slice((page - 1) * pageSize, page * pageSize) };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { paginate };
  if (!root?.document) return;
  const document = root.document, records = new WeakMap(), active = new Set();
  const invalidTargets = new WeakMap();
  function revealInvalidField(event, reveal) {
    const owner = event.target.form || event.target.closest('dialog') || event.target;
    if (!invalidTargets.has(owner)) {
      invalidTargets.set(owner, event.target);
      root.setTimeout(() => invalidTargets.delete(owner), 0);
    }
    if (invalidTargets.get(owner) === event.target) reveal();
    else event.preventDefault();
  }
  let nextId = 0;
  function attach(container, options = {}) {
    if (!container) return null;
    if (records.has(container)) {
      const controller = records.get(container);
      controller.configure(options);
      return controller;
    }
    let config = options, page = 1, lastScope, frame = 0, destroyed = false;
    if (!container.id) container.id = `merPagedList${++nextId}`;
    container.classList.add('mer-paged-list');
    const nav = document.createElement('nav');
    nav.className = 'mer-pagination';
    const previous = document.createElement('button'), status = document.createElement('span'), next = document.createElement('button');
    previous.type = next.type = 'button';
    previous.className = next.className = 'secondary-button compact-button';
    previous.setAttribute('aria-controls', container.id);
    next.setAttribute('aria-controls', container.id);
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    nav.append(previous, status, next);
    const scope = () => typeof config.scopeKey === 'function' ? config.scopeKey() : config.scopeKey;
    function refresh() {
      frame = 0;
      if (destroyed || !container.isConnected) return;
      const scopeKey = scope();
      if (scopeKey !== lastScope) { page = 1; lastScope = scopeKey; }
      const children = [...container.children];
      const items = children.filter(item => !item.hidden && (!config.itemSelector || item.matches(config.itemSelector)));
      const size = typeof config.pageSize === 'function' ? config.pageSize() : config.pageSize;
      const result = paginate(items, page, size);
      page = result.page;
      const visible = new Set(result.items);
      children.forEach(item => {
        const outside = items.includes(item) && !visible.has(item);
        if (outside) item.setAttribute('data-page-hidden', 'true');
        else item.removeAttribute('data-page-hidden');
      });
      const anchor = config.navAnchor || container;
      if (nav.previousElementSibling !== anchor) anchor.after(nav);
      const english = document.documentElement.lang === 'en';
      nav.setAttribute('aria-label', config.label || (english ? 'List pages' : 'Stranice popisa'));
      nav.hidden = result.pages <= 1;
      const previousLabel = english ? 'Previous' : 'Prethodna', nextLabel = english ? 'Next' : 'Sljedeća';
      const summary = `${page} / ${result.pages} · ${result.total}`;
      if (previous.textContent !== previousLabel) previous.textContent = previousLabel;
      if (next.textContent !== nextLabel) next.textContent = nextLabel;
      if (status.textContent !== summary) status.textContent = summary;
      previous.disabled = page <= 1;
      next.disabled = page >= result.pages;
      container.dataset.page = String(page);
      config.onPage?.(result);
      return result;
    }
    function schedule() { if (!frame && !destroyed) frame = root.requestAnimationFrame(refresh); }
    function goTo(value, moveFocus = false) {
      page = value;
      const result = refresh();
      if (moveFocus && nav.contains(document.activeElement) && document.activeElement.disabled) {
        (next.disabled ? previous : next).focus({ preventScroll: true });
      }
      return result;
    }
    previous.addEventListener('click', () => goTo(page - 1, true));
    next.addEventListener('click', () => goTo(page + 1, true));
    const revealInvalid = event => {
      const items = [...container.children].filter(item => !item.hidden && (!config.itemSelector || item.matches(config.itemSelector)));
      const index = items.findIndex(item => item.contains(event.target));
      const size = paginate([], 1, typeof config.pageSize === 'function' ? config.pageSize() : config.pageSize).pageSize;
      if (index >= 0) revealInvalidField(event, () => goTo(Math.floor(index / size) + 1));
    };
    container.addEventListener('invalid', revealInvalid, true);
    const observer = new root.MutationObserver(schedule);
    observer.observe(container, { childList: true, attributes: true, attributeFilter: ['hidden'], subtree: true });
    const controller = {
      refresh, schedule, goTo,
      reset() { page = 1; return refresh(); },
      configure(value) { config = { ...config, ...value }; refresh(); },
      destroy() {
        destroyed = true; observer.disconnect(); root.cancelAnimationFrame(frame); nav.remove();
        container.removeEventListener('invalid', revealInvalid, true);
        [...container.children].forEach(item => item.removeAttribute('data-page-hidden'));
        active.delete(controller); records.delete(container);
      },
      get connected() { return container.isConnected; },
      get page() { return page; }
    };
    active.add(controller); records.set(container, controller); refresh();
    return controller;
  }
  function refreshAll() {
    active.forEach(controller => controller.connected ? controller.schedule() : controller.destroy());
  }
  root.addEventListener('resize', refreshAll);
  new root.MutationObserver(refreshAll).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  // Renderers replace list nodes; release their observers rather than retaining old profiles.
  new root.MutationObserver(() => {
    active.forEach(controller => { if (!controller.connected) controller.destroy(); });
  }).observe(document.body, { childList: true, subtree: true });
  root.MerPagination = { paginate, attach, refreshAll, revealInvalidField };
})(typeof window !== 'undefined' ? window : null);
