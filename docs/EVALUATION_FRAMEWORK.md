# Evaluation Framework

## Evaluation Objective

Assess whether a conversational search experience helps users find trustworthy, useful information through a natural multi-turn interaction.

## Candidate Evaluation Dimensions

### Intent Understanding

- Does the system understand the user's request?
- Does it preserve important constraints, context, and preferences?
- Does it recognize when the request is ambiguous?

### Retrieval Quality

- Are the retrieved results relevant to the user's intent?
- Are important documents, entities, or facts missing?
- Are irrelevant or low-quality sources overrepresented?

### Answer Quality

- Is the response accurate, complete, and useful?
- Does it synthesize information instead of merely repeating snippets?
- Does it avoid unsupported claims?

### Conversational Behavior

- Does the system use prior turns appropriately?
- Does it ask clarifying questions when needed?
- Does it recover gracefully from misunderstandings?

### Trust And Source Use

- Are sources cited or represented clearly when relevant?
- Can the user understand where the answer came from?
- Does the response communicate uncertainty appropriately?

### User Effort

- Does the conversation reduce the user's work?
- Are follow-up paths clear?
- Does the system avoid unnecessary back-and-forth?

## Scoring Rubric Placeholder

Potential score scale:

- `1`: Fails the user need.
- `2`: Partially helpful but has material issues.
- `3`: Mostly successful with minor issues.
- `4`: Strong result that meets or exceeds expectations.

Open question: should the rubric use dimension-specific scoring, an overall score, pass/fail gates, or a combination?

## Scenario Design

Candidate scenario types:

- Direct known-item lookup.
- Exploratory research.
- Comparison across options.
- Ambiguous request requiring clarification.
- Multi-turn refinement.
- Conflicting or incomplete source information.
- Safety-sensitive or high-confidence-needed query.

## Edge Cases To Explore

- User changes intent mid-conversation.
- User asks for something not present in the index.
- Multiple plausible interpretations exist.
- Search results include stale or contradictory information.
- The system gives a confident answer from weak evidence.
- The answer is correct but poorly explained.

## Evaluator Notes

Reviewers should be able to capture:

- What went well.
- What failed.
- Whether the failure appears to be retrieval, ranking, synthesis, memory, UX, or policy-related.
- Example quotes or turns that support the judgment.
- Recommended follow-up investigation.

## Reporting Questions

- Which dimensions fail most often?
- Which scenario types expose the most serious issues?
- Are failures concentrated in retrieval, response generation, or conversation design?
- What improvements would most increase user trust?
