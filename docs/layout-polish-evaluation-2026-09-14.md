# Layout polish evaluation — 14 September 2026

## Scope

- Bound the Overview lower row to a content-appropriate desktop height while retaining equal card heights and natural mobile flow.
- Add a restrained theme-aware MER recommendation accent, enlarge goal percentage rings, remove redundant default goal glyphs, and restore exact month/currency chart interaction.
- Keep the Strategy header/footer accessible around one bounded scroll body; reset inherited icon-column styles that narrowed the relocated weekly text.
- Move the existing reactive Savings Rate card into the Insights summary row; use four desktop summary columns and three equal analytical columns without resetting saved layout preferences.
- Financial formulas, stored transactions, and profile data were not changed.

## Cycle 1 — interactions and regression coverage

- `npm run check`: lint/preflight, all 135 evaluation files, and production build passed.
- New tests cover chart hover/touch scrubbing, full month labels, keyboard navigation, tooltip bounds, reactive rerender behavior, theme/privacy styling, strategy footer constraints, and Insights layout-order compatibility.
- Browser: exact `Kolovoz: 450,00 €` tooltip appears, scrub changes the active month without opening a dialog; Home/End navigate to March/September and Escape dismisses the tooltip.
- Strategy footer remains visible; keyboard End reaches the final weekly paragraph on mobile. Modal close returns to an interactive Savings module.
- Personal and Business retain separate amounts and gauge results; changing the Insights period preserves detail interactions and handles empty data.

## Cycle 2 — responsive visual audit and final build

- Audited desktop 1366×768 and 1440×900, tablet 820×1180, and mobile 375×812.
- Overview lower cards match at approximately 353px on 1366×768 (around 69px shorter than the previous layout); no desktop root overflow.
- Insights on 1366×768: four equal summary cards and three equal lower chart cards; lower card client/scroll heights match. Tablet switches to two summary columns, mobile to one; analytical cards stack below desktop.
- Savings tooltips remain within the chart width on 375px. Goal rings render at 64px with 16px text. Recommendation tint remains restrained.
- Found and repaired a remaining inherited 32px weekly-text column during the browser audit. Retested: full-width paragraph; Strategy body has no scroll on 1366×768 and only one internal scroll region when needed on mobile. Footer remains in view.
- No browser console errors observed during the local walkthrough.
- Final `npm run build` passed: 1,024,007 emitted bytes, 21% smaller than unminified sources.

Tests used existing local demo profiles. No production financial records were edited.
