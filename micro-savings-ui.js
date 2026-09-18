(function initializeMicroSavings(root) {
  'use strict';
  const Vaults = typeof module === 'object' && module.exports ? require('./vaults-core.js') : root.MerVaults;
  const sameOwner = (snapshot, owner) => Boolean(snapshot?.profile && owner && snapshot.authenticated !== false && snapshot.profileId === owner.profileId && snapshot.sessionId === owner.sessionId);
  function saveRule(bridge, owner, input) {
    const current = bridge?.snapshot();
    if (!sameOwner(current, owner)) return false;
    bridge.mutate(owner.profileId, 'micro-savings-roundup-configure', profile => {
      const result = Vaults.configureRoundUps(profile, input, current.referenceDate, { profileId:owner.profileId });
      if (!result.valid) throw new Error('Invalid round-up rule');
    });
    return true;
  }
  if (typeof module === 'object' && module.exports) module.exports = { sameOwner, saveRule };
  if (!root.document) return;
  const doc = root.document, el = id => doc.getElementById(id), bridge = () => root.MerVaultsBridge;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  let card, owner, draft, revision;
  const snapshot = () => bridge()?.snapshot();
  const say = (hr, en) => snapshot()?.language === 'en' ? en : hr;
  const money = value => root.MerCore.formatCurrency(value, { currency:'EUR', locale:snapshot()?.language === 'en' ? 'en-GB' : 'hr-HR' });
  const privateView = () => doc.body.classList.contains('balances-hidden') || doc.body.classList.contains('enterprise-stealth');
  function renderProjection() {
    const s = snapshot();
    if (!sameOwner(s, owner)) { refresh(); return; }
    const projection = Vaults.roundUpProjection(s.profile, draft, s.referenceDate, { profileId:s.profileId });
    if (!projection) return;
    el('microSavingsAnnual').textContent = privateView() ? '••••' : money(projection.annualSavings);
    el('microSavingsFrequencyValue').textContent = String(projection.transactionsPerMonth);
    el('microSavingsFrequency').setAttribute('aria-valuetext', `${projection.transactionsPerMonth} ${say('kupnji mjesečno', 'purchases per month')}`);
    const points = [[0,49], ...projection.monthlyProjection.map(item => [item.month * 20, 49 - (projection.annualSavingsCents ? item.savingsCents / projection.annualSavingsCents * 43 : 0)])];
    const line = points.map((point, index) => `${index ? 'L' : 'M'}${point[0]},${point[1].toFixed(2)}`).join(' ');
    el('microSavingsChart').innerHTML = `<path class="micro-savings-area" d="${line} L240,54 L0,54 Z"></path><path class="micro-savings-line" d="${line}"></path>`;
    el('microSavingsBasis').textContent = projection.source === 'history'
      ? say(`Prosjek ${projection.sampleCount} EUR kartičnih kupnji u zadnjih 90 dana.`, `Average of ${projection.sampleCount} EUR card purchases in the last 90 days.`)
      : say('Bez kartične povijesti: pretpostavka pola koraka po kupnji.', 'No card history: assumes half a rounding step per purchase.');
    card.querySelectorAll('[data-micro-increment]').forEach(button => {
      const selected = Number(button.dataset.microIncrement) === draft.increment;
      button.setAttribute('aria-checked', String(selected)); button.tabIndex = selected ? 0 : -1;
    });
  }
  function persist(enabled) {
    try {
      if (!saveRule(bridge(), owner, { enabled, increment:draft.increment, goalId:draft.goalId })) { refresh(); return; }
      bridge().toast(enabled ? say('Zaokruživanje je uključeno za nove EUR kartične kupnje.', 'Round-ups are on for new EUR card purchases.') : say('Zaokruživanje je pauzirano.', 'Round-ups are paused.'));
    } catch {
      refresh();
      el('microSavingsError').textContent = say('Pravilo nije spremljeno. Provjerite odredišni cilj.', 'The rule was not saved. Check the destination goal.');
      el('microSavingsError').hidden = false;
    }
  }
  function refresh() {
    const s = snapshot(), layout = doc.querySelector('#savingsView > .savings-layout');
    if (!s?.profile || !layout || !Vaults) return;
    if (!card) {
      card = doc.createElement('article'); card.id = 'microSavingsCard'; card.className = 'panel micro-savings-card';
      card.setAttribute('aria-labelledby', 'microSavingsTitle'); layout.append(card);
    }
    card.hidden = s.authenticated === false;
    if (card.hidden) { owner = null; draft = null; return; }
    const config = s.profile.enterprise?.roundUps?.profileId === s.profileId ? s.profile.enterprise.roundUps : {};
    const goals = (s.profile.goalBuckets || []).filter(goal => goal && !goal.taxVault && (!goal.profileId || goal.profileId === s.profileId));
    if (!sameOwner(s, owner)) {
      owner = { profileId:s.profileId, sessionId:s.sessionId }; draft = {}; revision = undefined;
    }
    if (revision !== config.revision || !draft.increment) {
      draft.increment = [1,2,5].includes(Number(config.increment)) ? Number(config.increment) : 1;
      draft.goalId = config.goalId || goals.find(goal => goal.primary)?.id || goals[0]?.id || '';
      revision = config.revision;
    }
    if (!goals.some(goal => goal.id === draft.goalId)) draft.goalId = goals[0]?.id || '';
    const projection = Vaults.roundUpProjection(s.profile, draft, s.referenceDate, { profileId:s.profileId });
    if (!projection) return;
    draft.transactionsPerMonth = projection.transactionsPerMonth;
    const focused = card.contains(doc.activeElement) ? doc.activeElement.id : '';
    card.innerHTML = `<header class="micro-savings-heading"><h2 id="microSavingsTitle">${say('Micro-štednja', 'Micro-savings')}</h2><span>${say('12 mjeseci', '12 months')}</span></header>
      <div class="micro-savings-visual"><div><strong id="microSavingsAnnual" data-money aria-live="polite" aria-atomic="true"></strong><small>${say('procijenjena godišnja štednja', 'estimated annual savings')}</small></div><svg id="microSavingsChart" viewBox="0 0 240 54" preserveAspectRatio="none" aria-hidden="true"></svg></div>
      <div class="micro-savings-controls"><label class="micro-savings-frequency" for="microSavingsFrequency"><span>${say('Kartičnih kupnji mjesečno', 'Card purchases per month')} <output id="microSavingsFrequencyValue" for="microSavingsFrequency"></output></span><input id="microSavingsFrequency" type="range" min="0" max="200" step="1" value="${draft.transactionsPerMonth}"></label>
      <div class="micro-savings-thresholds" role="radiogroup" aria-label="${say('Zaokruži do sljedećeg višekratnika', 'Round up to the next multiple')}"><span>${say('Korak', 'Step')}</span>${[1,2,5].map(increment => `<button type="button" class="bg-white" id="microSavingsStep${increment}" role="radio" data-micro-increment="${increment}" aria-checked="${draft.increment === increment}">${increment} €</button>`).join('')}</div></div>
      <div class="micro-savings-rule"><label class="micro-savings-destination"><span>${say('Odredišni cilj', 'Destination goal')}</span><select id="microSavingsGoal" ${goals.length ? '' : 'disabled'}>${goals.length ? goals.map(goal => `<option value="${esc(goal.id)}" ${goal.id === draft.goalId ? 'selected' : ''}>${esc(goal.name)}</option>`).join('') : `<option>${say('Najprije dodajte cilj', 'Add a goal first')}</option>`}</select></label><label class="micro-savings-toggle"><input type="checkbox" role="switch" class="bg-white" id="microSavingsEnabled" aria-describedby="microSavingsScope" ${config.enabled ? 'checked' : ''} ${goals.length ? '' : 'disabled'}><span>${say('Auto-zaokruživanje', 'Auto-roundups')}</span></label></div>
      <p class="micro-savings-note" id="microSavingsBasis"></p><p class="micro-savings-note" id="microSavingsScope">${say('Samo nove EUR kartične kupnje. Virtualna štednja, bez bankovnih prijenosa.', 'New EUR card purchases only. Virtual savings, no bank transfers.')}</p><p class="micro-savings-error" id="microSavingsError" role="alert" hidden></p>`;
    el('microSavingsFrequency').addEventListener('input', event => {
      if (!sameOwner(snapshot(), owner)) { refresh(); return; }
      draft.transactionsPerMonth = Number(event.target.value); renderProjection();
    });
    card.querySelectorAll('[data-micro-increment]').forEach(button => button.addEventListener('click', () => {
      if (!sameOwner(snapshot(), owner)) { refresh(); return; }
      if (draft.increment === Number(button.dataset.microIncrement)) return;
      draft.increment = Number(button.dataset.microIncrement); renderProjection();
      if (snapshot()?.profile.enterprise?.roundUps?.enabled) persist(true);
    }));
    card.querySelector('.micro-savings-thresholds').addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const steps = [1,2,5], index = steps.indexOf(draft.increment), next = event.key === 'Home' ? 1 : event.key === 'End' ? 5 : steps[(index + (['ArrowLeft','ArrowUp'].includes(event.key) ? 2 : 1)) % steps.length];
      el(`microSavingsStep${next}`).click(); el(`microSavingsStep${next}`)?.focus({ preventScroll:true });
    });
    el('microSavingsGoal').addEventListener('change', event => {
      if (!sameOwner(snapshot(), owner)) { refresh(); return; }
      draft.goalId = event.target.value;
      if (snapshot()?.profile.enterprise?.roundUps?.enabled) persist(true);
    });
    el('microSavingsEnabled').addEventListener('change', event => persist(event.target.checked));
    renderProjection();
    if (focused) el(focused)?.focus({ preventScroll:true });
  }
  root.MerMicroSavings = Object.freeze({ refresh });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', refresh, { once:true }); else refresh();
})(typeof window !== 'undefined' ? window : globalThis);
