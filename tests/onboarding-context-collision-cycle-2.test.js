'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {computeSpotlightLayout} = require('../onboarding-core.js');
const source = fs.readFileSync(path.join(__dirname,'../onboarding.js'),'utf8');
const css = fs.readFileSync(path.join(__dirname,'../security-tour.css'),'utf8');
const overlaps = (a,b) => a.left < b.left+b.width && a.left+a.width > b.left && a.top < b.top+b.height && a.top+a.height > b.top;

test('cycle 2: measured privacy and Help tooltip collisions preserve the real sidebar context', () => {
  for (const [targetRect,popoverSize,contextRect] of [
    [{left:411,top:464,width:818,height:69},{width:350,height:386},{left:20,top:644,width:212,height:54}],
    [{left:413,top:492,width:815,height:52},{width:350,height:384.44},{left:20,top:592,width:212,height:52}]
  ]) {
    const layout = computeSpotlightLayout({targetRect,popoverSize,contextRect,viewport:{width:1280,height:720},preferredPlacement:'left'});
    assert.equal(layout.popover.overlapsTarget,false);
    assert.equal(layout.popover.overlapsContext,false);
    assert.equal(overlaps(layout.popover,contextRect),false);
    assert.equal(layout.popover.width,popoverSize.width,'context avoidance does not shrink readable type');
    assert.equal(layout.popover.height,popoverSize.height);
    assert.ok(layout.popover.top + layout.popover.height <= contextRect.top - 14);
  }
});

test('cycle 2: security context remains visible on short and tall desktop screens', () => {
  for (const height of [600,667,720,900,1080]) {
    for (const contextOffset of [76,128]) {
      const contextRect = {left:20,top:height-contextOffset,width:212,height:54};
      const layout = computeSpotlightLayout({
        viewport:{width:1280,height}, targetRect:{left:411,top:height-256,width:818,height:69},
        popoverSize:{width:350,height:height<720?280:386},contextRect,preferredPlacement:'left'
      });
      assert.equal(layout.popover.overlapsTarget,false,`feature ${height}/${contextOffset}`);
      assert.equal(layout.popover.overlapsContext,false,`context ${height}/${contextOffset}`);
      assert.ok(layout.popover.top>=12);
      assert.ok(layout.popover.top+layout.popover.height<=height-12);
    }
  }
});

test('cycle 2: Insights may reserve a chart slice but never places its tooltip over Uvidi', () => {
  for (const [width,height] of [[1280,600],[1280,720],[1440,900]]) {
    const contextRect = {left:20,top:365.765,width:212,height:44};
    const layout = computeSpotlightLayout({
      viewport:{width,height}, targetRect:{left:280,top:150,width:width-310,height:height-174},
      popoverSize:{width:350,height:height<720?250:303},contextRect,
      preferredPlacement:'bottom',allowPartialTarget:true
    });
    assert.equal(layout.popover.overlapsContext,false);
    assert.equal(overlaps(layout.popover,contextRect),false);
    assert.ok(layout.spotlight.height>=80);
  }
  assert.doesNotMatch(source,/popover:\{[^\n]*left:viewport\.left \+ 12, top:viewport\.top \+ viewport\.height - popoverSize\.height/,'no forced tooltip in the navigation lane');
});

test('cycle 2: both mask and outline use exact geometry without moving holes between native hosts', () => {
  assert.match(source,/contextRect:currentContextLink\?\.getBoundingClientRect\(\)/);
  assert.match(css,/\.onboarding-backdrop\s*\{[^}]*transition:none;/);
  assert.match(css,/\.onboarding-tour :is\(\.onboarding-spotlight,\.onboarding-context-spotlight,\.onboarding-popover\) \{ transition:none;/);
  assert.match(css,/body\.tour-active dialog\[open\]::backdrop \{ background:transparent;backdrop-filter:none;/);
});
