# Conversational Search Evaluation Tool

A product and research workspace for designing an evaluation tool for conversational search experiences.

The first version is intentionally documentation-first and mock-driven. The goal is to clarify the evaluation workflow, scoring model, automation path, and product experience before choosing a production application stack or connecting to a live conversational search API.

## Current Focus

- Define a product-ready PRD for conversational search evaluation.
- Separate correctness and metadata gates from subjective quality scoring.
- Support automated conversation-tree evaluation and human review.
- Preserve a record of requirements Q&A for product team handoff.
- Prepare for a friendly internal dashboard mock.

## Documentation

- [Product requirements document](docs/PRODUCT_BRIEF.md)
- [Evaluation framework](docs/EVALUATION_FRAMEWORK.md)
- [Mock app requirements](docs/MOCK_APP_REQUIREMENTS.md)
- [Requirements Q&A](docs/REQUIREMENTS_QA.md)
- [Brainstorming notes](docs/BRAINSTORMING.md)
- [Work log](docs/WORK_LOG.md)
- [Decision log](docs/DECISIONS.md)
- [Contributing guide](CONTRIBUTING.md)
- [Security notes](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Project Status

Private early-stage project. V1 is mock-only with lightweight fixture data. Live API execution, production metadata integrations, and scheduled recurring runs are future phases.

## Working Agreement

This repository should stay small and intentional until the evaluation experience is clear. Prefer writing down product intent, example workflows, and open questions before introducing implementation complexity.
