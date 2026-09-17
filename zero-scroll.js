(function initializeZeroScroll(root) {
  'use strict';
  if (!root.document) return;
  const document = root.document;
  const say = (hr, en) => document.documentElement.lang === 'en' ? en : hr;
  const label = (hr, en) => () => say(hr, en);
  const one = (scope, selector) => scope?.querySelector(selector);
  const all = (scope, selector) => [...(scope?.querySelectorAll(selector) || [])];
  const scopeKey = () => root.MerVaultsBridge?.snapshot?.()?.profileId || '';
  const small = () => root.innerWidth <= 640;
  function pages(node, options = {}) {
    return root.MerPagination?.attach(node, { pageSize:() => small() ? 2 : 4, scopeKey, ...options });
  }
  function sections(container, groups, key) {
    if (!container || one(container, ':scope > .mer-section-tabs')) return;
    root.MerSections?.attach(container, groups, { key });
  }
  function enhance(dialog) {
    if (dialog.classList.contains('tour-modal-host')) return;
    if (dialog.id === 'savingsGoalDetailModal') {
      const body = one(dialog, '.savings-detail-body');
      sections(body, [
        {label:label('Napredak', 'Progress'),nodes:[one(body, '.savings-detail-goal'),one(body, '.savings-detail-metrics')]},
        {label:label('Plan', 'Plan'),nodes:[one(body, '.savings-detail-note'),one(body, '#savingsDetailAutomation')]},
        {label:label('Uplate', 'Deposits'),nodes:[one(body, ':scope > h3'),one(body, '.savings-detail-entry-list'),one(body, '.savings-detail-empty')]}
      ], 'goalDetail');
    }
    all(dialog, '.savings-detail-entry-list').forEach(node => pages(node, {pageSize:() => small() ? 1 : 4}));
    all(dialog, '.rebalance-rows').forEach(node => pages(node));
    if (dialog.id === 'vaultsModal') {
      const body = one(dialog, '#vaultsBody'), rules = all(body, ':scope > .vaults-rule-section');
      if (rules.length) {
        const list = one(rules[1], '.vaults-rule-list');
        pages(list, {pageSize:() => small() ? 1 : 3});
        sections(body, [
          {label:label('Sitniš', 'Round-ups'),nodes:[rules[0]]},
          {label:label('Raspodjela prihoda', 'Income split'),nodes:[rules[1]]}
        ], 'vaultAutomation');
        const rule = rules[1];
        sections(rule, [
          {label:label('Novo pravilo', 'New rule'),nodes:all(rule, ':scope > :not(.vaults-rule-list):not(.mer-pagination)')},
          {label:label('Spremljena pravila', 'Saved rules'),nodes:[list,list?.nextElementSibling?.matches('.mer-pagination') ? list.nextElementSibling : null]}
        ], 'vaultRules');
      }
      pages(one(body, '#vaultsAllocations'), {pageSize:1});
    }
  }
  let frame = 0;
  function audit() {
    frame = 0;
    document.querySelectorAll('dialog[open]').forEach(enhance);
  }
  function schedule() { if (!frame) frame = root.requestAnimationFrame(audit); }
  new root.MutationObserver(schedule).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['open'] });
  root.addEventListener('resize', schedule);
  document.addEventListener('DOMContentLoaded', audit, {once:true});
  root.MerZeroScroll = { audit, enhance };
})(typeof window !== 'undefined' ? window : globalThis);
