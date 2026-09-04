(function exposeMerDemoData(root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./core.js') : root.MerCore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerDemoData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerDemoData(MerCore) {
  'use strict';

  const clone = value => JSON.parse(JSON.stringify(value));
  const incomeCategories = [
    { id:'salary', nameKey:'salary', icon:'P', isCustom:false },
    { id:'gift', nameKey:'gift', icon:'D', isCustom:false },
    { id:'freelance', nameKey:'freelance', icon:'F', isCustom:false },
    { id:'otherIncome', nameKey:'otherIncome', icon:'O', isCustom:false }
  ];

  function referenceDay(value = new Date(), timezone = 'Europe/Zagreb') {
    if (value instanceof Date) {
      if (!Number.isFinite(value.getTime())) throw new TypeError('A valid demo reference date is required');
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone:timezone, year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(value).map(part => [part.type, part.value]));
      return `${parts.year}-${parts.month}-${parts.day}`;
    }
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) throw new TypeError('An ISO demo reference date is required');
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    if (date.toISOString().slice(0, 10) !== match[0]) throw new TypeError('A valid demo reference date is required');
    return match[0];
  }

  function relativeDate(reference, monthOffset, requestedDay) {
    const [year, month, day] = reference.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1 + monthOffset, 1));
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    // Every current-month sample is already posted, including a reset on the first day.
    date.setUTCDate(Math.min(requestedDay, lastDay, monthOffset === 0 ? day : 31));
    return date.toISOString().slice(0, 10);
  }

  function transaction(profileId, id, name, amount, category, type, date) {
    return { id:`demo-${profileId}-${id}`, profileId, name, amount, category, type, date:`${date}T08:00:00`, currency:'EUR', source:'Manual', sourceType:'manual', needsReview:false, status:'posted', scheduled:false };
  }

  function savingsEntry(profileId, id, amount, date, note = 'Redovita mjesečna štednja') {
    return { id:`demo-${profileId}-${id}`, profileId, amount, date:`${date}T08:00:00`, note, goalId:`goal-${profileId}-reserve` };
  }

  function createDemoProfiles(referenceValue = new Date(), options = {}) {
    const reference = referenceDay(referenceValue, options.timezone || 'Europe/Zagreb');
    const day = (offset, requestedDay) => relativeDate(reference, offset, requestedDay);
    const personal = {
      profileId:'personal', accountName:'Moj eRačun', accountLabel:'personalAccount', initials:'ME',
      income:3500, bills:800, savingsTarget:450, guard:0.10,
      savingsBalance:6240, savingsGoal:10000, availableBalance:2840, spent:820,
      financialOpeningBalance:0, reactiveBalanceAnchor:0,
      categories:[
        { id:'food', spent:240, limit:480 }, { id:'transport', spent:100, limit:200 },
        { id:'shopping', spent:120, limit:240 }, { id:'healthBeauty', spent:40, limit:80 },
        { id:'entertainment', spent:60, limit:120 }, { id:'utilities', spent:200, limit:400 },
        { id:'other', spent:60, limit:120 }
      ],
      incomeCategories:clone(options.incomeCategories || incomeCategories),
      transactions:[], savingsEntries:[],
      savingsHistory:[350,375,400,400,425,450,450], savingsHistoryReferenceMonth:reference.slice(0, 7),
      goalBuckets:[{ id:'goal-personal-reserve', name:'Fond za hitne slučajeve', target:10000, current:6240, dueDate:day(12, 28), icon:'◎', primary:true, roundUpsEnabled:false }],
      recurring:[
        { id:'demo-personal-rent', name:'Najamnina', amount:650, category:'utilities', day:1, startDate:day(1, 1), enabled:true, lastProcessed:reference },
        { id:'demo-personal-internet', name:'Internet', amount:30, category:'utilities', day:15, startDate:day(1, 15), enabled:true, lastProcessed:reference }
      ],
      automationRules:[], dismissedNotifications:{}
    };
    const historicalIncome = [3000,3100,3200,3200,3300,3300];
    const historicalExpenses = [2000,2100,2100,2100,2200,2200];
    for (let index = 0; index < 6; index += 1) {
      const offset = index - 6;
      personal.transactions.push(
        transaction('personal', `salary-${offset}`, 'Plaća', historicalIncome[index], 'salary', 'income', day(offset, 1)),
        transaction('personal', `expenses-${offset}`, 'Prethodni mjesečni troškovi', historicalExpenses[index], 'other', 'expense', day(offset, 15))
      );
      personal.savingsEntries.push(savingsEntry('personal', `saving-${offset}`, personal.savingsHistory[index], day(offset, 5)));
    }
    personal.transactions.push(transaction('personal', 'salary-current', 'Plaća', 3500, 'salary', 'income', day(0, 1)));
    [
      ['groceries', 'Konzum', 140, 'food', 3], ['market', 'Tržnica Dolac', 100, 'food', 8],
      ['fuel', 'INA', 60, 'transport', 4], ['transit', 'ZET', 40, 'transport', 9],
      ['shopping', 'Kućanske potrepštine', 120, 'shopping', 5], ['health', 'dm', 40, 'healthBeauty', 6],
      ['cinema', 'Kino i događaji', 60, 'entertainment', 10], ['utilities', 'HEP i komunalne usluge', 200, 'utilities', 2],
      ['other', 'Ostale svakodnevne potrebe', 60, 'other', 7]
    ].forEach(([id, name, amount, category, requestedDay]) => personal.transactions.push(transaction('personal', id, name, amount, category, 'expense', day(0, requestedDay))));
    personal.savingsEntries.push(
      savingsEntry('personal', 'saving-current-1', 300, day(0, 1), 'Automatska štednja'),
      savingsEntry('personal', 'saving-current-2', 100, day(0, 5), 'Dodatna uplata'),
      savingsEntry('personal', 'saving-current-3', 50, day(0, 10), 'Uplata u sigurnosnu rezervu')
    );

    const business = {
      profileId:'business', accountName:'Elektronički računi d.o.o.', accountLabel:'businessAccount', initials:'ER',
      income:6500, bills:1200, savingsTarget:900, guard:0.10,
      savingsBalance:12000, savingsGoal:20000, availableBalance:8000, spent:1500,
      financialOpeningBalance:0, reactiveBalanceAnchor:0,
      categories:[
        { id:'software', name:'Softver', icon:'S', spent:300, limit:600, isCustom:true },
        { id:'travel', name:'Putovanja', icon:'P', spent:450, limit:900, isCustom:true },
        { id:'marketing', name:'Marketing', icon:'M', spent:400, limit:800, isCustom:true },
        { id:'office', name:'Ured', icon:'U', spent:350, limit:700, isCustom:true }
      ],
      incomeCategories:clone(options.incomeCategories || incomeCategories),
      transactions:[], savingsEntries:[], savingsHistory:[650,700,750,800,850,850,900], savingsHistoryReferenceMonth:reference.slice(0, 7),
      goalBuckets:[{ id:'goal-business-reserve', name:'Poslovna rezerva', target:20000, current:12000, dueDate:day(12, 28), icon:'◎', primary:true, roundUpsEnabled:false }],
      recurring:[
        { id:'demo-business-office', name:'Uredski najam', amount:800, category:'office', day:1, startDate:day(1, 1), enabled:true, lastProcessed:reference },
        { id:'demo-business-software', name:'Adobe Creative Cloud', amount:75, category:'software', day:15, startDate:day(1, 15), enabled:true, lastProcessed:reference }
      ],
      automationRules:[], dismissedNotifications:{}
    };
    for (let index = 0; index < 6; index += 1) {
      const offset = index - 6;
      business.transactions.push(
        transaction('business', `income-${offset}`, 'Klijentski računi', 6000, 'freelance', 'income', day(offset, 1)),
        transaction('business', `expenses-${offset}`, 'Prethodni poslovni troškovi', 3500, 'office', 'expense', day(offset, 15))
      );
      business.savingsEntries.push(savingsEntry('business', `saving-${offset}`, business.savingsHistory[index], day(offset, 5), 'Poslovna rezerva'));
    }
    business.transactions.push(transaction('business', 'income-current', 'Klijentski računi', 6500, 'freelance', 'income', day(0, 1)));
    [['software', 'Softverske pretplate', 300], ['travel', 'Službeno putovanje', 450], ['marketing', 'Google Ads', 400], ['office', 'Uredske potrepštine', 350]].forEach(([category, name, amount], index) => business.transactions.push(transaction('business', category, name, amount, category, 'expense', day(0, index + 2))));
    business.savingsEntries.push(savingsEntry('business', 'saving-current', 900, day(0, 5), 'Poslovna rezerva'));

    return { personal, business };
  }

  function createDemoAppState(referenceValue = new Date(), options = {}) {
    const profiles = createDemoProfiles(referenceValue, options);
    const state = MerCore.createAccountStore(profiles.personal, profiles.business, options);
    return { ...state, version:6, bankConnections:[] };
  }

  return { createProfiles:createDemoProfiles, createDemoProfiles, createDemoAppState, referenceDay };
});
