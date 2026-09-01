const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const MerCore = require('../core.js');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const premium = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');

function profile(category) {
  return {
    categories: [{ id: 'food' }, { id: 'transport' }, { id: 'other' }],
    incomeCategories: [{ id: 'salary' }, { id: 'otherIncome' }],
    automationRules: [{ id: `rule-${category}`, keyword: 'Studio Audit', type: 'expense', category, enabled: true }]
  };
}

test('cycle 1: banks are a standalone dialog and no longer a User Settings tab', () => {
  const settingsStart = html.indexOf('id="bankSettingsModal"');
  const settingsEnd = html.indexOf('</dialog>', settingsStart);
  const settings = html.slice(settingsStart, settingsEnd);
  assert.ok(settingsStart >= 0 && settingsEnd > settingsStart);
  assert.doesNotMatch(settings, /data-settings-tab="banks"|data-settings-panel="banks"/);
  assert.match(html, /id="connectedBanksModal"/);
  assert.match(app, /function openBankSettings\(\)[\s\S]*openModal\(\$\('#connectedBanksModal'\)\)/);
  assert.match(premium, /window\.MerSettings=Object\.freeze\(\{open:openSettings,selectTab:selectSettingsTab\}\)/);
  assert.match(premium, /function openSettings\(tab='general'\)[\s\S]*selectSettingsTab\(tab\)/);
  assert.doesNotMatch(premium, /selectedSettingsTab==='banks'|\.open\('banks'\)|selectSettingsTab\('banks'\)/);
  assert.doesNotMatch(settings, /dataPortability|settingsImportJson|settingsExportJson|settingsExportAllCsv|settingsExportCsv/);
});

test('cycle 1: a rule created from the If/Then payload categorizes future imports', () => {
  const personal = profile('transport');
  const result = MerCore.autoCategorizeBankTransaction({ description: 'STUDIO AUDIT Zagreb', amount: -42 }, personal);
  assert.deepEqual(result, { category: 'transport', confidence: 'custom-rule', rule: 'rule-transport' });
});

test('cycle 1: auto-categorization rules remain isolated between Personal and Business', () => {
  const personal = profile('food');
  const business = profile('transport');
  assert.equal(MerCore.autoCategorizeBankTransaction({ description: 'Studio Audit', amount: -20 }, personal).category, 'food');
  assert.equal(MerCore.autoCategorizeBankTransaction({ description: 'Studio Audit', amount: -20 }, business).category, 'transport');
  assert.match(premium, /state\.automationRules\.push\(\{id:uniqueId\('rule'\),keyword:keyword\.slice\(0,60\),type:/);
  assert.match(premium, /save\(\);event\.target\.reset\(\);renderAutomationRules\(\)/);
});
