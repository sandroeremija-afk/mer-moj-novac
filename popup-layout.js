(function popupLayout(root) {
  'use strict';
  const topicForTarget = target => /changePasswordForm|currentPasswordInput|newPasswordInput|confirmNewPasswordInput/.test(target) ? 'password' : /settingsTourMfa|Mfa|mfa|recovery/.test(target) ? 'mfa' : /activeSession|logoutOtherSessions/.test(target) ? 'sessions' : /exportSovereignty|deleteSovereignty/.test(target) ? 'data' : 'device';
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
  panel.append(dataSection);
  const groups = {device:'.auto-lock-setting,.enterprise-security-actions',password:'#changePasswordForm',mfa:'#settingsTourMfa,.info-note',sessions:'.active-sessions-card',data:'.settings-data-actions'};
  const picker = document.createElement('label');picker.className='settings-topic-picker';
  picker.innerHTML='<span id="settingsTopicLabel"></span><select id="settingsTopic" aria-labelledby="settingsTopicLabel"><option value="device"></option><option value="password"></option><option value="mfa"></option><option value="sessions"></option><option value="data"></option></select>';
  panel.querySelector('.settings-pane-heading').after(picker);
  panel.prepend(panel.querySelector('.settings-pane-heading'),picker);
  const select = picker.querySelector('select');
  for (const [topic,selector] of Object.entries(groups)) panel.querySelectorAll(selector).forEach(node=>{node.dataset.settingsTopic=topic;});
  function chooseTopic(topic) {
    select.value=Object.hasOwn(groups,topic)?topic:'device';
    panel.querySelectorAll('[data-settings-topic]').forEach(node=>node.toggleAttribute('data-topic-hidden',node.dataset.settingsTopic!==select.value));
    schedule();
  }
  function revealTarget(target) {chooseTopic(topicForTarget(String(target||''))); }
  select.addEventListener('change',()=>chooseTopic(select.value));
  dialog.addEventListener('close',()=>chooseTopic('device'));
  root.MerPopupLayout=Object.freeze({revealTarget});
  function labels() {
    const english=document.documentElement.lang==='en';
    const label=document.getElementById('settingsTopicLabel'),text=english?'Security topic':'Sigurnosna tema';
    if(label.textContent!==text)label.textContent=text;
    const names=english?['Device and privacy','Password','Two-factor authentication','Local sessions','Your data']:['Uređaj i privatnost','Lozinka','Dvostruka autentifikacija','Lokalne sesije','Vaši podaci'];
    [...select.options].forEach((option,index)=>{if(option.textContent!==names[index])option.textContent=names[index];});
    const texts={settingsDataTitle:english?'Your local data':'Vaši lokalni podaci',settingsDataHint:english?'Download a copy or request deletion of this browser’s local account. Bank accounts are not affected.':'Preuzmite kopiju ili zatražite brisanje lokalnog računa ovog preglednika. Bankovni računi ostaju nepromijenjeni.'};
    Object.entries(texts).forEach(([id,value])=>{const node=document.getElementById(id);if(node.textContent!==value)node.textContent=value;});
  }
  // Existing forms and controls stay mounted: topic changes never discard a draft or MFA setup.
  const demo=document.getElementById('demoResetCard');
  if(demo){const details=document.createElement('details');details.className='settings-demo-disclosure';const summary=document.createElement('summary');summary.textContent='Demo podaci';details.append(summary);demo.before(details);details.append(demo);const sync=()=>{details.hidden=demo.hidden;summary.textContent=document.documentElement.lang==='en'?'Demo data':'Demo podaci';};new MutationObserver(sync).observe(demo,{attributes:true,attributeFilter:['hidden']});sync();}
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
  chooseTopic('device');labels();
})(typeof window==='undefined'?null:window);
