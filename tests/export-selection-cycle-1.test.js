'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {buildReport,toCsv} = require('../export-core.js');

const transaction = (id,date,amount,type='expense',extra={}) => ({id,date,amount,type,category:type==='income'?'salary':'food',currency:'EUR',profileId:'personal',name:id,...extra});
const profile = (transactions=[],extra={}) => ({profileId:'personal',accountName:'Moj eRačun',categories:[{id:'food',name:'Namirnice',limit:100},{id:'transport',limit:50}],incomeCategories:[{id:'salary',name:'Plaća'}],goalBuckets:[{id:'reserve',name:'Sigurnosna rezerva'}],transactions,savingsEntries:[],...extra});
const make = (source,options={}) => buildReport({profile:source,profileId:source.profileId,context:'activity',timeframe:'monthly',referenceDate:'2024-02-15',...options});
const compact = text => String(text).replace(/\s/g,'').replace(/−/g,'-');
const summary = (report,label) => compact(report.summary.find(item=>item.label===label)?.value);
const ids = report => report.sections[0].rows.map(row=>row.at(-1));

test('today, current month, leap-year month, year and all-time select exact calendar bounds',()=>{
  const source=profile([
    transaction('old','2023-12-31',1),transaction('jan','2024-01-31',2),transaction('yesterday','2024-02-14',3),
    transaction('today','2024-02-15',4),transaction('leap','2024-02-29',5),transaction('march','2024-03-01',6),transaction('next-year','2025-01-01',7)
  ]);
  assert.deepEqual(ids(make(source,{timeframe:'daily'})),['today']);
  const monthly=make(source);
  assert.equal(monthly.period.end,'2024-02-29');
  assert.deepEqual(ids(monthly),['yesterday','today','leap']);
  assert.equal(summary(monthly,'Troškovi'),'7,00€');
  assert.deepEqual(ids(make(source,{timeframe:'custom-month',month:'2024-01'})),['jan']);
  assert.deepEqual(ids(make(source,{timeframe:'ytd'})),['jan','yesterday','today','leap','march']);
  assert.deepEqual(ids(make(source,{timeframe:'all'})),['old','jan','yesterday','today','leap','march','next-year']);
});

test('invalid reference dates, malformed custom month and unknown selections fail safely',()=>{
  for(const referenceDate of ['2023-02-29','2024-02-30','2024-13-01','2024-2-1','today']) assert.throws(()=>make(profile(),{referenceDate}),TypeError);
  for(const month of ['2024-13','2024-00','2024-2','../../secret','']) assert.throws(()=>make(profile(),{timeframe:'custom-month',month}),TypeError);
  assert.throws(()=>make(profile(),{context:'unknown'}),TypeError);
  assert.throws(()=>make(profile(),{timeframe:'unknown'}),TypeError);
});

test('historical custom month uses real last day and never invents future booked usage',()=>{
  const source=profile([transaction('leap','2024-02-29',123),transaction('future','2025-02-28',900)]);
  const historical=make(source,{referenceDate:'2024-09-08',timeframe:'custom-month',month:'2024-02'});
  assert.equal(historical.period.end,'2024-02-29');assert.equal(summary(historical,'Troškovi'),'123,00€');
  const future=make(source,{referenceDate:'2024-09-08',timeframe:'custom-month',month:'2025-02',context:'insights'});
  assert.equal(future.period.end,'2025-02-28');assert.deepEqual(future.sections[0].rows,[]);assert.equal(summary(future,'Troškovi'),'0€');
});

test('integer-cent addition and signed adjustments stay mathematically precise',()=>{
  const source=profile([transaction('salary','2024-02-01',1000,'income'),transaction('tiny1','2024-02-01',0.1),transaction('tiny2','2024-02-01',0.2),transaction('refund','2024-02-02',-20),transaction('salary-correction','2024-02-03',-10,'income')]);
  const result=make(source);
  assert.equal(summary(result,'Prihodi'),'990,00€');assert.equal(summary(result,'Troškovi'),'-19,70€');assert.equal(summary(result,'Neto iznos'),'1.009,70€');
  assert.equal(result.sections[0].rows.find(row=>row.at(-1)==='tiny1')[5],'0.10');
  assert.equal(result.sections[0].rows.find(row=>row.at(-1)==='refund')[5],'-20.00');
});

