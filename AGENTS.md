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

## Website Publishing Contract

This repository is the source of truth for the conversational search evaluation tool published on Cristiano Pierry's website.

- Source repo: `/Users/cris/Documents/github/conv-search-eval-tool`
- Website repo: `/Users/cris/Documents/github/cris pierry website`
- Published artifact in website repo: `public/project-apps/conv-search-eval/`
- Website route: `/projects/conv-search-eval`
- Static app base path: `/project-apps/conv-search-eval/`
- Import command in website repo: `npm run build:conv-search-eval`
- Worktree override: `CONV_SEARCH_EVAL_ROOT=/path/to/conv-search-eval-worktree`

For a production update:

1. Make and verify source changes in this repo.
2. Run `npm run lint` and `npm run build`.
3. Commit and push this repo.
4. In `/Users/cris/Documents/github/cris pierry website`, run `npm run build:conv-search-eval`.
5. Run `npm run build` in the website repo.
6. Commit and push the refreshed website artifact.
7. Wait for the website Netlify deploy to be `ready`.
8. Verify `https://crispierry.com/projects/conv-search-eval` and `https://crispierry.com/project-apps/conv-search-eval/index.html`.

The older `/Users/cris/Documents/github/conv search` prototype is not the website publishing source for this tool.
