(function exposeMerOnboardingCore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerOnboardingCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerOnboardingCore() {
  const STORAGE_PREFIX = 'mer-onboarding-v1:';
  const DEFAULT_STEPS = Object.freeze([
    { id:'welcome', titleKey:'onboardingWelcomeTitle', bodyKey:'onboardingWelcomeBody' },
    { id:'overview', titleKey:'onboardingOverviewTitle', bodyKey:'onboardingOverviewBody' },
    { id:'budgets', titleKey:'onboardingBudgetsTitle', bodyKey:'onboardingBudgetsBody' },
    { id:'savings', titleKey:'onboardingSavingsTitle', bodyKey:'onboardingSavingsBody' },
    { id:'activity', titleKey:'onboardingActivityTitle', bodyKey:'onboardingActivityBody' },
    { id:'insights', titleKey:'onboardingInsightsTitle', bodyKey:'onboardingInsightsBody' },
    { id:'settings', titleKey:'onboardingSettingsTitle', bodyKey:'onboardingSettingsBody' }
  ].map(step => Object.freeze(step)));

  const cleanUserId = value => String(value || 'anonymous').trim().toLowerCase().replace(/[^a-z0-9._@-]+/g, '-') || 'anonymous';
  const safeParse = value => {
    try { return value ? JSON.parse(value) : null; } catch { return null; }
  };

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

  return Object.freeze({ STORAGE_PREFIX, DEFAULT_STEPS, cleanUserId, createOnboardingController });
});
