(function planNavigation(root) {
  'use strict';
  const origins = new WeakMap();
  const restoring = new WeakSet();
  const tools = new Set(['receiptMatcherModal', 'fireSimulatorModal', 'subscriptionRenewalsModal', 'taxVaultModal', 'budgetDetailsModal', 'subscriptionsModal', 'assessmentModal', 'vaultsModal', 'recurringModal']);
  const parents = ['planningPaymentsModal','planningSavingsModal','budgetDetailsModal','intelligenceModal'];
  const bridge = () => root.MerEnterpriseBridge;
  const context = () => {const current=bridge()?.getState?.()||{};return {profile:current.activeProfile,user:bridge()?.currentUser?.()?.userId,data:current.profiles?.[current.activeProfile]};};
  const same = (a,b) => a.profile === b.profile && a.user === b.user && a.data === b.data;
  const available = () => !root.MerEnterpriseSecurity?.isLocked?.() && !document.getElementById('appShell')?.hidden && !document.getElementById('appShell')?.inert;
  function enter(dialog) {
    if (!dialog || dialog.open || restoring.has(dialog) || !tools.has(dialog.id)) return;
    const parent = parents.map(id=>document.getElementById(id)).find(node=>node?.open&&node!==dialog);
    const active=document.activeElement;
    origins.set(dialog, parent ? {...context(),parentId:parent.id,action:active?.closest('[data-hub-action]')?.dataset.hubAction||active?.closest('[data-suite-action]')?.dataset.suiteAction,focusId:active?.id||''} : null);
  }
  function back(dialog) {
    const origin = origins.get(dialog);
    origins.delete(dialog);
    bridge()?.closeModal(dialog);
    if (!origin || !same(origin,context()) || !available()) return;
    if(origin.parentId==='intelligenceModal')root.MerEnterpriseUI?.openIntelligence('forecast');
    else if(origin.parentId==='budgetDetailsModal'){
      const parent=document.getElementById(origin.parentId);
      if(!parent)return;
      restoring.add(parent);try{bridge()?.openModal(parent);}finally{restoring.delete(parent);}
    }
    else if(!root.MerPlanningHubs?.restore(origin.parentId))return;
    requestAnimationFrame(() => {
      const parent=document.getElementById(origin.parentId);
      if (!parent?.open || !same(origin,context()) || !available()) return;
      const target=(origin.focusId&&document.getElementById(origin.focusId))||[...parent.querySelectorAll('[data-hub-action], [data-suite-action]')].find(button=>(button.dataset.hubAction||button.dataset.suiteAction)===origin.action);
      if(target&&parent.contains(target))target.focus({preventScroll:true});
    });
  }
  function enhance(dialog) {
    if (!dialog || !tools.has(dialog.id)) return;
    // Camera/review Back belongs to the receipt's current step, before returning to Plan.
    if (dialog.querySelector('#receiptBack')) return;
    const existing=dialog.querySelector('[data-plan-back]');
    if (existing) {syncBack(dialog,existing);return;}
    // FIRE and renewal views supply their own translated Back controls.
    if (dialog.id==='fireSimulatorModal' || dialog.id==='subscriptionRenewalsModal') return;
    // Native forms keep their internal Previous-step button and submit handler.
    if(!origins.get(dialog)&&!['receiptMatcherModal','taxVaultModal'].includes(dialog.id))return;
    let footer=dialog.querySelector('footer, .modal-actions');
    if (!footer) {
      footer=document.createElement('footer');
      footer.className=dialog.id==='receiptMatcherModal'?'receipt-footer':'modal-actions enterprise-footer';
      dialog.append(footer);
    }
    const button=document.createElement('button');
    button.type='button';button.className='secondary-button plan-back';button.dataset.planBack='';
    button.textContent=bridge()?.getState().language==='en'?'Back':'Natrag';
    button.addEventListener('click',()=>back(dialog));
    footer.prepend(button);
    syncBack(dialog,button);
    const localBack=dialog.querySelector('#assessmentBack');
    if(localBack&&root.MutationObserver)new root.MutationObserver(()=>syncBack(dialog,button)).observe(localBack,{attributes:true,attributeFilter:['hidden']});
  }
  function syncBack(dialog,button) {
    button.textContent=bridge()?.getState?.().language==='en'?'Back':'Natrag';
    const localBack=dialog.querySelector('#assessmentBack');
    button.hidden=Boolean((localBack&&!localBack.hidden)||(!origins.get(dialog)&&!['receiptMatcherModal','taxVaultModal'].includes(dialog.id)));
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
