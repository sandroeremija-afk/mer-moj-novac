(function exposeEnterpriseSecurity(root) {
  'use strict';
  let controller = null;
  const api = {
    init(options) { if (!controller) controller = createController(options);return controller; },
    // Startup renders must never recreate a plaintext cache before the owner is known.
    persist(snapshot) { return controller ? controller.persist(snapshot) : Promise.resolve(false); },
    flush() { return controller ? controller.flush() : Promise.resolve(); },
    beforeEnter(session, password) { return controller ? controller.beforeEnter(session, password) : Promise.resolve(true); },
    onLogout() { return controller?.onLogout(); },
    changeLoginPassword(options) { return controller?.changeLoginPassword(options); },
    lock() { return controller?.lock()?.catch(error=>root.MerRuntime?.report?.(error,{silent:true})); },
    isLocked() { return Boolean(controller?.isLocked()); },
    exportAll() { return controller?.exportAll(); },
    requestDelete() { return controller?.requestDelete(); },
    openVaultSetup() { return controller?.openVaultSetup(); },
    openPinSetup() { return controller?.openPinSetup(); },
    syncAutoLock() { return controller?.syncAutoLock(); },
    status() { return controller?.status() || {encrypted:false,locked:false,autoLockEnabled:false}; },
    install() { return controller?.install(); }
  };
  root.MerEnterpriseSecurity = api;

  function createController(options = {}) {
    const storage = options.storage || root.localStorage, transient = options.sessionStorage || root.sessionStorage;
    const OWNER_KEY = 'mer-data-owner-v1', LEGACY_KEYS = ['mer-money-v6','mer-money-v5','mer-money-v4','mer-money-v3'];
    const cacheKey = userId => `mer-cache-v1:${encodeURIComponent(userId)}`;
    const pinKey = userId => `mer-device-pin-v1:${encodeURIComponent(userId)}`;
    const idleKey = userId => `mer-idle-v1:${encodeURIComponent(userId)}`;
    const read = key => { try { return JSON.parse(storage.getItem(key)||'null'); } catch { return null; } };
    let session = null, vault = null, clock = null, idleTimer = null, autoLockEnabled = false, suspended = true, locked = false, lockReady = Promise.resolve(), pendingEntry = null, installEvent = null, lastIdleWrite = 0, initializeVault = false;
    const en = () => options.getLanguage?.() === 'en';
    const text = (hr, english) => en() ? english : hr;
    const report = error => { options.onError?.(error);root.MerRuntime?.report?.(error, {silent:true}); };
    const notify = () => root.dispatchEvent(new CustomEvent('mer-security-status', {detail:status()}));
    const provider = () => root.MerAuthProvider;
    const fresh = () => options.freshState?.() || root.MerDemoData.createDemoAppState(new Date());
    function replace(snapshot) { if (!snapshot?.accounts?.personal || !snapshot?.accounts?.business) throw new Error('INVALID_SNAPSHOT');options.replaceState(root.MerVault.scopeSnapshot(snapshot,session.userId));root.MerMfaState?.activate?.(session); }
    function legacyOwner() { return storage.getItem(OWNER_KEY); }
    function clearOwnedLegacy() { if (legacyOwner() === session?.userId) LEGACY_KEYS.forEach(key => storage.removeItem(key)); }
    function migrateLegacySecurity(snapshot) {
      if(legacyOwner()!==session?.userId||!LEGACY_KEYS.some(key=>storage.getItem(key)))return snapshot;
      const source=structuredClone(snapshot),records=read(root.MerAuth?.USERS_KEY||'mer-auth-users-v1')||[];
      const knownUsers=new Set(Array.isArray(records)?records.map(user=>user?.id).filter(id=>typeof id==='string'&&id.length<=200):[]);knownUsers.add('demo-user');
      source.mfaByUser=source.mfaByUser&&typeof source.mfaByUser==='object'?source.mfaByUser:{};
      const singleOwner=source.mfaLegacyOwner||(Array.isArray(records)&&records.length===1?records[0]?.id:Array.isArray(records)&&records.length===0?'demo-user':null);
      if(source.mfa?.enabled&&singleOwner&&knownUsers.has(singleOwner)&&!source.mfaByUser[singleOwner]){source.mfaByUser[singleOwner]=source.mfa;source.mfaLegacyOwner=singleOwner;}
      for(const [userId,mfa] of Object.entries(source.mfaByUser)){
        if(userId===session.userId||!knownUsers.has(userId)||!mfa?.enabled||storage.getItem(cacheKey(userId))||storage.getItem(root.MerVault.userKey(userId)))continue;
        // Preserve another existing local user's enrollment before retiring the shared legacy cache.
        // Their first password login moves this already-local legacy record into their encrypted vault.
        const target=fresh();target.mfaByUser={[userId]:structuredClone(mfa)};target.mfa=structuredClone(mfa);target.mfaLegacyOwner=userId;
        storage.setItem(cacheKey(userId),JSON.stringify(target));
      }
      return source;
    }
    function status() { return {encrypted:Boolean(vault?.exists()),locked,demo:Boolean(session?.demo),configuredPin:Boolean(session && read(pinKey(session.userId))),autoLockEnabled,autoLockMinutes:10,canInstall:Boolean(installEvent)}; }
    function safeClose(dialog) { if(dialog.open)dialog.close(); }
    function modal(markup, label, isLock = false) {
      const dialog = document.createElement('dialog');
      dialog.className = `enterprise-security-dialog${isLock?' enterprise-lock-dialog':''}`;
      dialog.setAttribute('aria-label', label);dialog.setAttribute('aria-modal','true');dialog.innerHTML = markup;
      document.body.appendChild(dialog);
      if (isLock) dialog.addEventListener('cancel', event => event.preventDefault());
      else root.MerRuntime?.bindDialogBackdropDismiss(dialog, () => safeClose(dialog));
      dialog.querySelectorAll('[data-cancel]').forEach(button => button.addEventListener('click', () => safeClose(dialog)));
      return dialog;
    }
    const gate = modal('<div class="enterprise-security-emblem" aria-hidden="true">▣</div><h2 id="enterpriseLockTitle"></h2><p id="enterpriseLockHint"></p><form id="enterpriseUnlockForm"><label id="enterpriseUnlockLabel" for="enterpriseUnlockInput"></label><input id="enterpriseUnlockInput" type="password" autocomplete="current-password" required maxlength="256"><p id="enterpriseUnlockError" class="enterprise-security-error" role="alert"></p><div class="enterprise-security-actions"><button type="button" id="enterpriseLockSignOut" class="secondary-button"></button><button type="submit" id="enterpriseUnlockSubmit" class="primary-button"></button></div></form>', 'Otključajte aplikaciju', true);
    const input = gate.querySelector('#enterpriseUnlockInput'), gateError = gate.querySelector('#enterpriseUnlockError'), unlockSubmit = gate.querySelector('#enterpriseUnlockSubmit');
    function renderGate(mode = 'unlock') {
      initializeVault = mode === 'initialize';
      const encrypted = vault?.exists(), hasPin = session && read(pinKey(session.userId));
      gate.querySelector('#enterpriseLockTitle').textContent = text(mode==='vault'?'Otključajte privatni trezor':'Vaš je prostor zaključan',mode==='vault'?'Unlock your private vault':'Your workspace is locked');
      gate.querySelector('#enterpriseLockHint').textContent = initializeVault ? text('Potvrdite lozinku računa kako bismo šifrirali spremljene podatke prije nastavka.','Confirm your account password to encrypt your saved data before continuing.') : encrypted ? text('Unesite lozinku trezora kako biste sigurno nastavili.','Enter your vault password to continue securely.') : session?.demo && !hasPin ? text('Demo prostor je zaključan. Ponovno se prijavite ili nakon prijave postavite osobni PIN u Sigurnosti.','The demo workspace is locked. Sign in again, then set a personal PIN in Security.') : text('Prostor je zaključan. Potvrdite identitet za nastavak.','Your workspace is locked. Verify your identity to continue.');
      const needsCredential = encrypted || !session?.demo || hasPin;
      input.hidden = !needsCredential;input.required = Boolean(needsCredential);
      input.inputMode = session?.demo && !encrypted ? 'numeric' : 'text';
      gate.querySelector('#enterpriseUnlockLabel').hidden = !needsCredential;
      gate.querySelector('#enterpriseUnlockLabel').textContent = encrypted ? text('Lozinka trezora','Vault password') : session?.demo ? 'PIN' : text('Lozinka','Password');
      unlockSubmit.hidden = !needsCredential;
      unlockSubmit.textContent = text('Otključaj','Unlock');
      gate.querySelector('#enterpriseLockSignOut').textContent = text('Natrag na prijavu','Back to sign in');
      gateError.textContent = '';input.value = '';
      if (!gate.open) gate.showModal();
      requestAnimationFrame(() => (needsCredential ? input : gate.querySelector('#enterpriseLockSignOut')).focus({preventScroll:true}));
    }
    function setLocked(value) {
      locked = value;
      document.body.classList.toggle('enterprise-locked',value);
      const shell = document.getElementById('appShell');
      if (value) { shell.inert = true;shell.setAttribute('aria-hidden','true'); }
      else if (!document.body.classList.contains('mfa-locked')) { shell.inert = false;shell.removeAttribute('aria-hidden'); }
      notify();
    }
    const optedIntoAutoLock = () => Boolean(session && options.getState()?.settings?.autoLockEnabled === true);
    function stopClock(clearStored = false) {
      if (idleTimer !== null) root.clearInterval?.(idleTimer);
      idleTimer = null;clock = null;lastIdleWrite = 0;
      if (clearStored && session) transient.removeItem(idleKey(session.userId));
    }
    function syncAutoLock({restore = false} = {}) {
      const enabled = optedIntoAutoLock(), changed = enabled !== autoLockEnabled;
      autoLockEnabled = enabled;
      if (!enabled) stopClock(true);
      else if (!suspended && !locked && !clock) {
        // A fresh opt-in/unlock starts a full window; only an opted-in reload
        // may resume the timestamp belonging to this authenticated user.
        const now = Date.now(), saved = Number(transient.getItem(idleKey(session.userId)));
        const issuedAt = Number(session.issuedAt);
        const lastActivity = restore && Number.isFinite(saved) && saved > 0
          ? Math.max(Number.isFinite(issuedAt) ? issuedAt : 0, saved) : now;
        const owner = session;
        const nextClock = root.MerVault.createIdleClock({lastActivity,onLock:() => {
          if (clock === nextClock && session === owner && optedIntoAutoLock()) lock().catch(report);
        }});
        clock = nextClock;
        if (!clock.check()) {
          lastIdleWrite = clock.lastActivity();
          transient.setItem(idleKey(session.userId),String(lastIdleWrite));
          idleTimer = root.setInterval(check,1000);
        }
      }
      if (changed) notify();
      return autoLockEnabled;
    }
    function beginClock() { syncAutoLock({restore:true}); }
    function resume() {
      suspended = false;safeClose(gate);setLocked(false);
      stopClock();syncAutoLock();
    }
    async function beforeEnter(nextSession, password) {
      if (!nextSession?.userId) return false;
      if (session && session.userId !== nextSession.userId) await onLogout();
      stopClock();autoLockEnabled = false;suspended = true;session = nextSession;
      vault = root.MerVault.createVault({storage,userId:session.userId});
      if (!legacyOwner()) storage.setItem(OWNER_KEY,session.userId);
      if (vault.exists()) {
        if (password) {
          try { const snapshot = await vault.unlock(password);replace(snapshot);resume();return true; }
          catch(error) { if(error.code!=='VAULT_UNLOCK_FAILED')report(error); }
        }
        setLocked(true);renderGate('vault');
        return new Promise(resolve => { pendingEntry = resolve; });
      }
      const existing = read(cacheKey(session.userId));
      const snapshot = migrateLegacySecurity(existing?.accounts ? existing : legacyOwner() === session.userId && !storage.getItem(cacheKey(session.userId)) ? options.getState() : fresh());
      replace(snapshot);
      if (!session.demo && !password) {
        setLocked(true);renderGate('initialize');
        return new Promise(resolve => {pendingEntry=resolve;});
      }
      if (!session.demo && password) {
        await vault.enable(password, root.MerVault.scopeSnapshot(options.getState(),session.userId));
        storage.removeItem(cacheKey(session.userId));clearOwnedLegacy();
      }
      suspended = false;
      await persist(options.getState());
      beginClock();notify();return true;
    }
    async function persist(snapshot) {
      if (suspended || !session || locked) return false;
      const scoped=root.MerVault.scopeSnapshot(snapshot,session.userId);
      if (vault.exists()) {
        // Never fall back to plaintext on cryptography/quota failures.
        await vault.persist(scoped);clearOwnedLegacy();
      } else {
        storage.setItem(cacheKey(session.userId),JSON.stringify(scoped));clearOwnedLegacy();
      }
      return true;
    }
    async function flush() {
      await lockReady;
      if (!suspended && session && !locked) await persist(options.getState());
    }
    async function lock() {
      if (!session || locked) return;
      const snapshot = options.getState();
      const pendingWrite = persist(snapshot);
      suspended = true;stopClock();setLocked(true);
      root.MerOnboardingUi?.close?.();root.MerAssistantUi?.close?.();
      document.querySelectorAll('dialog[open]').forEach(dialog => { if(dialog!==gate)dialog.close(); });
      document.body.classList.remove('modal-active');
      renderGate();
      lockReady = pendingWrite.catch(error => {report(error);gateError.textContent=text('Spremanje nije uspjelo. Ne zatvarajte ovu karticu.','Saving failed. Keep this tab open.');}).then(()=>vault.lock());
      await lockReady;
    }
    async function verifyPin(pin) {
      const record = session && read(pinKey(session.userId));
      if (!record?.salt || !record?.hash) return false;
      const salt = Uint8Array.from(atob(record.salt),character=>character.charCodeAt(0));
      const hash = await root.MerAuth.derivePassword(pin,salt);
      const actual = btoa(Array.from(hash,byte=>String.fromCharCode(byte)).join(''));
      if(actual.length!==record.hash.length)return false;
      let difference = 0;for(let index=0;index<actual.length;index+=1)difference|=actual.charCodeAt(index)^record.hash.charCodeAt(index);
      return difference===0;
    }
    let failedUnlocks = 0, retryAt = 0;
    gate.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault();if(unlockSubmit.disabled)return;
      if(Date.now()<retryAt){gateError.textContent=text('Pričekajte prije novog pokušaja.','Wait before trying again.');return;}
      unlockSubmit.disabled = true;gateError.textContent='';
      try {
        await lockReady;
        if(provider().currentSession()?.userId!==session?.userId)throw new Error('AUTH_REQUIRED');
        let verified = false;
        if(vault.exists()){
          const snapshot=await vault.unlock(input.value);
          // A cold start needs restoration. An idle lock keeps newer in-memory changes,
          // including an import that completed while locked or a failed quota write.
          if(pendingEntry)replace(snapshot);
          verified=true;
        }
        else if(session.demo)verified=await verifyPin(input.value);
        else verified=(await provider().verifyCurrentPassword(input.value)).ok;
        if(!verified)throw new Error('INVALID_CREDENTIALS');
        if(initializeVault){await vault.enable(input.value,root.MerVault.scopeSnapshot(options.getState(),session.userId));storage.removeItem(cacheKey(session.userId));clearOwnedLegacy();}
        failedUnlocks=0;retryAt=0;input.value='';resume();
        const resolve=pendingEntry;pendingEntry=null;resolve?.(true);
        if(!resolve)persist(options.getState()).catch(report);
      } catch(error) {
        failedUnlocks+=1;retryAt=Date.now()+(failedUnlocks>=5?30000:0);
        gateError.textContent=text('Lozinka ili PIN nisu ispravni.','The password or PIN is incorrect.');
      } finally {unlockSubmit.disabled=false;}
    });
    gate.querySelector('#enterpriseLockSignOut').addEventListener('click', async () => {
      await onLogout();provider()?.signOut();root.location.reload();
    });
    async function onLogout() {
      suspended=true;stopClock();autoLockEnabled=false;
      if(session)transient.removeItem(idleKey(session.userId));
      await vault?.lock();vault=null;session=null;
      const resolve=pendingEntry;pendingEntry=null;resolve?.(false);
      safeClose(gate);setLocked(false);
    }
    async function changeLoginPassword({userId,newPassword}) {
      if(session?.userId!==userId||!vault?.exists())return;
      await persist(options.getState());await vault.changePassphrase(newPassword);
    }
    async function exportAll() {
      if(!session||locked)return;
      const payload=root.MerVault.portableSnapshot(options.getState());
      payload.account={id:session.userId,name:session.name,email:session.email,demo:Boolean(session.demo)};
      const onboardingId=root.MerOnboardingCore?.cleanUserId?.(session.userId)||session.userId;
      payload.onboarding=read(`mer-onboarding-v1:${onboardingId}`);
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download=`Mer_Svi_Podaci_${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
    function openVaultSetup() {
      if(!session||locked)return;
      if(vault.exists()){root.showToast?.(text('Vaši lokalni podaci već su šifrirani.','Your local data is already encrypted.'));return;}
      const dialog=modal(`<h2>${text('Šifrirajte ovaj uređaj','Encrypt this device')}</h2><p>${text('Postavite lozinku od najmanje 10 znakova. Trebat će vam nakon ponovnog otvaranja i zaključavanja. Lozinka se ne sprema i bez nje nije moguće oporaviti trezor.','Set a password with at least 10 characters. You will need it after reopening or locking. The password is never stored and the vault cannot be recovered without it.')}</p><form><label>${text('Lozinka trezora','Vault password')}<input type="password" name="password" minlength="10" maxlength="256" autocomplete="new-password" required></label><label>${text('Potvrdite lozinku','Confirm password')}<input type="password" name="confirmation" minlength="10" maxlength="256" autocomplete="new-password" required></label><p class="enterprise-security-error" role="alert"></p><div class="enterprise-security-actions"><button type="button" class="secondary-button" data-cancel>${text('Otkaži','Cancel')}</button><button type="submit" class="primary-button">${text('Uključi šifriranje','Enable encryption')}</button></div></form>`,text('Šifriranje','Encryption'));
      dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
      dialog.querySelector('form').addEventListener('submit',async event=>{
        event.preventDefault();const form=event.currentTarget,button=form.querySelector('[type="submit"]');if(button.disabled)return;
        const password=form.elements.password.value;if(password!==form.elements.confirmation.value){form.querySelector('[role="alert"]').textContent=text('Lozinke se ne podudaraju.','Passwords do not match.');return;}
        button.disabled=true;
        try {const snapshot=root.MerVault.scopeSnapshot(options.getState(),session.userId);await vault.enable(password,snapshot);await vault.persist(root.MerVault.scopeSnapshot(options.getState(),session.userId));storage.removeItem(cacheKey(session.userId));clearOwnedLegacy();safeClose(dialog);notify();}
        catch(error){report(error);form.querySelector('[role="alert"]').textContent=text('Šifriranje nije uspjelo. Izvorni podaci ostali su sačuvani.','Encryption failed. Original data remains saved.');}
        finally{button.disabled=false;}
      });
    }
    function openPinSetup() {
      if(!session||locked)return;
      const dialog=modal(`<h2>${text('PIN za ovaj uređaj','PIN for this device')}</h2><p>${text('PIN otključava demo prostor. Za šifriranje spremljenih podataka postavite zasebnu lozinku trezora.','A PIN unlocks the demo workspace. Set a separate vault password to encrypt stored data.')}</p><form><label>PIN<input type="password" name="pin" inputmode="numeric" pattern="[0-9]{6,12}" minlength="6" maxlength="12" autocomplete="new-password" required></label><label>${text('Potvrdite PIN','Confirm PIN')}<input type="password" name="confirm" inputmode="numeric" pattern="[0-9]{6,12}" minlength="6" maxlength="12" autocomplete="new-password" required></label><p class="enterprise-security-error" role="alert"></p><div class="enterprise-security-actions"><button type="button" class="secondary-button" data-cancel>${text('Otkaži','Cancel')}</button><button type="submit" class="primary-button">${text('Spremi PIN','Save PIN')}</button></div></form>`,text('Postavite PIN','Set PIN'));
      dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
      dialog.querySelector('form').addEventListener('submit',async event=>{
        event.preventDefault();const form=event.currentTarget,button=form.querySelector('[type="submit"]');if(button.disabled)return;
        const pin=form.elements.pin.value;if(!/^\d{6,12}$/.test(pin)||pin!==form.elements.confirm.value){form.querySelector('[role="alert"]').textContent=text('Unesite dva jednaka PIN-a od 6 do 12 znamenki.','Enter matching PINs of 6 to 12 digits.');return;}
        button.disabled=true;
        try{const salt=crypto.getRandomValues(new Uint8Array(16)),hash=await root.MerAuth.derivePassword(pin,salt);const encode=value=>btoa(Array.from(value,byte=>String.fromCharCode(byte)).join(''));storage.setItem(pinKey(session.userId),JSON.stringify({salt:encode(salt),hash:encode(hash)}));safeClose(dialog);notify();}catch(error){report(error);form.querySelector('[role="alert"]').textContent=text('PIN nije spremljen. Pokušajte ponovno.','PIN was not saved. Try again.');}finally{button.disabled=false;}
      });
    }
    function requestDelete() {
      if(!session||locked)return;
      const dialog=modal(`<h2>${text('Trajno izbrišite lokalni račun','Permanently delete local account')}</h2><p>${text('Brišu se račun, oba profila, transakcije i trezor ovog korisnika na ovom uređaju. Drugi korisnici i podaci na bankovnim poslužiteljima ostaju netaknuti. Najprije preuzmite kopiju ako vam treba.','Deletes this user’s account, both profiles, transactions and vault on this device. Other users and bank server data are unaffected. Download a copy first if needed.')}</p><form>${session.demo?'':`<label>${text('Trenutna lozinka','Current password')}<input type="password" name="password" autocomplete="current-password" required></label>`}<label>${text('Upišite IZBRIŠI za potvrdu','Type DELETE to confirm')}<input name="confirmation" autocomplete="off" required></label><p class="enterprise-security-error" role="alert"></p><div class="enterprise-security-actions"><button type="button" class="secondary-button" data-cancel>${text('Otkaži','Cancel')}</button><button type="submit" class="primary-button danger-button">${text('Trajno izbriši račun','Permanently delete account')}</button></div></form>`,text('Brisanje računa','Delete account'));
      dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
      dialog.querySelector('form').addEventListener('submit',async event=>{
        event.preventDefault();const form=event.currentTarget,button=form.querySelector('[type="submit"]');if(button.disabled)return;
        if(form.elements.confirmation.value.trim()!==text('IZBRIŠI','DELETE')){form.querySelector('[role="alert"]').textContent=text('Potvrdite upisivanjem IZBRIŠI.','Confirm by typing DELETE.');return;}
        button.disabled=true;
        try{
          const result=await provider().deleteCurrentUser(form.elements.password?.value||'');
          if(!result.ok)throw new Error('AUTH_REQUIRED');
          suspended=true;await vault.remove();root.MerVault.localUserKeys(storage,session.userId).forEach(key=>storage.removeItem(key));transient.removeItem(idleKey(session.userId));root.MerMfaUnlock?.clear?.();
          if(legacyOwner()===session.userId){clearOwnedLegacy();storage.removeItem(OWNER_KEY);}
          root.location.reload();
        }catch(error){report(error);form.querySelector('[role="alert"]').textContent=text('Brisanje nije dovršeno. Provjerite lozinku i pokušajte ponovno.','Deletion did not complete. Check your password and try again.');button.disabled=false;}
      });
    }
    const activity=()=>{if(!optedIntoAutoLock()){if(clock||autoLockEnabled)syncAutoLock();return;}if(!session||locked||suspended||!clock)return;if(clock.activity()&&clock.lastActivity()-lastIdleWrite>500){lastIdleWrite=clock.lastActivity();transient.setItem(idleKey(session.userId),String(lastIdleWrite));}};
    ['mousemove','pointerdown','keydown','touchstart','scroll'].forEach(name=>document.addEventListener(name,activity,{passive:true,capture:true}));
    const check=()=>{if(!optedIntoAutoLock()){if(clock||autoLockEnabled)syncAutoLock();return;}if(session&&!suspended&&!locked)clock?.check();};
    document.addEventListener('visibilitychange',check);root.addEventListener('focus',check);root.addEventListener('pageshow',check);
    root.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installEvent=event;notify();});
    async function install(){if(!installEvent)return false;await installEvent.prompt();const result=await installEvent.userChoice;installEvent=null;notify();return result.outcome==='accepted';}
    return {persist,flush,beforeEnter,onLogout,changeLoginPassword,lock,isLocked:()=>locked,exportAll,requestDelete,openVaultSetup,openPinSetup,syncAutoLock,status,install};
  }
})(window);
