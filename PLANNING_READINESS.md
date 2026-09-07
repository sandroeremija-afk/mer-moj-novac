# FIRE and subscription renewal planning

## Integration

Load `planning-core.js` after `core.js`, and `planning-ui.js` after app globals and `MerEnterpriseBridge` are ready. Load `planning.css` after base styles. Toolbar/command triggers call `MerPlanningUI.open('fire')` or `MerPlanningUI.open('renewals')`.

The UI subscribes to the central reactive store. It only persists active-profile `enterprise.firePlan`, `enterprise.renewals`, and `enterprise.renewalDismissals`. Opening, editing sliders and projecting returns do not create financial transactions or change savings. Profile changes reset the editing context. `MerPlanningUI.reminders()` returns current due/expired items, and `mer:renewal-reminders` is dispatched with `{profileId,count}` whenever the due set changes. Root navigation can use this for a visible reminder badge.

## FIRE assumptions

The simulator uses investable net worth, monthly contributions, monthly retirement spending, nominal annual return, annual withdrawal assumption, and inflation. Default 5% return, 4% withdrawal and 2% inflation are editable illustrations, not a claim about future markets or a recommendation of a safe withdrawal rate.

Real annual return is `(1 + nominal return) / (1 + inflation) - 1`; real monthly compounding is the twelfth root of the annual growth factor. Contributions are expressed in today's purchasing power and assumed to increase with inflation. The target portfolio is annual spending divided by the withdrawal-rate assumption. Monthly balances are rounded to cents. The output is an estimated month, never a guaranteed financial-independence date. No target inside 60 years is reported explicitly. The sensitivity panel reruns the projection with annual return 2 percentage points lower. Taxes, fees, volatility and sequence-of-return risk are not modelled; a constant-return curve cannot establish a retirement plan's probability of success.

Sources checked on 2026-09-07:

- SEC Investor.gov [compound-interest calculator](https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator): initial capital, monthly contributions, estimated interest and compounding are explicit inputs.
- ECB [What is inflation?](https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me-more/html/what_is_inflation.en.html): inflation reduces purchasing power. The simulator uses a user assumption rather than fetching or claiming a current inflation rate.
- SEC Investor.gov [Stocks](https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks): investment returns and values are uncertain; the output is a scenario.

## Subscription safeguards

Users can create, edit or remove monthly, annual and free-trial schedules. Possible annual subscriptions are inferred only after two posted annual charges and require confirmation. Trial-expiry dates are explicit; they cannot reliably be inferred from a bank feed. In-app due reminders appear from three calendar days before renewal through the due date, and unreviewed expired trials remain visible. Reviewing a reminder dismisses one occurrence, not future renewals.

Calendar export follows [RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545) and includes an all-day event, recurring RRULE for annual/monthly renewals, and DISPLAY VALARM three days before the event. Monthly day 29–31 rules clamp to the last valid day; a 29 February annual renewal uses the last day of February. Per-profile stable UIDs support repeated imports without changing event identity. Files use CRLF, escaped text and UTF-8-aware 75-octet folding.

The user must import the `.ics` file into a calendar and enable its notifications to receive alerts while the app is closed. The application does not claim background push delivery, automatic cancellation, or direct access to a calendar service. Updating a subscription requires importing its updated event; deleting an app schedule does not remove an already imported external calendar event.

## Tax treatment

The Business tax explainer reads the existing virtual tax vault. It does not introduce another reserve or transfer. Existing B2B allocation reserves gross × 25/125 when the amount includes 25% VAT: €1,250 gross = €1,000 net + €250 VAT. This avoids incorrectly reserving 25% of the VAT-inclusive gross amount. Tests confirm immediate updates and Personal/Business isolation.

## Verification

`eval-cycle-1-planning-core.test.js` covers exact zero-real-return growth, inflation effects, invalid values, date rollover/leap years, renewal timing, per-occurrence dismissals, inference, isolation and live tax-state changes.

`eval-cycle-2-planning-calendar.test.js` covers calendar alarms, month-end/yearly recurrence, free trials, stable UIDs, expired schedules, UTF-8 folding and text injection protection. Browser visual evaluation remains part of root integration.
