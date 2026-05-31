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

### 2026-05-31: Use TMDb For First Prototype Metadata

Decision: Use TMDb as the entertainment metadata source for the first prototype.

Context: The prototype needs movie, TV, people, image, and search metadata to exercise conversational search evaluation workflows. IMDb Enterprise data and WBD enterprise data are expected future production sources, but they require separate licensing, access, and integration work.

Alternatives considered:

- Build the prototype directly on IMDb Enterprise data.
- Build the prototype directly on WBD enterprise data.
- Use static fixtures only.
- Use OMDb as the prototype metadata API.

Consequences:

- The prototype can move faster while the evaluation workflow is still being shaped.
- The product must keep metadata access behind a replaceable adapter.
- Reviewer, scenario, scoring, and reporting models should not depend on TMDb-specific field names.
- A future migration plan will be needed for IMDb Enterprise and WBD enterprise data.
