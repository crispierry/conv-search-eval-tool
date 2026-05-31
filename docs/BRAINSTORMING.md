# Brainstorming

Use this space to shape the evaluation tool before committing to implementation details.

## Target Users

- Who will run evaluations?
- Who will consume the results?
- What decisions should the tool help them make?
- What level of search, ML, or product expertise should the workflow assume?

## What Good Conversational Search Means

- What does a great answer feel like to the user?
- When should the system answer directly?
- When should it ask a clarifying question?
- When should it show sources or search results?
- How should it handle uncertainty?

## Evaluation Dimensions

- Which dimensions are essential for launch readiness?
- Which dimensions are diagnostic but not part of the final score?
- Are there hard failure gates, such as hallucinated claims or missing source support?
- Should different query classes have different criteria?

## Test Conversation Design

- What kinds of conversations should be in the evaluation set?
- Should scenarios be scripted, generated, or sampled from real usage?
- How many turns should a typical evaluation conversation include?
- How should follow-up questions, refinements, and corrections be represented?

## Scoring And Rubrics

- Should reviewers use numeric scores, labels, checklists, or free-form notes?
- What does each score mean in practice?
- How much disagreement between reviewers is acceptable?
- Should the tool support calibration examples?

## Reviewer Workflow

- What does a reviewer see first?
- Should reviewers evaluate one turn at a time or the whole conversation?
- What information should be hidden to reduce bias?
- What context should always be visible?
- How should reviewers flag uncertain judgments?

## Reporting Needs

- What summary views would be useful after an evaluation run?
- What should be exportable?
- Which comparisons matter: model versions, retrieval configs, query classes, or time periods?
- What charts or tables would make product decisions easier?

## Future Product Surface

- Scenario library.
- Rubric builder.
- Side-by-side conversation comparison.
- Reviewer assignment and progress tracking.
- Calibration mode.
- Failure taxonomy.
- Exportable reports.
- Integration with search logs or experiment runs.

## Parking Lot

- Could the tool support automated judges later?
- Should it ingest raw conversations or structured test cases?
- Should it compare multiple candidate systems in the same review flow?
- What should be anonymized or redacted before review?
