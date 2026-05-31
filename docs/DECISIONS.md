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
