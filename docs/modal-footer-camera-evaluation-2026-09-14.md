# Modal footer, notifications, goals and receipt camera evaluation

> Historical evaluation of an earlier implementation. Provider-specific checks below do not certify the current OpenAI integration. See README.md for current configuration; current live tests require an OpenAI key.

## Scope and safety

- Standardize existing modal navigation nodes in the footer; preserve their listeners, draft state, form association and contextual Back routing.
- Keep authentication locks and spotlight hosts outside dismissible-modal normalization.
- Remove the goal icon picker and decorative goal-detail icon without deleting stored legacy goal metadata or changing financial calculations.
- Camera uses rear-preferred `getUserMedia`, no audio, a local video preview and JPEG frame capture. Native `capture="environment"` remains a fallback.
- Camera photos enter the existing explicit-consent receipt review flow. Mer does not upload on capture, alter a transaction automatically or store camera credentials.
- Allow same-origin camera access in Vercel Permissions-Policy and local media previews in CSP; retain all other restrictions.

## Evaluation cycle 1 — behavior and state

- Executable footer-controller tests cover existing-node identity, event handlers, normal/external form ownership, hidden Back stages, import-review confirmation gating, localization, repeat normalization, live close delegation, settings-body isolation and non-dismissible security locks.
- Planning, export and Plan navigation tests verify contextual return, receipt-local Back precedence and profile/session boundaries.
- Camera tests cover capture through consent and mocked OCR to review, duplicate and stale captures, denied/missing/busy device fallbacks, late permission responses, and track cleanup on Back, close, Escape, profile change, security lock, session expiry, hidden page and pagehide.
- Vault, receipt and financial-state regressions remain green. No real receipt was sent to the prior AI provider.

## Evaluation cycle 2 — browser and responsive walkthrough

- Tested the local production build at 1280x720, 1366x768, 1440x900 and 375x812 using the in-app browser.
- FIRE, subscription renewals, recurring subscriptions, scheduled payments, plan steps, Settings, bank connection steps, receipt upload and goal creation expose footer navigation, with no header Back buttons.
- Verified Back routes from FIRE/renewals to Plan, both bank stages back to the bank overview, and Escape dismissal. Goal form contains no icon input.
- Found and fixed mobile legacy `.modal-actions.split-actions` column specificity and full-width action wrappers. At 375px the goal-form left and right buttons now share y=735; FIRE Back and Save share y=751. Bank step actions remain in view.
- Notification computed styles: title 16px/600, body 14px/400, primary action 12px/500, resolve action 12px/400. Checked light and dark rendering. FIRE currency units now stay on one line.
- Browser console reported no application errors during the walkthrough.
- Physical-camera limitation: the in-app browser reached the live-camera permission-wait screen but did not expose a completed device grant/video stream. Physical capture is not claimed as verified; lifecycle and image processing were validated with simulated MediaStreams. The pending preview was ended by reloading the local test page. No photograph was uploaded.

## Build gate

- `npm run check`: preflight, all 138 evaluation files and production build pass.
- `git diff --check`: no whitespace errors.
- Final release is published only after these checks; hosting status and live assets are checked separately after publication.
