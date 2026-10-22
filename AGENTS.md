# Repository agent guidance

This repository is governed first by the repository-local documentation, especially README.md, AURA_PROJECT_OVERVIEW.md, and .github/ISSUE_WORKFLOW.md.

## Shared operating model

The reusable GemsForge AI Scrum Team is documented in docs/governance/gemsforge-ai-scrum-team.md. Use it as additive guidance only. Existing repository policies, labels, branch names, commit rules, Projects identifiers, Actions, architecture, security boundaries, and product language remain authoritative.

Code documentation rule: every code change must include an appropriate
documentation comment for the changed behavior or public contract. Use focused
comments for implementation logic, JSDoc/TSDoc for JavaScript or TypeScript
APIs and reusable components, and XML documentation comments for C#/.NET or
other XML-documentation-supported APIs. Keep comments accurate and explain
intent, invariants, inputs, outputs, or constraints; do not add empty comments
solely to satisfy this rule. Review and update nearby comments when a change
makes them stale.

Automation coordination: the active Scrum Master automation is the shared
coordinator for Aura Logbook, GemsForgeAPI, and Professional Portfolio. It is
attached to the shared SCRUM TEAM project and covers all three repository
working directories. Do not create duplicate per-project automations that
could work the same stories concurrently.

## Working boundaries

- Treat sources/ project mirrors as read-only when present.
- Read the issue, relevant local guidance, and current implementation before changing code.
- Keep aura interpretation optional and non-diagnostic.
- Prefer the smallest complete change and preserve established React/.NET boundaries.
- Stop after implementation and verification for a delivery report; do not merge, deploy, close issues, mutate Projects, or change secrets without explicit approval.
- Never claim a feature, check, or deployment is complete without evidence.

This repository is the source of truth for Aura Logbook. Use the shared GemsForge Scrum/PO operating model: GitHub is the system of record; issues must state the user outcome, scope, non-goals, acceptance criteria, risks, dependencies, and verification expectations. PO agents may create and prioritize issues, assign work when authorized, maintain project metadata, and comment on PRs. Human approval remains required for merges, releases, privacy-sensitive decisions, destructive migrations, and changes to shared policy.

Preserve this repository's existing stack, workflows, scripts, labels, and documentation. Before creating a story, inspect this repository's current GitHub milestones and Project configuration. Select and pass the matching milestone with `--milestone`; do not use another repository's milestone. Add the issue to this repository's configured Project and verify the issue URL, milestone, labels, assignees, and Project membership. For issue creation, use `Scripts/create-github-story.mjs` and its tests with `sync-issue-metadata.yml`.

Lifecycle gate: when a PR is created, the linked issue and PR move to `QA` for internal Codex Review. An approved Codex Review moves them to `In review` for the human PR decision. A merged PR moves them to `Merged` and closes the linked story; the resulting closed story becomes `Done`. Required corrections use `Changes requested`; QA does not merge or release.

Exact developer references: `AURA_PROJECT_OVERVIEW.md`; `AuraLogbook.Api/README.md`; `docs/wiki/aura-log-architecture.md`; `docs/ux/responsive-accessibility.md`; `AuraLogbook.Api/`; `aura-ui/`; `AuraLogbook.Api.Tests/`; `Scripts/`; `.github/workflows/`; and `.github/agents/`.

## Technology guidance

Use `AURA_PROJECT_OVERVIEW.md` and `docs/wiki/aura-log-architecture.md` for the full-stack boundaries: React 19/TypeScript/Vite with Redux Toolkit and RTK Query on the UI; .NET 9/ASP.NET Core REST services on the backend; and SQLite/Dapper with ordered SQL migrations for persistence. Keep controllers, services, repositories, UI state, API state, and database concerns in their documented layers. Use the UI README, UX accessibility guides, API README, database ERD, and migration docs before changing those areas.

## Shared agent target contract

All three project teams use the same agent-facing file contract. Target the
repository-local copies of these files when the request is shared policy or
workflow work:

- `AGENTS.md` for routing, handoff, commit/push, rebase, and QA rules.
- `Scripts/create-github-story.mjs` and `Scripts/create-github-story.test.mjs`
  for issue/story creation.
- `Scripts/commit-policy.mjs`, `Scripts/commit-policy.json`, and their tests
  for focused commit subjects.
- `.github/workflows/branch-policy.yml` for branch and base-branch policy.
- `.github/workflows/commit-policy.yml` for commit and PR-title policy.
- `.github/workflows/label-policy.yml` for required labels.
- `.github/workflows/sync-issue-metadata.yml` for issue metadata and Project
  synchronization.
- `.github/workflows/sync-issue-metadata.yml` for issue and PR metadata synchronization.
- `.github/agents/*.agent.md` for the PO, developer, Scrum Master, and QA
  operating instructions.
- `docs/governance/gemsforge-ai-scrum-team.md`,
  `docs/governance/github-actions-standard.md`, and the technology,
  accessibility, definition-of-done, and workflow documents for the shared
  process contract.

Preserve this repository's `Scripts/` casing and repository-specific project,
milestone, label, base-branch, and technology values. A cross-repository
request updates the equivalent file in each repository; a project-local
request updates only this repository.
