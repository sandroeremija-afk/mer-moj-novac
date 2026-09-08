'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const CircleText = require('../circle-text.js');

test('circular fitting respects the chord above the daily label, not just the diameter', () => {
  assert.equal(CircleText.circleChordWidth(50, -30, 10), 80);
  assert.equal(CircleText.circleChordWidth(50, -50, 10), 0);
  assert.equal(CircleText.circleChordWidth(NaN, -30, 10), 0);
  assert.equal(CircleText.rectangleFitsCircle({ left:-44, right:44, top:-30, bottom:10 }, { x:0, y:0, radius:50 }), false);
  assert.equal(CircleText.rectangleFitsCircle({ left:-39, right:39, top:-30, bottom:10 }, { x:0, y:0, radius:50 }), true);
});

test('proportional fitting retains a scalable lower size for large positive and signed amounts', () => {
  for (const radius of [41, 59]) {
    for (const amount of ['12.500,00 €', '10000 €', '-12.500,00 €', '-123.456.789.012.345,00 €', `${'9'.repeat(309)},00 €`]) {
      const maxFontSize = radius === 41 ? 21 : 28;
      const width = amount.length * maxFontSize * 0.64;
      const labelHeight = 20;
      const size = CircleText.fitFontSize({ maxFontSize, width, height:maxFontSize, radius, labelHeight });
      const ratio = size / maxFontSize;
      const top = -(maxFontSize * ratio + labelHeight) / 2;
      const rect = { left:-width * ratio / 2, right:width * ratio / 2, top, bottom:top + maxFontSize * ratio };
      assert.ok(size > 0 && size <= maxFontSize, amount);
      assert.ok(CircleText.rectangleFitsCircle(rect, { x:0, y:0, radius }, 3), amount);
    }
  }
  assert.equal(CircleText.fitFontSize({ maxFontSize:28, width:20, height:28, radius:59, labelHeight:20 }), 28);
  assert.equal(CircleText.fitFontSize({ maxFontSize:28, width:NaN, height:28, radius:59 }), 0);
});

function fixture() {
  let width = 102;
  let maxSize = 21;
  let nextFrame = 1;
  let ready;
  const frames = new Map();
  const resizeInstances = [];
  const mutationInstances = [];
  const listeners = new Map();
  const fontListeners = new Map();
  const values = new Map();
  const style = {
    getPropertyValue:key => values.get(key) || '',
    getPropertyPriority:() => '',
    setProperty:(key, value) => values.set(key, value),
    removeProperty:key => values.delete(key)
  };
  const size = () => Number.parseFloat(values.get('font-size')) || maxSize;
  const box = () => {
    const textWidth = text.textContent.length * size() * 0.64;
    const textHeight = size() * 1.2;
    const top = width / 2 - (textHeight + 20) / 2;
    return { left:width / 2 - textWidth / 2, right:width / 2 + textWidth / 2, top, bottom:top + textHeight, width:textWidth, height:textHeight };
  };
  const glyphBox = () => {
    const rect = box();
    return { ...rect, top:rect.top - size() * 0.08, bottom:rect.bottom + size() * 0.12, height:size() * 1.4 };
  };
  const label = {};
  const ring = {
    get offsetWidth() { return width; },
    get offsetHeight() { return width; },
    getBoundingClientRect:() => ({ left:0, top:0, width, height:width }),
    querySelector:() => label
  };
  const fonts = {
    ready:new Promise(resolve => { ready = resolve; }),
    addEventListener:(name, callback) => fontListeners.set(name, callback),
    removeEventListener:name => fontListeners.delete(name)
  };
  const win = {
    requestAnimationFrame:callback => { const id = nextFrame++; frames.set(id, callback); return id; },
    cancelAnimationFrame:id => frames.delete(id),
    getComputedStyle:(element, pseudo) => pseudo
      ? { left:'10px', right:'10px', top:'10px', bottom:'10px' }
      : element === ring ? {} : { fontSize:`${size()}px`, getPropertyValue:() => `${maxSize}px` },
    addEventListener:(name, callback) => listeners.set(name, callback),
    removeEventListener:name => listeners.delete(name),
    ResizeObserver:class {
      constructor(callback) { this.callback = callback; this.targets = []; resizeInstances.push(this); }
      observe(target) { this.targets.push(target); }
      disconnect() { this.disconnected = true; }
    },
    MutationObserver:class {
      constructor(callback) { this.callback = callback; mutationInstances.push(this); }
      observe(target, options) { this.target = target; this.options = options; }
      disconnect() { this.disconnected = true; }
    }
  };
  const doc = {
    defaultView:win,
    fonts,
    createRange:() => ({ selectNodeContents() {}, getBoundingClientRect:glyphBox, detach() {} })
  };
  const text = {
    ownerDocument:doc, style, textContent:'12.500,00 €',
    getBoundingClientRect:box,
    parentElement:{ getBoundingClientRect:() => ({ height:size() * 1.2 + 20 }) }
  };
  return {
    text, ring, label, style, listeners, fontListeners, resizeInstances, mutationInstances, frames, ready,
    resize(value, cap) { width = value; maxSize = cap; },
    flush() { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback()); },
    assertContained() {
      const rect = glyphBox();
      assert.ok(CircleText.rectangleFitsCircle(rect, { x:width / 2, y:width / 2, radius:(width - 20) / 2 }, 3), JSON.stringify(rect));
    }
  };
}

