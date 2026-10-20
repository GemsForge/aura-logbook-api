# Aura Logbook documentation

This index separates current project guidance from preserved historical material. When documents disagree, use the current implementation together with the current sources listed below; treat `docs/wiki/` as dated product history.

## Start here

| Need | Current source |
| --- | --- |
| Product purpose, implemented capabilities, and direction | [Project overview](../AURA_PROJECT_OVERVIEW.md) |
| Install, configure, run, test, and troubleshoot | [Repository README](../README.md) |
| API configuration, persistence, and routes | [API README](../AuraLogbook.Api/README.md) |
| UI configuration and checks | [UI README](../aura-ui/README.md) |
| Major libraries, tools, and external services | [Dependencies and tools](../DEPENDENCIES.md) |
| Runtime aliases, configuration order, seeding, and migrations | [Runtime environments](runtime-environments.md) |

## Product and experience guidance

- [Inclusive experience principles](ux/experience-principles.md) — the current source of truth for Aura, Mindfulness, and user-defined Faith & Spirituality language.
- [Prism Garden visual system](ux/prism-garden-visual-system.md) — approved visual direction and semantic design tokens.
- [Core user journeys](ux/core-user-journeys.md) — current web behavior, gaps, and target dashboard hierarchy.
- [Responsive and accessibility behavior](ux/responsive-accessibility.md) — cross-viewport and assistive-technology expectations plus recorded review evidence.
- [SwiftUI shell adaptation plan](ux/swiftui-shell-adaptation.md) — web-to-iPhone product contract, native information architecture, and mobile-readiness dependencies.

These files describe intended product behavior where they say so. They do not imply that every proposed experience is already implemented.

## Data and operations

- [Relational database ERD](database-erd.md) — current migration-defined tables and major relationships.
- [Database migration recovery](database-recovery.md) — forward-migration, backup, failure, and restore guidance.
- [Resolved registration birthday mismatch](registration-dateonly-mismatch.md) — retained investigation record for the fixed `DateOnly`/SQLite defect.
- [Database seeder](../Scripts/DatabaseSeeder/README.md) — full JSON-to-SQLite import and reconciliation workflow.
- [Safe branch cleanup](../BRANCH_CLEANUP.md) — local and remote branch review procedure.
- [Issue and pull-request workflow](../.github/ISSUE_WORKFLOW.md) — story, branch, commit, PR, and project-sync policy.

## Historical Wiki source material

The files under [`docs/wiki/`](wiki/README.md) are dated snapshots of pages from the separate GitHub Wiki. They preserve original source links and earlier product thinking. They are not current setup instructions, provider documentation, route contracts, persistence documentation, or inclusive-language requirements.

Do not silently modernize a snapshot as though it were the original Wiki content. Put current guidance in the appropriate source above and cross-link it from the Wiki index. If a snapshot is refreshed from GitHub, record its retrieval date and retain the original page URL.

## Maintenance rules

- Prefer one authoritative page and links to it over copied setup commands or duplicated product rules.
- Mark proposals, historical notes, resolved investigations, and implemented behavior explicitly.
- Check ports, commands, environment names, package versions, routes, and storage claims against repository configuration before merging changes.
- Verify relative Markdown links whenever documentation moves or new pages are added.
- Never copy secrets or local credentials into documentation.
