# Zero-scroll layout evaluation — 17 September 2026

## Scope

Shared DOM-preserving pagination and section navigation replace nested list scrolling. Financial calculations, transactions, authentication and profile storage are unchanged. Mobile pages retain their existing natural outer-page flow; the refactor removes internal card/dialog scroll windows. Long AI conversations intentionally retain a styled message-stream scrollbar, not a scrolling parent dialog.

## Cycle 1 — behavior and state

- Lists clamp pages after filtering/deletion, reset for profile changes and preserve access to every item after viewport changes. Normal pages contain four items; tall mobile records use one item.
- Settings, import review, receipts, invoice forms, FIRE and cash-flow panels retain mounted controls and draft values across sub-tabs. Native validation reveals the first invalid field, including its page.
- Runtime DOM tests cover page/filter/profile changes, listener cleanup, language updates, draft preservation, validation and repeated-render mutation stability.
- Browser: Activity next-page and search reset worked; budget categories advanced from four rows to the remaining three; global search paged 23 commands; savings deposits advanced through all nine pages on mobile.
- Live demo AI conversation: message area measured 193px high / 739px content. Scrolling returned to the first message while the parent dialog remained at scrollTop 0, with equal client/scroll heights (645px).

## Cycle 2 — responsive verification and corrections

Browser checks at 375×667, 1366×768 and 1440×900. Representative mobile dialog clientHeight/scrollHeight after fixes:

| View | Pixels |
| --- | --- |
| Settings password | 645 / 645 |
| Settings device/privacy | 545 / 545 |
| Expanded category chart | 611 / 611 |
| Cash flow summary / graph | 466 / 466; 546 / 546 |
| Cash flow bills / AI / methodology | 456 / 456; 381 / 381; 375 / 375 |
| Overview spending / goal / upcoming | 536 / 536; 636 / 636; 555 / 555 |
| FIRE assets / savings / assumptions / projection | 440 / 440; 457 / 457; 542 / 542; 518 / 518 |
| New savings goal | 493 / 493 |
| Savings deposits | 473 / 473 |
| Receipt photo / manual review | 638 / 638; 645 / 645 |
| Command results | 528 / 528 |

All measured dialogs also had equal client/scroll widths. At 1366×768, all five main modules retained a 1366×768 document and had no overflowing auto/scroll containers inside the main content. A desktop savings screenshot was inspected. Settings checkbox background computed as white. Escape returned cleanly from tested dialogs; browser console contained no runtime errors at final check.

Issues found and corrected during browser evaluation: settings initialization after DOM reparenting, expanded mobile donut height, overly tall mobile deposit pages, inherited form/slider label spacing, and import confirmation appearing outside the review tab.

## Final automated gates

- `npm run lint`: passed — 67 scripts, 506 unique IDs.
- `node --test --test-isolation=none --test-reporter=spec tests/*.test.js`: 733 passed, zero failures, exit 0.
- `npm run build`: passed. Build ID `1ebc7dd66baff94a`; 1,095,896 output bytes, 21.5% JS/CSS reduction.
- No new packages or environment-variable changes.

Physical camera capture, SMS delivery and real bank linking were not exercised; their existing integrations were not changed. Browser checks cover representative default/demo content and automated high-volume cases, not every possible user-generated string or device zoom level.
