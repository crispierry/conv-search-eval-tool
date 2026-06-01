# Work Log

Use this file to capture lightweight pending product and UX work items before they become implementation tasks, product requirements, or decisions.

## Protocol

- Every item gets a stable `WL-#` ID.
- References like "Worklog 5", "Work log 5", and `WL-5` all point to the same item.
- Open items use `- [ ]`; completed items use `- [x]`.
- Only mark an item complete after the user confirms it is done.
- Do not renumber existing items.

## 2026-06-01

### Open

- [ ] WL-7 - Human-review scoring semantics: decide how Check/X judgments should affect Stage 2 quality scores and trend rollups, including whether binary decisions map directly to quality labels or remain separate audit fields.
- [ ] WL-8 - Rank-position approval affordance: make it possible to explicitly approve the current rank position without changing the correct-position dropdown away and back.

## 2026-05-31

### Open

- [ ] WL-2 - Ad hoc human-review queries: in human evaluation, allow reviewers to type a new query that is not in the existing query list. When submitted, add that query to the query list so it becomes part of the evaluated set.
- [ ] WL-3 - Conversation depth visibility: make it clear how to view conversation tree depth levels 2, 3, 4, and 5 in the UX, including where each follow-up path lives and how reviewers navigate between depths.
- [ ] WL-4 - Human-review feedback model: field-level review is drafted in the app for conversation blurbs, result validity, rank position, AI custom blurbs, follow-up suggestions, correctness gates, and reviewer commentary. Keep this open until the user confirms the model is done.
- [ ] WL-6 - Golden-set query editorial tool: create an internal editor for building and maintaining the seed query JSON file, including starter query text, expected media type, constraints, golden-set title lookup, versioning, validation, and offline import/export.

### Done

- [x] WL-1 - Query execution list tab: added a UX tab that shows the list of queries scheduled to run before or during evaluation.
- [x] WL-5 - Automated detail page redesign: moved the AI blurb to the top of the page, added approved/rejected indicators, and showed quality rankings beside the relevant content.
