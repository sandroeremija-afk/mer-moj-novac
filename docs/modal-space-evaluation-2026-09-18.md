# Popup space refinement — 18 September 2026

## Scope

- Static forms and reports use intrinsic physical **and logical** height, instead of stretching native dialogs between opposing insets.
- Cash-flow, net-worth and income/expense plots receive the remaining bounded dialog space. Categorical reports shrink around their content.
- Savings strategy uses content-sized grid rows, proportional spacing and an accessible bottom-left footer.
- Settings, export/transfer and receipt forms retain their existing controls, handlers and profile context. FAQ sizing is separate from the intentionally scrollable AI message stream. Hosted onboarding dialogs are excluded.
- No financial formulas, persisted records, credentials or API configuration changed.

## Evaluation cycle 1 — modal layouts and interactions

Browser walkthrough using local production preview, demo data:

- Cash flow: axes, callout values and interactive points visible; plot height responds to the available space (455px laptop, 479px tablet, 321px mobile).
- Budget calculation: itemized amounts and bottom-left Close remain visible.
- Savings strategy: desktop height reduced from 810px to about 684px; content no longer spreads into orphan gaps. Mobile strategy was additionally corrected after finding a 22px body overflow.
- Savings history: period totals, monthly breakdown and footer fit without internal overflow.
- Insights: opened all seven detail reports. Initial categorical footer gap was caught and corrected with intrinsic logical height, rather than concealing it. Plot reports retain their bounded fill layout.
- Export: period/format, summary and footer fit; no download performed during layout checks.
- Settings: General, Data, Security and Rules verified. Existing security subflows and persistence remain unchanged.
- Receipt scanner: upload and manual review layouts verified without sending an image or requesting camera permission.
- Additional smoke checks: connected banks, payments hub, scheduled payments, subscriptions, transaction form and its sentence-entry view, Help/FAQ.

## Evaluation cycle 2 — responsive and regression checks

Tested desktop/laptop 1440×900 and 1366×768, tablet 768×1024 and phone 375×667. Inspected dialog/body scroll dimensions, footer bounds and screenshots. Requested modal families retained visible content and footer controls, with no internal scroll overflow in checked states. These checks do not assert unlimited content or arbitrary browser zoom fits on one page; existing paginated lists and chat behavior are preserved.

- `npm run lint` — passed (71 scripts, 495 unique IDs).
- `npm run test:cycle1` — passed, 79 evaluation files.
- `npm run test:cycle2` — passed, 88 evaluation files.
- Full in-process Node suite — passed, 877 tests, including focus preservation during cash-flow chart resizing.
- `npm run build` — passed; production JS/HTML/core-CSS output 1,125,043 bytes (22% minification reduction).
- Browser console — no warnings or errors in the local walkthrough.

Native dialog animations can produce transient fractional/translated measurements immediately after opening; final visual inspection was used alongside DOM measurements. The AI API and real banking services were not called: this change concerns layout, not those integrations.
