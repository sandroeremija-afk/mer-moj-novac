# Contextual planning and modal regression evaluation

## Scope

- Overview: **Novčani tok** contains the existing 30-day forecast and what-if scenario. Unrelated receipt, FIRE, renewal and tax buttons are removed; the duplicate payday-rule editor is retired.
- Budgets: **Plaćanja i pretplate** opens a small contextual menu for scheduled payments, detected subscriptions and renewal reminders.
- Savings: **Planiranje štednje** exposes the existing monthly plan, automatic savings rules, FIRE simulator and Business-only tax vault.
- Activity: **Skeniraj račun** remains visible. Receipt matching still attaches reviewed data to existing transactions; it does not silently create a financial entry.
- Existing footer navigation, notification hierarchy, minimalist goal forms and live camera implementation are retained and regression-tested.

## Evaluation cycle 1 — architecture and navigation

- Browser walkthrough at 1440 × 900 and 1366 × 768: forecast has only two relevant tabs; contextual menus open the intended tools.
- Scheduled payments → new recurring expense → Back → scheduled payments → Back → payments menu works, restoring focus to the originating action.
- Savings → FIRE → edit an unsaved contribution to 475 → Back → FIRE retains the draft without posting a transaction.
- Savings → monthly plan preserves its own Previous-step behavior; first-step Back returns to the Savings menu.
- Auto-Stash opens the existing vault editor, not a second implementation of the same rule.
- Personal menu omits the tax vault. Business menu includes it, and the tax handler also checks the active profile.
- Automated tests cover single dispatch, singleton dialogs, profile/user/reset/lock guards, local receipt Back, nested routing and focus.
- Automatic price-hike warnings were moved into the subscription dialog. Detected subscriptions and their notifications now use the same profile/currency-safe selector, excluding offline/pending records and demo aggregate history.

## Evaluation cycle 2 — responsive UI and existing features

- New menu inspected in Light and Dark. At 375 × 812 and 375 × 667, its complete list and footer fit without inner scrolling or horizontal page overflow, including the four-item Business menu.
- Mobile FIRE keeps one bounded body scroller and a visible footer: Back and Save remain on the same baseline at y=751 in an 812px viewport. The body may scroll because the full simulator cannot responsibly fit into a phone screen.
- Notification titles measured at 16px / 600; action links at 12px / 500 and secondary actions at 12px / 400. Dark-mode text uses light contrasting colors.
- New goal form has no icon/emoji picker. Amounts, date and primary-goal control remain intact.
- English labels update for both module entry points and contextual menu content. Escape and backdrop dismissal return focus to the module toolbar.
- Camera button opens the live-preview screen and requests camera access without audio or an AI upload. The embedded browser remains at its permission-wait state, so **physical camera capture is not verified**. Camera tests use synthetic streams/frames; the pending-permission matrix covers Back, Close, Choose File, profile switch and locked/hidden states, discards late streams and sends no AI requests.
- No browser console errors observed during the inspected workflows.

## Build and regression gate

`npm run check` runs syntax/asset preflight, the full evaluation suite and the minified production build. The full 140-file suite passed after updating obsolete assertions for relocated header actions. The production bundle retains hashed asset URLs and PWA update handling.

No financial records, real bank connections or live receipt images were changed/sent during browser evaluation; demo preferences and an unsaved simulator draft were used.
