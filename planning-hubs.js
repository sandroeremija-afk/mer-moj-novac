(function contextualPlanningHubs(root) {
  'use strict';
  if (!root.document) return;
  const doc = root.document, dialogs = new Map(), owners = new WeakMap();
  const bridge = () => root.MerEnterpriseBridge;
  const state = () => bridge()?.getState?.() || {};
  const english = () => state().language === 'en';
  const say = (hr, en) => english() ? en : hr;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const ids = {payments:'planningPaymentsModal', savings:'planningSavingsModal'};
  const context = () => { const current = state(); return {profile:current.activeProfile, user:bridge()?.currentUser?.()?.userId, data:current.profiles?.[current.activeProfile]}; };
  const same = (a, b) => Boolean(a && b && a.profile === b.profile && a.user === b.user && a.data === b.data);
  const available = () => ['personal','business'].includes(state().activeProfile) && !root.MerEnterpriseSecurity?.isLocked?.() && !doc.getElementById('appShell')?.hidden && !doc.getElementById('appShell')?.inert;
  function close(dialog) { if (dialog?.open) bridge()?.closeModal(dialog); }
  function entries(kind) {
    if (kind === 'payments') return [
      {id:'scheduled', icon:'calendar', title:say('Zakazana plaćanja','Scheduled payments'), description:say('Redovni troškovi koji se evidentiraju na odabrani dan.','Regular expenses recorded on the day you choose.')},
      {id:'subscriptions', icon:'wallet', title:say('Ponavljajuće pretplate','Recurring subscriptions'), description:say('Pregled servisa prepoznatih iz vaše povijesti transakcija.','Services detected from your transaction history.')},
      {id:'renewals', icon:'bell', title:say('Podsjetnici za obnovu','Renewal reminders'), description:say('Godišnje pretplate, probna razdoblja i upozorenja na poskupljenje.','Annual plans, free trials and price increase alerts.')}
    ];
    return [
      {id:'assessment', icon:'sliders', title:say('Prilagodi plan','Adjust your plan'), description:say('Uskladite mjesečna izdvajanja, troškove i sigurnosnu rezervu.','Balance monthly savings, expenses and your safety buffer.')},
      {id:'automation', icon:'refresh', title:say('Automatska štednja','Automatic savings'), description:say('Zaokruživanje sitniša i raspodjela novih prihoda u ciljeve.','Round-ups and distribution of new income into goals.')},
      {id:'fire', icon:'chart', title:say('Dugoročni plan · FIRE','Long-term plan · FIRE'), description:say('Istražite put do financijske neovisnosti, bez promjene stanja.','Explore financial independence without changing your balance.')},
      ...(state().activeProfile === 'business' ? [{id:'tax', icon:'shield', title:say('Porezni trezor','Tax vault'), description:say('Virtualna PDV pričuva za oporezive poslovne uplate.','A virtual VAT reserve for taxable business income.')}] : [])
    ];
  }
  function create(kind) {
    if (dialogs.has(kind)) return dialogs.get(kind);
    const dialog = doc.createElement('dialog');
    dialog.id = ids[kind]; dialog.className = 'modal planning-hub-modal';
    dialog.setAttribute('aria-labelledby', `${dialog.id}Title`);
    dialog.innerHTML = `<header class="planning-hub-header"><div><h2 id="${dialog.id}Title"></h2><p class="planning-hub-context"></p></div><button type="button" class="icon-button modal-close" data-planning-hub-close>×</button></header><div class="planning-hub-body"></div><footer class="modal-actions planning-hub-footer"><button type="button" class="secondary-button" data-planning-hub-close></button></footer>`;
    doc.body.append(dialog); dialogs.set(kind, dialog);
    dialog.querySelectorAll('[data-planning-hub-close]').forEach(button => button.addEventListener('click', () => close(dialog)));
    dialog.addEventListener('click', event => {
      const button = event.target.closest('[data-hub-action]');
      if (!button || !dialog.contains(button) || !dialog.open || !available() || !same(owners.get(dialog), context())) return;
      const action = button.dataset.hubAction;
      if (!entries(kind).some(item => item.id === action)) return;
      // Keep the hub open until the child is opened: the navigation bridge records it.
      if (action === 'scheduled') bridge()?.openModal(doc.getElementById('budgetDetailsModal'));
      else if (action === 'subscriptions') { root.renderSubscriptions?.(); bridge()?.openModal(doc.getElementById('subscriptionsModal')); }
      else if (action === 'renewals' || action === 'fire') root.MerPlanningUI?.open(action);
      else if (action === 'assessment') root.openAssessment?.();
      else if (action === 'automation') root.MerVaultsUI?.open('automation');
      else if (action === 'tax' && state().activeProfile === 'business') root.MerEnterpriseUI?.openTaxVault?.();
    });
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(dialog); });
    root.MerRuntime?.bindDialogBackdropDismiss(dialog, () => close(dialog));
    return dialog;
  }
  function renderDialog(kind, dialog) {
    const restoreFocus = root.MerPlanNavigation?.preserveFocus(dialog);
    dialog.querySelector('h2').textContent = kind === 'payments' ? say('Plaćanja i pretplate','Payments and subscriptions') : say('Planiranje štednje','Savings planning');
    dialog.querySelector('.planning-hub-context').textContent = kind === 'payments' ? say('Budžeti · pregledajte obveze prije sljedeće naplate.','Budgets · review commitments before the next charge.') : say('Štednja · od mjesečnog plana do dugoročnih ciljeva.','Savings · from your monthly plan to long-term goals.');
    dialog.querySelectorAll('[data-planning-hub-close]').forEach(button => {
      if (button.classList.contains('icon-button')) button.setAttribute('aria-label', say('Zatvori','Close'));
      else button.textContent = say('Zatvori','Close');
    });
    dialog.querySelector('.planning-hub-body').innerHTML = entries(kind).map(item => `<button type="button" class="planning-hub-entry" data-hub-action="${item.id}" aria-haspopup="dialog"><span class="planning-hub-icon" aria-hidden="true"><svg><use href="#icon-${item.icon}"></use></svg></span><span><strong>${escape(item.title)}</strong><small>${escape(item.description)}</small></span><span class="planning-hub-arrow" aria-hidden="true">›</span></button>`).join('');
    restoreFocus?.();
  }
  function open(kind) {
    if (!ids[kind] || !available()) return false;
    const dialog = create(kind); owners.set(dialog, context()); renderDialog(kind, dialog); bridge()?.openModal(dialog); return true;
  }
  function canRestore(parentId) {
    const kind = Object.keys(ids).find(key => ids[key] === parentId), dialog = dialogs.get(kind);
    return Boolean(dialog && available() && same(owners.get(dialog), context()));
  }
  function restore(parentId) {
    if (!canRestore(parentId)) return false;
    return open(Object.keys(ids).find(key => ids[key] === parentId));
  }
  function render() {
    doc.querySelectorAll('[data-planning-hub]').forEach(button => {
      const label = button.querySelector('span') || button;
      label.textContent = button.dataset.planningHub === 'payments' ? say('Plaćanja i pretplate','Payments and subscriptions') : say('Planiranje štednje','Savings planning');
    });
    dialogs.forEach((dialog, kind) => {
      if (dialog.open && (!available() || !same(owners.get(dialog), context()))) close(dialog);
      else if (dialog.open) renderDialog(kind, dialog);
    });
  }
  doc.querySelectorAll('[data-planning-hub]').forEach(button => button.addEventListener('click', () => open(button.dataset.planningHub)));
  root.MerPlanningHubs = Object.freeze({open, render, restore, canRestore});
  render();
})(typeof window === 'undefined' ? globalThis : window);
