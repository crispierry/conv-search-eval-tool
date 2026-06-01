# Conversational Search Evaluation Tool

A web application for evaluating conversational search experiences against TMDB-sourced movie and series metadata.

The first implementation is mock-driven but fully interactive. It uses lightweight TMDB-shaped fixtures for seed queries, conversation trees, poster art, metadata checks, quality scoring, human review, and trends. A TMDB client is included for future live enrichment when a read access token is provided.

## Current Focus

- Select saved evaluation runs and inspect run-level rollups.
- Review automated conversation-tree findings for seed queries and follow-ups.
- Validate or reject AI quality assessments with reviewer comments.
- Mark correctness gate findings as acknowledged or false positive.
- Report trends for Stage 1 failures, Stage 2 quality, golden-set coverage, follow-up depth, and repeated suggestion patterns.
- Keep TMDB as the source for movie and series metadata.

## Running The App

```bash
npm install
npm run dev
```

The development server will print a local URL. For live TMDB calls, copy `.env.example` to `.env.local` and set `VITE_TMDB_READ_ACCESS_TOKEN`. Without a token, the app runs from the included TMDB fixture data.

```bash
npm run lint
npm run build
```

## Documentation

- [Product requirements document](docs/PRODUCT_BRIEF.md)
- [Evaluation framework](docs/EVALUATION_FRAMEWORK.md)
- [Seed query set](docs/SEED_QUERIES.md)
- [Mock app requirements](docs/MOCK_APP_REQUIREMENTS.md)
- [Requirements Q&A](docs/REQUIREMENTS_QA.md)
- [Brainstorming notes](docs/BRAINSTORMING.md)
- [Work log](docs/WORK_LOG.md)
- [Decision log](docs/DECISIONS.md)
- [Contributing guide](CONTRIBUTING.md)
- [Security notes](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Project Status

Private early-stage project. V1 is a working web app with lightweight fixture data. Live conversational search execution, scheduled recurring runs, reviewer assignment, and exportable reports are future phases.

This product uses the TMDB API but is not endorsed or certified by TMDB. See the [TMDB API docs](https://developer.themoviedb.org/docs) and [image docs](https://developer.themoviedb.org/docs/image-basics) for the live metadata and poster conventions used by the implementation.

## Working Agreement

This repository should stay small and intentional until the evaluation experience is clear. Prefer writing down product intent, example workflows, and open questions before introducing implementation complexity.
