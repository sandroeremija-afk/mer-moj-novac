# mer Moj novac

Production-prepared static application for savings, budgeting, income, and cash-flow tracking. The interface follows the supplied mer brand book, opens in Croatian, and includes an HR/EN switch.

## Run and verify

Node.js 20 or newer is required for the reproducible production pipeline.

```powershell
npm install
npm run check
```

`npm run check` performs the source/security preflight, runs every logic and UI contract evaluation, and creates the minified `dist/` output. For local UI work, serve the repository root with any static server and open `index.html`. App data is saved locally in the browser and Personal/Business profiles are isolated.

The optional Gemini-backed assistant runs through the server-only Vercel Function at `/api/assistant`. Add `GEMINI_API_KEY` to `.env.local` for local use, or pull the linked Vercel development environment, then run `vercel dev`. A missing key or unavailable provider never exposes an error to the conversation: both assistant surfaces fall back to deterministic local guidance.

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
- Vault-style savings cards with progress rings, target countdowns, required monthly contributions, and a single selectable spare-change round-up destination
- Automatic subscription detection with renewal reminders and a dedicated subscription manager
- A live contextual header with time-of-day greeting, date rollover, and translated HR/EN formatting
- A dedicated login/registration landing, Web Crypto password hashing, session persistence, demo access, and a full logout flow
- Production Open Banking/PSD2 transaction contracts and provider adapters prepared for GoCardless/Nordigen, Salt Edge, and Tink
- Institution metadata for ZABA, PBZ, Erste, HPB, OTP, Revolut, N26, and Wise, including IBAN/BIC/currency transaction fields
- CAMT.053 / ISO 20022 bank-statement parsing alongside CSV and Excel, using the same pre-commit review drawer
- Dense Insights canvas with category donut, six-month income/expense bars, top-five merchants, and savings-rate gauge
- Profile-isolated custom keyword rules shared by bank sync and file imports
- Fixed `100dvh` desktop application shell with intentional internal scrolling only for volume-heavy Activity, Budget-category, and import-review lists
- Brand-book-compliant adaptive wordmarks that switch between positive and negative variants by surface and theme while preserving the 9:4 aspect ratio
- A stationary auth hero with an independently scrollable form column, a repaired fixed-height Savings canvas, and a semantic responsive type scale
- Progressive-disclosure detail modals for secondary Dashboard, Budget, Savings, and Insights content
- A volume-safe Budget category card with a bounded desktop list, subtle scrollbar, and searchable all-category manager with direct add/edit actions
- Contextual CSV/Excel import and transaction export actions in Activity, Budgets, Insights, and Add Transaction
- Clean Personal/Business account menu and focused Settings tabs without redundant transaction-import actions
- Central reactive state store that recalculates balances, category totals, budget bars, and reports for both profiles after every mutation

## Security model

`auth-core.js` provides a browser-safe identity-provider boundary. The local adapter validates emails and password strength, derives a 256-bit password hash with PBKDF2-SHA256 (210,000 iterations and a unique random salt), never stores raw passwords, persists only an expiring tab session, and leaves financial data intact on logout. `security-core.js` implements standards-compatible TOTP using Web Crypto (HMAC-SHA1, 30-second period, six digits), accepts a one-step clock drift, and stores only SHA-256 hashes of recovery codes.

This deployment intentionally includes a local/demo auth provider. The Gemini assistant has a narrowly scoped server route, but it is not an identity backend and does not change the local authentication trust model. Before real customer onboarding, replace the auth adapter with Clerk/Auth0/Descope or another server-backed identity provider, move TOTP validation and Open Banking tokens server-side, use secure HttpOnly cookies, encrypt secrets at rest, and rate-limit authentication attempts. The UI and provider boundary are already separated for that migration.

## Import architecture

`import-core.js` parses CSV independently of the UI and supports quoted fields, comma/semicolon/tab delimiters, Croatian and English header aliases, European decimal notation, Excel serial dates, malformed-row reporting, duplicate fingerprints, type separation, and categorization. Excel workbooks are converted to rows in the browser with SheetJS. `accounting-core.js` parses CAMT.053/ISO 20022 entries, preserves IBAN/BIC/currency metadata, and sends them through the same editable review pipeline. A 50-row page size keeps the review screen responsive with 500+ records.

## Bank integration architecture

`bank-provider.js` is a browser-safe mock provider that models the connection, account-discovery, cursor, token-expiry, and rate-limit behavior expected from a PSD2 aggregator. `accounting-core.js` defines the provider-independent payload schema, supported European institution catalogue, and adapters for GoCardless/Nordigen, Salt Edge, and Tink. `core.js` owns normalization, categorization, and deduplication. Replacing the demo provider with live server routes therefore does not require rewriting the dashboard, profile isolation, or transaction logic.

The demo never asks for or stores real banking credentials. A production Open Banking rollout should exchange provider tokens on a server and store encrypted connection metadata outside the browser.

## AI assistant architecture

`assistant-core.js` is the shared client for the Help panel and floating chat widget. It limits history, sends only an allowlisted aggregate summary for the active profile, aborts stale requests during profile switches, and provides deterministic Croatian/English guidance when the remote service is unavailable. `api/assistant.js` independently validates and sanitizes the request before calling Google Gemini's Interactions API with `store: false`. The API key remains in the server-only `GEMINI_API_KEY` environment variable and is never written into the browser bundle, URL, logs, or response.

Set secrets through Vercel project environment variables for Production, Preview, and Development as required. Never add a populated `.env.local` file to Git; local environment variants are ignored and `.env.example` documents only the required names.

## Reactive one-page architecture

`state-store.js` is the single commit boundary for app data. Every add, edit, delete, sync, import, savings-goal, and settings mutation passes through the store; both account profiles are recalculated before one synchronous UI notification. The app shell, main content, and document root are locked to `100vh`/`100dvh` on desktop. Primary modules stay inside that canvas, while Activity, the bounded Budget category list, and the 500+ row import-review table own intentional vertical scroll state. Secondary information opens in detail modals. Tablet and mobile layouts use natural vertical flow so cards remain readable.

## Production output

`npm run build` minifies every browser application script with Terser, compacts CSS/HTML/SVG assets, verifies that each bundle is non-empty, and writes a byte-reduction report to `dist/build-report.json`. Vercel publishes the static `dist/` assets and separately deploys the root `api/assistant.js` Function. `vercel.json` applies a restrictive Content Security Policy plus clickjacking, MIME-sniffing, referrer, permissions, and cross-origin isolation headers. `runtime.js` catches uncaught errors and rejected promises and presents an accessible recovery surface without exposing internal error details.

The external SheetJS browser bundle is pinned to version `0.20.3` and restricted by the production CSP. Live financial onboarding still requires moving authentication, MFA secrets, and Open Banking tokens to a trusted server, as described in the security model above.

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

The complete suite currently passes 123 automated checks in 23 evaluation files across auth/session security, CSV/Excel/CAMT parsing, Croatian merchant categorization, PSD2 contracts, sync/deduplication, MFA, reactive state, calendar and leap-year behavior, round-up/profile isolation, malformed data recovery, goal/rule isolation, adaptive logos, idle behavior, typography, navigation, responsive layouts, modal focus management, production headers, and fixed-layout contracts.

Interactive browser evaluation covers 414, 768, 820, 1366, 1440, and 1920 px widths. It verifies natural mobile/tablet flow, an exact desktop viewport canvas, zero horizontal overflow, all seven expandable Insights cards, backdrop dismissal, focus restoration, theme/language/notification controls, registration, logout, login, password recovery, session persistence, and an empty runtime console.
