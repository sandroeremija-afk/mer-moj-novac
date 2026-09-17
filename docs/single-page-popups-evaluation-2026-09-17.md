# Single-page popup evaluation — 2026-09-17

## Scope

- Command palette: four immediate shortcuts, normalized live search, module-name aliases, keyboard navigation, bounded visible results with a refine-search hint.
- Calculator opens and clears to zero. ZABA and Erste are explicitly labelled **demo providers**, not live PSD2 connections.
- Dashboard Details is one category distribution report using canonical active-profile monthly totals. Top five categories plus the remainder preserve the complete expense total.
- Cash flow has two visible blocks; calculation, strategy, savings history and Insights reports no longer have secondary tabs/pages. Long AI answers and unbounded record lists retain their existing appropriate controls.
- General and Personal settings are flat. Security shows four actions together; sensitive forms open focused dialogs with Back navigation and preserved drafts.
- Receipt intake keeps the privacy/consent explanation below file and camera controls. FAQ shows all three questions in each selected module without pagination.
- Seven-step tour includes Settings and Help; mobile tour presentation restores normal content on completion.

## Cycle 1 — logic, actions and state

- `npm run test:cycle1`: all 73 evaluation files passed.
- Full combined Node suite: 755 tests passed, zero failures.
- New runtime checks exercise monthly totals with actual Core/StateStore, profile switching, cents-preserving category aggregation, empty and large amounts, safe category text, cold-start rendering with removed legacy IDs, search defaults/filtering/keyboard/privacy guards, both new demo bank ledgers, and calculator lifecycle.
- Seven-step production tour tests cover Settings/Help auto-open, context highlights, backward navigation, cleanup and saved completion.
- Browser cold-start found obsolete chart/goal node writes; removed these and added regression coverage. No later runtime errors were observed during the walkthrough.

## Cycle 2 — browser layout and build

- `npm run test:cycle2`: all 79 evaluation files passed.
- `npm run lint`: 67 scripts, 493 unique IDs, local assets and modal labels passed.
- `npm run build`: successful minified production output.
- Browser walkthrough used 375×667, 1366×768 and 1440×900, including light and dark settings.
- Verified default command shortcuts, live filtering and routing, calculator zero, all four bank choices, receipt initial view, historical export selector, FAQ, settings, Escape/Back and the seven-step tour.
- Measured mobile modal content height equals visible height after refinements: strategy 641px, history 574px, category report 644px, savings-rate report 644px, category-ranking report 605px, calculation 502px, receipt intake 521px, and export 645px. General, Personal and Security fit without an inner scroll container.
- Laptop reports were similarly checked: Overview Details 583px, calculation 462px, cash flow 604px, strategy 689px and savings history 575px. No horizontal modal overflow was measured.
- Chat message-stream scrolling is unchanged. No live bank credentials, passwords or financial records were submitted during browser QA.

## Boundaries

These checks cover standard viewport sizes and representative demo data, not every possible browser zoom level or arbitrarily long custom text. ZABA/Erste use synthetic transactions; connecting a real institution still requires a configured Open Banking provider. Existing local authentication limitations remain disclosed in the Security tab.
