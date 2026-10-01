'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../onboarding.js'), 'utf8');
const start = source.indexOf('  function revealTargetWithinContent()');
const end = source.indexOf('  function previewStep(step)', start);
assert.ok(start > 0 && end > start, 'test executes the real target-reveal implementation');

function harness({ sidebarTarget = false, overflow = 'auto', scrollTop = 0, clientHeight = 400, scrollHeight = 1000, top = 150, height = 100, preserveScroll = false, hosted = false, reducedMotion = true, documentFlow = false, withinPage = true, documentScrollTop = 0, documentHeight = 1240 } = {}) {
  const calls = [];
  const shell = { scrollTop:73 };
  const sidebar = { scrollTop:19, contains:node => node === target && sidebarTarget };
  const page = {
    parentElement:shell, scrollTop, clientHeight, scrollHeight,
    hasAttribute:() => false, classList:{contains:className => withinPage && className === 'page'},
    getBoundingClientRect:() => ({top:100, bottom:100 + clientHeight, height:clientHeight}),
    scrollTo(options) { calls.push(options);this.scrollTop = options.top; }
  };
  const view = {
    parentElement:page, scrollTop:0, clientHeight, scrollHeight,
    hasAttribute:attribute => attribute === 'data-view-panel', classList:{contains:() => false},
    getBoundingClientRect:page.getBoundingClientRect,
    scrollTo() { throw new Error('An overflow:hidden view must not be scrolled'); }
  };
  const target = {
    parentElement:sidebarTarget ? sidebar : view,
    getBoundingClientRect:() => ({top, bottom:top + height, height}),
    scrollIntoView() { throw new Error('Unbounded ancestor scrolling must never occur'); }
  };
  const documentScroller = {
    scrollTop:documentScrollTop, scrollHeight:documentHeight, clientHeight:667,
    scrollTo(options) { calls.push({...options, document:true});this.scrollTop = options.top; }
  };
  const context = {
    scrollTarget:() => target, ownedDialog:hosted ? {} : null, effectiveStep:{preserveScroll},
    $:selector => selector === '#sidebar' ? sidebar : selector === '#contextHeader' ? {getBoundingClientRect:() => ({bottom:118})} : null, appShell:shell,
    document:{scrollingElement:documentScroller},
    viewportBounds:() => ({top:0,left:0,width:375,height:667}),
    window:{getComputedStyle:element => ({overflowY:element === page ? overflow : element === documentScroller && documentFlow ? 'auto' : 'hidden'})},
    reducedMotion:() => reducedMotion
  };
  vm.createContext(context);
  vm.runInContext(`${source.slice(start, end)}; revealTargetWithinContent();`, context);
  return {calls, page, sidebar, shell, documentScroller};
}

test('cycle 2: sidebar targets never scroll navigation even with oversized target margins', () => {
  for (const top of [-96, 0, 90, 400, 960]) {
    const env = harness({sidebarTarget:true, top});
    assert.equal(env.calls.length,0);
    assert.equal(env.sidebar.scrollTop,19);
    assert.equal(env.shell.scrollTop,73);
  }
});

test('cycle 2: visible targets do not cause scrolling or change navigation positions', () => {
  const env = harness({top:110, height:200});
  assert.equal(env.calls.length,0);
  assert.equal(env.page.scrollTop,0);
  assert.equal(env.sidebar.scrollTop,19);
  assert.equal(env.shell.scrollTop,73);
});

test('cycle 2: clipped content moves only its actual page scroll window by the required amount', () => {
  const env = harness({top:530, height:80});
  assert.equal(env.calls.length,1);
  assert.equal(env.page.scrollTop,110);
  assert.equal(env.calls[0].behavior,'auto');
  assert.equal(env.sidebar.scrollTop,19);
  assert.equal(env.shell.scrollTop,73);
  const animated = harness({top:530, height:80, reducedMotion:false});
  assert.equal(animated.calls[0].behavior,'smooth');
});

test('cycle 2: scroll offsets stay bounded and oversized cards align to their top', () => {
  assert.equal(harness({top:2000, height:80}).page.scrollTop,600);
  assert.equal(harness({scrollTop:80, top:-200, height:80}).page.scrollTop,0);
  assert.equal(harness({top:250, height:700}).page.scrollTop,150);
});

test('cycle 2: static layouts, Insights and native tour dialogs never scroll page ancestors', () => {
  for (const options of [
    {overflow:'hidden'}, {overflow:'clip'}, {scrollHeight:400},
    {preserveScroll:true}, {hosted:true}
  ]) {
    const env = harness({...options, top:900});
    assert.equal(env.calls.length,0);
    assert.equal(env.shell.scrollTop,73);
    assert.equal(env.sidebar.scrollTop,19);
  }
});

test('cycle 2: all nine tour steps use scoped reveal, not browser ancestor scrolling', () => {
  const preview = source.slice(source.indexOf('  function previewStep(step)'), source.indexOf('  function render('));
  assert.match(preview,/revealTargetWithinContent\(\)/);
  assert.doesNotMatch(source,/\.scrollIntoView\(/);
  assert.match(source,/focus\(\{ preventScroll:true \}\)/);
});

test('cycle 2: natural-flow phone Budget targets reveal below the sticky header without moving navigation', () => {
  const env = harness({documentFlow:true, overflow:'visible', top:668, height:532});
  assert.equal(env.calls.length,1);
  assert.equal(env.calls[0].document,true);
  assert.equal(env.documentScroller.scrollTop,538,'large Budget card starts at 130px, below the 118px sticky header');
  assert.equal(env.page.scrollTop,0);
  assert.equal(env.sidebar.scrollTop,19);
  assert.equal(env.shell.scrollTop,73);
});

test('cycle 2: document scrolling is restricted to natural page targets and keeps visible content stable', () => {
  for (const options of [
    {sidebarTarget:true}, {withinPage:false}, {preserveScroll:true}, {hosted:true},
    {documentHeight:667}, {top:150,height:100}
  ]) {
    const env = harness({documentFlow:true, overflow:'visible', top:900, ...options});
    assert.equal(env.calls.length,0);
    assert.equal(env.documentScroller.scrollTop,0);
    assert.equal(env.sidebar.scrollTop,19);
  }
  assert.equal(harness({documentFlow:true,overflow:'visible',documentScrollTop:400,top:0,height:100}).documentScroller.scrollTop,270);
});
