# Page spacing, assistant voice and Croatian copy — 21 September 2026

## Changes

- Desktop Dashboard and Insights use the bounded remainder of the viewport instead of legacy maximum card heights. Budget and Activity rows distribute available space, with pagination anchored below the list. Existing page sizes, filtering and financial state are unchanged.
- The Insights donut grows with its plot; regular center amounts scale with its width while longer-value fit tiers remain intact. Savings retains its existing proportional grid.
- A mobile Budget grid conflict was found during browser verification and fixed with two explicit columns and a shrinkable progress track, not overflow clipping.
- Static dialog sizing from the preceding modal refinement remains intact. Forms follow their content and chart dialogs fill their bounded plotting space. AI messages retain their intentional internal scroll area.
- Both assistant composers now support explicit Croatian (`hr-HR`) speech recognition with live interim/final text, Stop, localized errors and a browser-service privacy notice. Recognition never sends a message automatically. Remote assistant responses have explicit read-aloud/Stop controls.
- Voice is cancelled on profile/session changes, logout, hidden pages, closed/detached surfaces and offline events. Late callbacks cannot write into another profile's draft. No new microphone request occurs on mount.
- Croatian display copy and source badges were normalized without rewriting stored records, technical identifiers, bank names, proper names or the separate English translation mode. Currency/timezone display labels are localized independently of their values.

## Evaluation cycle 1 — space, state and voice

Local production preview with demo data, not the user's production records:

- Walked through all five module views; checked Settings General/Security and budget calculation, cash flow, strategy, export, receipt and Insights chart dialogs.
- At 1440×900, Dashboard bottom cards share y=872; the three lower Insights cards also share y=872. At 1920×1080, Insights bottom cards share y=1048. Root width/height remain within the desktop viewport.
- Budget and Activity pagination switches records without changing the financial summary. Mobile Budget overflow (24–34px) was detected and corrected; final list and progress-track horizontal overflow is zero at 375px.
- Floating and Help AI surfaces show the microphone, privacy notice and send action. At 375×667, the floating window is 341×520 with zero parent/form overflow; the empty textarea no longer has a native scrollbar. Help's bounded parent also has zero overflow.
- Native speech APIs were mocked for interim/final transcription, draft preservation, stop/final flush, abort, unsupported browsers, denied permissions, no speech, network errors, cross-profile guards and explicit TTS lifecycle.
- Browser microphone Start and Stop were exercised, but the embedded browser did not return a real spoken transcript. No live-utterance accuracy or actual audio playback is claimed. Device/browser support still needs a real microphone check. No assistant API query or financial data was sent during this audit.

## Evaluation cycle 2 — responsive and language regression

- Browser dimensions: 1440×900, 1366×768, 1920×1080, 768×1024 and 375×667. Checked DOM dimensions plus screenshots, not CSS assertions alone.
- Mobile retains natural outer page flow; forcing all data into one phone-sized viewport would clip content. Checked cards and static popups have no unintended inner scrollbars. Chat history remains scrollable by design.
- Confirmed `Ručno` instead of `Manual`, Croatian currency names, security terminology, Help labels and consistent financial headings. English mode and custom bank/file names remain available intentionally.
- Existing behavior assertions were retained; exact text expectations were updated only where the requested copy changed.
- `npm run test:cycle1`: 81 evaluation files passed.
- `npm run test:cycle2`: 90 evaluation files passed.
- Full Node test suite: 901 tests passed, zero failures.
- `npm run lint`: passed, 72 scripts and 495 unique static IDs.
- `npm run build`: passed, 1,140,176 bytes reported (22% smaller).
- Browser console: no warnings or errors in the checked local flow.

These results cover the tested states and viewport sizes, not every arbitrary data volume, zoom level or browser speech service. No credentials, API configuration or financial calculations changed.
