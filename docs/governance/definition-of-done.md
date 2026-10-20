# Definition of Done and verification matrix

This matrix supplements .github/ISSUE_WORKFLOW.md and the repository README. It does not replace local policy.

## Definition of Done

A story is done for review when:

- The issue acceptance criteria are satisfied or each exception is documented.
- Changes are on the issue-numbered branch with compliant commits.
- API and UI contracts, migrations, and seed/import boundaries remain consistent.
- Accessibility, responsive behavior, privacy, and security implications were reviewed.
- Applicable automated checks pass.
- A sprint delivery report records evidence, outstanding work, and the requested approval.

Merge and deployment remain separate approvals.

## Verification matrix

| Area | Required evidence |
| --- | --- |
| Backend | dotnet test AuraLogbook.sln |
| Frontend | npm run lint; npm run test:run; npm run test:startup; npm run build |
| Launcher | node --test Scripts/dev.test.mjs |
| Data | Migration/seeding behavior and environment boundaries reviewed |
| UX | Responsive, keyboard, labels, contrast, and screen-reader semantics reviewed |
| Security | JWT, secrets, authorization, and personal-data handling reviewed |
| Manual smoke | Run the documented DEV/FIT flow when runtime behavior changes |
| Delivery | PR checks, issue link, labels, and delivery report verified |

If a check cannot run, record the exact blocker; do not claim full verification.
