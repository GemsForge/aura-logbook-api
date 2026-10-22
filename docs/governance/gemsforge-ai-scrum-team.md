# GemsForge AI Scrum Team

Status: proposed and reviewable through issue #280. This document is a shared operating model, not a replacement for repository-local policy.

## Purpose

Coordinate a small, reusable AI-assisted Scrum Team across Aura Logbook, Gem Life POS, Project Portfolio, and future repositories. The team keeps work focused, reviewable, and stoppable at clear checkpoints.

## Roles

- Scrum Master — maintains the sprint goal, limits work in progress, records blockers, and stops at the delivery checkpoint.
- Business Analyst — turns user intent into an issue with outcome, scope, acceptance criteria, relationships, and verification.
- GitHub Steward — inspects repository metadata and local policy, preserves labels, Projects, Actions, and issue-to-branch-to-PR traceability.
- Product Designer — protects user flows, visual language, responsive behavior, accessibility, and product identity.
- Frontend Engineer — implements UI and client state within the repository's established framework and component boundaries.
- Backend & Data Engineer — implements APIs, persistence, migrations, validation, security, and contracts without inventing storage conventions.
- QA/DevOps — defines evidence-based checks, runs applicable tests/builds/lint, reviews Actions, and reports blockers.

These are responsibilities, not separate permissions or human identities. One agent may perform multiple roles; the approval boundary still applies.

## Project context

| Product | Known repository/context | Local authority |
| --- | --- | --- |
| Aura Logbook | GemsForge/aura-logbook-api, default branch master, .NET 9 API + React/Vite UI | README, AURA_PROJECT_OVERVIEW.md, .github/ISSUE_WORKFLOW.md, docs/ |
| Gem Life POS | Repository not identified in the inspected accessible repositories | Do not guess; bind after the repository is confirmed |
| Project Portfolio | GemsForge/professional-portfolio, default branch main, React/TypeScript + hosted worker/storage | README, docs/story-and-delivery-workflow.md, docs/ui-development-workflow.md, hosting rules |
| Future repositories | Confirmed one at a time | Read local README, AGENTS.md, contribution/policy docs, workflows, package/project files, and metadata first |

## GitHub-first delivery

1. Discover: inspect repository, default branch, policies, labels, Actions, Projects references, architecture, and current work.
2. Frame: create or update the issue before implementation. Include user value, acceptance criteria, verification, and intentional relationships.
3. Plan checkpoint: report sprint goal, selected stories, risks, and exact stopping point. Wait for approval when scope is materially ambiguous.
4. Implement: use an issue-numbered branch required by the local repository. Preserve unrelated changes and local naming/commit conventions.
5. Verify: run named checks and applicable repository checks. Review the diff for accessibility, security, responsive behavior, data handling, and product fit.
6. PR checkpoint: open a PR only when authorized. Link the issue, include evidence, and report changed files, checks, risks, and remaining work.
7. Delivery checkpoint: stop with a sprint delivery report. Do not merge, deploy, close the issue, change Projects status, or start another story unless explicitly approved.
8. Approval: after review, apply requested changes in a new checkpoint cycle. Merge/deploy are separate approvals.

## Approval boundaries

Allowed within an explicitly scoped implementation request: read repository state; create/update the working issue; create an issue branch; edit files on that branch; run checks; prepare a PR when the user requested implementation and local workflow permits it.

Require explicit approval: merge; deploy or publish; close issues; change milestones, labels beyond the story's needs, Projects fields/statuses; branch protection; Actions secrets/variables; credentials; destructive cleanup; or adding a new external dependency with material operational impact.

## Product and technical guardrails

Aura Logbook is a personal journal for reflection, not diagnosis. Aura colors, chakras, and spiritual language are optional meaning-making tools. Keep neutral language and skip paths available. Preserve the Prism Garden direction, existing mood history, authentication, API/UI boundaries, and honest data-derived visualizations.

Prefer modular fields and contracts such as auraColor, auraIntensity, mood, chakra, and reflection when the feature calls for them. Verify actual implementation before describing future work as delivered.

## Standard checkpoints

- Plan: goal, stories, acceptance criteria, risks, dependencies, and stop condition.
- Development: branch, files changed, implementation notes, tests run, and blockers.
- Delivery: completed/outstanding, evidence, decisions, risks, and recommended next sprint.
- Approval: user decision — approve changes, request revision, approve merge, approve deploy, or defer.

Use the reusable formats in docs/governance/templates/.

## Autonomous DEV and QA loop

| Stage | Owner | Required action | Handoff condition |
| --- | --- | --- | --- |
| Ready for development | SM-AL | Confirm scope, metadata, branch, and dependencies | DEV-AL may begin |
| Implementation | DEV-AL | Implement, verify, commit, push, and update the issue/PR | QA-AL receives the work |
| QA review | QA-AL | Test acceptance criteria, runtime behavior, accessibility, and regression risk; record evidence and remarks | Approval or findings recorded |
| Bug writing | PO-AL or SM-AL | Write and link a bug story with reproduction, expected/actual behavior, severity, owner, and evidence | DEV-AL receives a linked fix |
| Fix cycle | DEV-AL | Address QA remarks, record the fix commit and verification, and return the work to QA-AL | QA-AL rechecks |
| Merge eligibility | QA-AL | Record explicit approval after all criteria pass | Work is eligible for merge; no additional human merge approval is required for now |

### Example

QA-AL finds that a journal entry form announces validation errors visually but
not to a screen reader. QA-AL records the field, expected announcement, browser,
and evidence. SM-AL writes and links a bug story, assigns DEV-AL, and keeps the
original work in the fix cycle. DEV-AL implements the accessible error state,
records the commit and verification, and returns the work to QA-AL. QA-AL
rechecks the keyboard and screen-reader behavior and records approval when it
passes.
