(function exposeMerReceipts(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerReceipts = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerReceipts() {
  'use strict';
  const MAX_LINES = 100;
  const MAX_CENTS = 1000000000000;
  const text = (value, limit = 160) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, limit);
  const escapeHtml = value => text(value, 4000).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
  const cents = value => Number.isSafeInteger(value) && value >= 0 && value <= MAX_CENTS ? value : null;
  const date = value => {
    const raw = String(value || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return '';
    const parsed = new Date(`${raw}T12:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === raw ? raw : '';
  };
  function parseMoney(value) {
    const raw = String(value ?? '').trim().replace(',', '.');
    if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(raw)) return null;
    const [whole, fraction = ''] = raw.split('.');
    return cents(Number(whole) * 100 + Number(fraction.padEnd(2, '0')));
  }
  const merchantKey = value => text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\b(?:pos|card|payment|kartica|placanje|doo|d\.o\.o\.|zagreb|hrvatska|hr)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');

  function normalizeReceipt(input = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};
    const lines = (Array.isArray(input.lines) ? input.lines : []).slice(0, MAX_LINES).map(line => {
      line = line && typeof line === 'object' ? line : {};
      return { description:text(line.description, 240), quantity:typeof line.quantity === 'number' && Number.isFinite(line.quantity) && line.quantity > 0 && line.quantity <= 1000000 ? line.quantity : null, totalCents:cents(line.totalCents) };
    });
    return {
      id:text(input.id, 100), merchant:text(input.merchant), date:date(input.date),
      currency:/^[A-Z]{3}$/.test(input.currency || '') ? input.currency : 'EUR',
      totalCents:cents(input.totalCents), type:input.type === 'income' ? 'income' : 'expense',
      invoiceNumber:text(input.invoiceNumber, 80), lines,
      source:input.source === 'gemini' ? 'gemini' : 'manual',
      imageHash:/^[a-f0-9]{64}$/.test(input.imageHash || '') ? input.imageHash : '',
      fileName:text(input.fileName, 180), reviewed:input.reviewed === true
    };
  }
  function reviewReceipt(input) {
    const receipt = normalizeReceipt(input);
    const errors = [];
    if (!receipt.merchant) errors.push('merchant');
    if (!receipt.date) errors.push('date');
    if (receipt.totalCents === null || receipt.totalCents <= 0) errors.push('total');
    if (receipt.lines.some(line => !line.description || line.totalCents === null)) errors.push('lines');
    if (Array.isArray(input?.lines) && input.lines.length > MAX_LINES) errors.push('too-many-lines');
    const linesCents = receipt.lines.reduce((sum, line) => sum + (line.totalCents || 0), 0);
    return { valid:!errors.length, errors, receipt, linesCents, linesMismatch:receipt.lines.length > 0 && receipt.totalCents !== null && linesCents !== receipt.totalCents };
  }
  function bankTransaction(transaction) {
    return Boolean(transaction?.bankTransactionId || transaction?.bankConnectionId || transaction?.sourceType === 'bank' || /^Auto:/i.test(String(transaction?.source || '')));
  }
  function transactionCents(transaction) {
    const amount = Number(transaction?.amount);
    return Number.isFinite(amount) && amount >= 0 ? cents(Math.round(amount * 100)) : null;
  }
  function sameMerchant(a, b) {
    const first = merchantKey(a), second = merchantKey(b);
    if (!first || !second) return false;
    if (first === second || first.length >= 3 && second.includes(first) || second.length >= 3 && first.includes(second)) return true;
    const tokens = first.split(' ').filter(token => token.length >= 3);
    return tokens.some(token => second.split(' ').includes(token));
  }
  function matchTransactions(input, profile, profileId, options = {}) {
    if (!['personal', 'business'].includes(profileId) || !profile || typeof profile !== 'object') return [];
    const review = reviewReceipt(input);
    if (!review.valid) return [];
    const receipt = review.receipt;
    return (Array.isArray(profile.transactions) ? profile.transactions : []).flatMap(transaction => {
      if (!transaction || transaction.profileId && transaction.profileId !== profileId || transaction.accountId && ['personal', 'business'].includes(transaction.accountId) && transaction.accountId !== profileId) return [];
      const isBank = bankTransaction(transaction);
      if (!isBank && !options.includeManual) return [];
      const type = transaction.type === 'income' ? 'income' : 'expense';
      const amountCents = transactionCents(transaction), txDate = date(transaction.date);
      const currency = transaction.currency || options.currency || profile.currency || 'EUR';
      if (!txDate || currency !== receipt.currency || type !== receipt.type || amountCents === null || Math.abs(amountCents - receipt.totalCents) > 1) return [];
      const days = Math.abs(new Date(`${txDate}T12:00:00Z`) - new Date(`${receipt.date}T12:00:00Z`)) / 86400000;
      if (days > 7) return [];
      const merchantMatch = sameMerchant(receipt.merchant, transaction.merchantName || transaction.name || transaction.title);
      const score = (amountCents === receipt.totalCents ? 60 : 50) + (days === 0 ? 20 : days <= 3 ? 12 : 5) + (merchantMatch ? 20 : 0);
      return [{ id:String(transaction.id), name:text(transaction.merchantName || transaction.name || transaction.title), date:txDate, amountCents, currency, type, source:text(transaction.source || (isBank ? 'Auto' : 'Ručno')), isBank, merchantMatch, days, score, confidence:score >= 92 ? 'high' : 'review', alreadyAttached:Array.isArray(transaction.receipts) && transaction.receipts.some(item => item.id === receipt.id && receipt.id || item.imageHash === receipt.imageHash && receipt.imageHash) }];
    }).sort((a, b) => b.score - a.score || a.days - b.days).slice(0, 30);
  }
  function attachReceipt(store, profileId, transactionId, input) {
    const active = store?.activeAccount || store?.activeProfile;
    if (!['personal', 'business'].includes(profileId) || active !== profileId) throw new Error('Profil se promijenio. Ponovno otvorite račun u aktivnom profilu.');
    const profile = store?.accounts?.[profileId] || store?.profiles?.[profileId];
    const transaction = profile?.transactions?.find(item => String(item?.id) === String(transactionId));
    if (!transaction || transaction.profileId && transaction.profileId !== profileId) throw new Error('Transakcija nije dostupna u ovom profilu.');
    const review = reviewReceipt(input);
    if (!review.valid || !review.receipt.reviewed) throw new Error('Pregledajte i potvrdite podatke računa prije povezivanja.');
    const receipt = review.receipt;
    const candidate = matchTransactions(receipt, profile, profileId, { includeManual:true, currency:store.settings?.currency || store.settings?.baseCurrency || profile.currency || 'EUR' }).find(item => item.id === String(transactionId));
    if (!candidate) throw new Error('Iznos, valuta, vrsta ili datum transakcije više ne odgovara računu.');
    if (!receipt.id) throw new Error('Nedostaje identifikator računa.');
    const previous = profile.transactions.flatMap(item => (Array.isArray(item?.receipts) ? item.receipts : []).map(attachment => ({ transactionId:String(item.id), attachment }))).find(item => item.attachment.id === receipt.id || receipt.imageHash && item.attachment.imageHash === receipt.imageHash);
    if (previous) {
      if (previous.transactionId === String(transactionId)) return { duplicate:true, receipt:previous.attachment };
      throw new Error('Ovaj je račun već povezan s drugom transakcijom u ovom profilu.');
    }
    const attachment = { ...receipt, profileId, reviewedAt:new Date().toISOString() };
    transaction.receipts = [...(Array.isArray(transaction.receipts) ? transaction.receipts : []), attachment];
    return { duplicate:false, receipt:attachment };
  }
  function createRequestGuard(profileId) {
    let epoch = 0;
    return { invalidate:() => ++epoch, begin:() => ++epoch, current:(token, activeProfile) => token === epoch && activeProfile === profileId };
  }
  return { MAX_LINES, MAX_CENTS, parseMoney, normalizeReceipt, reviewReceipt, bankTransaction, matchTransactions, attachReceipt, createRequestGuard, escapeHtml };
});
