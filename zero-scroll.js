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
    if (dialog.id === 'overviewDetailsModal') {
      const body = one(dialog, '.detail-modal-grid');
      const cards = all(body, ':scope > article');
      sections(body, cards.map(card => ({ label:() => one(card, 'h2,h3')?.textContent || say('Pregled', 'Overview'), nodes:[card] })), 'overviewDetails');
    }
    if (dialog.id === 'savingsStrategyModal') {
      const body = one(dialog, '.savings-strategy-body');
      sections(body, [
        {label:label('Pričuva', 'Reserve'),nodes:[one(body, '.modal-intro'),one(body, '.savings-strategy-summary')]},
        {label:label('Mjesečni plan', 'Monthly plan'),nodes:[one(body, '.savings-strategy-grid')]},
        {label:label('Tjedni pregled', 'Weekly review'),nodes:[one(body, '.recommendation-weekly')]}
      ], 'savingsStrategy');
      pages(one(body, '.savings-strategy-grid'), {pageSize:() => small() ? 1 : 3, itemSelector:'article'});
    }
    if (dialog.id === 'savingsHistoryDetailModal') {
      const body = one(dialog, '.savings-detail-body');
      sections(body, [
        {label:label('Sažetak', 'Summary'),nodes:all(body, ':scope > :not(#savingsHistoryBreakdown):not(.mer-section-tabs):not(.mer-section-panel)')},
        {label:label('Uplate', 'Deposits'),nodes:[one(body, '#savingsHistoryBreakdown')]}
      ], 'historyDetail');
      const breakdown = one(body, '#savingsHistoryBreakdown'), heads = all(breakdown, ':scope > h3');
      sections(breakdown, [
        {label:label('Mjeseci', 'Months'),nodes:[heads[0],one(breakdown, '.savings-detail-months')]},
        {label:label('Posljednje uplate', 'Recent deposits'),nodes:[heads[1],one(breakdown, '.savings-detail-entry-list'),one(breakdown, '.savings-detail-empty')]}
      ], 'historyBreakdown');
    }
    if (dialog.id === 'savingsGoalDetailModal') {
      const body = one(dialog, '.savings-detail-body');
      sections(body, [
        {label:label('Napredak', 'Progress'),nodes:[one(body, '.savings-detail-goal'),one(body, '.savings-detail-metrics')]},
        {label:label('Plan', 'Plan'),nodes:[one(body, '.savings-detail-note'),one(body, '#savingsDetailAutomation')]},
        {label:label('Uplate', 'Deposits'),nodes:[one(body, ':scope > h3'),one(body, '.savings-detail-entry-list'),one(body, '.savings-detail-empty')]}
      ], 'goalDetail');
    }
    if (dialog.id === 'insightChartModal' && !one(dialog, '#insightPagedBody')) {
      const body = document.createElement('div'); body.id = 'insightPagedBody';
      one(dialog, '#insightChartIntro').after(body);
      sections(body, [
        {label:label('Graf', 'Chart'),nodes:[one(dialog, '#insightExpandedChart')]},
        {label:label('Pokazatelji', 'Metrics'),nodes:[one(dialog, '#insightExpandedMetrics')]},
        {label:label('Analiza', 'Analysis'),nodes:[one(dialog, '#insightExpandedBreakdown')]}
      ], 'insightDetails');
    }
    all(dialog, '.savings-detail-entry-list').forEach(node => pages(node, {pageSize:() => small() ? 1 : 4}));
    all(dialog, '.savings-detail-months,.expanded-ranked-list,.rebalance-rows').forEach(node => pages(node));
    if (dialog.id === 'breakdownModal') pages(one(dialog, '.calculation-list'), { pageSize:4 });
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
