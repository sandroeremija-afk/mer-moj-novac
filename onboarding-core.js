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
      id:'overview', view:'overview', target:'#overviewView .summary-card.balance-card', mobileTarget:'#overviewView .summary-card.balance-card', contextTarget:'.nav-item[data-view="overview"]', placement:'bottom', titleKey:'onboardingOverviewTitle', bodyKey:'onboardingOverviewBody',
      copy:copy('Vaš financijski pregled', 'Ovdje u svakom trenutku vidite koliko novca imate na raspolaganju i brzi pregled mjesečne potrošnje.', 'Your financial overview', 'See how much money you have available and a quick view of monthly spending at any time.')
    },
    {
      id:'transaction', view:'overview', target:'#sidebar .sidebar-transaction-button[data-open-transaction]', mobileTarget:'#sidebar .sidebar-transaction-button[data-open-transaction]', contextTarget:'.nav-item[data-view="overview"]', placement:'right', openSidebar:true, titleKey:'onboardingTransactionTitle', bodyKey:'onboardingTransactionBody',
      copy:copy('Unos prihoda i troškova', 'Jednim klikom možete ručno unijeti novi trošak ili prihod, ili uvoziti izvod iz vaše banke.', 'Income and expense entry', 'Add a new expense or income in one click, or import a statement from your bank.')
    },
    {
      id:'budgets', view:'budgets', target:'#budgetsView .table-panel .panel-heading', mobileTarget:'#budgetsView .table-panel .panel-heading', contextTarget:'.nav-item[data-view="budgets"]', placement:'bottom', titleKey:'onboardingBudgetsTitle', bodyKey:'onboardingBudgetsBody',
      copy:copy('Mesečni plan i limiti', 'Postavite granice potrošnje po kategorijama (hrana, prijevoz, režije) kako biste lakše uštedjeli.', 'Monthly plan and limits', 'Set spending limits by category (food, transport, utilities) to make saving easier.')
    },
    {
      id:'savings', view:'savings', target:'#savingsView .savings-hero', mobileTarget:'#savingsView .savings-hero-head', contextTarget:'.nav-item[data-view="savings"]', placement:'bottom', titleKey:'onboardingSavingsTitle', bodyKey:'onboardingSavingsBody',
      copy:copy('Ciljevi štednje', 'Pratite napredak svojih fondova za hitne slučajeve i postavite automatska pravila zaokruživanja.', 'Savings goals', 'Track progress toward emergency funds and set automatic round-up rules.')
    },
    {
      id:'insights', view:'insights', target:'#insightsView .monthly-bars-card', mobileTarget:'#insightsView .monthly-bars-card .panel-heading', contextTarget:'.nav-item[data-view="insights"]', placement:'bottom', titleKey:'onboardingInsightsTitle', bodyKey:'onboardingInsightsBody',
      copy:copy('Izvješća i analitika', 'Pregledajte kretanje prihoda i troškova po razdobljima te prilagodite postavke profila u bilo kojem trenutku.', 'Reports and analytics', 'Review income and expense trends by period and adjust profile settings at any time.')
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
    const selected = naturalCandidate
      || [...candidates].sort((a,b) => a.overlapArea - b.overlapArea || spaces[b.placement] - spaces[a.placement])[0];
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
    const steps = Object.freeze((Array.isArray(options.steps) && options.steps.length ? options.steps : DEFAULT_STEPS).map(step => Object.freeze(typeof step === 'string' ? { id:step, titleKey:`${step}Title`, bodyKey:`${step}Body` } : { ...step })));
    const key = `${STORAGE_PREFIX}${userId}`;
    const now = typeof options.now === 'function' ? options.now : Date.now;
    let memoryRecord = null;
    let open = false;
    const timestamp = () => new Date(now()).toISOString();

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
        currentStep: Math.max(0, Math.min(steps.length - 1, Number(current.currentStep) || 0)),
        ...patch
      };
      memoryRecord = next;
      try { storage?.setItem?.(key, JSON.stringify(next)); } catch { /* The in-memory record remains authoritative for this session. */ }
      return next;
    }

    function snapshot() {
      const record = read();
      const currentStep = Math.max(0, Math.min(steps.length - 1, Number(record.currentStep) || 0));
      return Object.freeze({
        key,
        userId,
        steps,
        currentStep,
        open,
        stepIndex: currentStep,
        stepId: steps[currentStep].id,
        step: steps[currentStep],
        launchedAt: record.launchedAt || null,
        completedAt: record.completedAt || null,
        dismissedAt: record.dismissedAt || null,
        complete: Boolean(record.completedAt),
        dismissed: Boolean(record.dismissedAt),
        record:Object.freeze({ launchedAt:record.launchedAt || null, completedAt:record.completedAt || null, dismissedAt:record.dismissedAt || null })
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
        dismissedAt: current.dismissedAt
      });
      return snapshot();
    }

    function next() {
      const current = snapshot();
      if (!open) return current;
      if (current.currentStep >= steps.length - 1) return current;
      write({ currentStep: current.currentStep + 1 });
      return snapshot();
    }

    function previous() {
      const current = snapshot();
      if (!open) return current;
      write({ currentStep: Math.max(0, current.currentStep - 1) });
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
      write({ launchedAt: snapshot().launchedAt || completedAt, completedAt, dismissedAt: null, currentStep: steps.length - 1 });
      return snapshot();
    }

    return Object.freeze({ key, steps, shouldAutoStart, start, next, previous, dismiss, complete, snapshot });
  }

  return Object.freeze({ STORAGE_PREFIX, DEFAULT_STEPS, cleanUserId, computeSpotlightLayout, createOnboardingController });
});
