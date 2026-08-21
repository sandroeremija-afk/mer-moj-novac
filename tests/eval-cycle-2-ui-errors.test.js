const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Core = require('../core.js');
const Providers = require('../bank-provider.js');

const root = path.resolve(__dirname, '..');

function profile() {
  return {
    categories: [{ id: 'food' }, { id: 'transport' }, { id: 'shopping' }, { id: 'entertainment' }, { id: 'other' }],
    incomeCategories: [{ id: 'salary' }, { id: 'gift' }, { id: 'freelance' }, { id: 'otherIncome' }],
    transactions: []
  };
}

test('Cycle 2: expired authorization returns a reconnectable token error', async () => {
  const connection = Providers.createConnection('revolut-demo', 'rev-eur-4821', 'personal', Date.UTC(2026, 7, 20));
  connection.tokenState = 'expired';
  await assert.rejects(() => Providers.fetchTransactions(connection, { now: Date.UTC(2026, 7, 20, 12) }), error => error.code === 'TOKEN_EXPIRED');
  Providers.renewConnection(connection);
  assert.equal(connection.tokenState, 'active');
});

test('Cycle 2: disconnected accounts fail without returning transaction data', async () => {
  const connection = Providers.createConnection('pbz-demo', 'pbz-current-7730', 'personal', Date.UTC(2026, 7, 20));
  connection.status = 'disconnected';
  await assert.rejects(() => Providers.fetchTransactions(connection, { now: Date.UTC(2026, 7, 20, 12) }), error => error.code === 'DISCONNECTED');
});

test('Cycle 2: repeated refreshes expose a rate-limit retry window', async () => {
  const connection = Providers.createConnection('revolut-demo', 'rev-visa-1189', 'personal', Date.UTC(2026, 7, 20));
  const now = Date.UTC(2026, 7, 20, 12);
  await Providers.fetchTransactions(connection, { now });
  await assert.rejects(() => Providers.fetchTransactions(connection, { now: now + 1000 }), error => error.code === 'RATE_LIMITED' && error.retryAfterSeconds === 5);
});

test('Cycle 2: unknown vendors enter the manual review queue', () => {
  const target = profile();
  const connection = Providers.createConnection('revolut-demo', 'rev-eur-4821', 'personal', Date.UTC(2026, 7, 20));
  const result = Core.importBankTransactions(target, connection, [{ id: 'unknown-1', bookedAt: '2026-08-20', amount: -17, description: 'UNRECOGNIZED POS 0024' }]);
  assert.equal(result.uncategorized, 1);
  assert.equal(result.imported[0].category, 'other');
  assert.equal(result.imported[0].needsReview, true);
  assert.equal(result.imported[0].categoryConfidence, 'fallback');
});

test('Cycle 2: invalid zero amounts and invalid booking dates are ignored safely', () => {
  const target = profile();
  const connection = Providers.createConnection('revolut-demo', 'rev-eur-4821', 'personal', Date.UTC(2026, 7, 20));
  const result = Core.importBankTransactions(target, connection, [
    { id: 'zero', bookedAt: '2026-08-20', amount: 0, description: 'ZERO' },
    { id: 'bad-date', bookedAt: '20/08/2026', amount: -4, description: 'BAD DATE' }
  ]);
  assert.deepEqual({ imported: result.imported.length, invalid: result.invalid }, { imported: 0, invalid: 2 });
});

test('Cycle 2: provider accounts retain explicit Personal and Business mappings', () => {
  const personal = Providers.createConnection('pbz-demo', 'pbz-current-7730', 'personal', 1);
  const business = Providers.createConnection('pbz-demo', 'pbz-business-2204', 'business', 2);
  assert.equal(personal.profileId, 'personal');
  assert.equal(business.profileId, 'business');
  assert.notEqual(personal.id, business.id);
});

test('Cycle 2: UI exposes settings, mapping, sync, source, review, and bilingual error states', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  for (const contract of ['bankSettingsModal', 'bankConnectForm', 'bankProfileSelect', 'syncNow', 'uncategorizedBadge', 'reviewQueueBanner']) assert.match(html, new RegExp(contract));
  for (const contract of ['TOKEN_EXPIRED', 'DISCONNECTED', 'RATE_LIMITED', 'data-map-bank', 'transaction-source', 'categoryApproved']) assert.match(app, new RegExp(contract));
  assert.doesNotMatch(app, /bankConnectFlow/);
  for (const contract of ['bank-connection-card', 'bank-sync-strip', 'needs-review-tag', '@media (max-width: 540px)']) assert.ok(css.includes(contract), `Missing CSS contract: ${contract}`);
  assert.match(app, /Bank authorization expired/);
  assert.match(app, /Bankovno odobrenje je isteklo/);
});

test('Cycle 2: sync cursors return only transactions not already fetched', async () => {
  const connection = Providers.createConnection('revolut-demo', 'rev-visa-1189', 'personal', Date.UTC(2026, 7, 20));
  const now = Date.UTC(2026, 7, 20, 12);
  const first = await Providers.fetchTransactions(connection, { now });
  connection.cursor = first.nextCursor;
  const second = await Providers.fetchTransactions(connection, { now: now + 6000 });
  assert.equal(first.transactions.length, 2);
  assert.equal(second.transactions.length, 0);
});

