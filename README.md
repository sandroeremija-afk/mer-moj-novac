# mer Moj novac

Production-ready static prototype for savings, budget, income, and cash-flow tracking. The interface follows the supplied mer brand book, opens in Croatian, and includes an HR/EN switch.

## Run

Open `index.html` directly, or serve this folder from any static host. No build step or backend is required. App data is saved locally in the browser and Personal/Business profiles are isolated.

## Included

- Typed income and expense entry, editing, deletion, searching, and filtering
- Default and custom income/expense categories
- Current-month budgets, threshold alerts, recurring expenses, and savings goals
- Dedicated Insights route with daily, monthly, year-to-date, and all-time totals
- Net total, savings rate, month-over-month comparison, top spending category, cash-flow chart, and category breakdown
- Croatian and English UI, light/dark themes, responsive layouts, notifications, tooltips, and expense CSV export
- Modular demo Open Banking provider with Revolut/PBZ account and card connections
- Explicit Personal/Business account mapping with isolated sync cursors and transaction storage
- Automatic and on-demand syncing, bank-source labels, ID/hash deduplication, vendor rules, and an uncategorized review queue
- Reconnect, rate-limit, disconnected-account, refresh, and unlink states in User Settings

## Bank integration architecture

`bank-provider.js` is a browser-safe mock provider that models the connection, account-discovery, cursor, token-expiry, and rate-limit behavior expected from Plaid or GoCardless/Nordigen. `core.js` owns provider-independent normalization, categorization, and deduplication. Replacing the demo provider with a live service therefore does not require rewriting the dashboard, profile-isolation, or transaction logic.

The demo never asks for or stores real banking credentials. A production Open Banking rollout should exchange provider tokens on a server and store encrypted connection metadata outside the browser.

## Run bank evaluations

```powershell
node --test --test-isolation=none tests/eval-cycle-1-sync.test.js
node --test --test-isolation=none tests/eval-cycle-2-ui-errors.test.js
```

## Verification

The original release passed 39 automated logic/UI checks. The bank-integration release adds two repeatable evaluation cycles with 15 focused tests for parsing, deduplication, profile isolation, provider errors, review fallbacks, mapping, cursor behavior, and responsive UI contracts. The complete bank flow was also verified interactively in a browser from connection through sync and profile reassignment.
