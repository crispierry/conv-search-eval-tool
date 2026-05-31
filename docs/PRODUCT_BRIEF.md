# Product Requirements Document

## Purpose

Build an internal evaluation tool that helps the product team understand whether conversational search is getting better over time and what is still failing.

The tool should support automated evaluation of imported conversational search queries, human review of AI assessments, and trend reporting across evaluation runs.

## Primary Audience

The first audience is the product team. The PRD and mock should use product-readable language while giving design and engineering enough structure to continue the work.

Secondary audiences include search engineers, ML engineers, UX researchers, and human evaluators.

## Product Goal

The tool succeeds if the team can answer:

> Is conversational search getting better over time, and what is still failing?

## V1 Scope

V1 is mostly mock-driven. The correct conversational search API is not available yet, so the first implementation should simulate the conversational workflow with lightweight static fixtures while using TMDb as the first prototype entertainment metadata source.

In scope:

- Import a list of seed conversational search queries.
- Associate optional golden sets and expected constraints with each query.
- Load lightweight simulated search responses.
- Use TMDb metadata for first prototype examples and validation, behind a replaceable metadata adapter.
- Evaluate each response with two stages: correctness gates and quality scoring.
- Explore suggested follow-up questions as a bounded conversation tree.
- Support human review of AI assessments.
- Record full evaluation snapshots.
- Show run-level trends and recurring failure patterns.

Out of scope for V1:

- Live conversational search API integration.
- Production WBD metadata integration.
- Real IMDb Enterprise API dependency.
- Scheduled recurring automated runs.
- Full user management or permissions.
- Large synthetic data generation.

## Evaluation Model

The core automated unit is a seed query that expands into a conversation tree.

The core human review unit is a query run or conversation node: one query or follow-up question plus the returned response, result set, blurb, custom descriptions, and follow-up suggestions.

Each response is evaluated in two stages:

- Stage 1: metadata and correctness gates.
- Stage 2: quality scoring.

The four primary quality areas are:

- Search results quality.
- Conversation blurb quality.
- Custom description quality.
- Follow-up suggestion quality.

Result count is treated as a sub-check of search results quality, not as a separate top-level quality area.

## Seed Query Import

The app should maintain a separate structured file for initial conversational search queries.

Each seed query should support:

- `id`: stable query identifier.
- `query`: starter conversational search query.
- `category`: search intent type, such as `cast`, `director`, `award`, `rating`, `mood`, `similar_to`, `compound`, or `ambiguous`.
- `expected_media_type`: `movie`, `series`, `mixed`, or `unknown`.
- `expected_result_count`: optional minimum and maximum result count.
- `constraints`: optional cast, actor, director, award, year range, rating, genre, or other expected conditions.
- `golden_set`: optional required titles that should appear in results.
- `notes`: optional product context.

`category` describes the kind of user intent. `expected_media_type` describes whether the returned titles should be movies, series, mixed, or unknown.

## Golden Sets

Golden sets are strict but not exhaustive.

- Titles in a golden set are expected to appear in the returned results.
- Missing golden-set titles should be flagged.
- Extra returned titles are allowed when they still satisfy the query constraints.
- The app should report golden-set coverage as a percentage.
- If no golden set is defined, the app should evaluate results using metadata, constraints, and AI judgment.

## Automated Evaluation

For each imported seed query, the evaluator should:

- Evaluate the initial response.
- Record all follow-up suggestions shown by the system.
- Click every suggested follow-up question.
- Continue each branch independently to depth 5.
- Treat each branch as parallelizable work.
- Deduplicate repeated follow-up questions.
- Stop dead-end branches.
- Apply a max-path safety cap per seed query.

The system is expected to return approximately 3 to 5 suggested follow-up questions at each node. V1 can simulate this with fixture data, but the product model should assume automated traversal once a live API exists.

## Follow-Up Suggestion Analysis

Follow-up suggestions should be evaluated at two levels.

At the node level:

- Are the suggestions relevant?
- Are they useful?
- Are they diverse rather than repetitive?
- Are they safe and competitor-free?
- Do they make sense in the current conversation?

At the aggregate level:

