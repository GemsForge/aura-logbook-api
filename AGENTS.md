# Repository agent guidance

Implementation feedback rule: when the user suggests or corrects a code, workflow, documentation, test, or policy behavior, treat it as an implementation request for the owning developer agent. Inspect the relevant files, prepare the smallest complete change, run focused verification, create a policy-compliant commit, and push it to the story branch. Do not respond with an explanation only when a repository change is expected.

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
- Before final verification or handoff, inspect the pull request target branch, fetch its latest remote state, and rebase the issue branch onto that target. Do not assume the target is named `main` or `master`; use the repository and PR configuration. Resolve conflicts, rerun relevant checks, force-push with lease, and verify that the PR head matches the pushed commit.

## PO routing and team awareness

The project POs are distinct but coordinated:

- PO-AL owns GemsForge/aura-logbook-api (Aura Logbook).
- PO-GF owns GemsForge/GemsForgeAPI (GemsForgeAPI).
- PO-PP owns GemsForge/professional-portfolio (ProfessionalPortfolio).

Every PO must identify its own codebase before acting. A request naming one repository, issue, PR, milestone, Project, or branch is local to that repository and should be handled by its owning PO. A request naming all three repositories, the shared Scrum team, shared workflow files, or cross-project policy is a coordinated request for PO-AL, PO-GF, and PO-PP. Do not modify another repository for a local request without routing it to that repository's PO.

For coordinated work, each PO preserves repository-specific configuration while aligning the shared contract, reports its changed files and remote branch, and waits for the other POs where metadata or workflow dependencies cross repository boundaries.

This repository is the source of truth for Aura Logbook. Use the shared GemsForge Scrum/PO operating model: GitHub is the system of record; issues must state the user outcome, scope, non-goals, acceptance criteria, risks, dependencies, and verification expectations. PO agents may create and prioritize issues, assign work when authorized, maintain project metadata, and comment on PRs. Human approval remains required for merges, releases, privacy-sensitive decisions, destructive migrations, and changes to shared policy.

Preserve this repository's existing stack, workflows, scripts, labels, and documentation. Before creating a story, inspect this repository's current GitHub milestones and Project configuration. Select and pass the matching milestone with `--milestone`; do not use another repository's milestone. Add the issue to this repository's configured Project and verify the issue URL, milestone, labels, assignees, and Project membership. For issue creation, use `Scripts/create-github-story.mjs` and its tests with `sync-issue-metadata.yml`.

QA gate: PR checks validate the proposed change before merge. After merge to `master`, QA validates the merged development branch against the story's acceptance criteria, regression, accessibility, responsive behavior, security/privacy expectations, and required evidence. QA may set Project status to `QA` and recommend release or corrective work; QA does not merge, release, or close the story.

Exact developer references: `AURA_PROJECT_OVERVIEW.md`; `AuraLogbook.Api/README.md`; `docs/wiki/aura-log-architecture.md`; `docs/ux/responsive-accessibility.md`; `AuraLogbook.Api/`; `aura-ui/`; `AuraLogbook.Api.Tests/`; `Scripts/`; `.github/workflows/`; and `.github/agents/`.

## Technology guidance

Use `AURA_PROJECT_OVERVIEW.md` and `docs/wiki/aura-log-architecture.md` for the full-stack boundaries: React 19/TypeScript/Vite with Redux Toolkit and RTK Query on the UI; .NET 9/ASP.NET Core REST services on the backend; and SQLite/Dapper with ordered SQL migrations for persistence. Keep controllers, services, repositories, UI state, API state, and database concerns in their documented layers. Use the UI README, UX accessibility guides, API README, database ERD, and migration docs before changing those areas.
