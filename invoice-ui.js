(function initializeMerInvoiceUI(root) {
  'use strict';
  const core = root.MerInvoices;
  if (!core || !root.document) return;
  const bridge = () => root.MerEnterpriseBridge;
  const snapshot = () => bridge()?.getState?.() || {};
  const business = () => snapshot().profiles?.business || snapshot().accounts?.business || {};
  const isBusiness = () => (snapshot().activeProfile || snapshot().activeAccount) === 'business';
  const en = () => (snapshot().language || document.documentElement.lang) === 'en';
  const say = (hr, english) => en() ? english : hr;
  const x = core.escapeXml;
  const amount = cents => new Intl.NumberFormat(en() ? 'en-IE' : 'hr-HR', { style:'currency', currency:'EUR', minimumFractionDigits:2, maximumFractionDigits:2 }).format(cents / 100);
  let dialog, draft = null, preview = null, originFocus;

  function close() {
    if (!dialog?.open) return;
    if (bridge()?.closeModal) bridge().closeModal(dialog); else dialog.close();
  }
  function error(message) {
    const target = dialog.querySelector('[data-invoice-error]');
    target.textContent = message;
    target.hidden = !message;
    if (message) target.scrollIntoView({ block:'nearest', behavior:'smooth' });
  }
  function dateToday() {
    const now = new Date();
    return new Intl.DateTimeFormat('sv-SE', { timeZone:'Europe/Zagreb' }).format(now);
  }
  function freshDraft() {
    const previous = business().enterprise?.invoices?.at(-1);
    return { number:'', issueDate:dateToday(), dueDate:dateToday(), seller:previous?.seller || { name:'Elektronički računi d.o.o.', country:'HR' }, buyer:{}, lines:[{ description:'', quantity:1, unitPrice:'', kpd:'', vatRate:25 }], note:'' };
  }
  function input(name, label, value = '', options = '') {
    return `<label>${x(label)}<input name="${x(name)}" value="${x(value)}" ${options}></label>`;
  }
  function partyFields(prefix, party, title) {
    return `<fieldset class="invoice-party"><legend>${x(title)}</legend>${input(`${prefix}Name`, say('Naziv tvrtke', 'Company name'), party.name, 'required maxlength="200" autocomplete="organization"')}${input(`${prefix}Oib`, 'OIB', party.oib, 'required inputmode="numeric" pattern="[0-9]{11}" maxlength="11"')}${input(`${prefix}Address`, say('Ulica i broj', 'Street address'), party.address, 'required maxlength="200" autocomplete="street-address"')}<div class="invoice-two">${input(`${prefix}PostalCode`, say('Poštanski broj', 'Postal code'), party.postalCode, 'required inputmode="numeric" pattern="[0-9]{5}" maxlength="5"')}${input(`${prefix}City`, say('Mjesto', 'City'), party.city, 'required maxlength="100"')}</div>${prefix === 'seller' ? input('sellerIban', 'IBAN (HR)', party.iban, 'required maxlength="30" autocomplete="off"') : ''}</fieldset>`;
  }
  function lineRow(line, index) {
    return `<fieldset class="invoice-line" data-invoice-line><legend>${say('Stavka', 'Item')} ${index + 1}</legend>${input('description', say('Roba ili usluga', 'Goods or service'), line.description, 'required maxlength="500"')}<div class="invoice-line-numbers">${input('quantity', say('Količina', 'Quantity'), line.quantity, 'type="number" min="0.001" max="1000000" step="0.001" required')}${input('unitPrice', say('Cijena bez PDV-a (€)', 'Net unit price (€)'), line.unitPrice, 'type="number" min="0.01" step="0.01" required')}${input('kpd', 'KPD 2025', line.kpd, 'required placeholder="62.20.20" maxlength="8" pattern="[0-9]{2}\\.?[0-9]{2}\\.?[0-9]{2}"')}<button class="secondary-button invoice-remove" type="button" data-invoice-remove="${index}" aria-label="${say('Ukloni stavku', 'Remove item')} ${index + 1}" ${draft.lines.length === 1 ? 'disabled' : ''}>${say('Ukloni', 'Remove')}</button></div></fieldset>`;
  }
  function renderForm() {
    preview = null;
    dialog.innerHTML = `<header class="invoice-head"><div><span class="invoice-eyebrow">${say('Poslovni prostor', 'Business workspace')}</span><h2 id="merInvoiceTitle">${say('Nacrt e-Računa', 'e-Invoice draft')}</h2></div><button type="button" class="modal-close" data-invoice-close aria-label="${say('Zatvori', 'Close')}">×</button></header>
      <form id="merInvoiceForm" class="invoice-form"><div class="invoice-body"><p class="invoice-description">${say('Pripremite domaći račun u eurima. Iznosi su neto, a PDV je 25%.', 'Prepare a domestic invoice in euros. Prices are net, with 25% VAT.')}</p><div class="invoice-three">${input('number', say('Broj računa', 'Invoice number'), draft.number, 'required maxlength="60" placeholder="1-P1-1"')}${input('issueDate', say('Datum izdavanja', 'Issue date'), draft.issueDate, 'type="date" min="2026-01-01" max="2099-12-31" required')}${input('dueDate', say('Dospijeće', 'Due date'), draft.dueDate, 'type="date" min="2026-01-01" max="2099-12-31" required')}</div><div class="invoice-two">${partyFields('seller', draft.seller, say('Izdavatelj', 'Seller'))}${partyFields('buyer', draft.buyer, say('Kupac', 'Buyer'))}</div>
      <label class="invoice-vat-check"><input type="checkbox" name="vatRegistered" ${draft.seller.vatRegistered ? 'checked' : ''} required><span>${say('Izdavatelj je u sustavu PDV-a; sve stavke podliježu domaćem PDV-u 25%.', 'The seller is VAT registered; all items are domestic supplies taxed at 25%.')}</span></label>
      <div id="merInvoiceLines">${draft.lines.map(lineRow).join('')}</div><button type="button" class="secondary-button" data-invoice-add>${say('+ Dodaj stavku', '+ Add item')}</button>${input('note', say('Napomena (neobavezno)', 'Note (optional)'), draft.note, 'maxlength="1000"')}<p class="invoice-caveat">${say('Nacrt nije fiskaliziran. Prije izdavanja potrebno je provjeriti KPD i potvrditi račun putem ovlaštenog sustava e-Računa.', 'Drafts are not fiscalized. Verify KPD codes and validate the invoice through an authorized e-Invoicing system before issuing.')}</p><p class="invoice-error" role="alert" data-invoice-error hidden></p><details class="invoice-saved"><summary>${say('Spremljeni nacrti', 'Saved drafts')} (${business().enterprise?.invoices?.length || 0})</summary><div class="invoice-saved-list">${renderSavedList()}</div></details></div>
      <footer class="invoice-footer"><button class="secondary-button" type="button" data-invoice-close>${say('Otkaži', 'Cancel')}</button><button class="primary-button" type="submit">${say('Pregledaj račun', 'Preview invoice')}</button></footer></form>`;
    bindForm();
  }
  function renderSavedList() {
    const items = business().enterprise?.invoices || [];
    return items.length ? [...items].reverse().map(item => `<button type="button" class="invoice-saved-row" data-invoice-load="${x(item.id)}"><span><strong>${x(item.number)}</strong><small>${x(item.buyer?.name)} · ${x(item.issueDate)}</small></span><strong data-monetary>${x(amount(item.totalCents))}</strong></button>`).join('') : `<p>${say('Još nema spremljenih nacrta.', 'No saved drafts yet.')}</p>`;
  }
  function capture() {
    const form = dialog.querySelector('form');
    const values = new FormData(form);
    const party = prefix => ({ name:values.get(`${prefix}Name`), oib:values.get(`${prefix}Oib`), address:values.get(`${prefix}Address`), city:values.get(`${prefix}City`), postalCode:values.get(`${prefix}PostalCode`), country:'HR', ...(prefix === 'seller' ? { iban:values.get('sellerIban'), vatRegistered:values.get('vatRegistered') === 'on' } : {}) });
    return { ...draft, profileId:'business', number:values.get('number'), issueDate:values.get('issueDate'), dueDate:values.get('dueDate'), seller:party('seller'), buyer:party('buyer'), note:values.get('note'), lines:[...form.querySelectorAll('[data-invoice-line]')].map(row => ({ description:row.querySelector('[name="description"]').value, quantity:row.querySelector('[name="quantity"]').value, unitPrice:row.querySelector('[name="unitPrice"]').value, kpd:row.querySelector('[name="kpd"]').value, vatRate:25 })) };
  }
  function bindForm() {
    dialog.querySelectorAll('[data-invoice-close]').forEach(button => button.addEventListener('click', close));
    dialog.querySelector('[data-invoice-add]').addEventListener('click', () => {
      draft = capture();
      if (draft.lines.length >= 100) return error(say('Najviše 100 stavki po nacrtu.', 'Maximum 100 items per draft.'));
      draft.lines.push({ description:'', quantity:1, unitPrice:'', kpd:'', vatRate:25 });
      renderForm();
      dialog.querySelector('#merInvoiceLines').lastElementChild.querySelector('input').focus();
    });
    dialog.querySelectorAll('[data-invoice-remove]').forEach(button => button.addEventListener('click', () => {
      draft = capture();
      draft.lines.splice(Number(button.dataset.invoiceRemove), 1);
      renderForm();
      dialog.querySelector('[data-invoice-add]').focus();
    }));
    dialog.querySelectorAll('[data-invoice-load]').forEach(button => button.addEventListener('click', () => {
      if (!isBusiness()) return close();
      const saved = business().enterprise?.invoices?.find(item => item.id === button.dataset.invoiceLoad);
      if (saved) { draft = structuredClone(saved); renderForm(); dialog.querySelector('[name="number"]').focus(); }
    }));
    dialog.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      if (!isBusiness()) return close();
      try { draft = capture(); preview = core.createDraft(draft, 'business'); draft.id = preview.id; renderPreview(); } catch (failure) { error(failure.message); }
    });
  }
  function qrSvg(invoice) {
    if (typeof root.qrcode !== 'function') return '';
    const encoder = root.qrcode(0, 'M');
    // Encode non-ASCII JSON characters as escapes for interoperable byte mode.
    encoder.addData(core.qrPayload(invoice).replace(/[\u007F-\uFFFF]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`), 'Byte');
    encoder.make();
    return encoder.createSvgTag({ cellSize:3, margin:12, scalable:true });
  }
  function documentHtml(invoice) {
    const party = item => `<strong>${x(item.name)}</strong><span>${x(item.address)}</span><span>${x(item.postalCode)} ${x(item.city)}, HR</span><span>OIB: ${x(item.oib)}</span>`;
    return `<article class="invoice-paper"><div class="invoice-paper-heading"><div><span class="invoice-draft-badge">${say('NACRT · nije fiskaliziran', 'DRAFT · not fiscalized')}</span><h3>${say('Račun', 'Invoice')} ${x(invoice.number)}</h3><p>${say('Izdano', 'Issued')}: ${x(invoice.issueDate)} · ${say('Dospijeće', 'Due')}: ${x(invoice.dueDate)}</p></div><strong class="invoice-brand">mer</strong></div><div class="invoice-two invoice-parties"><div><small>${say('Izdavatelj', 'Seller')}</small>${party(invoice.seller)}</div><div><small>${say('Kupac', 'Buyer')}</small>${party(invoice.buyer)}</div></div><div class="invoice-table-wrap"><table class="invoice-table"><thead><tr><th>${say('Opis / KPD', 'Description / KPD')}</th><th>${say('Kol.', 'Qty')}</th><th>${say('Cijena', 'Price')}</th><th>PDV</th><th>${say('Osnovica', 'Net')}</th></tr></thead><tbody>${invoice.lines.map(line => `<tr><td>${x(line.description)}<small>${x(line.kpd)}</small></td><td>${x(line.quantity)}</td><td data-monetary>${x(amount(line.unitPriceCents))}</td><td>25%</td><td data-monetary>${x(amount(line.netCents))}</td></tr>`).join('')}</tbody></table></div><div class="invoice-bottom"><div class="invoice-payment"><p>IBAN: <strong>${x(invoice.seller.iban)}</strong></p>${invoice.note ? `<p>${x(invoice.note)}</p>` : ''}<div class="invoice-qr" aria-label="${say('QR sa sažetkom nacrta', 'Draft summary QR')}">${qrSvg(invoice)}</div><small>${say('QR sadrži sažetak nacrta; nije HUB3 nalog za plaćanje.', 'QR contains the draft summary; it is not a HUB3 payment order.')}</small></div><dl class="invoice-totals"><div><dt>${say('Osnovica', 'Net subtotal')}</dt><dd data-monetary>${x(amount(invoice.netCents))}</dd></div><div><dt>PDV 25%</dt><dd data-monetary>${x(amount(invoice.taxCents))}</dd></div><div class="invoice-total"><dt>${say('Ukupno', 'Total')}</dt><dd data-monetary>${x(amount(invoice.totalCents))}</dd></div></dl></div></article>`;
  }
  function renderPreview() {
    dialog.innerHTML = `<header class="invoice-head"><h2 id="merInvoiceTitle">${say('Pregled nacrta', 'Draft preview')}</h2><button class="modal-close" type="button" data-invoice-close aria-label="${say('Zatvori', 'Close')}">×</button></header><div class="invoice-body">${documentHtml(preview)}<p class="invoice-caveat">${say('XML nacrt i PDF pregled nisu izdani e-Račun. Nacrt nema potpis, potvrdu sukladnosti ni fiskalizaciju. Spremanje ne dodaje prihod u Aktivnost.', 'The XML draft and PDF preview are not an issued e-Invoice. Drafts are unsigned, unvalidated and not fiscalized. Saving does not add income to Activity.')}</p><p class="invoice-error" role="alert" data-invoice-error hidden></p></div><footer class="invoice-footer"><button class="secondary-button" type="button" data-invoice-back>${say('Natrag', 'Back')}</button><button class="secondary-button" type="button" data-invoice-close>${say('Otkaži', 'Cancel')}</button><button class="secondary-button" type="button" data-invoice-xml>XML ${say('nacrt', 'draft')}</button><button class="secondary-button" type="button" data-invoice-print>PDF / ${say('Ispis', 'Print')}</button><button class="primary-button" type="button" data-invoice-save>${say('Spremi nacrt', 'Save draft')}</button></footer>`;
    dialog.querySelectorAll('[data-invoice-close]').forEach(button => button.addEventListener('click', close));
    dialog.querySelector('[data-invoice-back]').addEventListener('click', renderForm);
    dialog.querySelector('[data-invoice-xml]').addEventListener('click', () => {
      if (!isBusiness()) return close();
      const url = URL.createObjectURL(new Blob([core.toXml(preview)], { type:'application/xml;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = core.filename(preview, 'xml'); link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    dialog.querySelector('[data-invoice-print]').addEventListener('click', printPreview);
    dialog.querySelector('[data-invoice-save]').addEventListener('click', async event => {
      if (!isBusiness()) return close();
      const button = event.currentTarget;
      button.disabled = true;
      try {
        if (!bridge()?.saveInvoice) throw new Error(say('Spremanje trenutačno nije dostupno.', 'Saving is not available right now.'));
        await bridge().saveInvoice(preview);
        button.textContent = say('Nacrt spremljen', 'Draft saved');
      } catch (failure) { button.disabled = false; error(failure.message); }
    });
    dialog.querySelector('[data-invoice-back]').focus({ preventScroll:true });
  }
  function printPreview() {
    if (!isBusiness() || !preview) return close();
    const tab = root.open('', '_blank');
    if (!tab) return error(say('Dopustite skočni prozor preglednika za PDF pregled.', 'Allow browser popups to open the PDF preview.'));
    tab.opener = null;
    const css = `*{box-sizing:border-box}body{font:14px/1.5 system-ui,sans-serif;color:#152d29;margin:0;padding:32px}h3{font-size:24px;margin:10px 0}p{margin:8px 0}small{display:block;color:#506660}table{width:100%;border-collapse:collapse}th,td{text-align:right;padding:12px 8px;border-bottom:1px solid #dce6e2}th:first-child,td:first-child{text-align:left;max-width:240px;overflow-wrap:anywhere}.invoice-two{display:grid;grid-template-columns:1fr 1fr;gap:30px}.invoice-parties>div{display:grid;gap:3px}.invoice-paper-heading,.invoice-bottom{display:flex;justify-content:space-between;gap:24px}.invoice-parties{margin:28px 0}.invoice-draft-badge{font-size:12px;color:#715200}.invoice-brand{font-size:32px}.invoice-qr{width:130px}.invoice-qr svg{width:100%;height:auto}.invoice-payment{max-width:55%;overflow-wrap:anywhere}.invoice-totals{min-width:220px}.invoice-totals>div{display:flex;justify-content:space-between;gap:16px;padding:8px 0}.invoice-total{font-size:19px;font-weight:bold;border-top:2px solid #00a9e4}dd{margin:0}.invoice-bottom{margin-top:24px}@page{size:A4;margin:16mm}@media print{body{padding:0}.invoice-bottom,.invoice-parties,tr{break-inside:avoid}}`;
    tab.document.write(`<!doctype html><html lang="${en() ? 'en' : 'hr'}"><head><meta charset="utf-8"><title>${x(core.filename(preview, 'pdf'))}</title><style>${css}</style></head><body>${documentHtml(preview)}<p>${say('Nacrt za pregled — nije fiskaliziran niti potvrđen za izdavanje.', 'Draft preview — not fiscalized or validated for issue.')}</p></body></html>`);
    tab.document.close();
    setTimeout(() => { try { tab.focus(); tab.print(); } catch { /* The print preview remains available in its tab. */ } }, 150);
  }
  function ensureDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.id = 'merInvoiceModal'; dialog.className = 'modal invoice-dialog';
    dialog.setAttribute('aria-labelledby', 'merInvoiceTitle');
    document.body.appendChild(dialog);
    root.MerRuntime?.bindDialogBackdropDismiss(dialog, close);
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('close', () => {
      draft = null; preview = null;
      if (!document.querySelector('dialog[open]')) document.body.classList.remove('modal-active');
      if (originFocus?.isConnected) originFocus.focus({ preventScroll:true });
    });
  }
  function open() {
    if (!isBusiness()) { bridge()?.toast?.(say('Računi su dostupni u poslovnom profilu.', 'Invoices are available in the business profile.')); return false; }
    ensureDialog();
    originFocus = document.activeElement;
    draft = freshDraft(); renderForm();
    if (bridge()?.openModal) bridge().openModal(dialog); else { dialog.showModal(); document.body.classList.add('modal-active'); }
    return true;
  }
  // Account switches and locks must also remove business details from an open modal.
  document.addEventListener('mer:profile-change', close);
  document.addEventListener('mer:locked', close);
  root.MerInvoiceUI = { open, close, refresh:() => { if (dialog?.open && !isBusiness()) close(); } };
})(window);
