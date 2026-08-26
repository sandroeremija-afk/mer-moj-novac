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
    date: ['date', 'datum', 'bookingdate', 'transactiondate', 'valuedate'],
    description: ['description', 'opis', 'merchant', 'trgovac', 'name', 'naziv', 'details'],
    amount: ['amount', 'iznos', 'value', 'vrijednost'],
    debit: ['debit', 'duguje', 'withdrawal', 'outflow', 'expense', 'trosak'],
    credit: ['credit', 'potrazuje', 'deposit', 'inflow', 'income', 'prihod'],
    type: ['type', 'vrsta', 'transactiontype'],
    category: ['category', 'kategorija']
  };

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

  function columnMap(headers) {
    const normalized = headers.map(normalizeHeader);
    const result = {};
    Object.entries(aliases).forEach(([key, names]) => { result[key] = normalized.findIndex(header => names.includes(header)); });
    return result;
  }

  function numberValue(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    let text = String(value ?? '').trim().replace(/[^0-9,.+\-]/g, '');
    if (!text) return NaN;
    const comma = text.lastIndexOf(','), dot = text.lastIndexOf('.');
    if (comma > dot) text = text.replaceAll('.', '').replace(',', '.');
    else if (dot > comma) text = text.replaceAll(',', '');
    return Number(text);
  }

  function normalizeDate(value, dateFormat = 'locale') {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
    if (typeof value === 'number' && value > 0) {
      const date = new Date(Date.UTC(1899, 11, 30) + Math.round(value * 86400000));
      return Number.isNaN(date.getTime()) || date.getUTCFullYear() < 1900 || date.getUTCFullYear() > 9999 ? null : date.toISOString().slice(0, 10);
    }
    const text = String(value ?? '').trim().replace(/\.$/, '');
    let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (match) return validIso(Number(match[1]), Number(match[2]), Number(match[3]));
    match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
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
    if (['income', 'prihod', 'credit', 'uplata'].includes(normalized)) return 'income';
    if (['expense', 'trosak', 'debit', 'isplata'].includes(normalized)) return 'expense';
    return null;
  }

  function fingerprint(transaction) {
    return MerCore.stableTransactionHash([
      String(transaction.date || '').slice(0, 10),
      transaction.type === 'income' ? 'income' : 'expense',
      Number(transaction.amount || 0).toFixed(2),
      String(transaction.name || '').trim().toLocaleLowerCase('en')
    ]);
  }

  function parseRows(rows, profile, options = {}) {
    if (!Array.isArray(rows) || rows.length < 2) return { reviewRows: [], invalidRows: [{ row: 1, reason: 'empty' }], duplicates: 0, totalRows: 0 };
    const map = columnMap(rows[0]);
    if (map.date < 0 || map.description < 0 || (map.amount < 0 && map.debit < 0 && map.credit < 0)) {
      return { reviewRows: [], invalidRows: [{ row: 1, reason: 'missing-columns' }], duplicates: 0, totalRows: Math.max(0, rows.length - 1) };
    }
    const known = new Set((profile?.transactions || []).map(transaction => transaction.importHash || fingerprint(transaction)));
    const reviewRows = [], invalidRows = [];
    let duplicates = 0;
    rows.slice(1, MAX_IMPORT_ROWS + 1).forEach((row, offset) => {
      const rowNumber = offset + 2;
      if (!Array.isArray(row) || row.every(cell => String(cell ?? '').trim() === '')) return;
      const date = normalizeDate(row[map.date], options.dateFormat);
      const name = String(row[map.description] ?? '').trim().slice(0, 100);
      const debit = map.debit >= 0 ? numberValue(row[map.debit]) : NaN;
      const credit = map.credit >= 0 ? numberValue(row[map.credit]) : NaN;
      const signedAmount = map.amount >= 0 ? numberValue(row[map.amount]) : Number.isFinite(credit) && credit !== 0 ? Math.abs(credit) : Number.isFinite(debit) && debit !== 0 ? -Math.abs(debit) : NaN;
      const type = map.type >= 0 ? explicitType(row[map.type]) : Number.isFinite(credit) && credit !== 0 ? 'income' : Number.isFinite(debit) && debit !== 0 ? 'expense' : signedAmount >= 0 ? 'income' : 'expense';
      const amount = Math.abs(signedAmount);
      if (!date || !name || !Number.isFinite(amount) || amount <= 0 || !type) { invalidRows.push({ row: rowNumber, reason: !date ? 'invalid-date' : !name ? 'missing-description' : 'invalid-amount' }); return; }
      const suggested = MerCore.autoCategorizeBankTransaction({ description: name, amount: type === 'income' ? amount : -amount, creditDebitIndicator: type === 'income' ? 'CRDT' : 'DBIT' }, profile);
      const available = type === 'income' ? profile?.incomeCategories || [] : profile?.categories || [];
      const suppliedCategory = map.category >= 0 ? String(row[map.category] || '').trim().toLocaleLowerCase('en') : '';
      const matched = available.find(category => [category.id, category.name, category.nameKey].filter(Boolean).some(value => String(value).toLocaleLowerCase('en') === suppliedCategory));
      const transaction = { rowNumber, type, name, amount, date, category: matched?.id || suggested.category, categoryConfidence: matched ? 'import' : suggested.confidence, categorizationRule: matched ? 'provided' : suggested.rule, needsReview: !matched && suggested.confidence === 'fallback', excluded: false };
      transaction.importHash = fingerprint(transaction);
      if (known.has(transaction.importHash)) { duplicates += 1; return; }
      known.add(transaction.importHash);
      reviewRows.push(transaction);
    });
    if (rows.length - 1 > MAX_IMPORT_ROWS) invalidRows.push({ row:MAX_IMPORT_ROWS + 2, reason:'row-limit' });
    return { reviewRows, invalidRows, duplicates, totalRows: Math.min(MAX_IMPORT_ROWS, Math.max(0, rows.length - 1)) };
  }

  function parseCsvImport(text, profile, options = {}) {
    const parsed = parseCsv(text, options.delimiter);
    if (parsed.tooLarge) return { reviewRows:[], invalidRows:[{row:1,reason:'file-too-large'}], duplicates:0, totalRows:0, delimiter:parsed.delimiter };
    const result = parseRows(parsed.rows, profile, options);
    if (parsed.unterminatedQuote) result.invalidRows.push({ row: parsed.rows.length, reason: 'unterminated-quote' });
    return { ...result, delimiter: parsed.delimiter };
  }

  function commitImport(profile, reviewRows, sourceName = 'import.csv') {
    if (!profile || typeof profile !== 'object') return { imported:[], duplicates:0, invalid: Array.isArray(reviewRows) ? reviewRows.length : 0 };
    profile.transactions = Array.isArray(profile.transactions) ? profile.transactions : [];
    const imported = [];
    const known = new Set(profile.transactions.map(transaction => transaction.importHash || fingerprint(transaction)));
    let duplicates = 0, invalid = 0;
    const safeSource=String(sourceName||'import.csv').replace(/[\r\n]/g,' ').trim().slice(0,80)||'import.csv';
    (Array.isArray(reviewRows) ? reviewRows.slice(0,MAX_IMPORT_ROWS) : []).forEach(row => {
      if (!row || typeof row !== 'object' || row.excluded) return;
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
      const hash = fingerprint(normalized);
      if (known.has(hash)) { duplicates += 1; return; }
      known.add(hash);
      const currency=/^[A-Z]{3}$/.test(String(row.currency||'').toUpperCase())?String(row.currency).toUpperCase():'EUR';
      imported.push({ id: `import-${hash}`, type, name, amount, category, date: `${date}T12:00:00`, source: `Import: ${safeSource}`, sourceType: 'import', importHash: hash, needsReview: Boolean(row.needsReview)||category!==row.category, categoryConfidence: category===row.category?row.categoryConfidence:suggested.confidence, categorizationRule: category===row.category?(row.categorizationRule || null):suggested.rule, iban:String(row.iban||'').slice(0,34), bic:String(row.bic||'').slice(0,11), merchantName:String(row.merchantName||name).slice(0,100), timestamp:validTimestamp(row.timestamp,date), currency });
    });
    if (imported.length) profile.transactions.unshift(...imported);
    return { imported, duplicates, invalid };
  }

  function createReviewStage(result, fileName, profileId) {
    const source = result && typeof result === 'object' ? result : {};
    return {
      ...source,
      reviewRows:Array.isArray(source.reviewRows) ? source.reviewRows : [],
      invalidRows:Array.isArray(source.invalidRows) ? source.invalidRows : [],
      duplicates:Math.max(0, Number(source.duplicates) || 0),
      fileName:String(fileName || 'import.csv').replace(/[\r\n]/g, ' ').trim().slice(0, 80) || 'import.csv',
      profileId:String(profileId || '')
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

  function commitReviewStage(profile, stage, profileId) {
    if (!stageBelongsToProfile(stage, profileId)) return { imported:[], duplicates:0, invalid:0, error:'profile-changed' };
    return commitImport(profile, stage.reviewRows, stage.fileName);
  }

  function validTimestamp(value, fallbackDate) {
    const text=String(value||'');
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)&&normalizeDate(text.slice(0,10),'iso')?text.slice(0,35):`${fallbackDate}T12:00:00`;
  }

  return { MAX_IMPORT_ROWS, MAX_TEXT_LENGTH, parseCsv, detectDelimiter, columnMap, normalizeDate, numberValue, fingerprint, parseRows, parseCsvImport, commitImport, createReviewStage, stageBelongsToProfile, applyBulkOverride, undoBulkOverride, commitReviewStage };
});
