# Safe release updates — 7 September 2026

## Defect and scope

Production delivered fresh HTML while an already installed offline worker returned
old JavaScript/CSS at unchanged URLs. No financial calculations, account data,
authentication flows, or existing module layouts were changed by this fix.

## Implementation

- Every local shell reference has a SHA-256 content version, including JS, CSS,
  favicon and PWA icons. The offline manifest uses the exact same request keys.
- A compiled worker carries its own pinned asset list and validates the release
  HTML and fetched asset hashes before installation. Cross-release responses fail
  installation rather than populate a mixed cache.
- Offline HTML is fetched from canonical `/`, avoiding Vercel clean-URL redirects.
  Offline fallback reads only the current shell cache; APIs and private requests
  are excluded. No localStorage/IndexedDB data is cleared.
- Worker, shell manifest and HTML response headers require fresh validation.
- A Croatian/English update notice offers explicit Reload/Later actions. Mer does
  not interrupt an open form or reload another tab automatically. Accepted reloads
  await encrypted persistence; failed saves prevent reload.

## Evaluation cycle 1 — logic and regression

`npm test`: all 106 test files passed. New tests exercise old-cache bypass,
exact emitted-content hashes, repeated-build stability, missing-asset failures,
worker-only release changes, pinned-manifest install, canonical offline HTML,
cross-deployment/tampered response rejection, validated activation, update-check
throttling, save failures, timeout, and consent-only reload.

`npm run lint`: 41 scripts, 491 unique static IDs, local references validated.

## Evaluation cycle 2 — browser and build

Local production preview, same-origin existing controlled tab:

1. Loaded build A, entered the isolated demo profile, and retained the tab.
2. Built release B and navigated the same tab to fresh HTML while its prior
   offline worker was still installed.
3. Verified every local script URL was versioned, the new search/grammar/tools
   appeared, and the update banner was visible. Browser error log was empty.
4. Accepted `Osvježi aplikaciju`. Reload completed, banner disappeared, and the
   saved 2,840 EUR demo balance remained unchanged. No horizontal page overflow.

`npm run build`: successful minified production output.

Production deployment and public-site confirmation are reported separately after
Git/Vercel completes. This document does not claim a live production check before
that step has occurred.
