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
- TOTP MFA setup/validation, hashed one-time recovery codes, and a local session lock
- Smart CSV/Excel import with Croatian/English headers, duplicate detection, heuristic categorization, a paginated review/edit step, and bulk changes
- Base-currency, date-format, timezone, dashboard-privacy, and full JSON/CSV portability settings
- Multiple purpose-based savings goals with progress, deadlines, deposits, editing, and a selectable primary Dashboard goal
- Profile-isolated custom keyword rules shared by bank sync and file imports
- Fixed `100dvh` application shell with zero browser-page scrolling; Activity is the only module with a vertical list scrollbar
- Progressive-disclosure detail modals for secondary Dashboard, Budget, Savings, and Insights content
- Contextual CSV/Excel import and transaction export actions in Activity, Budgets, Insights, and Add Transaction
- Clean Personal/Business account menu and focused Settings tabs without redundant transaction-import actions
- Central reactive state store that recalculates balances, category totals, budget bars, and reports for both profiles after every mutation

## Security model

`security-core.js` implements standards-compatible TOTP using Web Crypto (HMAC-SHA1, 30-second period, six digits), accepts a one-step clock drift, and stores only SHA-256 hashes of recovery codes. In this no-backend prototype the MFA secret remains in browser storage and protects the local session. A production account system must validate TOTP server-side, encrypt the secret at rest, rate-limit attempts, and issue secure authenticated sessions.

## Import architecture

`import-core.js` parses CSV independently of the UI and supports quoted fields, comma/semicolon/tab delimiters, Croatian and English header aliases, European decimal notation, Excel serial dates, malformed-row reporting, duplicate fingerprints, type separation, and categorization. Excel workbooks are converted to rows in the browser with SheetJS and then follow the same review pipeline. A 50-row page size keeps the review screen responsive with 500+ records.

## Bank integration architecture

`bank-provider.js` is a browser-safe mock provider that models the connection, account-discovery, cursor, token-expiry, and rate-limit behavior expected from Plaid or GoCardless/Nordigen. `core.js` owns provider-independent normalization, categorization, and deduplication. Replacing the demo provider with a live service therefore does not require rewriting the dashboard, profile-isolation, or transaction logic.

The demo never asks for or stores real banking credentials. A production Open Banking rollout should exchange provider tokens on a server and store encrypted connection metadata outside the browser.

## Reactive one-page architecture

`state-store.js` is the single commit boundary for app data. Every add, edit, delete, sync, import, savings-goal, and settings mutation passes through the store; both account profiles are recalculated before one synchronous UI notification. The app shell, main content, and document root are locked to `100vh`/`100dvh`. Primary modules fit without box scrollbars, secondary information opens in detail modals, and only Activity plus the 500+ row import-review table own vertical scroll state.

## Run bank evaluations

```powershell
node --test --test-isolation=none tests/eval-cycle-1-sync.test.js
node --test --test-isolation=none tests/eval-cycle-2-ui-errors.test.js
```

## Run premium evaluations

```powershell
node --test --test-isolation=none tests/eval-cycle-1-security-import.test.js
node --test --test-isolation=none tests/eval-cycle-2-review-goals.test.js
```

## Run reactive layout evaluations

```powershell
node tests/eval-cycle-1-reactive-store.test.js
node tests/eval-cycle-2-fixed-layout.test.js
```

## Verification

The complete suite currently passes 44 automated checks across sync/deduplication, MFA/import security, reactive state, goal/rule isolation, UI error handling, navigation cleanup, and fixed-layout contracts. Interactive browser evaluation at 1920×1080, 1440×900, and the stricter 1280×720 viewport verified zero outer scroll, zero module overflow outside Activity, all four detail modals, focused Settings tabs, header title/date ordering, HR/EN title updates, a 520-row review flow, and an error-free browser console.
