(function exposeMerExportCore(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerExportCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerExportCore() {
  'use strict';

  const contexts = ['activity', 'budget', 'savings', 'insights'];
  const timeframes = ['daily', 'monthly', 'custom-month', 'ytd', 'all'];
  const words = {
    hr: {
      activity:'Aktivnost — transakcije', budget:'Budžeti — pregled kategorija', savings:'Štednja — uplate i isplate', insights:'Uvidi — financijski izvještaj',
      daily:'Danas', monthly:'Ovaj mjesec', 'custom-month':'Određeni mjesec', ytd:'Ova godina', all:'Sve ukupno',
      personal:'Osobni račun', business:'Poslovni račun', date:'Datum', time:'Vrijeme', description:'Opis', category:'Kategorija', type:'Vrsta', amount:'Iznos', currency:'Valuta', status:'Status', profile:'Profil', source:'Izvor', id:'ID',
      income:'Prihodi', expense:'Troškovi', net:'Neto iznos', count:'Broj transakcija', posted:'Knjiženo', pending:'Na čekanju', scheduled:'Zakazano', draft:'Izvanmrežni nacrt', cancelled:'Otkazano', manual:'Ručno', unknown:'Nekategorizirano',
      transactions:'Pojedinačne transakcije', categories:'Potrošnja po kategorijama', currentLimit:'Trenutačni mjesečni limit', periodUsage:'Troškovi u odabranom razdoblju', configuredTotal:'Ukupni trenutačni mjesečni limiti', cashflow:'Prihodi i troškovi po razdobljima', period:'Razdoblje',
      deposits:'Uplate štednje', withdrawals:'Isplate štednje', savingsNet:'Neto ušteđeno', savingsRows:'Evidencija štednje', savingsCount:'Broj stavki štednje', goal:'Cilj štednje', noGoal:'Neraspoređena štednja', deposit:'Uplata', withdrawal:'Isplata', noTime:'Vrijeme nije zabilježeno',
      cutoff:'Zbrojevi uključuju samo knjižene stavke do', scheduledNote:'Zakazane stavke, stavke na čekanju i nacrti ne mijenjaju zbrojeve.',
      limitNote:'Limiti su trenutačne mjesečne postavke, a ne povijesni limiti. Troškovi se odnose na odabrano razdoblje.',
      foreignNote:'Stavke u drugim valutama nisu uključene u zbirne iznose; tečajna pretvorba nije primijenjena.',
      invalidNote:'Preskočene su stavke s neispravnim datumom, iznosom ili vrstom transakcije.', noData:'U odabranom razdoblju nema knjiženih stavki.'
    },
    en: {
      activity:'Activity — transactions', budget:'Budgets — category overview', savings:'Savings — deposits and withdrawals', insights:'Insights — financial report',
      daily:'Today', monthly:'This month', 'custom-month':'Specific month', ytd:'This year', all:'All-time',
      personal:'Personal account', business:'Business account', date:'Date', time:'Time', description:'Description', category:'Category', type:'Type', amount:'Amount', currency:'Currency', status:'Status', profile:'Profile', source:'Source', id:'ID',
      income:'Income', expense:'Expenses', net:'Net total', count:'Transaction count', posted:'Posted', pending:'Pending', scheduled:'Scheduled', draft:'Offline draft', cancelled:'Cancelled', manual:'Manual', unknown:'Uncategorized',
      transactions:'Itemized transactions', categories:'Spending by category', currentLimit:'Current monthly limit', periodUsage:'Expenses in selected period', configuredTotal:'Total current monthly limits', cashflow:'Income and expenses by period', period:'Period',
      deposits:'Savings deposits', withdrawals:'Savings withdrawals', savingsNet:'Net saved', savingsRows:'Savings entries', savingsCount:'Savings entry count', goal:'Savings goal', noGoal:'Unallocated savings', deposit:'Deposit', withdrawal:'Withdrawal', noTime:'Time not recorded',
      cutoff:'Totals include only posted entries through', scheduledNote:'Scheduled entries, pending entries, and drafts do not affect totals.',
      limitNote:'Limits are current monthly settings, not historical limits. Spending covers the selected period.',
      foreignNote:'Entries in other currencies are excluded from aggregate amounts; no exchange-rate conversion has been applied.',
      invalidNote:'Entries with an invalid date, amount, or transaction type were skipped.', noData:'There are no posted entries in the selected period.'
    }
  };
  const categoryNames = {
    food:['Hrana i namirnice','Groceries'], transport:['Prijevoz','Transport'], shopping:['Kupovina','Shopping'], healthBeauty:['Zdravlje i njega','Health and beauty'],
    entertainment:['Zabava','Entertainment'], utilities:['Režije','Utilities'], other:['Ostalo','Other'], salary:['Plaća','Salary'], gift:['Poklon','Gift'], freelance:['Honorarni poslovi','Freelance'], otherIncome:['Ostali prihodi','Other income']
  };

  function validDay(value) {
    const day = String(value || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
    const parsed = new Date(`${day}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day ? day : null;
  }

  function monthEnd(month) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(month))) throw new TypeError('A valid YYYY-MM month is required');
    const next = new Date(`${month}-01T00:00:00Z`);
    next.setUTCMonth(next.getUTCMonth() + 1);
    next.setUTCDate(0);
    return next.toISOString().slice(0, 10);
  }

  function cents(value) {
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    const text = String(value).trim();
    const match = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(text);
    if (!match || !(match[2] || match[3])) return null;
    const exponent = Number(match[4] || 0);
    if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100) return null;
    const digits = `${match[2]}${match[3] || ''}`.replace(/^0+/, '') || '0';
    if (digits.length > 120) return null;
    const shift = 2 + exponent - (match[3] || '').length;
    let amount = BigInt(digits);
    if (shift >= 0) amount *= 10n ** BigInt(shift);
    else {
      const divisor = 10n ** BigInt(-shift);
      amount = amount / divisor + (amount % divisor * 2n >= divisor ? 1n : 0n);
    }
    if (match[1] === '-') amount = -amount;
    return amount > BigInt(Number.MAX_SAFE_INTEGER) || amount < BigInt(Number.MIN_SAFE_INTEGER) ? null : Number(amount);
  }

  function add(left, right) {
    const result = left + right;
    if (!Number.isSafeInteger(result)) throw new RangeError('Export totals exceed the supported monetary range');
    return result;
  }

  function decimal(value) {
    const absolute = Math.abs(value);
    return `${value < 0 ? '-' : ''}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, '0')}`;
  }

  function currencyCode(value, fallback = 'EUR') {
    const code = String(value || fallback).toUpperCase();
    return /^[A-Z]{3}$/.test(code) ? code : fallback;
  }

  function dateParts(value, timezone) {
    const text = String(value || '');
    const originalDay = validDay(text.slice(0, 10));
    if (!originalDay) return null;
    if (text.length === 10) return { day:originalDay, hour:null, time:'' };
    const clock = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.\d+)?)?(Z|[+-](?:[01]\d|2[0-3]):?[0-5]\d)?$/i.exec(text);
    if (!clock) return null;
    if (!clock[4]) return { day:originalDay, hour:clock[1], time:`${clock[1]}:${clock[2]}` };
    const actual = new Date(text);
    if (!Number.isFinite(actual.getTime())) return null;
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone:timezone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'
    }).formatToParts(actual).map(part => [part.type, part.value]));
    return { day:`${parts.year}-${parts.month}-${parts.day}`, hour:parts.hour, time:`${parts.hour}:${parts.minute}` };
  }

  function statusAt(row, day, reference) {
    if (row.offlineDraft === true || row.status === 'draft') return 'draft';
    if (['cancelled','canceled','rejected','failed'].includes(String(row.status || '').toLowerCase())) return 'cancelled';
    if (day > reference) return 'scheduled';
    // A future-dated manual record becomes effective on its date. A bank pending
    // record remains pending until the provider posts it, regardless of its date.
    if (row.status === 'pending' && row.scheduled !== true) return 'pending';
    return 'posted';
  }

  function entryDateParts(row, timezone) {
    const date = dateParts(row.date, timezone);
    if (!date) return null;
    const timestamp = row.timestamp ? dateParts(row.timestamp, timezone) : null;
    // Imported records keep their booking date in `date`, sometimes with a
    // synthetic noon. Use the actual clock without moving a booking to another
    // day if its source timestamp is stale or crosses a timezone boundary.
    if (timestamp?.day === date.day && timestamp.hour !== null) return {...date,hour:timestamp.hour,time:timestamp.time};
    if (['auto','import'].includes(row.sourceType) && /T12:00(?::00)?$/.test(String(row.date))) return {...date,hour:null,time:''};
    return date;
  }

  function periodFor(timeframe, reference, month, entries, w) {
    let start;
    let end;
    if (timeframe === 'daily') start = end = reference;
    else if (timeframe === 'monthly' || timeframe === 'custom-month') {
      const selected = timeframe === 'monthly' ? reference.slice(0, 7) : month;
      end = monthEnd(selected);
      start = `${selected}-01`;
    } else if (timeframe === 'ytd') {
      start = `${reference.slice(0, 4)}-01-01`;
      end = `${reference.slice(0, 4)}-12-31`;
    } else {
      start = entries.reduce((first, entry) => entry.day < first ? entry.day : first, reference);
      end = entries.reduce((last, entry) => entry.day > last ? entry.day : last, reference);
    }
    return { start, end, label:`${w[timeframe]} · ${start === end ? start : `${start} – ${end}`}`, timeframe };
  }

  function buildReport(options = {}) {
    const profile = options.profile;
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) throw new TypeError('An active profile is required');
    const profileId = String(options.profileId || profile.profileId || '');
    if (!profileId || (profile.profileId && profile.profileId !== profileId)) throw new TypeError('Export profile does not match the active account');
    const context = options.context || 'activity';
    if (!contexts.includes(context)) throw new TypeError('Unknown export context');
    const timeframe = options.timeframe || 'monthly';
    if (!timeframes.includes(timeframe)) throw new TypeError('Unknown export timeframe');
    const language = options.language === 'en' ? 'en' : 'hr';
    const w = words[language];
    let timezone = options.timezone || 'Europe/Zagreb';
    try { new Intl.DateTimeFormat('en', {timeZone:timezone}).format(); } catch { timezone = 'Europe/Zagreb'; }
    const reference = options.referenceDate === undefined ? dateParts(new Date().toISOString(), timezone).day : validDay(options.referenceDate);
    if (!reference) throw new TypeError('A valid YYYY-MM-DD referenceDate is required');
    const currency = currencyCode(options.currency || profile.currency);
    const locale = language === 'en' ? 'en-GB' : 'hr-HR';
    const formatMoney = value => {
      const whole = BigInt(Math.floor(Math.abs(value) / 100));
      const signedWhole = value < 0 ? (whole === 0n ? -0 : -whole) : whole;
      const fraction = String(Math.abs(value) % 100).padStart(2,'0');
      return new Intl.NumberFormat(locale, {style:'currency', currency, minimumFractionDigits:value ? 2 : 0, maximumFractionDigits:value ? 2 : 0})
        .formatToParts(signedWhole).map(part => part.type === 'fraction' ? fraction : part.value).join('');
    };
    const profileName = String(profile.accountName || w[profileId] || profileId);
    const notes = [`${w.cutoff} ${reference}.`];
    const source = context === 'savings' ? profile.savingsEntries : profile.transactions;
    let invalidCount = 0;
    const entries = (Array.isArray(source) ? source : []).flatMap(row => {
      if (!row || typeof row !== 'object' || (row.profileId && row.profileId !== profileId)) return [];
      const date = entryDateParts(row, timezone);
      const amount = cents(row.amount);
      const type = context === 'savings' ? (amount < 0 ? 'withdrawal' : 'deposit') : (row.type || 'expense');
      const allowedTypes = context === 'savings' ? ['deposit','withdrawal'] : ['expense','income'];
      if (!date || amount === null || !allowedTypes.includes(type)) { invalidCount += 1; return []; }
      return [{ row, ...date, amount, type, currency:currencyCode(row.currency, currency), status:statusAt(row, date.day, reference) }];
    });
    const period = periodFor(timeframe, reference, options.month, entries, w);
    const selected = entries.filter(entry => entry.day >= period.start && entry.day <= period.end).sort((a, b) => a.day.localeCompare(b.day) || a.time.localeCompare(b.time) || String(a.row.id || '').localeCompare(String(b.row.id || '')));
    const effective = selected.filter(entry => entry.status === 'posted' && entry.day <= reference && entry.currency === currency);
    if (selected.some(entry => entry.currency !== currency)) notes.push(w.foreignNote);
    if (selected.some(entry => entry.status !== 'posted')) notes.push(w.scheduledNote);
    if (invalidCount) notes.push(w.invalidNote);
    if (!effective.length) notes.push(w.noData);
    const scopedCategory = category => category && (!category.profileId || category.profileId === profileId);
    const categoryLists = { expense:Array.isArray(profile.categories) ? profile.categories.filter(scopedCategory) : [], income:Array.isArray(profile.incomeCategories) ? profile.incomeCategories.filter(scopedCategory) : [] };
    const categoryFor = entry => String(entry.row.categoryId || entry.row.category || 'uncategorized');
    const categoryLabel = (id, type = 'expense') => {
      const category = categoryLists[type]?.find(item => item.id === id);
      const callback = type === 'income' ? options.incomeCategoryLabel : options.categoryLabel;
      if (typeof callback === 'function') {
        const label = callback(id, category);
        if (label && label !== id) return String(label);
      }
      return String(category?.name || (categoryNames[id] && categoryNames[id][language === 'en' ? 1 : 0]) || (category?.nameKey && category?.nameKey !== id ? category.nameKey : '') || (id === 'uncategorized' ? w.unknown : `${w.unknown} (${id})`));
    };
    const totals = effective.reduce((sum, entry) => {
      if (entry.type === 'income') sum.income = add(sum.income, entry.amount);
      else if (entry.type === 'expense') sum.expenses = add(sum.expenses, entry.amount);
      else if (entry.amount >= 0) sum.deposits = add(sum.deposits, entry.amount);
      else sum.withdrawals = add(sum.withdrawals, -entry.amount);
      return sum;
    }, {income:0, expenses:0, deposits:0, withdrawals:0});
    const report = {
      context, title:w[context], profileId, profileName, currency, period,
      filenameStem:`${{activity:'Aktivnost_Transakcije', budget:'Budzeti_Izvoz', savings:'Stednja_Uplate', insights:'Uvidi_Izvjestaj'}[context]}_${{daily:'Danas', monthly:'Mjesec', 'custom-month':'Mjesec', ytd:'Godina', all:'Sve_Ukupno'}[timeframe]}_${timeframe === 'daily' ? reference : timeframe === 'custom-month' ? options.month : timeframe === 'monthly' ? reference.slice(0, 7) : timeframe === 'ytd' ? reference.slice(0, 4) : reference}_${profileId.replace(/[^A-Za-z0-9_-]/g, '_')}`,
      summary:[], sections:[], recordCount:context === 'activity' || context === 'savings' ? selected.length : effective.length, notes
    };
    const moneySummary = (label, value) => ({label, value:formatMoney(value)});
    if (context !== 'savings') report.summary = [moneySummary(w.income, totals.income), moneySummary(w.expense, totals.expenses), moneySummary(w.net, add(totals.income, -totals.expenses))];

    if (context === 'activity') {
      report.summary.push({label:w.count, value:String(selected.length)});
      report.sections.push({title:w.transactions, columns:[w.date,w.time,w.description,w.type,w.category,w.amount,w.currency,w.status,w.profile,w.source,w.id], rows:selected.map(entry => [entry.day,entry.time,String(entry.row.name || entry.row.title || entry.row.rawDescription || ''),w[entry.type],categoryLabel(categoryFor(entry),entry.type),decimal(entry.amount),entry.currency,w[entry.status],profileName,String(entry.row.source || w.manual),String(entry.row.id || '')])});
    } else if (context === 'budget') {
      const grouped = new Map(categoryLists.expense.filter(category => !category.profileId || category.profileId === profileId).map(category => [String(category.id), {limit:cents(category.limit) || 0, used:0, count:0}]));
      effective.filter(entry => entry.type === 'expense').forEach(entry => {
        const id = categoryFor(entry);
        if (!grouped.has(id)) grouped.set(id, {limit:0, used:0, count:0});
        const group = grouped.get(id);
        group.used = add(group.used, entry.amount); group.count += 1;
      });
      const configured = [...grouped.values()].reduce((sum, group) => add(sum, group.limit), 0);
      report.summary = [moneySummary(w.configuredTotal, configured),moneySummary(w.periodUsage, totals.expenses)];
      report.sections.push({title:w.categories, columns:[w.category,w.currentLimit,w.periodUsage,w.currency,w.count], rows:[...grouped].map(([id, group]) => [categoryLabel(id),decimal(group.limit),decimal(group.used),currency,String(group.count)])});
      notes.push(w.limitNote);
    } else if (context === 'savings') {
      const goals = Array.isArray(profile.goalBuckets) ? profile.goalBuckets.filter(goal => goal && (!goal.profileId || goal.profileId === profileId)) : [];
      report.summary = [moneySummary(w.deposits, totals.deposits),moneySummary(w.withdrawals, totals.withdrawals),moneySummary(w.savingsNet, add(totals.deposits, -totals.withdrawals)),{label:w.savingsCount,value:String(selected.length)}];
      report.sections.push({title:w.savingsRows, columns:[w.date,w.time,w.goal,w.type,w.amount,w.currency,w.profile,w.status,w.description,w.id], rows:selected.map(entry => [entry.day,entry.time,String(goals.find(goal => goal.id === entry.row.goalId)?.name || w.noGoal),w[entry.type],decimal(entry.amount),entry.currency,profileName,w[entry.status],String(entry.row.note || entry.row.name || ''),String(entry.row.id || '')])});
    } else {
      const buckets = new Map();
      const end = period.end < reference ? period.end : reference;
      const bucketFor = entry => timeframe === 'daily' ? (entry.hour === null ? w.noTime : `${entry.hour}:00`) : timeframe === 'monthly' || timeframe === 'custom-month' ? entry.day : entry.day.slice(0,7);
      const insert = key => { if (!buckets.has(key)) buckets.set(key,{income:0,expenses:0,count:0}); };
      if (period.start <= end) {
        if (timeframe === 'daily') for (let hour = 0; hour < 24; hour += 1) insert(`${String(hour).padStart(2,'0')}:00`);
        else if (timeframe === 'monthly' || timeframe === 'custom-month') for (let day = 1; day <= Number(end.slice(8)); day += 1) insert(`${period.start.slice(0,7)}-${String(day).padStart(2,'0')}`);
        else if (timeframe === 'ytd') for (let month = 1; month <= Number(end.slice(5,7)); month += 1) insert(`${reference.slice(0,4)}-${String(month).padStart(2,'0')}`);
      }
      effective.forEach(entry => {
        const key = bucketFor(entry); insert(key);
        const bucket = buckets.get(key);
        if (entry.type === 'income') bucket.income = add(bucket.income, entry.amount);
        else bucket.expenses = add(bucket.expenses, entry.amount);
        bucket.count += 1;
      });
      report.sections.push({title:w.cashflow,columns:[w.period,w.income,w.expense,w.net,w.currency,w.count],rows:[...buckets].sort(([a],[b]) => a.localeCompare(b)).map(([key,bucket]) => [key,decimal(bucket.income),decimal(bucket.expenses),decimal(add(bucket.income,-bucket.expenses)),currency,String(bucket.count)])});
      const categories = new Map();
      effective.filter(entry => entry.type === 'expense').forEach(entry => { const id=categoryFor(entry); categories.set(id,add(categories.get(id) || 0,entry.amount)); });
      report.sections.push({title:w.categories,columns:[w.category,w.expense,w.currency],rows:[...categories].sort((a,b) => b[1]-a[1]).map(([id,amount]) => [categoryLabel(id),decimal(amount),currency])});
    }
    return report;
  }

  function csvCell(value) {
    let text = value === null || value === undefined ? '' : String(value);
    // A negative numeric amount is safe; a formula or spreadsheet control prefix
    // in any user-controlled text field must be forced to a literal cell.
    const number = /^[+-]?\d+(?:\.\d+)?$/.test(text);
    if (!number && (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text))) text = `'${text}`;
    return `"${text.replace(/"/g,'""')}"`;
  }

  function toCsv(report) {
    if (!report || !Array.isArray(report.sections)) throw new TypeError('A report is required');
    const rows = [[report.title],[report.profileName,report.profileId],[report.period?.label || '',report.currency],[],...(report.summary || []).map(item => [item.label,item.value])];
    report.sections.forEach(section => rows.push([], [section.title], section.columns, ...section.rows));
    if (report.notes?.length) rows.push([], ...report.notes.map(note => [note]));
    return `\uFEFF${rows.map(row => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
  }

  return {buildReport,toCsv};
});
