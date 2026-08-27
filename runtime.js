(function initializeRuntimeBoundary(root) {
  let banner = null;
  let lastSignature = '';

  function ensureBanner() {
    if (banner?.isConnected) return banner;
    banner = document.createElement('section');
    banner.id = 'runtimeErrorBoundary';
    banner.className = 'runtime-error-boundary';
    banner.setAttribute('role', 'alert');
    banner.setAttribute('aria-live', 'assertive');
    banner.hidden = true;
    const message = document.createElement('span');
    message.dataset.runtimeMessage = '';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.dataset.runtimeRetry = '';
    retry.addEventListener('click', () => root.location.reload());
    banner.append(message, retry);
    document.body.appendChild(banner);
    return banner;
  }

  function report(error, options = {}) {
    const signature = String(error?.message || error || 'runtime-error').slice(0, 160);
    lastSignature = signature;
    if (options.silent) return signature;
    const element = ensureBanner();
    const english = document.documentElement.lang === 'en';
    element.querySelector('[data-runtime-message]').textContent = english
      ? 'Something did not load correctly. Your saved data is intact.'
      : 'Nešto se nije ispravno učitalo. Vaši spremljeni podaci su sigurni.';
    const retry = element.querySelector('[data-runtime-retry]');
    retry.textContent = english ? 'Reload app' : 'Ponovno učitaj';
    retry.setAttribute('aria-label', retry.textContent);
    element.hidden = false;
    return signature;
  }

  function isDirectDialogBackdropEvent(dialog, event) {
    if (!dialog || event?.target !== dialog || event.button !== 0) return false;
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  }

  function bindDialogBackdropDismiss(dialog, dismiss) {
    if (!dialog || typeof dismiss !== 'function') return () => {};
    let pressStartedOnBackdrop = false;
    const reset = () => { pressStartedOnBackdrop = false; };
    const handleMouseDown = event => {
      pressStartedOnBackdrop = isDirectDialogBackdropEvent(dialog, event);
    };
    const handleMouseUp = event => {
      const shouldDismiss = pressStartedOnBackdrop && isDirectDialogBackdropEvent(dialog, event);
      reset();
      if (shouldDismiss) dismiss(event);
    };
    dialog.addEventListener('mousedown', handleMouseDown, true);
    dialog.addEventListener('mouseup', handleMouseUp, true);
    dialog.addEventListener('close', reset);
    return () => {
      dialog.removeEventListener('mousedown', handleMouseDown, true);
      dialog.removeEventListener('mouseup', handleMouseUp, true);
      dialog.removeEventListener('close', reset);
    };
  }

  root.MerRuntime = { report, getLastSignature: () => lastSignature, isDirectDialogBackdropEvent, bindDialogBackdropDismiss };
  root.addEventListener('error', event => report(event.error || event.message || 'resource-load-error'));
  root.addEventListener('unhandledrejection', event => { event.preventDefault(); report(event.reason || 'unhandled-promise'); });
})(window);