test('decimal rounding handles ties symmetrically and normalized exponential values',()=>{
  const result=make(profile([transaction('round-up','2024-02-01','1.005'),transaction('negative-tie','2024-02-02','-1.005'),transaction('exponent','2024-02-03',1e-2)]));
  assert.deepEqual(result.sections[0].rows.map(row=>row[5]),['1.01','-1.01','0.01']);assert.equal(summary(result,'Troškovi'),'0,01€');
});

test('pending bank records, future scheduled entries, cancelled records and offline drafts never enter aggregates',()=>{
  const source=profile([
    transaction('booked','2024-02-01',10),transaction('bank-pending','2024-02-02',20,'expense',{status:'pending'}),
    transaction('future','2024-02-29',30,'income',{status:'scheduled',scheduled:true}),transaction('draft','2024-02-03',40,'income',{offlineDraft:true}),
    transaction('cancelled','2024-02-04',50,'expense',{status:'cancelled'}),transaction('due','2024-02-05',60,'income',{status:'scheduled',scheduled:true})
  ]);
  const activity=make(source);assert.equal(activity.recordCount,6);assert.equal(summary(activity,'Prihodi'),'60,00€');assert.equal(summary(activity,'Troškovi'),'10,00€');
  const statuses=Object.fromEntries(activity.sections[0].rows.map(row=>[row.at(-1),row[7]]));
  assert.equal(statuses.future,'Zakazano');assert.equal(statuses['bank-pending'],'Na čekanju');assert.equal(statuses.draft,'Izvanmrežni nacrt');assert.equal(statuses.due,'Knjiženo');assert.equal(statuses.cancelled,'Otkazano');
  const insights=make(source,{context:'insights'});assert.equal(insights.recordCount,2);assert.equal(summary(insights,'Neto iznos'),'50,00€');
});

test('due-date rollover promotes app-scheduled records, never provider pending or drafts',()=>{
  const source=profile([transaction('due','2024-02-16',100,'income',{status:'pending',scheduled:true}),transaction('pending','2024-02-16',500,'income',{status:'pending'}),transaction('draft','2024-02-16',1000,'income',{status:'draft'})]);
  assert.equal(summary(make(source),'Prihodi'),'0€');assert.equal(summary(make(source,{referenceDate:'2024-02-16'}),'Prihodi'),'100,00€');
});

test('profile isolation filters explicit foreign rows and rejects a mismatched profile object',()=>{
  const source=profile([transaction('personal-row','2024-02-01',10),transaction('private-business-name','2024-02-01',9000,'income',{profileId:'business'})],{categories:[{id:'food',name:'Namirnice',limit:100},{id:'private-business-category',name:'Private Business Category',limit:10000,profileId:'business'}]});
  const activity=make(source);assert.equal(activity.recordCount,1);assert.doesNotMatch(JSON.stringify(activity),/private-business-name/);
  const budget=make(source,{context:'budget'});assert.doesNotMatch(JSON.stringify(budget),/Private Business Category/);assert.equal(budget.sections[0].rows.length,1);
  assert.throws(()=>make(source,{profileId:'business'}),/does not match/);
  const business=profile([transaction('business-only','2024-02-01',550,'income',{profileId:'business'})],{profileId:'business',accountName:'Elektronički računi d.o.o.'});
  assert.equal(summary(make(business),'Prihodi'),'550,00€');assert.deepEqual(ids(make(business)),['business-only']);
});

test('legacy rows without profileId remain scoped to the explicitly passed profile without mutation',()=>{
  const source=profile([{id:'legacy',date:'2024-02-01',amount:50,name:'Legacy',category:'food'}]);const before=JSON.stringify(source);
  Object.freeze(source.transactions[0]);Object.freeze(source.transactions);Object.freeze(source);
  for(const context of ['activity','budget','savings','insights']) make(source,{context});
  assert.equal(JSON.stringify(source),before);assert.equal(make(source).recordCount,1);
});

