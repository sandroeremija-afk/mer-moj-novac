const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const MerCore = require('../core.js');
const MerImport = require('../import-core.js');
const MerAccounting = require('../accounting-core.js');

const fixture = name => fs.readFileSync(path.join(__dirname, 'fixtures', 'banks', name), 'utf8');
const appSource = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const profile = id => ({
  id,
  currency:'EUR',
  categories:[
    { id:'food' }, { id:'transport' }, { id:'utilities' }, { id:'healthBeauty' },
    { id:'entertainment' }, { id:'shopping' }, { id:'other' }
  ],
  incomeCategories:[{ id:'salary' }, { id:'freelance' }, { id:'gift' }, { id:'otherIncome' }],
  automationRules:[],
  transactions:[]
});

test('evaluation cycle 1: ZABA, PBZ and Erste CSV schemas normalize dates, signs and bank fields', () => {
  const personal = profile('personal');
  const zaba = MerImport.parseBankImport(fixture('zaba.csv'), personal, { sourceName:'zaba.csv', profileId:'personal' });
  assert.equal(zaba.schema, 'zaba');
  assert.equal(zaba.reviewRows.length, 2);
  assert.deepEqual(zaba.reviewRows.map(row => [row.date, row.type, row.amount, row.categoryId]), [
    ['2026-08-20', 'expense', 45.67, 'food'],
    ['2026-08-21', 'income', 1850, 'salary']
  ]);
  assert.equal(zaba.reviewRows[0].iban, 'HR1210010051863000160');
  assert.equal(zaba.reviewRows[0].profileId, 'personal');

  const pbz = MerImport.parseBankImport(fixture('pbz.csv'), personal, { sourceName:'pbz.csv', profileId:'personal' });
  assert.equal(pbz.schema, 'pbz');
  assert.deepEqual(pbz.reviewRows.map(row => [row.type, row.categoryId]), [['expense', 'transport'], ['income', 'freelance']]);

  const erste = MerImport.parseBankImport(fixture('erste.csv'), personal, { sourceName:'erste-george.csv', profileId:'personal' });
  assert.equal(erste.schema, 'erste');
  assert.deepEqual(erste.reviewRows.map(row => [row.type, row.categoryId]), [['expense', 'healthBeauty'], ['income', 'freelance']]);
});

test('evaluation cycle 1: OTP, HPB, Revolut and Wise exports detect native schemas and booked states', () => {
  const personal = profile('personal');
  const otp = MerImport.parseBankImport(fixture('otp-hpb.csv'), personal, { sourceName:'otp-promet.csv', profileId:'personal' });
  const hpb = MerImport.parseBankImport(fixture('otp-hpb.csv'), personal, { sourceName:'hpb-promet.csv', profileId:'personal' });
  assert.equal(otp.schema, 'otp');
  assert.equal(hpb.schema, 'hpb');
  assert.deepEqual(otp.reviewRows.map(row => row.categoryId), ['utilities', 'food']);
  assert.equal(otp.reviewRows[0].reference, 'HR00 123-456');

  const revolut = MerImport.parseBankImport(fixture('revolut.csv'), personal, { sourceName:'revolut.csv', profileId:'personal' });
  assert.equal(revolut.schema, 'revolut');
  assert.equal(revolut.reviewRows.length, 1);
  assert.equal(revolut.reviewRows[0].categoryId, 'transport');
  assert.deepEqual(revolut.invalidRows, [{ row:3, reason:'non-booked-state' }]);

  const wise = MerImport.parseBankImport(fixture('wise.csv'), personal, { sourceName:'wise.csv', profileId:'personal' });
  assert.equal(wise.schema, 'wise');
  assert.equal(wise.reviewRows[0].categoryId, 'shopping');
  assert.equal(wise.reviewRows[0].fee, 0.35);
});

