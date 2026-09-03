(function exposeMerImport(root, factory) {
  const core = typeof module === 'object' && module.exports ? require('./core.js') : root.MerCore;
  const api = factory(core);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerImport = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerImport(MerCore) {
  const MAX_IMPORT_ROWS = 10000;
  const MAX_TEXT_LENGTH = 10 * 1024 * 1024;
  const normalizeHeader = value => String(value || '').trim().toLocaleLowerCase('en').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const aliases = {
    date: ['date', 'datum', 'bookingdate', 'bookingdatetime', 'transactiondate', 'valuedate', 'datumknjigovodstva', 'buchungsdatum', 'starteddate'],
    description: ['description', 'opis', 'merchant', 'trgovac', 'name', 'naziv', 'details', 'nazivopis', 'opisprometa', 'opisprometaprimatelj', 'opisplacanja', 'partnertext', 'creditorname', 'debtorname', 'remittanceinformationunstructured'],
    amount: ['amount', 'iznos', 'value', 'vrijednost', 'betrag', 'iznosnateretukorist', 'transactionamount', 'instructedamount'],
    debit: ['debit', 'duguje', 'withdrawal', 'outflow', 'expense', 'trosak', 'iznosnateret', 'teret'],
    credit: ['credit', 'potrazuje', 'deposit', 'inflow', 'income', 'prihod', 'iznosukorist', 'korist'],
    type: ['type', 'vrsta', 'transactiontype', 'creditdebitindicator'],
    category: ['category', 'kategorija'],
    currency: ['currency', 'valuta', 'wahrung', 'ccy'],
    iban: ['iban', 'brojracuna', 'accountnumber', 'racun'],
    bic: ['bic', 'bicfi', 'swift'],
    fee: ['fee', 'naknada'],
    status: ['state', 'status', 'transactionstatus'],
    externalId: ['transactionid', 'id', 'entryreference', 'referenca'],
    reference: ['modelpozivnabroj', 'pozivnabroj', 'paymentreference', 'reference']
  };
  const BANK_SCHEMAS = Object.freeze([
    { id:'zaba', institution:'Zagrebačka banka (ZABA)', headers:['datumknjigovodstva','opisprometaprimatelj'] },
    { id:'pbz', institution:'Privredna banka Zagreb (PBZ)', headers:['datum','nazivopis'], any:['iznosnateretukorist','iznosnateret','iznosukorist'] },
    { id:'erste', institution:'Erste Bank (George)', headers:['buchungsdatum','partnertext','betrag'] },
    { id:'otp-hpb', institution:'OTP / HPB', headers:['opisplacanja','modelpozivnabroj','iznos'] },
    { id:'revolut-wise', institution:'Revolut / Wise', headers:['starteddate','description','amount','currency'], any:['state','fee'] }
  ]);

  function parseCsv(text, delimiter) {
    const source = String(text ?? '').replace(/^\uFEFF/, '');
    if (source.length > MAX_TEXT_LENGTH) return { rows: [], delimiter: delimiter || ',', unterminatedQuote: false, tooLarge: true };
    const detected = delimiter || detectDelimiter(source);
    const rows = [];
    let row = [], field = '', quoted = false;
    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (quoted) {
        if (character === '"' && source[index + 1] === '"') { field += '"'; index += 1; }
        else if (character === '"') quoted = false;
        else field += character;
      } else if (character === '"') quoted = true;
      else if (character === detected) { row.push(field); field = ''; }
      else if (character === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
      else field += character;
    }
    row.push(field.replace(/\r$/, ''));
    if (row.some(cell => String(cell).trim()) || rows.length === 0) rows.push(row);
    return { rows, delimiter: detected, unterminatedQuote: quoted };
  }

  function detectDelimiter(text) {
    const line = String(text).split(/\r?\n/, 1)[0] || '';
    const counts = [',', ';', '\t'].map(delimiter => ({ delimiter, count: line.split(delimiter).length - 1 }));
    return counts.sort((a, b) => b.count - a.count)[0].delimiter;
  }

  function detectBankSchema(headers, options = {}) {
    const normalized = new Set((Array.isArray(headers) ? headers : []).map(normalizeHeader).filter(Boolean));
    const sourceName = String(options.sourceName || options.fileName || '').toLocaleLowerCase('en');
    const matched = BANK_SCHEMAS.find(schema => schema.headers.every(header => normalized.has(header)) && (!schema.any || schema.any.some(header => normalized.has(header))));
    if (!matched) return { id:'generic', institution:'Generički bankovni izvoz', confidence:'fallback' };
    if (matched.id === 'revolut-wise') {
      const wise = /wise|transferwise/.test(sourceName);
      return { id:wise ? 'wise' : 'revolut', institution:wise ? 'Wise' : 'Revolut', confidence:'headers' };
    }
    if (matched.id === 'otp-hpb') {
      const hpb = /\bhpb\b|postansk/.test(sourceName);
      return { id:hpb ? 'hpb' : 'otp', institution:hpb ? 'Hrvatska poštanska banka (HPB)' : 'OTP banka Hrvatska', confidence:sourceName ? 'headers-and-filename' : 'headers' };
    }
    return { id:matched.id, institution:matched.institution, confidence:'headers' };
  }

  function columnMap(headers) {
    const normalized = headers.map(normalizeHeader);
    const result = {};
    Object.entries(aliases).forEach(([key, names]) => { result[key] = normalized.findIndex(header => names.includes(header)); });
    return result;
  }

  function numberValue(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    const source = String(value ?? '').trim();
    const negative = /^\(.*\)$/.test(source) || /-$/.test(source);
    let text = source.replace(/[^0-9,.+\-]/g, '').replace(/-$/, '');
    if (!text) return NaN;
    const comma = text.lastIndexOf(','), dot = text.lastIndexOf('.');
    if (comma > dot) text = text.replaceAll('.', '').replace(',', '.');
    else if (dot > comma) text = text.replaceAll(',', '');
    const amount = Number(text);
    return negative && Number.isFinite(amount) ? -Math.abs(amount) : amount;
  }

  function normalizeDate(value, dateFormat = 'locale') {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return validIso(value.getFullYear(), value.getMonth() + 1, value.getDate());
    if (typeof value === 'number' && value > 0) {
      const date = new Date(Date.UTC(1899, 11, 30) + Math.round(value * 86400000));
      return Number.isNaN(date.getTime()) || date.getUTCFullYear() < 1900 || date.getUTCFullYear() > 9999 ? null : date.toISOString().slice(0, 10);
    }
    const text = String(value ?? '').trim().replace(/\.$/, '');
    let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/);
    if (match) return validIso(Number(match[1]), Number(match[2]), Number(match[3]));
    match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:[T\s].*)?$/);
    if (match) {
      const first = Number(match[1]), second = Number(match[2]), year = Number(match[3]);
      return dateFormat === 'us' ? validIso(year, first, second) : validIso(year, second, first);
    }
    return null;
  }

  function validIso(year, month, day) {
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function explicitType(value) {
    const normalized = normalizeHeader(value);
    if (['income', 'prihod', 'credit', 'uplata', 'crdt', 'c'].includes(normalized)) return 'income';
    if (['expense', 'trosak', 'debit', 'isplata', 'dbit', 'd'].includes(normalized)) return 'expense';
    return null;
  }

  function canonicalExternalId(transaction) {
    const direct = String(transaction?.externalId || transaction?.transactionId || '').trim();
    if (direct) return direct;
    const bankId = String(transaction?.bankTransactionId || '').trim();
    const prefix = `${String(transaction?.provider || '').trim()}:${String(transaction?.accountId || '').trim()}:`;
    if (bankId && prefix !== '::' && bankId.startsWith(prefix)) return bankId.slice(prefix.length);
    return '';
  }

  function fingerprint(transaction) {
    const externalId = canonicalExternalId(transaction);
    if (externalId) {
      const accountScope = String(transaction?.iban || transaction?.accountId || '').replace(/\s+/g, '').toUpperCase();
      return MerCore.stableTransactionHash(['external', accountScope, externalId]);
    }
    return MerCore.stableTransactionHash([
      String(transaction.date || '').slice(0, 10),
      transaction.type === 'income' ? 'income' : 'expense',
      Number(transaction.amount || 0).toFixed(2),
      String(transaction.name || '').trim().toLocaleLowerCase('en')
    ]);
  }

  function knownFingerprints(transactions) {
    const known = new Set();
    (Array.isArray(transactions) ? transactions : []).forEach(transaction => {
      if (transaction?.importHash) known.add(String(transaction.importHash));
      known.add(fingerprint(transaction));
    });
    return known;
  }

  function occurrenceFingerprint(transaction, occurrences, preserveMultiplicity) {
    const base = fingerprint(transaction);
    if (!preserveMultiplicity || canonicalExternalId(transaction)) return base;
    const occurrence = (occurrences.get(base) || 0) + 1;
    occurrences.set(base, occurrence);
    return occurrence === 1 ? base : MerCore.stableTransactionHash(['occurrence', base, occurrence]);
  }

  function profileIdentifier(profile, options = {}) {
    return String(options.profileId || profile?.profileId || profile?.id || '').trim().slice(0, 80);
  }

  function currencyValue(value, fallback = 'EUR') {
    const currency = String(value || fallback || 'EUR').trim().toUpperCase();
    return /^[A-Z]{3}$/.test(currency) ? currency : 'EUR';
  }

  function createReviewTransaction(values, profile, options = {}) {
    const date = normalizeDate(values.date, options.dateFormat);
    const rawDescription = String(values.rawDescription ?? values.name ?? '').trim().slice(0, 500);
    const name = String(values.title || rawDescription).trim().slice(0, 100);
    const type = values.type === 'income' ? 'income' : values.type === 'expense' ? 'expense' : null;
    const amount = Math.abs(Number(values.amount));
    if (!date || !name || !Number.isFinite(amount) || amount <= 0 || !type) {
      return { transaction:null, reason:!date ? 'invalid-date' : !name ? 'missing-description' : 'invalid-amount' };
    }
    const suggested = MerCore.autoCategorizeBankTransaction({
      description:rawDescription,
      merchantName:values.merchantName || name,
      amount:type === 'income' ? amount : -amount,
      creditDebitIndicator:type === 'income' ? 'CRDT' : 'DBIT'
    }, profile);
    const available = type === 'income' ? profile?.incomeCategories || [] : profile?.categories || [];
    const suppliedCategory = String(values.category || values.categoryId || '').trim().toLocaleLowerCase('en');
    const matched = available.find(category => [category.id, category.name, category.nameKey].filter(Boolean).some(value => String(value).toLocaleLowerCase('en') === suppliedCategory));
    const category = matched?.id || suggested.category;
    const externalId = String(values.externalId || values.bankTransactionId || '').trim().slice(0, 160);
    const transaction = {
      rowNumber:Number(values.rowNumber) || 1,
      id:externalId || '',
      externalId:externalId || null,
      bankTransactionId:externalId || null,
      type,
      name,
      title:name,
      rawDescription,
      amount,
      date,
      timestamp:validTimestamp(values.timestamp, date),
      currency:currencyValue(values.currency, options.currency || profile?.currency),
      category,
      categoryId:category,
      profileId:profileIdentifier(profile, options),
      categoryConfidence:matched ? 'import' : suggested.confidence,
      categorizationRule:matched ? 'provided' : suggested.rule,
      needsReview:!matched && suggested.confidence === 'fallback',
      excluded:false,
      iban:String(values.iban || '').replace(/\s+/g, '').slice(0, 34),
      bic:String(values.bic || '').replace(/\s+/g, '').slice(0, 11).toUpperCase(),
      merchantName:String(values.merchantName || name).trim().slice(0, 100),
      fee:Number.isFinite(Number(values.fee)) ? Math.abs(Number(values.fee)) : 0,
      reference:String(values.reference || '').trim().slice(0, 140),
      bankSchema:String(options.schema?.id || options.bankSchema || 'generic')
    };
    transaction.importHash = fingerprint(transaction);
    if (!transaction.id) transaction.id = `import-${transaction.importHash}`;
    return { transaction, reason:null };
  }

  function parseRows(rows, profile, options = {}) {
    if (!Array.isArray(rows) || rows.length < 2) return { reviewRows: [], invalidRows: [{ row: 1, reason: 'empty' }], duplicates: 0, totalRows: 0 };
    const schema = options.schema || detectBankSchema(rows[0], options);
    const parseOptions = { ...options, schema };
    const map = columnMap(rows[0]);
    if (map.date < 0 || map.description < 0 || (map.amount < 0 && map.debit < 0 && map.credit < 0)) {
      return { reviewRows: [], invalidRows: [{ row: 1, reason: 'missing-columns' }], duplicates: 0, totalRows: Math.max(0, rows.length - 1) };
    }
    const known = knownFingerprints(profile?.transactions);
    const occurrences = new Map();
    const preserveMultiplicity = schema.id !== 'generic';
    const reviewRows = [], invalidRows = [];
    let duplicates = 0;
    rows.slice(1, MAX_IMPORT_ROWS + 1).forEach((row, offset) => {
      const rowNumber = offset + 2;
      if (!Array.isArray(row) || row.every(cell => String(cell ?? '').trim() === '')) return;
      const status = map.status >= 0 ? normalizeHeader(row[map.status]) : '';
      if (['pending','reverted','reversed','failed','declined','cancelled','canceled'].includes(status)) { invalidRows.push({ row:rowNumber, reason:'non-booked-state' }); return; }
      const debit = map.debit >= 0 ? numberValue(row[map.debit]) : NaN;
      const credit = map.credit >= 0 ? numberValue(row[map.credit]) : NaN;
      const signedAmount = map.amount >= 0 ? numberValue(row[map.amount]) : Number.isFinite(credit) && credit !== 0 ? Math.abs(credit) : Number.isFinite(debit) && debit !== 0 ? -Math.abs(debit) : NaN;
      const type = map.type >= 0 && explicitType(row[map.type]) ? explicitType(row[map.type]) : Number.isFinite(credit) && credit !== 0 ? 'income' : Number.isFinite(debit) && debit !== 0 ? 'expense' : signedAmount >= 0 ? 'income' : 'expense';
      const created = createReviewTransaction({
        rowNumber,
        date:row[map.date],
        timestamp:row[map.date],
        rawDescription:row[map.description],
        amount:signedAmount,
        type,
        category:map.category >= 0 ? row[map.category] : '',
        currency:map.currency >= 0 ? row[map.currency] : '',
        iban:map.iban >= 0 ? row[map.iban] : '',
        bic:map.bic >= 0 ? row[map.bic] : '',
        fee:map.fee >= 0 ? numberValue(row[map.fee]) : 0,
        externalId:map.externalId >= 0 ? row[map.externalId] : '',
        reference:map.reference >= 0 ? row[map.reference] : ''
      }, profile, parseOptions);
      if (!created.transaction) { invalidRows.push({ row:rowNumber, reason:created.reason }); return; }
      const transaction = created.transaction;
      transaction.importHash = occurrenceFingerprint(transaction, occurrences, preserveMultiplicity);
      if (known.has(transaction.importHash)) { duplicates += 1; return; }
      known.add(transaction.importHash);
      reviewRows.push(transaction);
    });
    if (rows.length - 1 > MAX_IMPORT_ROWS) invalidRows.push({ row:MAX_IMPORT_ROWS + 2, reason:'row-limit' });
    return { reviewRows, invalidRows, duplicates, totalRows:Math.min(MAX_IMPORT_ROWS, Math.max(0, rows.length - 1)), schema:schema.id, institution:schema.institution, schemaConfidence:schema.confidence };
  }

  function parseCsvImport(text, profile, options = {}) {
    const parsed = parseCsv(text, options.delimiter);
    if (parsed.tooLarge) return { reviewRows:[], invalidRows:[{row:1,reason:'file-too-large'}], duplicates:0, totalRows:0, delimiter:parsed.delimiter };
    const schema = detectBankSchema(parsed.rows[0] || [], options);
    const result = parseRows(parsed.rows, profile, { ...options, schema });
    if (parsed.unterminatedQuote) result.invalidRows.push({ row: parsed.rows.length, reason: 'unterminated-quote' });
    return { ...result, delimiter:parsed.delimiter, format:'CSV', schema:schema.id, institution:schema.institution, schemaConfidence:schema.confidence };
  }

  function openBankingEntries(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];
    const candidates = [
      payload.transactions?.booked,
      payload.transactions,
      payload.booked,
      payload.data?.transactions?.booked,
      payload.data?.transactions,
      payload.data?.booked
    ];
    return candidates.find(Array.isArray) || [];
  }

  function textValue(value) {
    if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(' ');
    if (value && typeof value === 'object') return String(value.content || value.value || value.name || '').trim();
    return String(value ?? '').trim();
  }

  function parseOpenBankingImport(input, profile, options = {}) {
    let payload = input;
    if (typeof input === 'string') {
      if (input.length > MAX_TEXT_LENGTH) return { reviewRows:[], invalidRows:[{row:1,reason:'file-too-large'}], duplicates:0, totalRows:0, format:'PSD2-JSON', schema:'open-banking-psd2' };
      try { payload = JSON.parse(input.replace(/^\uFEFF/, '')); }
      catch { return { reviewRows:[], invalidRows:[{row:1,reason:'invalid-json'}], duplicates:0, totalRows:0, format:'PSD2-JSON', schema:'open-banking-psd2' }; }
    }
    const entries = openBankingEntries(payload);
    if (!entries.length) return { reviewRows:[], invalidRows:[{row:1,reason:'empty'}], duplicates:0, totalRows:0, format:'PSD2-JSON', schema:'open-banking-psd2' };
    const known = knownFingerprints(profile?.transactions);
    const occurrences = new Map();
    const account = options.account || payload?.account || payload?.data?.account || {};
    const schema = { id:'open-banking-psd2', institution:String(options.institution || payload?.institution || 'Open Banking PSD2'), confidence:'payload' };
    const reviewRows = [], invalidRows = [];
    let duplicates = 0;
    entries.slice(0, MAX_IMPORT_ROWS).forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') { invalidRows.push({ row:index + 1, reason:'invalid-row' }); return; }
      const status = normalizeHeader(entry.bookingStatus || entry.status || entry.state);
      if (['pending','reverted','reversed','failed','declined','cancelled','canceled'].includes(status)) { invalidRows.push({ row:index + 1, reason:'non-booked-state' }); return; }
      const amountContainer = entry.transactionAmount ?? entry.instructedAmount ?? entry.amount;
      const signedAmount = numberValue(amountContainer && typeof amountContainer === 'object' ? amountContainer.amount ?? amountContainer.value : amountContainer);
      const indicatedType = explicitType(entry.creditDebitIndicator || entry.credit_debit_indicator || entry.type || entry.status);
      const type = indicatedType || (signedAmount >= 0 ? 'income' : 'expense');
      const counterparty = type === 'income' ? entry.debtorName || entry.creditorName : entry.creditorName || entry.debtorName;
      const merchant = textValue(entry.merchantName || counterparty);
      const remittance = textValue(entry.remittanceInformationUnstructured || entry.remittanceInformationUnstructuredArray || entry.additionalInformation || entry.description);
      const description = [merchant, remittance].filter((value, partIndex, parts) => value && parts.indexOf(value) === partIndex).join(' · ') || 'Bank transaction';
      const created = createReviewTransaction({
        rowNumber:index + 1,
        externalId:entry.transactionId || entry.id || entry.entryReference || entry.endToEndId,
        date:entry.bookingDateTime || entry.bookingDate || entry.valueDateTime || entry.valueDate || entry.date,
        timestamp:entry.bookingDateTime || entry.valueDateTime || entry.timestamp,
        rawDescription:description,
        merchantName:merchant || description,
        amount:signedAmount,
        type,
        currency:amountContainer?.currency || entry.currency || account.currency,
        iban:entry.iban || account.iban || entry.debtorAccount?.iban || entry.creditorAccount?.iban,
        bic:entry.bic || account.bic || entry.debtorAgent?.bic || entry.creditorAgent?.bic,
        fee:numberValue(entry.fee ?? entry.charges?.[0]?.amount?.amount ?? 0),
        reference:textValue(entry.endToEndId || entry.remittanceInformationStructured?.reference || entry.paymentReference)
      }, profile, { ...options, schema });
      if (!created.transaction) { invalidRows.push({ row:index + 1, reason:created.reason }); return; }
      created.transaction.importHash = occurrenceFingerprint(created.transaction, occurrences, true);
      if (known.has(created.transaction.importHash)) { duplicates += 1; return; }
      known.add(created.transaction.importHash);
      reviewRows.push(created.transaction);
    });
    if (entries.length > MAX_IMPORT_ROWS) invalidRows.push({ row:MAX_IMPORT_ROWS + 1, reason:'row-limit' });
    return { reviewRows, invalidRows, duplicates, totalRows:Math.min(entries.length, MAX_IMPORT_ROWS), format:'PSD2-JSON', schema:schema.id, institution:schema.institution, schemaConfidence:schema.confidence };
  }

  function parseBankImport(input, profile, options = {}) {
    if (input && typeof input === 'object') return parseOpenBankingImport(input, profile, options);
    const source = String(input ?? '').replace(/^\uFEFF/, '').trimStart();
    if (source.startsWith('{') || source.startsWith('[') || /\.json$/i.test(String(options.sourceName || options.fileName || ''))) return parseOpenBankingImport(source, profile, options);
    return parseCsvImport(source, profile, options);
  }

  function commitImport(profile, reviewRows, sourceName = 'import.csv', referenceValue = new Date()) {
    if (!profile || typeof profile !== 'object') return { imported:[], duplicates:0, invalid: Array.isArray(reviewRows) ? reviewRows.length : 0 };
    profile.transactions = Array.isArray(profile.transactions) ? profile.transactions : [];
    const imported = [];
    const known = knownFingerprints(profile.transactions);
    const targetProfileId = String(profile.profileId || profile.id || '').trim();
    let duplicates = 0, invalid = 0;
    const safeSource=String(sourceName||'import.csv').replace(/[\r\n]/g,' ').trim().slice(0,80)||'import.csv';
    (Array.isArray(reviewRows) ? reviewRows.slice(0,MAX_IMPORT_ROWS) : []).forEach(row => {
      if (!row || typeof row !== 'object' || row.excluded) return;
      if (targetProfileId && row.profileId && String(row.profileId) !== targetProfileId) { invalid += 1; return; }
      const type=row.type==='income'?'income':row.type==='expense'?'expense':null;
      const date=normalizeDate(row.date,'iso');
      const name=String(row.name||'').trim().slice(0,100);
      const amount=Math.abs(Number(row.amount));
      if(!type||!date||!name||!Number.isFinite(amount)||amount<=0){invalid+=1;return;}
      const available=type==='income'?(profile.incomeCategories||[]):(profile.categories||[]);
      const suggested=MerCore.autoCategorizeBankTransaction({description:name,amount:type==='income'?amount:-amount,creditDebitIndicator:type==='income'?'CRDT':'DBIT'},profile);
      const category=available.some(item=>item?.id===row.category)?row.category:suggested.category||available[0]?.id||null;
      if(!category){invalid+=1;return;}
      const normalized={...row,type,date,name,amount,category};
      const suppliedHash = String(row.importHash || '');
      const hash = /^tx-[0-9a-f]{8}$/.test(suppliedHash) ? suppliedHash : fingerprint(normalized);
      if (known.has(hash)) { duplicates += 1; return; }
      known.add(hash);
      const currency=/^[A-Z]{3}$/.test(String(row.currency||'').toUpperCase())?String(row.currency).toUpperCase():'EUR';
      imported.push(MerCore.updateTransactionSchedule({ id:`import-${hash}`, externalId:row.externalId || null, bankTransactionId:row.bankTransactionId || null, type, name, title:String(row.title || name).slice(0,100), rawDescription:String(row.rawDescription || name).slice(0,500), amount, category, categoryId:category, profileId:String(row.profileId || '').slice(0,80), date:`${date}T12:00:00`, source:`Import: ${safeSource}`, sourceType:'import', importHash:hash, needsReview:Boolean(row.needsReview)||category!==row.category, categoryConfidence:category===row.category?row.categoryConfidence:suggested.confidence, categorizationRule:category===row.category?(row.categorizationRule || null):suggested.rule, iban:String(row.iban||'').slice(0,34), bic:String(row.bic||'').slice(0,11), merchantName:String(row.merchantName||name).slice(0,100), timestamp:validTimestamp(row.timestamp,date), currency, fee:Number.isFinite(Number(row.fee))?Math.abs(Number(row.fee)):0, reference:String(row.reference||'').slice(0,140), bankSchema:String(row.bankSchema||'generic') }, referenceValue));
    });
    if (imported.length) profile.transactions.unshift(...imported);
    return { imported, duplicates, invalid };
  }

  function createReviewStage(result, fileName, profileId) {
    const source = result && typeof result === 'object' ? result : {};
    const normalizedProfileId = String(profileId || '');
    return {
      ...source,
      reviewRows:Array.isArray(source.reviewRows) ? source.reviewRows.map(row => ({ ...row, profileId:normalizedProfileId || String(row?.profileId || '') })) : [],
      invalidRows:Array.isArray(source.invalidRows) ? source.invalidRows : [],
      duplicates:Math.max(0, Number(source.duplicates) || 0),
      fileName:String(fileName || 'import.csv').replace(/[\r\n]/g, ' ').trim().slice(0, 80) || 'import.csv',
      profileId:normalizedProfileId
    };
  }

  function stageBelongsToProfile(stage, profileId) {
    return Boolean(stage && typeof stage === 'object' && stage.profileId && stage.profileId === String(profileId || ''));
  }

  function applyBulkOverride(stage, profileId, override = {}) {
    if (!stageBelongsToProfile(stage, profileId)) return { valid:false, reason:'profile-changed', count:0, snapshot:[] };
    const type = override.type === 'income' ? 'income' : override.type === 'expense' ? 'expense' : null;
    const category = String(override.category || '');
    if (!type || !category) return { valid:false, reason:'invalid-override', count:0, snapshot:[] };
    const snapshot = [];
    stage.reviewRows.forEach((row, index) => {
      if (!row || row.excluded) return;
      snapshot.push({
        index,
        type:row.type,
        category:row.category,
        needsReview:Boolean(row.needsReview),
        categoryConfidence:row.categoryConfidence,
        categorizationRule:row.categorizationRule
      });
      row.type = type;
      row.category = category;
      row.needsReview = false;
      row.categoryConfidence = 'manual-review';
      row.categorizationRule = 'bulk-review';
    });
    return { valid:true, reason:null, count:snapshot.length, snapshot };
  }

  function undoBulkOverride(stage, profileId, snapshot) {
    if (!stageBelongsToProfile(stage, profileId)) return { valid:false, reason:'profile-changed', count:0 };
    let count = 0;
    (Array.isArray(snapshot) ? snapshot : []).forEach(previous => {
      const row = stage.reviewRows[Number(previous?.index)];
      if (!row) return;
      row.type = previous.type;
      row.category = previous.category;
      row.needsReview = Boolean(previous.needsReview);
      row.categoryConfidence = previous.categoryConfidence;
      row.categorizationRule = previous.categorizationRule;
      count += 1;
    });
    return { valid:true, reason:null, count };
  }

  function commitReviewStage(profile, stage, profileId, referenceValue = new Date()) {
    const expectedProfileId = String(profileId || '');
    const targetProfileId = String(profile?.profileId || profile?.id || '');
    const rowsMatch = Array.isArray(stage?.reviewRows) && stage.reviewRows.every(row => !row?.profileId || String(row.profileId) === expectedProfileId);
    if (!stageBelongsToProfile(stage, expectedProfileId) || (targetProfileId && targetProfileId !== expectedProfileId) || !rowsMatch) return { imported:[], duplicates:0, invalid:0, error:'profile-changed' };
    return commitImport(profile, stage.reviewRows, stage.fileName, referenceValue);
  }

  function validTimestamp(value, fallbackDate) {
    const text=String(value||'');
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)&&normalizeDate(text.slice(0,10),'iso')?text.slice(0,35):`${fallbackDate}T12:00:00`;
  }

  return { MAX_IMPORT_ROWS, MAX_TEXT_LENGTH, BANK_SCHEMAS, parseCsv, detectDelimiter, detectBankSchema, columnMap, normalizeDate, numberValue, fingerprint, createReviewTransaction, parseRows, parseCsvImport, parseOpenBankingImport, parseBankImport, commitImport, createReviewStage, stageBelongsToProfile, applyBulkOverride, undoBulkOverride, commitReviewStage };
});
