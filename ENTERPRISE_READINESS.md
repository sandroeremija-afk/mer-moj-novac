# Mer enterprise feature release

## Available workflows

- `Ctrl/Cmd K`: searchable keyboard navigation, new income/expense, transaction export, profile switching, financial planning and lock.
- Header shield or `Ctrl/Cmd Shift H`: visual privacy for monetary figures. This is a screen-sharing aid, not a replacement for authentication.
- **Planiraj unaprijed**: deterministic 90-day recurrence detection and 30-day cash-flow forecast, subscription price radar, non-posting purchase simulation and payday goal allocations.
- Gemini can explain anonymized aggregate forecasts on demand. The arithmetic never depends on model output. API credentials stay on the server (`GEMINI_API_KEY`; optional `CASHFLOW_GEMINI_MODEL`). WebUI settings are unchanged.
- Business-only **e-Račun**: validated OIB/HR IBAN fields, KPD fields, itemized 25% VAT, local QR summary, saved drafts, UBL XML draft, print/save-as-PDF. See `INVOICE_READINESS.md` before issuing any legal invoice.
- Tax reserve is restricted to explicitly marked VAT-inclusive B2B income. At a 25% VAT rate, EUR 1,250 gross reserves EUR 250, not EUR 312.50. Allocations are virtual, not bank transfers.
- Settings → Security: ten-minute idle lock, demo PIN setup, encrypted vault setup, JSON data download, verified local account deletion, PWA installation when supported.
- Offline new transactions remain drafts and do not affect balances. Reconnect, open Activity → Drafts, and explicitly confirm each entry. Editing existing posted records requires connectivity.

## Storage and deployment boundaries

Registered local users automatically encrypt financial caches with AES-256-GCM after password login. PBKDF2-SHA256 derives the key using 600,000 iterations and a random salt. The encryption key is not persisted beside the ciphertext. Demo encryption/PIN is explicit setup; an unconfigured demo lock returns to sign-in. Auth session descriptors live in sessionStorage; real bank/API bearer secrets are not placed in browser storage.

The existing authentication system is local to this browser, not an enterprise identity server. Account export/delete covers this user's two local profiles and cache only. It cannot delete data on bank servers or revoke remote identities. Production multi-device authentication, authoritative server sessions and organization-wide deletion require a backend identity/data service.

Invoices are drafts, not certified Croatian e-invoices: validation against current CIUS extensions, fiscalization and authorized delivery are separate integration work. The QR encodes a draft summary, not a HUB3 payment order (which uses PDF417).

Forecasts exclude foreign-currency records instead of inventing FX rates. Existing base-currency display settings do not constitute a currency conversion service. Payday/tax rules retain their configured currency to avoid reversing historical allocations when display settings change. Removing rules recalculates their virtual allocations; generated deposits must be changed through their source income/rule.

The service worker caches same-origin static application assets only, never API responses or authorization-bearing requests. Its cache version hashes actual emitted asset contents. New versions activate after old tabs close, keeping the app shell consistent.

## Verification

`npm test` executes both cycle groups: finance/state mutation and isolation, encryption/tampering and lock boundaries, offline drafts, API error contracts, invoice validation and UI contracts. `npm run lint` checks syntax/assets; `npm run build` minifies the static application and generates the PWA shell manifest.

For local production preview: `npm run build`, then `node --env-file-if-exists=.env.local scripts/preview.js`. The preview serves only `dist` and the two local API handlers. Never publish `.env.local`.

Browser checks for this release include keyboard navigation, global amount blur, non-mutating EUR 5,000 purchase simulation, synthetic EUR 250 invoice preview/save, mobile sticky invoice actions, drag-safe backdrop dismissal, profile switching and lock-screen behavior. Dedicated clock/controller tests simulate the exact ten-minute inactivity deadline and credential verification. Live Gemini availability depends on the environment key, model access and network.
