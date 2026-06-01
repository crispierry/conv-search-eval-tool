# Seed Query Set

The source of truth for starter conversational search queries is:

`src/data/seedQueries.json`

This file is plain JSON so the query and golden-set list can be edited offline without running the app or touching fixture response code.

## Editing Workflow

1. Edit `src/data/seedQueries.json`.
2. Keep every `id` stable after it has been used in an evaluation run.
3. Bump `version` when the query set changes in a way that should be visible in saved runs.
4. Run `npm run lint` and `npm run build`.
5. Open the Queries tab and confirm the seed query count and visible starter queries look right.

While the app is mock-driven, every new seed query also needs matching fixture root nodes in `src/data/evaluationFixtures.ts` for the current and baseline runs. Once live conversational search execution exists, the JSON file should remain the import/editing surface and fixtures can become optional snapshots.

## JSON Shape

The top-level object describes one query set:

- `name`: human-readable query set name.
- `version`: stable version label shown in the app, such as `seed-v2`.
- `description`: optional context for maintainers.
- `queries`: ordered list of starter queries.

Each query supports the PRD fields:

- `id`: stable query identifier. Use a short `seed-...` slug.
- `query`: realistic first-turn user query.
- `category`: intent type. Current app values include `cast`, `director`, `award`, `rating`, `mood`, `similar_to`, `compound`, `ambiguous`, and `exploratory`.
- `expected_media_type`: `movie`, `series`, `mixed`, or `unknown`.
- `expected_result_count`: optional `{ "min": number, "max": number }`.
- `constraints`: expectations the result set should satisfy.
- `golden_set`: strict-but-not-exhaustive required TMDB fixture media IDs.
- `notes`: product context shown in the query list.

## Golden Sets

Golden sets are required anchors, not the complete answer. Missing golden-set items should reduce golden coverage, but extra returned titles are allowed when they satisfy the query constraints.

Use IDs from `src/data/mediaCatalog.ts`, for example:

- `tmdb-movie-329865` for Arrival.
- `tmdb-movie-603` for The Matrix.
- `tmdb-tv-95396` for Severance.

If a needed title is not in the media catalog yet, add catalog metadata before using it in `golden_set`.
