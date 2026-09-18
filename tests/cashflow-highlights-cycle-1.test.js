'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Discovery=require('../discovery-core.js');
const model=(reference,balances={})=>({forecast:{referenceDate:reference},series:Array.from({length:31},(_,index)=>{
  const date=new Date(`${reference}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+index);
  return {date:date.toISOString().slice(0,10),balanceCents:balances[index]??10000,events:[]};
})});

test('cash-flow callouts use projected extrema and actual current month-end rather than day 30',()=>{
  const data=model('2026-09-18',{2:30000,4:-5000,12:12000,30:5000}),before=JSON.stringify(data);
  const highlights=Discovery.forecastHighlights(data);
  assert.deepEqual(highlights.map(point=>[point.kind,point.date,point.balanceCents,point.index]),[
    ['peak','2026-09-20',30000,2],['lowest','2026-09-22',-5000,4],['month-end','2026-09-30',12000,12]
  ]);
  assert.equal(JSON.stringify(data),before,'annotations never mutate forecast or ledger data');
});

test('month-end uses calendar boundaries including leap February and year transitions',()=>{
  for(const [reference,expected] of [['2024-02-01','2024-02-29'],['2025-02-02','2025-02-28'],['2026-12-24','2026-12-31'],['2026-01-01','2026-01-31'],['2026-09-30','2026-09-30']]){
    const highlight=Discovery.forecastHighlights(model(reference)).find(point=>point.kind==='month-end');
    assert.equal(highlight.date,expected);
  }
});

test('flat and negative forecasts produce stable highlights without inventing missing month-end data',()=>{
  const data=model('2026-09-18');data.series.forEach(point=>{point.balanceCents=-2500;});
  const result=Discovery.forecastHighlights(data);
  assert.equal(result[0].index,0);assert.equal(result[1].index,0);
  assert.ok(result.every(point=>point.balanceCents===-2500));
  assert.deepEqual(Discovery.forecastHighlights({series:[]}),[]);
  const short=model('2026-09-18');short.series=short.series.slice(0,2);
  assert.deepEqual(Discovery.forecastHighlights(short).map(point=>point.kind),['peak','lowest']);
});
