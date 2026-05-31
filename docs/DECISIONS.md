# Decision Log

This file records meaningful product and technical decisions as the project evolves.

## Format

Each decision should include:

- Date.
- Decision.
- Context.
- Alternatives considered.
- Consequences.

## Decisions

### 2026-05-31: Start Documentation-First

Decision: Begin with product and evaluation documentation before choosing a technical stack.

Context: The project is new, and the evaluation experience needs to be clarified through brainstorming.

Alternatives considered:

- Start with a frontend prototype immediately.
- Choose a full application stack before defining the workflow.

Consequences:

- The early repo stays lightweight.
- Product intent can guide future implementation choices.
- Some technical decisions remain intentionally open.

### 2026-05-31: Define V1 As Mock-Driven Evaluation Flow

Decision: V1 will focus on a mock/static-data evaluation flow for conversational search rather than live API integration.

Context: The correct conversational search API is not available yet. The immediate objective is to create a clear product artifact and mock implementation that the product team can review and expand.

Alternatives considered:

- Integrate a live API immediately.
- Build a large synthetic dataset before validating the workflow.

Consequences:

- The first app can focus on evaluator workflow, scoring, and reporting.
- Fixture data should stay lightweight and easy to expand.
- Live API execution remains a future phase.

### 2026-05-31: Use Two-Stage Evaluation

Decision: Separate metadata and correctness gates from quality scoring.

Context: Some issues are objective failures, such as wrong media type, missing poster art, missing required golden-set titles, offensive language, or competitor mentions. Other issues are subjective quality judgments.

Alternatives considered:

- Use a single quality score for everything.
- Treat every issue as an immediate hard failure.

Consequences:

- The tool can distinguish invalid responses from lower-quality but valid responses.
- Human reviewers can validate AI quality judgments without losing objective failure evidence.
- Reporting can show both correctness failure trends and quality trends.

### 2026-05-31: Implement V1 As A React TMDB Fixture App

Decision: Build the first working version as a Vite, React, and TypeScript web app with TMDB-shaped fixture data and a small TMDB client layer.

Context: The repo had product documentation but no runnable app. The product team needs a reviewable internal dashboard that demonstrates run selection, automated findings, human review, and trends. Movie and series metadata should come from TMDB.

Alternatives considered:

- Keep the repo documentation-only.
- Build static HTML without typed fixtures or reusable evaluation rollups.
- Require a live TMDB token before the first app can run.

Consequences:

- The app works offline from fixtures while preserving TMDB IDs, poster paths, metadata source labels, and attribution.
- A live TMDB read token can be added later through `VITE_TMDB_READ_ACCESS_TOKEN`.
- The V1 user experience is now testable through lint, production build, and local browser verification.

### 2026-05-31: Evaluate Follow-Ups As Conversation Trees

Decision: Automated evaluation should explore suggested follow-ups as a bounded exhaustive tree to depth 5.

Context: Conversational search quality depends on how well the system handles follow-up questions, not just the first response.

Alternatives considered:

- Evaluate only seed query responses.
- Sample one follow-up path manually.

Consequences:

- The evaluator can surface failures that appear later in a conversation.
- Each follow-up branch should be parallelizable in future live execution.
- The app must record all follow-up suggestions for aggregate repetition and bias analysis.
