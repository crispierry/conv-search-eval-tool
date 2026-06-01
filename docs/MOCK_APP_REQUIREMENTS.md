# Mock App Requirements

## Purpose

Create a friendly internal dashboard mock that demonstrates the conversational search evaluation workflow for the product team.

The mock should prioritize clarity of flow over data completeness. It should use lightweight static fixtures and make the future product experience easy to understand.

## Design Direction

The app should feel like an internal tool that is approachable and easy to scan.

Principles:

- Friendly language.
- Clear status labels.
- Compact but not cramped layout.
- Obvious next actions.
- Product-readable terminology.
- Enough detail for reviewers without overwhelming them.
- Trend views that make improvement over time easy to see.

Avoid:

- Consumer landing-page styling.
- Heavy technical jargon.
- Overly dense engineering dashboards.
- Large synthetic datasets that distract from the workflow.

## Core Screens

### Query Sets And Runs

Purpose: show imported seed queries and evaluation runs.

Should include:

- Query set name and version.
- Run date and run label.
- Overall status.
- Stage 1 failure rate.
- Stage 2 quality summary.
- Number of seed queries.
- Number of explored follow-up paths.
- Quick access to run detail.

### Automated Run Detail

Purpose: show what the automated evaluator found.

Should include:

- Seed query list and status.
- Conversation tree depth and coverage.
- Stage 1 gate summary.
- Stage 2 quality summary.
- Recurring failure reasons.
- Follow-up suggestion pattern summary.
- Metadata source summary.
- Golden-set coverage.

### Human Review Detail

Purpose: let a reviewer validate the returned response and the AI-generated explanation fields.

Should include:

- Seed query and current follow-up path.
- Conversation context.
- Returned titles with poster art.
- Result validity review for each returned title.
- Rank-position review for each returned title.
- Conversation blurb review.
- AI custom blurb review for each returned title.
- Follow-up suggestion review.
- Stage 1 gate findings and evidence.
- Reviewer controls: clear check/X judgment and commentary for each reviewable field.
- Stage 1 controls: acknowledge, comment, mark false positive.
- A scrollable Human Judgment column so long gate and follow-up sections remain reachable.

### Trends And Reports

Purpose: show whether quality is improving over time.

Should include:

- Overall pass/fail trend by run date.
- Stage 1 hard failure trend.
- Stage 2 quality trend by area.
- Breakdown by query category.
- Breakdown by expected media type.
- Golden-set coverage trend.
- Follow-up depth quality trend.
- Top recurring failure reasons.
- Follow-up suggestion repetition and bias indicators.

## Data Fixtures

V1 should use a small amount of fixture data.

Fixtures should be sufficient to show:

- One or more seed queries.
- Returned results with posters.
- A blurb.
- AI custom blurbs.
- Follow-up suggestions.
- Simulated follow-up responses.
- Stage 1 pass, warning, and fail examples.
- Stage 2 quality labels.
- One or two trend points across runs.

The mock does not need a large synthetic dataset.

## Interaction Requirements

The mock should demonstrate:

- Selecting an evaluation run.
- Opening a seed query or conversation node.
- Seeing automated findings.
- Reviewing field-level human judgments for results, copy, follow-ups, and gates.
- Approving or rejecting conversation blurbs, title relevance, rank position, AI custom blurbs, and follow-up suggestions.
- Adding reviewer commentary at the field, title, suggestion, or gate level.
- Seeing how a finding rolls up to the run summary.
- Viewing trend charts or summaries over time.

## Content Requirements

Use labels that are easy for product teammates to understand:

- Correctness Gates.
- Quality Scores.
- Search Results.
- Blurb.
- AI custom blurb.
- Follow-Up Suggestions.
- Needs Review.
- Hard Failure.
- Warning.
- Approved.
- Rejected.

## Future Hooks

The mock should leave conceptual room for:

- Live API execution.
- Parallel follow-up branch workers.
- Enterprise metadata validation.
- IMDb-style metadata enrichment.
- Scheduled runs.
- Exportable reports.
- Reviewer assignment.
