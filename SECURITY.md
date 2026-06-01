# Security

This project may eventually handle sensitive search queries, conversation logs, reviewer notes, or private evaluation data.

## Current State

The current app is a local, mock-driven prototype that runs on fixture data by default. Live TMDB enrichment is optional and requires a local read access token.

## Data Handling Principles

- Do not commit real user conversations, secrets, API keys, or private datasets.
- Use synthetic or redacted examples in documentation.
- Treat future evaluation exports as potentially sensitive.
- Prefer least-privilege access for any future integrations.

## Reporting Issues

Please do not open public issues for exploitable vulnerabilities or leaked credentials. Use GitHub private vulnerability reporting if it is enabled for the repository; otherwise contact the maintainers privately.
