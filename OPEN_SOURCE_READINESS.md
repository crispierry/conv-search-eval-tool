# Open-Source Readiness

## Status

Ready for a public source release after the maintainer confirms the chosen license and repository settings.

## What Was Checked

- License file is present.
- Package metadata includes license, repository, issue, homepage, description, and keywords.
- README no longer frames the repository as private.
- Contributing, security, code-of-conduct, issue-template, pull-request-template, and third-party-notice artifacts are present.
- `.env.example` contains only an empty placeholder for the optional TMDB token.
- Repository ignores local environment files, dependency folders, and build output.
- Public docs call out TMDB attribution and third-party metadata ownership.

## Publication Notes

- Confirm that MIT is the intended license before changing repository visibility.
- Confirm that fixture metadata and poster paths are acceptable for the intended public use case under TMDB's current terms.
- Keep real user conversations, private query logs, proprietary evaluation data, API keys, and access tokens out of the repository.
- Enable GitHub private vulnerability reporting if available.
- Add a short GitHub repository description and topics after publishing.

## Current Non-Blocking Product Work

The app still has known product follow-ups documented in `docs/WORK_LOG.md`, including human-review scoring semantics and rank-position approval behavior. These do not block publishing the source code, but they should stay visible to contributors.
