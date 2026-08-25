const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const css = read('styles.css');
const app = read('app.js');
const auth = read('auth-ui.js');
const runtime = read('runtime.js');
const vercel = JSON.parse(read('vercel.json'));
const packageJson = JSON.parse(read('package.json'));

test('evaluation cycle 2: every native dialog is named and global modal focus is trapped and restored', () => {
  const dialogs = [...html.matchAll(/<dialog\b([^>]*)>/g)];
  assert.ok(dialogs.length >= 10);
  dialogs.forEach(match => assert.match(match[1], /aria-labelledby=/));
  assert.match(app, /function focusableElements\(modal\)/);
  assert.match(app, /const modalReturnFocus=new WeakMap\(\)/);
  assert.match(app, /modal\.addEventListener\('keydown',event=>\{if\(event\.key!=='Tab'\)/);
  assert.match(app, /event\.target!==modal/);
  assert.match(auth, /passwordResetModal\.addEventListener\('keydown',event=>\{if\(event\.key!=='Tab'\)/);
  assert.match(auth, /event\.target !== passwordResetModal/);
});

test('evaluation cycle 2: async failures surface through one accessible production boundary', () => {
  assert.match(html, /runtime\.js/);
  assert.match(runtime, /id = 'runtimeErrorBoundary'/);
  assert.match(runtime, /role', 'alert'/);
  assert.match(runtime, /aria-live', 'assertive'/);
  assert.match(runtime, /unhandledrejection/);
  assert.match(css, /\.runtime-error-boundary/);
  for (const file of ['runtime.js','logo.js','core.js','auth-core.js','accounting-core.js','security-core.js','import-core.js','bank-provider.js','state-store.js','app.js','premium.js','auth-ui.js']) {
    assert.doesNotMatch(read(file), /\bconsole\.(?:log|debug|warn|error)\s*\(|\bdebugger\b/, file);
  }
});

test('evaluation cycle 2: mobile remains naturally scrollable while desktop remains a fixed one-pager', () => {
  assert.match(css, /html, body \{ width:100%; height:100%; overflow:hidden/);
  assert.match(css, /\.app-shell \{ width:100%; height:100vh; height:100dvh;[^}]*overflow:hidden/);
  assert.match(css, /@media \(max-width:1024px\)[\s\S]*html \{[\s\S]*height:auto;[\s\S]*overflow-y:auto;[\s\S]*body \{[\s\S]*min-height:100dvh;[\s\S]*overflow-y:auto/);
  assert.match(css, /\.sidebar \{ position: fixed;/);
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*\.sidebar \{[^}]*transform: translateX\(-100%\)/);
  assert.match(css, /min-height:44px/);
  assert.match(app, /if\(window\.innerWidth<768\)closeSidebar\(\)/);
});

test('evaluation cycle 2: date, locale and currency formatting are dynamic and finite-safe', () => {
  assert.match(html, /id="systemDate"[^>]*>—</);
  assert.doesNotMatch(html, /id="systemTime"/);
  assert.match(app, /function dateInTimezone\(now=new Date\(\),timezone=appState\.settings\.timezone\)/);
  assert.match(app, /let appReferenceDate = dateInTimezone\(\)/);
  assert.match(app, /function dateInTimezone\(/);
  assert.match(app, /\.format\(Number\.isFinite\(amount\)\?amount:0\)/);
  const euro = new Intl.NumberFormat('hr-HR', { style:'currency', currency:'EUR' }).format(1234.56);
  const usd = new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(1234.56);
  assert.match(euro, /1[.\s]234,56/);
  assert.match(usd, /1,234\.56/);
});

test('evaluation cycle 2: auth service failures unlock controls and never leak credentials', () => {
  assert.match(auth, /submit\.disabled=true/);
  assert.match(auth, /finally\{if\(submit\)submit\.disabled=false/);
  assert.match(auth, /MerRuntime\?\.report\?\.\(error,\{silent:true\}\)/);
  assert.doesNotMatch(html, /type="password"[^>]*value=/);
  assert.match(html, /autocomplete="current-password"/);
  assert.match(html, /autocomplete="new-password"/);
});

test('evaluation cycle 2: production build and security policy are explicit and reproducible', () => {
  assert.equal(packageJson.scripts.test, 'node scripts/run-tests.js');
  assert.equal(packageJson.scripts.build, 'node scripts/build.js');
  assert.equal(packageJson.scripts.check, 'npm run lint && npm test && npm run build');
  assert.equal(vercel.buildCommand, 'npm run build');
  assert.equal(vercel.outputDirectory, 'dist');
  const headers = vercel.headers.flatMap(rule => rule.headers || []);
  const csp = headers.find(header => header.key === 'Content-Security-Policy')?.value || '';
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /form-action 'self'/);
  assert.ok(headers.some(header => header.key === 'X-Content-Type-Options' && header.value === 'nosniff'));
  assert.ok(headers.some(header => header.key === 'Permissions-Policy'));
});