test('evaluation cycle 1: PSD2 JSON supports instructedAmount, normalized aliases, external-ID dedupe and profile isolation', () => {
  const personal = profile('personal');
  const business = profile('business');
  const parsed = MerImport.parseOpenBankingImport(fixture('psd2.json'), personal, { profileId:'personal' });
  assert.equal(parsed.format, 'PSD2-JSON');
  assert.equal(parsed.schema, 'open-banking-psd2');
  assert.equal(parsed.reviewRows.length, 2);
  assert.deepEqual(parsed.reviewRows.map(row => [row.type, row.categoryId]), [['expense', 'food'], ['income', 'salary']]);
  assert.deepEqual(
    Object.keys(parsed.reviewRows[0]).filter(key => ['id','date','title','rawDescription','amount','currency','categoryId','profileId','type'].includes(key)).sort(),
    ['amount','categoryId','currency','date','id','profileId','rawDescription','title','type']
  );
  assert.equal(parsed.reviewRows[0].id, 'psd2-001');
  assert.equal(parsed.reviewRows[0].currency, 'EUR');
  assert.equal(parsed.reviewRows[0].profileId, 'personal');

  const stage = MerImport.createReviewStage(parsed, 'psd2.json', 'personal');
  const rejected = MerImport.commitReviewStage(business, stage, 'business');
  assert.equal(rejected.error, 'profile-changed');
  assert.equal(business.transactions.length, 0);
  const committed = MerImport.commitReviewStage(personal, stage, 'personal');
  assert.equal(committed.imported.length, 2);
  assert.ok(committed.imported.every(row => row.profileId === 'personal'));

  const duplicate = MerImport.parseOpenBankingImport(fixture('psd2.json'), personal, { profileId:'personal' });
  assert.equal(duplicate.reviewRows.length, 0);
  assert.equal(duplicate.duplicates, 2);
  assert.equal(business.transactions.length, 0);
});

test('evaluation cycle 1: Croatian and European merchant families map without manual correction', () => {
  const current = profile('personal');
  const cases = [
    ['Kaufland Zagreb', 'food'], ['Tommy market', 'food'], ['HAC ENC nadoplata', 'transport'], ['Crodux postaja', 'transport'],
    ['Hrvatski Telekom račun', 'utilities'], ['Čistoća Zagreb', 'utilities'], ['McDonald\'s Zagreb', 'food'], ['Dubravica', 'food'],
    ['Farmacia ljekarna', 'healthBeauty'], ['AliExpress', 'shopping'], ['IKEA Hrvatska', 'shopping'], ['Tisak kiosk', 'shopping']
  ];
  cases.forEach(([description, expected]) => {
    const result = MerCore.autoCategorizeBankTransaction({ description, amount:-20, creditDebitIndicator:'DBIT' }, current);
    assert.equal(result.category, expected, description);
    assert.notEqual(result.confidence, 'fallback', description);
  });
});

test('evaluation cycle 1: external IDs distinguish equal charges and reject the same bank item on re-import', () => {
  const personal = profile('personal');
  const payload = { transactions:{ booked:[
    { transactionId:'same-day-001', bookingDate:'2026-08-22', creditorName:'ZET', instructedAmount:{ amount:'-4.00', currency:'EUR' }, creditDebitIndicator:'DBIT' },
    { transactionId:'same-day-002', bookingDate:'2026-08-22', creditorName:'ZET', instructedAmount:{ amount:'-4.00', currency:'EUR' }, creditDebitIndicator:'DBIT' }
  ] } };
  const options = { profileId:'personal', account:{ iban:'HR1210010051863000160' } };
  const first = MerImport.parseOpenBankingImport(payload, personal, options);
  assert.equal(first.reviewRows.length, 2);
  assert.notEqual(first.reviewRows[0].importHash, first.reviewRows[1].importHash);
  MerImport.commitImport(personal, first.reviewRows, 'psd2.json');
  const second = MerImport.parseOpenBankingImport(payload, personal, options);
  assert.equal(second.reviewRows.length, 0);
  assert.equal(second.duplicates, 2);
});

