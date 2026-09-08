# Header restoration and contextual exports

Date: 2026-09-08

## Scope

- Removed the toolbar overflow implementation and restored individual actions in all five module headers. Privacy and auto-lock remain opt-in Settings preferences.
- Activity has one Import / Export entry, with a separate import/review route and an export-selection dialog.
- Budget, Savings, Insights and Activity exports require an explicit timeframe, format and Download confirmation. Insights initializes from its active timeframe.
- CSV, JSON and native text PDF use one profile-scoped report model. PDF embeds a licensed Croatian-capable font locally; no financial data is sent to a PDF service.
- Settings native checkboxes retain their state and accessibility with white squares and dark checkmarks in both themes.

## Evaluation cycle 1: routing and data integrity

Passed 23 export-core tests covering calendar bounds, leap years, exact cents, signed adjustments, malformed data, date-only values, bank timestamps, future and pending entries, offline drafts, currency separation, profile isolation, 520-row volume, formula-safe CSV and contextual filenames.

Passed dialog-handler tests for import/export choices, Back, close, explicit download, live data refresh, preserved month input, error recovery, and cancellation during PDF work on profile/session/revision/selection changes or lock/logout.

Browser verification on an isolated localhost demo confirmed restored header actions, Activity import upload/review entry, export choices and custom August selection. Downloaded JSON contained precisely the two August transactions and the correct Personal profile. Business export contained Business-only annual totals.

## Evaluation cycle 2: visual, files and regression

- Audited all five module headers at 1440 x 900: document scroll bounds remained exactly 1440 x 900 and no More options button appeared.
- Inspected Activity, Budget and Savings workflows at 375 x 812. Export card was 359 px wide, remained inside the viewport, and used one scrolling body with accessible fixed footer. Fixed a mobile currency wrap found during this pass; complete values now remain on one line.
- Verified white Settings squares unchecked and checked in Light/Dark; privacy and auto-lock changes still update the existing reactive preference. Auto-lock was returned to OFF.
- Confirmed Savings CSV, Activity JSON, Budget PDF and Insights JSON downloads through actual UI controls; opening exports alone did not download files.
- Generated a real 520-row PDF (30 pages), checked first/last-page rendering with Poppler, and extracted Croatian glyphs and final record with pypdf. Checked the browser-downloaded Budget PDF for category names and totals.
- Existing Escape, pointer-origin backdrop safeguards, focus traps, wizard behavior, financial math and account isolation regression tests pass. Browser console had no errors during the verified flows.

## Final preflight

`npm run check` passed: 46 scripts, 494 static unique HTML IDs, all 116 evaluation files, and production build. Build minification reported 976,132 application bytes (20.8% reduction; separately copied vendor/font assets are not included in this figure).

Superseded instant-download assertions were replaced with real report and modal-routing tests. The removed overflow component and its obsolete tests remain recoverable in Git history. No production transactions were modified during verification.

Vendor assets: jsPDF 4.2.1 (MIT license in source), DejaVu font (license shipped alongside font). Exported Budget limits explicitly represent current monthly configuration, not unavailable historical budget snapshots. Aggregates exclude other currencies rather than inventing exchange rates.
