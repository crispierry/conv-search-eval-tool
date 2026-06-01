# Contributing

Thanks for your interest in improving the Conversational Search Evaluation Tool. This is an early-stage open-source project, so the best contributions clarify the evaluation experience before adding implementation complexity.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Local Setup

```bash
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm run lint
npm run build
```

## Working Style

- Prefer small, focused changes.
- Capture product decisions in `docs/DECISIONS.md`.
- Add open questions to `docs/BRAINSTORMING.md`.
- Keep documentation practical and easy to update.
- Do not commit real user conversations, private evaluation data, API keys, or access tokens.
- Keep TMDB usage attributed and avoid implying TMDB endorsement.

## Before Adding Code

Before introducing an application framework or service dependency, document:

- The user workflow it supports.
- The evaluation data it needs.
- The tradeoffs or constraints it introduces.
- How the behavior will be tested.

## Commits

Use clear commit messages that describe the change in plain language.

## Pull Requests

Please include:

- What changed.
- Why the change is useful.
- Screenshots or short notes for visible UI changes.
- The verification you ran.
