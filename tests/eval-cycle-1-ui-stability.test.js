const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'auth-ui.js'), 'utf8');
const logo = fs.readFileSync(path.join(root, 'logo.js'), 'utf8');

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

test('cycle 1: every application logo uses the fail-safe inline component', () => {
  const logos = html.match(/<mer-logo\b[^>]*>mer<\/mer-logo>/g) || [];
  assert.equal(logos.length, 7);
  for (const instance of logos) {
    assert.match(instance, /tone="(?:dark|theme)"/);
    assert.match(instance, /role="img" aria-label="mer"/);
  }
  assert.match(logo, /class MerLogo extends HTMLElement/);
  assert.match(logo, /customElements\.define\('mer-logo', MerLogo\)/);
  assert.match(logo, /<svg viewBox="0 0 180 80"/);
  assert.match(logo, /<span class="fallback" aria-hidden="true">mer<\/span>/);
  assert.doesNotMatch(logo, /(?:src=|href=|fetch\(|\.png|\.svg)/);
  assert.match(css, /mer-logo \{[^}]*aspect-ratio:9 \/ 4[^}]*overflow:hidden/s);
  assert.match(css, /\[data-theme="dark"\] mer-logo\[tone="theme"\] \{ --logo-color:#fff; \}/);
  assert.doesNotMatch(html, /mer-wordmark-(?:positive|negative)\.(?:png|svg)/);
  assert.doesNotMatch(css, /content:url\([^)]*mer-wordmark/);
  assert.ok(html.indexOf('<script src="logo.js"></script>') < html.indexOf('<script src="app.js"></script>'));
  assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="data:image\/svg\+xml/);
});

test('cycle 1: dashboard header and Settings expose branded context', () => {
  assert.match(html, /class="topbar-brand-context"><mer-logo class="header-logo"/);
  assert.match(html, /class="settings-brand"><mer-logo class="settings-logo"/);
});
