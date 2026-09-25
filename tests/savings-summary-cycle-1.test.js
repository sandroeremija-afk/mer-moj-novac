'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { savingsAggregate } = require('../savings-minimal.js');
const read = file => fs.readFileSync(require.resolve('../' + file), 'utf8');

test('aggregate summary totals all active-profile goals in cents without changing financial state', () => {
  const snapshot = { profileId:'personal', profile:{ savingsBalance:9999, savingsHistory:[700], goalBuckets:[
    { id:'reserve', current:80.01, target:100.01, primary:true },
    { id:'travel', current:20.02, target:50.02 },
    { id:'foreign', profileId:'business', current:9000, target:10000 }
  ] } };
  const before = JSON.stringify(snapshot);
  const result = savingsAggregate(snapshot);
  assert.equal(result.current,100.03);
  assert.equal(result.target,150.03);
  assert.equal(result.remaining,50);
  assert.equal(result.activeGoals,2);
  assert.equal(result.goalCount,2);
  assert.ok(Math.abs(result.percent - 100.03 / 150.03 * 100) < 1e-10);
  assert.equal(JSON.stringify(snapshot),before);
});

test('one overfunded goal does not hide another goal deficit or count as active', () => {
  const result = savingsAggregate({ profileId:'personal', profile:{ goalBuckets:[
    { id:'complete', current:150, target:100 }, { id:'open', current:0, target:100 }
  ] } });
  assert.deepEqual(result,{current:150,target:200,remaining:100,activeGoals:1,goalCount:2,percent:50});
});

test('empty and malformed snapshots stay finite and repeated profile switches never retain old totals', () => {
  const empty = {current:0,target:0,remaining:0,activeGoals:0,goalCount:0,percent:0};
  assert.deepEqual(savingsAggregate(null),empty);
  assert.deepEqual(savingsAggregate({profile:{goalBuckets:[]}}),empty);
  const malformed = savingsAggregate({profile:{goalBuckets:[null,{current:NaN,target:Infinity},{current:-20,target:-1}]}});
  assert.ok(Object.values(malformed).every(Number.isFinite));
  assert.equal(malformed.current,0); assert.equal(malformed.percent,0);
  for (const profileId of ['personal','business','personal']) {
    const result = savingsAggregate({profileId,profile:{goalBuckets:[{profileId:'personal',current:25,target:100},{profileId:'business',current:50,target:100}]}});
    assert.equal(result.current,profileId==='personal'?25:50);
    assert.equal(result.activeGoals,1);
  }
});

test('history moves intact to the top row and aggregate replaces only the duplicate hero', () => {
  const html = read('index.html');
  const layout = html.match(/<section class="savings-layout">([\s\S]*?)<\/section>/)?.[1];
  assert.ok(layout);
  assert.match(layout,/class="panel contribution-panel savings-history-card savings-top-card"/);
  assert.ok(layout.indexOf('id="contributionChart"') < layout.indexOf('id="savingsRecommendationCard"'));
  assert.doesNotMatch(layout,/savings-hero/);
  assert.equal((html.match(/id="contributionChart"/g)||[]).length,1);
  assert.match(layout,/data-layout-card="savings-history"/);
  assert.match(html,/<article class="panel savings-hero savings-aggregate-card"[\s\S]*id="savingsAggregateActiveGoals"/);
  assert.ok(html.indexOf('savings-aggregate-card') > html.indexOf('savingsRecommendationCard'));
  assert.ok(html.indexOf('savings-aggregate-card') < html.indexOf('class="panel goal-buckets-panel"'));
  assert.match(read('onboarding-core.js'),/id:'savings', view:'savings', target:'#savingsView \.goal-buckets-panel'/);
});

test('aggregate refresh updates current totals and progress without binding the summary to the primary goal', () => {
  const source = read('savings-minimal.js');
  const start = source.indexOf('function renderAggregate('), end = source.indexOf('function refresh()',start);
  assert.ok(start>=0 && end>start);
  const nodes = new Map();
  const context = {savingsAggregate,Math,money:value=>`${value} €`,say:(hr)=>hr,el:id=>{
    if (!nodes.has(id)) nodes.set(id,{textContent:'',style:{},attributes:{},setAttribute(key,value){this.attributes[key]=value;}});
    return nodes.get(id);
  }};
  vm.createContext(context); vm.runInContext(source.slice(start,end),context);
  context.renderAggregate({profileId:'personal',profile:{goalBuckets:[{current:25,target:100},{current:50,target:100}]}});
  assert.equal(nodes.get('savingsHeroCurrent').textContent,'75 €');
  assert.equal(nodes.get('savingsAggregateRemaining').textContent,'125 €');
  assert.equal(nodes.get('savingsAggregateActiveGoals').textContent,'2');
  assert.equal(nodes.get('savingsHeroTrack').attributes['aria-valuenow'],'38');
  context.renderAggregate({profileId:'business',profile:{goalBuckets:[]}});
  assert.equal(nodes.get('savingsHeroCurrent').textContent,'0 €');
  assert.equal(nodes.get('savingsAggregateActiveGoals').textContent,'0');
  assert.equal(nodes.get('savingsHeroProgress').style.width,'0%');
  assert.match(source,/renderAggregate\(s\)/);
  assert.doesNotMatch(source,/makeClickable\(doc\.querySelector\('#savingsView \.savings-hero'\)/);
  assert.doesNotMatch(read('premium.js'),/\$\('#savingsHeroCurrent'\)\.textContent=currency\(primary\.current/);
});
