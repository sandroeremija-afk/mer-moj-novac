const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'auth-ui.js'), 'utf8');

test('cycle 1: silent background sync cannot open Settings when no banks are connected', () => {
  assert.match(app, /if\(!connections\.length\)\{if\(!silent\)openBankSettings\(\);return \{skipped:'no-connections'\};\}/);
  assert.match(app, /setInterval\(\(\)=>syncActiveBankConnections\(\{silent:true\}\),300000\)/);
  assert.doesNotMatch(app, /set(?:Timeout|Interval)\([^\n;]*(?:openBankSettings|openSettings)/);
});

test('cycle 1: login and registration share a fixed-height auth grid', () => {
  assert.match(css, /\.auth-shell \{[^}]*height:100dvh[^}]*grid-template-rows:minmax\(0,1fr\)/s);
  assert.match(css, /\.auth-brand-panel,\s*\.auth-form-panel \{ height:100%; min-height:0; \}/);
  assert.match(css, /\.auth-form-panel \{[^}]*overflow-y:auto/s);
  assert.match(css, /\.auth-card \{[^}]*margin-block:auto/s);
  assert.match(auth, /authShell\.dataset\.authMode=register\?'register':'login'/);
});

test('cycle 1: every application logo uses positive and negative brand assets', () => {
  const logos = html.match(/class="adaptive-logo[^>]*>[\s\S]*?<\/span>/g) || [];
  assert.equal(logos.length, 5);
  for (const logo of logos) {
    assert.match(logo, /mer-wordmark-positive\.png/);
    assert.match(logo, /mer-wordmark-negative\.png/);
    assert.match(logo, /data-logo-surface="(?:dark|theme)"/);
  }
  assert.match(css, /\[data-theme="dark"\] \.adaptive-logo\[data-logo-surface="theme"\] \.logo-negative \{ display:block; \}/);
  assert.match(css, /\.adaptive-logo \{[^}]*aspect-ratio:9 \/ 4[^}]*overflow:hidden/s);
  assert.match(css, /\.adaptive-logo img \{[^}]*object-fit:contain/s);
  assert.match(css, /content:url\("assets\/mer-wordmark-positive\.svg"\)/);
  assert.match(css, /content:url\("assets\/mer-wordmark-negative\.svg"\)/);
  for (const file of ['mer-wordmark-positive.svg', 'mer-wordmark-negative.svg']) {
    const asset = fs.readFileSync(path.join(root, 'assets', file), 'utf8');
    assert.match(asset, /viewBox="0 0 540 240"/);
    assert.match(asset, /mask-type="luminance"/);
  }
});
