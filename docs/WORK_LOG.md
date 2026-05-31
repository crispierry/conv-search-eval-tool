# Work Log

Use this file to capture lightweight pending product and UX work items before they become implementation tasks, product requirements, or decisions.

## Protocol

- Every item gets a stable `WL-#` ID.
- References like "Worklog 5", "Work log 5", and `WL-5` all point to the same item.
- Open items use `- [ ]`; completed items use `- [x]`.
- Only mark an item complete after the user confirms it is done.
- Do not renumber existing items.

## 2026-05-31

### Open

- [ ] WL-2 - Ad hoc human-review queries: in human evaluation, allow reviewers to type a new query that is not in the existing query list. When submitted, add that query to the query list so it becomes part of the evaluated set.
- [ ] WL-3 - Conversation depth visibility: make it clear how to view conversation tree depth levels 2, 3, 4, and 5 in the UX, including where each follow-up path lives and how reviewers navigate between depths.
- [ ] WL-4 - Human-review feedback model: re-evaluate how reviewers provide feedback on individual results, not just the overall AI assessment. The UX should make it easy to mark a title as not relevant, flag a custom blurb or description as not relevant, and provide clear per-result or per-field corrections where needed.
- [ ] WL-5 - Automated detail page redesign: move the AI blurb to the top of the page because it is the first thing the end user sees. Add a clear pass/fail indicator, such as a check mark or X, for whether the title blurb was approved or rejected by AI. Show the quality ranking beside the relevant content using the agreed four-level scale: Excellent, Good, Needs Work, and Fail.

### Done

- [x] WL-1 - Query execution list tab: added a UX tab that shows the list of queries scheduled to run before or during evaluation.
