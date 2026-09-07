# Receipt OCR and transaction matching

## Implemented flow

1. `MerReceiptUI.open({ transactionId? })` opens a responsive receipt photo dialog. Users can choose, drag/drop or request the phone's camera file picker (JPEG, PNG, WebP).
2. The browser decodes/re-encodes the image locally, strips original metadata, resizes to at most 2048 px and limits the transmitted image to 2 MiB. It only calls the server after the user checks the explicit Google Gemini consent box.
3. `/api/receipt` sends **only the consented image and extraction instruction** to Gemini. It never sends the transaction list. The key is read server-side from `GEMINI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY`, with `RECEIPT_GEMINI_MODEL` then `GEMINI_MODEL` controlling the model. No browser-prefixed key is used. `store:false` prevents Interactions history storage; this is not a claim about all provider retention policies.
4. Users review/edit the merchant, issue date, currency, total, document number and up to 100 item lines. Unknown fields remain blank, not fabricated. Unavailable/rate-limited/failed OCR presents an honest manual-entry path.
5. Candidate bank transactions must have the same profile, type and currency, an amount within one cent and a date within seven days. Exact amount/date and matching merchant rank first. Manual transactions can be explicitly included. The user chooses a candidate and confirms a review checkbox.
6. `MerEnterpriseBridge.attachReceipt(profileId, transactionId, receipt)` revalidates current state and appends metadata only. No expense/income entry, balance or category amount is created or changed. Duplicate receipt IDs or exact prepared-image hashes are rejected across different transactions and are idempotent on the same transaction.
7. `MerReceiptUI.view(transactionId)` shows saved, read-only receipt metadata and item lines. Its “Dodaj račun” action starts another attachment. Original image bytes are not retained in the ledger. Profile switching, locking and dialog close abort pending work and clear displayed receipt data.

Root integration requires `MerReceipts` then `MerReceiptUI`, `receipt.css`, the existing dialog bridge and `MerReceiptUI.refresh()` after reactive state renders. Matching data lives at `profile.transactions[].receipts`; existing encrypted profile persistence and portability export include it.

## Evaluation evidence — 7 September 2026

- Cycle 1: `tests/eval-cycle-1-receipt-matching.test.js`: malformed monetary/date/line data, profile/currency/type boundaries, bank-vs-manual filtering, ranked matches, idempotency, attachment allowlists, unchanged financial amounts, and stale asynchronous request rejection.
- Cycle 2: `tests/eval-cycle-2-receipt-api.test.js` and `tests/eval-cycle-2-receipt-ui.test.js`: consent and origin rejection, MIME/signature/body/response caps, unavailable provider, rate limits, timeout, no synthetic extraction fallback, and read-only stored-receipt display/escaping/profile isolation.
- Live synthetic-only evaluation: `scripts/eval-receipt-live.js` generated a fictional receipt and invoked the real server handler using the existing local Gemini configuration (`gemini-3.7-flash`). HTTP 200 returned merchant `MER TEST TRGOVINA`, date `2026-09-07`, total `1250` cents and both correct item totals `450` + `800` cents. No private receipt or account data was used.
- A real-provider compatibility issue was found and fixed: the upstream structured schema uses a conservative subset accepted by the active Interactions endpoint. Bounds and output-property allowlists remain enforced locally. This live check is separate from normal tests to avoid automatic API spending.
- Windows sandbox test invocation: `node --test --test-isolation=none tests/eval-cycle-1-receipt-matching.test.js tests/eval-cycle-2-receipt-api.test.js tests/eval-cycle-2-receipt-ui.test.js`.
- The live script takes an optional path to an installed `sharp` package, draws its synthetic image itself and writes only to ignored `.tmp-receipt/`. It never prints API keys.

## Explicit boundaries

- OCR is assistive and can be wrong. Human review is required; this is not proof of payment, tax validity, fiscalization or a substitute for preserving legally required original documents.
- The image is sent to Google only with explicit consent. Users should avoid unnecessary personal data and can choose entirely local manual review instead. Configuring an API key is not consent to upload individual receipts.
- No multi-user server authentication was added here. This app currently uses its existing local profile/session model. The endpoint has same-origin checks, finite payload/time limits and an in-memory per-instance throttle; these do not replace authenticated server sessions, distributed abuse limits or a provider spending cap in a multi-tenant deployment.
- Camera capture depends on browser/device file-picker support; regular upload remains available. PDF, HEIC and full original-image document archiving are not implemented.
- A hash prevents exact prepared-image re-import, not different photographs of the same paper receipt. All links still require explicit review, and none affect finances automatically.

## Provider references

- [Gemini image understanding](https://ai.google.dev/gemini-api/docs/image-understanding)
- [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output)
- [Interactions API reference](https://ai.google.dev/api/interactions-api)
