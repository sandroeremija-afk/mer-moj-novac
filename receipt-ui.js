(function initializeReceiptUI(root) {
  'use strict';
  const R = root.MerReceipts;
  if (!R || !root.document) return;
  const bridge = () => root.MerEnterpriseBridge;
  const snapshot = () => bridge()?.getState?.() || {};
  const profileId = () => snapshot().activeProfile;
  const profile = () => snapshot().profiles?.[profileId()] || {};
  const copy = (hr,en) => (snapshot().language || document.documentElement.lang) === 'en' ? en : hr;
  const x = R.escapeHtml;
  const decimal = cents => cents === null || cents === undefined ? '' : (cents / 100).toFixed(2);
  const money = (cents,currency = 'EUR') => new Intl.NumberFormat(snapshot().language==='en'?'en-IE':'hr-HR',{style:'currency',currency}).format((cents || 0)/100);
  let dialog, receipt, preparedImage, previewUrl, guard, owner, controller, selectedId = '', preferredId = '', viewedTransactionId = '', returnFocus;
  const current = () => dialog?.open && profileId() === owner;
  const uid = () => `receipt-${root.crypto.randomUUID()}`;
  function clearImage() { if (previewUrl) URL.revokeObjectURL(previewUrl); previewUrl = ''; preparedImage = null; }
  function stop() { guard?.invalidate(); controller?.abort(); controller = null; }
  function close() { if (dialog?.open) { if(bridge()?.closeModal)bridge().closeModal(dialog);else dialog.close(); } }
  function showError(message) { const box=dialog.querySelector('[data-receipt-error]'); if(box){box.textContent=message;box.hidden=!message;} }
  function heading(title) {
    return `<header class="receipt-head"><div><span>${copy('Računi i potvrde','Receipts and invoices')} · ${owner==='business'?copy('Poslovni profil','Business profile'):copy('Osobni profil','Personal profile')}</span><h2 id="receiptDialogTitle">${x(title)}</h2></div><button type="button" class="icon-button" data-receipt-close aria-label="${copy('Zatvori','Close')}">×</button></header>`;
  }
  function bindClose() { dialog.querySelectorAll('[data-receipt-close]').forEach(button=>button.addEventListener('click',close)); }
  function renderUpload(message = '') {
    dialog.innerHTML = `${heading(copy('Skenirajte i povežite račun','Scan and match a receipt'))}<div class="receipt-body"><p class="receipt-intro">${copy('Dodajte fotografiju računa. Pregledat ćete očitane stavke i potvrditi povezivanje s postojećom transakcijom.','Add a receipt photo. Review extracted items and confirm the link to an existing transaction.')}</p><div class="receipt-drop" id="receiptDrop" tabindex="0" role="button" aria-label="${copy('Odaberite fotografiju računa','Choose a receipt photo')}">${previewUrl?`<img src="${x(previewUrl)}" alt="${copy('Odabrani račun','Selected receipt')}"><span>${x(receipt.fileName)}</span>`:`<strong>${copy('Povucite račun ovdje','Drop a receipt here')}</strong><span>${copy('ili odaberite fotografiju · JPEG, PNG, WebP','or choose a photo · JPEG, PNG, WebP')}</span>`}</div><div class="receipt-upload-actions"><button class="secondary-button" type="button" id="receiptChoose">${copy('Odaberi datoteku','Choose file')}</button><button class="secondary-button" type="button" id="receiptCamera">${copy('Fotografiraj račun','Take photo')}</button></div><input id="receiptFile" type="file" accept="image/jpeg,image/png,image/webp" hidden><input id="receiptCameraFile" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden><label class="receipt-check"><input type="checkbox" id="receiptConsent"><span>${copy('Dopuštam slanje ove fotografije Google Gemini servisu radi očitavanja. Fotografija može sadržavati osobne podatke. Podaci o mojim bankovnim transakcijama ne šalju se.','I consent to sending this photo to Google Gemini for extraction. It may contain personal information. My bank transaction data will not be sent.')}</span></label><p class="receipt-note">${copy('Fotografija se ne sprema uz transakciju; spremit će se samo potvrđeni podaci računa.','The photo is not stored with the transaction; only reviewed receipt details are saved.')}</p><p role="alert" data-receipt-error ${message?'':'hidden'}>${x(message)}</p><div id="receiptLoading" class="receipt-loading" hidden role="status"><span>${copy('Očitavam račun…','Reading receipt…')}</span><i></i><i></i><i></i></div></div><footer class="receipt-footer"><button class="secondary-button" type="button" data-receipt-close>${copy('Otkaži','Cancel')}</button><button class="secondary-button" type="button" id="receiptManual">${copy('Unesi ručno','Enter manually')}</button><button class="primary-button" type="button" id="receiptAnalyze" ${preparedImage?'':'disabled'}>${copy('Očitaj račun','Read receipt')}</button></footer>`;
    bindClose();
    const input=dialog.querySelector('#receiptFile'), camera=dialog.querySelector('#receiptCameraFile'), drop=dialog.querySelector('#receiptDrop');
    const change=event=>{const file=event.target.files?.[0];if(file)prepareFile(file);};
    input.addEventListener('change',change);camera.addEventListener('change',change);
    dialog.querySelector('#receiptChoose').addEventListener('click',()=>input.click());
    dialog.querySelector('#receiptCamera').addEventListener('click',()=>camera.click());
    drop.addEventListener('click',()=>input.click());
    drop.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();input.click();}});
    drop.addEventListener('dragover',event=>{event.preventDefault();drop.classList.add('dragging');});
    drop.addEventListener('dragleave',()=>drop.classList.remove('dragging'));
    drop.addEventListener('drop',event=>{event.preventDefault();drop.classList.remove('dragging');const file=event.dataTransfer?.files?.[0];if(file)prepareFile(file);});
    dialog.querySelector('#receiptManual').addEventListener('click',()=>{stop();receipt.source='manual';renderReview();});
    dialog.querySelector('#receiptAnalyze').addEventListener('click',analyze);
  }
  async function prepareFile(file) {
    stop();
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 12*1024*1024) return showError(copy('Odaberite JPEG, PNG ili WebP fotografiju do 12 MB.','Choose a JPEG, PNG or WebP photo up to 12 MB.'));
    const token=guard.begin(), objectUrl=URL.createObjectURL(file);
    try {
      const image=new Image();image.src=objectUrl;await image.decode();
      if (!guard.current(token,profileId()) || !current()) return;
      if (image.naturalWidth*image.naturalHeight > 50000000 || !image.naturalWidth) throw new Error('IMAGE_DIMENSIONS');
      const ratio=Math.min(1,2048/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
      const context=canvas.getContext('2d');if(!context)throw new Error('CANVAS');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.87));
      if(!blob||blob.size>2*1024*1024)throw new Error('IMAGE_SIZE');
      const bytes=await blob.arrayBuffer(), hash=await root.crypto.subtle.digest('SHA-256',bytes);
      if(!guard.current(token,profileId())||!current())return;
      let binary='';for(const byte of new Uint8Array(bytes))binary+=String.fromCharCode(byte);
      clearImage();previewUrl=URL.createObjectURL(blob);preparedImage={mimeType:'image/jpeg',data:btoa(binary)};
      receipt=R.normalizeReceipt({id:uid(),source:'manual',imageHash:[...new Uint8Array(hash)].map(byte=>byte.toString(16).padStart(2,'0')).join(''),fileName:file.name});selectedId='';
      renderUpload();
    } catch {if(guard.current(token,profileId())&&current())showError(copy('Fotografiju nije moguće otvoriti. Pokušajte s manjom slikom ili unesite podatke ručno.','The image could not be opened. Try a smaller photo or enter details manually.'));}
    finally {URL.revokeObjectURL(objectUrl);}
  }
  async function analyze() {
    if(!current()||!preparedImage)return;
    if(!dialog.querySelector('#receiptConsent').checked)return showError(copy('Za AI očitavanje potvrdite pristanak ili odaberite ručni unos.','Consent to AI extraction or choose manual entry.'));
    stop();const token=guard.begin(), requestController=new AbortController();controller=requestController;
    const loading=dialog.querySelector('#receiptLoading');loading.hidden=false;
    dialog.querySelector('#receiptAnalyze').disabled=true;showError('');
    const timer=setTimeout(()=>requestController.abort(),26000);
    try {
      const response=await fetch('/api/receipt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:preparedImage,consent:true,locale:snapshot().language==='en'?'en':'hr'}),signal:requestController.signal});
      const payload=await response.json();
      if(!guard.current(token,profileId())||!current())return;
      if(!response.ok||payload.source!=='gemini'||!payload.receipt)throw Object.assign(new Error('OCR'),{code:payload.error});
      receipt=R.normalizeReceipt({...payload.receipt,id:receipt.id,imageHash:receipt.imageHash,fileName:receipt.fileName,source:'gemini'});
      renderReview(payload.currencyAssumed?copy('Valuta nije očitana; provjerite predloženi EUR.','Currency was unreadable; verify the suggested EUR.'):'');
    } catch(failure) {
      if(!guard.current(token,profileId())||!current())return;
      const message=failure.code==='OCR_NOT_CONFIGURED'?copy('AI očitavanje nije konfigurirano. Podatke možete unijeti ručno.','AI extraction is not configured. You can enter the details manually.'):failure.code==='OCR_RATE_LIMITED'?copy('Dosegnuto je ograničenje očitavanja. Pokušajte za minutu ili unesite podatke ručno.','Extraction is rate limited. Retry in a minute or enter details manually.'):copy('Očitavanje nije uspjelo. Nijedan podatak nije izmišljen ni spremljen; nastavite ručno ili pokušajte ponovno.','Extraction failed. No data was invented or saved; continue manually or try again.');
      renderUpload(message);
    } finally {clearTimeout(timer);if(controller===requestController)controller=null;}
  }
  function field(name,label,value,options='') {return `<label>${x(label)}<input name="${x(name)}" value="${x(value??'')}" ${options}></label>`;}
  function lineFields(line,index) {return `<div class="receipt-line" data-receipt-line>${field('description',copy('Stavka','Item'),line.description,'maxlength="240" required')}${field('quantity',copy('Količina','Quantity'),line.quantity,'type="number" min="0.001" max="1000000" step="0.001"')}${field('lineTotal',copy('Iznos stavke','Line total'),decimal(line.totalCents),'type="number" min="0" step="0.01" required')}<button type="button" class="icon-button" data-remove-line="${index}" aria-label="${copy('Ukloni stavku','Remove item')} ${index+1}">×</button></div>`;}
  function capture() {
    const form=dialog.querySelector('#receiptReviewForm'), values=new FormData(form);
    return R.normalizeReceipt({...receipt,merchant:values.get('merchant'),date:values.get('date'),currency:values.get('currency'),totalCents:R.parseMoney(values.get('total')),type:values.get('type'),invoiceNumber:values.get('invoiceNumber'),reviewed:values.get('reviewed')==='on',lines:[...form.querySelectorAll('[data-receipt-line]')].map(row=>({description:row.querySelector('[name="description"]').value,quantity:row.querySelector('[name="quantity"]').value?Number(row.querySelector('[name="quantity"]').value):null,totalCents:R.parseMoney(row.querySelector('[name="lineTotal"]').value)}))});
  }
  function renderReview(message='') {
    dialog.innerHTML=`${heading(copy('Provjerite i povežite','Review and match'))}<form id="receiptReviewForm" class="receipt-form"><div class="receipt-body"><p class="receipt-intro">${receipt.source==='gemini'?copy('AI prijedlog — provjerite svako polje prije potvrde.','AI suggestion — check each field before confirming.'):copy('Ručni pregled — automatsko očitavanje nije korišteno.','Manual review — automatic extraction was not used.')}</p><div class="receipt-fields">${field('merchant',copy('Trgovac / izdavatelj','Merchant / issuer'),receipt.merchant,'required maxlength="160"')}${field('date',copy('Datum računa','Receipt date'),receipt.date,'type="date" required')}${field('total',copy('Ukupni iznos','Total amount'),decimal(receipt.totalCents),'type="number" min="0.01" step="0.01" required')}<label>${copy('Valuta','Currency')}<select name="currency">${[...new Set(['EUR','USD','GBP','CHF',receipt.currency])].map(value=>`<option ${receipt.currency===value?'selected':''}>${value}</option>`).join('')}</select></label><label>${copy('Vrsta transakcije','Transaction type')}<select name="type"><option value="expense" ${receipt.type==='expense'?'selected':''}>${copy('Trošak','Expense')}</option><option value="income" ${receipt.type==='income'?'selected':''}>${copy('Prihod','Income')}</option></select></label>${field('invoiceNumber',copy('Broj računa (neobavezno)','Document number (optional)'),receipt.invoiceNumber,'maxlength="80"')}</div><details class="receipt-lines" ${receipt.lines.length?'open':''}><summary>${copy('Stavke računa','Receipt items')} (${receipt.lines.length})</summary><div id="receiptLines">${receipt.lines.map(lineFields).join('')}</div><button class="secondary-button" type="button" id="receiptAddLine">${copy('+ Dodaj stavku','+ Add item')}</button></details><p class="receipt-note" id="receiptLineWarning"></p><div class="receipt-match-head"><h3>${copy('Podudarne transakcije','Matching transactions')}</h3><label class="receipt-check"><input type="checkbox" id="receiptIncludeManual"><span>${copy('Uključi ručne unose','Include manual entries')}</span></label></div><p class="receipt-note">${copy('Isti iznos i valuta, datum unutar 7 dana. Odaberite transakciju; povezivanje nikada ne mijenja iznos niti stvara novi unos.','Same amount and currency, date within 7 days. Choose a transaction; linking never changes amounts or creates an entry.')}</p><div id="receiptMatches" role="radiogroup" aria-label="${copy('Odaberite transakciju','Choose a transaction')}"></div><label class="receipt-check receipt-approval"><input type="checkbox" name="reviewed" required><span>${copy('Provjerio/la sam podatke računa i odabranu transakciju.','I have checked the receipt details and selected transaction.')}</span></label><p role="alert" data-receipt-error ${message?'':'hidden'}>${x(message)}</p></div><footer class="receipt-footer"><button class="secondary-button" type="button" id="receiptBack">${copy('Natrag','Back')}</button><button class="secondary-button" type="button" data-receipt-close>${copy('Otkaži','Cancel')}</button><button class="primary-button" type="submit" id="receiptAttach" disabled>${copy('Poveži s transakcijom','Link to transaction')}</button></footer></form>`;
    bindClose();
    dialog.querySelector('#receiptBack').addEventListener('click',()=>{receipt=capture();renderUpload();});
    dialog.querySelector('#receiptAddLine').addEventListener('click',()=>{receipt=capture();if(receipt.lines.length>=R.MAX_LINES)return showError(copy('Najviše 100 stavki.','Maximum 100 items.'));receipt.lines.push({description:'',quantity:1,totalCents:null});renderReview();dialog.querySelector('#receiptLines').lastElementChild.querySelector('input').focus();});
    dialog.querySelectorAll('[data-remove-line]').forEach(button=>button.addEventListener('click',()=>{receipt=capture();receipt.lines.splice(Number(button.dataset.removeLine),1);renderReview();}));
    dialog.querySelector('#receiptReviewForm').addEventListener('input',event=>{
      if(event.target.name==='receiptTransaction'){selectedId=event.target.value;dialog.querySelector('#receiptAttach').disabled=!dialog.querySelector('[name="reviewed"]').checked;return;}
      if(event.target.name==='reviewed'){dialog.querySelector('#receiptAttach').disabled=!selectedId||!event.target.checked;return;}
      dialog.querySelector('[name="reviewed"]').checked=false;receipt=capture();renderMatches();
    });
    dialog.querySelector('#receiptReviewForm').addEventListener('submit',attach);
    renderMatches();
  }
  function renderMatches() {
    if(!current())return;
    const check=R.reviewReceipt(receipt), warning=dialog.querySelector('#receiptLineWarning');
    warning.textContent=check.linesMismatch?copy(`Zbroj stavki (${money(check.linesCents,receipt.currency)}) razlikuje se od ukupnog iznosa. Provjerite popuste, napojnicu ili nedostajuće stavke.`,`Item sum (${money(check.linesCents,receipt.currency)}) differs from the total. Check discounts, tips or missing items.`):'';
    const includeManual=dialog.querySelector('#receiptIncludeManual').checked;
    const candidates=R.matchTransactions(receipt,profile(),owner,{includeManual,currency:snapshot().currency||'EUR'});
    if(!candidates.some(item=>item.id===selectedId))selectedId='';
    if(!selectedId&&preferredId&&candidates.some(item=>item.id===preferredId))selectedId=preferredId;
    dialog.querySelector('#receiptMatches').innerHTML=candidates.length?candidates.map(item=>`<label class="receipt-match"><input type="radio" name="receiptTransaction" value="${x(item.id)}" ${selectedId===item.id?'checked':''}><span><strong>${x(item.name)}</strong><small>${x(item.date)} · ${x(item.source)} · ${item.merchantMatch?copy('Trgovac se podudara','Merchant matches'):copy('Provjerite trgovca','Check merchant')}</small></span><strong data-monetary>${x(money(item.amountCents,item.currency))}</strong></label>`).join(''):`<p class="receipt-empty">${check.valid?copy('Nema podudaranja. Provjerite podatke, uključite ručne unose ili prvo sinkronizirajte banku. Nova transakcija neće se automatski dodati.','No match. Check the details, include manual entries or sync your bank first. No transaction will be added automatically.'):copy('Unesite trgovca, valjan datum, iznos i stavke da biste pronašli transakciju.','Enter a merchant, valid date, total and item details to find a transaction.')}</p>`;
    dialog.querySelector('#receiptAttach').disabled=!selectedId||!dialog.querySelector('[name="reviewed"]').checked||!check.valid;
  }
  async function attach(event) {
    event.preventDefault();if(!current())return close();receipt=capture();
    if(!selectedId||!receipt.reviewed)return;
    const button=dialog.querySelector('#receiptAttach');button.disabled=true;
    const token=guard.begin();
    try {
      if(!bridge()?.attachReceipt)throw new Error(copy('Povezivanje trenutačno nije dostupno.','Linking is unavailable right now.'));
      await bridge().attachReceipt(owner,selectedId,receipt);
      if(!guard.current(token,profileId())||!current())return;
      clearImage();dialog.innerHTML=`${heading(copy('Račun je povezan','Receipt linked'))}<div class="receipt-body receipt-success"><strong>${x(receipt.merchant)}</strong><p>${copy('Potvrđene stavke spremljene su uz odabranu transakciju. Iznosi i stanje računa ostali su nepromijenjeni.','Reviewed items were saved with the selected transaction. Amounts and account balances are unchanged.')}</p></div><footer class="receipt-footer"><button class="primary-button" type="button" data-receipt-close>${copy('Gotovo','Done')}</button></footer>`;bindClose();
    }catch(failure){if(current()){showError(failure.message);button.disabled=false;}}
  }
  function ensureDialog() {
    if(dialog)return;dialog=document.createElement('dialog');dialog.id='receiptMatcherModal';dialog.className='modal receipt-dialog';dialog.setAttribute('aria-labelledby','receiptDialogTitle');document.body.append(dialog);
    root.MerRuntime?.bindDialogBackdropDismiss(dialog,close);dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
    dialog.addEventListener('close',()=>{stop();clearImage();receipt=null;selectedId='';viewedTransactionId='';dialog.replaceChildren();if(!document.querySelector('dialog[open]'))document.body.classList.remove('modal-active');if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
  }
  function open(options={}) {
    if(!['personal','business'].includes(profileId()))return false;ensureDialog();stop();clearImage();owner=profileId();guard=R.createRequestGuard(owner);returnFocus=document.activeElement;preferredId=options.transactionId?String(options.transactionId):'';selectedId='';viewedTransactionId='';receipt=R.normalizeReceipt({id:uid()});
    renderUpload();if(bridge()?.openModal)bridge().openModal(dialog);else dialog.showModal();return true;
  }
  function storedTransaction(id) {
    return (profile().transactions||[]).find(transaction=>String(transaction.id)===String(id)&&(!transaction.profileId||transaction.profileId===owner)&&(!['personal','business'].includes(transaction.accountId)||transaction.accountId===owner));
  }
  function renderStored() {
    const transaction=storedTransaction(viewedTransactionId);
    if(!transaction){close();return false;}
    const attached=(Array.isArray(transaction.receipts)?transaction.receipts:[]).filter(item=>item&&(!item.profileId||item.profileId===owner));
    dialog.innerHTML=`${heading(copy('Povezani računi','Linked receipts'))}<div class="receipt-body"><p class="receipt-intro">${x(transaction.name||transaction.title||copy('Transakcija','Transaction'))} · ${x(transaction.date||'')}</p><p class="receipt-note">${copy('Potvrđeni podaci iz računa. Izvorna fotografija nije pohranjena. Ovaj pregled ne mijenja transakciju ni stanje.','Reviewed receipt details. The original photo is not retained. This view does not change the transaction or balance.')}</p>${attached.length?attached.map(raw=>{
      const item=R.normalizeReceipt(raw);
      return `<article class="receipt-stored"><header><div><h3>${x(item.merchant)}</h3><p>${x(item.date)}${item.invoiceNumber?` · ${x(item.invoiceNumber)}`:''}</p></div><strong data-monetary>${x(money(item.totalCents,item.currency))}</strong></header><p class="receipt-note">${item.source==='gemini'?copy('AI očitavanje · potvrđeno pregledom','AI extraction · reviewed'):copy('Ručni unos · potvrđeno pregledom','Manual entry · reviewed')}${item.fileName?` · ${x(item.fileName)}`:''}</p>${item.lines.length?`<ul class="receipt-stored-lines">${item.lines.map(line=>`<li><span>${x(line.description)}${line.quantity!==null?` <small>× ${x(line.quantity)}</small>`:''}</span><strong data-monetary>${x(money(line.totalCents,item.currency))}</strong></li>`).join('')}</ul>`:`<p class="receipt-note">${copy('Nema pohranjenih stavki.','No stored item lines.')}</p>`}</article>`;
    }).join(''):`<p class="receipt-empty">${copy('Ova transakcija još nema povezan račun.','This transaction has no linked receipt yet.')}</p>`}</div><footer class="receipt-footer"><button class="secondary-button" type="button" data-receipt-close>${copy('Zatvori','Close')}</button><button class="primary-button" type="button" id="receiptAddStored">${copy('Dodaj račun','Add receipt')}</button></footer>`;
    bindClose();dialog.querySelector('#receiptAddStored').addEventListener('click',()=>open({transactionId:viewedTransactionId}));return true;
  }
  function view(transactionId) {
    if(!['personal','business'].includes(profileId()))return false;ensureDialog();stop();clearImage();owner=profileId();guard=R.createRequestGuard(owner);returnFocus=document.activeElement;viewedTransactionId=String(transactionId);receipt=null;
    if(!renderStored())return false;if(bridge()?.openModal)bridge().openModal(dialog);else if(!dialog.open)dialog.showModal();return true;
  }
  function refresh() {if(dialog?.open&&profileId()!==owner)close();else if(dialog?.open&&viewedTransactionId)renderStored();else if(dialog?.open&&dialog.querySelector('#receiptMatches'))renderMatches();}
  document.addEventListener('mer:locked',close);document.addEventListener('mer:profile-change',close);
  root.MerReceiptUI={open,view,close,refresh};
})(window);
