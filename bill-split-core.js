(function exposeBillSplits(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerBillSplits = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createBillSplitCore() {
  'use strict';
  const MAX_CENTS = 99999999999;
  const fail = code => { throw Object.assign(new Error(code), {code}); };
  const clone = value => JSON.parse(JSON.stringify(value));
  const text = value => String(value ?? '').trim();
  const cleanId = value => typeof value === 'string' && /^[a-z0-9][a-z0-9:_-]{0,119}$/i.test(value);
  const newId = () => globalThis.crypto?.randomUUID?.() || `split-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  function cents(value, allowZero = false) {
    const raw = text(value);
    if (!/^\d{1,10}(?:[.,]\d{1,2})?$/.test(raw)) fail('INVALID_AMOUNT');
    const [whole, fraction = ''] = raw.replace(',', '.').split('.');
    const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    if (!Number.isSafeInteger(amount) || amount < (allowZero ? 0 : 1) || amount > MAX_CENTS) fail('INVALID_AMOUNT');
    return amount;
  }
  function assertCents(amount, allowZero = false) {
    if (!Number.isSafeInteger(amount) || amount < (allowZero ? 0 : 1) || amount > MAX_CENTS) fail('INVALID_AMOUNT');
    return amount;
  }
  function context(profile, scope) {
    if (!profile || !scope || !cleanId(scope.userId) || !['personal', 'business'].includes(scope.profileId) || (profile.profileId && profile.profileId !== scope.profileId)) fail('ACCESS_DENIED');
    return scope;
  }
  function transaction(profile, scope, transactionId) {
    context(profile, scope);
    const tx = (profile.transactions || []).find(item => item?.id === transactionId && (!item.profileId || item.profileId === scope.profileId));
    if (!tx) fail('TRANSACTION_MISSING');
    if ((tx.type || 'expense') !== 'expense' || ['cancelled', 'draft'].includes(tx.status)) fail('EXPENSE_REQUIRED');
    const amountCents = cents(tx.amount);
    const currency = text(tx.currency || scope.currency || profile.currency || 'EUR').toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) fail('INVALID_CURRENCY');
    return {tx, amountCents, currency};
  }
  function transactionStamp(profile, scope, transactionId) {
    const {tx, amountCents, currency} = transaction(profile, scope, transactionId);
    return JSON.stringify([tx.id, tx.type || 'expense', amountCents, currency, tx.date, tx.name || tx.title || '', tx.status || '', tx.categoryId || tx.category || '']);
  }
  function allocate(amountCents, participants, mode = 'equal') {
    assertCents(amountCents);
    if (!Array.isArray(participants) || participants.length < 2 || participants.length > 12 || !['equal', 'custom'].includes(mode)) fail('INVALID_PARTICIPANTS');
    if (participants.some(item => !item || typeof item !== 'object') || new Set(participants.map(item => item.id)).size !== participants.length || participants[0]?.id !== 'self') fail('INVALID_PARTICIPANTS');
    const names = participants.map(item => text(item.name));
    if (participants.some((item, index) => !cleanId(item.id) || names[index].length < 1 || names[index].length > 60 || /[\u0000-\u001f]/.test(names[index]))) fail('INVALID_PARTICIPANTS');
    if (new Set(names.map(name => name.toLocaleLowerCase())).size !== names.length) fail('DUPLICATE_NAMES');
    const base = Math.floor(amountCents / participants.length), remainder = amountCents % participants.length;
    const result = participants.map((item, index) => ({id:item.id, name:names[index], shareCents:mode === 'equal' ? base + (index < remainder ? 1 : 0) : assertCents(item.shareCents, true)}));
    if (result.reduce((sum, item) => sum + item.shareCents, 0) !== amountCents) fail('SHARES_MISMATCH');
    return result;
  }
  function list(profile, scope) {
    context(profile, scope);
    return (Array.isArray(profile.billSplits) ? profile.billSplits : []).filter(item => validSplit(item) && item.ownerUserId === scope.userId && item.profileId === scope.profileId);
  }
  function validSplit(item) {
    try {
      if (!item || item.version !== 1 || !cleanId(item.id) || typeof item.transactionId !== 'string' || !Number.isSafeInteger(item.revision) || item.revision < 1 || !/^[A-Z]{3}$/.test(item.currency) || !Array.isArray(item.settlements)) return false;
      allocate(item.amountCents,item.participants,'custom');
      if (new Set(item.settlements.map(entry => entry?.id)).size !== item.settlements.length) return false;
      for (const entry of item.settlements) {
        if (!entry || !cleanId(entry.id) || !validDay(entry.date) || !item.participants.some(person => person.id === entry.participantId && person.id !== 'self')) return false;
        assertCents(entry.amountCents);
      }
      return item.participants.every(person => item.settlements.filter(entry => entry.participantId === person.id).reduce((sum,entry) => sum + entry.amountCents,0) <= person.shareCents);
    } catch { return false; }
  }
  function validDay(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T12:00:00Z`)) && new Date(`${date}T12:00:00Z`).toISOString().slice(0,10) === date;
  }
  function find(profile, scope, id) {
    const item = list(profile, scope).find(split => split.id === id);
    if (!item) fail('ACCESS_DENIED');
    return item;
  }
  function inspect(profile, scope, split) {
    context(profile,scope);
    if (!split || split.ownerUserId !== scope.userId || split.profileId !== scope.profileId) fail('ACCESS_DENIED');
    if (!validSplit(split)) fail('INVALID_SPLIT');
    let stale = true;
    try { stale = transactionStamp(profile, scope, split.transactionId) !== split.transactionStamp; } catch { /* Deleted/changed sources remain visible as stale ledger records. */ }
    const participants = (split.participants || []).map(person => {
      const settledCents = (split.settlements || []).filter(entry => entry.participantId === person.id).reduce((sum, entry) => sum + assertCents(entry.amountCents), 0);
      return {...person, settledCents, owedCents:person.id === 'self' ? 0 : Math.max(0, person.shareCents - settledCents)};
    });
    return {stale, participants, outstandingCents:participants.reduce((sum, person) => sum + person.owedCents, 0)};
  }
  function save(profile, scope, input) {
    context(profile, scope);
    if (!input || typeof input !== 'object') fail('INVALID_PARTICIPANTS');
    const stamp = transactionStamp(profile, scope, input.transactionId);
    if (!input.expectedStamp || input.expectedStamp !== stamp) fail('STALE_TRANSACTION');
    const {tx, amountCents, currency} = transaction(profile, scope, input.transactionId);
    const existing = list(profile, scope).find(item => item.transactionId === input.transactionId);
    if (existing && input.expectedRevision !== existing.revision) fail('STALE_SPLIT');
    if (!existing && input.expectedRevision) fail('STALE_SPLIT');
    const participants = allocate(amountCents, input.participants, input.mode);
    const settlements = existing?.settlements || [];
    if (settlements.some(entry => !participants.some(person => person.id === entry.participantId))) fail('SETTLEMENT_PROTECTED');
    for (const person of participants) if (settlements.filter(entry => entry.participantId === person.id).reduce((sum, entry) => sum + entry.amountCents, 0) > person.shareCents) fail('SETTLEMENT_PROTECTED');
    const timestamp = new Date().toISOString();
    const next = {version:1, id:existing?.id || newId(), ownerUserId:scope.userId, profileId:scope.profileId, transactionId:tx.id, transactionStamp:stamp, amountCents, currency, title:text(tx.name || tx.title || 'Trošak'), date:tx.date, payerId:'self', mode:input.mode || 'equal', participants, settlements:clone(settlements), revision:(existing?.revision || 0) + 1, createdAt:existing?.createdAt || timestamp, updatedAt:timestamp};
    // Replace only this exact scoped record, never a different owner's colliding ID.
    profile.billSplits = (Array.isArray(profile.billSplits) ? profile.billSplits : []).filter(item => !existing || item !== existing).concat(next);
    return next;
  }
  function settle(profile, scope, input) {
    const previous = find(profile, scope, input.id);
    if (input.expectedRevision !== previous.revision) fail('STALE_SPLIT');
    const current = inspect(profile, scope, previous);
    if (current.stale) fail('STALE_TRANSACTION');
    const person = current.participants.find(item => item.id === input.participantId && item.id !== 'self');
    if (!person) fail('INVALID_PARTICIPANTS');
    const amountCents = assertCents(input.amountCents);
    if (amountCents > person.owedCents) fail('OVERPAYMENT');
    const date = text(input.date || scope.referenceDate);
    if (!validDay(date) || (scope.referenceDate && date > scope.referenceDate)) fail('INVALID_DATE');
    const entry = {id:newId(), participantId:person.id, amountCents, date, recordedAt:new Date().toISOString(), manual:true};
    const next = {...previous, settlements:[...(previous.settlements || []), entry], revision:previous.revision + 1};
    profile.billSplits = profile.billSplits.map(item => item === previous ? next : item);
    return next;
  }
  function remove(profile, scope, id, revision) {
    const item = find(profile, scope, id);
    if (item.revision !== revision) fail('STALE_SPLIT');
    if (item.settlements?.length) fail('SETTLEMENT_PROTECTED');
    profile.billSplits = profile.billSplits.filter(split => split !== item);
  }
  function validIban(value, country = 'HR') {
    const iban = text(value).replace(/\s/g, '').toUpperCase();
    // HUB3 accepts Croatian IBANs. EPC additionally accepts known SEPA lengths.
    const lengths = {HR:21,AT:20,BE:16,BG:22,CH:21,CY:28,CZ:24,DE:22,DK:18,EE:20,ES:24,FI:18,FR:27,GB:22,GR:27,HU:28,IE:22,IS:26,IT:27,LI:21,LT:20,LU:20,LV:21,MC:27,MT:31,NL:18,NO:15,PL:28,PT:25,RO:24,SE:24,SI:19,SK:24,SM:27};
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban) || iban.length !== lengths[iban.slice(0,2)] || (country && !iban.startsWith(country))) return false;
    if (iban.startsWith('HR') && !/^HR\d{19}$/.test(iban)) return false;
    let remainder = 0;
    for (const character of iban.slice(4) + iban.slice(0,4)) for (const digit of /[A-Z]/.test(character) ? String(character.charCodeAt(0) - 55) : character) remainder = (remainder * 10 + Number(digit)) % 97;
    return remainder === 1;
  }
  function field(value, max, required = false, hub = true) {
    const result = text(value).normalize('NFC');
    if ((required && !result) || [...result].length > max || /[\u0000-\u001f\u007f]/.test(result) || (hub && !/^[A-Za-zČĆĐŠŽčćđšž0-9 ,.:+?'\/()\-]*$/.test(result))) fail('INVALID_PAYMENT_FIELD');
    return result;
  }
  function pdf417Codewords(payload) {
    const bytes = new TextEncoder().encode(payload), result = [bytes.length % 6 === 0 ? 924 : 901];
    let index = 0;
    for (; index + 6 <= bytes.length; index += 6) {
      let value = 0n;
      for (let offset = 0; offset < 6; offset += 1) value = value * 256n + BigInt(bytes[index + offset]);
      const words = Array(5);
      for (let offset = 4; offset >= 0; offset -= 1) { words[offset] = Number(value % 900n); value /= 900n; }
      result.push(...words);
    }
    for (; index < bytes.length; index += 1) result.push(bytes[index]);
    return result;
  }
  function hub3(input) {
    assertCents(input.amountCents);
    if (input.currency && input.currency !== 'EUR') fail('EUR_REQUIRED');
    const iban = text(input.iban).replace(/\s/g, '').toUpperCase();
    if (!validIban(iban)) fail('INVALID_IBAN');
    const model = text(input.model || 'HR00').toUpperCase(), reference = field(input.reference,22);
    // Only non-control models are exposed until model-specific checksum rules are implemented.
    if (!['HR00','HR99'].includes(model)) fail('UNSUPPORTED_MODEL');
    if ((model === 'HR99' && reference) || (reference && !/^\d{1,22}(?:-\d{1,22}){0,2}$/.test(reference))) fail('INVALID_REFERENCE');
    const purpose = field(input.purpose || 'COST',4);
    if (!['COST','OTHR','RENT','SUPP'].includes(purpose)) fail('INVALID_PURPOSE');
    const fields = ['HRVHUB30','EUR',String(input.amountCents).padStart(15,'0'),field(input.payerName,30),field(input.payerAddress,27),field(input.payerCity,27),field(input.recipientName,25,true),field(input.recipientAddress,25),field(input.recipientCity,27),iban,model,reference,purpose,field(input.description,35,true)];
    const payload = `${fields.join('\n')}\n`, codewords = pdf417Codewords(payload);
    // 32 rows + quiet zones fit the HUB3 maximum 58 x 26 mm at a 0.254 mm module.
    if (Math.ceil((codewords.length + 1 + 32) / 9) > 32) fail('PAYLOAD_TOO_LONG');
    return {kind:'hub3', payload, fields, amountCents:input.amountCents, iban, recipientName:fields[6], description:fields[13], options:{bcid:'pdf417',text:codewords.map(value=>`^${String(value).padStart(3,'0')}`).join(''),raw:true,columns:9,eclevel:4,fixedeclevel:true,rowmult:3,scale:3,padding:3,backgroundcolor:'FFFFFF'}};
  }
  function epc(input) {
    assertCents(input.amountCents);
    if (input.currency && input.currency !== 'EUR') fail('EUR_REQUIRED');
    const iban = text(input.iban).replace(/\s/g, '').toUpperCase();
    if (!validIban(iban,null)) fail('INVALID_IBAN');
    const bic = text(input.bic).toUpperCase();
    if ((bic && !/^[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?$/.test(bic)) || (!bic && ['CH','GB','MC','SM'].includes(iban.slice(0,2)))) fail('INVALID_BIC');
    const name = field(input.recipientName,70,true,false), description = field(input.description,140,true,false);
    const payload = ['BCD','002','1','SCT',bic,name,iban,`EUR${(input.amountCents / 100).toFixed(2)}`,'','',description].join('\n');
    if (new TextEncoder().encode(payload).length > 331) fail('PAYLOAD_TOO_LONG');
    return {kind:'epc',payload,amountCents:input.amountCents,iban,recipientName:name,description,options:{bcid:'qrcode',text:payload,eclevel:'M',scale:4,padding:4,backgroundcolor:'FFFFFF'}};
  }
  return Object.freeze({MAX_CENTS,cents,allocate,transaction,transactionStamp,list,find,inspect,save,settle,remove,validIban,hub3,epc,pdf417Codewords});
});
