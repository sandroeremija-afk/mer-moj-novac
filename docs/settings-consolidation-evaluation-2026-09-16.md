# Settings consolidation and export refinement

## Scope

- Use “Prethodni mjeseci” for export period and month selection. Offer only earlier months containing records in the selected profile/context; current-month export remains separate.
- Restore the budget category list without pagination or view-toggle controls. Keep its existing bounded list container for large category sets.
- Consolidate personal fields, data download, local-account deletion and demo reset in Podaci. Reuse existing controls and event handlers.
- Combine password and 2FA in one security card. Keep device protection and local sessions as separate topic choices. On narrow screens switch between password and 2FA within that same card without replacing form nodes.
- Preserve General command/tour deep links and Personal/Security target routing.

## Evaluation cycle 1 — behavior and data integrity

- Full test runner passes all 147 evaluation files.
- Export tests cover previous-month choices, current-only/empty history, current-month rollover, timezone boundaries, savings contexts, profile isolation and generated PDF data.
- Budget rendering tests exercise more than 17 categories, additions, edits, deletions and profile switching without pagination state.
- Settings tests execute the actual layout module with an event-capable DOM, verify control identity and handlers after reparenting, preserve drafts and MFA enrollment during navigation, and test General/Personal/Security deep links.
- A General deep-link regression found during independent review was fixed and regression-tested before release.

## Evaluation cycle 2 — browser layout and build

- Local production build tested through the in-app browser at 1366×768, 1440×900 and 375×812 using an isolated demo origin.
- Verified visible “Prethodni mjeseci” labels and month choices (August through March for the demo data), with no current month duplicated in the historical list.
- Verified budget list contains all seven demo categories and no Stranice/Prikaži sve controls.
- Verified General, Personal, combined Password/2FA, Device, Sessions and Rules content. Existing excessive label margins were removed and desktop password fields arranged in two columns.
- Full rules page uses three records and a compact inline builder. Empty rules and adding a fourth rule were checked through the UI.
- Standard laptop Settings panes fit without vertical scrolling. At mobile widths/zoom or unusually tall dynamic security states, a single themed body scroll fallback keeps controls reachable; the footer stays separate. No horizontal root overflow on mobile.
- Mobile Password/2FA switches work without discarding their form content. Escape closes Settings cleanly.
- Lint and minified production build pass. No credentials or API settings changed and no production financial data was edited.

## Preserved limits

Authentication, MFA and local-session capabilities remain the existing local/demo adapters. This UI consolidation does not convert them into a server-side identity service. Permanent-delete and credential-change actions were tested via isolated logic/DOM fixtures, not executed against user data.
