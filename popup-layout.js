(function popupLayout(root) {
  'use strict';
  const topicForTarget = target => /changePasswordForm|currentPasswordInput|newPasswordInput|confirmNewPasswordInput|settingsTourMfa|Mfa|mfa|recovery/.test(target) ? 'access' : /activeSession|logoutOtherSessions/.test(target) ? 'sessions' : /exportSovereignty|deleteSovereignty|resetDemo|demoReset|personalData|personalFirstName|personalLastName|personalOib|personalAddress/.test(target) ? 'personal' : /settingsTourPreferences|settingsLanguage|themeToggle|layoutEditToggle|hideBalances|baseCurrency|dateFormat|timezone/.test(target) ? 'general' : 'device';
  const hasOverflow = (scroll, client) => Number.isFinite(scroll) && Number.isFinite(client) && scroll > client + 2;
  const securityFlowForTarget = target => /activeSession|logoutOtherSessions/.test(target) ? 'sessions' : /Mfa|mfa|recovery/.test(target) ? 'mfa' : /Password|password/.test(target) ? 'password' : 'device';
  if (typeof module === 'object' && module.exports) module.exports = {topicForTarget,hasOverflow,securityFlowForTarget};
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
  const personalPanel=dialog.querySelector('[data-settings-panel="personal"]');
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
  const flows=new Map(),flowLabels=[];
  function createFlow(key,hr,en,nodes) {
    const flow=document.createElement('dialog');flow.id=`settings-${key}-flow`;flow.className='modal settings-security-flow';flow.setAttribute('aria-labelledby',`${flow.id}-title`);
    flow.innerHTML=`<button type="button" class="modal-close" aria-label="Zatvori"><svg aria-hidden="true"><use href="#icon-x"></use></svg></button><h2 id="${flow.id}-title"></h2><div class="settings-flow-body"></div><footer class="modal-actions settings-flow-footer"><button type="button" class="secondary-button" data-settings-back></button></footer>`;
    document.body.append(flow);nodes.filter(Boolean).forEach(node=>flow.querySelector('.settings-flow-body').append(node));
    const record={key,flow,hr,en,opener:null};flows.set(key,record);flowLabels.push(record);
    const close=()=>{if(flow.open)flow.close();};
    flow.querySelector('.modal-close').addEventListener('click',close);flow.querySelector('[data-settings-back]').addEventListener('click',close);
    flow.addEventListener('cancel',event=>{event.preventDefault();close();});
    flow.addEventListener('close',()=>{if(![...flows.values()].some(item=>item.flow.open))dialog.removeAttribute('data-settings-flow-open');if(dialog.open)requestAnimationFrame(()=>{if(![...flows.values()].some(item=>item.flow.open))record.opener?.focus({preventScroll:true});});schedule();});
    root.MerRuntime?.bindDialogBackdropDismiss?.(flow,close);
    return record;
  }
  function openFlow(key,opener) {
    const record=flows.get(key);if(!record)return;
    record.opener=opener||record.opener;
    [...flows.values()].forEach(item=>{if(item!==record&&item.flow.open)item.flow.close();});
    // Keep Settings mounted/open underneath: its close event clears private drafts and MFA enrollment.
    dialog.setAttribute('data-settings-flow-open','true');root.MerModalFooters?.enhance(record.flow);
    if(!record.flow.open)record.flow.showModal();
    requestAnimationFrame(()=>record.flow.querySelector('input:not([disabled]),button:not(.modal-close):not([disabled])')?.focus({preventScroll:true}));
    schedule();
  }
  const personalFlow=createFlow('data','Privatnost i podaci','Privacy and data',[
    document.getElementById('personalDataStorage'),personalPanel.querySelector('.personal-data-portability'),dataSection
  ]);
  const manageButton=document.createElement('button');manageButton.type='button';manageButton.className='secondary-button';manageButton.id='settingsDataManage';
  (personalForm.querySelector('.personal-data-actions')||personalForm).prepend(manageButton);manageButton.addEventListener('click',()=>openFlow('data',manageButton));
  personalFlow.opener=manageButton;
  const mfaSummary=document.getElementById('settingsTourMfa'),mfaNodes=[...mfaSummary.children];
  createFlow('password','Promjena lozinke','Change password',[document.getElementById('changePasswordForm')]);
  const mfaFlow=createFlow('mfa','Dvostruka autentifikacija','Two-factor authentication',mfaNodes);
  const recoveryContinue=document.createElement('button');recoveryContinue.id='settingsRecoveryContinue';recoveryContinue.type='button';recoveryContinue.className='primary-button';
  document.getElementById('recoveryPanel').append(recoveryContinue);
  const recoveryReturn=document.createElement('button');recoveryReturn.id='settingsRecoveryReturn';recoveryReturn.type='button';recoveryReturn.className='secondary-button';recoveryReturn.hidden=true;
  document.getElementById('mfaDisable').append(recoveryReturn);
  let recoveryAvailable=false;
  function showRecovery(value){mfaFlow.flow.dataset.mfaRecoveryView=String(value);schedule();}
  recoveryContinue.addEventListener('click',()=>showRecovery(false));recoveryReturn.addEventListener('click',()=>showRecovery(true));
  function refreshRecovery(available){recoveryReturn.hidden=!available;if(available!==recoveryAvailable)showRecovery(available);recoveryAvailable=available;}
  root.MerMfaRecoveryLayout=Object.freeze({refresh:refreshRecovery});refreshRecovery(!document.getElementById('recoveryPanel').hidden);
  createFlow('device','Zaštita uređaja','Device protection',[panel.querySelector('.auto-lock-setting'),panel.querySelector('.enterprise-security-actions')]);
  createFlow('sessions','Lokalne sesije','Local sessions',[panel.querySelector('.active-sessions-card')]);
  const securityGrid=document.createElement('div');securityGrid.className='settings-security-overview';panel.querySelector('.settings-pane-heading').after(securityGrid);
  const securityCards=[
    ['password','Lozinka','Password','Lozinka za račun u ovom pregledniku.','Password for the account in this browser.'],
    ['mfa','Dvostruka autentifikacija','Two-factor authentication','Kod iz aplikacije ili demonstracija SMS provjere.','Authenticator code or demonstration SMS verification.'],
    ['device','Zaštita uređaja','Device protection','Uključite zaključavanje ili šifriranje lokalnih podataka.','Opt into locking or local-data encryption.'],
    ['sessions','Lokalne sesije','Local sessions','Pregled prijava u karticama ovog preglednika.','Signed-in tabs in this browser.']
  ];
  securityCards.forEach(([key,hr,en,hintHr,hintEn])=>{
    const card=key==='mfa'?mfaSummary:document.createElement('section');card.className='settings-security-option';card.dataset.securityOption=key;
    card.innerHTML='<div><h3></h3><p></p></div><button type="button" class="secondary-button"></button>';securityGrid.append(card);
    const button=card.querySelector('button');button.id=`settings-security-${key}`;button.dataset.securityFlow=key;button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls',flows.get(key).flow.id);
    button.addEventListener('click',()=>openFlow(key,button));flows.get(key).opener=button;
    Object.assign(flows.get(key),{card,hintHr,hintEn,cardHr:hr,cardEn:en});
  });
  function revealTarget(target) {
    const id=String(target||''),topic=topicForTarget(id);flows.forEach(({flow})=>{if(flow.open)flow.close();});root.MerSettings?.selectTab(topic==='general'||topic==='personal'?topic:'security');
    if(topic==='personal'&&/exportSovereignty|deleteSovereignty|resetDemo|demoReset|personalDataStorage/.test(id))openFlow('data',manageButton);
    else if(topic!=='general'&&topic!=='personal'&&!/settingsTourMfa/.test(id)&&!dialog.classList.contains('tour-modal-host')){
      if(/recovery/i.test(id)&&recoveryAvailable)showRecovery(true);else if(/disable/i.test(id))showRecovery(false);
      openFlow(securityFlowForTarget(id));
    }
  }
  dialog.addEventListener('invalid',event=>{
    const reveal=()=>{
      const settingsPanel=event.target.closest('[data-settings-panel]');if(settingsPanel)root.MerSettings?.selectTab(settingsPanel.dataset.settingsPanel);
      subviews.forEach(group=>{const entry=group.views.find(item=>item.view.contains(event.target));if(entry)group.select(entry.name);});
    };
    if(root.MerPagination?.revealInvalidField)root.MerPagination.revealInvalidField(event,reveal);else reveal();
  },true);
  dialog.addEventListener('close',()=>{flows.forEach(({flow})=>{if(flow.open)flow.close();});dialog.removeAttribute('data-settings-flow-open');});
  root.MerPopupLayout=Object.freeze({revealTarget});
  function labels() {
    const english=document.documentElement.lang==='en';
    const texts={settingsDataTitle:english?'Data management':'Upravljanje podacima',settingsDataHint:english?'Download a copy or delete this browser’s local account. This does not close accounts held by your bank.':'Preuzmite kopiju ili izbrišite lokalni račun ovog preglednika. Time se ne zatvaraju računi kod vaše banke.',settingsDataManage:english?'Privacy and data':'Privatnost i podaci',settingsRecoveryContinue:english?'Continue to 2FA management':'Nastavi na upravljanje 2FA',settingsRecoveryReturn:english?'View recovery codes':'Prikaži kodove za oporavak'};
    Object.entries(texts).forEach(([id,value])=>{const node=document.getElementById(id);if(node.textContent!==value)node.textContent=value;});
    const setText=(node,text)=>{if(node&&node.textContent!==text)node.textContent=text;};
    flowLabels.forEach(({flow,hr,en,card,cardHr,cardEn,hintHr,hintEn})=>{
      setText(flow.querySelector('h2'),english?en:hr);setText(flow.querySelector('[data-settings-back]'),english?'Back':'Natrag');flow.querySelector('.modal-close').setAttribute('aria-label',english?'Close':'Zatvori');
      if(card){setText(card.querySelector('h3'),english?cardEn:cardHr);setText(card.querySelector('p'),english?hintEn:hintHr);setText(card.querySelector('button'),english?'Manage':'Uredi');}
    });
    setText(dialog.querySelector('[data-i18n="hideBalances"]'),english?'Privacy mode':'Privatni način');setText(document.getElementById('hideBalancesHint'),english?'Blurs amounts, not encryption. Shortcut: Ctrl / ⌘ + Shift + H.':'Zamagljuje iznose, ne šifrira podatke. Prečac: Ctrl / ⌘ + Shift + H.');
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
  labels();
})(typeof window==='undefined'?null:window);
