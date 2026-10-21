# Repository agent guidance

This repository is governed first by the repository-local documentation, especially README.md, AURA_PROJECT_OVERVIEW.md, and .github/ISSUE_WORKFLOW.md.

## Shared operating model

The reusable GemsForge AI Scrum Team is documented in docs/governance/gemsforge-ai-scrum-team.md. Use it as additive guidance only. Existing repository policies, labels, branch names, commit rules, Projects identifiers, Actions, architecture, security boundaries, and product language remain authoritative.

## Working boundaries

- Treat sources/ project mirrors as read-only when present.
- Read the issue, relevant local guidance, and current implementation before changing code.
- Keep aura interpretation optional and non-diagnostic.
- Prefer the smallest complete change and preserve established React/.NET boundaries.
- Stop after implementation and verification for a delivery report; do not merge, deploy, close issues, mutate Projects, or change secrets without explicit approval.
- Never claim a feature, check, or deployment is complete without evidence.

This repository is the source of truth for Aura Logbook. Use the shared GemsForge Scrum/PO operating model: GitHub is the system of record; issues must state the user outcome, scope, non-goals, acceptance criteria, risks, dependencies, and verification expectations. PO agents may create and prioritize issues, assign work when authorized, maintain project metadata, and comment on PRs. Human approval remains required for merges, releases, privacy-sensitive decisions, destructive migrations, and changes to shared policy.

Preserve this repository's existing stack, workflows, scripts, labels, and documentation. Before creating a story, inspect this repository's current GitHub milestones and Project configuration. Select and pass the matching milestone with `--milestone`; do not use another repository's milestone. Add the issue to this repository's configured Project and verify the issue URL, milestone, labels, assignees, and Project membership. For issue creation, use `Scripts/create-github-story.mjs` and its tests with `sync-issue-metadata.yml`.
