(function popupLayout(root) {
  'use strict';
  const topicForTarget = target => /changePasswordForm|currentPasswordInput|newPasswordInput|confirmNewPasswordInput|settingsTourMfa|Mfa|mfa|recovery/.test(target) ? 'access' : /activeSession|logoutOtherSessions/.test(target) ? 'sessions' : /exportSovereignty|deleteSovereignty|personalData|personalFirstName|personalLastName|personalOib|personalAddress/.test(target) ? 'personal' : /settingsTourPreferences|settingsLanguage|themeToggle|layoutEditToggle|hideBalances|baseCurrency|dateFormat|timezone/.test(target) ? 'general' : 'device';
  const hasOverflow = (scroll, client) => Number.isFinite(scroll) && Number.isFinite(client) && scroll > client + 2;
  if (typeof module === 'object' && module.exports) module.exports = {topicForTarget,hasOverflow};
  if (!root?.document) return;
  const document = root.document, dialog = document.getElementById('bankSettingsModal');
  if (!dialog) return;
  const panel = dialog.querySelector('[data-settings-panel="security"]');
  const dataSection=document.createElement('section');dataSection.className='settings-data-actions';
  dataSection.innerHTML='<h3 id="settingsDataTitle"></h3><p id="settingsDataHint"></p><div class="enterprise-action-grid"></div>';
  const dataGrid=dataSection.querySelector('.enterprise-action-grid');
  ['exportSovereignty','deleteSovereignty'].forEach(id=>{const button=document.getElementById(id);if(button)dataGrid.append(button);});
  const personalGrid=document.createElement('div');personalGrid.className='settings-personal-grid';
  const personalForm=document.getElementById('personalDataForm');personalForm.before(personalGrid);personalGrid.append(personalForm,dataSection);
  const demo=document.getElementById('demoResetCard');if(demo)dataSection.append(demo);
  const access=document.createElement('section');access.id='securityAccessCard';access.className='security-access-card';access.setAttribute('aria-labelledby','securityAccessTitle');
  access.innerHTML='<header class="security-access-header"><h3 id="securityAccessTitle"></h3><div class="security-access-tabs" role="group"><button type="button" class="secondary-button" data-access-view="password"></button><button type="button" class="secondary-button" data-access-view="mfa"></button></div></header><div class="security-access-grid"></div>';
  const accessGrid=access.querySelector('.security-access-grid');
  accessGrid.append(document.getElementById('changePasswordForm'),document.getElementById('settingsTourMfa'));
  const mfaNotice=panel.querySelector('.info-note');if(mfaNotice)access.append(mfaNotice);
  panel.append(access);
  const groups = {access:'#securityAccessCard',device:'.auto-lock-setting,.enterprise-security-actions',sessions:'.active-sessions-card'};
  const picker = document.createElement('fieldset');picker.className='settings-topic-picker';
  picker.innerHTML='<legend id="settingsTopicLabel"></legend><div class="settings-topic-options">'+Object.keys(groups).map(topic=>`<label class="settings-topic-option"><input type="radio" name="settingsTopic" value="${topic}"><span data-topic-label="${topic}"></span></label>`).join('')+'</div>';
  panel.querySelector('.settings-pane-heading').after(picker);
  panel.prepend(panel.querySelector('.settings-pane-heading'),picker);
  const choices = [...picker.querySelectorAll('input[name="settingsTopic"]')];
  for (const [topic,selector] of Object.entries(groups)) panel.querySelectorAll(selector).forEach(node=>{node.dataset.settingsTopic=topic;});
  function chooseTopic(topic) {
    const selected=Object.hasOwn(groups,topic)?topic:'access';
    choices.forEach(choice=>{choice.checked=choice.value===selected;});
    panel.querySelectorAll('[data-settings-topic]').forEach(node=>node.toggleAttribute('data-topic-hidden',node.dataset.settingsTopic!==selected));
    schedule();
  }
  function chooseAccess(view){access.dataset.accessView=view==='mfa'?'mfa':'password';access.querySelectorAll('[data-access-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.accessView===access.dataset.accessView)));schedule();}
  access.querySelectorAll('button[data-access-view]').forEach(button=>button.addEventListener('click',()=>chooseAccess(button.dataset.accessView)));
  function revealTarget(target) {const id=String(target||''),topic=topicForTarget(id);if(topic==='personal'||topic==='general'){root.MerSettings?.selectTab(topic);return;}root.MerSettings?.selectTab('security');chooseTopic(topic);if(topic==='access')chooseAccess(/Mfa|mfa|recovery/.test(id)?'mfa':'password');}
  choices.forEach(choice=>choice.addEventListener('change',()=>{if(choice.checked)chooseTopic(choice.value);}));
  dialog.addEventListener('close',()=>{chooseTopic('access');chooseAccess('password');});
  root.MerPopupLayout=Object.freeze({revealTarget});
  function labels() {
    const english=document.documentElement.lang==='en';
    const label=document.getElementById('settingsTopicLabel'),text=english?'Security topic':'Sigurnosna tema';
    if(label.textContent!==text)label.textContent=text;
    const names=english?['Password and 2FA','Device and privacy','Local sessions']:['Lozinka i 2FA','Uređaj i privatnost','Lokalne sesije'];
    choices.forEach((choice,index)=>{const label=picker.querySelector(`[data-topic-label="${choice.value}"]`);if(label.textContent!==names[index])label.textContent=names[index];});
    const texts={settingsDataTitle:english?'Data management':'Upravljanje podacima',settingsDataHint:english?'Download a copy or delete this browser’s local account. Connected bank accounts are not deleted.':'Preuzmite kopiju ili izbrišite lokalni račun ovog preglednika. Bankovni računi ne brišu se.',securityAccessTitle:english?'Password and two-factor authentication':'Lozinka i dvofaktorska autentifikacija'};
    Object.entries(texts).forEach(([id,value])=>{const node=document.getElementById(id);if(node.textContent!==value)node.textContent=value;});
    access.querySelector('.security-access-tabs').setAttribute('aria-label',english?'Sign-in protection':'Zaštita prijave');
    access.querySelectorAll('button[data-access-view]').forEach(button=>{const text=button.dataset.accessView==='mfa'?'2FA':english?'Password':'Lozinka';if(button.textContent!==text)button.textContent=text;});
  }
  // Existing forms and controls stay mounted: topic changes never discard a draft or MFA setup.
  let frame=0;
  function schedule(){if(!frame)frame=requestAnimationFrame(audit);}
  function audit(){
    frame=0;labels();
    document.querySelectorAll('dialog[open]').forEach(surface=>{
      if(surface.classList.contains('tour-modal-host'))return;
      // Clip only surfaces proven to fit. Dynamic lists retain their own bounded scroll area.
      const nodes=[surface,...surface.querySelectorAll('.settings-modal-body,.export-body,.detail-modal-grid,.engagement-body,.planning-body,.connected-banks-modal-body,.vaults-body')];
      nodes.forEach(node=>{
        const fits=!hasOverflow(node.scrollHeight,node.clientHeight);
        if(node.dataset.contentFits!==String(fits))node.dataset.contentFits=String(fits);
      });
    });
  }
  new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','hidden','class']});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  root.addEventListener('resize',schedule,{passive:true});
  root.visualViewport?.addEventListener('resize',schedule,{passive:true});
  document.fonts?.ready.then(schedule).catch(()=>{});
  chooseTopic('access');chooseAccess('password');labels();
})(typeof window==='undefined'?null:window);
