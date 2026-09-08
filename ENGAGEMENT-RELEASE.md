# Mer engagement suite — evaluation record

## Scope and safeguards

- Unlimited savings vaults share the existing reactive profile store. The dashboard previews two goals; the manager supports search and pagination. Auto-Stash is opt-in, forward-only, card-aware, and reconciled in cents on edits/deletions/date changes. Transfers are virtual accounting allocations, not bank payment instructions.
- Bill splitting keeps the original transaction posted exactly once. Participants, repayments, and payment-code fields are local and user/profile scoped. Repayments never silently create income. A changed source transaction invalidates a saved split/code until reviewed.
- Croatian HUB3 EUR uses PDF417, not QR. The optional EPC format uses a SEPA QR. Encoding follows the published formats; acceptance has not been certified with each banking app. Users must verify the beneficiary, IBAN and amount in their bank before authorizing payment.
- Monthly Wrapped uses posted transactions and net savings entries, excludes foreign currencies/profiles, treats roundups as a subset of deposits, and shares only the badge/month by default. First-day display is deferred while a modal or tour is open and marked separately per user/profile/month.
- Financial health is an explanatory product score, not a credit score: savings against a 20% target (40 points), budget adherence (35), primary reserve against six months of configured essentials (25). Missing income produces an unavailable score. Rebalancing preserves the total category allocation and needs explicit confirmation. Gemini explains the deterministic proposal; it cannot mutate balances.
- Natural-language entry uses a server-only Gemini key and strict structured validation. The user reviews all populated fields before saving. Speech uses the browser's recognition service where supported, after a user gesture; typed input and local parsing remain available. The UI discloses external processing and requires separate consent before Gemini processing.

## Evaluation cycle 1 — logic and integration

- Vault tests cover exact cents, 1/5 EUR increments, no retroactive stashing, scheduling, updates/deletions, disabled rules, duplicate imports, profile isolation, and income allocation limits.
- Split tests cover equal/custom shares, cent remainders, owner isolation, stale source/revision guards, partial repayments, real PDF417/EPC encoding, payload bounds and safe downloads.
- Health/Wrapped tests cover signed adjustments, invalid/future/pending/cancelled data, currency/profile boundaries, leap years, year rollover, once-per-user monthly prompts, rapid reactive updates and stale rebalancing.
- A real configured Gemini request parsed a synthetic Croatian transaction successfully. Browser test: “Potrošio sam 14,50 eura na gorivo u Ini danas” populated 14.50 / Ina / expense / Prijevoz without saving or changing balances.

## Evaluation cycle 2 — UI and regression

- Browser walkthrough covers vault creation, enabling card roundups, recording 4.20 EUR and observing 0.80 EUR in the target vault, persistence after reload, split creation and payment-code rendering, all four Wrapped stories, natural-language review, and health suggestions.
- Desktop and mobile checks include bounded dialog bodies, accessible footer actions, Escape/backdrop dismissal, keyboard navigation, both themes, and Personal/Business switching.
- The visual audit caught global SVG icon styles outlining the barcode modules. Dedicated barcode fill/stroke rules correct this; a regression test preserves the isolation. Generated codes now scroll into their own modal body with reduced-motion support.
- `npm run check` runs preflight, all unit/integration/UI-contract test files, and the minified production build. The service-worker shell uses content hashes so deployed changes are not hidden by stale assets.

## Operational limits

This release does not add a banking license, initiate real transfers, certify payment-code acceptance, or replace the existing local authentication/storage model with a shared production backend. Acoustic microphone recognition depends on browser/OS support and permission; automated tests validate its lifecycle and fallbacks, while the browser evaluation used typed Croatian input. Gemini availability also depends on the configured provider and network.

## Primary format references

- [HUB3 EUR PDF417 specification](https://hub.hr/sites/default/files/inline-files/2DBK_EUR_Uputa_1.pdf)
- [EPC QR guidance](https://www.europeanpaymentscouncil.eu/document-library/guidance-documents/quick-response-code-guidelines-enable-data-capture-initiation)
- [Google Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output)
