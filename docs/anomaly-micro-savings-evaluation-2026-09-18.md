# Anomaly, micro-savings and chart refinement — evaluation

## Scope and financial semantics

- Removed the dashboard Details trigger; cash flow is now a full-width chart with date/amount tooltips and a bottom-left Close footer.
- Removed top-metric chart range inputs, retaining pointer, touch and arrow/Home/End keyboard inspection directly on the plot.
- Repaired all three lower Insights card bounds and padding.
- Anomalies compare the latest seven calendar days with one quarter of the preceding 28-day category spending. The threshold is inclusive at 30%, calculated before display rounding. No percentage alert is invented for a zero baseline or insufficient ledger history.
- A latest scoped correction supersedes older imported versions before eligibility checks. Pending, cancelled, failed, foreign-currency and other-profile data cannot create false alerts. Explicit app schedules still book on their due dates.
- Mer AI gets at most five sanitized category aggregates and exact comparison windows, not a raw ledger. Its fresh local introduction is visible on opening both chat surfaces; opening does not make a model request. The existing server-only OpenAI integration is unchanged.
- Micro-savings supports EUR 1, 2 and 5 thresholds. Its 12-month estimate uses eligible EUR card purchases from the last 90 days and a user-adjustable monthly frequency. Without card history it explicitly assumes half a step per purchase. This is a projection, not a promised return.
- Opt-in uses the existing profile-bound virtual savings engine. Previous purchases are excluded when enabling the rule; there is no real bank transfer or silent backfill.

## Evaluation cycle 1 — behavior, state and integrity

Passed `npm run test:cycle1` (78 files) and `npm run test:cycle2` (83 files).
After review corrections, the combined isolated-in-process test run passed **855/855** tests.

Coverage includes:

- Exact 30% boundaries, integer-money arithmetic, signed refunds, no history, malformed dates, leap-year windows and timezone midnight.
- Imported-identity corrections: pending/cancelled status, changed currency, future date and invalid amount, including removal of oldest baseline evidence.
- Personal/Business isolation, same transaction identifiers in separate banks, reactive edits and account switches.
- AI aggregate validation on both client and server, malicious labels as inert data, private-mode redaction, fresh context without storing an obsolete warning in chat history.
- EUR 2 rounding, exact multiples, annual estimate recalculation, no retroactive funding, enabling/pausing rules, stale session and profile guards.
- Range-free chart keyboard and pointer interactions, empty/extreme datasets and hidden amounts.

## Evaluation cycle 2 — production-build browser walkthrough

Used a fresh local production preview and disposable demo data, not production financial records.

- 1440x900: three equal-height lower Insights cards, clean borders and no clipped captions.
- 1366x768: lower Insights cards shared bottom y=733.8; root exactly 1366x768. Net chart had no range inputs and Home moved its readout to the opening balance.
- Savings initially had a 16px intrinsic-height spill from the new widget. Fixed its desktop row sizing, padding and gaps, then retested: widget and row bottom y=441.4, lower row y=457.4; widget client/scroll height both 288px.
- EUR 2, one simulated purchase/month: annual estimate 12.00 EUR. Enabling the rule left existing deposits unchanged.
- Switched to Business: toggle OFF, default EUR 1, business goal only. Switching back restored the Personal EUR 2 rule.
- Test-only 1000.20 EUR card expense at EUR 5 rounding: savings updated by 4.80 EUR, dashboard warning appeared immediately, and its button opened Mer AI without being dismissed by outside-click handling.
- 375x812: micro-savings card client/scroll dimensions matched (328x450); threshold controls and white toggle fully accessible. Natural outer mobile scrolling remains as designed; no inner widget scrolling.
- 1920x1080 dark mode: root fixed at 1080px, new widget client/scroll height matched, checkbox fill rgb(255,255,255).
- Privacy shortcut hid the new monetary output and projection graphic.
- Cash flow: chart-only opening, one Close action, touch/arrow-key tooltip dates and amounts. Mobile modal client/scroll height both 478px, no horizontal overflow.
- 414x896 income detail: 517px client/scroll height and no range input.
- 375x812 expense detail: 589px client/scroll height, 341px client/scroll width and no range input.
- 1024px Insights: all three card client/scroll widths and heights matched.
- Escape dismissal and subsequent navigation remained functional. No browser console errors were observed.

## Build / delivery checks

- `npm run lint`: 72 scripts, 495 unique static IDs, local assets and modal labels verified.
- `npm run build`: success, minified output 1,131,175 bytes (22% smaller than source).
- New runtime/CSS assets included in the existing hashed asset and service-worker build pipeline.
- No dependencies, API keys, provider changes or authentication configuration changes introduced.
- No live model request was required for the deterministic anomaly check; server integration is covered with mocked API responses and sanitized payload tests.
