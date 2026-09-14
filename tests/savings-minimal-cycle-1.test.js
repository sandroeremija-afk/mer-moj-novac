'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { savingsDetail, sameOwner } = require('../savings-minimal.js');
const personal = {
  profileId:'personal', sessionId:'one', authenticated:true,
  profile:{
    goalBuckets:[{ id:'reserve', name:'Pričuva', target:1000, current:750, primary:true }, { id:'foreign', profileId:'business', name:'Business vault', current:900000, target:1000000 }],
    savingsHistory:[100.01, 200.02, 50.03],
    savingsEntries:[{ id:'first', goalId:'reserve', date:'2026-09-01', amount:100 }, { id:'latest', profileId:'personal', goalId:'reserve', date:'2026-09-08', amount:50 }, { id:'foreign', profileId:'business', goalId:'reserve', date:'2026-09-09', amount:900000 }]
  }
};
test('Savings summary preserves exact cent totals and original reactive state', () => {
  const before = JSON.stringify(personal), result = savingsDetail(personal);
  assert.equal(result.total, 350.06); assert.equal(result.average, 350.06 / 3);
  assert.equal(JSON.stringify(personal), before); assert.deepEqual(result.history, [100.01, 200.02, 50.03]);
});
test('Goal detail uses selected goal only and refuses goals from another profile', () => {
  const result = savingsDetail(personal, 'reserve');
  assert.equal(result.percent, 75); assert.equal(result.remaining, 250);
  assert.deepEqual(result.entries.map(entry => entry.id), ['latest', 'first']);
  assert.equal(result.goals.length, 1); assert.equal(savingsDetail(personal, 'foreign'), null);
});
test('Empty, malformed and extreme amounts cannot break ratios or display NaN', () => {
  assert.equal(savingsDetail(null).total, 0); assert.deepEqual(savingsDetail({ profile:{} }).entries, []);
  const result = savingsDetail({ profileId:'personal', profile:{ savingsHistory:[NaN, Infinity, -10, 0], goalBuckets:[{ id:'large', current:12500000, target:1 }], savingsEntries:[{ date:'bad', amount:3 }, { date:'2026-09-01', amount:-1 }] } }, 'large');
  assert.equal(result.percent, 100); assert.equal(result.remaining, 0); assert.equal(result.total, 0); assert.equal(result.entries.length, 0);
});
test('Signed savings adjustments retain their amount and original currency in itemized details', () => {
  const result = savingsDetail({ profileId:'personal', profile:{ savingsEntries:[{ id:'withdrawal', date:'2026-09-01', amount:-50, currency:'USD' }] } });
  assert.equal(result.entries.length, 1); assert.equal(result.entries[0].amount, -50); assert.equal(result.entries[0].currency, 'USD');
});
test('Popup owner invalidates on account, session or authentication changes', () => {
  const owner = { profileId:'personal', sessionId:'one' };
  assert.equal(sameOwner(personal, owner), true);
  assert.equal(sameOwner({ ...personal, profileId:'business' }, owner), false);
  assert.equal(sameOwner({ ...personal, sessionId:'two' }, owner), false);
  assert.equal(sameOwner({ ...personal, authenticated:false }, owner), false);
  assert.equal(sameOwner(null, owner), false);
});
test('Rapid active-profile projections remain isolated with hundreds of contributions', () => {
  for (let run = 0; run < 50; run += 1) {
    const id = run % 2 ? 'personal' : 'business';
    const snapshot = { profileId:id, profile:{ goalBuckets:[{ id:'goal', current:run, target:100 }], savingsEntries:Array.from({ length:600 }, (_, i) => ({ id:String(i), goalId:'goal', profileId:i % 2 ? 'personal' : 'business', date:'2026-09-01', amount:i + 1 })) } };
    const detail = savingsDetail(snapshot, 'goal');
    assert.equal(detail.entries.length, 300); assert.ok(detail.entries.every(entry => entry.profileId === id)); assert.ok(Math.abs(detail.percent - run) < 1e-10);
  }
});
