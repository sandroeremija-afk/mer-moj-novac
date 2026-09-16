(function quickTools(){
  'use strict';
  const core=window.MerQuickToolsCore,el=id=>document.getElementById(id),copy=(hr,en)=>currentLang==='en'?en:hr;
  // Lucide Calculator, ISC license: https://lucide.dev/icons/calculator
  const calculatorIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M8 6h8M16 14v4M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"/></svg>';
  const trigger=document.createElement('button');trigger.type='button';trigger.id='calculatorTrigger';trigger.className='icon-button';trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls','calculatorModal');trigger.innerHTML=calculatorIcon;
  el('commandTrigger').after(trigger);
  const dialog=document.createElement('dialog');dialog.id='calculatorModal';dialog.className='modal quick-calculator';dialog.setAttribute('aria-labelledby','calculatorTitle');
  dialog.innerHTML='<header><h2 id="calculatorTitle"></h2><button type="button" class="modal-close" data-close-calculator>×</button></header><form id="calculatorForm"><label for="calculatorExpression" id="calculatorLabel"></label><input id="calculatorExpression" type="text" inputmode="decimal" maxlength="120" autocomplete="off" spellcheck="false" placeholder="125,50 + 20" aria-describedby="calculatorResult"><output id="calculatorResult" aria-live="polite"></output><div class="calculator-keys"></div></form><footer class="modal-actions"><button class="secondary-button" type="button" data-close-calculator></button></footer>';
  document.body.append(dialog);
  const input=el('calculatorExpression'),result=el('calculatorResult');
  const shell=el('appShell');
  let owner='';
  function syncCalculatorAccess(){
    const session=window.MerAuthProvider?.currentSession?.();
    const available=Boolean(session?.userId&&shell&&!shell.hidden&&!shell.inert&&!document.body.classList.contains('mfa-locked')&&!window.MerEnterpriseSecurity?.isLocked?.());
    const active=available?`${session.userId}:${appState.activeAccount}`:'';
    if(!active||(owner&&owner!==active)){
      input.value='';result.textContent='';result.classList.remove('is-error');
      if(dialog.open)closeModal(dialog);
    }
    owner=active;trigger.disabled=!available;
    return available;
  }
  // These changes can happen without a financial-state render (expired sessions,
  // remote revocation, MFA and locking), while this dialog lives outside appShell.
  if(shell)new MutationObserver(syncCalculatorAccess).observe(shell,{attributes:true,attributeFilter:['hidden','inert']});
  new MutationObserver(syncCalculatorAccess).observe(document.body,{attributes:true,attributeFilter:['class']});
  window.addEventListener('mer-security-status',syncCalculatorAccess);
  window.addEventListener('storage',syncCalculatorAccess);
  document.addEventListener('visibilitychange',syncCalculatorAccess);
  const keys=['C','⌫','(',')','7','8','9','÷','4','5','6','×','1','2','3','−','0',',','=','+'];
  dialog.querySelector('.calculator-keys').innerHTML=keys.map(key=>`<button type="button" data-calculator-key="${key}" class="${key==='='?'primary-button':'secondary-button'}">${key}</button>`).join('');
  function evaluate(){if(!syncCalculatorAccess()||!dialog.open)return;const answer=core.calculate(input.value);result.textContent=answer.ok?new Intl.NumberFormat(currentLang==='en'?'en-GB':'hr-HR',{maximumFractionDigits:10}).format(answer.value):copy(answer.error==='zero'?'Dijeljenje nulom nije moguće.':'Provjerite uneseni izraz.',answer.error==='zero'?'Cannot divide by zero.':'Check the expression.');result.classList.toggle('is-error',!answer.ok);}
  el('calculatorForm').addEventListener('submit',event=>{event.preventDefault();evaluate();});
  input.addEventListener('input',()=>{if(!syncCalculatorAccess())return;result.textContent='';result.classList.remove('is-error');});
  dialog.querySelector('.calculator-keys').addEventListener('click',event=>{if(!syncCalculatorAccess()||!dialog.open)return;const key=event.target.closest('[data-calculator-key]')?.dataset.calculatorKey;if(!key)return;if(key==='='){evaluate();return;}if(key==='C'){input.value='';result.textContent='';}else{const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;input.setRangeText(key==='⌫'?'':key,key==='⌫'&&start===end?Math.max(0,start-1):start,end,'end');input.value=input.value.slice(0,120);result.textContent='';}input.focus({preventScroll:true});});
  dialog.querySelectorAll('[data-close-calculator]').forEach(button=>button.addEventListener('click',()=>closeModal(dialog)));
  MerRuntime.bindDialogBackdropDismiss(dialog,()=>closeModal(dialog));
  dialog.addEventListener('cancel',event=>{if(event.target!==dialog)return;event.preventDefault();closeModal(dialog);});
  dialog.addEventListener('close',()=>{trigger.setAttribute('aria-expanded','false');syncModalLayer();});
  function position(){if(!dialog.open)return;const rect=trigger.getBoundingClientRect(),viewport=window.visualViewport;const width=viewport?.width||innerWidth,height=viewport?.height||innerHeight;dialog.style.left=`${Math.max(12,Math.min(width-dialog.offsetWidth-12,rect.right-dialog.offsetWidth))}px`;dialog.style.top=`${Math.max(12,Math.min(rect.bottom+10,height-dialog.offsetHeight-12))}px`;}
  trigger.addEventListener('click',()=>{render();if(!syncCalculatorAccess())return;openModal(dialog);trigger.setAttribute('aria-expanded','true');position();input.focus({preventScroll:true});});
  window.addEventListener('resize',position,{passive:true});window.visualViewport?.addEventListener('resize',position,{passive:true});
  function render(){syncCalculatorAccess();const title=copy('Kalkulator','Calculator');trigger.setAttribute('aria-label',title);trigger.title=title;el('calculatorTitle').textContent=title;el('calculatorLabel').textContent=copy('Izračun','Calculation');dialog.querySelectorAll('[data-close-calculator]').forEach(button=>{button.setAttribute('aria-label',copy('Zatvori','Close'));if(!button.classList.contains('modal-close'))button.textContent=copy('Zatvori','Close');});dialog.querySelector('[data-calculator-key="⌫"]').setAttribute('aria-label',copy('Izbriši znamenku','Delete digit'));dialog.querySelector('[data-calculator-key="C"]').setAttribute('aria-label',copy('Očisti izračun','Clear calculation'));if(dialog.open&&result.textContent&&!result.classList.contains('is-error'))evaluate();}

  window.MerQuickTools=Object.freeze({render});render();
})();