- Which follow-up suggestions appear most often?
- Are there repeated phrasing patterns?
- Are some genres, entities, themes, or media types overrepresented?
- Are some suggestion types underrepresented?
- Is there evidence of bias or narrowness in the system's suggestions?
- Does repetition increase by depth or query category?

## Metadata Source

For the first prototype, the app should use TMDb as the entertainment metadata source. TMDb gives the project a lower-friction way to exercise movie, TV, people, image, and search workflows while the evaluation experience is still being designed.

The prototype should avoid coupling the reviewer workflow, scenario model, scoring surfaces, or reporting logic directly to TMDb-specific fields. The metadata layer should be treated as a replaceable adapter so the project can later swap in licensed IMDb Enterprise data and WBD enterprise data without redesigning the evaluation product.

The app should support three metadata source concepts:

- TMDb metadata as the first prototype source.
- WBD enterprise metadata as the future primary source of truth.
- IMDb Enterprise metadata as a future fallback or reference source.

Rules:

- V1 should keep metadata access behind a replaceable adapter.
- V1 can combine TMDb responses with static fixtures where needed to simulate unavailable WBD or IMDb fields.
- Correctness gates should record TMDb as the metadata source for movie and series checks in the prototype.
- TMDb title, media type, cast, crew, release year, rating, overview, and poster path fields should be preserved in evaluation snapshots when available.
- Missing or incomplete TMDb metadata should be recorded as a warning or hard failure according to the Stage 1 rules.
- Reviewer, scenario, scoring, and reporting models should not depend on TMDb-specific field names.
- If WBD enterprise metadata is available, correctness gates should use WBD as the source of truth.
- If WBD enterprise metadata is unavailable, IMDb Enterprise metadata can be used as fallback.
- If sources disagree, record a metadata conflict warning.
- Every validation check should record which metadata source was used.

### IMDb Enterprise Access Notes

As of May 31, 2026, IMDb should be treated as a licensed data-source dependency rather than a simple free developer API.

The official IMDb API is available through AWS Data Exchange as a GraphQL-backed product. Using it requires an AWS account, AWS access keys, an IMDb API subscription, and subscription-specific values such as endpoint, API key, dataset ID, revision ID, and asset ID.

The documented subscription flow requires choosing an IMDb API product in AWS Marketplace, selecting "Continue to subscribe", signing into AWS, and sending a subscription request to IMDb. IMDb says subscription requests are processed by staff within five business days.

Public AWS Marketplace listings currently show:

- IMDb Essential Metadata for Movies/TV/OTT API: $150,000 for a 12-month contract, plus usage-based charges.
- IMDb and Box Office Mojo for Movies/TV/OTT API: $400,000 for a 12-month contract, plus usage-based charges.

IMDb also provides daily refreshed non-commercial datasets as gzipped TSV files. These may be useful for internal research or scenario prototyping only if the use qualifies as personal/non-commercial. IMDb's terms limit use to the provided datasets, require attribution, and prohibit scraping or other automated extraction from the IMDb website.

Alternatives considered for early product work:

- Static sample fixtures curated for evaluation scenarios.
- TMDb, which offers a practical developer API for movie, TV, people, and image metadata, with non-commercial use available under attribution and commercial use requiring sales approval. This is the selected source for the first prototype.
- OMDb, a simple REST API with a free key tier, but not affiliated with IMDb and licensed CC BY-NC.

Reference links:

