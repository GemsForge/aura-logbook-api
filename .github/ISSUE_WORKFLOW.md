# Aura Logbook issue and pull request workflow

The working issue is the source of truth for scope, labels, milestone, assignee, and native issue relationships.

## Story format

Use titles in this form:

`type(scope): short imperative description`

Approved types are `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, and `ci`.

Use explicit GitHub labels for work type and area. Recommended area labels include `api`, `aura`, `ui`, `testing`, `security`, `docs`, and `ci`.

Stories should include a goal, scope, definition of done, and explicit relationships. Parent, blocked-by, and blocking relationships must be supplied intentionally; they are never inferred from prose.

## Branches and pull requests

Branches include the issue number, for example `feat/166-project-workflow`.

PR titles and commit subjects use:

`type(scope): #issue short imperative description`

PR bodies should include `Closes #issue` when merging the PR should close the working issue. PR creation and merging remain separate authorized steps.

## Commit policy

The local pre-push hook and GitHub Actions validation enforce the same commit format. Merge commits created by GitHub are allowed. Descriptions must begin with a lowercase imperative word and contain no control characters or surrounding whitespace.

## Project synchronization

Aura Logbook uses its own GitHub Project. Project synchronization must use the `AURALOGBOOK_PROJECTS_TOKEN` Actions secret and Aura's own Project/status field identifiers. Do not copy GemLife project numbers or status IDs.

The repository token handles issue, pull request, branch, and contents operations. Project mutations require the separate Projects-authorized secret.

## Verification

Before opening a PR, run the repository's tests, build, lint, and the commit-policy checks. The issue remains the source of truth when automation and event arrival order disagree.
