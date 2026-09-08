(function exposeMerCircleText(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerCircleText = api;
  if (root && root.document) {
    const start = () => api.start(root.document);
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once:true });
    else start();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerCircleText() {
  'use strict';

  const FIT_PROPERTY = 'font-size';
  const controllers = new WeakMap();

  // A line above the secondary label has less room than the circle's diameter.
  function circleChordWidth(radius, top, bottom, centerY = 0) {
    if (![radius, top, bottom, centerY].every(Number.isFinite) || radius <= 0) return 0;
    const distance = Math.max(Math.abs(top - centerY), Math.abs(bottom - centerY));
    return distance >= radius ? 0 : 2 * Math.sqrt((radius - distance) * (radius + distance));
  }

  function rectangleFitsCircle(rect, circle, padding = 0) {
    if (!rect || !circle) return false;
    const radius = circle.radius - Math.max(0, padding);
    const width = circleChordWidth(radius, rect.top, rect.bottom, circle.y);
    return width > 0 && rect.left >= circle.x - width / 2 && rect.right <= circle.x + width / 2;
  }

  // This proportional estimate gives the DOM search a useful starting point.
  // There is intentionally no fixed minimum: large amounts keep every digit.
  function fitFontSize({ maxFontSize, width, height, radius, labelHeight = 0, padding = 3 }) {
    if (![maxFontSize, width, height, radius, labelHeight, padding].every(Number.isFinite)
      || maxFontSize <= 0 || width < 0 || height < 0 || radius <= padding) return 0;
    const fits = size => {
      const scale = size / maxFontSize;
      const top = -(height * scale + Math.max(0, labelHeight)) / 2;
      return width * scale <= circleChordWidth(radius - Math.max(0, padding), top, top + height * scale);
    };
    if (fits(maxFontSize)) return maxFontSize;
    let low = 0;
    let high = maxFontSize;
    for (let step = 0; step < 24; step += 1) {
      const mid = (low + high) / 2;
      if (fits(mid)) low = mid;
      else high = mid;
    }
    return low;
  }

  function observe(ring, text) {
    if (!ring || !text) return null;
    if (controllers.has(text)) return controllers.get(text);
    const doc = text.ownerDocument;
    const win = doc.defaultView;
    const originalValue = text.style.getPropertyValue(FIT_PROPERTY);
    const originalPriority = text.style.getPropertyPriority(FIT_PROPERTY);
    const range = doc.createRange();
    const label = ring.querySelector('span');
    let frame = null;
    let destroyed = false;

    function measure() {
      const box = text.getBoundingClientRect();
      range.selectNodeContents(text);
      const glyphs = range.getBoundingClientRect();
      if (!glyphs.width || !glyphs.height) return box;
      return {
        left:Math.min(box.left, glyphs.left), right:Math.max(box.right, glyphs.right),
        top:Math.min(box.top, glyphs.top), bottom:Math.max(box.bottom, glyphs.bottom)
      };
    }

    function fit() {
      if (destroyed) return;
      const outer = ring.getBoundingClientRect();
      if (!outer.width || !outer.height || !text.textContent) return;
      const inset = win.getComputedStyle(ring, '::before');
      const border = win.getComputedStyle(ring);
      const px = value => Number.parseFloat(value) || 0;
      const scaleX = outer.width / (ring.offsetWidth || outer.width);
      const scaleY = outer.height / (ring.offsetHeight || outer.height);
      const left = (px(border.borderLeftWidth) + px(inset.left)) * scaleX;
      const right = (px(border.borderRightWidth) + px(inset.right)) * scaleX;
      const top = (px(border.borderTopWidth) + px(inset.top)) * scaleY;
      const bottom = (px(border.borderBottomWidth) + px(inset.bottom)) * scaleY;
      const circle = {
        x:outer.left + left + (outer.width - left - right) / 2,
        y:outer.top + top + (outer.height - top - bottom) / 2,
        radius:Math.min(outer.width - left - right, outer.height - top - bottom) / 2
      };
      const padding = 3 * Math.min(scaleX, scaleY);
      if (circle.radius <= padding) return;
      if (originalValue) text.style.setProperty(FIT_PROPERTY, originalValue, originalPriority);
      else text.style.removeProperty(FIT_PROPERTY);
      const preferredStyle = win.getComputedStyle(text);
      const maxFontSize = px(preferredStyle.fontSize) || 28;
      const setSize = size => text.style.setProperty(FIT_PROPERTY, `${size}px`);
      setSize(maxFontSize);
      const full = measure();
      if (rectangleFitsCircle(full, circle, padding)) return;

      const groupHeight = text.parentElement.getBoundingClientRect().height;
      let low = 0;
      let high = maxFontSize;
      let candidate = fitFontSize({
        maxFontSize, width:full.right - full.left, height:full.bottom - full.top,
        radius:circle.radius, labelHeight:Math.max(0, groupHeight - (full.bottom - full.top)), padding
      });
      // Check real line boxes and font metrics at every candidate; web fonts,
      // kerning, zoom and the label's vertical offset need not scale perfectly.
      for (let step = 0; step < 15; step += 1) {
        setSize(Math.max(maxFontSize / 65536, candidate));
        if (rectangleFitsCircle(measure(), circle, padding)) low = Math.max(maxFontSize / 65536, candidate);
        else high = candidate;
        candidate = (low + high) / 2;
      }
      setSize(Math.max(maxFontSize / 65536, low));
    }

    function schedule() {
      if (destroyed || frame !== null) return;
      frame = win.requestAnimationFrame(() => {
        frame = null;
        fit();
      });
    }

    const resizeObserver = typeof win.ResizeObserver === 'function' ? new win.ResizeObserver(schedule) : null;
    // Observing the fitted text/group would feed our own size writes back in.
    resizeObserver?.observe(ring);
    if (label) resizeObserver?.observe(label);
    const mutationObserver = new win.MutationObserver(schedule);
    mutationObserver.observe(ring, { childList:true, characterData:true, subtree:true });
    win.addEventListener('resize', schedule);
    const fonts = doc.fonts;
    if (fonts) {
      Promise.resolve(fonts.ready).then(schedule, () => {});
      fonts.addEventListener?.('loadingdone', schedule);
    }

    const controller = {
      fit,
      schedule,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        if (frame !== null) win.cancelAnimationFrame(frame);
        resizeObserver?.disconnect();
        mutationObserver.disconnect();
        win.removeEventListener('resize', schedule);
        fonts?.removeEventListener?.('loadingdone', schedule);
        range.detach?.();
        if (originalValue) text.style.setProperty(FIT_PROPERTY, originalValue, originalPriority);
        else text.style.removeProperty(FIT_PROPERTY);
        controllers.delete(text);
      }
    };
    controllers.set(text, controller);
    schedule();
    return controller;
  }

  function start(doc) {
    return observe(doc.getElementById('safeRing'), doc.getElementById('safeDaily'));
  }

  return Object.freeze({ circleChordWidth, rectangleFitsCircle, fitFontSize, observe, start });
});
