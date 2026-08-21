# Competitive analysis and product decisions

Reviewed against current official product and help documentation in August 2026.

## What premium competitors do well

- [YNAB](https://www.ynab.com/features) combines a deliberate budgeting method with bank import, target-based saving, loan planning, reports, household sharing, and two-factor authentication. Its [goal tracking](https://www.ynab.com/features/goal-tracking) makes targets actionable with progress, dates, reminders, and calculated contribution amounts.
- [Monarch Money](https://help.monarchmoney.com/hc/en-us/articles/360048393272-Getting-Started-Guide) brings accounts, custom categories, goals, net worth, budgets, and household collaboration into one model. Its [transaction rules](https://help.monarchmoney.com/hc/en-us/articles/360048393372-Transaction-rules) can rename, recategorize, tag, hide, split, review, or connect matching transactions to goals.
- [Copilot Money](https://help.copilot.money/en/articles/11157550-quick-start-guide) emphasizes automatic account import, review, recurring detection, cash-flow comparisons, savings goals, and learned categorization. Its [bank category rules](https://help.copilot.money/en/articles/13978302-bank-category-rules) apply corrections to historical and future transactions.
- [Revolut Analytics](https://help.revolut.com/help/accounts/budget-and-analytics/how-can-i-see-my-spending-and-income-analytics/) provides fast spend/income comparisons, multiple chart types, flexible timeframes, merchant/category/country/card breakdowns, and custom categories directly beside the account data.

## Highest-impact gaps selected for this release

### 1. Purpose-based savings goals

The previous single emergency fund could not represent several real goals at once. This release adds isolated goal buckets with a target, current amount, optional deadline, progress, editable primary goal, and goal-specific deposits. The primary goal feeds the Dashboard while every goal remains visible in Savings.

### 2. User-defined categorization rules

Imports are only valuable when repeated cleanup becomes unnecessary. Each profile now owns an ordered set of keyword, transaction-type, and category rules. The same rule engine runs before built-in heuristics for both bank synchronization and CSV/Excel import, without crossing Personal/Business boundaries.

## Deferred opportunity

Shared/family collaboration is valuable, but it requires real identity, invitations, access roles, audit history, and server-side storage. Implementing a cosmetic local version would weaken the strict profile-isolation and security model, so it remains a backend milestone rather than a misleading prototype feature.
