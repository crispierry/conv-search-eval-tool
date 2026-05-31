# Evaluation Framework

## Objective

Assess whether conversational search returns valid, relevant, safe, and useful entertainment recommendations across both initial queries and multi-turn follow-up paths.

## Evaluation Objects

- Seed query: the starting conversational search query imported into the tool.
- Node: one query or follow-up question and its returned response.
- Branch: one path from seed query through follow-up questions.
- Conversation tree: the seed query plus all explored follow-up branches.
- Evaluation run: one execution of a query set against a specific system, fixture set, or build.

Human reviewers primarily review individual nodes or paths. Automated evaluation scores every node and rolls findings up to branch, tree, and run summaries.

## Two-Stage Model

### Stage 1: Metadata And Correctness

Stage 1 checks whether the response is valid enough to judge.

Gate outcomes:

- Pass: the check succeeded.
- Warning: the check found an issue that should be reviewed but does not invalidate the response.
- Fail: the check found an objective correctness, safety, or completeness failure.

Stage 1 hard failures include:

- No results when results are expected.
- Wrong media type for strict movie-only or series-only queries.
- Missing required golden-set title.
- Returned result violates a cast, actor, director, award, rating, or time-period constraint.
- Returned result is missing poster art.
- Blocklisted offensive language or competitor mention appears in generated copy.
- Required response field is missing.

Stage 1 warnings include:

- Expected result count is outside target range but results remain useful.
- Golden-set titles appear lower than ideal.
- Metadata source is incomplete.
- Metadata sources disagree.
- Follow-up suggestions are repetitive but not unsafe.
- AI sensitivity review flags brand-risky or awkward language that does not match a hard-fail blocklist.

### Stage 2: Quality Scoring

Stage 2 evaluates experience quality after correctness has been checked.

Quality labels:

- Excellent: highly relevant, polished, and clearly successful.
- Good: successful with only minor issues.
- Needs Work: useful but noticeably flawed.
- Fail: poor, misleading, generic, irrelevant, or unusable.

Quality areas:

- Search results quality.
- Conversation blurb quality.
- Custom description quality.
- Follow-up suggestion quality.

## Search Results Quality

Search results quality includes the returned titles, result count, relevance, ranking, metadata fit, and poster completeness.

Checks:

- Does the result count meet the expected minimum and maximum when defined?
- Do all returned titles satisfy hard constraints?
- Do movie searches return movies?
- Do TV or series searches return series?
- Do cast, actor, director, award, rating, and time-period searches match the relevant metadata?
- Does every returned title include poster art?
- Do required golden-set titles appear?
- Are the best matches near the top?
- Are irrelevant or weak results appearing too high?

Golden sets are strict but not exhaustive. Required titles should appear, but additional valid titles may also be accepted.

## Conversation Blurb Quality

The conversation blurb should help the user understand the returned recommendations.

Checks:

- Is it relevant to the query?
- Does it avoid offensive language and competitor mentions?
- Does it avoid hallucinated claims?
- Does it explain the recommendation set clearly?
- Does it use friendly, natural language?
- Does it avoid overpromising when metadata is uncertain?

Blocklist matches are Stage 1 failures. AI sensitivity concerns are warnings or Stage 2 quality issues unless they trigger a hard gate.

## Custom Description Quality

Each returned title may include a custom description explaining why it matches the query.

Checks:

- Is the description accurate according to metadata?
- Does it explain why the title matches the query?
- Does it avoid generic filler?
- Is it specific to the title?
- Does it avoid offensive language and competitor mentions?
- Does it avoid unsupported claims?

## Follow-Up Suggestion Quality

Follow-up suggestions should help the user continue the conversation.

Node-level checks:

- Are suggestions relevant to the current query and response?
- Are they useful next steps?
- Are they diverse rather than repetitive?
- Are they safe and competitor-free?
- Do they make sense in the current conversation?

Execution checks:

- Click every suggested follow-up.
- Evaluate the returned response as a new node.
- Continue each branch to depth 5.
- Track whether the conversation stays coherent as depth increases.

Aggregate checks:

- Record every follow-up suggestion shown.
- Track common suggestions and repeated phrasing.
- Identify overrepresented genres, entities, themes, or media types.
- Identify possible bias or narrowness in suggested follow-ups.
- Compare repetition and quality by query category and depth.

## Automated Conversation Tree Evaluation

Automated evaluation should use a bounded exhaustive tree.

For each seed query:

- Evaluate the initial response.
- Capture all follow-up suggestions.
- Click each suggestion.
- Continue independently to depth 5.
- Run branches in parallel when live execution exists.
- Deduplicate repeated follow-up suggestions.
- Stop branches that return no useful continuation.
- Apply a max-path safety cap per seed query.

V1 can simulate this behavior with fixture data.

## Rollups

Findings should be captured at the most specific level possible and rolled up.

- Result-level: title-specific metadata, poster, and description findings.
- Node-level: response-level gates and quality labels.
- Branch-level: sequence of node results and depth coherence.
- Tree-level: seed query summary across all branches.
- Run-level: aggregate status across the query set.

Rollups should preserve evidence, not just final labels.

## Metadata Validation

TMDB is the source for movie and series metadata in the V1 implementation.

Each validation check should record:

- Metadata source used.
- Field checked.
- Expected value.
- Actual value.
- Outcome.
- Evidence or note.

If TMDB metadata is missing or incomplete, record a warning or hard failure according to the specific gate. Fixture data should remain shaped like TMDB responses so future live enrichment is straightforward.

## Human Review

Human reviewers should see the AI assessment by default.

For each quality area, reviewers can:

- Approve the AI assessment.
- Reject the AI assessment.
- Change the quality label.
- Add a comment.

For Stage 1 gates, reviewers can:

- Acknowledge the finding.
- Add a comment.
- Mark a false positive.

The original automated result and human override must both remain visible in the audit trail.

## Trend Metrics

The app should support trend views across dated runs.

Core metrics:

- Overall pass/fail rate.
- Stage 1 hard failure rate.
- Average Stage 2 quality by area.
- Quality by query category.
- Quality by expected media type.
- Golden-set coverage.
- Follow-up depth quality.
- Repeated follow-up suggestion rate.
- Top recurring failure reasons.