test('activity preserves original currencies while all aggregates avoid cross-currency addition',()=>{
  const source=profile([transaction('eur','2024-02-01',10),transaction('usd','2024-02-02',3000,'income',{currency:'USD'}),transaction('eur-income','2024-02-03',100,'income')]);
  for(const context of ['activity','budget','insights']) {
    const result=make(source,{context});assert.ok(result.notes.some(note=>note.includes('drugim valutama')));
    if(context!=='budget') {assert.equal(summary(result,'Prihodi'),'100,00€');assert.equal(summary(result,'Neto iznos'),'90,00€');}
  }
  assert.equal(make(source).sections[0].rows.find(row=>row.at(-1)==='usd')[6],'USD');
  const usd=make(source,{currency:'USD'});assert.equal(summary(usd,'Prihodi'),'3.000,00USD');
});

test('budget report groups selected usage and clearly labels limits as current monthly settings',()=>{
  const source=profile([transaction('one','2024-01-01',25),transaction('two','2024-02-01',40),transaction('three','2024-02-02',-5),transaction('unknown','2024-02-03',7,'expense',{category:'deleted'})]);
  const result=make(source,{context:'budget',timeframe:'all'});
  const food=result.sections[0].rows.find(row=>row[0]==='Namirnice');assert.deepEqual(food,['Namirnice','100.00','60.00','EUR','3']);
  assert.ok(result.sections[0].rows.some(row=>row[0]==='Nekategorizirano (deleted)'&&row[2]==='7.00'));
  assert.ok(result.sections[0].columns.includes('Trenutačni mjesečni limit'));assert.ok(result.notes.some(note=>note.includes('ne povijesni limiti')));
  assert.equal(summary(result,'Troškovi u odabranom razdoblju'),'67,00€');assert.equal(summary(result,'Ukupni trenutačni mjesečni limiti'),'150,00€');
});

test('savings report includes goal, profile, dates, withdrawals and scheduled entries',()=>{
  const source=profile([],{savingsEntries:[{id:'deposit',date:'2024-02-01',amount:100,goalId:'reserve',profileId:'personal'},{id:'withdrawal',date:'2024-02-02',amount:-20,goalId:'reserve'},{id:'later',date:'2024-02-20',amount:500,goalId:'deleted'},{id:'foreign-profile',date:'2024-02-03',amount:5000,profileId:'business'},{id:'usd',date:'2024-02-03',amount:900,currency:'USD'}]});
  const result=make(source,{context:'savings'});assert.equal(result.recordCount,4);assert.equal(summary(result,'Neto ušteđeno'),'80,00€');
  assert.equal(result.sections[0].rows[0][2],'Sigurnosna rezerva');assert.equal(result.sections[0].rows[0][6],'Moj eRačun');
  assert.equal(result.sections[0].rows.find(row=>row.at(-1)==='withdrawal')[3],'Isplata');
  assert.equal(result.sections[0].rows.find(row=>row.at(-1)==='later')[7],'Zakazano');assert.doesNotMatch(JSON.stringify(result),/foreign-profile/);
});

test('insights series uses hours, monthly days, annual months and historical months appropriately',()=>{
  const source=profile([transaction('old','2023-12-01',100,'income'),transaction('jan','2024-01-01',100,'income'),transaction('feb','2024-02-15T08:30:00',20),transaction('no-time','2024-02-15',5)]);
  const daily=make(source,{context:'insights',timeframe:'daily'});assert.equal(daily.sections[0].rows.length,25);assert.deepEqual(daily.sections[0].rows.find(row=>row[0]==='08:00'),['08:00','0.00','20.00','-20.00','EUR','1']);assert.ok(daily.sections[0].rows.some(row=>row[0]==='Vrijeme nije zabilježeno'));
  const monthly=make(source,{context:'insights'});assert.equal(monthly.sections[0].rows.length,15);assert.equal(monthly.sections[0].rows.at(-1)[0],'2024-02-15');
  const yearly=make(source,{context:'insights',timeframe:'ytd'});assert.deepEqual(yearly.sections[0].rows.map(row=>row[0]),['2024-01','2024-02']);
  const historical=make(source,{context:'insights',timeframe:'all'});assert.deepEqual(historical.sections[0].rows.map(row=>row[0]),['2023-12','2024-01','2024-02']);
});

