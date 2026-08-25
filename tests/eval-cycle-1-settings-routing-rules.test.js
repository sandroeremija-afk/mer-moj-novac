const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const MerCore = require('../core.js');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const premium = fs.readFileSync(path.join(root, 'premium.js'), 'utf8');

function profile(category) {
  return {
    categories: [{ id: 'food' }, { id: 'transport' }, { id: 'other' }],
    incomeCategories: [{ id: 'salary' }, { id: 'otherIncome' }],
    automationRules: [{ id: `rule-${category}`, keyword: 'Studio Audit', type: 'expense', category, enabled: true }]
  };
}

test('cycle 1: dashboard Connect Bank opens Settings directly on the Banks tab', () => {
  assert.match(app, /function openBankSettings\(\)[\s\S]*window\.MerSettings\?\.open[\s\S]*\.open\('banks'\)/);
  assert.match(premium, /window\.MerSettings=Object\.freeze\(\{open:openSettings,selectTab:selectSettingsTab\}\)/);
  assert.match(premium, /function openSettings\(tab='general'\)[\s\S]*selectSettingsTab\(tab\)/);
  assert.match(premium, /if\(selectedSettingsTab==='banks'\)renderBankSettings\(\)/);
  assert.doesNotMatch(premium, /#manageBanks'\)\.addEventListener\('click',\(\)=>selectSettingsTab/);
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
