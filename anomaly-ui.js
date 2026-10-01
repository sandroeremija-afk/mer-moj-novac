(function installAnomalyNotification() {
  'use strict';
  const readFingerprints = new Map();
  const storagePrefix = 'mer-anomaly-read-v1:';

  function notification() {
    const session = window.MerAuthProvider?.currentSession?.();
    const userId = String(session?.userId || session?.email || (session?.demo ? 'demo-user' : '')).trim().toLocaleLowerCase('en');
    if (!userId || !window.MerAnomalies || !window.MerCore || document.querySelector('#appShell')?.hidden || window.MerEnterpriseSecurity?.isLocked?.() || document.body?.classList.contains('mfa-locked')) return null;
    const batch = window.MerAssistantUi?.anomalyBatch?.() || [];
    if (!batch.length) return null;
    const facts = batch.map(item => [item.categoryId,item.current,item.average,item.currency,item.currentStart,item.currentEnd,item.baselineStart,item.baselineEnd]).sort((a,b) => String(a[0]).localeCompare(String(b[0])));
    // Persist only comparison fingerprints, never category names or amounts.
    const key = storagePrefix + window.MerCore.stableTransactionHash(JSON.stringify([userId,appState.activeAccount]));
    const fingerprint = window.MerCore.stableTransactionHash(JSON.stringify(facts));
    return {key,fingerprint};
  }

  function isRead(item) {
    if (readFingerprints.get(item.key) === item.fingerprint) return true;
    try { return window.localStorage?.getItem(item.key) === item.fingerprint; }
    catch { return false; }
  }

  function refresh() {
    const button = document.querySelector('#assistantFab');
    const badge = button?.querySelector('.assistant-fab-status');
    // Hide old markup too when a cached page loads the updated notification code.
    const legacyAlert = document.querySelector('#spendingAnomalyAlert');
    if (legacyAlert) { legacyAlert.hidden = true;legacyAlert.replaceChildren(); }
    if (!button || !badge) return;
    const item = notification();
    const unread = Boolean(item && !isRead(item));
    const english = currentLang === 'en';
    badge.hidden = !unread;
    badge.textContent = unread ? '1' : '';
    const label = english ? 'Open AI financial assistant' : 'Otvori AI financijskog asistenta';
    button.setAttribute('aria-label', unread ? `${label} · ${english ? 'New Mer AI message' : 'Nova poruka Mer AI'}` : label);
    button.setAttribute('title', unread ? (english ? 'New Mer AI message' : 'Nova poruka Mer AI') : label);
  }

  function markRead() {
    const item = notification();
    if (!item) return refresh();
    if (!isRead(item)) {
      readFingerprints.set(item.key, item.fingerprint);
      try { window.localStorage?.setItem(item.key, item.fingerprint); }
      catch { /* The in-memory acknowledgement still works when storage is blocked. */ }
    }
    refresh();
  }

  window.MerAnomalyUI = Object.freeze({refresh,markRead});
  refresh();
})();
