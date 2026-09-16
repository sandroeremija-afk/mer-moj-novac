'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {availableMonths, buildReport} = require('../export-core.js');

const row = (date, extra = {}) => ({date, amount:25, type:'expense', profileId:'personal', ...extra});
const options = (transactions = [], extra = {}) => ({
  profile:{profileId:'personal', transactions, savingsEntries:[]},
  profileId:'personal', referenceDate:'2026-09-16', context:'activity', language:'hr', timezone:'Europe/Zagreb', ...extra
});

test('month choices contain unique actual months newest first with Croatian names and years', () => {
  const result = availableMonths(options([row('2026-07-02'), row('2026-09-02'), row('2026-08-02'), row('2026-09-01'), row('2025-12-31')]));
  assert.deepEqual(result, [
    {value:'2026-08', label:'Kolovoz 2026'},
    {value:'2026-07', label:'Srpanj 2026'}, {value:'2025-12', label:'Prosinac 2025'}
  ]);
  assert.deepEqual(availableMonths(options([row('2026-08-02')], {language:'en'})), [{value:'2026-08', label:'August 2026'}]);
});

test('all contexts list only dates from the corresponding active profile source', () => {
  const state = options([row('2026-09-02'), row('2026-07-02'), row('2025-01-01', {profileId:'business'})]);
  state.profile.savingsEntries = [row('2026-08-01'), row('2026-06-01', {amount:-5}), row('2024-01-01', {profileId:'business'})];
  for (const context of ['activity', 'budget', 'insights']) {
    assert.deepEqual(availableMonths({...state, context}).map(month => month.value), ['2026-07']);
  }
  assert.deepEqual(availableMonths({...state, context:'savings'}).map(month => month.value), ['2026-08', '2026-06']);
  assert.throws(() => availableMonths({...state, profileId:'business'}), /does not match/);
});

test('malformed rows and future dates do not create historical choices', () => {
  const state = options([
    null, {}, row('2026-02-30'), row('2026-03-01', {amount:'invalid'}), row('2026-04-01', {type:'deposit'}),
    row('2026-10-01', {scheduled:true}), row('2026-09-17'), row('2026-06-01T99:99:00'), row('2026-07-01')
  ]);
  assert.deepEqual(availableMonths(state).map(month => month.value), ['2026-07']);
  assert.deepEqual(availableMonths(options()), []);
  assert.deepEqual(availableMonths(options([], {profile:{transactions:null,savingsEntries:null}})), []);
});

test('month boundaries follow report timezone and authoritative booking dates', () => {
  const state = options([row('2026-08-31T23:30:00Z'), row('2026-07-31', {timestamp:'2026-07-31T23:30:00Z'})]);
  assert.deepEqual(availableMonths(state).map(month => month.value), ['2026-07']);
  assert.deepEqual(availableMonths({...state, timezone:'America/Los_Angeles'}).map(month => month.value), ['2026-08', '2026-07']);
  assert.deepEqual(availableMonths({...state, timezone:'not/a/timezone'}), availableMonths(state));
  for (const month of availableMonths(state)) {
    assert.equal(buildReport({...state,timeframe:'custom-month',month:month.value}).recordCount, 1);
  }
});

test('history recomputes from added and removed data without caching another profile', () => {
  const state = options([row('2026-08-01')]);
  assert.deepEqual(availableMonths(state).map(month => month.value), ['2026-08']);
  state.profile.transactions.push(row('2026-07-01'));
  assert.deepEqual(availableMonths(state).map(month => month.value), ['2026-08', '2026-07']);
  state.profile.transactions.shift();
  assert.deepEqual(availableMonths(state).map(month => month.value), ['2026-07']);
  const business = {...state, profileId:'business', profile:{profileId:'business',transactions:[row('2026-06-01',{profileId:'business'})]}};
  assert.deepEqual(availableMonths(business).map(month => month.value), ['2026-06']);
  Object.freeze(state.profile.transactions[0]);Object.freeze(state.profile.transactions);Object.freeze(state.profile);
  assert.deepEqual(availableMonths(state).map(month => month.value), ['2026-07']);
});

test('leap month choices still produce exact report bounds and totals', () => {
  const state = options([row('2024-02-29', {amount:12.35}), row('2024-03-01', {amount:900})]);
  const report = buildReport({...state, timeframe:'custom-month', month:availableMonths(state)[1].value});
  assert.equal(report.period.start, '2024-02-01');
  assert.equal(report.period.end, '2024-02-29');
  assert.equal(report.recordCount, 1);
  assert.equal(report.sections[0].rows[0][5], '12.35');
});

test('current-month-only data yields no previous choices without changing current or all-time exports', () => {
  const state = options([row('2026-09-01'), row('2026-09-16'), row('2026-10-01', {scheduled:true})]);
  assert.deepEqual(availableMonths(state), []);
  assert.equal(buildReport({...state,timeframe:'monthly'}).recordCount, 2);
  assert.equal(buildReport({...state,timeframe:'all'}).recordCount, 3);
  assert.deepEqual(availableMonths({...state,referenceDate:'2026-10-01'}), [{value:'2026-09',label:'Rujan 2026'}]);
  const january = options([row('2025-12-31'),row('2026-01-01')],{referenceDate:'2026-01-01'});
  assert.deepEqual(availableMonths(january), [{value:'2025-12',label:'Prosinac 2025'}]);
});
