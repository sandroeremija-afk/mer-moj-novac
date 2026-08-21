const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const MerSecurity = require('../security-core.js');
const MerImport = require('../import-core.js');

function profile() {
  return {
    categories: [{ id: 'food' }, { id: 'transport' }, { id: 'other' }],
    incomeCategories: [{ id: 'salary' }, { id: 'freelance' }, { id: 'otherIncome' }],
    automationRules: [{ id: 'r-uber', keyword: 'Uber', type: 'expense', category: 'transport', enabled: true }],
    transactions: []
  };
}

test('Cycle 1: TOTP generation matches the RFC 6238 SHA-1 vector', async () => {
  const secret = MerSecurity.bytesToBase32(new TextEncoder().encode('12345678901234567890'));
  assert.equal(await MerSecurity.generateTotp(secret, 59_000, { digits: 8 }), '94287082');
});

test('Cycle 1: TOTP validation accepts a small clock drift and rejects invalid tokens', async () => {
  const secret = MerSecurity.generateSecret();
  const time = 1_800_000_000_000;
  const token = await MerSecurity.generateTotp(secret, time);
  assert.equal(await MerSecurity.validateTotp(secret, token, time + 30_000, 1), true);
  assert.equal(await MerSecurity.validateTotp(secret, '000000', time, 0), token === '000000');
  assert.equal(await MerSecurity.validateTotp(secret, '12AB56', time), false);
});

test('Cycle 1: recovery codes are stored as hashes and consumed only once', async () => {
  const code = 'ABCD-1234-EF56';
  const hash = await MerSecurity.hashRecoveryCode(code);
  assert.notEqual(hash, code);
  const first = await MerSecurity.consumeRecoveryCode(code.toLowerCase(), [hash]);
  assert.equal(first.valid, true);
  assert.deepEqual(first.remainingHashes, []);
  assert.equal((await MerSecurity.consumeRecoveryCode(code, first.remainingHashes)).valid, false);
});

test('Cycle 1: CSV parser supports quoted commas, Croatian headers and decimal commas', () => {
  const csv = 'Datum;Opis;Iznos;Vrsta\r\n20.08.2026.;"Konzum, Centar";"-42,18";Trošak\r\n20.08.2026.;Plaća;4300;Prihod';
  const result = MerImport.parseCsvImport(csv, profile());
  assert.equal(result.reviewRows.length, 2);
  assert.equal(result.reviewRows[0].name, 'Konzum, Centar');
  assert.equal(result.reviewRows[0].amount, 42.18);
  assert.equal(result.reviewRows[0].category, 'food');
  assert.equal(result.reviewRows[1].type, 'income');
  assert.equal(result.reviewRows[1].category, 'salary');
});

test('Cycle 1: malformed rows are reported and valid rows continue parsing', () => {
  const csv = 'Date,Description,Amount,Type\n2026-02-30,Bad date,-12,Expense\n2026-08-20,,20,Expense\n2026-08-20,Uber ride,nope,Expense\n2026-08-20,Uber ride,-18.50,Expense';
  const result = MerImport.parseCsvImport(csv, profile());
  assert.equal(result.reviewRows.length, 1);
  assert.equal(result.invalidRows.length, 3);
  assert.equal(result.reviewRows[0].category, 'transport');
});

test('Cycle 1: duplicate rows are rejected against state and within one file', () => {
  const target = profile();
  target.transactions.push({ date: '2026-08-20T12:00:00', name: 'Existing', amount: 10, type: 'expense' });
  const csv = 'Date,Description,Amount,Type\n2026-08-20,Existing,-10,Expense\n2026-08-19,Netflix,-15.49,Expense\n2026-08-19,Netflix,-15.49,Expense';
  const result = MerImport.parseCsvImport(csv, target);
  assert.equal(result.reviewRows.length, 1);
  assert.equal(result.duplicates, 2);
});

test('Cycle 1: imported incomes and expenses stay segregated by type', () => {
  const target = profile();
  const parsed = MerImport.parseCsvImport('Date,Description,Amount\n2026-08-20,Freelance invoice,350\n2026-08-20,Uber,-25', target);
  const committed = MerImport.commitImport(target, parsed.reviewRows, 'history.csv');
  assert.equal(committed.imported.filter(row => row.type === 'income').length, 1);
  assert.equal(committed.imported.filter(row => row.type === 'expense').length, 1);
  assert.ok(committed.imported.every(row => row.source === 'Import: history.csv'));
});
