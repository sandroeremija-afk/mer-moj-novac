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
  assert.match(auth, /authShell\.dataset\.authMode = register \? 'register' : 'login'/);
});

test('cycle 1: official brand-book vectors power one Auth logo and one sidebar logo', () => {
  const logos = html.match(/<mer-logo\b[^>]*>mer<\/mer-logo>/g) || [];
  assert.equal(logos.length, 2);
  const authMarkup = html.slice(html.indexOf('id="authShell"'), html.indexOf('id="appShell"'));
  const appMarkup = html.slice(html.indexOf('id="appShell"'), html.indexOf('id="bankSettingsModal"'));
  assert.equal((authMarkup.match(/<mer-logo\b/g) || []).length, 1);
  assert.equal((appMarkup.match(/<mer-logo\b/g) || []).length, 1);
  assert.match(authMarkup, /class="auth-brand-logo" variant="negative"/);
  const authBrand = authMarkup.slice(authMarkup.indexOf('class="auth-brand-panel"'), authMarkup.indexOf('class="auth-form-panel"'));
  assert.match(authBrand, /class="auth-brand-tagline"[^>]*data-auth-copy="heroTagline"[^>]*>Upravljajte financijama s lakoćom\.<\/p>/);
  assert.doesNotMatch(authBrand, /<h1\b|<ul\b|<li\b|data-auth-copy="(?:heroTitle|heroBody|benefitOne|benefitTwo|benefitThree)"/);
  const authForm = authMarkup.slice(authMarkup.indexOf('class="auth-form-panel"'));
  assert.doesNotMatch(authForm, /<mer-logo\b/);
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
  assert.match(logo, /class="wordmark wordmark-e" fill-rule="evenodd" clip-rule="evenodd"/);
  assert.equal((logo.match(/M419\.169 89\.377/g) || []).length, 1);
  assert.match(css, /mer-logo \{[^}]*aspect-ratio:531\.352 \/ 160\.076[^}]*overflow:hidden/s);
  assert.match(css, /\[data-theme="dark"\] mer-logo\[variant="auto"\] \{ --logo-wordmark:#fff; \}/);
  assert.match(css, /\.auth-brand-logo \{[^}]*width:clamp\(150px,17vw,228px\)/);
  assert.match(css, /\.auth-visible \.auth-card \{[^}]*animation:auth-card-mount/);
  assert.doesNotMatch(html, /mer-wordmark-(?:positive|negative)\.(?:png|svg)/);
  assert.doesNotMatch(css, /content:url\([^)]*mer-wordmark/);
  const logoScriptIndex=html.search(/<script src="logo\.js(?:\?[^\"]*)?"><\/script>/);
  const appScriptIndex=html.search(/<script src="app\.js(?:\?[^\"]*)?"><\/script>/);
  assert.ok(logoScriptIndex>=0&&logoScriptIndex<appScriptIndex);
  assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="assets\/mer-mark-full-color\.svg">/);
  for (const file of ['mer-logo-positive.svg', 'mer-logo-negative.svg', 'mer-mark-full-color.svg']) {
    const asset = fs.readFileSync(path.join(root, 'assets', file), 'utf8');
    assert.match(asset, /#49a6e2/);
    assert.match(asset, /#79c440/);
    if (file !== 'mer-mark-full-color.svg') assert.match(asset, /fill-rule="evenodd" clip-rule="evenodd"/);
  }
  assert.match(fs.readFileSync(path.join(root, 'assets', 'mer-logo-positive.svg'), 'utf8'), /fill="#040606"/);
  assert.match(fs.readFileSync(path.join(root, 'assets', 'mer-logo-negative.svg'), 'utf8'), /fill="#fff"/);
});

test('cycle 1: Auth keeps minimalist copy and exposes a localized password recovery dialog', () => {
  assert.doesNotMatch(html, /Nastavite ondje gdje ste stali\.|Continue exactly where you left off\./);
  assert.doesNotMatch(html, /<div class="auth-brand-panel"[\s\S]*?<p class="overline">MER MOJ NOVAC<\/p>/);
  assert.doesNotMatch(html, /class="auth-intro"/);
  assert.match(auth, /heroTagline: 'Upravljajte financijama s lakoćom\.'/);
  assert.match(auth, /heroTagline: 'Manage your finances with ease\.'/);
  assert.match(html, /id="forgotPassword"[^>]*href="#password-reset"[^>]*aria-controls="passwordResetModal"/);
  for (const id of ['passwordResetModal', 'passwordResetForm', 'passwordResetEmail', 'passwordResetSuccess', 'passwordResetDone']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(auth, /provider\.requestPasswordReset/);
  assert.match(auth, /passwordResetModal\.showModal\(\)/);
  assert.match(css, /\.auth-reset-modal::backdrop/);
});

test('cycle 1: module headings and settings remain free of logo artifacts', () => {
  assert.doesNotMatch(html, /class="topbar-brand-context"/);
  assert.doesNotMatch(html, /class="(?:header|settings|assessment|lock)-logo"/);
  assert.doesNotMatch(html, /id="activeModuleTitle"/);
  assert.match(html, /<div class="context-header" id="contextHeader"[\s\S]*?id="contextHeaderTitle"[\s\S]*?id="contextHeaderSubtitle"/);
  assert.match(app, /const contextHeaderKeys = \{/);
});
