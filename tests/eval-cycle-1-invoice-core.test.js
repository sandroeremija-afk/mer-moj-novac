'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const I = require('../invoice-core.js');
function input(overrides = {}) {
  return { id:'test-invoice', number:'1-P1-1', profileId:'business', issueDate:'2026-09-07', dueDate:'2026-09-21', seller:{ name:'Test izdavatelj', oib:'12345678903', iban:'HR1210010051863000160', address:'Testna 1', city:'Zagreb', postalCode:'10000', vatRegistered:true }, buyer:{ name:'Test kupac', oib:'69435151530', address:'Testna 2', city:'Zagreb', postalCode:'10000' }, lines:[{ description:'Test usluga', quantity:2, unitPrice:'100.00', kpd:'62.20.20', vatRate:25 }], ...overrides };
}
test('OIB checksum, domestic IBAN checksum and strict decimal validation', () => {
  assert.equal(I.validateOib('12345678903'), true);
  assert.equal(I.validateOib('12345678904'), false);
  assert.equal(I.validateOib('00000000000'), false);
  assert.equal(I.validateOib('123'), false);
  assert.equal(I.validateIban('HR12 1001 0051 8630 0016 0'), true);
  assert.equal(I.validateIban('HR1210010051863000161'), false);
  assert.equal(I.validateIban('DE89370400440532013000'), false);
  assert.equal(I.scaledDecimal('10,50'), 1050);
  for (const invalid of ['NaN', Infinity, -1, '', '1,200.00', '0.001', '1e9']) assert.equal(I.scaledDecimal(invalid), null);
});
test('25% VAT invoice math uses integer cents and calculates tax on aggregate category base', () => {
  const draft = I.createDraft(input(), 'business');
  assert.deepEqual([draft.netCents, draft.taxCents, draft.totalCents], [20000, 5000, 25000]);
  const small = I.calculateLines(Array.from({ length:3 }, () => ({ description:'Sitna stavka', kpd:'622020', quantity:1, unitPrice:'.02'.replace(/^\./, '0.') })));
  assert.deepEqual([small.netCents, small.taxCents, small.totalCents], [6, 2, 8]);
  const fractional = I.calculateLines([{ description:'Dio usluge', kpd:'622020', quantity:'1.005', unitPrice:'1.00' }]);
  assert.equal(fractional.netCents, 101);
  assert.throws(() => I.calculateLines([{ description:'Previše', kpd:'622020', quantity:'1000000', unitPrice:'1000000000.00' }]), /raspona/);
});
test('draft validation rejects invalid party, dates, missing KPD, unsupported VAT and empty lines', () => {
  const valid = input();
  assert.throws(() => I.createDraft({ ...valid, seller:{ ...valid.seller, oib:'1' } }, 'business'), /OIB/);
  assert.throws(() => I.createDraft({ ...valid, seller:{ ...valid.seller, iban:'HR00' } }, 'business'), /IBAN/);
  assert.throws(() => I.createDraft({ ...valid, seller:{ ...valid.seller, vatRegistered:false } }, 'business'), /PDV/);
  assert.throws(() => I.createDraft({ ...valid, issueDate:'2026-02-29' }, 'business'), /datume/);
  assert.throws(() => I.createDraft({ ...valid, dueDate:'2026-01-01' }, 'business'), /datume/);
  assert.doesNotThrow(() => I.createDraft({ ...valid, issueDate:'2028-02-29', dueDate:'2028-03-14' }, 'business'));
  assert.throws(() => I.createDraft({ ...valid, lines:[] }, 'business'), /stavki/);
  assert.throws(() => I.createDraft({ ...valid, lines:[{ ...valid.lines[0], kpd:'' }] }, 'business'), /KPD/);
  assert.throws(() => I.createDraft({ ...valid, lines:[{ ...valid.lines[0], vatRate:13 }] }, 'business'), /25%/);
});
test('business draft saves are isolated, upsert by ID, reject duplicate number and never post ledger entries', () => {
  const state = { activeAccount:'business', accounts:{ personal:{ transactions:[{ amount:99 }] }, business:{ transactions:[], enterprise:{ invoices:[] } } } };
  const personalBefore = JSON.stringify(state.accounts.personal);
  I.saveDraft(state, input(), 'business');
  I.saveDraft(state, input({ note:'Ispravak' }), 'business');
  assert.equal(state.accounts.business.enterprise.invoices.length, 1);
  assert.equal(state.accounts.business.enterprise.invoices[0].note, 'Ispravak');
  assert.equal(JSON.stringify(state.accounts.personal), personalBefore);
  assert.deepEqual(state.accounts.business.transactions, []);
  assert.throws(() => I.saveDraft(state, input({ id:'different' }), 'business'), /već postoji/);
  assert.throws(() => I.createDraft(input(), 'personal'), /poslovnom/);
  state.activeAccount = 'personal';
  assert.throws(() => I.saveDraft(state, input(), 'business'), /poslovni/);
});
test('XML escapes user data and explicitly marks a non-fiscalized draft with correct KPD and totals', () => {
  const draft = input();
  draft.seller.name = '<script>alert("x")</script> & društvo';
  draft.lines[0].description = 'Roba < 3 & "Usluga"';
  const xml = I.toXml(draft);
  assert.ok(xml.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; društvo'));
  assert.ok(!xml.includes('<script>'));
  assert.ok(xml.includes('<cbc:PayableAmount currencyID="EUR">250.00</cbc:PayableAmount>'));
  assert.ok(xml.includes('<cbc:ItemClassificationCode listID="CG">62.20.20'));
  assert.ok(xml.includes('urn:mer:invoice:draft:1'));
  assert.ok(xml.includes('nije fiskaliziran'));
  assert.ok(!xml.includes('#compliant#'));
});
test('summary QR omits seller and buyer identity and cannot be mistaken for a HUB3 payment instruction', () => {
  const payload = JSON.parse(I.qrPayload(input()));
  assert.equal(payload.kind, 'MER_INVOICE_DRAFT');
  assert.equal(payload.amount, '250.00');
  assert.equal(payload.iban, input().seller.iban);
  assert.equal(payload.buyer, undefined);
  assert.equal(payload.oib, undefined);
  assert.equal(I.filename(input(), 'xml'), 'Racun_Nacrt_1-P1-1.xml');
});
