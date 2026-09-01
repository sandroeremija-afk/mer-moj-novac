(function exposeMerAccounting(root, factory) {
  const core = typeof module === 'object' && module.exports ? require('./core.js') : root.MerCore;
  const api = factory(core);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerAccounting = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerAccounting(MerCore) {
  const PSD2_TRANSACTION_FIELDS = Object.freeze(['transactionId','accountId','iban','bic','merchantName','timestamp','amount','currency','creditDebitIndicator','remittanceInformation']);
  const SUPPORTED_INSTITUTIONS = Object.freeze([
    { id:'zaba', name:'Zagrebačka banka (ZABA)', country:'HR' }, { id:'pbz', name:'Privredna banka Zagreb (PBZ)', country:'HR' },
    { id:'erste', name:'Erste & Steiermärkische Bank', country:'HR' }, { id:'hpb', name:'Hrvatska poštanska banka (HPB)', country:'HR' },
    { id:'otp', name:'OTP banka Hrvatska', country:'HR' }, { id:'revolut', name:'Revolut', country:'LT' },
    { id:'n26', name:'N26', country:'DE' }, { id:'wise', name:'Wise Europe', country:'BE' }
  ]);
  const PROVIDERS = Object.freeze(['gocardless','nordigen','saltedge','tink']);
  const clean = value => String(value ?? '').trim();
  const validDate = value => {
    const match = clean(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
    const date=new Date(Date.UTC(year,month-1,day));
    return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day?match[0]:null;
  };
  const dateValue = value => {
    const text = clean(value);
    const iso = validDate(text);
    return iso ? `${iso}T${text.includes('T') ? text.split('T')[1].replace(/Z$/, '').slice(0, 8) || '12:00:00' : '12:00:00'}` : null;
  };

  function normalizePsd2Transaction(provider, payload, account = {}) {
    const id = clean(payload.transactionId || payload.id || payload.entryReference || payload.extra?.id);
    const amountContainer = payload.transactionAmount || payload.instructedAmount;
    const rawAmount = Number(amountContainer?.amount ?? payload.amount ?? payload.extra?.amount);
    const status = clean(payload.status).toLowerCase();
    const indicator = clean(payload.creditDebitIndicator || payload.credit_debit_indicator || (status === 'credit' ? 'CRDT' : status === 'debit' ? 'DBIT' : '')).toUpperCase();
    const timestamp = dateValue(payload.bookingDateTime || payload.bookedAt || payload.bookingDate || payload.made_on || payload.created_at || payload.date);
    if (!id || !Number.isFinite(rawAmount) || rawAmount === 0 || !timestamp) return null;
    const creditDebitIndicator = indicator === 'CRDT' || (!indicator && rawAmount > 0) ? 'CRDT' : 'DBIT';
    const counterparty = creditDebitIndicator === 'CRDT' ? payload.debtorName || payload.creditorName : payload.creditorName || payload.debtorName;
    const merchantName = clean(payload.merchantName || counterparty || payload.extra?.merchant || payload.remittanceInformationUnstructured || payload.description || 'Bank transaction').slice(0, 100);
    return {
      transactionId:id, accountId:clean(account.accountId || account.id), iban:clean(payload.iban || account.iban), bic:clean(payload.bic || account.bic),
      merchantName, timestamp, amount:Math.abs(rawAmount), currency:clean(amountContainer?.currency || payload.currency || account.currency || 'EUR').toUpperCase(),
      creditDebitIndicator, remittanceInformation:clean(payload.remittanceInformationUnstructured || payload.description || merchantName), provider:PROVIDERS.includes(provider) ? provider : 'custom'
    };
  }

  const textFrom = (source, names) => {
    for (const name of names) {
      const expression = new RegExp(`<(?:(?:\\w+):)?${name}\\b[^>]*>([\\s\\S]*?)<\\/(?:(?:\\w+):)?${name}>`, 'i');
      const match = String(source).match(expression);
      if (match) return match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    return '';
  };
  const entriesFromXml = xml => String(xml).match(/<(?:(?:\w+):)?Ntry\b[^>]*>[\s\S]*?<\/(?:(?:\w+):)?Ntry>/gi) || [];

  function parseCamt053(xml, profile) {
    const source = String(xml || '').replace(/^\uFEFF/, '');
    const iban = textFrom(source, ['IBAN']);
    const bic = textFrom(source, ['BICFI','BIC']);
    const reviewRows = [], invalidRows = [];
    entriesFromXml(source).forEach((entry, index) => {
      const rawAmount = Number(textFrom(entry, ['Amt']).replace(/\s/g, '').replace(',', '.'));
      const bookingDate = validDate(textFrom(entry, ['BookgDt','DtTm','Dt']));
      const indicator = textFrom(entry, ['CdtDbtInd']).toUpperCase();
      const name = (textFrom(entry, ['Ustrd']) || textFrom(entry, ['Nm']) || textFrom(entry, ['AddtlNtryInf']) || 'Bank transaction').slice(0, 100);
      if (!Number.isFinite(rawAmount) || rawAmount <= 0 || !bookingDate) { invalidRows.push({ row:index + 1, reason:!bookingDate?'invalid-date':'invalid-amount' }); return; }
      const type = indicator === 'CRDT' ? 'income' : 'expense';
      const suggested = MerCore.autoCategorizeBankTransaction({ description:name, amount:type==='income'?rawAmount:-rawAmount, creditDebitIndicator:indicator }, profile);
      const row = { rowNumber:index + 1, type, name, amount:rawAmount, date:bookingDate, category:suggested.category, categoryConfidence:suggested.confidence, categorizationRule:suggested.rule, needsReview:suggested.confidence==='fallback', excluded:false, iban, bic, currency:(entry.match(/<(?:(?:\w+):)?Amt\b[^>]*Ccy="([A-Z]{3})"/i)?.[1] || 'EUR') };
      row.importHash = MerCore.stableTransactionHash([bookingDate,type,rawAmount.toFixed(2),name.toLocaleLowerCase('en')]);
      reviewRows.push(row);
    });
    return { reviewRows, invalidRows, duplicates:0, totalRows:reviewRows.length + invalidRows.length, format:'CAMT.053' };
  }

  const normalizedMerchant = value => clean(value).toLocaleLowerCase('en').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b(pos|card|payment|zagreb|hr|eu|sarl|ab)\b/g,' ').replace(/\b\d{3,}\b/g,' ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  function topMerchants(transactions, timeframe, reference) {
    const grouped = {};
    MerCore.filterTransactions(transactions, timeframe, reference).filter(tx => MerCore.transactionType(tx)==='expense').forEach(tx => {
      const key = normalizedMerchant(tx.merchantName || tx.name) || 'other';
      grouped[key] = grouped[key] || { name:tx.merchantName || tx.name, amount:0, count:0 };
      grouped[key].amount += MerCore.financialAmount(tx.amount); grouped[key].count += 1;
    });
    return Object.values(grouped).map(item=>({...item,amount:Math.max(0,MerCore.roundMoney(item.amount))})).filter(item=>item.amount>0).sort((a,b)=>b.amount-a.amount).slice(0,5);
  }

  function monthSeries(transactions, reference, count = 6) {
    const referenceIso=validDate(reference);
    const date = referenceIso ? new Date(`${referenceIso}T12:00:00`) : new Date();
    const result = [];
    const safeCount=Math.max(1,Math.min(36,Math.floor(Number(count)||6)));
    for (let offset=safeCount-1; offset>=0; offset-=1) {
      const point = new Date(date.getFullYear(), date.getMonth()-offset, 1);
      const key = `${point.getFullYear()}-${String(point.getMonth()+1).padStart(2,'0')}`;
      const totals = (transactions||[]).filter(tx=>String(tx.date||'').startsWith(key)).reduce((sum,tx)=>{sum[MerCore.transactionType(tx)==='income'?'income':'expenses']+=MerCore.financialAmount(tx.amount);return sum;},{income:0,expenses:0});
      totals.income=Math.max(0,MerCore.roundMoney(totals.income));totals.expenses=Math.max(0,MerCore.roundMoney(totals.expenses));
      result.push({key,...totals});
    }
    return result;
  }

  function detectSubscriptions(transactions, reference = new Date()) {
    const known = /\b(?:netflix|spotify|gym|teretana|icloud|google one|dropbox|adobe|microsoft 365|youtube premium|hbo(?: max)?|max streaming|disney(?: plus)?)\b/i;
    const grouped = {};
    const referenceIso=validDate(reference)||validDate(new Date().toISOString());
    const referenceDate = new Date(`${referenceIso}T12:00:00`);
    const expenses = (transactions||[]).filter(tx=>{
      const date=validDate(tx?.date);
      return MerCore.transactionType(tx)==='expense'&&date&&date<=referenceIso;
    }).slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
    expenses.forEach(tx=>{const key=normalizedMerchant(tx.merchantName||tx.name);if(!key)return;(grouped[key] ||= []).push(tx);});
    return Object.values(grouped).filter(group=>{
      const lastDate=new Date(`${validDate(group.at(-1)?.date)}T12:00:00`);
      const daysSinceLast=Math.floor((referenceDate-lastDate)/86400000);
      if(known.test(group[0].merchantName||group[0].name))return daysSinceLast<=62;
      const cadence=group.slice(1).filter((tx,index)=>{const previous=group[index],days=(new Date(tx.date)-new Date(previous.date))/86400000,baseline=Math.max(1,Number(previous.amount)||0);return Math.abs(days-30)<=5&&Math.abs((Number(tx.amount)||0)-baseline)/baseline<=.15;});
      return group.length>=3&&cadence.length>=2&&daysSinceLast<=62;
    }).map(group=>{
      const last=group[group.length-1],lastIso=validDate(last.date),renewalRule={enabled:true,day:Number(lastIso.slice(8,10)),startDate:lastIso};
      let nextIso=MerCore.nextOccurrence(renewalRule,lastIso);
      while(nextIso&&nextIso<referenceIso)nextIso=MerCore.nextOccurrence(renewalRule,nextIso);
      const next=new Date(`${nextIso||referenceIso}T12:00:00`),merchant=last.merchantName||last.name;
      return { id:`subscription-${MerCore.stableTransactionHash(normalizedMerchant(merchant))}`, merchant, amount:Number(last.amount)||0, category:last.category, lastCharged:lastIso, nextRenewal:nextIso||referenceIso, daysUntil:Math.ceil((next-referenceDate)/86400000), confidence:known.test(merchant)?'merchant':'cadence' };
    }).sort((a,b)=>a.daysUntil-b.daysUntil);
  }

  function goalMetrics(goal, reference = new Date()) {
    const remaining=Math.max(0,(Number.isFinite(Number(goal?.target))?Number(goal.target):0)-(Number.isFinite(Number(goal?.current))?Number(goal.current):0));
    const startIso=validDate(reference),dueIso=validDate(goal?.dueDate);
    if(!startIso||!dueIso)return {remaining,daysRemaining:null,monthsRemaining:null,monthlyRequired:null};
    const start=new Date(`${startIso}T12:00:00`),due=new Date(`${dueIso}T12:00:00`);
    const daysRemaining=Math.max(0,Math.ceil((due-start)/86400000)),monthsRemaining=Math.max(1,Math.ceil(daysRemaining/30.4375));
    return {remaining,daysRemaining,monthsRemaining,monthlyRequired:remaining/monthsRemaining};
  }

  const roundUpAmount = amount => Math.round((Math.ceil((Number(amount)||0)-1e-8)-(Number(amount)||0))*100)/100;
  function applyRoundUp(profile, transaction) {
    if (!profile || MerCore.transactionType(transaction)!=='expense' || transaction.sourceType==='round-up' || transaction.roundUpAmount) return null;
    const goal=(profile.goalBuckets||[]).find(item=>item.roundUpsEnabled) || null;
    const amount=roundUpAmount(transaction.amount); if(!goal||amount<=0)return null;
    const contribution=MerCore.applySavingsContribution(profile,goal.id,amount,1); if(!contribution.valid)return null;
    const entry={id:`roundup-${transaction.id}`,amount,note:`Round-up · ${transaction.name}`,goalId:goal.id,date:transaction.date,source:'Round-up',sourceType:'round-up',roundUpForTransactionId:String(transaction.id)};
    profile.savingsEntries=profile.savingsEntries||[]; profile.savingsEntries.push(entry); transaction.roundUpAmount=amount; transaction.roundUpGoalId=goal.id;
    return entry;
  }
  function undoRoundUp(profile, transaction) {
    const entries=(profile?.savingsEntries||[]).filter(entry=>entry.roundUpForTransactionId===String(transaction?.id));
    entries.forEach(entry=>MerCore.applySavingsContribution(profile,entry.goalId,entry.amount,-1));
    if(profile)profile.savingsEntries=(profile.savingsEntries||[]).filter(entry=>entry.roundUpForTransactionId!==String(transaction?.id));
    if(transaction){delete transaction.roundUpAmount;delete transaction.roundUpGoalId;}
    return entries.length;
  }

  return { PSD2_TRANSACTION_FIELDS, SUPPORTED_INSTITUTIONS, PROVIDERS, normalizePsd2Transaction, parseCamt053, topMerchants, monthSeries, detectSubscriptions, goalMetrics, roundUpAmount, applyRoundUp, undoRoundUp };
});
