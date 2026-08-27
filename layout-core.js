(function exposeMerLayoutCore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerLayoutCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerLayoutCore() {
  'use strict';

  const STORAGE_PREFIX = 'mer-layout-v1:';
  const STORAGE_VERSION = 1;
  const MAX_CARD_ID_LENGTH = 160;
  const RESPONSIVE_CONTEXTS = Object.freeze(['mobile', 'tablet', 'desktop', 'wide']);

  const uniqueStrings = values => {
    const seen = new Set();
    return (Array.isArray(values) ? values : []).flatMap(value => {
      if (typeof value !== 'string') return [];
      const id = value.trim();
      if (!id || id.length > MAX_CARD_ID_LENGTH || seen.has(id)) return [];
      seen.add(id);
      return [id];
    });
  };

  function sanitizeScopeId(value, fallback) {
    return String(value || fallback || 'default')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || String(fallback || 'default');
  }

  function responsiveContext(value) {
    const raw = value && typeof value === 'object' ? value.width : value;
    if (typeof raw === 'string') {
      const normalized = raw.trim().toLowerCase();
      if (RESPONSIVE_CONTEXTS.includes(normalized)) return normalized;
      const numeric = Number(normalized);
      if (!Number.isFinite(numeric)) return 'desktop';
      return responsiveContext(numeric);
    }
    const width = Number(raw);
    if (!Number.isFinite(width) || width <= 0) return 'desktop';
    if (width < 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    if (width >= 1600) return 'wide';
    return 'desktop';
  }

  function sanitizeCardIds(cardIds, allowedCardIds, fallbackOrder = allowedCardIds) {
    const allowed = uniqueStrings(allowedCardIds);
    const allowedSet = new Set(allowed);
    const candidate = uniqueStrings(cardIds).filter(id => allowedSet.has(id));
    const fallback = uniqueStrings(fallbackOrder).filter(id => allowedSet.has(id));
    const result = [];
    const seen = new Set();
    for (const id of [...candidate, ...fallback, ...allowed]) {
      if (seen.has(id)) continue;
      seen.add(id);
      result.push(id);
    }
    return Object.freeze(result);
  }

  function normalizeOrder(knownIds, candidate) {
    return sanitizeCardIds(candidate, knownIds, knownIds);
  }

  function reorderCardIds(cardIds, movedId, target, options = {}) {
    const allowed = Array.isArray(options.allowedCardIds) ? options.allowedCardIds : cardIds;
    const order = [...sanitizeCardIds(cardIds, allowed, allowed)];
    const fromIndex = order.indexOf(String(movedId || '').trim());
    if (fromIndex < 0 || order.length < 2) return Object.freeze(order);

    const [moved] = order.splice(fromIndex, 1);
    let insertionIndex;
    if (Number.isInteger(target)) {
      insertionIndex = Math.max(0, Math.min(order.length, target));
    } else {
      const targetId = String(target || '').trim();
      const targetIndex = order.indexOf(targetId);
      if (targetIndex < 0) return Object.freeze([...order.slice(0, fromIndex), moved, ...order.slice(fromIndex)]);
      insertionIndex = targetIndex + (options.placement === 'after' ? 1 : 0);
    }
    order.splice(insertionIndex, 0, moved);
    return Object.freeze(order);
  }

  function moveItem(order, fromId, toIdOrDelta, options = {}) {
    const allowed = Array.isArray(options.allowedCardIds) ? options.allowedCardIds : order;
    const normalized = [...sanitizeCardIds(order, allowed, allowed)];
    const fromIndex = normalized.indexOf(String(fromId || '').trim());
    if (fromIndex < 0) return Object.freeze(normalized);
    if (typeof toIdOrDelta === 'number' && Number.isFinite(toIdOrDelta)) {
      const destination = Math.max(0, Math.min(normalized.length - 1, fromIndex + Math.trunc(toIdOrDelta)));
      return reorderCardIds(normalized, fromId, destination, { allowedCardIds:allowed });
    }
    return reorderCardIds(normalized, fromId, toIdOrDelta, options);
  }

  function resolveResponsiveOrder(options = {}) {
    const allowed = uniqueStrings(options.allowedCardIds);
    const context = responsiveContext(options.context);
    const stored = options.storedByContext && typeof options.storedByContext === 'object' ? options.storedByContext : {};
    const defaults = options.defaultsByContext && typeof options.defaultsByContext === 'object' ? options.defaultsByContext : {};
    const contextDefault = Array.isArray(defaults[context]) ? defaults[context] : null;
    const desktopDefault = Array.isArray(defaults.desktop) ? defaults.desktop : null;
    const fallback = contextDefault || desktopDefault || allowed;
    const exactStored = Array.isArray(stored[context]) ? stored[context] : null;
    return sanitizeCardIds(exactStored || fallback, allowed, fallback);
  }

  function createLayoutStore(options = {}) {
    const profileId = sanitizeScopeId(options.profileId || options.userId, 'personal');
    const moduleId = sanitizeScopeId(options.moduleId || options.gridId, 'overview');
    const allowedCardIds = Object.freeze(uniqueStrings(options.allowedCardIds));
    if (!allowedCardIds.length) throw new TypeError('Layout store requires at least one allowed card ID');
    const defaultsByContext = options.defaultsByContext && typeof options.defaultsByContext === 'object'
      ? Object.fromEntries(RESPONSIVE_CONTEXTS.flatMap(context => Array.isArray(options.defaultsByContext[context])
        ? [[context, sanitizeCardIds(options.defaultsByContext[context], allowedCardIds, allowedCardIds)]]
        : []))
      : {};
    const key = `${STORAGE_PREFIX}${profileId}:${moduleId}`;
    let fallbackStorage = null;
    try { fallbackStorage = typeof globalThis !== 'undefined' ? globalThis.localStorage : null; }
    catch { fallbackStorage = null; }
    const storage = options.storage || fallbackStorage;
    const now = typeof options.now === 'function' ? options.now : Date.now;
    let memoryRecord = null;
    let storageAvailable = Boolean(storage?.getItem && storage?.setItem);

    function normalizeRecord(value) {
      const source = value && typeof value === 'object' ? value : {};
      const sourceContexts = source.contexts && typeof source.contexts === 'object' ? source.contexts : {};
      const contexts = {};
      for (const context of RESPONSIVE_CONTEXTS) {
        if (Array.isArray(sourceContexts[context])) {
          contexts[context] = sanitizeCardIds(sourceContexts[context], allowedCardIds, defaultsByContext[context] || defaultsByContext.desktop || allowedCardIds);
        }
      }
      if (!contexts.desktop && Array.isArray(source.order)) {
        contexts.desktop = sanitizeCardIds(source.order, allowedCardIds, defaultsByContext.desktop || allowedCardIds);
      }
      return {
        version:STORAGE_VERSION,
        profileId,
        moduleId,
        contexts,
        updatedAt:typeof source.updatedAt === 'string' ? source.updatedAt : null
      };
    }

    function parse(value) {
      try { return value ? JSON.parse(value) : null; } catch { return null; }
    }

    function readRecord() {
      if (storageAvailable) {
        try {
          const parsed = parse(storage.getItem(key));
          if (parsed && typeof parsed === 'object') {
            memoryRecord = normalizeRecord(parsed);
            return memoryRecord;
          }
        } catch { storageAvailable = false; }
      }
      return memoryRecord || normalizeRecord(null);
    }

    function timestamp() {
      const value = new Date(now());
      return Number.isNaN(value.getTime()) ? new Date(0).toISOString() : value.toISOString();
    }

    function writeRecord(record) {
      memoryRecord = normalizeRecord({ ...record, updatedAt:timestamp() });
      if (storageAvailable) {
        try { storage.setItem(key, JSON.stringify(memoryRecord)); }
        catch { storageAvailable = false; }
      }
      return memoryRecord;
    }

    function get(context = 'desktop') {
      const normalizedContext = responsiveContext(context);
      const record = readRecord();
      return resolveResponsiveOrder({
        context:normalizedContext,
        storedByContext:record.contexts,
        defaultsByContext,
        allowedCardIds
      });
    }

    function set(cardIds, context = 'desktop') {
      const normalizedContext = responsiveContext(context);
      const record = readRecord();
      const order = sanitizeCardIds(cardIds, allowedCardIds, defaultsByContext[normalizedContext] || defaultsByContext.desktop || allowedCardIds);
      writeRecord({ ...record, contexts:{ ...record.contexts, [normalizedContext]:order } });
      return order;
    }

    function move(cardId, target, optionsForMove = {}) {
      const context = responsiveContext(optionsForMove.context);
      const order = reorderCardIds(get(context), cardId, target, {
        placement:optionsForMove.placement,
        allowedCardIds
      });
      return set(order, context);
    }

    function reset(context) {
      if (context !== undefined && context !== null) {
        const normalizedContext = responsiveContext(context);
        const record = readRecord();
        const contexts = { ...record.contexts };
        delete contexts[normalizedContext];
        writeRecord({ ...record, contexts });
        return get(normalizedContext);
      }
      memoryRecord = null;
      if (storageAvailable && storage?.removeItem) {
        try { storage.removeItem(key); }
        catch { storageAvailable = false; }
      } else storageAvailable = false;
      return get('desktop');
    }

    function snapshot(context = 'desktop') {
      const normalizedContext = responsiveContext(context);
      const record = readRecord();
      return Object.freeze({
        key,
        version:STORAGE_VERSION,
        profileId,
        moduleId,
        context:normalizedContext,
        order:get(normalizedContext),
        saved:Array.isArray(record.contexts[normalizedContext]),
        updatedAt:record.updatedAt,
        storageAvailable
      });
    }

    return Object.freeze({ key, profileId, moduleId, allowedCardIds, get, set, move, reset, snapshot });
  }

  return Object.freeze({
    STORAGE_PREFIX,
    STORAGE_VERSION,
    MAX_CARD_ID_LENGTH,
    RESPONSIVE_CONTEXTS,
    sanitizeScopeId,
    responsiveContext,
    sanitizeCardIds,
    normalizeOrder,
    reorderCardIds,
    moveItem,
    resolveResponsiveOrder,
    createLayoutStore
  });
});
