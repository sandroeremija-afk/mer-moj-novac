'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const premium = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');
const responsive = fs.readFileSync(path.join(root, 'responsive-ui.js'), 'utf8');

const savingsStart = html.indexOf('id="savingsView"');
const savingsEnd = html.indexOf('id="activityView"', savingsStart);
const savings = html.slice(savingsStart, savingsEnd);

test('evaluation cycle 1: savings history is one reactive SVG area chart with compact KPIs', () => {
  assert.match(savings, /class="savings-chart-kpis"[\s\S]*?id="savingsMonthlyAverage"[\s\S]*?id="savingsBestMonth"/);
  assert.match(savings, /class="savings-area-chart"[^>]*id="contributionChart"[\s\S]*?id="savingsHistorySvg"[\s\S]*?id="savingsChartPoints"[\s\S]*?id="savingsChartAxis"/);
  assert.equal((savings.match(/id="contributionChart"/g) || []).length, 1);
  assert.doesNotMatch(savings, /contribution-column/);
  assert.match(app, /function savingsHistorySeries\(values\)[\s\S]*?MerCore\.chartDomain\(safeHistory,[\s\S]*?MerCore\.scaleChartValue/);
  assert.match(app, /function smoothSavingsPath\(points\)[\s\S]*? C \$\{mid\}/);
  assert.match(app, /class="savings-area-fill"[\s\S]*?class="savings-area-line"/);
  assert.match(app, /const history=\(state\.savingsHistory\|\|\[\]\)/, 'history always comes from the active profile state');
});

test('evaluation cycle 1: every savings point is keyboard reachable and owns a localized tooltip', () => {
  assert.match(savings, /id="savingsChartTooltip" role="status" aria-live="polite" hidden/);
  assert.match(app, /data-savings-chart-point="\$\{index\}" aria-label="\$\{escapeHtml\(label\)\}"/);
  assert.match(app, /button\.addEventListener\('mouseenter',showTooltip\)/);
  assert.match(app, /button\.addEventListener\('focus',showTooltip\)/);
  assert.match(app, /button\.addEventListener\('blur',hideTooltip\)/);
  assert.match(app, /contributionChart'\)\.setAttribute\('aria-label'/);
  assert.match(responsive, /'\.savings-area-chart'/, 'responsive observers include the rebuilt chart primitive');
});

test('evaluation cycle 1: goal progress uses precise SVG rings and a compact linear companion', () => {
  assert.match(premium, /class="goal-progress-ring"[^`]*role="progressbar"[^`]*aria-valuenow="\$\{percent\}"/);
  assert.match(premium, /circle class="goal-ring-track"[^`]*pathLength="100"/);
  assert.match(premium, /circle class="goal-ring-value"[^`]*pathLength="100"/);
  assert.match(premium, /class="goal-linear-track"[^`]*style="width:\$\{percent\}%"/);
  assert.match(premium, /MerCore\.validateSavingsGoal\(goal\)/, 'ring values retain validated financial goal math');
});

