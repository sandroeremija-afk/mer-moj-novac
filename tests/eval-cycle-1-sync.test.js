const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../core.js');
const Providers = require('../bank-provider.js');

function profile(overrides = {}) {
  return {
    availableBalance: 1000,
    spent: 0,
    categories: [
      { id: 'food', spent: 0, limit: 500 },
      { id: 'transport', spent: 0, limit: 300 },
      { id: 'shopping', spent: 0, limit: 300 },
      { id: 'entertainment', spent: 0, limit: 200 },
      { id: 'other', spent: 0, limit: 300 }
    ],
    incomeCategories: [
      { id: 'salary' },
      { id: 'gift' },
      { id: 'freelance' },
      { id: 'otherIncome' }
    ],
    transactions: [],
    ...overrides
  };
}

test('Cycle 1: signed bank amounts become income and expenses', async () => {
  const target = profile();
  const connection = Providers.createConnection('revolut-demo', 'rev-eur-4821', 'personal', Date.UTC(2026, 7, 20));
  const response = await Providers.fetchTransactions(connection, { now: Date.UTC(2026, 7, 20, 12) });
  const result = Core.importBankTransactions(target, connection, response.transactions);
  assert.equal(result.imported.length, 4);
  assert.equal(result.imported.filter(transaction => transaction.type === 'income').length, 1);
  assert.equal(result.imported.filter(transaction => transaction.type === 'expense').length, 3);
  assert.equal(Core.transactionTotals(target.transactions, 'monthly', '2026-08-20').net, 755.72);
});

test('Cycle 1: PSD2 credit/debit indicators parse correctly', async () => {
  const target = profile();
  const connection = Providers.createConnection('pbz-demo', 'pbz-current-7730', 'personal', Date.UTC(2026, 7, 20));
  const response = await Providers.fetchTransactions(connection, { now: Date.UTC(2026, 7, 20, 12) });
  const result = Core.importBankTransactions(target, connection, response.transactions);
  const salary = result.imported.find(transaction => transaction.bankTransactionId.endsWith('pbz-7001'));
  const fuel = result.imported.find(transaction => transaction.bankTransactionId.endsWith('pbz-7002'));
  assert.deepEqual({ type: salary.type, amount: salary.amount, category: salary.category }, { type: 'income', amount: 4300, category: 'salary' });
  assert.deepEqual({ type: fuel.type, amount: fuel.amount, category: fuel.category }, { type: 'expense', amount: 45.9, category: 'transport' });
});

test('Cycle 1: duplicate imports are rejected by provider transaction ID', async () => {
  const target = profile();
  const connection = Providers.createConnection('revolut-demo', 'rev-eur-4821', 'personal', Date.UTC(2026, 7, 20));
  const response = await Providers.fetchTransactions(connection, { now: Date.UTC(2026, 7, 20, 12) });
  const first = Core.importBankTransactions(target, connection, response.transactions);
  const second = Core.importBankTransactions(target, connection, response.transactions);
  assert.equal(first.imported.length, 4);
  assert.equal(second.imported.length, 0);
  assert.equal(second.duplicates, 4);
  assert.equal(target.transactions.length, 4);
});

test('Cycle 1: fallback hashes reject duplicates without external IDs', () => {
  const target = profile();
  const connection = Providers.createConnection('revolut-demo', 'rev-eur-4821', 'personal', Date.UTC(2026, 7, 20));
  const raw = { bookedAt: '2026-08-20', amount: -8.5, description: 'LOCAL MERCHANT' };
  assert.equal(Core.importBankTransactions(target, connection, [raw]).imported.length, 1);
  assert.equal(Core.importBankTransactions(target, connection, [{ ...raw }]).duplicates, 1);
});

test('Cycle 1: imports remain isolated in the mapped Personal profile', async () => {
  const personal = profile();
  const business = profile({ categories: [{ id: 'software', spent: 0, limit: 400 }, { id: 'other', spent: 0, limit: 500 }] });
  const store = Core.createAccountStore(personal, business, { activeAccount: 'personal' });
  const beforeBusiness = JSON.stringify(store.accounts.business);
  const connection = Providers.createConnection('revolut-demo', 'rev-eur-4821', 'personal', Date.UTC(2026, 7, 20));
  const response = await Providers.fetchTransactions(connection, { now: Date.UTC(2026, 7, 20, 12) });
  Core.importBankTransactions(store.accounts[connection.profileId], connection, response.transactions);
  assert.equal(store.accounts.personal.transactions.length, 4);
  assert.equal(JSON.stringify(store.accounts.business), beforeBusiness);
});

test('Cycle 1: Business categorization uses Business-only categories', () => {
  const business = profile({ categories: [{ id: 'software', spent: 0, limit: 400 }, { id: 'marketing', spent: 0, limit: 400 }, { id: 'other', spent: 0, limit: 400 }] });
  const connection = Providers.createConnection('pbz-demo', 'pbz-business-2204', 'business', Date.UTC(2026, 7, 20));
  const result = Core.importBankTransactions(business, connection, [
    { id: 'software-1', bookedAt: '2026-08-20', amount: -24.99, description: 'ADOBE SOFTWARE' },
    { id: 'marketing-1', bookedAt: '2026-08-20', amount: -50, description: 'GOOGLE ADS MARKETING' }
  ]);
  assert.deepEqual(result.imported.map(transaction => transaction.category), ['software', 'marketing']);
});

test('Cycle 1: every imported record receives source and immutable bank identity metadata', () => {
  const target = profile();
  const connection = Providers.createConnection('revolut-demo', 'rev-visa-1189', 'personal', Date.UTC(2026, 7, 20));
  const result = Core.importBankTransactions(target, connection, [{ id: 'card-1', bookedAt: '2026-08-20', amount: -10, description: 'SPOTIFY AB' }]);
  const transaction = result.imported[0];
  assert.equal(transaction.source, 'Auto: Revolut');
  assert.equal(transaction.sourceType, 'auto');
  assert.equal(transaction.connectionId, connection.id);
  assert.match(transaction.bankTransactionId, /card-1$/);
  assert.match(transaction.importHash, /^tx-/);
});

