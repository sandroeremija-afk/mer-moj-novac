(function exposeInsightCharts(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerInsightCharts = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createInsightCharts() {
  'use strict';
  const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const finite = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  function copy(options) {
    const en = String(options.locale || '').startsWith('en');
    return en ? {change:'Change from previous interval',unavailable:'No comparable previous value',hidden:'Amounts hidden',date:'Select chart date',hint:'Hover, tap or use the arrow keys to explore.',empty:'No transactions in this period.'} : {change:'Promjena prema prethodnom razdoblju',unavailable:'Nema usporedive prethodne vrijednosti',hidden:'Iznosi su skriveni',date:'Odaberite datum na grafikonu',hint:'Pomaknite pokazivač, dodirnite graf ili koristite strelice.',empty:'Nema transakcija u ovom razdoblju.'};
  }
  function money(value, options) {
    const n = finite(value);
    return new Intl.NumberFormat(options.locale || 'hr-HR',{style:'currency',currency:options.currency || 'EUR',minimumFractionDigits:n===0?0:2,maximumFractionDigits:n===0?0:2}).format(n);
  }
  function dateLabel(point, data, options) {
    const key = String(point.key || point.date || '');
    const date = new Date(`${key.slice(0,10)}T12:00:00Z`);
    // Keys are calendar buckets, not instants: never shift them across timezones.
    const calendar = key.length===4 ? new Date(`${key}-01-01T12:00:00Z`) : key.length===7 ? new Date(`${key}-01T12:00:00Z`) : date;
    if (Number.isNaN(calendar.getTime())) return key;
    const fields = data.granularity==='year' ? {year:'numeric'} : data.granularity==='month' ? {month:'long',year:'numeric'} : {day:'numeric',month:'long',year:'numeric'};
    const label = new Intl.DateTimeFormat(options.locale || 'hr-HR',{...fields,timeZone:'UTC'}).format(calendar);
    if(point.opening)return `${String(options.locale || '').startsWith('en')?'Opening balance':'Početno stanje'} · ${label}`;
    return data.granularity==='hour' ? `${label} · ${key.slice(11,13) || '00'}:00` : label;
  }
  function geometry(data, mode) {
    const series = Array.isArray(data?.series) ? data.series : [];
    const values = series.map(point => finite(point[mode]));
    const min = Math.min(0,...values), max = Math.max(0,...values), range = max-min || 1;
    const y = value => 174-(finite(value)-min)/range*154;
    const points = values.map((value,index) => ({x:24+index/Math.max(1,values.length-1)*592,y:y(value),value}));
    // Midpoint Beziers stay inside each interval's endpoint bounds: no invented peaks.
    const path=points.map((point,i)=>{
      if(!i)return `M${point.x.toFixed(2)},${point.y.toFixed(2)}`;
      const previous=points[i-1],middle=((previous.x+point.x)/2).toFixed(2);
      return `C${middle},${previous.y.toFixed(2)} ${middle},${point.y.toFixed(2)} ${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    }).join(' ');
    return {points,zero:y(0),min,max,path,area:points.length?`${path} L${points.at(-1).x},${y(0)} L${points[0].x},${y(0)} Z`:''};
  }
  function signedMoney(value,options){return `${value>0?'+':''}${money(value,options)}`;}
  function percent(value,options){return value===null||!Number.isFinite(value)?'—':`${value>0?'+':''}${new Intl.NumberFormat(options.locale||'hr-HR',{maximumFractionDigits:2}).format(value)}%`;}
  function growthSummary(data,options){
    const en=String(options.locale||'').startsWith('en'),first=finite(data.openingBalance??data.series[0]?.balance),last=finite(data.closingBalance??data.series.at(-1)?.balance),change=Math.round((last-first)*100)/100,growth=first===0?null:change/Math.abs(first)*100;
    return `<div class="insight-growth-summary"><span>${en?'Net balance change':'Promjena neto stanja'}<strong data-monetary>${esc(options.privateMode?copy(options).hidden:signedMoney(change,options))}</strong></span><span>${en?'Growth from opening balance':'Rast od početnog stanja'}<strong data-monetary>${esc(options.privateMode?copy(options).hidden:percent(growth,options))}</strong></span></div>`;
  }
  function categoryMarkup(breakdown,options={}){
    if(!breakdown)return '';
    const en=String(options.locale||'').startsWith('en'),hidden=copy(options).hidden,all=Array.isArray(breakdown.categories)?breakdown.categories:[],rows=all.slice(0,3).map(row=>({...row}));
    if(all.length>3){const rest=all.slice(3),sum=key=>Math.round(rest.reduce((n,row)=>n+finite(row[key]),0)*100)/100;rows.push({label:en?'Other categories':'Ostale kategorije',current:sum('current'),previous:breakdown.previous===null?null:sum('previous')});}
    const max=Math.max(1,...rows.flatMap(row=>[Math.abs(finite(row.current)),Math.abs(finite(row.previous))]));
    const formatted=n=>options.privateMode?hidden:money(n,options);
    return `<section class="insight-category-breakdown"><h3>${en?'By category':'Po kategorijama'}</h3><p>${en?'Current / previous comparable period':'Sada / prethodno usporedivo razdoblje'}</p><div class="insight-category-grid">${rows.map(row=>`<div class="insight-category-row"><span>${esc(row.label)}</span><strong data-monetary>${esc(formatted(row.current))}</strong><div class="insight-category-tracks" aria-hidden="true" data-monetary><i style="width:${Math.abs(finite(row.current))/max*100}%"></i><i class="previous" style="width:${Math.abs(finite(row.previous))/max*100}%"></i></div><small data-monetary>${en?'Previously':'Prethodno'}: ${row.previous===null?'—':esc(formatted(row.previous))}</small></div>`).join('')||`<p>${esc(copy(options).empty)}</p>`}</div></section>`;
  }
  function monthlyComparisonMarkup(series,options={}){
    const en=String(options.locale||'').startsWith('en'),rows=Array.isArray(series)?series:[],max=Math.max(1,...rows.flatMap(row=>[Math.abs(finite(row.income)),Math.abs(finite(row.expenses))]));
    return rows.map(row=>{
      const label=dateLabel({key:row.key},{granularity:'month'},options);
      return `<div class="monthly-comparison-row"><small>${esc(label)}</small><div>${['income','expenses'].map(mode=>`<div class="monthly-value-lane ${mode}"><div class="monthly-value-track" aria-hidden="true"><i data-monetary style="width:${Math.abs(finite(row[mode]))/max*100}%"></i></div><strong data-monetary aria-label="${en?(mode==='income'?'Income':'Expenses'):(mode==='income'?'Prihodi':'Troškovi')}">${esc(options.privateMode?copy(options).hidden:money(row[mode],options))}</strong></div>`).join('')}</div></div>`;
    }).join('');
  }
  function chartMarkup(data, options = {}) {
    const labels=copy(options), mode=options.mode || 'balance', {points,zero,path,area,min,max}=geometry(data,mode);
    if (!points.length || !data.totals?.count) return `<div class="notification-empty">${esc(labels.empty)}</div>${categoryMarkup(options.breakdown,options)}`;
    const gradientId=`mer-insight-area-${mode}`,isBalance=mode==='balance';
    const bars=isBalance ? `<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#31966b" stop-opacity=".24"/><stop offset="100%" stop-color="#31966b" stop-opacity="0"/></linearGradient></defs><path class="insight-trend-area" fill="url(#${gradientId})" d="${area}"/><path class="insight-trend-line" d="${path}"/>${points.filter((_p,i)=>i===0||i===points.length-1||i%Math.max(1,Math.ceil(points.length/8))===0).map(p=>`<circle class="insight-period-dot" cx="${p.x}" cy="${p.y}" r="2.5"/>`).join('')}` : points.map(point=>`<rect class="insight-trend-bar ${mode}" x="${point.x-Math.min(9,240/points.length)}" y="${Math.min(zero,point.y)}" width="${Math.min(18,480/points.length)}" height="${point.value===0?0:Math.max(1,Math.abs(zero-point.y))}" rx="2"/>`).join('');
    const grid=[20,71,123,174].map(y=>`<path class="insight-grid-line" d="M24,${y} H616"/>`).join('');
    const baseline=isBalance?`<path class="insight-opening-baseline" d="M24,${points[0].y} H616"/>`:'';
    const scale=`<div class="insight-axis-labels" data-monetary><span>${esc(options.privateMode?labels.hidden:money(max,options))}</span><span>${esc(options.privateMode?labels.hidden:money(min,options))}</span></div>`;
    const end=points.at(-1);
    return `${isBalance?growthSummary(data,options):''}<div class="interactive-insight-trend"><div class="insight-trend-readout" aria-live="polite" aria-atomic="true"><span class="trend-date"></span><strong class="trend-amount" data-monetary></strong><small class="trend-growth" data-monetary></small></div><div class="insight-plot-window" tabindex="0" role="group" aria-label="${esc(labels.date)}" aria-keyshortcuts="ArrowLeft ArrowRight Home End">${scale}<svg class="insight-trend-svg" viewBox="0 0 640 196" preserveAspectRatio="none" aria-hidden="true" data-monetary>${grid}<path class="insight-trend-baseline" d="M24,${zero} H616"/>${baseline}${bars}<line class="insight-trend-cursor" x1="${end.x}" x2="${end.x}" y1="12" y2="180"/><circle class="insight-trend-node" cx="${end.x}" cy="${end.y}" r="5"/></svg></div><div class="insight-trend-dates"><span>${esc(dateLabel(data.series[0],data,options))}</span><span>${esc(dateLabel(data.series.at(-1),data,options))}</span></div><p class="insight-trend-hint">${esc(labels.hint)}</p></div>${categoryMarkup(options.breakdown,options)}`;
  }
  function mount(host, data, options = {}) {
    host.innerHTML=chartMarkup(data,options);
    const wrapper=host.querySelector('.interactive-insight-trend');
    if(!wrapper)return;
    const mode=options.mode || 'balance',labels=copy(options), {points}=geometry(data,mode);
    const svg=wrapper.querySelector('svg'),plot=wrapper.querySelector('.insight-plot-window');
    let selectedIndex=points.length-1;
    const select=index=>{
      index=Math.max(0,Math.min(points.length-1,Math.round(index)));
      const point=data.series[index],position=points[index],growth=point.growth?.[mode];
      const date=dateLabel(point,data,options),amount=options.privateMode?labels.hidden:money(point[mode],options);
      wrapper.querySelector('.trend-date').textContent=date;
      wrapper.querySelector('.trend-amount').textContent=amount;
      wrapper.querySelector('.trend-growth').textContent=options.privateMode?labels.hidden:typeof growth==='number'&&Number.isFinite(growth)?`${labels.change}: ${growth>0?'+':''}${new Intl.NumberFormat(options.locale || 'hr-HR',{maximumFractionDigits:2}).format(growth)}%`:labels.unavailable;
      selectedIndex=index;
      plot.setAttribute('data-selected-index',String(index));
      plot.setAttribute('aria-label',`${labels.date}: ${date}: ${amount}`);
      const cursor=wrapper.querySelector('.insight-trend-cursor'),node=wrapper.querySelector('.insight-trend-node');
      cursor.setAttribute('x1',position.x);cursor.setAttribute('x2',position.x);node.setAttribute('cx',position.x);node.setAttribute('cy',position.y);
    };
    plot.addEventListener('keydown',event=>{
      const next={ArrowLeft:selectedIndex-1,ArrowDown:selectedIndex-1,ArrowRight:selectedIndex+1,ArrowUp:selectedIndex+1,Home:0,End:points.length-1}[event.key];
      if(next===undefined)return;
      event.preventDefault();select(next);
    });
    const scrub=event=>{const rect=svg.getBoundingClientRect();if(rect.width>0)select(((event.clientX-rect.left)/rect.width*640-24)/592*(points.length-1));};
    svg.addEventListener('pointermove',scrub);svg.addEventListener('pointerdown',scrub);
    select(points.length-1);
  }
  return {chartMarkup,geometry,dateLabel,mount,monthlyComparisonMarkup,categoryMarkup};
});
