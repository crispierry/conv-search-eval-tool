# Product Brief

## Purpose

Build an evaluation tool that helps a team judge the quality of a conversational search feature across realistic user conversations.

The tool should make it easier to design test scenarios, review model or system responses, apply consistent scoring criteria, and understand where the experience succeeds or fails.

## Problem

Conversational search quality is difficult to evaluate because success depends on more than whether a single answer is factually correct. A useful evaluation needs to consider intent understanding, retrieval quality, answer synthesis, clarification behavior, source use, conversational memory, and user trust.

## Early Goals

- Create a shared language for what good conversational search looks like.
- Support repeatable review of search conversations.
- Capture both quantitative scores and qualitative reviewer notes.
- Surface patterns that help product, engineering, and research teams decide what to improve.

## Target Users

- Product leaders evaluating readiness and quality.
- Search and ML engineers diagnosing retrieval and ranking issues.
- UX researchers reviewing conversation flow and user trust.
- Human evaluators applying rubrics to test conversations.

## Early Questions

- What conversations should be used as evaluation scenarios?
- Should reviewers evaluate full conversations, individual turns, or both?
- Which dimensions matter most for this feature?
- How should the tool distinguish retrieval failures from answer-generation failures?
- What reports or exports would make the findings actionable?

## Out of Scope For Now

- Choosing a frontend or backend framework.
- Building automated judging infrastructure.
- Defining production data ingestion.
- Creating integrations with live search systems.

These may become relevant after the evaluation workflow is clearer.
