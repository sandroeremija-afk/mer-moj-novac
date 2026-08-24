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

test('cycle 1: official brand-book vectors power one Auth logo and one sidebar logo', () => {
  const logos = html.match(/<mer-logo\b[^>]*>mer<\/mer-logo>/g) || [];
  assert.equal(logos.length, 2);
  const authMarkup = html.slice(html.indexOf('id="authShell"'), html.indexOf('id="appShell"'));
  const appMarkup = html.slice(html.indexOf('id="appShell"'), html.indexOf('id="bankSettingsModal"'));
  assert.equal((authMarkup.match(/<mer-logo\b/g) || []).length, 1);
  assert.equal((appMarkup.match(/<mer-logo\b/g) || []).length, 1);
  assert.match(authMarkup, /class="auth-card-logo" variant="auto"/);
  assert.match(appMarkup, /<aside[\s\S]*class="brand-wordmark-image" variant="negative"/);
  assert.doesNotMatch(html.slice(html.indexOf('<main'), html.indexOf('</main>')), /<mer-logo\b/);
  assert.doesNotMatch(html.slice(html.indexOf('id="bankSettingsModal"')), /<mer-logo\b/);
  assert.match(logo, /class MerLogo extends HTMLElement/);
  assert.match(logo, /customElements\.define\('mer-logo', MerLogo\)/);
  assert.match(logo, /<svg viewBox="0 0 531\.352 160\.076"/);
  assert.match(logo, /<span class="fallback" aria-hidden="true">mer<\/span>/);
  assert.doesNotMatch(logo, /(?:src=|href=|fetch\(|\.png|\.svg)/);
  assert.match(logo, /\.mark-blue \{ fill: #49a6e2; \}/);
  assert.match(logo, /\.mark-green \{ fill: #79c440; \}/);
  assert.match(css, /mer-logo \{[^}]*aspect-ratio:531\.352 \/ 160\.076[^}]*overflow:hidden/s);
  assert.match(css, /\[data-theme="dark"\] mer-logo\[variant="auto"\] \{ --logo-wordmark:#fff; \}/);
  assert.doesNotMatch(html, /mer-wordmark-(?:positive|negative)\.(?:png|svg)/);
  assert.doesNotMatch(css, /content:url\([^)]*mer-wordmark/);
  assert.ok(html.indexOf('<script src="logo.js?v=20260824-brand2"></script>') < html.indexOf('<script src="app.js?v=20260824-brand2"></script>'));
  assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="assets\/mer-mark-full-color\.svg">/);
  for (const file of ['mer-logo-positive.svg', 'mer-logo-negative.svg', 'mer-mark-full-color.svg']) {
    const asset = fs.readFileSync(path.join(root, 'assets', file), 'utf8');
    assert.match(asset, /#49a6e2/);
    assert.match(asset, /#79c440/);
  }
  assert.match(fs.readFileSync(path.join(root, 'assets', 'mer-logo-positive.svg'), 'utf8'), /fill="#040606"/);
  assert.match(fs.readFileSync(path.join(root, 'assets', 'mer-logo-negative.svg'), 'utf8'), /fill="#fff"/);
});

test('cycle 1: module headings and settings remain free of logo artifacts', () => {
  assert.doesNotMatch(html, /class="topbar-brand-context"/);
  assert.doesNotMatch(html, /class="(?:header|settings|assessment|lock)-logo"/);
  assert.match(html, /<h1 class="module-heading" id="activeModuleTitle">Pregled<\/h1>/);
});
