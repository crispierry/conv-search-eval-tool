# Brainstorming

Use this space to keep product thinking, open questions, and future ideas visible while the PRD evolves.

## Current Product Direction

The tool should help the product team evaluate conversational search quality across imported seed queries, automated follow-up paths, and human review.

The first mock should make the evaluation flow obvious:

- Import seed queries.
- Simulate conversational search responses.
- Evaluate metadata and correctness gates.
- Score quality areas.
- Review field-level results, generated copy, follow-up suggestions, and gate findings as a human.
- Track results over time.

## Agreed Requirements

- V1 is mostly mock-only with lightweight fixture data.
- The main audience is the product team.
- The tool should feel like a friendly internal dashboard.
- Automated evaluation should explore suggested follow-ups as a bounded exhaustive tree to depth 5.
- Follow-up branches should be parallelizable in future live execution.
- Human review should focus on one query run or response node at a time.
- Every follow-up suggestion should be recorded for later aggregate analysis.
- The app should separate Stage 1 correctness gates from Stage 2 quality scoring.
- Licensed enterprise metadata is primary when available, with IMDb-style metadata as fallback or reference.
- Trend reporting should show whether quality improves across dates and runs.

## Query Categories To Support

Potential `category` values:

- `known_title`
- `media_type`
- `cast`
- `actor`
- `director`
- `award`
- `time_period`
- `rating`
- `genre`
- `mood`
- `similar_to`
- `compound`
- `ambiguous`
- `exploratory`

These categories are for reporting and evaluation behavior. They are distinct from `expected_media_type`, which describes whether results should be movies, series, mixed, or unknown.

## Constraints To Support

Seed queries may include constraints such as:

- Expected media type.
- Expected result count range.
- Required cast member.
- Required actor.
- Required director.
- Required award win.
- Year or time-period range.
- Rating.
- Genre.
- Golden-set titles.

Open question: which constraints should be required in the import file versus inferred by AI?

## Follow-Up Suggestion Analysis Ideas

Aggregate follow-up analysis should help answer:

- Are the same follow-up suggestions appearing too often?
- Are suggestions biased toward certain genres, titles, entities, or moods?
- Are suggestions overusing safe generic prompts?
- Are suggestions failing to diversify the conversation?
- Does suggestion quality degrade by depth?
- Do some query categories produce better follow-ups than others?

## Trend Dashboard Ideas

The trend view should help answer:

- Is the system improving over time?
- Did a new run reduce hard failures?
- Which quality area is improving fastest?
- Which query categories remain weak?
- Are follow-up suggestions becoming more diverse?
- Are golden-set titles appearing more reliably?

## Product Experience Notes

- Use product-readable labels instead of technical jargon where possible.
- Keep AI assessment context visible or reachable, clearly labeled.
- Make failures easy to scan.
- Preserve evidence for every failure.
- Make human review fast: approve or reject individual fields, judge result validity, correct rank position, and comment where the issue occurs.
- Avoid overbuilding synthetic data for the first mock.

## Open Questions

- What exact competitor names should be included in the V1 blocklist?
- What initial offensive or prohibited language list should be used?
- What should the max-path safety cap be for a seed query?
- Should result count targets be defined per query, per category, or both?
- Should reviewer calibration be part of V1 or a future phase?
- What export format will product and engineering want first?
- What metadata fields will be available from a future enterprise source?

## Future Product Surface

- Scenario library.
- Rubric builder.
- Side-by-side system comparison.
- Reviewer assignment and progress tracking.
- Calibration mode.
- Failure taxonomy management.
- Exportable reports.
- Scheduled recurring evaluations.
- Live conversational search API integration.
- Enterprise metadata integration.
- IMDb or third-party metadata enrichment.