test('actual timezone-aware timestamps are bucketed in configured timezone; date-only rows are not shifted',()=>{
  const source=profile([transaction('utc','2024-02-14T23:30:00Z',10),transaction('literal','2024-02-14',20)]);
  const zagreb=make(source,{context:'insights',timeframe:'daily',timezone:'Europe/Zagreb'});assert.equal(summary(zagreb,'Troškovi'),'10,00€');assert.equal(zagreb.sections[0].rows.find(row=>row[0]==='00:00')[2],'10.00');
  const utc=make(source,{timeframe:'daily',timezone:'UTC'});assert.equal(utc.recordCount,0);
  assert.equal(make(source,{timeframe:'daily',timezone:'not/a/timezone'}).recordCount,1);
});

test('separate timestamps provide timezone-correct hourly clocks without shifting authoritative booking dates',()=>{
  const source=profile([
    transaction('date-only','2024-02-15',10,'expense',{timestamp:'2024-02-15T09:45:00Z'}),
    transaction('import-noon','2024-02-15T12:00:00',20,'expense',{timestamp:'2024-02-15T14:15:00Z',sourceType:'import'}),
    transaction('bank-noon','2024-02-15T12:00:00',30,'expense',{timestamp:'2024-02-15T17:30:00+02:00',sourceType:'auto'}),
    transaction('cross-day','2024-02-14',40,'expense',{timestamp:'2024-02-14T23:30:00Z'}),
    transaction('edited-booking','2024-02-15',50,'expense',{timestamp:'2024-02-13T09:00:00Z'})
  ]);
  const daily=make(source,{context:'insights',timeframe:'daily',timezone:'Europe/Zagreb'});
  assert.equal(summary(daily,'Troškovi'),'110,00€');
  assert.equal(daily.sections[0].rows.find(row=>row[0]==='10:00')[2],'10.00');
  assert.equal(daily.sections[0].rows.find(row=>row[0]==='15:00')[2],'20.00');
  assert.equal(daily.sections[0].rows.find(row=>row[0]==='16:00')[2],'30.00');
  assert.equal(daily.sections[0].rows.find(row=>row[0]==='Vrijeme nije zabilježeno')[2],'50.00');
  const previousDay=make(source,{timeframe:'daily',referenceDate:'2024-02-14'});
  assert.deepEqual(ids(previousDay),['cross-day']);assert.equal(previousDay.sections[0].rows[0][1],'');
});

test('synthetic bank noon is never presented as a real hour when timestamp has no usable matching clock',()=>{
  const source=profile([
    transaction('missing-time','2024-02-15T12:00:00',10,'expense',{timestamp:'2024-02-15',sourceType:'auto'}),
    transaction('invalid-time','2024-02-15T12:00:00',20,'expense',{timestamp:'invalid',sourceType:'import'}),
    transaction('wrong-day','2024-02-15T12:00:00',30,'expense',{timestamp:'2024-02-15T23:30:00Z',sourceType:'auto'}),
    transaction('manual-clock','2024-02-15T08:45:00',40,'expense',{timestamp:'invalid',sourceType:'manual'})
  ]);
  const daily=make(source,{context:'insights',timeframe:'daily'});
  assert.equal(daily.sections[0].rows.find(row=>row[0]==='12:00')[2],'0.00');
  assert.equal(daily.sections[0].rows.find(row=>row[0]==='Vrijeme nije zabilježeno')[2],'60.00');
  assert.equal(daily.sections[0].rows.find(row=>row[0]==='08:00')[2],'40.00');
});

test('deposit and withdrawal record types are rejected outside savings entries',()=>{
  const source=profile([transaction('valid','2024-02-01',10),transaction('not-a-tx','2024-02-02',100,'deposit'),transaction('not-a-tx-either','2024-02-03',50,'withdrawal')]);
  for(const context of ['activity','budget','insights']) {
    const result=make(source,{context});assert.equal(result.recordCount,1);assert.ok(result.notes.some(note=>note.includes('neispravnim')));
    assert.doesNotMatch(JSON.stringify(result),/not-a-tx/);
  }
});

