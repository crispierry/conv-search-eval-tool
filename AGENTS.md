# Global Workflow Notes

## Worktree Bootstrap

When creating a new Git worktree for any project on this machine, use `wt` or `git wt` instead of plain `git worktree add` so the worktree is bootstrapped immediately.

If a worktree already exists and was not created with the helper, run `wt bootstrap` inside it before starting verification.

Before running `lint`, `test`, `build`, or other repo-local tooling, confirm the bootstrap step completed successfully so local dependencies such as `eslint`, `vite`, or Python venv packages are available in that worktree.

## Work Log Protocol

Track pending product and UX work in `docs/WORK_LOG.md`.

- Assign every work log item a stable ID in the `WL-#` format.
- Keep IDs permanent; do not renumber items after they are created.
- Treat user references such as "Worklog 5", "Work log 5", and `WL-5` as the same item.
- Use Markdown checkboxes: `- [ ]` for open work and `- [x]` for completed work.
- Do not mark an item complete until the user explicitly confirms it is done.
