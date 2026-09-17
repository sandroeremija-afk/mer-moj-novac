'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Core = require('../core.js');
const Providers = require('../bank-provider.js');

const timestamp = Date.UTC(2026, 7, 20, 12);
const profile = business => ({
  availableBalance:1000, spent:0, transactions:[],
  categories:(business ? ['software', 'marketing', 'other'] : ['food', 'transport', 'entertainment', 'other']).map(id => ({ id, spent:0, limit:500 })),
  incomeCategories:['salary', 'freelance', 'otherIncome'].map(id => ({ id }))
});

test('bank picker exposes four distinctly labeled offline demo institutions and isolated account IDs', () => {
  const providers = Providers.getProviders();
  assert.deepEqual(providers.map(provider => provider.name), ['Revolut', 'PBZ', 'ZABA', 'Erste']);
  assert.ok(providers.every(provider => provider.id.endsWith('-demo') && /Demo/.test(provider.region)));
  const accounts = providers.flatMap(provider => provider.accounts);
  assert.equal(new Set(accounts.map(account => account.id)).size, accounts.length);
  providers[2].accounts[0].name = 'changed';
  assert.notEqual(Providers.getProviders()[2].accounts[0].name, 'changed', 'picker clones cannot mutate provider fixtures');
  assert.doesNotMatch(fs.readFileSync(require.resolve('../bank-provider.js'), 'utf8'), /https?:\/\/|\bfetch\s*\(|XMLHttpRequest|client_secret|access_token/);
});

for (const providerId of ['zaba-demo', 'erste-demo']) {
  for (const profileId of ['personal', 'business']) {
    test(`${providerId} ${profileId} imports signed income/expense fixtures only into its mapped profile`, async () => {
      const provider = Providers.getProvider(providerId);
      const account = provider.accounts[profileId === 'business' ? 1 : 0];
      assert.match(account.name, /Demo/);
      assert.equal(account.iban, '', 'demo fixtures do not imply a usable payment account');
      const connection = Providers.createConnection(providerId, account.id, profileId, timestamp);
      const store = Core.createAccountStore(profile(false), profile(true), { activeAccount:profileId === 'personal' ? 'business' : 'personal' });
      const other = profileId === 'personal' ? 'business' : 'personal';
      const untouched = JSON.stringify(store.accounts[other]);
      const response = await Providers.fetchTransactions(connection, { now:timestamp });
      assert.equal(response.transactions.length, profileId === 'personal' ? 3 : 2);
      const result = Core.importBankTransactions(store.accounts[connection.profileId], connection, response.transactions);
      assert.equal(result.imported.length, response.transactions.length);
      assert.equal(result.imported.filter(transaction => transaction.type === 'income').length, 1);
      assert.equal(result.imported.filter(transaction => transaction.type === 'expense').length, result.imported.length - 1);
      assert.ok(result.imported.every(transaction => transaction.amount > 0 && transaction.connectionId === connection.id && transaction.source === `Auto: ${provider.name}`));
      assert.equal(JSON.stringify(store.accounts[other]), untouched);
      const net = Core.transactionTotals(result.imported, 'monthly', '2026-08-20').net;
      const expected = providerId === 'zaba-demo' ? (profileId === 'personal' ? 1591 : 945) : (profileId === 'personal' ? 1711.61 : 1355);
      assert.equal(net, expected);
      assert.equal(Core.importBankTransactions(store.accounts[connection.profileId], connection, response.transactions).duplicates, result.imported.length);
      connection.cursor = response.nextCursor;
      const second = await Providers.fetchTransactions(connection, { now:timestamp + 6000 });
      assert.deepEqual(second.transactions, []);
      assert.equal(JSON.stringify(store.accounts[other]), untouched);
    });
  }

  test(`${providerId} retains authorization expiry, disconnect and rate-limit safeguards`, async () => {
    const accountId = Providers.getProvider(providerId).accounts[0].id;
    const connection = Providers.createConnection(providerId, accountId, 'personal', timestamp);
    assert.throws(() => Providers.createConnection(providerId, 'rev-eur-4821', 'personal'), { code:'INVALID_ACCOUNT' });
    connection.tokenState = 'expired';
    await assert.rejects(Providers.fetchTransactions(connection, { now:timestamp }), { code:'TOKEN_EXPIRED' });
    Providers.renewConnection(connection);
    await Providers.fetchTransactions(connection, { now:timestamp });
    await assert.rejects(Providers.fetchTransactions(connection, { now:timestamp + 1 }), { code:'RATE_LIMITED' });
    connection.status = 'disconnected';
    await assert.rejects(Providers.fetchTransactions(connection, { now:timestamp + 6000 }), { code:'DISCONNECTED' });
  });
}
