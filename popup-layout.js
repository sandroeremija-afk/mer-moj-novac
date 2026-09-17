(function popupLayout(root) {
  'use strict';
  const topicForTarget = target => /changePasswordForm|currentPasswordInput|newPasswordInput|confirmNewPasswordInput|settingsTourMfa|Mfa|mfa|recovery/.test(target) ? 'access' : /activeSession|logoutOtherSessions/.test(target) ? 'sessions' : /exportSovereignty|deleteSovereignty|resetDemo|demoReset|personalData|personalFirstName|personalLastName|personalOib|personalAddress/.test(target) ? 'personal' : /settingsTourPreferences|settingsLanguage|themeToggle|layoutEditToggle|hideBalances|baseCurrency|dateFormat|timezone/.test(target) ? 'general' : 'device';
  const hasOverflow = (scroll, client) => Number.isFinite(scroll) && Number.isFinite(client) && scroll > client + 2;
  const subsectionForTarget = target => /exportSovereignty|deleteSovereignty|resetDemo|demoReset/.test(target) ? 'management' : /personalDataNotice|personalDataStorage/.test(target) ? 'storage' : /personalData|personalFirstName|personalLastName|personalOib|personalAddress/.test(target) ? 'details' : /hideBalances/.test(target) ? 'privacy' : /settingsTourPreferences|themeToggle|layoutEditToggle/.test(target) ? 'appearance' : 'regional';
  if (typeof module === 'object' && module.exports) module.exports = {topicForTarget,hasOverflow,subsectionForTarget};
  if (!root?.document) return;
  const document = root.document, dialog = document.getElementById('bankSettingsModal');
  if (!dialog) return;
  const panel = dialog.querySelector('[data-settings-panel="security"]');
  const subviews=[];
  function mountSubviews(host,key,definitions) {
    const navigation=document.createElement('div');navigation.className='settings-subtabs';navigation.setAttribute('role','tablist');
    const views=definitions.map(([name,hr,en,nodes])=>{
      const view=document.createElement('section'),button=document.createElement('button');
      view.id=`settings-${key}-${name}`;view.className='settings-subview';view.setAttribute('role','tabpanel');
      button.id=`settings-${key}-${name}-tab`;button.type='button';button.className='secondary-button';button.dataset.settingsSection=name;button.setAttribute('role','tab');button.setAttribute('aria-controls',view.id);view.setAttribute('aria-labelledby',button.id);
      nodes.filter(Boolean).forEach(node=>view.append(node));navigation.append(button);host.append(view);
      return {name,hr,en,view,button};
    });
    const first=views[0];first.view.before(navigation);
    function select(name) {
      const chosen=views.find(view=>view.name===name)||first;
      for(const entry of views){const active=entry===chosen;entry.view.hidden=!active;entry.button.setAttribute('aria-selected',String(active));entry.button.tabIndex=active?0:-1;}
      schedule();return chosen;
    }
    views.forEach(entry=>{
      entry.button.addEventListener('click',()=>select(entry.name));
      entry.button.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();const available=views.filter(item=>!item.button.disabled),index=available.indexOf(entry);
        const next=event.key==='Home'?0:event.key==='End'?available.length-1:(index+(event.key==='ArrowRight'?1:-1)+available.length)%available.length;
        if(available[next])select(available[next].name).button.focus({preventScroll:true});
      });
    });
    const api={select,views,navigation};subviews.push(api);select(first.name);return api;
  }
  // Keep the original elements mounted so tab changes preserve form values and listeners.
  let frame=0;
  const dataSection=document.createElement('section');dataSection.className='settings-data-actions';
  dataSection.innerHTML='<h3 id="settingsDataTitle"></h3><p id="settingsDataHint"></p><div class="enterprise-action-grid"></div>';
  const dataGrid=dataSection.querySelector('.enterprise-action-grid');
  ['exportSovereignty','deleteSovereignty'].forEach(id=>{const button=document.getElementById(id);if(button)dataGrid.append(button);});
  const personalGrid=document.createElement('div');personalGrid.className='settings-personal-grid';
  const personalForm=document.getElementById('personalDataForm');personalForm.before(personalGrid);personalGrid.append(personalForm,dataSection);
  const demo=document.getElementById('demoResetCard');if(demo)dataSection.append(demo);
  const generalPanel=dialog.querySelector('[data-settings-panel="general"]');
  const generalViews=mountSubviews(generalPanel,'general',[
    ['regional','Regija','Region',[generalPanel.querySelector('.settings-form-grid')]],
    ['appearance','Izgled','Appearance',[document.getElementById('settingsTourPreferences')]],
    ['privacy','Privatnost','Privacy',[generalPanel.querySelector('.toggle-setting')]]
  ]);
  const personalPanel=dialog.querySelector('[data-settings-panel="personal"]');
  const personalViews=mountSubviews(personalGrid,'personal',[
    ['details','Unos','Details',[personalForm]],
    ['storage','Pohrana','Storage',[document.getElementById('personalDataNotice'),document.getElementById('personalDataStorage'),personalPanel.querySelector('.personal-data-portability')]],
    ['management','Upravljanje','Manage',[dataSection]]
  ]);
  const rulesPanel=dialog.querySelector('[data-settings-panel="automation"]');
  const ruleViews=mountSubviews(rulesPanel,'rules',[
    ['create','Novo pravilo','New rule',[rulesPanel.querySelector('.rules-subtitle'),document.getElementById('automationRuleForm')]],
    ['list','Aktivna pravila','Active rules',[document.getElementById('automationRuleList'),document.getElementById('rulesPagination')]]
  ]);
  document.getElementById('automationRuleForm').addEventListener('submit',()=>{if(document.getElementById('ruleKeyword').value==='')ruleViews.select('list');});
  const importDialog=document.getElementById('importDataModal'),importHost=document.createElement('div');importHost.className='import-workspace';importDialog.append(importHost);
  const importViews=mountSubviews(importHost,'import',[
    ['upload','Datoteka','File',[importDialog.querySelector('.import-dropzone')]],
    ['review','Pregled','Review',[document.getElementById('importReview')]],
    ['bulk','Grupna izmjena','Bulk edit',[importDialog.querySelector('.bulk-editor'),document.getElementById('bulkOverrideConfirmation'),document.getElementById('bulkOverrideUndoBar')]]
  ]);
  let importReady=false;
  function refreshImport(ready) {importViews.views.forEach(entry=>{entry.button.disabled=entry.name!=='upload'&&!ready;});if(ready!==importReady)importViews.select(ready?'review':'upload');importReady=ready;}
  root.MerImportLayout=Object.freeze({refresh:refreshImport,review:()=>importViews.select('review')});refreshImport(!document.getElementById('importReview').hidden);
  const access=document.createElement('section');access.id='securityAccessCard';access.className='security-access-card';access.setAttribute('aria-labelledby','securityAccessTitle');
  access.innerHTML='<header class="security-access-header"><h3 id="securityAccessTitle"></h3><div class="security-access-tabs" role="group"><button type="button" class="secondary-button" data-access-view="password"></button><button type="button" class="secondary-button" data-access-view="mfa"></button><button type="button" class="secondary-button" data-access-view="notice"></button></div></header><div class="security-access-grid"></div>';
  panel.append(access);
  const accessGrid=access.querySelector('.security-access-grid');
  accessGrid.append(document.getElementById('changePasswordForm'),document.getElementById('settingsTourMfa'));
  const mfaNotice=panel.querySelector('.info-note');if(mfaNotice){mfaNotice.dataset.accessPanel='notice';accessGrid.append(mfaNotice);}
  document.getElementById('changePasswordForm').dataset.accessPanel='password';document.getElementById('settingsTourMfa').dataset.accessPanel='mfa';
  const mfaAccount=document.createElement('div');mfaAccount.className='mfa-account-views';document.getElementById('settingsTourMfa').append(mfaAccount);
  const mfaAccountViews=mountSubviews(mfaAccount,'mfa-account',[
    ['recovery','Recovery kodovi','Recovery codes',[document.getElementById('recoveryPanel')]],
    ['manage','Upravljanje 2FA','Manage 2FA',[document.getElementById('mfaDisable')]]
  ]);
  let recoveryAvailable=false;
  function refreshRecovery(available) {mfaAccountViews.navigation.hidden=!available;if(available!==recoveryAvailable)mfaAccountViews.select(available?'recovery':'manage');recoveryAvailable=available;}
  root.MerMfaRecoveryLayout=Object.freeze({refresh:refreshRecovery});mfaAccountViews.select('manage');refreshRecovery(!document.getElementById('recoveryPanel').hidden);
  const device=document.createElement('section');device.id='settingsDeviceCard';panel.append(device);
  const deviceViews=mountSubviews(device,'device',[
    ['lock','Zaključavanje','Lock',[panel.querySelector('.auto-lock-setting')]],
    ['vault','Šifriranje','Encryption',[panel.querySelector('.enterprise-security-actions')]]
  ]);
  const groups = {access:'#securityAccessCard',device:'#settingsDeviceCard',sessions:'.active-sessions-card'};
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
  function chooseAccess(view){access.dataset.accessView=['mfa','notice'].includes(view)?view:'password';access.querySelectorAll('button[data-access-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.accessView===access.dataset.accessView)));access.querySelectorAll('[data-access-panel]').forEach(node=>node.toggleAttribute('data-topic-hidden',node.dataset.accessPanel!==access.dataset.accessView));schedule();}
  access.querySelectorAll('button[data-access-view]').forEach(button=>button.addEventListener('click',()=>chooseAccess(button.dataset.accessView)));
  function revealTarget(target) {const id=String(target||''),topic=topicForTarget(id);if(topic==='personal'||topic==='general'){root.MerSettings?.selectTab(topic);(topic==='personal'?personalViews:generalViews).select(subsectionForTarget(id));return;}root.MerSettings?.selectTab('security');chooseTopic(topic);if(topic==='access'){chooseAccess(/Mfa|mfa|recovery/.test(id)?'mfa':'password');if(/recovery/i.test(id))mfaAccountViews.select('recovery');else if(/disable/i.test(id))mfaAccountViews.select('manage');}if(topic==='device')deviceViews.select(/autoLock/.test(id)?'lock':'vault');}
  choices.forEach(choice=>choice.addEventListener('change',()=>{if(choice.checked)chooseTopic(choice.value);}));
  dialog.addEventListener('invalid',event=>{
    const reveal=()=>{
      const settingsPanel=event.target.closest('[data-settings-panel]');if(settingsPanel)root.MerSettings?.selectTab(settingsPanel.dataset.settingsPanel);
      const topic=event.target.closest('[data-settings-topic]');if(topic)chooseTopic(topic.dataset.settingsTopic);
      const accessPanel=event.target.closest('[data-access-panel]');if(accessPanel)chooseAccess(accessPanel.dataset.accessPanel);
      subviews.forEach(group=>{const entry=group.views.find(item=>item.view.contains(event.target));if(entry)group.select(entry.name);});
    };
    if(root.MerPagination?.revealInvalidField)root.MerPagination.revealInvalidField(event,reveal);else reveal();
  },true);
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
    access.querySelectorAll('button[data-access-view]').forEach(button=>{const text=button.dataset.accessView==='mfa'?'2FA':button.dataset.accessView==='notice'?(english?'About':'O zaštiti'):(english?'Password':'Lozinka');if(button.textContent!==text)button.textContent=text;});
    subviews.forEach(({views,navigation})=>{navigation.setAttribute('aria-label',english?'Section':'Odjeljak');views.forEach(entry=>{const text=english?entry.en:entry.hr;if(entry.button.textContent!==text)entry.button.textContent=text;});});
  }
  // Existing forms and controls stay mounted: topic changes never discard a draft or MFA setup.
  function schedule(){if(!frame)frame=requestAnimationFrame(audit);}
  function audit(){
    frame=0;labels();
    document.querySelectorAll('dialog[open]').forEach(surface=>{
      if(surface.classList.contains('tour-modal-host'))return;
      // Measure after the active section and its bounded page have been laid out.
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
