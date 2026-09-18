# Budget calculation, distinct Insights and security onboarding

## Scope and financial integrity

- Replaced the calculation modal with five itemized rows. The existing FinancialEngine remains authoritative: recorded monthly income minus planned bills, savings allocation, safety reserve and recorded expenses. The reserve and already-spent adjustments stay visible inside the remaining-budget row; the daily value uses the same exact calendar divisor as the dashboard.
- The three top Insights metrics now open interactive, timeframe-aware charts. Net shows cumulative tracked cash, including an opening node; income and expenses show period bars. Exact dates, two-decimal amounts and previous-interval percentage changes are accessible by pointer, touch and keyboard. A zero comparison baseline is explicitly marked unavailable.
- Fixed/flexible expense classification replaces the duplicate category ranking. Explicit transaction/category classification takes priority, followed by recurring commitments and known fixed categories/merchants. Unknown expenses default to flexible. Refund corrections retain their signed amounts; proportions stay bounded. Longer category breakdowns aggregate the remainder without dropping its amount.
- Cumulative tracked cash is not comprehensive net worth: unrecorded assets and liabilities are excluded. Savings transfers do not reduce tracked wealth. The modal explains this distinction.
- Tour steps 6–8 open device protection, privacy and personal data. They do not enable auto-lock, configure a PIN or modify personal information. Existing first five steps remain intact.

## Evaluation cycle 1 — calculations and interaction

- `npm run test:cycle1`: 74 evaluation files passed.
- New pure math tests cover signed cents, classification precedence, profile isolation, edits, future/draft exclusion, calendar buckets, opening balances, growth percentages and negative balances.
- Runtime UI tests execute real render functions and pointer/range handlers, verify exact readouts, empty/large amounts, safe custom-category text and reactive Personal/Business changes.
- Browser 1366×768: five-row calculation has 572px client/scroll height and no horizontal overflow. Daily amount matches dashboard (1080 / 13 = 83.08 EUR).
- Browser charts: keyboard selection gives income 3500 EUR on September 1 and expense 200 EUR on September 2. Mobile pointer scrub gives September 8, 9180 EUR, −1.08% from the preceding interval.
- Personal cumulative closing balance 9080 EUR vs Business 20000 EUR; state switches independently.

## Evaluation cycle 2 — responsive layouts and guide

- `npm run test:cycle2`: 80 evaluation files passed.
- Full suite: 787 tests passed, zero failed.
- `npm run lint`: 69 scripts, 494 unique IDs, assets and modal labels verified.
- `npm run build`: passed; JavaScript output 1,108,190 bytes, 21.7% smaller than source.
- Browser 375×667: calculation 518px client/scroll height; final net modal 611px client/scroll height; fixed/flexible detail 614px client/scroll height. No horizontal overflow in those dialogs.
- Found and fixed an inherited SVG height rule that pushed the footer below the laptop viewport; final chart height is explicitly bounded. Reduced mobile chart height and adjusted metric typography after a 5px overflow was found.
- Mobile tour steps 6–8 verified visually. Security and privacy toggles remained off. Personal fields and action buttons remained accessible. Completion leaves zero open dialogs and clears tour state.
- Keyboard/Back/Escape, rapid native-dialog transitions, draft preservation and explicit PIN-flow handoff covered by lifecycle tests.
- Update prompts are deferred visually while the guide is active, so they cannot cover Next/Skip controls.
- Browser console error scan: no errors during the checked flows.

## Non-goals

No live bank operations, credential changes, personal-data submissions or AI requests were performed. Existing financial formulas, stored transactions and security defaults were preserved.
