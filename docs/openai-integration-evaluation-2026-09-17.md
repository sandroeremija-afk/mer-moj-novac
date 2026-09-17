# Mer AI — OpenAI integration evaluation

## Architecture and scope

The repository remains its existing vanilla JavaScript application with Vercel Node Functions. No framework migration was introduced. `/api/ai/chat` and `/api/ai/parse-transaction` use the official `openai` SDK and the explicitly requested `gpt-4o-mini` model. The former route names remain server aliases for cached clients.

Only server code reads `OPENAI_API_KEY`. The SDK is not bundled into the browser. Requests use the fixed official API origin, `store:false`, bounded bodies/responses, timeouts, no retries or redirects, and disabled SDK logging. Chat sends only its messages and an allowlisted active-profile aggregate summary; sentence extraction sends the sentence and category labels with explicit consent. Receipt extraction and forecast explanations were migrated as well, preserving their consent and validation safeguards.

Financial tool calls open the existing transaction or goal forms for review. They never write to the ledger directly. Session/profile/language/currency changes invalidate pending actions, unrelated open forms are not overwritten, and only allowlisted navigation targets are accepted.

## Evaluation cycle 1 — contracts, logic and live provider

- Unit/integration coverage includes official SDK request serialization, all three tool schemas, strict single-action validation, malformed/refused/truncated output, category matching, unknown categories, request bounds, UTF-8 chunk boundaries, origin checks, rate limits and safe error responses.
- Actual SDK transport tests verify model, JSON mode, tool payloads and authorization without using network credentials.
- Live synthetic requests with the configured local key returned HTTP 200 for: a 15 EUR Konzum expense; a 5,000 EUR "Novi auto" goal; navigation to Savings; and Croatian sentence extraction into the existing category schema.
- The initial goal test unnecessarily requested a name. The prompt was corrected to recognize an explicitly stated purpose as the goal name; the same live request then produced the correct tool call.
- Receipt/cash-flow regressions use controlled provider responses; this evaluation does not claim new live OCR or forecast tests.

## Evaluation cycle 2 — browser and build

- Live local browser test: floating chat prepared Konzum / 15.00 / Hrana i restorani in the transaction form.
- Live Help-panel test: the goal form opened with Novi auto / 5000.00 / current balance 0. No ledger entry was saved during the tests.
- Shared chat rendered the action confirmation card with "Obrazac pripremljen · nije spremljeno".
- Live "Unesi rečenicom" test populated merchant, amount and category, with a review notice and no automatic save.
- Switching to Business showed a separate conversation and its own metrics, not the Personal conversation.
- Mobile chat at 375×812 fit within the viewport without horizontal overflow. An unnamed mobile send button was identified and given a localized accessible label.
- Browser error/warning log was empty during the local flow.
- Complete regression suite, preflight and production build pass. Production assets contain no provider key or SDK import. Obsolete provider terminology was removed from tracked source, documentation and test names.

## Deployment/security boundary

The existing application uses local/demo authentication. Same-origin checks and per-instance rate limits are defense-in-depth, **not authenticated server authorization or a distributed spending limit**. A broader public rollout still needs server-verified sessions plus durable API quotas or a Vercel firewall policy. Configure an OpenAI project budget/usage alert; the client must never be considered an authorization boundary.

Local and Vercel secrets remain outside Git. Deployment must use the reviewed commit, followed by a production route smoke check. No user financial records, identifiers, credentials or bank details were used in the live evaluation prompts.
