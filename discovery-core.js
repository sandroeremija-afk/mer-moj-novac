(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./enterprise-core.js'):root.MerEnterpriseCore);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.MerDiscovery=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(E){
  'use strict';
  const list=value=>Array.isArray(value)?value:[];
  const key=value=>String(value??'').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase().replace(/đ/g,'d').replace(/\s+/g,' ').trim();
  const day=value=>String(value||'').slice(0,10);
  const DAY=86400000;
  const dateNumber=value=>Date.parse(day(value)+'T00:00:00Z');
  const addDays=(value,count)=>new Date(dateNumber(value)+count*DAY).toISOString().slice(0,10);
  function monthGenitive(date,language='hr') {
    const value=new Date(day(date)+'T12:00:00Z');
    if(!Number.isFinite(value.getTime()))return '';
    return new Intl.DateTimeFormat(language==='en'?'en-GB':'hr-HR',language==='en'?{month:'long',timeZone:'UTC'}:{day:'numeric',month:'long',timeZone:'UTC'}).formatToParts(value).find(part=>part.type==='month')?.value||'';
  }
  // The index is rebuilt from the active profile, never retained across account switches.
  function search(profile,profileId,query,{label=category=>category.name||category.nameKey||category.id}={}) {
    const tokens=key(query).split(' ').filter(Boolean);
    if(!tokens.length||!profile||profile.profileId&&profile.profileId!==profileId)return [];
    const owns=item=>item&&(!item.profileId||item.profileId===profileId);
    const matches=value=>tokens.every(token=>key(value).includes(token));
    const categories=[...list(profile.categories),...list(profile.incomeCategories)].filter(owns);
    const categoryMap=new Map(categories.map(category=>[category.id,label(category)]));
    const results=[];
    categories.forEach(category=>{const name=label(category);if(matches(`${name} ${category.id}`))results.push({kind:list(profile.categories).includes(category)?'category':'income-category',id:category.id,label:name,profileId});});
    list(profile.goalBuckets).filter(owns).forEach(goal=>{if(matches(goal.name))results.push({kind:'goal',id:goal.id,label:goal.name,profileId});});
    list(profile.transactions).filter(owns).filter(tx=>matches([tx.name,tx.title,tx.merchantName,tx.rawDescription,tx.description,categoryMap.get(tx.category||tx.categoryId),tx.date,tx.source].join(' '))).sort((a,b)=>key(a.merchantName||a.name||a.title).localeCompare(key(b.merchantName||b.name||b.title))||String(b.date).localeCompare(String(a.date))).forEach(tx=>results.push({kind:'transaction',id:tx.id,label:tx.name||tx.title||tx.merchantName||'Transakcija',merchant:tx.merchantName||tx.name||tx.title||'Transakcija',date:day(tx.date),status:tx.status,offlineDraft:tx.offlineDraft===true,type:tx.type,amount:Number(tx.amount)||0,currency:tx.currency,profileId}));
    return results;
  }
  function projectedIncome(profile,reference,options={}) {
    const through=addDays(reference,30),currency=options.currency||'EUR';
    const rows=E.transactionsFor(profile,reference,options,true).filter(tx=>tx.type==='income'&&tx.amountCents>0&&(!tx.currency||tx.currency===currency));
    const events=rows.filter(tx=>tx.date>reference&&tx.date<=through).map(tx=>({id:`income-${tx.id}`,date:tx.date,name:tx.name||tx.title||tx.merchantName||'Prihod',amountCents:tx.amountCents,kind:'income',source:'scheduled'}));
    const patterns=E.recurringPatterns({...profile,transactions:rows.filter(tx=>tx.date<=reference).map(tx=>({...tx,type:'expense'}))},reference,options);
    patterns.forEach(pattern=>{
      if(pattern.nextDate<=reference||pattern.nextDate>through||pattern.currency!==currency)return;
      if(events.some(event=>key(event.name)===key(pattern.merchant)&&Math.abs(dateNumber(event.date)-dateNumber(pattern.nextDate))<=7*DAY))return;
      events.push({id:`income-${pattern.id}`,date:pattern.nextDate,name:pattern.merchant,amountCents:pattern.amountCents,kind:'income',source:'pattern'});
    });
    return events;
  }
  // Income is a projection layer only: safe-to-spend and the posted ledger are unchanged.
  function forecastChart(profile,reference,options={}) {
    const forecast=E.forecastCashFlow(profile,reference,options);
    const events=[...forecast.bills.map(bill=>({...bill,name:bill.name||bill.merchant,kind:'expense'})),...projectedIncome(profile,forecast.referenceDate,options)].sort((a,b)=>a.date.localeCompare(b.date));
    let income=0;
    const series=forecast.series.map(point=>{income+=events.filter(event=>event.kind==='income'&&event.date===point.date).reduce((sum,event)=>sum+event.amountCents,0);return {...point,balanceCents:point.balanceCents+income,events:events.filter(event=>event.date===point.date)};});
    const low=Math.min(0,...series.map(point=>point.balanceCents)),high=Math.max(100,...series.map(point=>point.balanceCents));
    const rough=(high-low)/4,exponent=10**Math.floor(Math.log10(rough)),step=[1,2,2.5,5,10].map(n=>n*exponent).find(n=>n>=rough)||rough;
    const minimum=Math.floor(low/step)*step,maximum=Math.ceil(high/step)*step,range=Math.max(1,maximum-minimum);
    const ticks=[];for(let value=minimum;value<=maximum+step/100;value+=step)ticks.push(Math.round(value));
    return {forecast,series,events,minimum,maximum,ticks,range};
  }
  return Object.freeze({key,search,monthGenitive,projectedIncome,forecastChart});
});
