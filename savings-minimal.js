(function initializeSavingsMinimal(root) {
  'use strict';
  const finite = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
  const cents = value => Math.round(finite(value) * 100);
  const belongsTo = (item, profileId) => item && (!item.profileId || item.profileId === profileId);
  function savingsDetail(snapshot, goalId = null) {
    const profile = snapshot?.profile || {}, profileId = snapshot?.profileId;
    const goals = (Array.isArray(profile.goalBuckets) ? profile.goalBuckets : []).filter(goal => belongsTo(goal, profileId));
    const goal = goalId === null ? null : goals.find(item => String(item.id) === String(goalId));
    if (goalId !== null && !goal) return null;
    const entries = (Array.isArray(profile.savingsEntries) ? profile.savingsEntries : []).filter(entry =>
      belongsTo(entry, profileId) && (!goal || String(entry.goalId) === String(goal.id)) &&
      Number.isFinite(Date.parse(entry.date)) && Number.isFinite(Number(entry.amount)) && Number(entry.amount) !== 0
    ).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const history = (Array.isArray(profile.savingsHistory) ? profile.savingsHistory : []).map(value => cents(value) / 100);
    const total = history.reduce((sum, value) => sum + cents(value), 0) / 100;
    return { goal, goals, entries, history, total, average: history.length ? total / history.length : 0,
      remaining: goal ? Math.max(0, cents(goal.target) - cents(goal.current)) / 100 : 0,
      percent: goal ? Math.min(100, finite(goal.current) / Math.max(.01, finite(goal.target)) * 100) : 0 };
  }
  function sameOwner(snapshot, owner) {
    return Boolean(snapshot && owner && snapshot.authenticated !== false && snapshot.profileId === owner.profileId && snapshot.sessionId === owner.sessionId);
  }
  const api = { savingsDetail, sameOwner };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (!root.document) return;
  const doc = root.document, el = id => doc.getElementById(id), bridge = () => root.MerVaultsBridge;
  const snapshot = () => bridge()?.snapshot(), say = (hr, en) => snapshot()?.language === 'en' ? en : hr;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const money = value => bridge()?.formatMoney(value) || String(value);
  const entryMoney = entry => {
    const value = Number(entry.amount), s = snapshot();
    const currency = /^[A-Z]{3}$/.test(String(entry.currency || '').toUpperCase()) ? String(entry.currency).toUpperCase() : s.currency;
    const formatted = root.MerCore?.formatCurrency(Math.abs(value), { currency, locale:s.language === 'en' ? 'en-GB' : 'hr-HR' }) || money(Math.abs(value));
    return `${value < 0 ? '−' : '+'}${formatted}`;
  };
  const dateLabel = value => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(snapshot()?.language === 'en' ? 'en-GB' : 'hr-HR', { day:'numeric', month:'short', year:'numeric' }).format(date) : '—';
  };
  const bound = new WeakSet();
  let owner = null, active = null, activeGoal = null, historyDialog, goalDialog;
  function close(dialog) { if (dialog?.open) bridge()?.closeModal(dialog); }
  function createDialog(id, titleId) {
    const dialog = doc.createElement('dialog');
    dialog.id = id; dialog.className = 'modal savings-minimal-modal'; dialog.setAttribute('aria-labelledby', titleId);
    dialog.innerHTML = `<header class="savings-detail-header"><div><small class="savings-detail-profile"></small><h2 id="${titleId}"></h2></div><button type="button" class="icon-button" data-savings-detail-close>×</button></header><div class="savings-detail-body"></div><footer class="savings-detail-footer"></footer>`;
    doc.body.append(dialog);
    dialog.querySelector('[data-savings-detail-close]').addEventListener('click', () => close(dialog));
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(dialog); });
    dialog.addEventListener('close', () => { if (active === dialog) { active = null; owner = null; activeGoal = null; } });
    root.MerRuntime?.bindDialogBackdropDismiss(dialog, () => close(dialog));
    return dialog;
  }
  function ensureDialogs() {
    if (historyDialog) return;
    historyDialog = createDialog('savingsHistoryDetailModal', 'savingsHistoryDetailTitle');
    goalDialog = createDialog('savingsGoalDetailModal', 'savingsGoalDetailTitle');
    // Move live values, not copies: the original financial renderer keeps ownership.
    const historyBody = historyDialog.querySelector('.savings-detail-body');
    const kpis = doc.querySelector('#savingsView .savings-chart-kpis');
    if (kpis) historyBody.append(kpis);
    const trend = el('savingsTrendBadge');
    if (trend) {
      const row = doc.createElement('div'); row.className = 'savings-detail-trend';
      const label = doc.createElement('span'); label.id = 'savingsHistoryTrendLabel';
      row.append(label, trend); historyBody.append(row);
    }
    const summary = doc.querySelector('#savingsView .chart-total-summary');
    if (summary) historyBody.prepend(summary);
    const detail = doc.createElement('div'); detail.id = 'savingsHistoryBreakdown'; historyBody.append(detail);
    const weekly = doc.querySelector('#savingsRecommendationCard .recommendation-weekly');
    const strategy = el('savingsStrategyModal');
    if (weekly && strategy) strategy.querySelector('.modal-actions')?.before(weekly);
  }
  function entriesMarkup(entries, goals) {
    return entries.length ? `<div class="savings-detail-entry-list">${entries.map(entry => `<article><div><strong>${esc(entry.note || (Number(entry.amount) < 0 ? say('Isplata iz štednje', 'Savings withdrawal') : say('Uplata u štednju', 'Savings deposit')))}</strong><small>${esc(dateLabel(entry.date))} · ${esc(goals.find(goal => goal.id === entry.goalId)?.name || say('Uklonjeni cilj', 'Removed goal'))}</small></div><strong data-money>${entryMoney(entry)}</strong></article>`).join('')}</div>` : `<p class="savings-detail-empty">${say('Još nema evidentiranih uplata. Početno stanje cilja nije zasebna uplata.', 'No deposits have been recorded yet. The goal opening balance is not a separate deposit.')}</p>`;
  }
  function prepareHeader(dialog, title) {
    dialog.querySelector('h2').textContent = title;
    dialog.querySelector('.savings-detail-profile').textContent = snapshot()?.profile.accountName || '';
    dialog.querySelector('[data-savings-detail-close]').setAttribute('aria-label', say('Zatvori', 'Close'));
  }
  function footer(dialog, actions) {
    const target = dialog.querySelector('.savings-detail-footer');
    target.innerHTML = `<button type="button" id="${dialog.id}Close" class="secondary-button" data-detail-dismiss>${say('Zatvori', 'Close')}</button>${actions.map(action => `<button type="button" id="${dialog.id}-${action.id}" class="${action.primary ? 'primary' : 'secondary'}-button" data-detail-action="${action.id}">${action.label}</button>`).join('')}`;
    target.querySelector('[data-detail-dismiss]').addEventListener('click', () => close(dialog));
    actions.forEach(action => target.querySelector(`[data-detail-action="${action.id}"]`).addEventListener('click', () => {
      if (!sameOwner(snapshot(), owner)) { close(dialog); return; }
      close(dialog); action.run();
    }));
  }
  function renderHistory() {
    const s = snapshot(), detail = savingsDetail(s), end = new Date(`${s.referenceDate.slice(0,7)}-01T12:00:00Z`);
    prepareHeader(historyDialog, say('Povijest štednje · detalji', 'Savings history · details'));
    const trendLabel = el('savingsHistoryTrendLabel');
    if (trendLabel) trendLabel.textContent = say('U odnosu na prethodni mjesec', 'Compared with the previous month');
    const months = detail.history.map((amount, index) => {
      const date = new Date(end); date.setUTCMonth(date.getUTCMonth() - (detail.history.length - 1 - index));
      const label = new Intl.DateTimeFormat(s.language === 'en' ? 'en-GB' : 'hr-HR', { month:'long', year:'numeric', timeZone:'UTC' }).format(date);
      return `<li><span>${esc(label)}</span><strong data-money>${money(amount)}</strong></li>`;
    }).join('');
    el('savingsHistoryBreakdown').innerHTML = `<h3>${say('Mjesečne uplate', 'Monthly contributions')}</h3><ul class="savings-detail-months">${months || `<li>${say('Nema povijesti za prikaz.', 'No history to show.')}</li>`}</ul><h3>${say('Posljednje uplate', 'Recent deposits')}</h3>${entriesMarkup(detail.entries.slice(0, 5), detail.goals)}`;
    footer(historyDialog, [{ id:'entries', label:say('Sve uplate', 'All deposits'), run:() => bridge().openModal(el('savingsDetailsModal')) }]);
  }
  function renderGoal() {
    const s = snapshot(), detail = savingsDetail(s, activeGoal);
    if (!detail) { close(goalDialog); return; }
    const { goal, remaining, percent } = detail, goalId = goal.id;
    const metrics = root.MerAccounting?.goalMetrics(goal, s.referenceDate), scheduled = goal.dueDate ? dateLabel(goal.dueDate) : say('Bez zadanog roka', 'No target date');
    prepareHeader(goalDialog, say('Detalji cilja', 'Goal details'));
    goalDialog.querySelector('.savings-detail-body').innerHTML = `<div class="savings-detail-goal"><span class="savings-detail-icon" aria-hidden="true">${esc(goal.icon || '◎')}</span><h3>${esc(goal.name)}</h3><div class="savings-detail-amounts"><strong data-money>${money(goal.current)}</strong><span>${say('od', 'of')} ${money(goal.target)}</span></div><div class="savings-detail-progress" role="progressbar" aria-label="${esc(goal.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(percent)}"><span style="width:${percent}%"></span></div><p>${Math.round(percent)}% ${say('cilja ostvareno', 'of goal completed')}</p></div><dl class="savings-detail-metrics"><div><dt>${say('Još je potrebno', 'Remaining')}</dt><dd data-money>${money(remaining)}</dd></div><div><dt>${say('Mjesečno do roka', 'Monthly until target')}</dt><dd data-money>${metrics?.monthlyRequired == null ? '—' : money(metrics.monthlyRequired)}</dd></div><div><dt>${say('Ciljani datum', 'Target date')}</dt><dd>${esc(scheduled)}</dd></div><div><dt>${say('Zaokruživanje', 'Round-ups')}</dt><dd>${goal.roundUpsEnabled ? say('Uključeno', 'Enabled') : say('Isključeno', 'Disabled')}</dd></div></dl><p class="savings-detail-note">${say('Mjesečna uplata dijeli preostali iznos s brojem mjeseci do zadanog roka. Pregled ne mijenja stanje ni plan.', 'Monthly contribution divides the remaining amount by months until the target date. This preview does not change balances or your plan.')}</p><button type="button" class="secondary-button" id="savingsDetailAutomation">${say('Pravila štednje', 'Savings rules')}</button><h3>${say('Uplate u ovaj cilj', 'Deposits to this goal')}</h3>${entriesMarkup(detail.entries, detail.goals)}`;
    el('savingsDetailAutomation').addEventListener('click', () => { if (!sameOwner(snapshot(), owner)) { close(goalDialog); return; } close(goalDialog); root.MerVaultsUI?.open('automation', goalId); });
    footer(goalDialog, [
      { id:'edit', label:say('Uredi cilj', 'Edit goal'), run:() => bridge().openGoalEditor(goalId) },
      { id:'deposit', label:say('Dodaj uplatu', 'Add deposit'), primary:true, run:() => bridge().openDeposit(goalId) }
    ]);
  }
  function open(kind, goalId = null) {
    const s = snapshot();
    if (!s?.profile || s.authenticated === false || root.MerEnterpriseSecurity?.isLocked?.()) return;
    ensureDialogs(); owner = { profileId:s.profileId, sessionId:s.sessionId };
    activeGoal = goalId;
    active = kind === 'history' ? historyDialog : kind === 'strategy' ? el('savingsStrategyModal') : goalDialog;
    if (kind === 'history') renderHistory();
    else if (kind !== 'strategy') { if (!savingsDetail(s, goalId)) { active = null; owner = null; return; } renderGoal(); }
    bridge().openModal(active);
  }
  function makeClickable(card, kind, goalId, label) {
    if (!card) return;
    card.dataset.savingsSummary = kind; card.dataset.savingsGoal = goalId || '';
    card.setAttribute('tabindex', '0'); card.setAttribute('role', 'button'); card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-label', label); card.setAttribute('aria-controls', kind === 'history' ? 'savingsHistoryDetailModal' : kind === 'strategy' ? 'savingsStrategyModal' : 'savingsGoalDetailModal');
    let hint = card.querySelector('.savings-summary-link');
    if (!hint) { hint = doc.createElement('span'); hint.className = 'savings-summary-link'; hint.setAttribute('aria-hidden', 'true'); card.append(hint); }
    hint.textContent = kind === 'strategy' ? say('Pregledaj strategiju ↗', 'Review strategy ↗') : say('Prikaži detalje ↗', 'View details ↗');
    if (bound.has(card)) return; bound.add(card);
    const activate = event => {
      if (doc.body.classList.contains('layout-editing') || event.target.closest('button,a,input,select,textarea,.layout-drag-handle')) return;
      if (event.type === 'keydown' && (event.target !== card || !['Enter', ' '].includes(event.key))) return;
      if (event.type === 'keydown') event.preventDefault();
      const selection = root.getSelection?.();
      if (event.type === 'click' && selection?.toString() && card.contains(selection.anchorNode)) return;
      open(card.dataset.savingsSummary, card.dataset.savingsGoal || null);
    };
    card.addEventListener('click', activate); card.addEventListener('keydown', activate);
  }
  function refresh() {
    if (!bridge()) return;
    ensureDialogs(); const s = snapshot(), detail = savingsDetail(s), primary = detail.goals.find(goal => goal.primary) || detail.goals[0];
    makeClickable(doc.querySelector('#savingsView .savings-history-card'), 'history', null, say('Povijest štednje — prikaži detalje', 'Savings history — view details'));
    el('contributionChart')?.setAttribute('tabindex', '-1');
    makeClickable(el('savingsRecommendationCard'), 'strategy', null, say('MER Preporuka — pregledaj strategiju', 'MER Recommendation — review strategy'));
    const coverageLabel = doc.querySelector('#savingsRecommendationCard .recommendation-stat span');
    if (coverageLabel) { coverageLabel.removeAttribute('data-i18n'); coverageLabel.textContent = say('Pokrivenost', 'Coverage'); }
    if (primary) makeClickable(doc.querySelector('#savingsView .savings-hero'), 'goal', primary.id, `${primary.name} — ${say('detalji cilja', 'goal details')}`);
    doc.querySelectorAll('#goalBucketGrid .goal-bucket-card').forEach(card => {
      const goalId = card.querySelector('[data-edit-goal]')?.dataset.editGoal;
      const goal = detail.goals.find(item => item.id === goalId);
      if (goal) makeClickable(card, 'goal', goal.id, `${goal.name} — ${say('detalji cilja', 'goal details')}`);
    });
    if (active?.open) {
      if (!sameOwner(s, owner)) { close(active); return; }
      const focused = active.contains(doc.activeElement) ? doc.activeElement.id : '';
      const body = active.querySelector('.savings-detail-body'), previousScroll = body?.scrollTop || 0;
      if (active === historyDialog) renderHistory(); else if (active === goalDialog) renderGoal();
      if (body) body.scrollTop = previousScroll;
      if (focused) el(focused)?.focus({ preventScroll:true });
    }
  }
  root.MerSavingsMinimal = Object.freeze({ ...api, open, refresh });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', refresh, { once:true }); else refresh();
})(typeof window !== 'undefined' ? window : globalThis);
