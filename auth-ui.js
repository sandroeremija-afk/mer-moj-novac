(function initializeAuthUi() {
  const copy = {
    hr: {
      heroTitle: 'Mirnije odluke počinju jasnom slikom novca.',
      heroBody: 'Budžeti, pametna štednja i bankovni uvoz u jednom sigurnom radnom prostoru.',
      benefitOne: 'Osobni i poslovni podaci ostaju odvojeni',
      benefitTwo: 'Pametni uvoz uz pregled prije potvrde',
      benefitThree: 'Vaši podaci ostaju na ovom uređaju',
      eyebrow: 'DOBRODOŠLI',
      loginTitle: 'Prijavite se u svoj financijski prostor',
      login: 'Prijava',
      register: 'Registracija',
      email: 'E-mail',
      password: 'Lozinka',
      fullName: 'Ime i prezime',
      passwordHint: 'Najmanje 10 znakova. Lozinka se pretvara u PBKDF2 hash.',
      loginAction: 'Sigurna prijava',
      registerAction: 'Izradi račun',
      forgotPassword: 'Zaboravljena lozinka?',
      passwordResetOverline: 'OPORAVAK RAČUNA',
      passwordResetTitle: 'Ponovno postavite lozinku',
      passwordResetIntro: 'Unesite e-mail povezan s računom. Ako račun postoji, poslat ćemo upute za oporavak.',
      passwordResetAction: 'Pošalji upute',
      passwordResetSuccessTitle: 'Zahtjev je zaprimljen',
      passwordResetSuccessBody: 'Ako račun postoji, upute za oporavak stići će na unesenu adresu.',
      backToLogin: 'Natrag na prijavu',
      cancel: 'Otkaži',
      or: 'ili',
      demoAction: 'Nastavi u demo načinu',
      securityNote: 'Demo prijava ne traži stvarne bankovne vjerodajnice.',
      invalidCredentials: 'E-mail ili lozinka nisu ispravni.',
      emailExists: 'Račun s tim e-mailom već postoji.',
      weakPassword: 'Lozinka mora imati najmanje 10 znakova.',
      invalidEmail: 'Unesite valjanu e-mail adresu.',
      resetUnavailable: 'Oporavak trenutačno nije dostupan. Pokušajte ponovno.',
      serviceUnavailable: 'Usluga trenutačno nije dostupna. Pokušajte ponovno.',
      invalidForm: 'Provjerite unesene podatke.'
    },
    en: {
      heroTitle: 'Calmer decisions start with a clear view of your money.',
      heroBody: 'Budgets, smart savings and bank imports in one focused workspace.',
      benefitOne: 'Personal and Business data remain isolated',
      benefitTwo: 'Smart imports always include a review step',
      benefitThree: 'Your data stays on this device',
      eyebrow: 'WELCOME',
      loginTitle: 'Sign in to your financial workspace',
      login: 'Sign in',
      register: 'Create account',
      email: 'Email',
      password: 'Password',
      fullName: 'Full name',
      passwordHint: 'At least 10 characters. Your password is converted into a PBKDF2 hash.',
      loginAction: 'Secure sign in',
      registerAction: 'Create account',
      forgotPassword: 'Forgot password?',
      passwordResetOverline: 'ACCOUNT RECOVERY',
      passwordResetTitle: 'Reset your password',
      passwordResetIntro: 'Enter the email associated with your account. If the account exists, we will send recovery instructions.',
      passwordResetAction: 'Send instructions',
      passwordResetSuccessTitle: 'Request received',
      passwordResetSuccessBody: 'If the account exists, recovery instructions will arrive at the email you entered.',
      backToLogin: 'Back to sign in',
      cancel: 'Cancel',
      or: 'or',
      demoAction: 'Continue in demo mode',
      securityNote: 'Demo sign-in never asks for real bank credentials.',
      invalidCredentials: 'The email or password is incorrect.',
      emailExists: 'An account with that email already exists.',
      weakPassword: 'Use at least 10 characters.',
      invalidEmail: 'Enter a valid email address.',
      resetUnavailable: 'Recovery is temporarily unavailable. Please try again.',
      serviceUnavailable: 'The service is temporarily unavailable. Please try again.',
      invalidForm: 'Check the information and try again.'
    }
  };

  const provider = MerAuth.createLocalProvider();
  window.MerAuthProvider = provider;
  const authShell = document.getElementById('authShell');
  const appShell = document.getElementById('appShell');
  const passwordResetModal = document.getElementById('passwordResetModal');
  const passwordResetForm = document.getElementById('passwordResetForm');
  const passwordResetSuccess = document.getElementById('passwordResetSuccess');

  function lang() { return typeof currentLang !== 'undefined' && currentLang === 'en' ? 'en' : 'hr'; }
  function renderCopy() {
    document.querySelectorAll('[data-auth-copy]').forEach(element => {
      const value = copy[lang()][element.dataset.authCopy];
      if (value) element.textContent = value;
    });
  }
  function selectMode(mode) {
    const register = mode === 'register';
    authShell.dataset.authMode = register ? 'register' : 'login';
    document.getElementById('loginForm').hidden = register;
    document.getElementById('registerForm').hidden = !register;
    document.getElementById('authLoginTab').classList.toggle('active', !register);
    document.getElementById('authRegisterTab').classList.toggle('active', register);
    document.getElementById('authLoginTab').setAttribute('aria-selected', String(!register));
    document.getElementById('authRegisterTab').setAttribute('aria-selected', String(register));
    document.getElementById('authTitle').dataset.authCopy = register ? 'register' : 'loginTitle';
    document.getElementById('authTitle').textContent = register ? copy[lang()].register : copy[lang()].loginTitle;
  }
  function applyUser(session) {
    if (!session || session.demo) return;
    const profile = appState.accounts.personal;
    profile.accountName = session.name;
    profile.initials = session.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
    state = appState.accounts[appState.activeAccount];
    save('auth-profile');
  }
  function enterApp(session) {
    applyUser(session);
    authShell.hidden = true;
    appShell.hidden = false;
    document.body.classList.remove('auth-pending', 'auth-visible');
    if (appState.mfa.enabled && sessionStorage.getItem('mer-mfa-unlocked') !== 'true') {
      document.getElementById('mfaLockScreen').hidden = false;
      document.body.classList.add('mfa-locked');
    }
    renderCopy();
    renderAll();
    window.MerOnboardingUi?.onSessionStarted(session);
  }
  function showAuth() {
    window.MerOnboardingUi?.close();
    window.MerAssistantUi?.resetSession?.();
    window.MerLayoutUi?.disable?.({ notify:false });
    document.getElementById('mfaLockScreen').hidden = true;
    document.body.classList.remove('mfa-locked');
    appShell.hidden = true;
    authShell.hidden = false;
    document.body.classList.remove('auth-pending');
    document.body.classList.add('auth-visible');
    renderCopy();
    selectMode('login');
    setTimeout(() => document.getElementById('loginEmail').focus(), 30);
  }
  function closePasswordReset() {
    if (passwordResetModal.open) passwordResetModal.close();
    const trigger=document.getElementById('forgotPassword');if(trigger?.isConnected)trigger.focus();
  }
  function openPasswordReset(event) {
    event?.preventDefault();
    passwordResetForm.hidden = false;
    passwordResetSuccess.hidden = true;
    document.getElementById('passwordResetError').textContent = '';
    document.getElementById('passwordResetEmail').value = document.getElementById('loginEmail').value.trim();
    if(!passwordResetModal.open)passwordResetModal.showModal();
    setTimeout(() => document.getElementById('passwordResetEmail').focus(), 30);
  }

  const messageFor = code => code === 'EMAIL_EXISTS'
    ? copy[lang()].emailExists
    : code === 'WEAK_PASSWORD'
      ? copy[lang()].weakPassword
      : code === 'INVALID_CREDENTIALS'
        ? copy[lang()].invalidCredentials
        : code === 'INVALID_EMAIL'
          ? copy[lang()].invalidEmail
          : code === 'RESET_UNAVAILABLE'
            ? copy[lang()].resetUnavailable
            : code === 'UNAVAILABLE'
              ? copy[lang()].serviceUnavailable
            : copy[lang()].invalidForm;

  async function runAuthAction(form,errorId,action) {
    const submit=form?.querySelector('[type="submit"]');if(submit?.disabled)return;
    if(submit)submit.disabled=true;
    try{return await action();}catch(error){window.MerRuntime?.report?.(error,{silent:true});const target=document.getElementById(errorId);if(target)target.textContent=messageFor('UNAVAILABLE');return null;}finally{if(submit)submit.disabled=false;}
  }

  document.getElementById('authLoginTab').addEventListener('click', () => selectMode('login'));
  document.getElementById('authRegisterTab').addEventListener('click', () => selectMode('register'));
  document.getElementById('forgotPassword').addEventListener('click', openPasswordReset);
  document.getElementById('closePasswordReset').addEventListener('click', closePasswordReset);
  document.getElementById('cancelPasswordReset').addEventListener('click', closePasswordReset);
  document.getElementById('passwordResetDone').addEventListener('click', closePasswordReset);
  passwordResetModal.addEventListener('cancel', event => { event.preventDefault(); closePasswordReset(); });
  window.MerRuntime.bindDialogBackdropDismiss(passwordResetModal, closePasswordReset);
  passwordResetModal.setAttribute('aria-modal','true');
  passwordResetModal.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const focusable=[...passwordResetModal.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(element=>!element.hidden&&element.getClientRects().length>0);if(!focusable.length){event.preventDefault();passwordResetModal.focus();return;}const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
  passwordResetForm.addEventListener('submit', async event => {
    event.preventDefault();
    const result = await runAuthAction(passwordResetForm,'passwordResetError',()=>provider.requestPasswordReset({ email: document.getElementById('passwordResetEmail').value }));
    if(!result)return;
    document.getElementById('passwordResetError').textContent = result.ok ? '' : messageFor(result.code);
    if (result.ok) {
      passwordResetForm.hidden = true;
      passwordResetSuccess.hidden = false;
      document.getElementById('passwordResetDone').focus();
    }
  });
  document.getElementById('demoLogin').addEventListener('click', () => {try{enterApp(provider.startDemo(appState.accounts.personal.accountName));}catch(error){window.MerRuntime?.report?.(error);}});
  document.getElementById('loginForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form=event.currentTarget,result = await runAuthAction(form,'loginError',()=>provider.signIn({ email: document.getElementById('loginEmail').value, password: document.getElementById('loginPassword').value }));
    if(!result)return;
    document.getElementById('loginError').textContent = result.ok ? '' : messageFor(result.code);
    if (result.ok) enterApp(result.session);
  });
  document.getElementById('registerForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form=event.currentTarget,result = await runAuthAction(form,'registerError',()=>provider.register({ name: document.getElementById('registerName').value, email: document.getElementById('registerEmail').value, password: document.getElementById('registerPassword').value }));
    if(!result)return;
    document.getElementById('registerError').textContent = result.ok ? '' : messageFor(result.code);
    if (result.ok) enterApp(result.session);
  });
  document.getElementById('logoutButton').addEventListener('click', () => {
    provider.signOut();
    sessionStorage.removeItem('mer-mfa-unlocked');
    toggleAccountMenu(false);
    showAuth();
  });
  document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', renderCopy));

  const session = provider.currentSession();
  if (session) enterApp(session); else showAuth();
})();
