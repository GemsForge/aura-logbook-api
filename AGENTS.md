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
