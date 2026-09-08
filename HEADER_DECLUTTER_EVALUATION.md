# Header, privacy and opt-in locking evaluation

Date: 2026-09-08. Scope: the existing vanilla JavaScript MER application. No framework, financial formulas, account transactions, brand assets or credentials were replaced.

## Cycle 1 — behavior and state

- New and legacy snapshots without a preference normalize to `autoLockEnabled: false`; only boolean `true` opts in. Existing explicit preferences survive loading.
- Security timer tests simulate more than ten minutes with auto-lock off, the exact ten-minute boundary with it on, disable/re-enable, stale timestamps, activity, visibility and user isolation.
- Manual lock, authentication, encrypted cold-start gates and vault persistence remain enforced independently of inactivity preferences.
- Real browser on isolated localhost demo: no header stealth button; General privacy switch defaults off; switch enables blurring; Ctrl+Shift+H disables blurring and immediately synchronizes the checkbox.
- Security switch defaults off, enables through the reactive store, remains on after reload, and can be turned off again. Production user data was not reset or edited.

## Cycle 2 — accessible menus and responsive layout

- All five module toolbars retain one prominent primary button plus a labelled `Više opcija` menu. Original action nodes, IDs and listeners are preserved.
- Menu tests cover arrows, Home/End, Tab/Escape, outside dismissal, modal guards, focus restoration, profile visibility, translations and viewport bounds.
- Browser walkthrough at 1440×900 and 375×812: all five module toolbars checked; no horizontal document overflow. Desktop root remains exactly viewport height. Buttons are at least 44px high; menu items are 48px or taller.
- Plan ahead, OCR and deposit history open from menus and close correctly. Focus returns to the visible menu trigger, not a hidden action.
- Settings, planning, OCR and deposit-history dialog shells do not scroll in addition to their scrolling bodies. Existing necessary single list/body scroll areas remain accessible.
- Fixed a discovered Settings tab issue: switching tabs now resets the shared body scroll position, so the new security preference is visible immediately on mobile.
- Light desktop/mobile and dark mobile/laptop views visually inspected. Business-only e-invoice action remains in the contextual menu; 1366×768 root stays within viewport.
- Browser console: no JavaScript errors during the walkthrough. Dynamic viewport override reset afterward.

## Release gates

- `npm test`: full regression suite passes.
- `npm run lint`: preflight passes (44 scripts, 492 unique HTML IDs).
- `npm run build`: minified production build succeeds; versioned assets and offline update manifest include the new toolbar files.
- Deployment is performed only after these checks. Public deployment status and delivered UI are checked separately from local results.

The audit uses local demo data for state-changing checks. It does not claim a ten-minute wall-clock browser wait: inactivity boundaries are verified with deterministic simulated-clock security tests.
