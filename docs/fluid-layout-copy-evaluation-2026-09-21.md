# Fluid layout and explanatory copy evaluation — 21 September 2026

## Scope

Proportional desktop sizing and Croatian explanatory copy. Financial engines,
stored records, profile switching, authentication and security algorithms are
unchanged. English remains an explicitly selectable locale; Croatian interface
strings and static HTML fallbacks use consistent Croatian terminology.

## Cycle 1 — layout

Verified the production build in the in-app browser on a disposable local demo
origin. CSS growth is bounded by both viewport width and height; mobile retains
normal outer page flow rather than hiding content to manufacture a fixed screen.

- 1366 × 768: Savings hero 230 px / lower row 346 px; Insights summary 173 px /
  lower row 387 px. No measured horizontal or internal card overflow.
- 1440 × 900: all five main modules checked. Overview summaries 191 px / lower
  cards 517 px; Savings hero 276 px / lower row 426 px; Insights summaries 191 px /
  lower cards 494 px. Page and card overflow deltas were zero.
- 1920 × 1080: Overview summaries increased from the baseline 155 px to 232 px;
  metric typography grows with the card. Light and dark themes inspected.
- 2560 × 1440: summaries approximately 315 px; module and topbar action controls
  reach the bounded 56 px size. Savings hero tops out at 480 px. Content width
  remains bounded at 1920 px.
- A single savings goal fills the available goals row, including a last page
  containing only one visible goal; pagination and hidden records are preserved.
- 375 × 667: Overview and Savings retain natural page flow. Savings strategy,
  history, budget calculation and Settings were checked. History fits at 640 px
  with zero measured overflow; General and Security settings fit with visible
  footers after correcting the short-screen spacing.
- FIRE projection popup at 1024 × 768: 525 px tall, no measured overflow.

## Cycle 2 — explanations and regression

Reviewed source formulas and rendered descriptions for cash flow, budget
protection, savings strategy/history/goals, Insights, FIRE and Settings.

- Budget protection distinguishes recorded income, obligations, planned savings,
  guard reserve, spending already recorded and remaining days including today.
- Cash flow is explicitly a 30-day estimate, not bank balance or a promise.
- Savings coverage explains the obligations denominator; plan contributions are
  not actual deposits or bank transfers. History covers displayed months.
- Insights distinguishes recorded cumulative cash from total wealth, and surplus
  rate from savings deposits. Zero-baseline growth is not presented as 0% growth.
- FIRE copy explains assumptions rather than promising retirement. Percentage
  presentation uses Croatian decimal commas and English decimal points.
- Settings distinguishes visual privacy from encryption, local authentication
  from a production server service, and simulated SMS from delivered SMS.
- Currency help explains that changing the display currency does not convert
  values. The accessible info control was tested with the keyboard.

Static HTML fallbacks were aligned with runtime Croatian translations. Escape
closed the tested dialogs. No browser console errors were captured. No production
financial data, credentials, or security settings were changed during testing.

Final automated results:

- `npm run lint`: passed, 72 scripts / 495 unique IDs.
- `npm run test:cycle1`: all 82 evaluation files passed.
- `npm run test:cycle2`: all 92 evaluation files passed.
- Complete Node test suite: 925 tests passed, 0 failed.
- `npm run build`: passed.

These checks cover the listed dimensions and demo data; they do not assert that
every possible custom dataset, browser zoom level or mobile keyboard state fits
on one screen. Existing accessibility fallbacks remain intact.
