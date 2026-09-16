# Quick tools, exports and settings refinement

## Scope

- Added the Lucide calculator between global search and notifications using the existing vanilla-JavaScript architecture. Arithmetic uses a bounded parser, never executable expressions.
- Removed the scenario view from cash flow. Added date/amount tooltips, touch point selection and keyboard navigation.
- Enlarged safe-to-spend and deposit-list amounts; removed the requested explanatory paragraph.
- Added eight-category pagination and Show all mode without changing category totals or financial state.
- Replaced manually entered export months with localized, newest-first months derived from the active profile's valid historical records. Savings uses deposit history; other contexts use their transaction history. Existing CSV/PDF/JSON report calculation and date cutoffs remain authoritative.
- Added optional user-owned first name, last name, OIB and address fields; exposed security topics as radio cards; added five-rule pagination within one bounded settings scroll surface.
- Corrected receipt input cancellation: an input's bubbling cancel event no longer dismisses the parent dialog. Actual dialog cancellation still closes it.

## Evaluation cycle 1: logic and interactions

- Arithmetic precedence, localized decimals, invalid/executable expressions, division by zero and size bounds.
- Seventeen budget categories render as 8 / 8 / 1, support Show all, clamp after deletion and reset view state on profile/user change.
- Historical-month detection, malformed/future dates, empty history, selected-month refresh, profile separation and contextual exports.
- Personal-data schema validation, owner isolation, persistence, discarded drafts, security topic selection and rule pagination.
- Receipt cancellation handlers preserve an existing image and consent; retry, native-camera fallback, pending camera cleanup and true Escape dismissal covered.

## Evaluation cycle 2: browser and regressions

Local browser review at 1280 x 720, 1366 x 768, 1440 x 900 and 375 x 812; light and dark themes:

- Header ordering and calculator calculation `125,50 + 20 * 2 = 165,5` confirmed.
- Cash-flow selection displays the exact date, amount and expected events; arrow navigation updates the selected day. Tooltip remains visible during inspector-height changes.
- Budget Pages / Show all toggle, native historical-month dropdown and August CSV download confirmed.
- Personal-data fields and all five visible security options confirmed. Mobile settings have no horizontal overflow, one scroll owner and an accessible footer/save action.
- Deposit titles render at 16px, metadata at 13px and amounts at 18px.
- Browser console produced no warning/error entries during the checks.

Two issues found during evaluation were fixed and regression-tested: chart rebuilding on height-only resize dismissed tooltips; keyboard focus on SVG nodes did not reliably deliver focusin in the browser. The final audit also added calculator clearing/closure on session expiry, revocation, MFA or app locking.

## Final automated results

- `npm test`: all 146 evaluation files passed.
- `npm run lint`: passed; 60 scripts and 508 unique HTML IDs.
- `npm run build`: passed with minification and content-hashed assets.
- `git diff --check`: passed.

## Explicit limitations

The native Windows file picker's Cancel button cannot be automated with the available browser interface. Its bubbling cancel event and application handlers were covered by behavioral regression tests; no physical camera or OS-dialog test is claimed.

Personal-data fields are optional local profile data, not verified KYC. OIB validation checks the eleven-digit input format only. The UI identifies whether local storage is encrypted and directs users to enable the existing private vault before entering sensitive data. No API keys, personal identifiers or live financial records were used in these evaluations.
