(function exposeMerPlanningCore(root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./core.js') : root.MerCore);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MerPlanningCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMerPlanningCore(Core) {
  'use strict';
  const DAY = 86400000;
  const list = value => Array.isArray(value) ? value : [];
  const text = (value, max = 120) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
  const cents = value => Math.round((Number(value) + Math.sign(Number(value)) * Number.EPSILON) * 100);
  const cleanDate = value => Core.transactionDate({date:value});
  const dayNumber = value => Date.parse(`${value}T00:00:00Z`) / DAY;
  const addDays = (value, count) => new Date((dayNumber(value) + count) * DAY).toISOString().slice(0, 10);
  const normalizeName = value => text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en').replace(/[^a-z0-9]+/g, ' ').trim();
  const profileId = (profile, options = {}) => options.profileId || profile?.profileId || (profile?.accountLabel === 'businessAccount' ? 'business' : 'personal');
  const scoped = (item, id) => item && (!item.profileId || item.profileId === id);
  function today(timezone = 'Europe/Zagreb', now = new Date()) {
    const date = now instanceof Date ? now : new Date(now);
    if (!Number.isFinite(date.getTime())) throw new TypeError('INVALID_DATE');
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:timezone, year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(date).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  function reference(options = {}) {
    if (options.referenceDate !== undefined) {
      const date = cleanDate(options.referenceDate);
      if (!date) throw new TypeError('INVALID_DATE');
      return date;
    }
    return today(options.timezone || 'Europe/Zagreb', options.now || new Date());
  }
  function addMonthsClamped(value, count) {
    const start = cleanDate(value);
    if (!start || !Number.isInteger(count)) return null;
    const year = Number(start.slice(0, 4)), month = Number(start.slice(5, 7)) - 1, day = Number(start.slice(8, 10));
    const result = new Date(Date.UTC(year, month + count, 1));
    result.setUTCDate(Math.min(day, Core.daysInMonth(result.getUTCFullYear(), result.getUTCMonth())));
    return result.toISOString().slice(0, 10);
  }

  function validateFire(input = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return {valid:false, reason:'inputs'};
    const fields = {netWorth:[0, 1000000000], monthlyContribution:[0, 10000000], monthlySpending:[0.01, 10000000], annualReturn:[-50, 30], withdrawalRate:[1, 10], inflation:[-5, 20]};
    const values = {};
    for (const [key, [minimum, maximum]] of Object.entries(fields)) {
      const number = Number(input[key]);
      if (input[key] === '' || input[key] === null || input[key] === undefined || !Number.isFinite(number) || number < minimum || number > maximum) return {valid:false, reason:key};
      values[key] = number;
    }
    return {valid:true, values};
  }

  function projectFire(values, start, annualReturn = values.annualReturn) {
    const targetCents = Math.ceil(cents(values.monthlySpending) * 12 / (values.withdrawalRate / 100));
    const realAnnualRate = (1 + annualReturn / 100) / (1 + values.inflation / 100) - 1;
    const monthlyRate = Math.pow(1 + realAnnualRate, 1 / 12) - 1;
    const contributionCents = cents(values.monthlyContribution);
    let balanceCents = cents(values.netWorth), reachedMonth = balanceCents >= targetCents ? 0 : null;
    const series = [{month:0, date:start, balanceCents, targetCents}];
    let clipped = false;
    for (let month = 1; month <= 720; month += 1) {
      balanceCents = Math.round(balanceCents * (1 + monthlyRate)) + contributionCents;
      if (!Number.isSafeInteger(balanceCents) || balanceCents > 100000000000000) { balanceCents = 100000000000000; clipped = true; }
      if (reachedMonth === null && balanceCents >= targetCents) reachedMonth = month;
      if (month % 12 === 0 || month === reachedMonth) series.push({month, date:addMonthsClamped(start, month), balanceCents, targetCents});
    }
    return {targetCents, realAnnualRate, contributionCents, reachedMonth, estimatedDate:reachedMonth === null ? null : addMonthsClamped(start, reachedMonth), yearsToTarget:reachedMonth === null ? null : Math.round(reachedMonth / 12 * 10) / 10, series, clipped};
  }

  function calculateFire(input, options = {}) {
    const validation = validateFire(input);
    if (!validation.valid) return validation;
    let start;
    try { start = reference(options); } catch { return {valid:false, reason:'date'}; }
    const result = projectFire(validation.values, start);
    const downsideReturn = Math.max(-50, validation.values.annualReturn - 2);
    return {...result, valid:true, inputs:validation.values, referenceDate:start, horizonYears:60,
      savingRatePercent:validation.values.monthlyContribution / (validation.values.monthlyContribution + validation.values.monthlySpending) * 100,
      downside:{annualReturn:downsideReturn, ...projectFire(validation.values, start, downsideReturn)},
      assumption:'Amounts are in today’s purchasing power. Contributions keep pace with inflation; returns compound monthly. Taxes, fees and market volatility are not modelled. The withdrawal rate is a user assumption, not a safe-return guarantee.'};
  }

  function nextRenewal(rule, referenceDate) {
    if (!rule || rule.enabled === false) return null;
    const anchor = cleanDate(rule.anchorDate || rule.nextDate);
    const ref = cleanDate(referenceDate);
    if (!anchor || !ref) return null;
    if (rule.cadence === 'trial') return anchor;
    if (!['monthly', 'annual'].includes(rule.cadence)) return null;
    if (anchor >= ref) return anchor;
    const months = (Number(ref.slice(0, 4)) - Number(anchor.slice(0, 4))) * 12 + Number(ref.slice(5, 7)) - Number(anchor.slice(5, 7));
    let offset = rule.cadence === 'annual' ? Math.max(0, Math.floor(months / 12) * 12) : Math.max(0, months);
    let candidate = addMonthsClamped(anchor, offset);
    if (candidate < ref) { offset += rule.cadence === 'annual' ? 12 : 1; candidate = addMonthsClamped(anchor, offset); }
    return candidate;
  }

  function validateRenewal(input, options = {}) {
    const name = text(input?.name, 80), amount = Number(input?.amount), cadence = input?.cadence;
    const anchorDate = cleanDate(input?.anchorDate || input?.nextDate), currency = text(input?.currency || options.currency || 'EUR', 3).toUpperCase();
    if (!name) return {valid:false, reason:'name'};
    if (!['annual', 'monthly', 'trial'].includes(cadence)) return {valid:false, reason:'cadence'};
    if (!anchorDate) return {valid:false, reason:'date'};
    if (input?.amount === '' || !Number.isFinite(amount) || amount < 0 || amount > 10000000) return {valid:false, reason:'amount'};
    if (!/^[A-Z]{3}$/.test(currency)) return {valid:false, reason:'currency'};
    const knownPrevious=input.previousAmount!==null&&input.previousAmount!==undefined&&input.previousAmount!==''&&Number.isFinite(Number(input.previousAmount))&&Number(input.previousAmount)>=0;
    return {valid:true, value:{name, amount:cents(amount) / 100, currency, cadence, anchorDate, enabled:input.enabled !== false, previousAmount:knownPrevious ? cents(input.previousAmount) / 100 : null}};
  }

  function saveRenewal(profile, input, options = {}) {
    const id = profileId(profile, options);
    if (!profile || (profile.profileId && profile.profileId !== id) || (input?.profileId && input.profileId !== id)) return {valid:false, reason:'profile'};
    const validation = validateRenewal(input, options);
    if (!validation.valid) return validation;
    const value = validation.value, existing = list(profile.enterprise?.renewals);
    const requestedId = text(input.id, 100);
    const duplicate = existing.find(rule => scoped(rule, id) && normalizeName(rule.name) === normalizeName(value.name) && rule.currency === value.currency && rule.cadence === value.cadence && rule.id !== requestedId);
    if (duplicate) return {valid:false, reason:'duplicate', rule:duplicate};
    const prior = requestedId ? existing.find(rule => rule.id === requestedId && scoped(rule, id)) : null;
    const generated = `renewal-${id}-${Core.stableTransactionHash([value.name, value.currency, value.cadence, value.anchorDate])}`;
    const rule = {...value, profileId:id, id:prior?.id || generated};
    profile.enterprise ||= {};
    profile.enterprise.renewals = prior ? existing.map(item => item === prior ? rule : item) : [...existing, rule];
    return {valid:true, rule, created:!prior};
  }

  function renewalSchedule(profile, options = {}) {
    const id = profileId(profile, options);
    if (profile?.profileId && profile.profileId !== id) return [];
    let ref;
    try { ref = reference(options); } catch { return []; }
    const seen = new Set();
    return list(profile?.enterprise?.renewals).filter(rule => scoped(rule, id) && rule.enabled !== false).flatMap(rule => {
      if (!validateRenewal(rule).valid || !rule.id || seen.has(rule.id)) return [];
      seen.add(rule.id);
      const date = nextRenewal(rule, ref);
      if (!date) return [];
      const daysUntil = dayNumber(date) - dayNumber(ref), reminderKey = `${id}:${rule.id}:${date}`, amountCents = cents(rule.amount);
      const previousCents = rule.previousAmount === null || rule.previousAmount === undefined ? amountCents : cents(rule.previousAmount);
      return [{...rule, amountCents, nextDate:date, daysUntil, reminderDate:addDays(date, -3), reminderKey,
        due:daysUntil >= 0 && daysUntil <= 3, expired:rule.cadence === 'trial' && daysUntil < 0,
        dismissed:Boolean(profile.enterprise?.renewalDismissals?.[reminderKey]),
        priceHike:amountCents > previousCents, increaseCents:Math.max(0, amountCents - previousCents)}];
    }).sort((a, b) => a.nextDate.localeCompare(b.nextDate) || a.name.localeCompare(b.name));
  }

  function dueReminders(profile, options = {}) { return renewalSchedule(profile, options).filter(rule => (rule.due || rule.expired) && !rule.dismissed); }
  function dismissReminder(profile, key, options = {}) {
    const reminder = renewalSchedule(profile, options).find(item => item.reminderKey === key);
    if (!reminder) return false;
    profile.enterprise ||= {}; profile.enterprise.renewalDismissals ||= {};
    profile.enterprise.renewalDismissals[key] = reference(options);
    return true;
  }

  function detectAnnualRenewals(profile, options = {}) {
    const id = profileId(profile, options), groups = new Map(), identities = new Set();
    if (profile?.profileId && profile.profileId !== id) return [];
    let ref;
    try { ref = reference(options); } catch { return []; }
    list(profile?.transactions).filter(tx => scoped(tx, id) && tx.type !== 'income' && Core.isTransactionEffective(tx, ref)).forEach(tx => {
      const identity = tx.importHash || tx.bankTransactionId || tx.id;
      if (!identity || identities.has(identity)) return;
      identities.add(identity);
      const name = text(tx.merchantName || tx.title || tx.name, 80), key = normalizeName(name), date = cleanDate(tx.date);
      if (!key || !date || !Number.isFinite(Number(tx.amount)) || Number(tx.amount) <= 0 || Number(tx.amount) > 10000000 || dayNumber(ref) - dayNumber(date) > 1100) return;
      const currency = text(tx.currency || options.currency || 'EUR', 3).toUpperCase(), groupKey = `${key}|${currency}`;
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey).push({name, date, amount:Number(tx.amount), currency});
    });
    const result = [];
    groups.forEach(rows => {
      rows.sort((a, b) => a.date.localeCompare(b.date));
      if (rows.length < 2) return;
      const recent = rows.at(-1), previous = rows.at(-2), gap = dayNumber(recent.date) - dayNumber(previous.date);
      if (gap < 350 || gap > 380 || recent.date.slice(5, 7) !== previous.date.slice(5, 7)) return;
      if (list(profile.enterprise?.renewals).some(rule => scoped(rule, id) && normalizeName(rule.name) === normalizeName(recent.name) && rule.currency === recent.currency)) return;
      result.push({profileId:id, name:recent.name, amount:recent.amount, previousAmount:previous.amount, currency:recent.currency, cadence:'annual', anchorDate:recent.date, inferred:true});
    });
    return result;
  }

  const icsEscape = value => String(value ?? '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
  function foldIcs(line) {
    const encoder = new TextEncoder();
    let result = '', segment = '', size = 0;
    for (const char of line) {
      const bytes = encoder.encode(char).length;
      if (size + bytes > 75) { result += `${segment}\r\n`; segment = ' '; size = 1; }
      segment += char; size += bytes;
    }
    return result + segment;
  }
  function buildRenewalCalendar(profile, options = {}) {
    const id = profileId(profile, options), ref = reference(options);
    const events = renewalSchedule(profile, {...options, referenceDate:ref}).filter(rule => !options.ruleId || rule.id === options.ruleId).filter(rule => !rule.expired);
    const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
    if (!Number.isFinite(now.getTime())) throw new TypeError('INVALID_DATE');
    const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MER//Obnove pretplata//HR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    events.forEach(rule => {
      const eventId = Core.stableTransactionHash([id, rule.id]);
      const title = `${rule.cadence === 'trial' ? 'Istek probnog razdoblja' : 'Obnova pretplate'}: ${rule.name}`;
      lines.push('BEGIN:VEVENT', `UID:${eventId}@mer-moj-novac`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${rule.nextDate.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${addDays(rule.nextDate, 1).replace(/-/g, '')}`,
        `SUMMARY:${icsEscape(title)}`, `DESCRIPTION:${icsEscape(`${rule.name} · ${rule.amount.toFixed(2)} ${rule.currency}. Provjerite obnovu ili otkažite prije naplate. Profil: ${id}.`)}`);
      const anchor = rule.anchorDate || rule.nextDate, anchorDay = Number(anchor.slice(8, 10));
      if (rule.cadence === 'annual') lines.push(anchor.slice(5) === '02-29' ? 'RRULE:FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=-1' : `RRULE:FREQ=YEARLY;BYMONTH=${Number(anchor.slice(5, 7))};BYMONTHDAY=${anchorDay}`);
      if (rule.cadence === 'monthly') lines.push(anchorDay >= 29 ? `RRULE:FREQ=MONTHLY;BYMONTHDAY=${Array.from({length:anchorDay - 27}, (_, index) => 28 + index).join(',')};BYSETPOS=-1` : `RRULE:FREQ=MONTHLY;BYMONTHDAY=${anchorDay}`);
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER;RELATED=START:-P3D', `DESCRIPTION:${icsEscape(`Provjerite pretplatu: ${rule.name}`)}`, 'END:VALARM', 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return {content:lines.map(foldIcs).join('\r\n') + '\r\n', filename:`Pretplate_Podsjetnici_${id === 'business' ? 'Poslovni' : 'Osobni'}_${ref}.ics`, count:events.length};
  }
  return Object.freeze({today, addMonthsClamped, validateFire, calculateFire, validateRenewal, nextRenewal, saveRenewal, renewalSchedule, dueReminders, dismissReminder, detectAnnualRenewals, buildRenewalCalendar});
});
