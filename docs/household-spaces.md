# Local household spaces

The shared-space interface is an explicitly local prototype. It does not invite users, send messages, connect another account, transfer funds, or synchronize devices. Participant names are local ledger labels. The UI states this before creation and inside the space.

## Data boundary

Each space is stored under the active profile's `enterprise.households`. It carries the authenticated owner's `ownerUserId` and the exact `personal` or `business` `profileId`. `listSpaces` and `applyCommand` require both to match. There is no traversal into another user's encrypted cache and no route granting an alias access to another authenticated account.

Bills and contributions belong to a separate ledger. Recording either does not add, edit, or delete a personal/business transaction, goal, bank balance, or tax entry. The displayed fund balance is recorded contributions minus recorded paid bills. Outstanding bills are subtracted separately to show available funds after commitments. Future contributions and future-dated bill payments do not change current balances.

All amounts use integer cents. Equal splits allocate remainder cents in the explicit participant order so shares always sum to the exact original total. Ratios are bounded to 0–100 visually while negative fund balances remain visible numerically.

## Permissions and preview

| Role | Bills and contributions | Members and roles |
| --- | --- | --- |
| Owner | Edit | Edit |
| Editor | Edit | Read |
| Viewer | Read | Read |

The owner can select a participant to preview their permissions. The preview operates on a cloned space. Preview edits are never written through the reactive bridge and disappear when the preview ends. The interface labels it as an unsaved simulation. It is not evidence that another person acted or authenticated.

Persisted mutations execute through `MerEnterpriseBridge.mutateHousehold` with a fresh user/profile check inside the mutation callback. `MerHouseholdUI.render()` closes the dialog on a user or profile switch. Native dialog constraints keep the document viewport fixed and scroll only the modal body on small displays.

## Required before real partner access

Real collaboration needs an authenticated backend with household membership records, server-side owner/editor/viewer authorization on every read and write, invitations with an explicit acceptance flow, separate shared-ledger storage, audit events attributed to authenticated actors, conflict handling, and revocation. With encrypted sharing, keys must be distributed to authorized members and rotated after revocation; a client-side role selector is not an authorization boundary. None of those remote operations is simulated as completed by this prototype.

## Evaluation

`tests/household-cycle-1.test.js` checks exact splits, role enforcement, user/profile separation, immutability, and unchanged primary financial ledgers.

`tests/household-cycle-2.test.js` checks 40 bills, future-date/leap-day behavior, invalid stored spaces, and UI contracts for nonpersistent preview, modal dismissal, touch targets, and responsive internal scrolling.
