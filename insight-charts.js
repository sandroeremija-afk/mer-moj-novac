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
    return {points,zero:y(0),path:points.map((point,i)=>`${i?'L':'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')};
  }
  function chartMarkup(data, options = {}) {
    const labels=copy(options), mode=options.mode || 'balance', {points,zero,path}=geometry(data,mode);
    if (!points.length || !data.totals?.count) return `<div class="notification-empty">${esc(labels.empty)}</div>`;
    const bars=mode==='balance' ? `<path class="insight-trend-line" d="${path}"/>` : points.map(point=>`<rect class="insight-trend-bar ${mode}" x="${point.x-Math.min(9,240/points.length)}" y="${Math.min(zero,point.y)}" width="${Math.min(18,480/points.length)}" height="${Math.max(1,Math.abs(zero-point.y))}" rx="2"/>`).join('');
    const end=points.at(-1);
    return `<div class="interactive-insight-trend"><div class="insight-trend-readout" aria-live="polite" aria-atomic="true"><span class="trend-date"></span><strong class="trend-amount" data-monetary></strong><small class="trend-growth" data-monetary></small></div><svg class="insight-trend-svg" viewBox="0 0 640 196" preserveAspectRatio="none" aria-hidden="true" data-monetary><path class="insight-trend-baseline" d="M24,${zero} H616"/>${bars}<line class="insight-trend-cursor" x1="${end.x}" x2="${end.x}" y1="12" y2="180"/><circle class="insight-trend-node" cx="${end.x}" cy="${end.y}" r="5"/></svg><input class="insight-trend-selector" type="range" min="0" max="${points.length-1}" value="${points.length-1}" step="1" aria-label="${esc(labels.date)}"><div class="insight-trend-dates"><span>${esc(dateLabel(data.series[0],data,options))}</span><span>${esc(dateLabel(data.series.at(-1),data,options))}</span></div><p class="insight-trend-hint">${esc(labels.hint)}</p></div>`;
  }
  function mount(host, data, options = {}) {
    host.innerHTML=chartMarkup(data,options);
    const wrapper=host.querySelector('.interactive-insight-trend');
    if(!wrapper)return;
    const mode=options.mode || 'balance',labels=copy(options), {points}=geometry(data,mode);
    const svg=wrapper.querySelector('svg'),slider=wrapper.querySelector('input');
    const select=index=>{
      index=Math.max(0,Math.min(points.length-1,Math.round(index)));
      const point=data.series[index],position=points[index],growth=point.growth?.[mode];
      const date=dateLabel(point,data,options),amount=options.privateMode?labels.hidden:money(point[mode],options);
      wrapper.querySelector('.trend-date').textContent=date;
      wrapper.querySelector('.trend-amount').textContent=amount;
      wrapper.querySelector('.trend-growth').textContent=options.privateMode?labels.hidden:typeof growth==='number'&&Number.isFinite(growth)?`${labels.change}: ${growth>0?'+':''}${new Intl.NumberFormat(options.locale || 'hr-HR',{maximumFractionDigits:2}).format(growth)}%`:labels.unavailable;
      slider.value=String(index);slider.setAttribute('aria-valuetext',`${date}: ${amount}`);
      const cursor=wrapper.querySelector('.insight-trend-cursor'),node=wrapper.querySelector('.insight-trend-node');
      cursor.setAttribute('x1',position.x);cursor.setAttribute('x2',position.x);node.setAttribute('cx',position.x);node.setAttribute('cy',position.y);
    };
    slider.addEventListener('input',()=>select(Number(slider.value)));
    const scrub=event=>{const rect=svg.getBoundingClientRect();if(rect.width>0)select(((event.clientX-rect.left)/rect.width*640-24)/592*(points.length-1));};
    svg.addEventListener('pointermove',scrub);svg.addEventListener('pointerdown',scrub);
    select(points.length-1);
  }
  return {chartMarkup,geometry,dateLabel,mount};
});
