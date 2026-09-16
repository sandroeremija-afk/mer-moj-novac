(function exposeSettingsEnhancements(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerSettingsEnhancements = Object.freeze(api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function settingsEnhancements() {
  'use strict';
  const FIELDS = Object.freeze({firstName:80,lastName:80,oib:11,address:240});
  const RULES_PAGE_SIZE = 3;
  const cleanText = (value, limit) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,limit) : '';
  const userId = value => typeof value === 'string' && value.length <= 200 && value.trim() && !/[\u0000-\u001f\u007f]/.test(value) ? value : '';
  function normalizePersonalData(value) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const ownerId = userId(source.ownerId);
    const record = {version:1,ownerId,firstName:'',lastName:'',oib:'',address:''};
    if (!ownerId) return record;
    for (const [field,limit] of Object.entries(FIELDS)) record[field] = cleanText(source[field],limit);
    if (!/^\d{11}$/.test(record.oib) || cleanText(source.oib,240) !== record.oib) record.oib = '';
    return record;
  }
  function personalDataFor(state, session) {
    const ownerId = userId(session?.userId), record = normalizePersonalData(state?.settings?.personalData);
    return ownerId && record.ownerId === ownerId ? record : normalizePersonalData({ownerId});
  }
  function validatePersonalData(values) {
    const errors = {};
    for (const [field,limit] of Object.entries(FIELDS)) {
      if (typeof values?.[field] !== 'string' || values[field].trim().length > limit) errors[field] = 'length';
    }
    if (typeof values?.oib === 'string' && values.oib.trim() && !/^\d{11}$/.test(values.oib.trim())) errors.oib = 'format';
    return {valid:!Object.keys(errors).length,errors};
  }
  function savePersonalData(store, session, values) {
    const ownerId = userId(session?.userId);
    if (!ownerId) return {ok:false,reason:'authentication'};
    const validation = validatePersonalData(values);
    if (!validation.valid) return {ok:false,reason:'validation',errors:validation.errors};
    const record = normalizePersonalData({...values,ownerId});
    store.update('personal-data-save',draft => { draft.settings ||= {};draft.settings.personalData = record; });
    return {ok:true,record};
  }
  function paginateRules(rules, requestedPage = 1, pageSize = RULES_PAGE_SIZE) {
    const items = Array.isArray(rules) ? rules : [];
    const size = Number.isInteger(pageSize) && pageSize > 0 ? Math.min(pageSize,50) : RULES_PAGE_SIZE;
    const pages = Math.max(1,Math.ceil(items.length / size));
    const page = Math.max(1,Math.min(pages,Number.isFinite(Number(requestedPage)) ? Math.floor(Number(requestedPage)) : 1));
    const start = (page - 1) * size;
    return {items:items.slice(start,start + size),page,pages,total:items.length,start:items.length ? start + 1 : 0,end:Math.min(start + size,items.length)};
  }
  function createPersonalDataUI({document,store,getSession,getLanguage,isAvailable,flush}) {
    const form = document.getElementById('personalDataForm');
    if (!form) return {refresh(){}};
    const inputs = Object.fromEntries(Object.keys(FIELDS).map(field => [field,form.elements.namedItem(field)]));
    const feedback = document.getElementById('personalDataFeedback'), saveButton = document.getElementById('savePersonalData');
    const text = (hr,en) => getLanguage() === 'en' ? en : hr;
    let owner = '', dirty = false, pending = false;
    function refresh(force = false) {
      const session = getSession(), available = Boolean(session?.userId && isAvailable());
      const nextOwner = available ? session.userId : '';
      if (nextOwner !== owner) {
        owner = nextOwner;dirty = false;feedback.textContent = '';
        for (const input of Object.values(inputs)) { input.setCustomValidity('');input.removeAttribute('aria-invalid'); }
      }
      const record = personalDataFor(store.getState(),available ? session : null);
      if (force || !dirty || !available) for (const field of Object.keys(FIELDS)) inputs[field].value = record[field];
      for (const input of Object.values(inputs)) input.disabled = !available || pending;
      saveButton.disabled = !available || pending;
      const storage = document.getElementById('personalDataStorage');
      const encrypted = document.defaultView?.MerEnterpriseSecurity?.status?.().encrypted;
      storage.textContent = encrypted
        ? text('Podaci su dio šifriranog lokalnog trezora ovog korisnika.','These details are part of this user’s encrypted local vault.')
        : text('Lokalna demo pohrana nije šifrirana. Šifriranje možete uključiti u Sigurnosti.','Local demo storage is not encrypted. You can enable encryption in Security.');
    }
    form.addEventListener('input',event => {
      if (!Object.values(inputs).includes(event.target)) return;
      dirty = true;feedback.textContent = '';event.target.setCustomValidity('');event.target.removeAttribute('aria-invalid');
    });
    form.addEventListener('submit',async event => {
      event.preventDefault();if(pending)return;
      const session = getSession();
      if (!isAvailable() || !session?.userId || session.userId !== owner) { refresh(true);return; }
      const values = Object.fromEntries(Object.entries(inputs).map(([field,input]) => [field,input.value]));
      const validation = validatePersonalData(values);
      if (!validation.valid) {
        const field = Object.keys(validation.errors)[0], input = inputs[field];
        const message = field === 'oib' ? text('OIB mora sadržavati točno 11 znamenki ili ostati prazan.','OIB must contain exactly 11 digits or be left blank.') : text('Skratite unos na dopuštenu duljinu.','Shorten this entry to the allowed length.');
        input.setCustomValidity(message);input.setAttribute('aria-invalid','true');feedback.textContent = message;input.reportValidity();return;
      }
      pending = true;dirty = false;
      for (const input of Object.values(inputs)) { input.setCustomValidity('');input.removeAttribute('aria-invalid'); }
      try {
        savePersonalData(store,session,values);refresh();
        await flush();
        if (getSession()?.userId === session.userId && isAvailable()) feedback.textContent = text('Osobni podaci su spremljeni na ovom uređaju.','Personal data saved on this device.');
      } catch {
        if (getSession()?.userId === session.userId) { dirty = true;feedback.textContent = text('Spremanje nije potvrđeno. Pokušajte ponovno prije zatvaranja.','Saving could not be confirmed. Try again before closing.'); }
      } finally { pending = false;refresh(); }
    });
    document.getElementById('bankSettingsModal').addEventListener('close',() => {
      dirty = false;feedback.textContent = '';
      for (const input of Object.values(inputs)) { input.setCustomValidity('');input.removeAttribute('aria-invalid');input.value = ''; }
    });
    document.defaultView?.addEventListener('mer-security-status',() => refresh());
    const shell = document.getElementById('appShell');
    if (shell && document.defaultView?.MutationObserver) new document.defaultView.MutationObserver(() => refresh()).observe(shell,{attributes:true,attributeFilter:['hidden','inert']});
    store.subscribe(() => refresh());
    refresh();
    return {refresh};
  }
  return {FIELDS,RULES_PAGE_SIZE,normalizePersonalData,personalDataFor,validatePersonalData,savePersonalData,paginateRules,createPersonalDataUI};
});
