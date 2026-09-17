(function initializeMerPlanning(root) {
  'use strict';
  const P = root.MerPlanningCore;
  if (!P || !root.document) return;
  const el = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const english = () => typeof currentLang !== 'undefined' && currentLang === 'en';
  const say = (hr, en) => english() ? en : hr;
  const activeId = () => appState.activeAccount;
  const profile = () => appState.accounts[activeId()];
  const options = () => ({profileId:activeId(), currency:appState.settings?.currency || 'EUR', timezone:appState.settings?.timezone || 'Europe/Zagreb'});
  const money = (amountCents, currencyCode = options().currency) => root.MerCore.formatCurrency(amountCents / 100, {currency:currencyCode, locale:english() ? 'en-IE' : 'hr-HR'});
  const dateLabel = value => value ? new Intl.DateTimeFormat(english() ? 'en-IE' : 'hr-HR', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`)) : '—';
  let fireDialog, renewalsDialog, owner = null, editingRenewalId = null, renewalOriginal = null, fireDraft = null, lastReminderSignature = '';
  const fireSessions = new WeakMap();
  let firePresentation = '', renewalPresentation = '';
  let firePanel = 'capital', projectionPanel = 'overview', renewalPanel = 'list';
  function tabs(id, items, selected, attribute) {
    return `<div class="planning-tabs" role="tablist" aria-label="${say('Prikaz','View')}">${items.map(([key,label]) => `<button type="button" id="${id}-tab-${key}" role="tab" aria-controls="${id}-panel-${key}" aria-selected="${key===selected}" tabindex="${key===selected?'0':'-1'}" ${attribute}="${key}">${label}</button>`).join('')}</div>`;
  }
  function selectPanel(container, id, key, attribute) {
    container.querySelectorAll(`[${attribute}]`).forEach(button => {
      const selected = button.dataset[attribute.slice(5).replace(/-([a-z])/g, (_, character) => character.toUpperCase())] === key;
      button.setAttribute('aria-selected', String(selected)); button.setAttribute('tabindex', selected ? '0' : '-1');
    });
    container.querySelectorAll(`[data-panel-group="${id}"]`).forEach(panel => { panel.hidden = panel.id !== `${id}-panel-${key}`; });
  }
  function bindTabs(container, attribute, change) {
    container._planningTabBindings ||= new Set();
    if (container._planningTabBindings.has(attribute)) return;
    container._planningTabBindings.add(attribute);
    container.addEventListener('click', event => {
      const button = event.target.closest(`[${attribute}]`);
      if (button) change(button.dataset[attribute.slice(5).replace(/-([a-z])/g, (_, character) => character.toUpperCase())]);
    });
    container.addEventListener('keydown', event => {
      const button = event.target.closest(`[${attribute}]`);
      if (!button || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      const buttons = Array.from(container.querySelectorAll(`[${attribute}]`)), current = buttons.indexOf(button);
      const next = event.key==='Home' ? 0 : event.key==='End' ? buttons.length-1 : (current+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
      event.preventDefault(); buttons[next].click(); buttons[next].focus();
    });
  }
  function panel(id, key, selected, content) {
    return `<section id="${id}-panel-${key}" class="planning-panel" role="tabpanel" aria-labelledby="${id}-tab-${key}" data-panel-group="${id}" ${key===selected?'':'hidden'}>${content}</section>`;
  }
  const sliderDefinitions = [
    {key:'netWorth', hr:'Uloživa neto imovina', en:'Investable net worth', min:0, max:1000000, step:100, numberStep:0.01, monetary:true},
    {key:'monthlyContribution', hr:'Mjesečno izdvajanje', en:'Monthly contribution', min:0, max:10000, step:25, numberStep:0.01, monetary:true},
    {key:'monthlySpending', hr:'Mjesečni troškovi u mirovini', en:'Monthly retirement spending', min:0.01, max:10000, step:25, numberStep:0.01, monetary:true},
    {key:'annualReturn', hr:'Pretpostavljeni godišnji prinos', en:'Assumed annual return', min:-10, max:15, step:0.1},
    {key:'withdrawalRate', hr:'Godišnja stopa povlačenja', en:'Annual withdrawal assumption', min:1, max:10, step:0.1},
    {key:'inflation', hr:'Pretpostavljena inflacija', en:'Assumed inflation', min:-2, max:10, step:0.1}
  ];
  function close(node) {
    const dialogs = node ? [node] : [fireDialog, renewalsDialog];
    dialogs.forEach(dialog => { if (dialog?.open) (root.MerEnterpriseBridge?.closeModal || (item => item.close()))(dialog); });
  }
  function saveMutation(reason, change) {
    const intendedProfile = owner || activeId();
    if (intendedProfile !== activeId()) return false;
    reactiveStore.update(reason, (_, current) => { if (activeId() === intendedProfile) change(current); });
    return true;
  }
  function defaultFire() {
    const current = profile(), saved = current.enterprise?.firePlan;
    if (P.validateFire(saved).valid) return {...saved};
    return {netWorth:Math.max(0, Number(current.savingsBalance) || 0), monthlyContribution:Math.max(0, Number(current.savingsTarget) || 0), monthlySpending:Math.max(100, Number(current.derived?.monthly?.expenses) || Number(current.bills) || 1000), annualReturn:5, withdrawalRate:4, inflation:2};
  }
  function monthlyIncome() {
    const current = profile();
    return Math.max(0, Number(current.derived?.monthly?.income) || Number(current.income) || 0);
  }
  function currentFireSession() {
    const current = profile();
    if (!fireSessions.has(current)) fireSessions.set(current, {values:defaultFire(), edited:new Set()});
    return fireSessions.get(current);
  }
  function refreshFireDraft() {
    const session = currentFireSession(), defaults = defaultFire();
    sliderDefinitions.forEach(({key}) => { if (!session.edited.has(key)) session.values[key] = defaults[key]; });
    fireDraft = session.values;
  }
  function createDialog(id, prefix, section) {
    const dialog = document.createElement('dialog');
    dialog.id = id; dialog.className = 'modal planning-dialog'; dialog.setAttribute('aria-labelledby', `${prefix}Title`);
    dialog.innerHTML = `<header class="planning-head"><div class="planning-heading"><span id="${prefix}Profile"></span><h2 id="${prefix}Title"></h2></div><button type="button" class="icon-button" data-planning-close aria-label="${say('Zatvori','Close')}">×</button></header><div class="planning-body"><section id="${section}"></section></div><footer class="planning-footer"><button type="button" class="secondary-button planning-back" data-planning-back><span data-planning-back-label>${say('Natrag','Back')}</span></button><button type="button" class="secondary-button" data-planning-close>${say('Zatvori','Close')}</button>${section==='planningFire'?`<button type="button" class="primary-button" id="saveFirePlan">${say('Spremi pretpostavke','Save assumptions')}</button>`:`<button type="submit" form="renewalForm" class="primary-button" id="saveRenewalReminder">${say('Spremi podsjetnik','Save reminder')}</button>`}</footer>`;
    document.body.append(dialog);
    dialog.querySelectorAll('[data-planning-close]').forEach(button => button.addEventListener('click', () => close(dialog)));
    dialog.querySelector('[data-planning-back]').addEventListener('click', () => {
      if (root.MerPlanNavigation?.back) root.MerPlanNavigation.back(dialog); else close(dialog);
    });
    dialog.addEventListener('cancel', event => {event.preventDefault();close(dialog);});
    root.MerRuntime?.bindDialogBackdropDismiss(dialog, () => close(dialog));
    return dialog;
  }
  function ensureDialogs() {
    if (fireDialog) return;
    fireDialog = createDialog('fireSimulatorModal', 'fireSimulator', 'planningFire');
    renewalsDialog = createDialog('subscriptionRenewalsModal', 'subscriptionRenewals', 'planningRenewals');
    el('saveFirePlan').addEventListener('click', () => {
      if (!P.validateFire(fireDraft).valid) return;
      if (!saveMutation('fire-assumptions-save', current => {current.enterprise ||= {}; current.enterprise.firePlan = {...fireDraft};})) return;
      showToast(say('Pretpostavke su spremljene za ovaj profil.','Assumptions saved for this profile.'));
    });
  }
  function fireInputs(keys) {
    return sliderDefinitions.filter(item => keys.includes(item.key)).map(item => {
      const value = fireDraft[item.key], label = say(item.hr, item.en), suffix = item.monetary ? options().currency : '%';
      return `<div class="planning-slider"><label for="fire-${item.key}">${label}</label><div class="planning-value-input"><input id="fire-${item.key}" data-fire-number="${item.key}" type="number" step="${item.numberStep || item.step}" value="${value}" min="${item.min}" max="${item.monetary ? 1000000000 : item.max}" aria-label="${label}"><span>${suffix}</span></div><input type="range" data-fire-slider="${item.key}" min="${item.min}" max="${Math.max(item.max, Number(value) || 0)}" step="any" value="${value}" aria-label="${label}"></div>`;
    }).join('');
  }
  function savingsRateInput() {
    return `<div class="planning-slider planning-savings-rate"><label for="fire-savingsRate">${say('Stopa štednje od prihoda','Savings rate of income')}</label><output id="fireSavingsRateValue" for="fire-savingsRate"></output><input id="fire-savingsRate" data-fire-savings-rate type="range" min="0" max="100" step="0.1" value="0" aria-describedby="fireSavingsRateHelp"><small id="fireSavingsRateHelp"></small></div>`;
  }
  function syncFireInputs() {
    sliderDefinitions.forEach(({key}) => {
      el('fireInputs').querySelectorAll(`[data-fire-number="${key}"], [data-fire-slider="${key}"]`).forEach(input => {
        if (input === document.activeElement) return;
        if (input.type === 'range' && Number(fireDraft[key]) > Number(input.max)) input.max = String(fireDraft[key]);
        input.value = String(fireDraft[key]);
      });
    });
    const income = monthlyIncome(), contribution = Number(fireDraft.monthlyContribution) || 0, rate = income > 0 ? contribution / income * 100 : 0;
    el('fire-savingsRate').disabled = income <= 0;
    if (document.activeElement !== el('fire-savingsRate')) el('fire-savingsRate').value = String(Math.min(100, Math.max(0, rate)));
    el('fireSavingsRateValue').textContent = income > 0 ? `${rate.toFixed(1)}%` : '—';
    el('fireSavingsRateHelp').textContent = income > 0 ? say(`Mjesečni prihod profila: ${money(Math.round(income*100))}. Klizač mijenja mjesečno izdvajanje.`,`Profile monthly income: ${money(Math.round(income*100))}. The slider changes your monthly contribution.`) : say('Stopa štednje dostupna je kad profil ima mjesečni prihod. Mjesečno izdvajanje možete unijeti izravno.','The savings rate is available when this profile has monthly income. You can enter a monthly contribution directly.');
  }
  function renderFire() {
    const sections = [['capital',say('Imovina','Capital')],['savings',say('Štednja','Savings')],['assumptions',say('Pretpostavke','Assumptions')],['projection',say('Projekcija','Projection')]];
    el('planningFire').innerHTML = `${tabs('fire',sections,firePanel,'data-fire-view')}<form class="planning-inputs" id="fireInputs">${panel('fire','capital',firePanel,fireInputs(['netWorth','monthlyContribution']))}${panel('fire','savings',firePanel,savingsRateInput()+fireInputs(['monthlySpending']))}${panel('fire','assumptions',firePanel,fireInputs(['annualReturn','withdrawalRate','inflation']))}</form>${panel('fire','projection',firePanel,`<div id="fireProjection" aria-live="polite"></div>`)}`;
    bindTabs(el('planningFire'),'data-fire-view',key=>{firePanel=key;selectPanel(el('planningFire'),'fire',key,'data-fire-view');});
    bindTabs(el('planningFire'),'data-fire-projection',key=>{projectionPanel=key;selectPanel(el('fireProjection'),'fire-result',key,'data-fire-projection');});
    el('fireInputs').addEventListener('submit', event => event.preventDefault());
    el('fireInputs').addEventListener('input', event => {
      if (owner !== activeId()) return;
      if (event.target.dataset.fireSavingsRate !== undefined) {
        const rate = Math.max(0, Math.min(100, Number(event.target.value)));
        if (monthlyIncome() <= 0 || !Number.isFinite(rate)) return;
        fireDraft.monthlyContribution = Math.round(monthlyIncome() * rate) / 100;
        currentFireSession().edited.add('monthlyContribution');
        syncFireInputs(); renderProjection(); return;
      }
      const field = event.target.dataset.fireNumber || event.target.dataset.fireSlider;
      if (!field) return;
      const definition=sliderDefinitions.find(item=>item.key===field);
      if (!definition) return;
      const value=event.target.value===''?'':event.target.dataset.fireSlider?Number(Number(event.target.value).toFixed(definition.monetary?2:1)):Number(event.target.value);
      fireDraft[field] = value;
      currentFireSession().edited.add(field);
      if(event.target.dataset.fireSlider)event.target.value=String(value);
      const other = el('fireInputs').querySelector(event.target.dataset.fireNumber ? `[data-fire-slider="${field}"]` : `[data-fire-number="${field}"]`);
      if (other) {if (other.type === 'range' && Number(event.target.value) > Number(other.max)) other.max = event.target.value; other.value = event.target.value;}
      syncFireInputs();
      renderProjection();
    });
    syncFireInputs();
    renderProjection();
  }
  function renderProjection() {
    const restoreFocus=root.MerPlanNavigation?.preserveFocus?.(fireDialog);
    const result = P.calculateFire(fireDraft, options());
    el('saveFirePlan').disabled = !result.valid;
    if (!result.valid) {el('fireProjection').innerHTML = `<p class="planning-error" role="alert">${say('Provjerite iznose i postotke. Troškovi moraju biti veći od nule.','Check amounts and percentages. Spending must be greater than zero.')}</p>`; return;}
    const stop = Math.min(720, Math.max(120, (result.reachedMonth || 720) + 24));
    const points = result.series.filter(point => point.month <= stop);
    const max = Math.max(result.targetCents * 1.05, ...points.map(point => point.balanceCents), 1);
    const x = month => 16 + month / stop * 548, y = amount => 188 - amount / max * 160;
    const line = points.map(point => `${x(point.month)},${y(point.balanceCents)}`).join(' ');
    const heading = result.reachedMonth === 0 ? say('Cilj je dosegnut uz ove pretpostavke','Target met under these assumptions') : result.estimatedDate ? new Intl.DateTimeFormat(english() ? 'en-IE' : 'hr-HR', {month:'long', year:'numeric', timeZone:'UTC'}).format(new Date(`${result.estimatedDate}T12:00:00Z`)) : say('Nije dosegnuto unutar 60 godina','Not reached within 60 years');
    const overview = `<div class="planning-result"><span>${say('Procijenjeni mjesec neovisnosti','Estimated independence month')}</span><strong>${esc(heading)}</strong><p>${say('Potreban portfelj','Portfolio target')}: <b data-money>${money(result.targetCents)}</b></p><p>${say('Stopa izdvajanja','Contribution rate')}: <b>${result.savingRatePercent.toFixed(1)}%</b></p></div><div class="planning-sensitivity"><strong>${say('Ako je prinos 2 postotna boda niži','If returns are 2 percentage points lower')}</strong><span>${result.downside.estimatedDate ? dateLabel(result.downside.estimatedDate) : say('Cilj nije dosegnut u 60 godina','Target not reached in 60 years')}</span></div>`;
    const chart = `<div class="planning-chart" data-monetary><svg viewBox="0 0 580 224" role="img" aria-label="${say('Projekcija portfelja prema pretpostavkama','Portfolio projection under assumptions')}"><line x1="16" x2="564" y1="${y(result.targetCents)}" y2="${y(result.targetCents)}" class="fire-target"/><polyline points="${line}" class="fire-line"/>${points.filter(point => point.month % 60 === 0).map(point => `<circle cx="${x(point.month)}" cy="${y(point.balanceCents)}" r="4" tabindex="0"><title>${dateLabel(point.date)}: ${money(point.balanceCents)}</title></circle>`).join('')}<text x="16" y="213">${say('Danas','Today')}</text><text x="564" y="213" text-anchor="end">${Math.round(stop/12)} ${say('godina','years')}</text></svg><div class="planning-legend"><span>● ${say('Portfelj','Portfolio')}</span><span>┄ ${say('Cilj','Target')}</span></div></div>`;
    const model = `<p class="planning-note">${say('Iznosi su izraženi u današnjoj kupovnoj moći. Scenarij, ne obećanje datuma. Uplate rastu s inflacijom; prinos je stalan i kapitalizira se mjesečno. Porezi, naknade i tržišne oscilacije nisu uključeni. Stopa povlačenja je vaša pretpostavka, nije zajamčeno sigurna.','Amounts are shown in today’s purchasing power. A scenario, not a promised date. Contributions keep pace with inflation; returns are constant and compound monthly. Taxes, fees and market swings are excluded. Your withdrawal assumption is not guaranteed safe.')}</p>`;
    const sections = [['overview',say('Sažetak','Summary')],['chart',say('Graf','Chart')],['model',say('O modelu','About the model')]];
    el('fireProjection').innerHTML = tabs('fire-result',sections,projectionPanel,'data-fire-projection')+panel('fire-result','overview',projectionPanel,overview)+panel('fire-result','chart',projectionPanel,chart)+panel('fire-result','model',projectionPanel,model);
    restoreFocus?.();
  }
  function renewalEditor(rule) {
    editingRenewalId = rule?.id || null;
    renewalOriginal = rule || null;
    const date = rule ? P.nextRenewal(rule, P.today(options().timezone)) || rule.anchorDate : P.today(options().timezone);
    return `<form id="renewalForm" class="planning-renewal-form"><h3>${rule ? say('Uredi obnovu','Edit renewal') : say('Dodajte obnovu ili probno razdoblje','Add a renewal or free trial')}</h3><div class="planning-form-grid"><label>${say('Naziv usluge','Service name')}<input name="name" value="${esc(rule?.name || '')}" maxlength="80" required placeholder="Spotify, Adobe, …"></label><label>${say('Vrsta','Type')}<select name="cadence"><option value="annual" ${rule?.cadence==='annual'?'selected':''}>${say('Godišnja pretplata','Annual subscription')}</option><option value="monthly" ${rule?.cadence==='monthly'?'selected':''}>${say('Mjesečna pretplata','Monthly subscription')}</option><option value="trial" ${rule?.cadence==='trial'?'selected':''}>${say('Istek besplatne probe','Free trial expiry')}</option></select></label><label>${say('Sljedeća naplata / istek','Next payment / expiry')}<input name="anchorDate" type="date" value="${esc(date)}" required></label><label>${say('Iznos nakon obnove','Amount after renewal')} (${esc(rule?.currency||options().currency)})<input name="amount" type="number" min="0" max="10000000" step="0.01" value="${rule?.amount ?? ''}" required></label></div><input type="hidden" name="currency" value="${esc(rule?.currency||options().currency)}"><p id="renewalError" class="planning-error" role="alert" hidden></p><div class="planning-form-actions"><button type="button" class="secondary-button" data-renewal-reset>${say('Otkaži','Cancel')}</button></div></form>`;
  }
  function renderRenewals(resetEditor = false) {
    const schedule = P.renewalSchedule(profile(), options()), suggestions = P.detectAnnualRenewals(profile(), options());
    const editing = editingRenewalId ? schedule.find(item => item.id === editingRenewalId) : null;
    if (!el('renewalEditor')) {
      const sections=[['list',say('Podsjetnici','Reminders')],['editor',say('Dodaj / uredi','Add / edit')],['suggestions',say('Prijedlozi','Suggestions')]];
      el('planningRenewals').innerHTML = `${tabs('renewals',sections,renewalPanel,'data-renewal-view')}${panel('renewals','list',renewalPanel,'<p id="renewalIntro" class="planning-intro"></p><div id="renewalList" class="planning-renewal-list"></div>')}${panel('renewals','suggestions',renewalPanel,'<div id="renewalSuggestions"></div>')}${panel('renewals','editor',renewalPanel,'<div id="renewalEditor"></div>')}`;
      bindTabs(el('planningRenewals'),'data-renewal-view',showRenewalPanel);
      resetEditor = true;
    }
    el('planningRenewals').querySelector('[data-renewal-view="list"]').textContent=say('Podsjetnici','Reminders');
    el('planningRenewals').querySelector('[data-renewal-view="editor"]').textContent=say('Dodaj / uredi','Add / edit');
    el('planningRenewals').querySelector('[data-renewal-view="suggestions"]').textContent=say('Prijedlozi','Suggestions');
    el('renewalIntro').textContent = say('Podsjetnik se pojavljuje 3 dana prije obnove. Izvezite ga u svoj kalendar za obavijest i dok je Mer zatvoren.','A reminder appears 3 days before renewal. Export to your calendar for alerts while Mer is closed.');
    el('renewalList').innerHTML = schedule.map(rule => `<article class="planning-renewal"><div><strong>${esc(rule.name)}</strong><small>${rule.cadence==='trial'?say('Istek probe','Trial expiry'):rule.cadence==='annual'?say('Godišnje','Annual'):say('Mjesečno','Monthly')} · ${dateLabel(rule.nextDate)}</small>${rule.priceHike?`<span class="planning-badge warning">${say('Poskupljenje','Price increase')} +${money(rule.increaseCents,rule.currency)}</span>`:''}${(rule.due||rule.expired)&&!rule.dismissed?`<span class="planning-badge warning">${rule.expired?say('Provjerite naplatu nakon isteka','Check charges after expiry'):say(`Obnova za ${rule.daysUntil} dana`,`Renews in ${rule.daysUntil} days`)}</span>`:''}</div><b data-money>${money(rule.amountCents,rule.currency)}</b><div class="planning-renewal-actions"><button type="button" class="secondary-button" data-calendar="${esc(rule.id)}" ${rule.expired?'disabled':''}>${say('Kalendar','Calendar')}</button><button type="button" class="secondary-button" data-edit-renewal="${esc(rule.id)}">${say('Uredi','Edit')}</button><button type="button" class="secondary-button" data-delete-renewal="${esc(rule.id)}">${say('Ukloni','Remove')}</button>${(rule.due||rule.expired)&&!rule.dismissed?`<button type="button" class="secondary-button" data-dismiss-renewal="${esc(rule.reminderKey)}">${say('Pregledano','Reviewed')}</button>`:''}</div></article>`).join('') || `<div class="planning-empty"><strong>${say('Nema skrivenih obnova','No renewals tracked yet')}</strong><p>${say('Dodajte datum isteka probe ili godišnje pretplate kako biste izbjegli nenadanu naplatu.','Add a trial expiry or annual renewal to avoid an unexpected charge.')}</p></div>`;
    el('renewalSuggestions').innerHTML = suggestions.length ? `<p class="planning-intro">${say('Moguće godišnje pretplate. Zaključeno iz dvije godišnje naplate; potvrdite datum prije spremanja.','Possible annual subscriptions, inferred from two annual charges. Confirm the date before saving.')}</p><div id="renewalSuggestionList" class="planning-renewal-list">${suggestions.map((item,index)=>`<article class="planning-suggestion"><span>${esc(item.name)} · ${money(Math.round(item.amount*100),item.currency)}</span><button class="secondary-button" type="button" data-adopt-renewal="${index}">${say('Prati obnovu','Track renewal')}</button></article>`).join('')}</div>` : `<p class="planning-empty">${say('Nema novih prijedloga iz povijesti transakcija.','No new suggestions from your transaction history.')}</p>`;
    paginateRenewals();
    if (resetEditor) { el('renewalEditor').innerHTML = renewalEditor(editing); bindRenewalForm(); }
    showRenewalPanel(renewalPanel);
    el('planningRenewals').onclick = event => {
      if (owner !== activeId()) return;
      const target = event.target.closest('button'); if (!target) return;
      if (target.dataset.calendar) downloadCalendar(target.dataset.calendar);
      if (target.dataset.editRenewal) {editingRenewalId=target.dataset.editRenewal;renderRenewals(true);showRenewalPanel('editor');el('renewalForm').querySelector('input').focus();}
      if (target.dataset.deleteRenewal) {
        const reset = editingRenewalId === target.dataset.deleteRenewal;
        if (reset) editingRenewalId = null;
        saveMutation('renewal-delete', current => {current.enterprise.renewals=current.enterprise.renewals.filter(item=>item.id!==target.dataset.deleteRenewal);});
        if (reset) renderRenewals(true);
      }
      if (target.dataset.dismissRenewal) saveMutation('renewal-dismiss', current => P.dismissReminder(current,target.dataset.dismissRenewal,options()));
      if (target.dataset.adoptRenewal !== undefined) {el('renewalEditor').innerHTML=renewalEditor(suggestions[Number(target.dataset.adoptRenewal)]);bindRenewalForm();showRenewalPanel('editor');el('renewalForm').querySelector('input').focus();}
    };
  }
  function showRenewalPanel(key) {
    renewalPanel=key;selectPanel(el('planningRenewals'),'renewals',key,'data-renewal-view');
    el('saveRenewalReminder').hidden=key!=='editor';
  }
  function paginateRenewals() {
    ['renewalList','renewalSuggestionList'].forEach(id=>{
      const container=el(id);
      if(container)root.MerPagination?.attach(container,{pageSize:()=>root.innerWidth<=680||root.innerHeight<650?1:4,itemSelector:'article',scopeKey:`${activeId()}:${id}`,label:say('Podsjetnici','Reminders')});
    });
  }
  function bindRenewalForm() {
    el('renewalForm').addEventListener('submit', event => {
      event.preventDefault();const form = new FormData(event.currentTarget), prior = profile().enterprise?.renewals?.find(item=>item.id===editingRenewalId);
      const unchangedDate=renewalOriginal&&form.get('cadence')===renewalOriginal.cadence&&form.get('anchorDate')===P.nextRenewal(renewalOriginal,P.today(options().timezone));
      const input={id:editingRenewalId,name:form.get('name'),amount:Number(form.get('amount')),currency:form.get('currency'),cadence:form.get('cadence'),anchorDate:unchangedDate?renewalOriginal.anchorDate:form.get('anchorDate'),previousAmount:prior?.amount ?? renewalOriginal?.previousAmount ?? null};
      let result;saveMutation('renewal-save',current=>{result=P.saveRenewal(current,input,options());});
      if(!result?.valid){el('renewalError').hidden=false;el('renewalError').textContent=result?.reason==='duplicate'?say('Ova pretplata već postoji. Uredite postojeći podsjetnik.','This subscription is already tracked. Edit its reminder.'):say('Provjerite naziv, iznos i datum.','Check the name, amount and date.');return;}
      editingRenewalId=null;renderRenewals(true);showRenewalPanel('list');showToast(say('Podsjetnik je spremljen.','Reminder saved.'));
    });
    el('renewalForm').querySelector('[data-renewal-reset]').addEventListener('click',()=>{editingRenewalId=null;el('renewalEditor').innerHTML=renewalEditor(null);bindRenewalForm();showRenewalPanel('list');});
  }
  function downloadCalendar(ruleId) {
    const calendar=P.buildRenewalCalendar(profile(),{...options(),ruleId});if(!calendar.count)return;
    const url=URL.createObjectURL(new Blob([calendar.content],{type:'text/calendar;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=calendar.filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    showToast(say('Uvezite datoteku u kalendar i omogućite obavijesti.','Import the file into your calendar and enable notifications.'));
  }
  function renderDialog(dialog) {
    const fire = dialog === fireDialog, prefix = fire ? 'fireSimulator' : 'subscriptionRenewals';
    el(`${prefix}Profile`).textContent = profile().accountName || activeId();
    el(`${prefix}Title`).textContent = fire ? say('Financijska neovisnost · FIRE','Financial independence · FIRE') : say('Obnove bez iznenađenja','Renewals without surprises');
    dialog.querySelector('[data-planning-back-label]').textContent = say('Natrag','Back');
    dialog.querySelectorAll('[data-planning-close]').forEach(button => {
      if (button.classList.contains('icon-button')) button.setAttribute('aria-label', say('Zatvori','Close'));
      else button.textContent = say('Zatvori','Close');
    });
    const presentation = `${activeId()}:${english()}:${options().currency}`;
    if (fire) {
      refreshFireDraft();
      el('saveFirePlan').textContent = say('Spremi pretpostavke','Save assumptions');
      if (firePresentation !== presentation || !el('fireInputs')) {firePresentation = presentation;renderFire();}
      else {syncFireInputs();renderProjection();}
    } else {
      el('saveRenewalReminder').textContent = say('Spremi podsjetnik','Save reminder');
      const resetEditor = renewalPresentation !== presentation;
      renewalPresentation = presentation;
      renderRenewals(resetEditor);
    }
  }
  function open(which='fire') {
    if(root.MerEnterpriseSecurity?.isLocked?.()||document.getElementById('appShell')?.hidden)return;
    ensureDialogs();
    const dialog = which === 'renewals' ? renewalsDialog : fireDialog;
    close(dialog === fireDialog ? renewalsDialog : fireDialog);
    if (owner !== activeId()) {editingRenewalId=null;renewalOriginal=null;renewalPanel='list';firePanel='capital';projectionPanel='overview';}
    owner=activeId();
    renderDialog(dialog);
    if (!dialog.open) (root.MerEnterpriseBridge?.openModal||(node=>node.showModal()))(dialog);
  }
  function render() {
    if(typeof appState==='undefined')return;
    if(owner && owner!==activeId()) {close();owner=null;editingRenewalId=null;renewalOriginal=null;fireDraft=null;}
    else [fireDialog, renewalsDialog].forEach(dialog => {if(dialog?.open)renderDialog(dialog);});
    const reminders=P.dueReminders(profile(),options()),signature=`${activeId()}:${reminders.map(item=>item.reminderKey).join('|')}`;
    if(signature!==lastReminderSignature){lastReminderSignature=signature;window.dispatchEvent(new CustomEvent('mer:renewal-reminders',{detail:{profileId:activeId(),count:reminders.length}}));}
  }
  root.MerPlanningUI=Object.freeze({open,close,render,reminders:()=>P.dueReminders(profile(),options()),downloadCalendar});
  if(typeof reactiveStore!=='undefined')reactiveStore.subscribe(render);
  root.addEventListener?.('resize',()=>{if(renewalsDialog?.open)paginateRenewals();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
  render();
})(typeof window==='undefined'?globalThis:window);
