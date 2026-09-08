(function initializeBillSplitUI(root) {
  'use strict';
  const core = root.MerBillSplits;
  if (!core || !root.document) return;
  const document = root.document;
  const bridge = () => root.MerEngagementBridge;
  const snapshot = () => bridge()?.snapshot?.();
  const say = (hr,en) => snapshot()?.language === 'en' ? en : hr;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const scope = state => ({userId:state.userId,profileId:state.profileId,currency:state.currency,referenceDate:state.referenceDate});
  const ownerKey = state => `${state?.userId}|${state?.profileId}|${state?.sessionId}`;
  const money = (value,currency = 'EUR') => new Intl.NumberFormat(snapshot()?.language === 'en' ? 'en-IE' : 'hr-HR', {style:'currency',currency,minimumFractionDigits:value ? 2 : 0,maximumFractionDigits:value ? 2 : 0}).format(value / 100);
  const uuid = () => root.crypto?.randomUUID?.() || `person-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let dialog, owner, mode = 'ledger', draft = null, payment = null, page = 1, filter = 'open', revision = '', errorText = '';
  function available(state) { return Boolean(state?.profile && state?.userId && state?.profileId && state.authenticated !== false && !root.MerEnterpriseSecurity?.isLocked?.()); }
  function authorized() { const state = snapshot(); return available(state) && ownerKey(state) === owner; }
  function close() {
    if (dialog?.open) (bridge()?.closeModal || (node => node.close()))(dialog);
    draft = null; payment = null; owner = null; errorText = '';
  }
  function message(error) {
    const labels = {
      INVALID_AMOUNT:['Unesite valjani iznos s najviše dvije decimale.','Enter a valid amount with at most two decimals.'],
      INVALID_PARTICIPANTS:['Upišite imena za 2 do 12 sudionika. Prvi sudionik ste vi.','Enter names for 2 to 12 participants. The first participant is you.'],
      DUPLICATE_NAMES:['Svaki sudionik treba imati različito ime ili nadimak.','Each participant needs a unique name or nickname.'],
      SHARES_MISMATCH:['Zbroj udjela mora odgovarati točnom iznosu troška.','Shares must add up to the exact expense amount.'],
      STALE_TRANSACTION:['Izvorna transakcija je promijenjena ili izbrisana. Ponovno otvorite podjelu i provjerite iznose.','The original transaction changed or was deleted. Reopen the split and review the amounts.'],
      STALE_SPLIT:['Podjela je izmijenjena. Ponovno je otvorite prije spremanja.','The split changed. Reopen it before saving.'],
      SETTLEMENT_PROTECTED:['Evidentirane povrate nije moguće izbrisati ili smanjiti novom podjelom.','Recorded repayments cannot be removed or reduced by a new split.'],
      OVERPAYMENT:['Povrat ne smije biti veći od preostalog dugovanja.','Repayment cannot exceed the outstanding amount.'],
      INVALID_DATE:['Odaberite valjani datum povrata, najkasnije danas.','Choose a valid repayment date no later than today.'],
      INVALID_IBAN:['Unesite valjani IBAN. HUB3 prihvaća samo hrvatski IBAN.','Enter a valid IBAN. HUB3 accepts Croatian IBANs only.'],
      INVALID_BIC:['Unesite valjani BIC banke primatelja (obvezan za neke države izvan EGP-a).','Enter the beneficiary bank’s valid BIC (required for some non-EEA countries).'],
      INVALID_PAYMENT_FIELD:['Provjerite ime, opis i duljinu polja. HUB3 dopušta hrvatska slova, brojeve i osnovnu interpunkciju; bez novih redaka.','Check names, description and field lengths. HUB3 allows Croatian letters, digits and basic punctuation; no line breaks.'],
      UNSUPPORTED_MODEL:['Podržani su HR00 i HR99. Drugi modeli zahtijevaju posebnu kontrolu poziva na broj.','HR00 and HR99 are supported. Other models need specific reference checks.'],
      INVALID_REFERENCE:['HR00: do 22 znamenke/crtice. HR99: ostavite poziv na broj prazan.','HR00: up to 22 digits/hyphens. HR99: leave reference empty.'],
      PAYLOAD_TOO_LONG:['Podaci su predugi za standardni kod. Skratite naziv, adresu ili opis.','Data exceeds the standard code capacity. Shorten the name, address or description.'],
      EUR_REQUIRED:['Kodovi za plaćanje dostupni su samo za iznose u eurima. Nema automatske konverzije.','Payment codes support EUR only. No currency conversion is applied.'],
      TRANSACTION_MISSING:['Transakcija više nije dostupna u ovom profilu.','The transaction is no longer available in this profile.'],
      EXPENSE_REQUIRED:['Podjela je dostupna za postojeći pozitivan trošak.','Splitting is available for an existing positive expense.'],
      BARCODE_UNAVAILABLE:['Modul za kod nije učitan. Pokušajte ponovno; nije pokrenuto plaćanje.','The barcode module is unavailable. Retry; no payment was initiated.']
    };
    return say(...(labels[error?.code || error?.message] || ['Radnja nije uspjela. Provjerite podatke i pokušajte ponovno.','The action failed. Check the data and try again.']));
  }
  function showError(error) {
    errorText = message(error);
    const node = dialog?.querySelector('[data-split-error]');
    if (node) { node.textContent = errorText; node.hidden = false; }
  }
  function mutate(reason, callback) {
    if (!authorized()) { close(); throw new Error('ACCESS_DENIED'); }
    const captured = owner;
    bridge().mutate(reason, profile => {
      if (!authorized() || captured !== owner) throw new Error('ACCESS_DENIED');
      callback(profile, scope(snapshot()));
    });
  }
  function ensureDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.id = 'billSplitModal';
    dialog.className = 'modal bill-split-modal';
    dialog.setAttribute('aria-labelledby','billSplitTitle');
    document.body.append(dialog);
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('close', () => { draft = null; payment = null; owner = null; });
    root.MerRuntime?.bindDialogBackdropDismiss(dialog,close);
    dialog.addEventListener('click', click);
    dialog.addEventListener('submit', submit);
    dialog.addEventListener('change', change);
    dialog.addEventListener('input', event => {
      if (mode === 'edit' && event.target.closest('#billSplitForm')) refreshPreview();
      if (mode === 'payment') invalidateCode();
    });
  }
  function field(name,label,value = '',attributes = '') { return `<label>${esc(label)}<input name="${esc(name)}" value="${esc(value)}" ${attributes}></label>`; }
  function rows() { const state = snapshot(); return core.list(state.profile,scope(state)); }
  function currentSplit(id) { const state = snapshot(); return core.find(state.profile,scope(state),id); }
  function editor(transactionId) {
    const state = snapshot(), captured = scope(state);
    const {tx,amountCents,currency} = core.transaction(state.profile,captured,transactionId);
    const previous = core.list(state.profile,captured).find(item => item.transactionId === tx.id);
    draft = {transactionId,expectedStamp:core.transactionStamp(state.profile,captured,transactionId),expectedRevision:previous?.revision || 0,title:tx.name || tx.title || say('Trošak','Expense'),amountCents,currency,mode:previous?.mode || 'equal',participants:previous ? previous.participants.map(person => ({...person,amount:(person.shareCents / 100).toFixed(2)})) : [{id:'self',name:say('Ja','Me'),amount:''},{id:uuid(),name:'',amount:''}]};
    mode = 'edit'; payment = null; errorText = ''; render(true);
  }
  function capture() {
    const form = dialog.querySelector('#billSplitForm');
    draft.mode = form.elements.namedItem('splitMode').value;
    draft.participants = draft.participants.map(person => ({...person,name:form.elements.namedItem(`name-${person.id}`).value,amount:form.elements.namedItem(`amount-${person.id}`)?.value || ''}));
    return {...draft,participants:draft.participants.map(person => ({id:person.id,name:person.name,shareCents:draft.mode === 'custom' ? core.cents(person.amount || '0',true) : 0}))};
  }
  function refreshPreview() {
    try {
      const value = capture(), shares = core.allocate(value.amountCents,value.participants,value.mode);
      dialog.querySelector('[data-split-preview]').textContent = shares.map(person => `${person.name}: ${money(person.shareCents,value.currency)}`).join(' · ');
    } catch {
      dialog.querySelector('[data-split-preview]').textContent = say('Upišite sudionike i provjerite zbroj udjela.','Enter participants and verify the total shares.');
    }
  }
  function ledgerMarkup() {
    const state = snapshot();
    const all = rows().map(split => ({split,...core.inspect(state.profile,scope(state),split)})).filter(item => filter === 'all' || item.outstandingCents > 0 || item.stale);
    const pages = Math.max(1,Math.ceil(all.length / 6)); page = Math.min(page,pages);
    return `<div class="split-ledger-tools"><label>${say('Prikaz podjela','Show splits')}<select data-split-filter><option value="open" ${filter === 'open' ? 'selected' : ''}>${say('Otvorene podjele','Open splits')}</option><option value="all" ${filter === 'all' ? 'selected' : ''}>${say('Sve podjele','All splits')}</option></select></label><p>${say('Trošak ostaje knjižen jednom. Povrat označite ručno nakon stvarne uplate; ova evidencija ne stvara novi prihod.','The expense is posted once. Record repayments only after receiving them; this ledger does not create income.')}</p></div><div class="split-ledger-list">${all.slice((page-1)*6,page*6).map(({split,participants,outstandingCents,stale}) => `<article class="split-ledger-card"><div class="split-ledger-heading"><div><h3>${esc(split.title)}</h3><p>${esc(String(split.date).slice(0,10))} · ${money(split.amountCents,split.currency)}</p></div><strong class="split-status ${stale ? 'warning' : ''}" data-monetary>${stale ? say('Potrebna provjera','Review required') : outstandingCents ? `${say('Duguju vam','Owed to you')}: ${money(outstandingCents,split.currency)}` : say('Podmireno','Settled')}</strong></div>${stale ? `<p class="split-notice">${say('Transakcija je izmijenjena ili uklonjena. Provjerite podjelu prije novih povrata i kodova.','The transaction changed or was removed. Review the split before recording repayments or making codes.')}</p>` : ''}<div class="split-person-list">${participants.map(person => `<div><span><strong>${esc(person.name)}</strong><small>${person.id === 'self' ? say('Vaš dio','Your share') : `${say('Udio','Share')}: ${money(person.shareCents,split.currency)}`}</small></span><strong data-monetary>${money(person.id === 'self' ? person.shareCents : person.owedCents,split.currency)}</strong>${person.id !== 'self' && person.owedCents > 0 ? `<div class="split-person-actions"><button type="button" class="secondary-button" data-split-settle="${esc(split.id)}" data-person="${esc(person.id)}" ${stale ? 'disabled' : ''}>${say('Povrat','Repayment')}</button><button type="button" class="secondary-button" data-split-payment="${esc(split.id)}" data-person="${esc(person.id)}" ${stale ? 'disabled' : ''}>${say('Kod za uplatu','Payment code')}</button></div>` : ''}</div>`).join('')}</div><footer><button type="button" class="secondary-button" data-split-edit="${esc(split.transactionId)}">${say('Uredi podjelu','Edit split')}</button>${!split.settlements?.length ? `<button type="button" class="destructive-button" data-split-remove="${esc(split.id)}">${say('Ukloni','Remove')}</button>` : `<span>${split.settlements.length} ${say('evidentiranih povrata','recorded repayments')}</span>`}</footer></article>`).join('') || `<div class="split-empty"><h3>${say('Podijelite zajednički trošak','Split a shared expense')}</h3><p>${say('Otvorite trošak u Aktivnosti i odaberite „Podijeli trošak”. Mer će izračunati tko vam i koliko duguje.','Open an expense in Activity and select “Split expense”. Mer calculates each participant’s share.')}</p></div>`}</div>${pages > 1 ? `<nav class="split-pages" aria-label="${say('Stranice podjela','Split pages')}"><button type="button" class="secondary-button" data-split-prev ${page === 1 ? 'disabled' : ''}>${say('Prethodna','Previous')}</button><span>${page} / ${pages}</span><button type="button" class="secondary-button" data-split-next ${page === pages ? 'disabled' : ''}>${say('Sljedeća','Next')}</button></nav>` : ''}`;
  }
  function editorMarkup() {
    return `<form id="billSplitForm"><div class="split-expense-summary"><strong>${esc(draft.title)}</strong><strong data-monetary>${money(draft.amountCents,draft.currency)}</strong></div><p class="split-intro">${say('Vi ste platili ovaj trošak. Uključite i svoj dio; ostatak prikazuje koliko vam drugi trebaju vratiti.','You paid this expense. Include your own share; the rest shows what others should repay.')}</p><label>${say('Način podjele','Split method')}<select name="splitMode"><option value="equal" ${draft.mode === 'equal' ? 'selected' : ''}>${say('Jednako među svima','Equally between everyone')}</option><option value="custom" ${draft.mode === 'custom' ? 'selected' : ''}>${say('Prilagođeni iznosi','Custom amounts')}</option></select></label><div class="split-edit-people">${draft.participants.map((person,index) => `<div>${field(`name-${person.id}`,index ? say('Sudionik','Participant') : say('Vi (platitelj)','You (payer)'),person.name,'maxlength="60" required autocomplete="off"')}${draft.mode === 'custom' ? field(`amount-${person.id}`,`${say('Udio','Share')} (${draft.currency})`,person.amount,'inputmode="decimal" required') : `<span>${say('Jednak udio','Equal share')}</span>`}${index ? `<button type="button" class="icon-button" data-split-remove-person="${esc(person.id)}" aria-label="${say('Ukloni sudionika','Remove participant')}" ${draft.participants.length <= 2 ? 'disabled' : ''}>×</button>` : '<span></span>'}</div>`).join('')}</div><button type="button" class="secondary-button" data-split-add-person ${draft.participants.length >= 12 ? 'disabled' : ''}>+ ${say('Dodaj sudionika','Add participant')}</button><p class="split-share-preview" data-split-preview aria-live="polite"></p><p class="split-notice">${say('Podjela ne mijenja izvorni trošak, prihod ni raspoloživo stanje. To je lokalna evidencija dogovora.','Splitting does not change the original expense, income or balance. This is a local agreement ledger.')}</p></form>`;
  }
  function paymentMarkup() {
    const split = currentSplit(payment.splitId), state = snapshot();
    const person = core.inspect(state.profile,scope(state),split).participants.find(item => item.id === payment.personId);
    return `<form id="billSplitPaymentForm"><div class="split-expense-summary"><span>${say('Uplata od','Payment from')} <strong>${esc(person.name)}</strong></span><strong data-monetary>${money(person.owedCents,split.currency)}</strong></div><label>${say('Vrsta koda','Code format')}<select name="codeKind"><option value="hub3">HUB3 · PDF417 (${say('Hrvatska','Croatia')})</option><option value="epc">SEPA · EPC QR</option></select></label><div class="split-payment-grid">${field('recipientName',say('Primatelj uplate (vi)','Payment recipient (you)'),payment.fields?.recipientName || state.profile.accountName || '','maxlength="70" required autocomplete="name"')}${field('iban','IBAN',payment.fields?.iban || '','required maxlength="34" autocomplete="off" placeholder="HR…"')}${field('recipientAddress',say('Ulica i broj (neobavezno)','Street and number (optional)'),payment.fields?.recipientAddress || '','maxlength="25"')}${field('recipientCity',say('Poštanski broj i grad (neobavezno)','Postal code and city (optional)'),payment.fields?.recipientCity || '','maxlength="27"')}<label>Model<select name="model"><option value="HR00">HR00</option><option value="HR99">HR99 (${say('bez poziva na broj','no reference')})</option></select></label>${field('reference',say('Poziv na broj (neobavezno)','Reference (optional)'),payment.fields?.reference || '','maxlength="22" inputmode="numeric"')}${field('bic',say('BIC banke (SEPA izvan EGP-a)','Bank BIC (SEPA outside EEA)'),payment.fields?.bic || '','maxlength="11"')}${field('description',say('Opis uplate','Payment description'),payment.fields?.description || say('Povrat zajednickog troska','Shared expense repayment'),'required maxlength="140"')}</div><p class="split-notice">${say('HUB3 koristi PDF417, a ne QR. SEPA QR podrška ovisi o banci. Prije potvrde u bankovnoj aplikaciji provjerite ime, IBAN i iznos; Mer ne izvršava plaćanja.','HUB3 uses PDF417, not QR. SEPA QR support varies by bank. Verify the name, IBAN and amount in your banking app before authorizing; Mer does not execute payments.')}</p><div class="split-code-preview" data-code-preview hidden><div data-barcode-svg></div><dl data-code-data></dl><button type="button" class="secondary-button" data-code-download>${say('Preuzmi nalog (SVG)','Download payment slip (SVG)')}</button></div></form>`;
  }
  function render(force = false) {
    if (!dialog || (!dialog.open && !force)) return;
    if (!authorized()) { close(); return; }
    const state = snapshot();
    const nextRevision = JSON.stringify([state.profile.billSplits,state.profile.transactions,state.language]);
    if (!force && nextRevision === revision) return;
    revision = nextRevision;
    if (!force && mode !== 'ledger') {
      try {
        if (mode === 'edit' && core.transactionStamp(state.profile,scope(state),draft.transactionId) !== draft.expectedStamp) throw new Error('STALE_TRANSACTION');
        if (payment) {
          const split = currentSplit(payment.splitId);
          if (core.inspect(state.profile,scope(state),split).stale) throw new Error('STALE_TRANSACTION');
          if (split.revision !== payment.revision) throw new Error('STALE_SPLIT');
        }
      } catch (error) { invalidateCode(); showError(error); }
      return;
    }
    const title = mode === 'edit' ? say('Podijeli trošak','Split expense') : mode === 'payment' ? say('Kod za uplatu','Payment code') : mode === 'settle' ? say('Evidentiraj povrat','Record repayment') : mode === 'remove' ? say('Ukloniti podjelu?','Remove split?') : say('Podjela troškova','Bill splitting');
    let body = mode === 'edit' ? editorMarkup() : mode === 'payment' ? paymentMarkup() : mode === 'ledger' ? ledgerMarkup() : '';
    if (mode === 'settle') body = `<form id="billSplitSettleForm"><p>${say('Potvrdite samo povrat koji ste stvarno primili. Nova transakcija ni prihod neće se dodati automatski.','Only confirm a repayment you actually received. No transaction or income is added automatically.')}</p><strong>${esc(payment.name)}</strong>${field('repayment',`${say('Primljeni iznos','Received amount')} (${payment.currency})`,(payment.owedCents/100).toFixed(2),'inputmode="decimal" required')}${field('date',say('Datum povrata','Repayment date'),state.referenceDate,`type="date" max="${esc(state.referenceDate)}" required`)}</form>`;
    if (mode === 'remove') body = `<p>${say('Uklanja se samo dogovor o podjeli. Izvorna transakcija i financijsko stanje ostaju netaknuti.','Only the split agreement is removed. The original transaction and financial balances stay unchanged.')}</p><strong>${esc(payment.title)}</strong>`;
    const formId = {edit:'billSplitForm',payment:'billSplitPaymentForm',settle:'billSplitSettleForm'}[mode];
    dialog.innerHTML = `<header class="split-modal-head">${mode !== 'ledger' ? `<button type="button" class="secondary-button" data-split-back>← ${say('Natrag','Back')}</button>` : ''}<h2 id="billSplitTitle">${title}</h2><button type="button" class="icon-button" data-split-close aria-label="${say('Zatvori','Close')}">×</button></header><div class="bill-split-body"><p class="split-profile">${esc(state.profile.accountName || state.profileId)}</p>${body}<p role="alert" data-split-error ${errorText ? '' : 'hidden'}>${esc(errorText)}</p></div><footer class="split-modal-footer"><button type="button" class="secondary-button" data-split-close>${mode === 'ledger' ? say('Zatvori','Close') : say('Otkaži','Cancel')}</button>${formId ? `<button type="submit" form="${formId}" class="primary-button">${mode === 'payment' ? say('Pripremi kod','Prepare code') : mode === 'settle' ? say('Potvrdi primljeni povrat','Confirm received repayment') : say('Spremi podjelu','Save split')}</button>` : mode === 'remove' ? `<button type="button" class="destructive-button" data-split-confirm-remove>${say('Ukloni podjelu','Remove split')}</button>` : ''}</footer>`;
    if (mode === 'edit') refreshPreview();
    if (mode === 'payment') configurePaymentFields();
  }
  function click(event) {
    const target = event.target.closest('button'); if (!target) return;
    if (target.hasAttribute('data-split-close')) return close();
    if (!authorized()) return close();
    try {
      if (target.hasAttribute('data-split-back')) { mode = 'ledger'; draft = null; payment = null; errorText = ''; render(true); }
      if (target.dataset.splitEdit) editor(target.dataset.splitEdit);
      if (target.hasAttribute('data-split-add-person')) { capture(); draft.participants.push({id:uuid(),name:'',amount:''}); render(true); }
      if (target.dataset.splitRemovePerson) { capture(); draft.participants = draft.participants.filter(person => person.id !== target.dataset.splitRemovePerson); render(true); }
      if (target.hasAttribute('data-split-prev') || target.hasAttribute('data-split-next')) { page += target.hasAttribute('data-split-next') ? 1 : -1; render(true); }
      if (target.dataset.splitPayment || target.dataset.splitSettle) {
        const state = snapshot(), split = currentSplit(target.dataset.splitPayment || target.dataset.splitSettle), status = core.inspect(state.profile,scope(state),split);
        if (status.stale) throw new Error('STALE_TRANSACTION');
        const person = status.participants.find(item => item.id === target.dataset.person);
        if (target.dataset.splitPayment && split.currency !== 'EUR') throw new Error('EUR_REQUIRED');
        payment = {splitId:split.id,personId:person.id,revision:split.revision,name:person.name,owedCents:person.owedCents,currency:split.currency,code:null};
        mode = target.dataset.splitPayment ? 'payment' : 'settle'; errorText = ''; render(true);
      }
      if (target.dataset.splitRemove) { const split = currentSplit(target.dataset.splitRemove); payment = {splitId:split.id,revision:split.revision,title:split.title}; mode = 'remove'; render(true); }
      if (target.hasAttribute('data-split-confirm-remove')) { mutate('bill-split-remove',(profile,captured) => core.remove(profile,captured,payment.splitId,payment.revision)); mode = 'ledger'; payment = null; render(true); }
      if (target.hasAttribute('data-code-download')) downloadCode();
    } catch (error) { showError(error); }
  }
  function change(event) {
    if (event.target.hasAttribute('data-split-filter')) { filter = event.target.value; page = 1; render(true); }
    if (event.target.name === 'splitMode') { try { capture(); render(true); } catch (error) { showError(error); } }
    if (mode === 'payment') { invalidateCode(); configurePaymentFields(); }
  }
  function invalidateCode() {
    if (payment) payment.code = null;
    const preview = dialog?.querySelector('[data-code-preview]');
    if (preview) { preview.hidden = true; preview.querySelector('[data-barcode-svg]')?.replaceChildren(); }
  }
  function configurePaymentFields() {
    const form = dialog.querySelector('#billSplitPaymentForm');
    if (!form) return;
    const hub = form.elements.namedItem('codeKind').value === 'hub3';
    for (const name of ['recipientAddress','recipientCity','model','reference']) {
      const control = form.elements.namedItem(name); control.closest('label').hidden = !hub; control.disabled = !hub;
    }
    const bic = form.elements.namedItem('bic'); bic.closest('label').hidden = hub; bic.disabled = hub;
    form.elements.namedItem('recipientName').maxLength = hub ? 25 : 70;
    form.elements.namedItem('description').maxLength = hub ? 35 : 140;
  }
  function submit(event) {
    event.preventDefault(); if (!authorized()) return close();
    try {
      if (event.target.id === 'billSplitForm') {
        const input = capture(); mutate('bill-split-save',(profile,captured) => core.save(profile,captured,input)); mode = 'ledger'; draft = null; filter = 'all'; errorText = ''; render(true); bridge()?.toast?.(say('Podjela je spremljena.','Split saved.'));
      }
      if (event.target.id === 'billSplitSettleForm') {
        const form = new FormData(event.target), input = {id:payment.splitId,participantId:payment.personId,expectedRevision:payment.revision,amountCents:core.cents(form.get('repayment')),date:form.get('date')};
        mutate('bill-split-repayment',(profile,captured) => core.settle(profile,captured,input)); mode = 'ledger'; payment = null; errorText = ''; render(true);
      }
      if (event.target.id === 'billSplitPaymentForm') prepareCode(event.target);
    } catch (error) { showError(error); }
  }
  function verifyPayment() {
    const state = snapshot(), split = currentSplit(payment.splitId), status = core.inspect(state.profile,scope(state),split);
    if (status.stale || split.revision !== payment.revision) throw new Error('STALE_TRANSACTION');
    const person = status.participants.find(item => item.id === payment.personId);
    if (!person || person.owedCents !== payment.owedCents || person.owedCents <= 0) throw new Error('STALE_SPLIT');
    return {split,person};
  }
  function prepareCode(form) {
    const {split,person} = verifyPayment();
    const data = Object.fromEntries(new FormData(form)); payment.fields = data;
    if (!root.bwipjs?.toSVG) throw new Error('BARCODE_UNAVAILABLE');
    // The payer's optional HUB3 fields stay empty: participant nicknames may not
    // be legal bank names. The payer verifies/fills their identity in their bank.
    const code = (data.codeKind === 'epc' ? core.epc : core.hub3)({...data,amountCents:person.owedCents,currency:split.currency});
    const svg = root.bwipjs.toSVG(code.options);
    payment.code = {...code,svg};
    dialog.querySelector('[data-barcode-svg]').innerHTML = svg;
    dialog.querySelector('[data-code-data]').innerHTML = `<div><dt>${say('Primatelj','Recipient')}</dt><dd>${esc(code.recipientName)}</dd></div><div><dt>IBAN</dt><dd>${esc(code.iban)}</dd></div><div><dt>${say('Iznos','Amount')}</dt><dd data-monetary>${money(code.amountCents)}</dd></div><div><dt>${say('Opis','Description')}</dt><dd>${esc(code.description)}</dd></div>`;
    const preview = dialog.querySelector('[data-code-preview]');
    preview.hidden = false;
    let heading = preview.querySelector('[data-code-heading]');
    if (!heading) {
      heading = document.createElement('h3'); heading.id = 'billSplitCodeTitle';
      heading.setAttribute('data-code-heading',''); heading.tabIndex = -1;
      preview.prepend(heading); preview.setAttribute('role','region');
      preview.setAttribute('aria-labelledby',heading.id);
    }
    heading.textContent = say('Kod za uplatu je spreman','Payment code is ready');
    dialog.querySelector('[data-split-error]').hidden = true;
    errorText = '';
    const prepared = payment.code;
    const reveal = () => {
      if (!authorized() || !dialog.open || payment?.code !== prepared || preview.hidden) return;
      const body = dialog.querySelector('.bill-split-body');
      // Scroll the modal body only. The page, header and footer stay stationary.
      const top = Math.max(0,body.scrollTop + preview.getBoundingClientRect().top - body.getBoundingClientRect().top - 12);
      heading.focus({preventScroll:true});
      const behavior = root.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      if (typeof body.scrollTo === 'function') body.scrollTo({top,behavior}); else body.scrollTop = top;
    };
    if (root.requestAnimationFrame) root.requestAnimationFrame(reveal); else reveal();
  }
  function downloadCode() {
    verifyPayment(); if (!payment.code) throw new Error('BARCODE_UNAVAILABLE');
    const code = payment.code, box = /viewBox="0 0 (\d+) (\d+)"/.exec(code.svg);
    if (!box) throw new Error('BARCODE_UNAVAILABLE');
    const width = Math.max(440,Number(box[1]) + 40), barcodeHeight = Number(box[2]);
    const lines = [code.kind === 'hub3' ? 'HUB3 PDF417 - prijedlog uplate' : 'SEPA EPC QR - payment proposal',code.recipientName,code.iban,money(code.amountCents),code.description];
    const wrapped = lines.flatMap(line => String(line).match(/.{1,54}/g) || ['']);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${barcodeHeight + 60 + wrapped.length * 23}"><rect width="100%" height="100%" fill="white"/>${code.svg.replace('<svg ',`<svg x="20" y="20" width="${box[1]}" height="${box[2]}" `)}${wrapped.map((line,index) => `<text x="20" y="${barcodeHeight + 58 + index * 23}" font-family="sans-serif" font-size="15" fill="#101820">${esc(line)}</text>`).join('')}</svg>`;
    const url = URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
    const link = document.createElement('a'); link.href = url; link.download = `Podjela_Nalog_${code.kind.toUpperCase()}.svg`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),60000);
  }
  function open(transactionId) {
    const state = snapshot(); if (!available(state)) return false;
    ensureDialog(); owner = ownerKey(state); mode = 'ledger'; page = 1; errorText = ''; draft = null; payment = null;
    try { if (transactionId) editor(transactionId); else render(true); }
    catch (error) { mode = 'ledger'; errorText = message(error); render(true); }
    (bridge().openModal || (node => node.showModal()))(dialog); return true;
  }
  root.addEventListener?.('mer-security-status',() => { if (dialog?.open && !authorized()) close(); });
  root.MerBillSplitUI = Object.freeze({open,render,close});
})(typeof window !== 'undefined' ? window : globalThis);
