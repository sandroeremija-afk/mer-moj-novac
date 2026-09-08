# Circular amounts and planning dialogs — 2026-09-08

## Scope and safeguards

Preserved the existing MER visual system, vanilla JavaScript architecture, reactive store, profile boundaries and financial formulas. Used accessible native-dialog patterns from the UI guidance without a framework or typography migration. Browser checks used an isolated local demo at port 4193; no production transactions or account data were changed.

## Cycle 1 — calculation display and navigation

- Measured circular text fitting responds to amount, font and ring size changes without truncating digits. Unit cases include signed values, extreme string lengths and observer cleanup.
- Entered a local test income of 286,420 EUR through the real form, resulting in **12.500,00 EUR per day**. Settled measured font sizes: 16.7499px at 1440x900 (142px ring), 11.4699px at 1366x768 (110px ring), and 10.8494px at 375x812 (102px ring). Full amounts remained within the inner ring.
- Browser-verified independent FIRE and renewal dialogs, receipt scanner, household and business Tax Vault. Back returns to Plan ahead; direct-entry Back closes the tool. Context guards reject returns after profile changes, locking or logout.
- FIRE's unsaved monthly contribution remained 600 after Back/reopen, without saving or changing balances. Automated cases cover reactive projections, profile-isolated drafts, saved assumptions, reminders and stable renewal editor inputs.
- Personal stress input did not change the Business daily amount (97.83 EUR) or balance (8,000 EUR).

## Cycle 2 — responsive and keyboard audit

- Walked Overview, Budgets, Savings, Activity, Insights and Settings at 1440px and 375px. Desktop document stayed 1440x900; mobile had no horizontal document overflow. Tall mobile views retain natural page flow; tall dialogs have bounded internal bodies and accessible footers.
- Light and dark themes inspected. Mobile FIRE, renewal, receipt and Settings dialog widths stayed within the viewport. FIRE and renewal dialog scrollWidth equaled clientWidth (357px).
- Fixed a measured mobile goal-card overflow: the 28px edit-button column now reserves the actual 44px touch target. Recheck: card clientWidth/scrollWidth both 297px; button right edge 318px, inside card right edge 328px.
- Found native Shift+Tab could leave a dynamically-created dialog. Added delegated focus wrapping for all open dialogs. Browser recheck: first Back + Shift+Tab focuses Save; Save + Tab focuses Back; focus remains inside. Wizard capture-phase keyboard ownership is preserved by behavioral tests.
- Verified Escape closure and Back navigation in browser. Automated pointer tests cover backdrop clicks, text-selection drags, primary/nonprimary touch, cancellation and cleanup.
- Unified receipt, invoice and global-search monetary formatting with the shared formatter; forecast tick labels retain two decimals and reserve more axis space. Zero and whole category-budget exceptions tested across HR/EN and EUR/USD/GBP/CHF/JPY/KWD/BHD.
- Fixed focus restoration when household/receipt views replace their DOM and assessment navigation hides the focused action. Invoice mobile table headings may wrap instead of overlapping.
- Browser console: no errors during the completed local walkthrough.

## Build and regression evidence

- `npm run lint`: 43 scripts, 491 unique static IDs, local assets and modal labels verified.
- `npm test`: all 109 evaluation files pass. New suites cover measured circle fitting, independent planning dialogs and 15 currency/navigation/keyboard/pointer regressions.
- `npm run build`: production minification and exact-hash offline asset packaging pass; approximately 944 kB total emitted build.
- The obsolete receipt VM fixture was updated to load the same real MerCore dependency as production.

## Deliberately unchanged

This is a UI/navigation release, not a new financial-engine or provider-integration release. Existing half-cent intermediate rounding in `core.roundMoney` was not changed; entered integer-cent amounts are covered by regression tests. No real bank or Gemini credentials were transmitted during this evaluation. Native PDF/XML legal validation and remote-account security were not re-certified by these UI checks.
