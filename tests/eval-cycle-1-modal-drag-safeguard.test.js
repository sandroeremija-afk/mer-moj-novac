const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'runtime.js'), 'utf8');

function loadRuntime() {
  const window = { addEventListener() {}, location:{ reload() {} } };
  vm.runInNewContext(source, { window, document:{} });
  return window.MerRuntime;
}

function fakeDialog() {
  const listeners = new Map();
  const dialog = {
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    removeEventListener(type, handler) {
      listeners.set(type, (listeners.get(type) || []).filter(listener => listener !== handler));
    },
    getBoundingClientRect() { return { left:100, right:500, top:100, bottom:400 }; },
    emit(type, event = {}) {
      const payload = { target:dialog, button:0, clientX:50, clientY:50, ...event };
      (listeners.get(type) || []).forEach(listener => listener(payload));
    }
  };
  return dialog;
}

test('evaluation cycle 1: only a primary-button press and release directly on the backdrop dismisses', () => {
  const runtime = loadRuntime();
  const dialog = fakeDialog();
  const child = { nodeName:'P' };
  let dismissals = 0;
  runtime.bindDialogBackdropDismiss(dialog, () => { dismissals += 1; });

  dialog.emit('mousedown', { target:dialog, clientX:50, clientY:50 });
  dialog.emit('mouseup', { target:dialog, clientX:50, clientY:50 });
  assert.equal(dismissals, 1, 'a genuine backdrop click dismisses');

  dialog.emit('mousedown', { target:dialog, button:2, clientX:50, clientY:50 });
  dialog.emit('mouseup', { target:dialog, button:2, clientX:50, clientY:50 });
  assert.equal(dismissals, 1, 'right-click never dismisses');

  dialog.emit('mousedown', { target:dialog, clientX:50, clientY:50 });
  dialog.emit('mouseup', { target:child, clientX:150, clientY:150 });
  assert.equal(dismissals, 1, 'backdrop-to-content drag never dismisses');
});

test('evaluation cycle 1: text, input, label and table selection drags remain open', () => {
  const runtime = loadRuntime();
  for (const nodeName of ['P', 'INPUT', 'LABEL', 'TD']) {
    const dialog = fakeDialog();
    let dismissals = 0;
    runtime.bindDialogBackdropDismiss(dialog, () => { dismissals += 1; });
    dialog.emit('mousedown', { target:{ nodeName }, clientX:180, clientY:180 });
    dialog.emit('mouseup', { target:dialog, clientX:40, clientY:40 });
    assert.equal(dismissals, 0, `${nodeName} selection drag must remain open`);
  }
});

test('evaluation cycle 1: card padding and stale presses cannot masquerade as backdrop clicks', () => {
  const runtime = loadRuntime();
  const dialog = fakeDialog();
  let dismissals = 0;
  runtime.bindDialogBackdropDismiss(dialog, () => { dismissals += 1; });

  dialog.emit('mousedown', { target:dialog, clientX:120, clientY:120 });
  dialog.emit('mouseup', { target:dialog, clientX:40, clientY:40 });
  assert.equal(dismissals, 0, 'dialog padding is not backdrop');

  dialog.emit('mousedown', { target:dialog, clientX:40, clientY:40 });
  dialog.emit('close');
  dialog.emit('mouseup', { target:dialog, clientX:40, clientY:40 });
  assert.equal(dismissals, 0, 'close resets a pending backdrop press');
});
