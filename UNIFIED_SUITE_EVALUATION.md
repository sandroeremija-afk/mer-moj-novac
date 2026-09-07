# Unified suite evaluation — 7 September 2026

## Delivered

- Croatian month genitives for the safe-to-spend card, aligned metrics and a distinct sparkle icon for planning.
- Live, active-profile command search across transactions (including scheduled entries), budget and income categories, savings goals, and settings/export actions. Keyboard selection and direct entity dialogs; stealth mode masks result amounts.
- Responsive cash-flow axes, weekly labels, currency ticks, cyan area fill and pointer/focus/touch event inspection. Projected income is a visualization layer and never contributes to posted balances or the conservative safe-to-spend figure.
- Consented Gemini receipt OCR, editable line-item review, amount/date/vendor matching, duplicate-safe attachment and read-only saved receipts. Images are not persisted with financial records.
- Inflation-aware FIRE scenarios, renewal schedules and calendar reminders, and a separate local household ledger with permission previews.
- Existing B2B VAT reserve revalidated against edits and profile switches: VAT-inclusive gross payment × 25/125. No transfer or tax filing occurs.

## Cycle 1 — state and feature integrity

Automated regression tests cover all twelve month names, accent-insensitive full-text search, profile exclusion, future-income isolation, extreme chart domains, receipt normalization/matching/deduplication, asynchronous profile guards, FIRE assumptions, renewal dates and dismissal, and household permissions and exact-cent splits.

The receipt handler was tested against the live Gemini service with a generated synthetic image only: merchant MER TEST TRGOVINA, 2026-09-07, total 1,250 cents, and two lines of 450 and 800 cents. The first live run revealed unsupported upstream schema constraints; the request schema was corrected while strict local validation was retained.

## Cycle 2 — actual browser walkthrough

The built app was opened in an isolated local browser origin. Verified cold-load login, absence of console errors, September genitive, settings deep-links for Password and Language, category search opening the exact budget editor, and cash-flow event inspection. FIRE input changes altered the scenario but left available balance at EUR 2,840. Creating a renewal three days ahead increased the notification count; reviewing it decreased the count. A local household/member was created; viewer preview removed editing actions without changing the personal balance.

At 375 × 812, household and receipt dialogs stayed inside 90dvh, retained reachable footers, and had no horizontal page overflow. At 1366 × 768, the dashboard remained fixed with no outer scrollbar; the safe-to-spend amounts and forecast box aligned correctly in dark mode. The chart was inspected in both themes with responsive axes and interactive event details.

Visual findings fixed and retested: inherited SVG strokes caused unwanted circles and heavy labels; range controls snapped initial exact FIRE inputs; a new annual subscription incorrectly appeared as a price increase from an unknown prior price. Regressions cover these repairs.

## Explicit production boundaries

- Shared households are **local bookkeeping and unsaved permission previews**, not remote partner accounts, invitations or real-time multi-user synchronization. Real collaboration still requires server identity, membership authorization, durable storage and conflict resolution. See `docs/household-spaces.md`.
- FIRE dates are estimates under editable assumptions, not promised retirement dates or personalized investment advice. See `PLANNING_READINESS.md` and its primary sources.
- Renewal reminders appear in-app. For delivery while the app is closed, the user must import the generated ICS into a calendar and enable notifications. This does not silently connect or modify their calendar.
- OCR sends only the explicitly approved receipt image to the configured Gemini endpoint. Physical phone camera hardware was not available in the browser test; the camera input uses the standard capture=file flow. See `RECEIPT_READINESS.md`.
- Forecasts exclude currency conversion; unsupported-currency transactions are explicitly excluded from the active-currency model.

Build and full regression results are checked again immediately before the release commit. No API keys, private screenshots or test browser data are committed.