- [IMDb API overview](https://developer.imdb.com/documentation/api-documentation/)
- [IMDb API access process](https://developer.imdb.com/documentation/api-documentation/getting-access/)
- [IMDb non-commercial datasets](https://developer.imdb.com/non-commercial-datasets/)
- [IMDb data use rules](https://help.imdb.com/article/imdb/general-information/can-i-use-imdb-data-in-my-software/G5JTRESSHJBBHTGX)
- [IMDb Essential Metadata API AWS listing](https://aws.amazon.com/marketplace/pp/prodview-wdqq4hg3bcbws)
- [IMDb and Box Office Mojo API AWS listing](https://aws.amazon.com/marketplace/pp/prodview-nzspap6vaousm)
- [TMDb API FAQ](https://developer.themoviedb.org/docs/faq)
- [OMDb API](https://www.omdbapi.com/)

## Stage 1: Metadata And Correctness Gates

Stage 1 answers: are these results valid enough to judge?

Hard failures should be reserved for issues that make the response invalid or untrustworthy.

Hard failure examples:

- No results returned when results are expected.
- Wrong media type returned for a strict movie-only or series-only query.
- Required golden-set title is missing.
- Cast, actor, director, award, rating, or time-period constraint is violated.
- A returned title is missing poster art.
- Offensive language appears in the blurb, custom descriptions, or follow-up suggestions.
- Forbidden competitor mention appears in the blurb, custom descriptions, or follow-up suggestions.
- Required response fields are missing.

Warnings include:

- Result count is lower or higher than expected but still useful.
- Golden-set title appears lower than ideal.
- Metadata source is incomplete.
- Metadata sources disagree.
- Follow-up suggestions are repetitive but not unsafe.
- Description is generic but factually correct.

Failures should be recorded at the most specific level possible, then rolled up to node, branch, tree, and run summaries.

## Stage 2: Quality Scoring

Stage 2 answers: assuming the basics are correct, how good is the experience?

Use a simple four-label scale:

- Excellent: clearly strong, highly relevant, and polished.
- Good: works well with minor issues.
- Needs Work: useful but noticeably flawed.
- Fail: poor, misleading, generic, irrelevant, or unusable.

Apply this scale to:

- Search results quality.
- Conversation blurb quality.
- Custom description quality.
- Follow-up suggestion quality.

Ranking should matter as a quality signal. Top results and top 3 relevance matter heavily, golden-set rank positions should be tracked, and irrelevant high-rank results should hurt quality more than weak lower-ranked results. Ranking issues are not usually hard Stage 1 failures unless they expose a correctness violation.

## Copy Safety

Copy checks apply to conversation blurbs, custom descriptions, and follow-up suggestions.

V1 should combine deterministic blocklists with AI sensitivity review.

- Blocklist match: Stage 1 hard failure.
- AI sensitivity finding: warning or quality issue unless it also matches a hard-fail rule.

Blocklist findings should record the matched term, field, text snippet, and exact location. AI sensitivity findings should be reviewable by humans.

## Human Review

Human reviewers should see the AI assessment by default and be able to validate or correct it.

For the four quality areas, reviewers can:

- Approve the AI assessment.
- Reject the AI assessment.
- Change the quality label.
- Add a comment.

For Stage 1 correctness gates, reviewers can:

- Acknowledge the failure.
- Add a comment.
- Mark a false positive.

The system should preserve the original automated finding, human decision, and comment history.

## Audit And History

Every evaluation run should save a complete snapshot:

- Seed query.
- Full conversation tree.
- Every follow-up clicked.
- Raw response payload placeholders.
- Returned titles and metadata.
- Golden set used, if any.
- Stage 1 gate results and evidence.
- Stage 2 AI quality scores and reasoning.
- Human approvals, rejections, overrides, and comments.
- Evaluator identity, timestamp, and run ID.
- Metadata source used.
- App and evaluation config version.

## Reporting

The tool should support trend reporting over time.

V1 reports should include:

- Overall pass/fail trend by run date.
- Stage 1 hard failure rate over time.
- Average Stage 2 quality by area over time.
- Breakdown by query category.
- Breakdown by expected media type.
- Top recurring failure reasons.
- Golden-set coverage trend.
- Follow-up depth quality trend.
- Follow-up suggestion repetition and bias analysis.

Runs should store date/time, run label, system or build identifier when available, query set version, evaluation config version, aggregate scores, and failure rates.

## Mock App Direction

The first mock implementation should be a friendly internal dashboard.

It should feel approachable, clear, and easy to scan. It should avoid cold engineering jargon where product language is clearer.

Core surfaces:

- Query set and runs view.
- Automated run detail.
- Human review detail.
- Trends and reports.

The mock should use a small amount of fixture data, just enough to demonstrate the evaluation flow and product handoff.

## Future Phases

- Live conversational search API execution.
- Real follow-up clicking against live responses.
- Parallel worker or sub-agent orchestration for branch evaluation.
- WBD enterprise metadata integration.
- IMDb Enterprise metadata integration.
- Replacement of the TMDb prototype adapter with licensed enterprise sources.
- Scheduled recurring evaluations.
- Reviewer assignment and calibration.
- Exportable reports and team sharing.
