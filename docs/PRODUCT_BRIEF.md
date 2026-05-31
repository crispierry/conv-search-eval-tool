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

## Entertainment Metadata Data Source Strategy

For the first prototype, the evaluation tool will use TMDb as the entertainment metadata source. TMDb gives the project a lower-friction way to exercise movie, TV, people, image, and search workflows while the evaluation experience is still being designed.

The prototype should avoid coupling the reviewer workflow, scenario model, scoring surfaces, or reporting logic directly to TMDb-specific fields. The metadata layer should be treated as a replaceable adapter so the project can later swap in licensed IMDb Enterprise data and WBD enterprise data without redesigning the evaluation product.

### Future IMDb Integration

As of May 31, 2026, IMDb should be treated as a licensed data-source dependency rather than a simple free developer API.

### Official IMDb Access

The official IMDb API is available through AWS Data Exchange as a GraphQL-backed product. Using it requires an AWS account, AWS access keys, an IMDb API subscription, and subscription-specific values such as endpoint, API key, dataset ID, revision ID, and asset ID.

The documented subscription flow requires choosing an IMDb API product in AWS Marketplace, selecting "Continue to subscribe", signing into AWS, and sending a subscription request to IMDb. IMDb says subscription requests are processed by staff within five business days.

Public AWS Marketplace listings currently show:

- IMDb Essential Metadata for Movies/TV/OTT API: $150,000 for a 12-month contract, plus usage-based charges.
- IMDb and Box Office Mojo for Movies/TV/OTT API: $400,000 for a 12-month contract, plus usage-based charges.

### Non-Commercial Dataset Option

IMDb also provides daily refreshed non-commercial datasets as gzipped TSV files. These include title basics, alternate titles, crew, episodes, principals, ratings, and name basics.

This option may be useful for internal research or scenario prototyping only if the use qualifies as personal/non-commercial. IMDb's terms limit use to the provided datasets, require attribution, and prohibit scraping or other automated extraction from the IMDb website.

### Alternatives Considered For Early Product Work

If the evaluation tool only needs entertainment metadata to exercise conversational search workflows, the MVP should not depend on IMDb licensing. Options considered include:

- Static sample fixtures curated for evaluation scenarios.
- TMDb, which offers a practical developer API for movie, TV, people, and image metadata, with non-commercial use available under attribution and commercial use requiring sales approval. This is the selected source for the first prototype.
- OMDb, a simple REST API with a free key tier, but not affiliated with IMDb and licensed CC BY-NC.

### PRD Implication

The product should support a pluggable entertainment metadata source. TMDb should be used for the first prototype. IMDb Enterprise data and WBD enterprise data should be treated as future production integrations, not MVP blockers, unless the product explicitly requires licensed enterprise metadata during the prototype phase.

If IMDb or WBD enterprise data becomes a production requirement, the implementation should account for source adapters, data caching, search indexing, source attribution, freshness timestamps, secrets handling, usage/cost monitoring, and license/compliance review.

Reference links:

- [IMDb API overview](https://developer.imdb.com/documentation/api-documentation/)
- [IMDb API access process](https://developer.imdb.com/documentation/api-documentation/getting-access/)
- [IMDb non-commercial datasets](https://developer.imdb.com/non-commercial-datasets/)
- [IMDb data use rules](https://help.imdb.com/article/imdb/general-information/can-i-use-imdb-data-in-my-software/G5JTRESSHJBBHTGX)
- [IMDb Essential Metadata API AWS listing](https://aws.amazon.com/marketplace/pp/prodview-wdqq4hg3bcbws)
- [IMDb and Box Office Mojo API AWS listing](https://aws.amazon.com/marketplace/pp/prodview-nzspap6vaousm)
- [TMDb API FAQ](https://developer.themoviedb.org/docs/faq)
- [OMDb API](https://www.omdbapi.com/)

## Out of Scope For Now

- Choosing a frontend or backend framework.
- Building automated judging infrastructure.
- Defining production data ingestion.
- Creating integrations with live search systems.

These may become relevant after the evaluation workflow is clearer.
