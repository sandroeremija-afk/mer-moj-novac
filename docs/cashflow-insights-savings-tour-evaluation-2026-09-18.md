# Cash flow, Insights, Savings and Help tour refinement

## Scope

- Cash flow keeps the chart-first popup and bottom-left close action. Visible monetary/date axes and peak, lowest and calendar-month-end badges now accompany matching chart markers. Exact values remain available by hover, tap or keyboard; privacy mode masks amounts.
- Insights uses one desktop filter/action row and a bounded chart row, with readable wrapping captions, protected bottom padding and an upper height bound for large displays. Mobile cards retain intrinsic height rather than cropped card bodies.
- Removed the micro-savings visualizer, its asset hooks and unused projection helper. Original active goal/recommendation/history/vault layout is restored. Existing saved roundups (including EUR 2), deposits and per-profile financial data remain intact.
- Tour step 9 opens the real Help modal in assistant mode. The spotlight shows its real input and suggested questions. Mobile suggestions remain visible; closing/finishing and rapid Back/Next cleanly reset the hosted modal.

## Evaluation cycle 1: calculations and card layout

- `npm run lint`: passed; 71 scripts, 495 unique IDs.
- `npm run test:cycle1`: all 79 evaluation files passed.
- Forecast tests cover calendar month-end (including leap years/year transitions), peak/minimum selection, negative balances, privacy and profile/currency isolation.
- Savings regression tests verify visualizer removal and saved rule/deposit preservation through reload, edits, pause/resume and pending-transaction reconciliation.
- Browser: cash flow axes, all three labeled values and keyboard point inspection verified. Desktop/modal amounts change with the active Personal/Business profile.
- Reproduced pre-fix Insights clipping at 1366x700: cards extended to y=732 while the view ended at y=680. After repair cards end at y=676 and captions remain inside their padding.

## Evaluation cycle 2: responsive behavior and tour lifecycle

- `npm run test:cycle2`: all 85 evaluation files passed.
- Complete suite: 864 tests passed, 0 failed.
- Browser checks at 1366x700, 1366x768, 1440x900 and 1920x1080: Insights card contents fit; no desktop outer overflow. Personal and Business metrics stay isolated. Light/dark borders and text checked.
- Savings at 1366x768: top cards share the same bottom edge (y=371), lower cards finish at y=740; no card overflow. Mobile 375px layout has no horizontal overflow or micro-savings widget.
- Cash flow at 375x812: three compact date ticks, complete value badges, chart and accessible close footer; no modal overflow.
- Tour walked through all nine steps on desktop and mobile. Step 9 opens Help with assistant selected, three sample prompts and real input. At 375x812 and 375x667 the tooltip and Help content fit separately; empty input has equal client/scroll height (64px). Finish closes hosted dialogs and restores interaction.
- Browser console: no warnings/errors observed.
- `npm run build`: minified production assets generated successfully. No secrets or user transactions changed for this task.

## Delivery

Push the verified commit to `origin/main`; confirm Vercel success and that production `build-report.json` matches the local build ID. Removed source files are recoverable from Git history.
