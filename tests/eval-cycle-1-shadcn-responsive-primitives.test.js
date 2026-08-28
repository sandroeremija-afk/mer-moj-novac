const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const responsive = require(path.join(root, 'responsive-ui.js'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'runtime.js'), 'utf8');
const source = fs.readFileSync(path.join(root, 'responsive-ui.js'), 'utf8');
const build = fs.readFileSync(path.join(root, 'scripts', 'build.js'), 'utf8');
const preflight = fs.readFileSync(path.join(root, 'scripts', 'preflight.js'), 'utf8');

test('evaluation cycle 1: the responsive mode contract covers phone through ultra-wide widths', () => {
  assert.deepEqual(responsive.BREAKPOINTS, { compact:640, tablet:1024, wide:1600 });
  assert.equal(responsive.viewportMode(375), 'compact');
  assert.equal(responsive.viewportMode(640), 'compact');
  assert.equal(responsive.viewportMode(768), 'tablet');
  assert.equal(responsive.viewportMode(1024), 'tablet');
  assert.equal(responsive.viewportMode(1366), 'desktop');
  assert.equal(responsive.viewportMode(1920), 'wide');
  assert.equal(responsive.viewportMode(Number.NaN), 'compact');
});

test('evaluation cycle 1: chart density reacts to the chart container instead of a hardcoded page width', () => {
  assert.equal(responsive.chartDensity(320), 'compact');
  assert.equal(responsive.chartDensity(414), 'regular');
  assert.equal(responsive.chartDensity(768), 'spacious');
  assert.match(source, /new ResizeObserver\(entries =>/);
  assert.match(source, /entry\.target\.dataset\.chartDensity = chartDensity\(entry\.contentRect\.width\)/);
  assert.match(source, /--chart-columns/);
});

test('evaluation cycle 1: floating menus stay inside the visual viewport and flip above crowded triggers', () => {
  const lower = responsive.computeFloatingPosition({
    triggerRect:{ left:340, right:380, top:690, bottom:730 },
    menuSize:{ width:240, height:260 },
    viewport:{ left:0, top:0, width:390, height:760 }
  });
  assert.equal(lower.side, 'top');
  assert.ok(lower.left >= 12);
  assert.ok(lower.left + lower.width <= 378);
  assert.ok(lower.top >= 12);
  assert.ok(lower.top + Math.min(260, lower.maxHeight) <= 748);

  const upper = responsive.computeFloatingPosition({
    triggerRect:{ left:20, right:60, top:20, bottom:64 },
    menuSize:{ width:800, height:180 },
    viewport:{ left:10, top:5, width:375, height:640 }
  });
  assert.equal(upper.side, 'bottom');
  assert.ok(upper.width <= 351);
  assert.ok(upper.left >= 22);
});

test('evaluation cycle 1: dialog dismissal requires a matching primary pointer press and release', () => {
  assert.match(runtime, /typeof root\.PointerEvent === 'function'/);
  assert.match(runtime, /dialog\.addEventListener\('pointerdown', handlePointerDown, true\)/);
  assert.match(runtime, /dialog\.addEventListener\('pointerup', handlePointerUp, true\)/);
  assert.match(runtime, /event\.pointerId !== activePointerId/);
  assert.match(runtime, /event\?\.target !== dialog/);
  assert.match(runtime, /dialog\.addEventListener\('pointercancel', reset, true\)/);
});

test('evaluation cycle 1: shadcn-style state, focus, menu, tab and sheet semantics are centralized', () => {
  for (const primitive of ['dialog', 'menu', 'popover', 'tabs', 'table', 'chart', 'wizard-step', 'floating-panel']) {
    assert.match(source, new RegExp(`'${primitive}'`));
  }
  assert.match(source, /dialog\.dataset\.state = dialog\.open \? 'open' : 'closed'/);
  assert.match(source, /dialog\.dataset\.presentation = mode === 'compact' \? 'sheet' : 'dialog'/);
  assert.match(source, /\['ArrowDown','ArrowUp','Home','End'\]/);
  assert.match(source, /\['ArrowLeft','ArrowRight','Home','End'\]/);
  assert.match(source, /sidebar\.setAttribute\('aria-modal', 'true'\)/);
  assert.match(source, /wizard\.dataset\.uiKind = 'wizard'/);
  assert.match(source, /target\.inert = true/);
  assert.match(source, /'#assistantFab', '#assistantWidget'/);
  assert.match(source, /event\.key !== 'Tab'/);
});

test('evaluation cycle 1: the responsive layer is present on cold load and packaged for production', () => {
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/);
  const responsiveIndex = html.indexOf('responsive-ui.js?v=20260828-shadcn-responsive');
  const authIndex = html.indexOf('auth-ui.js');
  assert.ok(responsiveIndex > 0 && responsiveIndex < authIndex);
  assert.match(build, /'responsive-ui\.js'/);
  assert.match(preflight, /'responsive-ui\.js'/);
});
