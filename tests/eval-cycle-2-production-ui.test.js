const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'..');const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');const app=fs.readFileSync(path.join(root,'app.js'),'utf8');const premium=fs.readFileSync(path.join(root,'premium.js'),'utf8');

test('cycle 2: authentication landing, registration, persistent session and logout controls are wired',()=>{
  assert.match(html,/id="authShell"/);assert.match(html,/id="loginForm"/);assert.match(html,/id="registerForm"/);assert.match(html,/id="demoLogin"/);assert.match(html,/id="logoutButton"/);assert.match(html,/auth-core\.js/);assert.match(html,/auth-ui\.js/);assert.match(css,/\.auth-shell \{[^}]*position:fixed/);assert.doesNotMatch(html,/type="password"[^>]*value=/);
});

test('cycle 2: header groups date, theme, notifications and language in the requested order',()=>{
  const title=html.indexOf('id="contextHeader"'),actions=html.indexOf('class="top-actions"',title),date=html.indexOf('id="systemDate"',actions),cluster=html.indexOf('class="header-action-cluster"',date),theme=html.indexOf('id="themeToggle"',cluster),notification=html.indexOf('class="notification-wrap"',theme),language=html.indexOf('class="language-switch"',notification);assert.ok(title<actions&&actions<date&&date<cluster&&cluster<theme&&theme<notification&&notification<language);assert.doesNotMatch(html,/id="activeModuleTitle"|id="systemTime"/);assert.match(app,/function renderSystemDate\(now=new Date\(\)\)/);assert.match(app,/setInterval\(\(\)=>renderSystemDate\(new Date\(\)\),60000\)/);assert.doesNotMatch(app,/timeLabel/);assert.match(app,/MerCore\.greetingFor\(now,currentLang/);assert.match(css,/\.system-datetime time \{[^}]*font-size:\.6875rem/);assert.match(css,/\.header-action-cluster \{[^}]*display:flex/);assert.match(css,/\.context-header h1 \{/);
});

test('cycle 2: Insights contains all four requested analytical visuals without a card scrollbar',()=>{
  ['categoryDonut','monthlyBarChart','topMerchantsList','savingsGauge'].forEach(id=>assert.match(html,new RegExp(`id="${id}"`)));assert.match(app,/MerAccounting\.topMerchants/);assert.match(app,/MerAccounting\.monthSeries/);assert.match(css,/\.advanced-insights-grid/);assert.doesNotMatch(css,/\.advanced-insights-grid[^}]*overflow-y\s*:\s*auto/);
});

test('cycle 2: Savings exposes progress rings, countdowns, monthly requirements and selectable round-up vaults',()=>{
  assert.match(premium,/goal-progress-ring/);assert.match(premium,/goalMetrics/);assert.match(premium,/monthlyRequired/);assert.match(premium,/data-toggle-roundup/);assert.match(premium,/roundUpsEnabled=false/);assert.match(css,/\.goal-progress-ring/);assert.match(css,/\.roundup-toggle\.active/);
});

test('cycle 2: accounting review accepts CSV Excel and CAMT while the outer viewport remains locked',()=>{
  assert.match(html,/accept="\.csv,\.xlsx,\.xls,\.xml,\.camt/);assert.match(premium,/MerAccounting\.parseCamt053/);assert.match(html,/id="importReviewRows"/);assert.match(css,/html, body \{ width:100%; height:100%; overflow:hidden/);assert.match(css,/\.app-shell \{ width:100%; height:100vh; height:100dvh;[^}]*overflow:hidden/);
});

test('cycle 2: subscription alerts, manager and reactive round-ups use the shared transaction paths',()=>{
  assert.match(html,/id="subscriptionsModal"/);assert.match(app,/MerAccounting\.detectSubscriptions/);assert.match(app,/MerAccounting\.applyRoundUp\(profile,transaction\)/);assert.match(app,/MerAccounting\.undoRoundUp\(state,existing\)/);assert.match(premium,/MerAccounting\.applyRoundUp\(state,tx\)/);assert.match(app,/save\('bank-sync'\)/);assert.match(premium,/save\('bulk-import'\)/);
});
