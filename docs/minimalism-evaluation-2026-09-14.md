# Minimalist workspace evaluation — 2026-09-14

## Cycle 1 — layout and focused details

- Built production assets and tested the local preview through the browser, including its normal PWA update flow.
- At 1366 × 768, Dashboard protection and budget tracking cards both measured 422.25px high, with bottom edges at 740px. Root document measured 1366 × 768; no outer desktop overflow.
- Financial Health banner and the additional 30-day green forecast box are absent. Their calculation utilities remain available to the secondary tools.
- Savings shows the active goal meter, compact coverage, history chart with period total, and simple goal cards. At the laptop viewport, the goals panel ends at 740px.
- History, Strategy, and Goal cards open separate focused details. Escape and genuine backdrop clicks close the dialogs; navigating afterwards remains interactive.
- Goal details preserve Edit, Deposit, and Auto-Stash routes. Keyboard Enter opens the focused summary card.
- Personal and Business views display their own goals and history (Personal history 2,850 EUR; Business 5,500 EUR in the local demo). Opening details does not mutate balances.
- Fixed two findings during this cycle: the weekly insight was hidden by an overly broad Savings selector; the history trend needed an explicit comparison label. Rebuilt and confirmed both fixes in the browser.

## Cycle 2 — amounts, responsive behavior, tour and build

- At 375px, Activity expenses display complete signed amounts such as -100,00 EUR and -120,00 EUR without ellipses; income filtering displays +3.500,00 EUR. Production rendering uses the euro symbol and preserves each transaction's original currency.
- Removed bill splitting and the legacy shared-household splitting path, including buttons, command entries, handlers, scripts and unused barcode dependency. Existing cached records are preserved but have no active mutation or UI routes.
- At 375px, the Goal detail dialog has one scrolling content body and a visible footer containing Close, Edit and Deposit. Backdrop dismissal and subsequent sidebar navigation work.
- At 414px, every Savings summary card measured scrollHeight equal to clientHeight with overflow-y visible; all right edges remain inside the viewport. Mobile pages retain natural outer scrolling.
- Walked all five tour steps at 1440 × 900: summary cards, sidebar transaction action, full budget container, goal container and full Insights dashboard. Sidebar context and feature spotlights appear together; inspected tooltips have no inner overflow.
- Verified dark-theme detail contrast, keyboard opening, profile switching and a clean browser error log.
- Final `npm run check` passed: 55 scripts, 494 unique IDs, all 131 evaluation files, and a successful minified production build.

## Scope and recovery

Financial formulas, authentication, banking integrations and profile storage were not redesigned. Removed feature code is recoverable through Git history; cached split/shared-household records were not erased. Live banking and AI upstream services were not exercised for this visual refactor.
