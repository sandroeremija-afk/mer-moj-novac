(function planNavigation(root) {
  'use strict';
  const origins = new WeakMap();
  const tools = new Set(['receiptMatcherModal', 'merHouseholdDialog', 'fireSimulatorModal', 'subscriptionRenewalsModal', 'taxVaultModal']);
  const bridge = () => root.MerEnterpriseBridge;
  const context = () => ({ profile:bridge()?.getState().activeProfile, user:bridge()?.currentUser()?.userId });
  const same = (a,b) => a.profile === b.profile && a.user === b.user;
  function enter(dialog) {
    if (!dialog || dialog.open || !tools.has(dialog.id)) return;
    const parent = document.getElementById('intelligenceModal');
    origins.set(dialog, parent?.open ? { ...context(), action:document.activeElement?.closest('[data-suite-action]')?.dataset.suiteAction } : null);
  }
  function back(dialog) {
    const origin = origins.get(dialog);
    origins.delete(dialog);
    bridge()?.closeModal(dialog);
    if (!origin || !same(origin,context()) || root.MerEnterpriseSecurity?.isLocked() || document.getElementById('appShell')?.hidden) return;
    root.MerEnterpriseUI?.openIntelligence('forecast');
    requestAnimationFrame(() => {
      const parent=document.getElementById('intelligenceModal');
      if (!parent?.open) return;
      const target=[...parent.querySelectorAll('[data-suite-action]')].find(button=>button.dataset.suiteAction===origin.action);
      target?.focus({preventScroll:true});
    });
  }
  function enhance(dialog) {
    if (!dialog || !tools.has(dialog.id)) return;
    if (dialog.querySelector('[data-plan-back]')) return;
    // FIRE and renewal views supply their own translated Back controls.
    if (dialog.id==='fireSimulatorModal' || dialog.id==='subscriptionRenewalsModal') return;
    const heading=dialog.querySelector('header');
    if (!heading) return;
    const button=document.createElement('button');
    button.type='button';button.className='secondary-button plan-back';button.dataset.planBack='';
    button.textContent=bridge()?.getState().language==='en'?'← Back':'← Natrag';
    button.addEventListener('click',()=>back(dialog));
    heading.prepend(button);
  }
  function preserveFocus(dialog) {
    const active=document.activeElement;
    if (!dialog?.contains(active)) return () => {};
    const id=active.id;
    const data=[...active.attributes].filter(item=>item.name.startsWith('data-')).map(item=>[item.name,item.value]);
    return () => {
      if (!dialog.open || active.isConnected) return;
      const candidates=[...dialog.querySelectorAll('button, input, select, textarea, a[href]')];
      const match=candidates.find(item=>!item.disabled && item.getClientRects().length && (id ? item.id===id : data.length && data.every(([key,value])=>item.getAttribute(key)===value)));
      (match||candidates.find(item=>!item.disabled && item.getClientRects().length))?.focus({preventScroll:true});
    };
  }
  root.MerPlanNavigation=Object.freeze({enter,back,enhance,preserveFocus});
})(window);
