const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const insightsStart = html.indexOf('id="insightsView"');
const insightsEnd = html.indexOf('id="insightsDetailsModal"', insightsStart);
const insights = html.slice(insightsStart, insightsEnd);

test('evaluation cycle 1: Largest categories has no subscription action or leftover action gap', () => {
  const merchantStart = insights.indexOf('class="panel insight-visual-card merchant-card');
  const merchantEnd = insights.indexOf('</article>', merchantStart);
  const merchantCard = insights.slice(merchantStart, merchantEnd);

  assert.ok(merchantStart >= 0, 'Largest categories card must exist');
  assert.match(merchantCard, /id="topMerchantsList"/);
  assert.match(merchantCard, /Najveće kategorije/);
  assert.doesNotMatch(merchantCard, /openSubscriptions|manageSubscriptions|Upravljaj pretplatama/);
  assert.doesNotMatch(app, /\$\('#openSubscriptions'\)\.addEventListener/);
});

test('evaluation cycle 2: Insights header uses the shared transaction modal trigger', () => {
  const headingEnd = insights.indexOf('id="insightsFilters"');
  const heading = insights.slice(0, headingEnd);

  assert.match(heading, /class="primary-button" data-open-transaction/);
  assert.match(heading, /data-i18n="addTransaction">Dodaj transakciju/);
  assert.doesNotMatch(heading, /data-open-income|data-i18n="addIncome"/);
  assert.match(app, /\$\$\('\[data-open-transaction\]'\)\.forEach\(button=>button\.addEventListener\('click',\(\)=>openTransaction\(\)\)\)/);
});
