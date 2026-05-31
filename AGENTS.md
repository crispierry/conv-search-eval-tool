# Global Workflow Notes

## Worktree Bootstrap

When creating a new Git worktree for any project on this machine, use `wt` or `git wt` instead of plain `git worktree add` so the worktree is bootstrapped immediately.

If a worktree already exists and was not created with the helper, run `wt bootstrap` inside it before starting verification.

Before running `lint`, `test`, `build`, or other repo-local tooling, confirm the bootstrap step completed successfully so local dependencies such as `eslint`, `vite`, or Python venv packages are available in that worktree.
