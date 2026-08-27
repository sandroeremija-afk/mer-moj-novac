const test = require('node:test');
const assert = require('node:assert/strict');
const MerCore = require('../core.js');

function profileFixtures() {
  return {
    personal: {
      id:'personal',
      transactions:[
        { id:'market', type:'expense', name:'Konzum', category:'food', amount:40, date:'2026-08-10T09:00:00' },
        { id:'salary', type:'income', name:'Monthly salary', category:'salary', amount:2500, date:'2026-08-15T08:00:00' },
        { id:'taxi', type:'expense', name:'Uber Zagreb', category:'transport', amount:20, date:'2026-08-20T18:00:00', needsReview:true },
        { id:'groceries', type:'expense', name:'Lidl', category:'food', amount:40, date:'2026-08-20T12:00:00' },
        { id:'legacy', type:'expense', name:null, category:'other', amount:9, date:'not-a-date' }
      ]
    },
    business: {
      id:'business',
      transactions:[
        { id:'invoice', type:'income', name:'Client invoice', category:'freelance', amount:5000, date:'2026-08-18T10:00:00' }
      ]
    }
  };
}

test('evaluation cycle 2: Activity combines query, type and category filters safely', () => {
  const { personal } = profileFixtures();
  const transport = MerCore.filterActivityTransactions(personal, {
    query:'prijevoz',
    type:'expense',
    category:'transport',
    categoryLabels:{ transport:'Prijevoz' }
  });
  assert.deepEqual(transport.map(transaction=>transaction.id), ['taxi']);

  const salary = MerCore.filterActivityTransactions(personal.transactions, {
    query:'placa',
    category:'income:salary',
    categoryLabels:{ 'income:salary':'Plaća' }
  });
  assert.deepEqual(salary.map(transaction=>transaction.id), ['salary'], 'search is case- and diacritic-insensitive');
});

test('evaluation cycle 2: date ranges are inclusive and reversed bounds normalize predictably', () => {
  const { personal } = profileFixtures();
  const filtered = MerCore.filterActivityTransactions(personal, {
    dateFrom:'2026-08-20',
    dateTo:'2026-08-10'
  });
  assert.deepEqual(filtered.map(transaction=>transaction.id), ['taxi', 'groceries', 'salary', 'market']);
  assert.equal(filtered.some(transaction=>transaction.id==='legacy'), false, 'invalid transaction dates cannot leak into a bounded range');
});

test('evaluation cycle 2: amount sorting is stable and does not mutate the profile', () => {
  const { personal } = profileFixtures();
  const before = JSON.stringify(personal);
  const descending = MerCore.filterActivityTransactions(personal, { sort:'amount-desc' });
  assert.deepEqual(descending.map(transaction=>transaction.id), ['salary', 'market', 'groceries', 'taxi', 'legacy']);
  assert.ok(descending.indexOf(personal.transactions[0]) < descending.indexOf(personal.transactions[3]), 'equal amounts retain source order');
  assert.equal(JSON.stringify(personal), before);
  assert.notStrictEqual(descending, personal.transactions);
});

test('evaluation cycle 2: date sorting preserves time-of-day order within the same date', () => {
  const source = {
    transactions: [
      { id:'late', type:'expense', category:'food', date:'2026-08-20T18:30:00+02:00', amount:10 },
      { id:'early', type:'expense', category:'food', date:'2026-08-20T08:15:00+02:00', amount:20 },
      { id:'middle', type:'expense', category:'food', date:'2026-08-20T12:00:00+02:00', amount:30 }
    ]
  };

  assert.deepEqual(
    MerCore.filterActivityTransactions(source, { sort:'date-asc' }).map(item => item.id),
    ['early', 'middle', 'late']
  );
  assert.deepEqual(
    MerCore.filterActivityTransactions(source, { sort:'date-desc' }).map(item => item.id),
    ['late', 'middle', 'early']
  );
});

test('evaluation cycle 2: filtering remains strictly scoped to the supplied account profile', () => {
  const { personal, business } = profileFixtures();
  const personalSnapshot = JSON.stringify(personal);
  const businessSnapshot = JSON.stringify(business);
  const personalResult = MerCore.filterActivityTransactions(personal, { type:'income' });
  const businessResult = MerCore.filterActivityTransactions(business, { type:'income' });

  assert.deepEqual(personalResult.map(transaction=>transaction.id), ['salary']);
  assert.deepEqual(businessResult.map(transaction=>transaction.id), ['invoice']);
  assert.equal(personalResult.some(transaction=>transaction.id==='invoice'), false);
  assert.equal(businessResult.some(transaction=>transaction.id==='salary'), false);
  assert.equal(JSON.stringify(personal), personalSnapshot);
  assert.equal(JSON.stringify(business), businessSnapshot);
});

test('evaluation cycle 2: review queue filtering composes with dates and invalid filter inputs fail soft', () => {
  const { personal } = profileFixtures();
  const review = MerCore.filterActivityTransactions(personal, {
    reviewOnly:true,
    dateFrom:'invalid',
    dateTo:'2026-08-31',
    sort:'unsupported'
  });
  assert.deepEqual(review.map(transaction=>transaction.id), ['taxi']);
  assert.deepEqual(MerCore.filterActivityTransactions(null, { sort:'amount-desc' }), []);
});
