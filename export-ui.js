(function initializeMerExportUI(root) {
  'use strict';
  if (!root.document) return;
  const document = root.document;
  const contexts = new Set(['budget', 'activity', 'savings', 'insights']);
  const timeframes = new Set(['daily', 'monthly', 'custom-month', 'ytd', 'all']);
  const formats = new Set(['csv', 'pdf', 'json']);
  let exportDialog, transferDialog, owner = null, selection = null, requestId = 0, busy = false, returnTrigger = null;
  const el = id => document.getElementById(id);
  const bridge = () => root.MerExportBridge;
  const snapshot = () => bridge()?.snapshot?.();
  const say = (hr, en) => (snapshot()?.language === 'en' ? en : hr);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
  const ownerOf = state => [state?.profileId, state?.sessionId, state?.language, state?.currency, state?.timezone].join('|');
  const revisionOf = state => state?.revision ?? JSON.stringify(state?.profile ?? {});
  function available(state) {
    return Boolean(state?.profile && state?.profileId && state.authenticated !== false && !root.MerEnterpriseSecurity?.isLocked?.());
  }
  function close(dialog) {
    if (!dialog?.open) return;
    (bridge()?.closeModal || (node => node.close()))(dialog);
    // The next modal must capture the visible module trigger, not a choice in
    // the dialog that just closed. This also restores keyboard focus on Cancel.
    if (returnTrigger?.isConnected && returnTrigger.getClientRects?.().length && !returnTrigger.closest?.('dialog:not([open])')) returnTrigger.focus?.({preventScroll:true});
  }
  function rememberReturnTrigger() {
    const active = document.activeElement;
    if (active && !active.closest?.('.export-dialog')) returnTrigger = active;
  }
  function invalidate() {
    requestId += 1;
    busy = false;
    if (exportDialog) {
      exportDialog.removeAttribute('aria-busy');
      el('exportDownload').disabled = false;
      el('exportDownload').textContent = say('Preuzmi datoteku', 'Download file');
    }
  }
  function error(message = '') {
    el('exportError').textContent = message;
    el('exportError').hidden = !message;
  }
  function bindDialog(dialog) {
    dialog.querySelectorAll('[data-export-close]').forEach(button => button.addEventListener('click', () => close(dialog)));
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(dialog); });
    dialog.addEventListener('close', invalidate);
    root.MerRuntime?.bindDialogBackdropDismiss(dialog, () => close(dialog));
  }
  function ensureDialogs() {
    if (exportDialog) return;
    exportDialog = document.createElement('dialog');
    exportDialog.id = 'izvozModal';
    exportDialog.className = 'modal export-dialog';
    exportDialog.setAttribute('aria-labelledby', 'exportTitle');
    exportDialog.setAttribute('aria-describedby', 'exportDescription');
    exportDialog.innerHTML = `<header class="export-header"><button type="button" class="secondary-button export-back" id="exportBack"><span aria-hidden="true">←</span><span id="exportBackLabel"></span></button><div><span class="export-profile" id="exportProfile"></span><h2 id="exportTitle"></h2></div><button type="button" class="icon-button" data-export-close id="exportClose">×</button></header><form id="exportForm" novalidate><div class="export-body"><p id="exportDescription" class="export-intro"></p><div class="export-fields"><label for="exportTimeframe"><span id="exportTimeframeLabel"></span><select id="exportTimeframe"><option value="daily"></option><option value="monthly"></option><option value="custom-month"></option><option value="ytd"></option><option value="all"></option></select></label><label for="exportFormat"><span id="exportFormatLabel"></span><select id="exportFormat"><option value="csv">CSV</option><option value="pdf">PDF</option><option value="json">JSON</option></select></label><label for="exportMonth" id="exportMonthField" hidden><span id="exportMonthLabel"></span><input id="exportMonth" type="month" min="1900-01" max="9999-12" aria-describedby="exportError"></label></div><section class="export-preview" aria-live="polite" aria-atomic="true"><h3 id="exportPreviewTitle"></h3><p id="exportPeriod"></p><p id="exportCount"></p><dl id="exportSummary"></dl><p id="exportEmpty" hidden></p></section><p class="export-notes" id="exportNotes"></p><p id="exportError" class="export-error" role="alert" hidden></p></div><footer class="export-footer"><button type="button" class="secondary-button" data-export-close id="exportCancel"></button><button type="submit" class="primary-button" id="exportDownload"></button></footer></form>`;
    transferDialog = document.createElement('dialog');
    transferDialog.id = 'activityTransferModal';
    transferDialog.className = 'modal export-dialog export-transfer-dialog';
    transferDialog.setAttribute('aria-labelledby', 'activityTransferTitle');
    transferDialog.setAttribute('aria-describedby', 'activityTransferDescription');
    transferDialog.innerHTML = `<header class="export-header"><div><span class="export-profile" id="activityTransferProfile"></span><h2 id="activityTransferTitle"></h2></div><button type="button" class="icon-button" data-export-close id="activityTransferClose">×</button></header><div class="export-body"><p id="activityTransferDescription" class="export-intro"></p><div class="export-transfer-choices"><button type="button" id="activityTransferImport"><span class="export-choice-icon" aria-hidden="true">↓</span><span><strong id="activityTransferImportTitle"></strong><small id="activityTransferImportHint"></small></span><span aria-hidden="true">→</span></button><button type="button" id="activityTransferExport"><span class="export-choice-icon" aria-hidden="true">↑</span><span><strong id="activityTransferExportTitle"></strong><small id="activityTransferExportHint"></small></span><span aria-hidden="true">→</span></button></div><p id="activityTransferError" class="export-error" role="alert" hidden></p></div><footer class="export-footer"><button type="button" class="secondary-button" data-export-close id="activityTransferCancel"></button></footer>`;
    document.body.append(exportDialog, transferDialog);
    el('exportTimeframe').setAttribute('autofocus', '');
    el('activityTransferImport').setAttribute('autofocus', '');
    bindDialog(exportDialog);
    bindDialog(transferDialog);
    el('exportBack').addEventListener('click', openActivityTransfer);
    el('exportForm').addEventListener('submit', download);
    ['exportTimeframe', 'exportMonth', 'exportFormat'].forEach(id => el(id).addEventListener('change', () => {
      invalidate();
      selection.timeframe = el('exportTimeframe').value;
      selection.month = el('exportMonth').value;
      selection.format = el('exportFormat').value;
      renderPreview();
    }));
    el('exportMonth').addEventListener('input', () => {
      invalidate();
      selection.month = el('exportMonth').value;
      renderPreview();
    });
    el('activityTransferExport').addEventListener('click', () => open('activity', { fromActivity:true }));
    el('activityTransferImport').addEventListener('click', () => {
      const state = snapshot();
      if (!available(state) || owner !== ownerOf(state)) { close(transferDialog); return; }
      const importError = el('activityTransferError');
      importError.hidden = true;
      if (!bridge()?.openImport) {
        importError.textContent = say('Uvoz trenutačno nije dostupan. Pokušajte ponovno.', 'Import is currently unavailable. Please try again.');
        importError.hidden = false;
        return;
      }
      close(transferDialog);
      bridge().openImport();
    });
  }
  function defaultMonth(state) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(state.referenceDate || ''))) return state.referenceDate.slice(0, 7);
    const date = state.referenceDate instanceof Date ? state.referenceDate : new Date(state.referenceDate || Date.now());
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {year:'numeric', month:'2-digit', timeZone:state.timezone || 'Europe/Zagreb'}).formatToParts(date);
      return `${parts.find(part => part.type === 'year').value}-${parts.find(part => part.type === 'month').value}`;
    } catch { return new Date().toISOString().slice(0, 7); }
  }
  function localizedTitles() {
    return {budget:say('Izvoz budžeta', 'Export budgets'), activity:say('Izvoz transakcija', 'Export transactions'), savings:say('Izvoz štednje', 'Export savings'), insights:say('Izvoz izvještaja', 'Export report')};
  }
  function profileLabel(state) {
    return state.profile.accountName || state.profile.name || (state.profileId === 'business' ? say('Poslovni račun', 'Business account') : say('Osobni račun', 'Personal account'));
  }
  function renderLabels(state) {
    el('exportTitle').textContent = localizedTitles()[selection.context];
    el('exportProfile').textContent = profileLabel(state);
    el('exportDescription').textContent = say('Odaberite razdoblje i format. Datoteka sadrži samo podatke aktivnog profila.', 'Choose a period and format. The file includes only the active profile’s data.');
    el('exportBack').hidden = !selection.fromActivity;
    el('exportBackLabel').textContent = say('Natrag', 'Back');
    el('exportClose').setAttribute('aria-label', say('Zatvori', 'Close'));
    el('exportTimeframeLabel').textContent = say('Razdoblje', 'Period');
    const labels = [say('Danas', 'Today'), say('Ovaj mjesec', 'This month'), say('Određeni mjesec', 'Specific month'), say('Ova godina', 'This year'), say('Sve ukupno', 'All time')];
    el('exportTimeframe').querySelectorAll('option').forEach((option, index) => { option.textContent = labels[index]; });
    el('exportFormatLabel').textContent = say('Format datoteke', 'File format');
    el('exportMonthLabel').textContent = say('Odaberite mjesec', 'Choose a month');
    el('exportPreviewTitle').textContent = say('Sažetak izvoza', 'Export summary');
    el('exportCancel').textContent = say('Otkaži', 'Cancel');
    el('exportDownload').textContent = say('Preuzmi datoteku', 'Download file');
    el('exportEmpty').textContent = say('Nema zapisa u odabranom razdoblju. Možete preuzeti prazan izvještaj ili promijeniti razdoblje.', 'There are no records in this period. You can download an empty report or select another period.');
  }
  function reportFor(state) {
    if (!timeframes.has(selection.timeframe) || !formats.has(selection.format)) throw new Error('INVALID_SELECTION');
    if (selection.timeframe === 'custom-month' && !/^(?:19|[2-9]\d)\d{2}-(?:0[1-9]|1[0-2])$/.test(selection.month || '')) throw new Error('INVALID_MONTH');
    return root.MerExportCore.buildReport({...state, context:selection.context, timeframe:selection.timeframe, month:selection.month,
      categoryLabel:bridge()?.categoryLabel, incomeCategoryLabel:bridge()?.incomeCategoryLabel});
  }
  function renderPreview() {
    const state = snapshot();
    if (!selection || !available(state)) return;
    el('exportMonthField').hidden = selection.timeframe !== 'custom-month';
    el('exportMonth').required = selection.timeframe === 'custom-month';
    error();
    try {
      const report = reportFor(state);
      el('exportPeriod').textContent = report.period.label;
      el('exportCount').textContent = say(`Broj zapisa: ${report.recordCount}`, `Records: ${report.recordCount}`);
      el('exportSummary').innerHTML = report.summary.map(item => `<div><dt>${esc(item.label)}</dt><dd data-monetary>${esc(item.value)}</dd></div>`).join('');
      el('exportNotes').textContent = report.notes.join(' ');
      el('exportEmpty').hidden = report.recordCount !== 0;
      el('exportDownload').disabled = busy;
    } catch (cause) {
      el('exportPeriod').textContent = '';
      el('exportCount').textContent = '';
      el('exportSummary').innerHTML = '';
      el('exportNotes').textContent = '';
      el('exportEmpty').hidden = true;
      el('exportDownload').disabled = true;
      error(cause.message === 'INVALID_MONTH' ? say('Odaberite valjan mjesec za izvoz.', 'Choose a valid month to export.') : say('Izvještaj nije moguće pripremiti. Provjerite odabrano razdoblje.', 'The report could not be prepared. Check the selected period.'));
    }
  }
  function open(context, options = {}) {
    if (!contexts.has(context)) return false;
    const state = snapshot();
    if (!available(state) || !root.MerExportCore) return false;
    rememberReturnTrigger();
    ensureDialogs();
    close(transferDialog);
    invalidate();
    owner = ownerOf(state);
    const chosenTimeframe = options.timeframe || (context === 'insights' ? state.insightsTimeframe : 'monthly');
    selection = {context, timeframe:timeframes.has(chosenTimeframe) ? chosenTimeframe : 'monthly', month:options.month || defaultMonth(state), format:'csv', fromActivity:options.fromActivity === true};
    el('exportTimeframe').value = selection.timeframe;
    el('exportMonth').value = selection.month;
    el('exportFormat').value = selection.format;
    renderLabels(state);
    renderPreview();
    (bridge().openModal || (node => node.showModal()))(exportDialog);
    return true;
  }
  function openActivityTransfer() {
    const state = snapshot();
    if (!available(state)) return false;
    rememberReturnTrigger();
    ensureDialogs();
    close(exportDialog);
    owner = ownerOf(state);
    el('activityTransferProfile').textContent = profileLabel(state);
    el('activityTransferTitle').textContent = say('Uvoz / Izvoz', 'Import / Export');
    el('activityTransferDescription').textContent = say('Dodajte bankovni izvod ili preuzmite transakcije ovog profila.', 'Add a bank statement or download this profile’s transactions.');
    el('activityTransferClose').setAttribute('aria-label', say('Zatvori', 'Close'));
    el('activityTransferImportTitle').textContent = say('Uvoz transakcija', 'Import transactions');
    el('activityTransferImportHint').textContent = say('CSV, Excel ili bankovni izvod. Pregledajte podatke prije spremanja.', 'CSV, Excel or bank statement. Review the data before saving.');
    el('activityTransferExportTitle').textContent = say('Izvoz transakcija', 'Export transactions');
    el('activityTransferExportHint').textContent = say('Odaberite razdoblje i format: CSV, PDF ili JSON.', 'Choose a period and format: CSV, PDF or JSON.');
    el('activityTransferCancel').textContent = say('Otkaži', 'Cancel');
    el('activityTransferError').hidden = true;
    (bridge().openModal || (node => node.showModal()))(transferDialog);
    return true;
  }
  async function download(event) {
    event.preventDefault();
    if (busy || !exportDialog?.open) return;
    const state = snapshot();
    if (!available(state) || owner !== ownerOf(state)) { close(exportDialog); return; }
    selection.timeframe = el('exportTimeframe').value;
    selection.month = el('exportMonth').value;
    selection.format = el('exportFormat').value;
    let report;
    try { report = reportFor(state); } catch { renderPreview(); return; }
    const job = ++requestId, revision = revisionOf(state), signature = JSON.stringify(selection), format = selection.format;
    busy = true;
    error();
    exportDialog.setAttribute('aria-busy', 'true');
    el('exportDownload').disabled = true;
    el('exportDownload').textContent = say('Pripremam datoteku…', 'Preparing file…');
    try {
      let data, type;
      if (format === 'pdf') {
        if (!root.MerExportPdf?.create) throw new Error('PDF_UNAVAILABLE');
        data = await root.MerExportPdf.create(report);
        type = 'application/pdf';
      } else if (format === 'json') {
        data = JSON.stringify(report, null, 2);
        type = 'application/json;charset=utf-8';
      } else {
        const csv = root.MerExportCore.toCsv(report);
        data = csv.startsWith('\uFEFF') ? csv : `\uFEFF${csv}`;
        type = 'text/csv;charset=utf-8';
      }
      const current = snapshot();
      if (job !== requestId || !exportDialog.open || !available(current) || owner !== ownerOf(current) || revision !== revisionOf(current) || signature !== JSON.stringify(selection)) {
        if (job === requestId && exportDialog.open) error(say('Podaci ili postavke su se promijenili. Ponovno preuzmite ažurirani izvještaj.', 'The data or settings changed. Download the updated report again.'));
        return;
      }
      const url = URL.createObjectURL(new Blob([data], {type}));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${report.filenameStem}.${format}`;
      document.body.append(anchor);
      try { anchor.click(); } finally { anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
      bridge()?.onDownloaded?.(report, format);
    } catch {
      if (job === requestId && exportDialog.open) error(say('Preuzimanje nije uspjelo. Pokušajte ponovno ili odaberite drugi format.', 'Download failed. Please retry or choose another format.'));
    } finally {
      if (job === requestId) {
        busy = false;
        exportDialog.removeAttribute('aria-busy');
        el('exportDownload').disabled = false;
        el('exportDownload').textContent = say('Preuzmi datoteku', 'Download file');
      }
    }
  }
  function refresh() {
    if (!exportDialog?.open && !transferDialog?.open) return;
    const state = snapshot();
    if (!available(state) || owner !== ownerOf(state)) {
      invalidate(); close(exportDialog); close(transferDialog); return;
    }
    if (exportDialog.open && !busy) renderPreview();
  }
  root.addEventListener?.('mer-security-status', refresh);
  root.MerExportUI = {open, openActivityTransfer, refresh};
})(typeof window === 'undefined' ? globalThis : window);
