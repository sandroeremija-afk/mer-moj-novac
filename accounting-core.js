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
  const dateValue = value => {
    const text = clean(value);
    const match = text.match(/^\d{4}-\d{2}-\d{2}/);
    return match ? `${match[0]}T${text.includes('T') ? text.split('T')[1].replace(/Z$/, '').slice(0, 8) || '12:00:00' : '12:00:00'}` : null;
  };

  function normalizePsd2Transaction(provider, payload, account = {}) {
    const id = clean(payload.transactionId || payload.id || payload.entryReference || payload.extra?.id);
    const rawAmount = Number(payload.transactionAmount?.amount ?? payload.amount ?? payload.extra?.amount);
    const indicator = clean(payload.creditDebitIndicator || payload.status === 'credit' ? payload.creditDebitIndicator || 'CRDT' : payload.credit_debit_indicator).toUpperCase();
    const timestamp = dateValue(payload.bookingDateTime || payload.bookedAt || payload.bookingDate || payload.made_on || payload.created_at || payload.date);
    if (!id || !Number.isFinite(rawAmount) || rawAmount === 0 || !timestamp) return null;
    const creditDebitIndicator = indicator === 'CRDT' || (!indicator && rawAmount > 0) ? 'CRDT' : 'DBIT';
    const merchantName = clean(payload.merchantName || payload.creditorName || payload.debtorName || payload.extra?.merchant || payload.remittanceInformationUnstructured || payload.description || 'Bank transaction').slice(0, 100);
    return {
      transactionId:id, accountId:clean(account.accountId || account.id), iban:clean(payload.iban || account.iban), bic:clean(payload.bic || account.bic),
      merchantName, timestamp, amount:Math.abs(rawAmount), currency:clean(payload.transactionAmount?.currency || payload.currency || account.currency || 'EUR').toUpperCase(),
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
      const bookingDate = textFrom(entry, ['BookgDt','DtTm','Dt']).match(/\d{4}-\d{2}-\d{2}/)?.[0];
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

  const normalizedMerchant = value => clean(value).toLocaleLowerCase('en').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b(pos|card|payment|zagreb|hr|eu|sarl|ab)\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
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
    const date = new Date(`${String(reference).slice(0,10)}T12:00:00`);
    const result = [];
    for (let offset=count-1; offset>=0; offset-=1) {
      const point = new Date(date.getFullYear(), date.getMonth()-offset, 1);
      const key = `${point.getFullYear()}-${String(point.getMonth()+1).padStart(2,'0')}`;
      const totals = (transactions||[]).filter(tx=>String(tx.date||'').startsWith(key)).reduce((sum,tx)=>{sum[MerCore.transactionType(tx)==='income'?'income':'expenses']+=MerCore.financialAmount(tx.amount);return sum;},{income:0,expenses:0});
      totals.income=Math.max(0,MerCore.roundMoney(totals.income));totals.expenses=Math.max(0,MerCore.roundMoney(totals.expenses));
      result.push({key,...totals});
    }
    return result;
  }

  function detectSubscriptions(transactions, reference = new Date()) {
    const known = /netflix|spotify|gym|teretana|icloud|google one|dropbox|adobe|microsoft 365|youtube premium|hbo|max|disney/i;
    const expenses = (transactions||[]).filter(tx=>MerCore.transactionType(tx)==='expense').slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
    const grouped = {};
    expenses.forEach(tx=>{const key=normalizedMerchant(tx.merchantName||tx.name);if(!key)return;(grouped[key] ||= []).push(tx);});
    const referenceDate = new Date(String(reference).includes('T') ? reference : `${String(reference).slice(0,10)}T12:00:00`);
    return Object.values(grouped).filter(group=>{
      if(known.test(group[0].name))return true;
      const cadence=group.slice(1).filter((tx,index)=>{const previous=group[index],days=(new Date(tx.date)-new Date(previous.date))/86400000,baseline=Math.max(1,Number(previous.amount)||0);return Math.abs(days-30)<=5&&Math.abs((Number(tx.amount)||0)-baseline)/baseline<=.15;});
      return group.length>=3&&cadence.length>=2;
    }).map(group=>{
      const last=group[group.length-1], next=new Date(last.date); next.setMonth(next.getMonth()+1);while(next<referenceDate)next.setMonth(next.getMonth()+1);
      return { id:`subscription-${MerCore.stableTransactionHash(normalizedMerchant(last.name))}`, merchant:last.merchantName||last.name, amount:Number(last.amount)||0, category:last.category, lastCharged:String(last.date).slice(0,10), nextRenewal:next.toISOString().slice(0,10), daysUntil:Math.ceil((next-referenceDate)/86400000), confidence:known.test(last.name)?'merchant':'cadence' };
    }).sort((a,b)=>a.daysUntil-b.daysUntil);
  }

  function goalMetrics(goal, reference = new Date()) {
    const remaining=Math.max(0,Number(goal.target||0)-Number(goal.current||0));
    if(!goal.dueDate)return {remaining,daysRemaining:null,monthsRemaining:null,monthlyRequired:null};
    const start=new Date(String(reference).includes('T')?reference:`${String(reference).slice(0,10)}T12:00:00`),due=new Date(`${goal.dueDate}T12:00:00`);
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