test('observer measures real font boxes after text changes, resize, and font loading while preserving the string', async () => {
  const f = fixture();
  const controller = CircleText.observe(f.ring, f.text);
  assert.equal(CircleText.observe(f.ring, f.text), controller);
  controller.schedule();
  assert.equal(f.frames.size, 1, 'frame requests coalesce');
  f.flush();
  f.assertContained();
  assert.equal(f.text.textContent, '12.500,00 €');

  for (const amount of ['10000 €', '-123.456.789.012.345,00 €', `${'9'.repeat(309)},00 €`]) {
    f.text.textContent = amount;
    f.mutationInstances[0].callback();
    f.flush();
    f.assertContained();
    assert.equal(f.text.textContent, amount);
  }
  f.text.textContent = '7 €';
  f.resize(142, 28);
  f.resizeInstances[0].callback();
  f.flush();
  assert.equal(f.style.getPropertyValue('font-size'), '28px', 'smaller amounts grow back to the responsive cap');
  f.assertContained();

  f.ready();
  await Promise.resolve();
  assert.equal(f.frames.size, 1);
  f.flush();
  f.fontListeners.get('loadingdone')();
  f.flush();
  f.assertContained();
  assert.deepEqual(f.resizeInstances[0].targets, [f.ring, f.label], 'our own text/group size is not observed');
  assert.deepEqual(f.mutationInstances[0].options, { childList:true, characterData:true, subtree:true }, 'font style writes cannot trigger mutation fitting');
  controller.destroy();
});

test('cleanup cancels fitting, disconnects observers, restores styles, and ignores pending font readiness', async () => {
  const f = fixture();
  f.style.setProperty('font-size', '18px');
  const controller = CircleText.observe(f.ring, f.text);
  controller.destroy();
  controller.destroy();
  f.ready();
  await Promise.resolve();
  controller.schedule();
  assert.equal(f.frames.size, 0);
  assert.equal(f.resizeInstances[0].disconnected, true);
  assert.equal(f.mutationInstances[0].disconnected, true);
  assert.equal(f.listeners.size, 0);
  assert.equal(f.fontListeners.size, 0);
  assert.equal(f.style.getPropertyValue('font-size'), '18px');
  assert.notEqual(CircleText.observe(f.ring, f.text), controller, 'a cleaned-up target can be mounted again');
});