test('evaluation cycle 1: the review UI accepts PSD2 JSON and routes bank files through the adaptive engine', () => {
  const html = appSource('index.html');
  const premium = appSource('premium.js');
  assert.match(html, /accept="[^"]*\.json[^"]*application\/json/);
  assert.match(premium, /MerImport\.parseBankImport\(await file\.text\(\),state,/);
  assert.match(premium, /MerImport\.detectBankSchema\(rows\[0\]\|\|\[\],\{sourceName:file\.name\}\)/);
  assert.match(premium, /profileId:appState\.activeAccount/);
});

test('evaluation cycle 1: spreadsheet dates keep their local calendar day', () => {
  const spreadsheetDate = new Date(2026, 7, 20, 0, 0, 0);
  assert.equal(MerImport.normalizeDate(spreadsheetDate), '2026-08-20');
});

test('evaluation cycle 1: target profile identity and row ownership are both enforced before commit', () => {
  const personal = profile('personal');
  const business = profile('business');
  const parsed = MerImport.parseBankImport(fixture('zaba.csv'), business, { sourceName:'zaba.csv', profileId:'business' });
  const stage = MerImport.createReviewStage(parsed, 'zaba.csv', 'business');
  const result = MerImport.commitReviewStage(personal, stage, 'business');
  assert.equal(result.error, 'profile-changed');
  assert.equal(personal.transactions.length, 0);
});

test('evaluation cycle 1: pending PSD2 records never reach the review queue', () => {
  const personal = profile('personal');
  const parsed = MerImport.parseOpenBankingImport({ transactions:[
    { transactionId:'pending-001', status:'PENDING', bookingDate:'2026-08-20', creditorName:'Konzum', transactionAmount:{ amount:'-15.20', currency:'EUR' }, creditDebitIndicator:'DBIT' }
  ] }, personal, { profileId:'personal' });
  assert.equal(parsed.reviewRows.length, 0);
  assert.deepEqual(parsed.invalidRows, [{ row:1, reason:'non-booked-state' }]);
});

test('evaluation cycle 1: automatic sync and PSD2 file import share one canonical bank identity', () => {
  const personal = profile('personal');
  const connection = { id:'connection-1', providerId:'gocardless', accountId:'account-1', institution:'ZABA', iban:'HR1210010051863000160', currency:'EUR' };
  personal.transactions.push(MerCore.normalizeBankTransaction({ id:'cross-001', bookingDate:'2026-08-20', description:'Konzum', amount:-20, iban:connection.iban }, connection, personal));
  const parsed = MerImport.parseOpenBankingImport({ account:{ iban:connection.iban }, transactions:{ booked:[
    { transactionId:'cross-001', bookingDate:'2026-08-20', creditorName:'Konzum', transactionAmount:{ amount:'-20', currency:'EUR' }, creditDebitIndicator:'DBIT' }
  ] } }, personal, { profileId:'personal' });
  assert.equal(parsed.reviewRows.length, 0);
  assert.equal(parsed.duplicates, 1);
});

test('evaluation cycle 1: bank exports preserve repeated real charges and stay idempotent on re-import', () => {
  const personal = profile('personal');
  const csv = 'Datum knjigovodstva;Opis prometa / Primatelj;Iznos;Valuta;IBAN\n20.08.2026.;ZET;-4,00;EUR;HR1210010051863000160\n20.08.2026.;ZET;-4,00;EUR;HR1210010051863000160';
  const first = MerImport.parseBankImport(csv, personal, { sourceName:'zaba.csv', profileId:'personal' });
  assert.equal(first.reviewRows.length, 2);
  assert.notEqual(first.reviewRows[0].importHash, first.reviewRows[1].importHash);
  MerImport.commitImport(personal, first.reviewRows, 'zaba.csv');
  const second = MerImport.parseBankImport(csv, personal, { sourceName:'zaba.csv', profileId:'personal' });
  assert.equal(second.reviewRows.length, 0);
  assert.equal(second.duplicates, 2);
});

test('evaluation cycle 1: PSD2 income normalization names the debtor as counterparty', () => {
  const transaction = MerAccounting.normalizePsd2Transaction('gocardless', {
    transactionId:'income-001', bookingDate:'2026-08-20', creditDebitIndicator:'CRDT', creditorName:'Moj eRačun', debtorName:'POSLODAVAC D.O.O.', instructedAmount:{ amount:'1200', currency:'EUR' }
  }, { iban:'HR1210010051863000160' });
  assert.equal(transaction.merchantName, 'POSLODAVAC D.O.O.');
});
