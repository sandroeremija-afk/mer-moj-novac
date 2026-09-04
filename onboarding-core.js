(function exposeMerOnboardingCore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerOnboardingCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerOnboardingCore() {
  const STORAGE_PREFIX = 'mer-onboarding-v1:';
  const copy = (hrTitle, hrDescription, enTitle, enDescription) => Object.freeze({
    hr:Object.freeze({ title:hrTitle, description:hrDescription }),
    en:Object.freeze({ title:enTitle, description:enDescription })
  });
  const DEFAULT_STEPS = Object.freeze([
    {
      id:'overview', view:'overview', target:'#overviewView .summary-grid', mobileTarget:'#overviewView .summary-grid', contextTarget:'.nav-item[data-view="overview"]', placement:'bottom', titleKey:'onboardingOverviewTitle', bodyKey:'onboardingOverviewBody',
      copy:copy('Glavni pregled', 'Ovdje u svakom trenutku vidite koliko novca imate na raspolaganju i brzi pregled mjesečne potrošnje.', 'Your overview', 'See how much money you have available and a quick view of monthly spending at any time.')
    },
    {
      id:'transaction', view:'overview', target:'#sidebar .sidebar-transaction-button[data-open-transaction]', mobileTarget:'#sidebar .sidebar-transaction-button[data-open-transaction]', contextTarget:'.nav-item[data-view="overview"]', placement:'right', openSidebar:true, titleKey:'onboardingTransactionTitle', bodyKey:'onboardingTransactionBody',
      copy:copy('Unos transakcija', 'Jednim klikom možete ručno unijeti novi trošak ili prihod, ili uvoziti izvod iz vaše banke.', 'Add transactions', 'Add a new expense or income in one click, or import a statement from your bank.')
    },
    {
      id:'budgets', view:'budgets', target:'#budgetsView .table-panel', mobileTarget:'#budgetsView .table-panel', contextTarget:'.nav-item[data-view="budgets"]', placement:'top', titleKey:'onboardingBudgetsTitle', bodyKey:'onboardingBudgetsBody',
      copy:copy('Mesečni budžeti', 'Postavite granice potrošnje po kategorijama (hrana, prijevoz, režije) kako biste lakše uštedjeli.', 'Monthly budgets', 'Set spending limits by category (food, transport, utilities) to make saving easier.')
    },
    {
      id:'savings', view:'savings', target:'#savingsView .goal-buckets-panel', mobileTarget:'#savingsView .goal-buckets-panel', contextTarget:'.nav-item[data-view="savings"]', placement:'top', titleKey:'onboardingSavingsTitle', bodyKey:'onboardingSavingsBody',
      copy:copy('Ciljevi štednje', 'Pratite napredak svojih fondova za hitne slučajeve i postavite automatska pravila zaokruživanja.', 'Savings goals', 'Track progress toward emergency funds and set automatic round-up rules.')
    },
    {
      id:'insights', view:'insights', target:'#insightsView', mobileTarget:'#insightsView', contextTarget:'.nav-item[data-view="insights"]', placement:'bottom', titleKey:'onboardingInsightsTitle', bodyKey:'onboardingInsightsBody',
      copy:copy('Analitika i izvješća', 'Usporedite prihode i troškove po razdobljima. Odaberite dan, mjesec, godinu ili cijelu povijest.', 'Analytics and reports', 'Compare income and expenses by period. Choose a day, a month, a year or your full history.')
    },
    {
      id:'settings', surface:'settings', target:'#settingsTourPreferences', mobileTarget:'#settingsTourPreferences', settingsTab:'general', placement:'left', titleKey:'onboardingSettingsTitle', bodyKey:'onboardingSettingsBody',
      copy:copy('Korisničke postavke', 'Odaberite jezik, svijetlu ili tamnu temu te raspored nadzorne ploče. U sljedećem dijelu pogledajte sigurnost računa.', 'User settings', 'Choose your language, light or dark theme and dashboard layout. Next, explore account security.'),
      substeps:Object.freeze([
        Object.freeze({
          id:'general', target:'#settingsTourPreferences', mobileTarget:'#settingsTourPreferences', settingsTab:'general',
          copy:copy('Jezik, tema i raspored', 'Ovdje birate jezik, svijetlu ili tamnu temu i raspored nadzorne ploče. Vodič ne mijenja vaše postavke.', 'Language, theme and layout', 'Choose your language, light or dark theme and dashboard layout here. The tour does not change your settings.')
        }),
        Object.freeze({
          id:'password', target:'#changePasswordForm', mobileTarget:'#changePasswordForm', settingsTab:'security',
          copy:copy('Promjena lozinke', 'Za novu lozinku unesite trenutačnu lozinku, zatim novu lozinku dvaput. Tijekom vodiča ništa ne morate unositi.', 'Change your password', 'To change your password, enter your current password and the new one twice. You do not need to enter anything during this tour.')
        }),
        Object.freeze({
          id:'mfa', target:'#settingsTourMfa', mobileTarget:'#settingsTourMfa', settingsTab:'security',
          copy:copy('Dodatna zaštita računa', 'Uključite dvostruku autentifikaciju aplikacijom za potvrdu identiteta. Kodove za oporavak spremite na sigurno mjesto.', 'Extra account protection', 'Enable two-factor authentication with an authenticator app. Keep your recovery codes in a safe place.')
        })
      ])
    },
    {
      id:'help', surface:'help', target:'#helpTourConversation', mobileTarget:'#helpTourConversation', placement:'left', titleKey:'onboardingHelpTitle', bodyKey:'onboardingHelpBody',
      copy:copy('Pomoć i AI Asistent', 'Odaberite ponuđenu financijsku temu ili upišite pitanje u razgovor. Gemini AI može objasniti vaše financije kada je usluga povezana.', 'Help and AI Assistant', 'Choose a suggested financial topic or type a question in the chat. Gemini AI can explain your finances when the service is connected.')
    }
  ].map(step => Object.freeze(step)));

  const cleanUserId = value => String(value || 'anonymous').trim().toLowerCase().replace(/[^a-z0-9._@-]+/g, '-') || 'anonymous';
  const safeParse = value => {
    try { return value ? JSON.parse(value) : null; } catch { return null; }
  };

  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), Math.max(minimum, maximum));

  function computeSpotlightLayout(options = {}) {
    const viewportInput = options.viewport || {};
    const viewport = {
      left:finite(viewportInput.left),
      top:finite(viewportInput.top),
      width:Math.max(1, finite(viewportInput.width, 1)),
      height:Math.max(1, finite(viewportInput.height, 1))
    };
    const edge = Math.max(0, finite(options.edge, 12));
    const gap = Math.max(0, finite(options.gap, 14));
    const padding = Math.max(0, finite(options.padding, 8));
    const target = options.targetRect || {};
    const viewportRight = viewport.left + viewport.width;
    const viewportBottom = viewport.top + viewport.height;
    const targetLeft = finite(target.left);
    const targetTop = finite(target.top);
    const targetRight = Number.isFinite(Number(target.right)) ? Number(target.right) : targetLeft + Math.max(0, finite(target.width));
    const targetBottom = Number.isFinite(Number(target.bottom)) ? Number(target.bottom) : targetTop + Math.max(0, finite(target.height));
    const spotlightLeft = clamp(targetLeft - padding, viewport.left + edge, viewportRight - edge);
    const spotlightTop = clamp(targetTop - padding, viewport.top + edge, viewportBottom - edge);
    const spotlightRight = clamp(targetRight + padding, spotlightLeft, viewportRight - edge);
    const spotlightBottom = clamp(targetBottom + padding, spotlightTop, viewportBottom - edge);
    const spotlight = {
      left:spotlightLeft,
      top:spotlightTop,
      width:Math.max(1, spotlightRight - spotlightLeft),
      height:Math.max(1, spotlightBottom - spotlightTop)
    };

    const size = options.popoverSize || {};
    const popoverWidth = Math.min(Math.max(1, finite(size.width, 340)), Math.max(1, viewport.width - edge * 2));
    const popoverHeight = Math.min(Math.max(1, finite(size.height, 240)), Math.max(1, viewport.height - edge * 2));
    const spaces = {
      right:viewportRight - (spotlight.left + spotlight.width) - edge,
      left:spotlight.left - viewport.left - edge,
      bottom:viewportBottom - (spotlight.top + spotlight.height) - edge,
      top:spotlight.top - viewport.top - edge
    };
    const preferred = ['right', 'left', 'bottom', 'top'].includes(options.preferredPlacement) ? options.preferredPlacement : 'right';
    const opposite = { right:'left', left:'right', bottom:'top', top:'bottom' };
    const remaining = ['right', 'left', 'bottom', 'top'].filter(side => side !== preferred && side !== opposite[preferred]);
    const order = [preferred, opposite[preferred], ...remaining];
    const required = side => (side === 'left' || side === 'right' ? popoverWidth : popoverHeight) + gap;
    const candidateFor = (placement, sizeOverride = {}) => {
      const candidateWidth = Math.max(1, finite(sizeOverride.width, popoverWidth));
      const candidateHeight = Math.max(1, finite(sizeOverride.height, popoverHeight));
      let left;
      let top;
      if (placement === 'right') {
        left = spotlight.left + spotlight.width + gap;
        top = spotlight.top + spotlight.height / 2 - candidateHeight / 2;
      } else if (placement === 'left') {
        left = spotlight.left - candidateWidth - gap;
        top = spotlight.top + spotlight.height / 2 - candidateHeight / 2;
      } else if (placement === 'bottom') {
        left = spotlight.left + spotlight.width / 2 - candidateWidth / 2;
        top = spotlight.top + spotlight.height + gap;
      } else {
        left = spotlight.left + spotlight.width / 2 - candidateWidth / 2;
        top = spotlight.top - candidateHeight - gap;
      }
      left = clamp(left, viewport.left + edge, viewportRight - edge - candidateWidth);
      top = clamp(top, viewport.top + edge, viewportBottom - edge - candidateHeight);
      const right = left + candidateWidth;
      const bottom = top + candidateHeight;
      const overlapWidth = Math.max(0, Math.min(right, spotlight.left + spotlight.width) - Math.max(left, spotlight.left));
      const overlapHeight = Math.max(0, Math.min(bottom, spotlight.top + spotlight.height) - Math.max(top, spotlight.top));
      return { placement, left, top, width:candidateWidth, height:candidateHeight, overlapArea:overlapWidth * overlapHeight };
    };
    const candidates = order.map(candidateFor);
    const fittingSides = new Set(order.filter(side => spaces[side] >= required(side)));
    const naturalCandidate = candidates.find(candidate => fittingSides.has(candidate.placement) && candidate.overlapArea === 0)
      || candidates.find(candidate => candidate.overlapArea === 0);
    let selected = naturalCandidate
      || [...candidates].sort((a,b) => a.overlapArea - b.overlapArea || spaces[b.placement] - spaces[a.placement])[0];
    // A long card may exceed a phone's viewport. Keep its visible content lit and
    // reserve a separate lane for the natural-height tooltip instead of covering
    // the card or shrinking its text. The actual target remains the full card.
    if (options.allowPartialTarget && !naturalCandidate && spotlight.height > 120) {
      const bottomPopoverTop = viewportBottom - edge - popoverHeight;
      const topSliceBottom = Math.min(spotlight.top + spotlight.height, bottomPopoverTop - gap);
      const topSliceHeight = topSliceBottom - spotlight.top;
      const topPopoverBottom = viewport.top + edge + popoverHeight;
      const bottomSliceTop = Math.max(spotlight.top, topPopoverBottom + gap);
      const bottomSliceHeight = spotlight.top + spotlight.height - bottomSliceTop;
      if (topSliceHeight >= 80) {
        spotlight.height = topSliceHeight;
        spotlight.partial = true;
        selected = { ...selected, left:clamp(spotlight.left, viewport.left + edge, viewportRight - edge - popoverWidth), top:bottomPopoverTop, placement:'bottom', overlapArea:0 };
      } else if (bottomSliceHeight >= 80) {
        spotlight.top = bottomSliceTop;
        spotlight.height = bottomSliceHeight;
        spotlight.partial = true;
        selected = { ...selected, left:clamp(spotlight.left, viewport.left + edge, viewportRight - edge - popoverWidth), top:viewport.top + edge, placement:'top', overlapArea:0 };
      }
    }
    return Object.freeze({
      spotlight:Object.freeze(spotlight),
      popover:Object.freeze({
        left:selected.left,
        top:selected.top,
        width:selected.width,
        height:selected.height,
        placement:selected.placement,
        overlapsTarget:selected.overlapArea > 0
      })
    });
  }

  function createOnboardingController(options = {}) {
    const storage = options.storage || globalThis.localStorage;
    const userId = cleanUserId(options.userId);
    const steps = Object.freeze((Array.isArray(options.steps) && options.steps.length ? options.steps : DEFAULT_STEPS).map(step => {
      const definition = typeof step === 'string' ? { id:step, titleKey:`${step}Title`, bodyKey:`${step}Body` } : { ...step };
      if (Array.isArray(definition.substeps)) definition.substeps = Object.freeze(definition.substeps.map(substep => Object.freeze({ ...substep })));
      return Object.freeze(definition);
    }));
    const key = `${STORAGE_PREFIX}${userId}`;
    const now = typeof options.now === 'function' ? options.now : Date.now;
    let memoryRecord = null;
    let open = false;
    const timestamp = () => new Date(now()).toISOString();
    const stepIndex = value => clamp(Math.floor(finite(value)), 0, steps.length - 1);
    const substepCount = index => Math.max(1, steps[index].substeps?.length || 0);
    const substepIndex = (value, index) => clamp(Math.floor(finite(value)), 0, substepCount(index) - 1);

    function read() {
      try {
        const stored = safeParse(storage?.getItem?.(key));
        if (stored && typeof stored === 'object') return stored;
      } catch { /* Private mode and locked storage fall back to memory. */ }
      return memoryRecord || {};
    }

    function write(patch) {
      const current = read();
      const next = {
        version: 1,
        launchedAt: current.launchedAt || null,
        completedAt: current.completedAt || null,
        dismissedAt: current.dismissedAt || null,
        currentStep: stepIndex(current.currentStep),
        substepIndex: current.substepIndex || 0,
        ...patch
      };
      next.currentStep = stepIndex(next.currentStep);
      next.substepIndex = substepIndex(next.substepIndex, next.currentStep);
      memoryRecord = next;
      try { storage?.setItem?.(key, JSON.stringify(next)); } catch { /* The in-memory record remains authoritative for this session. */ }
      return next;
    }

    function snapshot() {
      const record = read();
      const currentStep = stepIndex(record.currentStep);
      const currentSubstep = substepIndex(record.substepIndex, currentStep);
      return Object.freeze({
        key,
        userId,
        steps,
        currentStep,
        open,
        stepIndex: currentStep,
        stepId: steps[currentStep].id,
        step: steps[currentStep],
        substepIndex: currentSubstep,
        substepCount: substepCount(currentStep),
        substep: steps[currentStep].substeps?.[currentSubstep] || null,
        launchedAt: record.launchedAt || null,
        completedAt: record.completedAt || null,
        dismissedAt: record.dismissedAt || null,
        complete: Boolean(record.completedAt),
        dismissed: Boolean(record.dismissedAt),
        record:Object.freeze({ launchedAt:record.launchedAt || null, completedAt:record.completedAt || null, dismissedAt:record.dismissedAt || null, currentStep, substepIndex:currentSubstep })
      });
    }

    function shouldAutoStart() { return !snapshot().launchedAt; }

    function start({ force = false } = {}) {
      if (!force && !shouldAutoStart()) { open = false;return snapshot(); }
      const current = snapshot();
      open = true;
      write({
        launchedAt: current.launchedAt || timestamp(),
        currentStep: force ? 0 : current.currentStep,
        substepIndex: force ? 0 : current.substepIndex,
        dismissedAt: current.dismissedAt
      });
      return snapshot();
    }

    function next() {
      const current = snapshot();
      if (!open) return current;
      if (current.substepIndex < current.substepCount - 1) {
        write({ substepIndex: current.substepIndex + 1 });
        return snapshot();
      }
      if (current.currentStep >= steps.length - 1) return current;
      write({ currentStep: current.currentStep + 1, substepIndex:0 });
      return snapshot();
    }

    function previous() {
      const current = snapshot();
      if (!open) return current;
      if (current.substepIndex > 0) {
        write({ substepIndex: current.substepIndex - 1 });
      } else {
        const previousStep = Math.max(0, current.currentStep - 1);
        write({ currentStep:previousStep, substepIndex:current.currentStep > 0 ? substepCount(previousStep) - 1 : 0 });
      }
      return snapshot();
    }

    function selectSubstep(index) {
      const current = snapshot();
      if (!open) return current;
      write({ substepIndex:substepIndex(index, current.currentStep) });
      return snapshot();
    }

    function dismiss() {
      const current = snapshot();
      open = false;
      write({ launchedAt: current.launchedAt || timestamp(), dismissedAt: timestamp() });
      return snapshot();
    }

    function complete() {
      const completedAt = timestamp();
      open = false;
      write({ launchedAt: snapshot().launchedAt || completedAt, completedAt, dismissedAt: null, currentStep: steps.length - 1, substepIndex:substepCount(steps.length - 1) - 1 });
      return snapshot();
    }

    return Object.freeze({ key, steps, shouldAutoStart, start, next, previous, selectSubstep, dismiss, complete, snapshot });
  }

  return Object.freeze({ STORAGE_PREFIX, DEFAULT_STEPS, cleanUserId, computeSpotlightLayout, createOnboardingController });
});
