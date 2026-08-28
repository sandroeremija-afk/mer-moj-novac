const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname,'..');
const css = fs.readFileSync(path.join(root,'styles.css'),'utf8');
const app = fs.readFileSync(path.join(root,'app.js'),'utf8');

function hex(value) {
  const clean=value.replace('#','');
  return [0,2,4].map(offset=>parseInt(clean.slice(offset,offset+2),16));
}
function mix(left,right,leftWeight) {
  return left.map((channel,index)=>Math.round(channel*leftWeight+right[index]*(1-leftWeight)));
}
function luminance(rgb) {
  const linear=rgb.map(channel=>{const value=channel/255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;});
  return .2126*linear[0]+.7152*linear[1]+.0722*linear[2];
}
function contrast(left,right) {
  const a=luminance(left),b=luminance(right);
  return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}

test('evaluation cycle 2: canonical MER palette drives borders, secondary surfaces, and language state', () => {
  for (const token of ['#00A9E4','#93C841','#000000','#F49727','#FF5259','#65C4B2','#7B6EB4','#16574B','#E7E3E4','#E9F9FF','#F6F0F0','#FFFDE5']) assert.ok(css.includes(token),token);
  assert.match(css,/--line:\s*var\(--mer-lightgrey\)/);
  assert.match(css,/--surface-secondary:\s*var\(--mer-pinkgrey\)/);
  assert.match(css,/language-switch button\[aria-pressed="true"\][^{]*\{[^}]*background:\s*var\(--mer-black\)/);
  assert.match(css,/\.roundup-toggle\.active > i \{ background:var\(--green\)/);
});

test('evaluation cycle 2: dark accent variants use a 90/10 approved-token mix and meet text contrast', () => {
  for (const name of ['blue','green','orange','red','teal','purple']) assert.match(css,new RegExp(`--${name}:color-mix\\(in srgb,var\\(--mer-${name}\\) 90%,var\\(--mer-lightgrey\\)\\)`));
  const panel=mix(hex('#000000'),hex('#16574B'),.84);
  for (const accent of ['#00A9E4','#93C841','#F49727','#FF5259','#65C4B2','#7B6EB4']) {
    const darkVariant=mix(hex(accent),hex('#E7E3E4'),.9);
    assert.ok(contrast(darkVariant,panel)>=4.5,`${accent} contrast ${contrast(darkVariant,panel).toFixed(2)}`);
  }
});

test('evaluation cycle 2: every required budget bar uses three tiers, clamps fill, and signals overage', () => {
  for (const tier of ['green','yellow','red']) {
    assert.match(css,new RegExp(`\\.budget-bar span\\.threshold-${tier}`));
    assert.match(css,new RegExp(`\\.progress-track\\.threshold-${tier} span`));
    assert.match(css,new RegExp(`\\.allocation-bar\\.threshold-${tier} span`));
  }
  assert.match(app,/allocationBar\.className=`allocation-bar threshold-\$\{allocationThreshold\.level\}/);
  assert.match(app,/Math\.min\(100,allocationRawPercent\)/);
  assert.match(app,/Math\.min\(100,rawPct\)/);
  assert.match(css,/\.allocation-bar\.over-cap/);
});

test('evaluation cycle 2: charts use theme-reactive approved palette tokens', () => {
  assert.ok((app.match(/const palette=\['var\(--dark-green\)'/g)||[]).length>=2);
  assert.doesNotMatch(app,/#a7c83f|#f2b544|#e66d65|#755bb4|#8fa39e/i);
});
