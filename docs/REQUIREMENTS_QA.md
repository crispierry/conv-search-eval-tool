# Requirements Q&A

This file records the product requirements Q&A that shaped the PRD.

## 2026-05-31

### 1. What should be the core unit of evaluation?

Approved answer: use a query run for human review.

A query run means one starter conversational search query plus the returned response, including result count, returned titles, conversation blurb, AI custom blurbs, follow-up suggestions, metadata checks, AI evaluation, and human review.

### 2. How should automated evaluation handle follow-ups?

Approved answer: use a bounded exhaustive conversation tree.

For each seed query, evaluate the initial response, capture every suggested follow-up, click each follow-up, and continue each branch independently to depth 5. Branches should be parallelizable, deduplicated, stopped when dead-ended, and protected by a max-path safety cap.

### 3. How should a conversation tree be scored overall?

Approved answer: score each node and the overall tree.

Each response node receives metadata and correctness gates plus quality scores. The full tree receives rollups for failures, averages, path coverage, repetition, and whether the conversation stayed coherent through depth 5.

### 4. Where should V1 search responses come from?

Approved answer: imported or static simulated payloads.

The correct API is not available yet, so V1 should simulate the workflow and leave live API execution for a future phase.

### 5. What should the query import file contain?

Approved answer: a structured list of seed queries with optional golden sets and expected constraints.

Each query should include an ID, query text, category, expected media type, optional expected result count, constraints, optional golden set, and notes.

### 6. What is `category`?

Approved answer: `category` describes search intent, while `expected_media_type` describes whether results should be movies, series, mixed, or unknown.

Examples include cast, director, award, rating, mood, similar-to, compound, ambiguous, and exploratory.

### 7. How should golden sets behave?

Approved answer: golden sets are strict but not exhaustive.

Golden-set titles are required and missing titles should be flagged. Extra returned titles are allowed if they satisfy query constraints.

### 8. Should result order matter?

Approved answer: ranking matters as a quality signal, not usually as a hard correctness gate.

Top result correctness, top 3 relevance, golden-set positions, irrelevant high-rank results, and overall ranking quality should be tracked.

### 9. What counts as a hard Stage 1 failure?

Approved answer: hard failures are invalid or untrustworthy responses.

Examples include no results when expected, wrong media type, missing required golden-set title, violated cast/director/award/rating/time constraints, missing poster art, offensive language, competitor mentions, and missing required fields.

### 10. How should failures apply?

Approved answer: record failures at the most specific level and roll them up.

Result-level issues roll up to node, branch, tree, and run summaries.

### 11. What should the Stage 2 quality scale be?

Approved answer: use four labels.

- Excellent.
- Good.
- Needs Work.
- Fail.

Apply the scale to search results, conversation blurb, AI custom blurbs, and follow-up suggestions.

### 12. Should AI review be visible to human reviewers?

Approved answer: yes.

Human reviewers should see the AI-generated response fields they are judging, and they should be able to access clearly labeled AI assessment context from the automated detail view.

### 13. What can human reviewers do?

Approved answer: reviewers can make field-level judgments and preserve comments next to the exact item reviewed.

Reviewers can approve or reject the conversation blurb, mark whether each returned title is valid for the query, choose the correct rank position for each returned title, approve or reject each AI custom blurb, approve or reject each follow-up suggestion, and add commentary for each field.

For Stage 1 gates, reviewers can acknowledge, comment, or mark a false positive while preserving the original automated finding.

Open follow-up: decide whether binary Check/X judgments should directly change Stage 2 quality labels and trend rollups, or remain separate audit signals.

### 14. What should be saved for audit/history?

Approved answer: save a complete evaluation snapshot for every run.

Snapshots should include seed query, conversation tree, follow-ups clicked, raw response payloads, returned titles and metadata, golden set, Stage 1 findings, Stage 2 AI scores, human decisions, timestamps, metadata source, and app/config version.

### 15. How should the app support quality over time?

Approved answer: store run metadata and support trend reporting.

The app should plot quality by date or run, including overall quality, Stage 1 failure rate, Stage 2 quality, category breakdowns, golden-set coverage, and follow-up depth quality.

### 16. What reports matter most in V1?

Approved answer: compact trend dashboard plus failure breakdowns.

Reports should show overall pass/fail trend, Stage 1 hard failure rate, Stage 2 quality by area, category/media-type breakdowns, recurring failure reasons, golden-set coverage, and follow-up depth quality.

### 17. How should competitor mentions and offensive language be configured?

Approved answer: use both deterministic blocklists and AI sensitivity review.

Blocklist matches are Stage 1 hard failures. AI sensitivity findings are warnings or quality issues unless they also match a hard-fail rule.

### 18. What is the metadata source of truth?

Approved answer: licensed enterprise metadata is primary when available. IMDb-style metadata is fallback or reference.

Source conflicts should be warnings. Hard failures should use the enterprise source of truth when available. Mock implementation should simulate multiple source types.

### 19. Should every returned result satisfy query constraints?

Approved answer: yes.

Every returned result must satisfy hard constraints when present. Ranking influences quality scoring, but constraints apply across all returned results.

### 20. How should follow-up suggestions be handled?

Approved answer: evaluate follow-ups both locally and globally.

At each node, record every follow-up suggestion, evaluate its quality, click it during automated exploration, and evaluate the response. Across runs, analyze repetition, bias, overrepresented topics, and recurring suggestion patterns.

### 21. How should simulated response data be structured?

Approved answer: keep it simple.

Use lightweight fixtures only to demonstrate the evaluation flow. Avoid overbuilding synthetic data because the objective is product team handoff.

### 22. Who is the primary audience?

Approved answer: product team first.

The PRD and mock should be product-readable and workflow-focused, with enough structure for design and engineering to continue.

### 23. What should the first mock implementation look like?

Approved answer: a friendly internal evaluation dashboard.

The tool should be clear, approachable, easy to scan, and useful for internal product review.

### 24. What is the primary success metric?

Approved answer: the tool succeeds if the product team can answer, "Is conversational search getting better over time, and what is still failing?"

### 25. Is V1 mock-only or live API integrated?

Approved answer: V1 is mostly mock-only.

The first implementation will be created before the correct API is available, with live API execution left for a future phase. IMDb-style information can be a stretch enhancement.

### 26. How should metadata validation work in today's mock?

Approved answer: use lightweight fixture metadata.

IMDb-style enrichment is a stretch. The mock should simulate source-of-truth behavior without depending on real external APIs.

### 27. What docs should be created next?

Approved answer: create a product-ready PRD and supporting docs.

Update the product brief, evaluation framework, brainstorming notes, mock app requirements, and this Q&A record.

### 28. How detailed should the PRD be?

Approved answer: medium-detail and product-team ready.

The PRD should define requirements, workflows, scoring, reporting, data capture, and mock expectations without pretending all technical implementation decisions are final.
