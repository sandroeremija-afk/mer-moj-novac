(function exposeNaturalInputUI(root){
  'use strict';
  const N=root.MerNaturalInput;if(!N||!root.document)return;
  const document=root.document,el=id=>document.getElementById(id),bridge=()=>root.MerEngagementBridge,snapshot=()=>bridge()?.snapshot?.()||{};
  const copy=(hr,en)=>snapshot().language==='en'?en:hr;
  let panel,dialog,owner='',serial=0,controller,recognition,recording=false,busy=false;
  const ownerKey=state=>[state.profileId,state.sessionId,state.language,state.currency].join('|');
  const live=()=>dialog?.open&&snapshot().authenticated!==false&&!root.MerEnterpriseSecurity?.isLocked?.();
  const formSignature=()=>['transactionName','transactionAmount','transactionCategory','transactionDate'].map(id=>el(id)?.value||'').join('|')+'|'+dialog.querySelector('[data-transaction-type][aria-pressed="true"]')?.getAttribute('data-transaction-type');
  function status(text,error=false){const node=el('naturalInputStatus');node.textContent=text;node.hidden=!text;node.classList.toggle('is-error',error);node.setAttribute('role',error?'alert':'status');}
  function stop(){serial++;controller?.abort();controller=null;if(recognition){recognition.onresult=null;recognition.onerror=null;recognition.onend=null;try{recognition.abort();}catch{}recognition=null;}recording=false;busy=false;if(panel)renderLabels();}
  function requestData(){
    const state=snapshot(),profile=state.profile||{};
    const categories=Array.isArray(state.categories)?state.categories:[...(profile.categories||[]).map(item=>({id:item.id,name:item.name||item.nameKey||item.id,type:'expense'})),...(profile.incomeCategories||[]).map(item=>({id:item.id,name:item.name||item.nameKey||item.id,type:'income'}))];
    return {text:el('naturalInputText').value,referenceDate:state.referenceDate,currency:state.currency||'EUR',categories};
  }
  function renderLabels(){
    if(!panel)return;
    const toggleLabel=copy('Unesi rečenicom','Enter a sentence');
    el('naturalInputToggle').setAttribute('aria-label',toggleLabel);el('naturalInputToggle').setAttribute('title',toggleLabel);
    el('naturalInputBack').textContent=copy('Natrag na obrazac','Back to form');
    el('naturalInputHint').textContent=copy('Opišite prihod ili trošak. Prijedlog provjerite u obrascu prije spremanja.','Describe income or an expense. Review the suggestion in the form before saving.');
    el('naturalSpeechNotice').textContent=copy('Mikrofon koristi prepoznavanje govora preglednika, koje može poslati glas svojem servisu.','The microphone uses your browser’s speech recognition, which may send audio to its service.');
    el('naturalInputLabel').textContent=copy('Opišite jednu transakciju','Describe one transaction');
    el('naturalInputText').placeholder=copy('Npr. Potrošio sam 15 € u Konzumu…','E.g. I spent €15 at Konzum…');
    el('naturalConsentLabel').textContent=copy('Dopuštam slanje rečenice i naziva kategorija servisu Google Gemini.','I allow this sentence and category names to be sent to Google Gemini.');
    el('naturalPrivacySummary').textContent=copy('Stanja i povijest ne šalju se. Lokalni unos radi bez slanja.','Balances and history are not sent. Local fill sends no data.');
    el('naturalInputAI').textContent=busy?copy('Pripremam prijedlog…','Preparing a suggestion…'):copy('Ispuni uz AI','Fill with AI');
    el('naturalInputLocal').textContent=copy('Ispuni lokalno','Fill locally');
    el('naturalInputAI').disabled=busy||recording;el('naturalInputLocal').disabled=busy||recording;
    el('naturalMic').setAttribute('aria-label',recording?copy('Zaustavi mikrofon','Stop microphone'):copy('Pokreni mikrofon','Start microphone'));
    el('naturalMic').setAttribute('title',recording?copy('Zaustavi mikrofon','Stop microphone'):copy('Pokreni mikrofon','Start microphone'));
    el('naturalMic').setAttribute('aria-pressed',String(recording));el('naturalMic').disabled=busy;
  }
  function show(){el('naturalInputBody').hidden=false;el('naturalInputToggle').setAttribute('aria-expanded','true');dialog.classList.toggle('is-natural-input-open',true);}
  function hideEditor(){el('naturalInputBody').hidden=true;el('naturalInputToggle').setAttribute('aria-expanded','false');dialog.classList.toggle('is-natural-input-open',false);}
  function apply(result,request,guard,localFailure=false){
    if(!guard())return;
    const draft=N.validateDraft(result?.draft,request);
    if(!draft||!draft.amount){status(copy('Iznos nije jasan. Opišite samo jednu transakciju s iznosom, npr. „35,50 eura u Konzumu”.','The amount is unclear. Describe just one transaction with an amount, e.g. “35.50 euros at Konzum”.'),true);return;}
    if(!draft.type||!draft.date){status(copy('Datum ili vrsta transakcije nisu jasni. Dopunite rečenicu ili ispunite obrazac ručno.','The date or transaction type is unclear. Clarify the sentence or fill in the form manually.'),true);return;}
    if(draft.currency!==snapshot().currency){status(copy('Prepoznata je druga valuta. Iznos nije prenesen; unesite odgovarajući iznos ručno. Tečaj se ne preračunava.','A different currency was detected. The amount was not applied; enter the appropriate amount manually. No currency conversion is performed.'),true);return;}
    try{if(!bridge()?.applyTransactionDraft||bridge().applyTransactionDraft(draft)===false)throw new Error('FORM_CHANGED');}catch{status(copy('Obrazac se promijenio. Pokušajte ponovno.','The form changed. Please try again.'),true);return;}
    const prefix=result.source==='gemini'?copy('Gemini prijedlog ispunjen.','Gemini suggestion filled in.'):localFailure?copy('Gemini nije dostupan — ispunjen je lokalni prijedlog.','Gemini is unavailable — a local suggestion was filled in.'):copy('Lokalni prijedlog ispunjen, bez slanja podataka.','Local suggestion filled in without sending data.');
    hideEditor();
    status(`${prefix} ${copy('Provjerite obrazac prije spremanja.','Review the form before saving.')} ${!draft.categoryId||!draft.merchant?copy('Dopunite nedostajuća polja.','Complete missing fields.'):''}`);
    el(draft.categoryId?'transactionAmount':'transactionCategory')?.focus();
  }
  async function parse(source){
    if(!live()||busy)return;show();const request=N.validateRequest(requestData());
    if(!request){status(copy('Unesite kratku rečenicu (do 600 znakova).','Enter a short sentence (up to 600 characters).'),true);return;}
    if(source==='gemini'&&!el('naturalConsent').checked){status(copy('Za AI obradu potvrdite slanje teksta ili odaberite „Ispuni lokalno”.','Allow text sharing for AI processing or choose “Fill locally”.'),true);el('naturalConsent').focus();return;}
    stop();const job=serial,current=snapshot(),key=ownerKey(current),form=formSignature(),text=el('naturalInputText').value,revision=current.revision;
    const guard=()=>job===serial&&live()&&key===ownerKey(snapshot())&&revision===snapshot().revision&&form===formSignature()&&text===el('naturalInputText').value;
    if(source==='local'){apply(N.parseLocal(request),request,guard);return;}
    controller=new AbortController();const pendingController=controller;busy=true;renderLabels();status(copy('Gemini priprema prijedlog za pregled…','Gemini is preparing a suggestion for review…'));
    const timeout=setTimeout(()=>pendingController.abort(),20000);
    try{
      const response=await fetch('/api/transaction-parse',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},signal:pendingController.signal,body:JSON.stringify({...request,consent:true})});
      if(!response.ok)throw new Error('UNAVAILABLE');const raw=await response.text();if(raw.length>20000)throw new Error('LARGE_RESPONSE');const result=JSON.parse(raw);
      if(result.source!=='gemini')throw new Error('INVALID_SOURCE');
      if(!guard()){if(job===serial&&live()&&key===ownerKey(snapshot()))status(copy('Obrazac je izmijenjen. Prijedlog nije primijenjen; pokušajte ponovno.','The form was edited. The suggestion was not applied; try again.'));return;}
      apply(result,request,guard);
    }catch{
      if(guard())apply(N.parseLocal(request),request,guard,true);
    }finally{clearTimeout(timeout);if(job===serial){busy=false;controller=null;renderLabels();}}
  }
  function startSpeech(){
    if(!live())return;show();
    if(recording){recognition?.stop();return;}
    const Recognition=root.SpeechRecognition||root.webkitSpeechRecognition;
    if(!Recognition){status(copy('Ovaj preglednik ne podržava glasovni unos. Upišite rečenicu; lokalni i AI unos i dalje rade.','This browser does not support voice entry. Type a sentence; local and AI entry remain available.'),true);el('naturalInputText').focus();return;}
    stop();const job=serial,key=ownerKey(snapshot());
    try{
      const active=new Recognition();let heard=false,failed=false;recognition=active;active.lang=snapshot().language==='en'?'en-GB':'hr-HR';active.continuous=false;active.interimResults=false;active.maxAlternatives=1;
      active.onresult=event=>{if(job!==serial||!live()||key!==ownerKey(snapshot()))return;const transcript=event.results?.[0]?.[0]?.transcript;if(typeof transcript==='string'){heard=true;el('naturalInputText').value=transcript.slice(0,N.MAX_TEXT);status(copy('Govor je pretvoren u tekst. Provjerite tekst pa odaberite AI ili lokalno ispunjavanje.','Speech was transcribed. Check the text, then choose AI or local fill.'));}};
      active.onerror=event=>{if(job!==serial)return;failed=true;active.onresult=null;recognition=null;recording=false;renderLabels();status(event.error==='not-allowed'||event.error==='service-not-allowed'?copy('Pristup mikrofonu nije dopušten. Rečenicu možete upisati ručno.','Microphone access was denied. You can type the sentence instead.'):copy('Govor nije prepoznat. Pokušajte ponovno ili upišite tekst.','Speech could not be recognized. Retry or type the text.'),true);};
      active.onend=()=>{if(job!==serial)return;recognition=null;recording=false;renderLabels();if(!heard&&!failed)status(copy('Glasovni unos je zaustavljen. Pokušajte ponovno ili upišite tekst.','Voice entry stopped. Retry or type the text.'));};
      active.start();recording=true;renderLabels();status(copy('Slušam… Recite jednu transakciju.','Listening… Say one transaction.'));
    }catch{recording=false;recognition=null;renderLabels();status(copy('Mikrofon trenutačno nije dostupan. Upišite tekst ručno.','The microphone is unavailable. Type the text instead.'),true);}
  }
  function init(){
    if(panel)return;dialog=el('transactionModal');if(!dialog)return;
    const payment=dialog.querySelector('.transaction-payment-method');
    if(payment)dialog.querySelector('.transaction-details-row')?.append(payment);
    panel=document.createElement('section');panel.className='natural-input-card';panel.id='naturalInputCard';
    panel.innerHTML='<button type="button" class="natural-input-toggle" id="naturalInputToggle" aria-expanded="false" aria-controls="naturalInputBody"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z"></path><path d="m20 2 .6 1.4L22 4l-1.4.6L20 6l-.6-1.4L18 4l1.4-.6L20 2Z"></path></svg></button><div id="naturalInputBody" hidden><button type="button" class="natural-input-back" id="naturalInputBack"></button><p class="natural-input-hint" id="naturalInputHint"></p><label for="naturalInputText" id="naturalInputLabel"></label><div class="natural-sentence-row"><input type="text" id="naturalInputText" maxlength="600" autocomplete="off" enterkeyhint="done"><button type="button" class="secondary-button natural-mic" id="naturalMic" aria-pressed="false" aria-describedby="naturalSpeechNotice"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"></path></svg></button></div><p class="natural-privacy" id="naturalSpeechNotice"></p><label class="natural-consent"><input type="checkbox" id="naturalConsent"><span id="naturalConsentLabel"></span></label><p class="natural-privacy" id="naturalPrivacySummary"></p><div class="natural-input-actions"><button type="button" class="secondary-button" id="naturalInputLocal"></button><button type="button" class="primary-button" id="naturalInputAI"></button></div></div><p id="naturalInputStatus" class="natural-status" role="status" aria-live="polite" hidden></p>';
    dialog.insertBefore(panel,el('transactionForm'));
    el('naturalInputToggle').addEventListener('click',()=>{if(el('naturalInputBody').hidden){show();el('naturalInputText').focus();}else{stop();hideEditor();status('');}});
    el('naturalInputBack').addEventListener('click',()=>{stop();hideEditor();status('');el('naturalInputToggle').focus();});
    el('naturalInputAI').addEventListener('click',()=>parse('gemini'));el('naturalInputLocal').addEventListener('click',()=>parse('local'));el('naturalMic').addEventListener('click',startSpeech);
    el('naturalInputText').addEventListener('input',()=>{if(busy)stop();status('');});
    el('naturalConsent').addEventListener('change',()=>{if(busy&&!el('naturalConsent').checked){stop();status(copy('AI obrada je zaustavljena.','AI processing was stopped.'));}});
    dialog.addEventListener('close',reset);dialog.addEventListener('cancel',stop);root.addEventListener?.('mer-security-status',render);renderLabels();
  }
  function reset(){if(!panel)return;stop();owner=ownerKey(snapshot());el('naturalInputText').value='';el('naturalConsent').checked=false;hideEditor();status('');}
  function render(){if(!panel)return;if(owner&&owner!==ownerKey(snapshot())||root.MerEnterpriseSecurity?.isLocked?.()){reset();return;}owner=ownerKey(snapshot());renderLabels();}
  root.MerNaturalInputUI={init,render,reset};
})(typeof window==='undefined'?globalThis:window);
