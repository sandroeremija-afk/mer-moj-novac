(function modalFooterStandard(root) {
  'use strict';
  const footerSelector = '.modal-actions, .receipt-footer, .planning-footer, .export-footer, .invoice-footer, .engagement-footer, .vaults-footer, .savings-detail-footer, .savings-strategy-footer, .mer-generated-footer';
  const navigationSelector = '[data-planning-back], [data-plan-back], [data-invoice-back], #receiptBack, #exportBack, #planOverviewBack, #assessmentBack, #wrappedBack, #backToTransactionEntry, #bankConnectionBack';
  const closeSelector = '.modal-close, header [data-planning-close], header [data-receipt-close], header [data-export-close], header [data-engagement-close], header [data-vault-close], header [data-enterprise-close], header .icon-button';
  const hidden = node => Boolean(node?.closest('[hidden], [data-topic-hidden]'));
  const isBack = node => node.matches(navigationSelector) || /^(?:←\s*)?(?:Natrag|Back)(?:\s|$)/i.test(node.textContent.trim());
  const isClose = node => /^(?:Zatvori|Close|Otkaži|Cancel|Odustani)$/i.test(node.textContent.trim());
  function createController(document) {
    function addClose(dialog, footer) {
      // Authentication locks intentionally have no dismissal control.
      const close = dialog.querySelector(closeSelector);
      if (!close) return null;
      let button = footer.querySelector('[data-footer-close]');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button'; button.className = 'secondary-button'; button.dataset.footerClose = '';
        button.addEventListener('click', () => dialog.querySelector(closeSelector)?.click());
        footer.prepend(button);
      }
      const label = document.documentElement.lang === 'en' ? 'Close' : 'Zatvori';
      if (button.textContent !== label) button.textContent = label;
      return button;
    }
    function normalizeFooter(dialog, footer) {
      footer.classList.add('mer-modal-footer');
      const controls = [...footer.querySelectorAll('button')].filter(node => node.closest('dialog') === dialog);
      controls.forEach(node => { node.removeAttribute('data-footer-left'); node.removeAttribute('data-footer-redundant'); });
      const available = controls.filter(node => !hidden(node) && !node.hasAttribute('data-footer-close'));
      const back = available.find(isBack), secondary = back || available.find(isClose);
      if (secondary && !back) {
        const label = secondary.querySelector('[data-i18n]') || secondary;
        if (label.hasAttribute('data-i18n')) label.setAttribute('data-i18n', 'close');
        const text = document.documentElement.lang === 'en' ? 'Close' : 'Zatvori';
        if (label.textContent !== text) label.textContent = text;
      }
      const generated = footer.querySelector('[data-footer-close]');
      if (generated) generated.hidden = Boolean(secondary);
      const left = secondary || addClose(dialog, footer);
      if (left) {
        if (left.hasAttribute('data-footer-close')) left.hidden = false;
        left.setAttribute('data-footer-left', '');
        // Move the existing node, never clone handlers or recreate a live form.
        const holder = left.closest('#importTransactionBackWrap');
        if (holder && holder.parentElement === footer) { if (footer.firstElementChild !== holder) footer.prepend(holder); }
        else if (left.parentElement !== footer || footer.firstElementChild !== left) footer.prepend(left);
      }
      if (back) available.filter(node => node !== back && isClose(node)).forEach(node => node.setAttribute('data-footer-redundant', ''));
    }
    function enhance(dialog) {
      if (!dialog || dialog.classList.contains('enterprise-lock-dialog') || dialog.classList.contains('tour-modal-host')) return;
      // Stage-specific wrappers retain their hidden state and draft/return handlers.
      if (dialog.id === 'importDataModal') {
        const review = dialog.querySelector('#importReview'), footer = dialog.querySelector('.import-commit-actions');
        if (footer) {
          if (footer.parentElement !== dialog) dialog.append(footer);
          const wrapper = dialog.querySelector('#importTransactionBackWrap');
          if (wrapper && wrapper.parentElement !== footer) footer.prepend(wrapper);
          const submit = footer.querySelector('#confirmImport');
          if (submit) submit.hidden = Boolean(review?.hidden);
        }
      }
      let footers = [...dialog.querySelectorAll(footerSelector)].filter(node => node.closest('dialog') === dialog && !node.closest('.settings-modal-body'));
      // Do not consider a nested form action row to be the overall dialog footer.
      footers = footers.filter(node => !footers.some(parent => parent !== node && parent.contains(node)));
      const main = footers.filter(node => !hidden(node) && !node.classList.contains('mer-generated-footer'));
      let generated = dialog.querySelector(':scope > .mer-generated-footer');
      if (!main.length && dialog.querySelector(closeSelector)) {
        if (!generated) { generated = document.createElement('footer'); generated.className = 'mer-generated-footer'; dialog.append(generated); footers.push(generated); }
        generated.hidden = false;
      } else if (generated) generated.hidden = true;
      footers.forEach(footer => { if (!hidden(footer)) normalizeFooter(dialog, footer); });
      dialog.classList.add('mer-footer-standard');
    }
    return {enhance};
  }
  if (typeof module === 'object' && module.exports) module.exports = {createController, isBack, isClose, footerSelector};
  if (!root?.document) return;
  const document = root.document, controller = createController(document);
  root.MerModalFooters = Object.freeze(controller);
  let frame = 0;
  function audit() {
    frame = 0;
    observer.disconnect();
    document.querySelectorAll('dialog[open]').forEach(controller.enhance);
    observe();
  }
  const schedule = () => { if (!frame) frame = root.requestAnimationFrame(audit); };
  const observer = new root.MutationObserver(schedule);
  const observe = () => observer.observe(document.body, {subtree:true, childList:true, attributes:true, attributeFilter:['open','hidden']});
  observe();
  new root.MutationObserver(schedule).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
  schedule();
})(typeof window === 'undefined' ? null : window);
