(function exposeMerInvoices(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerInvoices = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerInvoices() {
  'use strict';

  // Domestic EUR/25% drafts only. Sending/fiscalization requires the current
  // Croatian CIUS validator, an authorized access point and signing credentials.
  const clean = (value, max = 200) => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
  const escapeXml = value => clean(value, 10000).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' })[ch]);
  const money = cents => `${Math.trunc(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
  const dateValid = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const parsed = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };

  function scaledDecimal(value, precision = 2) {
    const raw = String(value ?? '').trim().replace(',', '.');
    if (!new RegExp(`^\\d{1,12}(?:\\.\\d{1,${precision}})?$`).test(raw)) return null;
    const [integer, decimals = ''] = raw.split('.');
    const result = Number(integer) * (10 ** precision) + Number(decimals.padEnd(precision, '0'));
    return Number.isSafeInteger(result) ? result : null;
  }

  function validateOib(value) {
    const oib = clean(value).replace(/\s/g, '');
    if (!/^\d{11}$/.test(oib) || /^0+$/.test(oib)) return false;
    let remainder = 10;
    for (const digit of oib.slice(0, 10)) {
      remainder = (remainder + Number(digit)) % 10;
      if (remainder === 0) remainder = 10;
      remainder = remainder * 2 % 11;
    }
    return (11 - remainder) % 10 === Number(oib[10]);
  }

  function validateIban(value) {
    const iban = clean(value).replace(/\s/g, '').toUpperCase();
    if (!/^HR\d{19}$/.test(iban)) return false;
    let remainder = 0;
    for (const char of iban.slice(4) + iban.slice(0, 4)) {
      const digits = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char;
      for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
    }
    return remainder === 1;
  }

  function normalizeParty(value = {}, seller = false) {
    if (!value || typeof value !== 'object') value = {};
    return {
      name:clean(value.name), oib:clean(value.oib).replace(/\s/g, ''),
      address:clean(value.address), city:clean(value.city), postalCode:clean(value.postalCode, 20), country:'HR',
      ...(seller ? { iban:clean(value.iban).replace(/\s/g, '').toUpperCase(), vatRegistered:value.vatRegistered === true } : {})
    };
  }

  function calculateLines(rawLines) {
    if (!Array.isArray(rawLines) || !rawLines.length || rawLines.length > 100) throw new Error('Unesite od 1 do 100 stavki računa.');
    let netCents = 0;
    const lines = rawLines.map((line, index) => {
      if (!line || typeof line !== 'object') throw new Error(`Stavka ${index + 1}: nedostaju podaci robe ili usluge.`);
      const quantityMilli = scaledDecimal(line.quantity, 3);
      const unitPriceCents = scaledDecimal(line.unitPrice, 2);
      const description = clean(line.description, 500);
      const kpdDigits = clean(line.kpd).replace(/\./g, '');
      if (!description) throw new Error(`Stavka ${index + 1}: upišite naziv robe ili usluge.`);
      if (!/^\d{6}$/.test(kpdDigits)) throw new Error(`Stavka ${index + 1}: unesite KPD oznaku od 6 znamenki (npr. 62.20.20).`);
      if (quantityMilli === null || quantityMilli <= 0 || quantityMilli > 1000000000) throw new Error(`Stavka ${index + 1}: količina mora biti veća od nule, s najviše 3 decimale.`);
      if (unitPriceCents === null || unitPriceCents <= 0 || unitPriceCents > 100000000000) throw new Error(`Stavka ${index + 1}: unesite pozitivnu cijenu s najviše 2 decimale.`);
      if (line.vatRate !== undefined && Number(line.vatRate) !== 25) throw new Error('Ovaj predložak podržava isključivo domaće isporuke s PDV-om 25%.');
      const lineNetCents = Number((BigInt(quantityMilli) * BigInt(unitPriceCents) + 500n) / 1000n);
      netCents += lineNetCents;
      if (!Number.isSafeInteger(netCents) || netCents > 10000000000000) throw new Error('Ukupan iznos računa je izvan podržanog raspona.');
      return { id:String(index + 1), description, quantity:quantityMilli / 1000, quantityMilli, unitPrice:unitPriceCents / 100, unitPriceCents, vatRate:25, kpd:kpdDigits.replace(/(\d{2})(\d{2})(\d{2})/, '$1.$2.$3'), netCents:lineNetCents };
    });
    // EN 16931 tax-category amount is calculated from the category net base,
    // not a sum of individually rounded per-line tax amounts.
    const taxCents = Number((BigInt(netCents) * 25n + 50n) / 100n);
    return { lines, netCents, taxCents, totalCents:netCents + taxCents };
  }

  function createDraft(input, profileId) {
    if (profileId !== 'business' || input?.profileId && input.profileId !== 'business') throw new Error('Računi su dostupni samo u poslovnom profilu.');
    if (!input || typeof input !== 'object') throw new Error('Nedostaju podaci računa.');
    const seller = normalizeParty(input.seller, true), buyer = normalizeParty(input.buyer);
    for (const [name, party] of [['Izdavatelj', seller], ['Kupac', buyer]]) {
      if (!party.name || !party.address || !party.city || !/^\d{5}$/.test(party.postalCode)) throw new Error(`${name}: unesite naziv i potpunu hrvatsku adresu s poštanskim brojem.`);
      if (!validateOib(party.oib)) throw new Error(`${name}: OIB mora imati 11 znamenki i valjanu kontrolnu znamenku.`);
      if (input[name === 'Izdavatelj' ? 'seller' : 'buyer']?.country && input[name === 'Izdavatelj' ? 'seller' : 'buyer'].country !== 'HR') throw new Error('Ovaj predložak podržava samo domaće isporuke u Hrvatskoj.');
    }
    if (!seller.vatRegistered) throw new Error('Potvrdite da je izdavatelj u sustavu PDV-a i da se na sve stavke primjenjuje stopa 25%.');
    if (!validateIban(seller.iban)) throw new Error('Unesite valjani hrvatski IBAN izdavatelja.');
    const number = clean(input.number, 60), issueDate = clean(input.issueDate), dueDate = clean(input.dueDate);
    if (!number || !/^[\p{L}\p{N}\s./_-]+$/u.test(number)) throw new Error('Unesite broj računa koristeći slova, brojeve, crticu ili kosu crtu.');
    if (!dateValid(issueDate) || !dateValid(dueDate) || dueDate < issueDate || issueDate < '2026-01-01' || dueDate >= '2100-01-01') throw new Error('Provjerite datume: dospijeće ne smije biti prije izdavanja, a godina mora biti između 2026. i 2099.');
    return {
      id:clean(input.id, 100) || `invoice-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
      profileId:'business', status:'draft', format:'UBL-2.1-draft', currency:'EUR', number, issueDate, dueDate,
      seller, buyer, note:clean(input.note, 1000), ...calculateLines(input.lines)
    };
  }

  function saveDraft(store, input, profileId) {
    if (profileId !== 'business' || store?.activeProfile && store.activeProfile !== 'business' || store?.activeAccount && store.activeAccount !== 'business') throw new Error('Prije spremanja odaberite poslovni profil.');
    const business = store?.accounts?.business || store?.profiles?.business;
    if (!business) throw new Error('Poslovni profil nije dostupan.');
    const draft = createDraft(input, profileId);
    const invoices = business.enterprise?.invoices || [];
    if (invoices.some(item => item.id !== draft.id && item.number === draft.number)) throw new Error('Račun s ovim brojem već postoji.');
    business.enterprise ||= {};
    business.enterprise.invoices = [...invoices.filter(item => item.id !== draft.id), draft];
    return draft;
  }

  function toXml(input) {
    const invoice = createDraft(input, input?.profileId);
    const x = escapeXml;
    const party = (item, supplier) => `<cac:${supplier ? 'AccountingSupplierParty' : 'AccountingCustomerParty'}><cac:Party><cbc:EndpointID schemeID="9934">${x(item.oib)}</cbc:EndpointID><cac:PartyName><cbc:Name>${x(item.name)}</cbc:Name></cac:PartyName><cac:PostalAddress><cbc:StreetName>${x(item.address)}</cbc:StreetName><cbc:CityName>${x(item.city)}</cbc:CityName><cbc:PostalZone>${x(item.postalCode)}</cbc:PostalZone><cac:Country><cbc:IdentificationCode>HR</cbc:IdentificationCode></cac:Country></cac:PostalAddress>${supplier ? `<cac:PartyTaxScheme><cbc:CompanyID>HR${x(item.oib)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ''}<cac:PartyLegalEntity><cbc:RegistrationName>${x(item.name)}</cbc:RegistrationName><cbc:CompanyID>${x(item.oib)}</cbc:CompanyID></cac:PartyLegalEntity></cac:Party></cac:${supplier ? 'AccountingSupplierParty' : 'AccountingCustomerParty'}>`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<!-- MER nacrt: nije fiskaliziran ni potvrđen hrvatskim CIUS/Schematron validatorom. -->
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
<cbc:UBLVersionID>2.1</cbc:UBLVersionID><cbc:CustomizationID>urn:mer:invoice:draft:1</cbc:CustomizationID><cbc:ProfileID>P1</cbc:ProfileID><cbc:ID>${x(invoice.number)}</cbc:ID><cbc:IssueDate>${invoice.issueDate}</cbc:IssueDate><cbc:DueDate>${invoice.dueDate}</cbc:DueDate><cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode><cbc:Note>${x(`NACRT — nije fiskaliziran. ${invoice.note}`)}</cbc:Note><cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
${party(invoice.seller, true)}${party(invoice.buyer, false)}
<cac:PaymentMeans><cbc:PaymentMeansCode>30</cbc:PaymentMeansCode><cbc:PaymentID>${x(invoice.number)}</cbc:PaymentID><cac:PayeeFinancialAccount><cbc:ID>${x(invoice.seller.iban)}</cbc:ID></cac:PayeeFinancialAccount></cac:PaymentMeans>
<cac:TaxTotal><cbc:TaxAmount currencyID="EUR">${money(invoice.taxCents)}</cbc:TaxAmount><cac:TaxSubtotal><cbc:TaxableAmount currencyID="EUR">${money(invoice.netCents)}</cbc:TaxableAmount><cbc:TaxAmount currencyID="EUR">${money(invoice.taxCents)}</cbc:TaxAmount><cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>25</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal>
<cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="EUR">${money(invoice.netCents)}</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount currencyID="EUR">${money(invoice.netCents)}</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount currencyID="EUR">${money(invoice.totalCents)}</cbc:TaxInclusiveAmount><cbc:PayableAmount currencyID="EUR">${money(invoice.totalCents)}</cbc:PayableAmount></cac:LegalMonetaryTotal>
${invoice.lines.map(line => `<cac:InvoiceLine><cbc:ID>${line.id}</cbc:ID><cbc:InvoicedQuantity unitCode="H87">${line.quantity.toFixed(3)}</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="EUR">${money(line.netCents)}</cbc:LineExtensionAmount><cac:Item><cbc:Name>${x(line.description)}</cbc:Name><cac:CommodityClassification><cbc:ItemClassificationCode listID="CG">${line.kpd}</cbc:ItemClassificationCode></cac:CommodityClassification><cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Name>HR:PDV25</cbc:Name><cbc:Percent>25</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item><cac:Price><cbc:PriceAmount currencyID="EUR">${money(line.unitPriceCents)}</cbc:PriceAmount><cbc:BaseQuantity unitCode="H87">1</cbc:BaseQuantity></cac:Price></cac:InvoiceLine>`).join('\n')}
</Invoice>`;
  }

  function qrPayload(input) {
    const invoice = createDraft(input, input?.profileId);
    // A scannable draft summary, deliberately not a HUB3/PDF417 payment order.
    return JSON.stringify({ kind:'MER_INVOICE_DRAFT', number:invoice.number, date:invoice.issueDate, due:invoice.dueDate, amount:money(invoice.totalCents), currency:'EUR', iban:invoice.seller.iban });
  }

  function filename(invoice, extension) {
    return `Racun_Nacrt_${clean(invoice.number, 60).replace(/[^\p{L}\p{N}._-]/gu, '_')}.${extension === 'xml' ? 'xml' : 'pdf'}`;
  }

  return { validateOib, validateIban, scaledDecimal, calculateLines, createDraft, saveDraft, toXml, qrPayload, filename, escapeXml };
});
