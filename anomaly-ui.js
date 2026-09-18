(function installAnomalyAlert() {
  'use strict';
  function refresh() {
    const host=document.querySelector('#spendingAnomalyAlert');
    if(!host || !window.MerAnomalies)return;
    const en=currentLang==='en',privateMode=Boolean(appState.settings.hideBalances);
    const result=MerAnomalies.detect(state,appReferenceDate,{profileId:appState.activeAccount,currency:appState.settings.currency,timezone:appState.settings.timezone});
    const anomaly=result.anomalies[0];
    host.hidden=!anomaly;
    if(!anomaly){host.replaceChildren();return;}
    const category=categoryName(anomaly.categoryId);
    // Construct text nodes: imported category names are untrusted input.
    const copy=document.createElement('div'),title=document.createElement('strong'),description=document.createElement('p');
    title.textContent=en?'A change in your spending pattern':'Promjena u obrascu potrošnje';
    description.textContent=privateMode
      ? (en?'Higher category spending this week. Open Mer AI for context.':'Povećana potrošnja u kategoriji ovaj tjedan. Mer AI može pomoći s pregledom.')
      : en
        ? `${category}: +${new Intl.NumberFormat('en-IE',{maximumFractionDigits:0}).format(anomaly.growthPercent)}% in the last 7 days versus the weekly average of the preceding 4 weeks.`
        : `${category}: +${new Intl.NumberFormat('hr-HR',{maximumFractionDigits:0}).format(anomaly.growthPercent)}% u zadnjih 7 dana u odnosu na tjedni prosjek prethodna 4 tjedna.`;
    description.setAttribute('data-monetary','');
    const button=document.createElement('button');
    button.type='button';button.className='secondary-button';
    button.textContent=en?'Ask Mer AI':'Pitaj Mer AI';
    button.addEventListener('click',event=>{event.stopPropagation();window.MerAssistantUi?.open();});
    copy.append(title,description);host.replaceChildren(copy,button);
  }
  window.MerAnomalyUI=Object.freeze({refresh});
  refresh();
})();