test('custom translated category callbacks and names survive unknown or deleted categories',()=>{
  const source=profile([transaction('known','2024-02-01',1),transaction('unknown','2024-02-02',2,'expense',{category:null})]);
  const result=make(source,{categoryLabel:id=>id==='food'?'Custom groceries':id,language:'en'});
  assert.equal(result.sections[0].rows[0][4],'Custom groceries');assert.equal(result.sections[0].rows[1][4],'Uncategorized');assert.equal(result.title,'Activity — transactions');
});

test('malformed data is skipped with explicit notes; null and empty states always export a complete report',()=>{
  const source=profile([null,{},transaction('nan','2024-02-01',NaN),transaction('bad-date','2024-02-30',1),transaction('bad-time','2024-02-01T99:99:99',1),transaction('bad-type','2024-02-01',1,'malformed'),transaction('unsafe','2024-02-01',1e30),transaction('valid','2024-02-01',0)]);
  assert.equal(make(source).recordCount,1);assert.ok(make(source).notes.some(note=>note.includes('neispravnim')));
  for(const context of ['activity','budget','savings','insights']) {
    const result=make(profile([],{categories:null,incomeCategories:null,savingsEntries:null,goalBuckets:null}),{context});
    assert.equal(result.recordCount,0);assert.ok(result.sections.length);assert.ok(toCsv(result).startsWith('\uFEFF'));assert.doesNotMatch(JSON.stringify(result),/NaN|undefined|Infinity/);
  }
});

test('large batches remain cent-exact and do not modify source state',()=>{
  const source=profile(Array.from({length:750},(_,index)=>transaction(`row-${index}`,'2024-02-01',0.01)));
  const before=JSON.stringify(source);const result=make(source);
  assert.equal(result.recordCount,750);assert.equal(summary(result,'Troškovi'),'7,50€');assert.equal(JSON.stringify(source),before);assert.equal(result.sections[0].rows.length,750);
});

test('large precise monetary strings keep their final cent and overflow fails explicitly',()=>{
  const maximum=profile([transaction('large','2024-02-01','90071992547409.91','income')]);
  const result=make(maximum);assert.equal(summary(result,'Prihodi'),'90.071.992.547.409,91€');assert.equal(result.sections[0].rows[0][5],'90071992547409.91');
  maximum.transactions.push(transaction('too-much','2024-02-01',0.01,'income'));
  assert.throws(()=>make(maximum),/supported monetary range/);
});

test('CSV neutralizes formula injection, quotes multiline text and preserves negative money values',()=>{
  const source=profile([
    transaction('formula','2024-02-01',-12.5,'expense',{name:'=HYPERLINK("https://example.com")'}),
    transaction('plus','2024-02-02',1,'expense',{name:' +CMD()'}),transaction('at','2024-02-03',2,'expense',{name:'@SUM(A1)'}),
    transaction('tabs','2024-02-04',3,'expense',{name:'\tunsafe'}),transaction('quotes','2024-02-05',4,'expense',{name:'Shop, "A"\nSecond line'})
  ],{accountName:'=ACCOUNT()',categories:[{id:'food',name:'-CATEGORY()',limit:100}]});
  const csv=toCsv(make(source));assert.match(csv,/'=HYPERLINK/);assert.match(csv,/'=ACCOUNT/);assert.match(csv,/' \+CMD/);assert.match(csv,/'@SUM/);assert.match(csv,/'\tunsafe/);assert.match(csv,/'-CATEGORY/);
  assert.match(csv,/"-12\.50"/);assert.doesNotMatch(csv,/'-12\.50/);assert.match(csv,/"Shop, ""A""\nSecond line"/);assert.ok(csv.endsWith('\r\n'));
});

test('filenames are meaningful Croatian contextual names with account and selected period',()=>{
  const source=profile();
  assert.match(make(source).filenameStem,/^Aktivnost_Transakcije_Mjesec_2024-02_personal$/);
  assert.match(make(source,{context:'budget',timeframe:'custom-month',month:'2024-01'}).filenameStem,/^Budzeti_Izvoz_Mjesec_2024-01_personal$/);
  assert.match(make(source,{context:'insights',timeframe:'ytd'}).filenameStem,/^Uvidi_Izvjestaj_Godina_2024_personal$/);
  assert.match(make(source,{context:'savings',timeframe:'all'}).filenameStem,/^Stednja_Uplate_Sve_Ukupno_2024-02-15_personal$/);
});
