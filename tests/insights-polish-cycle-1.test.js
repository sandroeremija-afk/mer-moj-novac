'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Layout = require('../layout-core.js');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const section = grid => html.split(`data-layout-grid="${grid}"`)[1].split('</section>')[0];
const cards = grid => [...section(grid).matchAll(/data-layout-card="([^"]+)"/g)].map(match => match[1]);

test('Insights has one rate gauge in the four-card summary, followed by three analysis cards', () => {
  assert.deepEqual(cards('insights-kpis'), ['net-total', 'total-income', 'total-expenses', 'savings-rate']);
  assert.deepEqual(cards('insights-analysis'), ['category-spending', 'cashflow-history', 'top-merchants']);
  for (const id of ['savingsGauge', 'savingsRateValue', 'savingsRateContext']) {
    assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1);
    assert.ok(section('insights-kpis').includes(`id="${id}"`));
  }
});

test('Moved gauge retains the canonical reactive math, tooltip and detail-dialog contract', () => {
  const rate = section('insights-kpis').split('data-layout-card="savings-rate"')[1];
  assert.match(rate, /data-insight-detail="savings-rate" role="button" tabindex="0" aria-haspopup="dialog"/);
  assert.match(rate, /data-tooltip-key="savingsRateTooltip"/);
  assert.match(app, /\$\('#savingsRateValue'\)\.textContent=totals\.savingsRate/);
  assert.match(app, /\$\('#savingsGauge'\)\.style\.setProperty\('--gauge-value',`\$\{gaugePercent\*1\.8\}deg`\)/);
  assert.match(app, /gaugePercent=totals\.savingsRate===null\?0:Math\.max\(0,Math\.min\(100,totals\.savingsRate\)\)/);
});

test('Old persisted grid orders retain user ordering while moving rate to its canonical new grid', () => {
  const values = new Map();
  const storage = { getItem:key => values.get(key) || null, setItem:(key, value) => values.set(key, value) };
  const personalId = 'user--personal';
  const oldAnalysis = Layout.createLayoutStore({ storage, profileId:personalId, moduleId:'insights-analysis', allowedCardIds:['category-spending', 'cashflow-history', 'top-merchants', 'savings-rate'] });
  oldAnalysis.set(['savings-rate', 'top-merchants', 'category-spending', 'cashflow-history'], 'desktop');
  const oldSummary = Layout.createLayoutStore({ storage, profileId:personalId, moduleId:'insights-kpis', allowedCardIds:['net-total', 'total-income', 'total-expenses'] });
  oldSummary.set(['total-expenses', 'net-total', 'total-income'], 'desktop');
  const newAnalysis = Layout.createLayoutStore({ storage, profileId:personalId, moduleId:'insights-analysis', allowedCardIds:cards('insights-analysis') });
  const newSummary = Layout.createLayoutStore({ storage, profileId:personalId, moduleId:'insights-kpis', allowedCardIds:cards('insights-kpis') });
  assert.deepEqual(newAnalysis.get('desktop'), ['top-merchants', 'category-spending', 'cashflow-history']);
  assert.deepEqual(newSummary.get('desktop'), ['total-expenses', 'net-total', 'total-income', 'savings-rate']);
  const business = Layout.createLayoutStore({ storage, profileId:'user--business', moduleId:'insights-kpis', allowedCardIds:cards('insights-kpis') });
  assert.deepEqual(business.get('desktop'), cards('insights-kpis'));
  assert.deepEqual(newSummary.get('mobile'), cards('insights-kpis'));
});
