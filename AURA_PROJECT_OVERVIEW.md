# Aura Logbook project overview

## Product purpose

Aura Logbook is a personal journal for recording moods, reflecting on experience, and noticing patterns that matter to the person recording them. It combines practical mood tracking with optional aura, chakra, mindfulness, and faith/spirituality frameworks.

The app offers reflection, not diagnosis. Aura colors and chakra associations are optional meaning-making tools, not medical or scientific assessments. Users decide what their entries mean and how much interpretive language they want to see.

The current source of truth for product language is the [inclusive experience guidance](docs/ux/experience-principles.md). Preserved Wiki pages under `docs/wiki/` are dated source material, not current requirements.

## Experience model

Every user receives the same core journal capabilities. A pathway can shape optional language, examples, and prompts; it must not gate mood logging, history, profile access, or basic recorded-data summaries.

1. **Aura — color reflection:** color can help a user describe mood, energy, or a personal association. Meanings are invitations, never universal conclusions.
2. **Mindfulness — everyday journaling:** grounded, nonjudgmental reflection centered on feelings, context, needs, and the user's own words.
3. **Faith & spirituality — user-defined belief:** an optional path that welcomes a higher power or spiritual practice without assuming a religion, scripture, or name for that power.

Neutral language and a way to skip interpretation must remain available throughout the product. Faith- or tradition-specific material should be an explicit future opt-in module, not the default faith experience.

## Current implementation

Aura Logbook currently includes:

- registration, login, profile editing, and JWT-protected routes;
- mood entry creation, history, editing, deletion, and dashboard summaries;
- profile-level aura color and intensity preferences;
- reference data for aura colors, chakras, pathways, and mood/aura mappings;
- zodiac insight, weather, reflection-prompt, and reflection-response API surfaces;
- a responsive React dashboard with mood summaries and charts.

Implementation and target direction are not identical. The current UI still contains older pathway labels and belief-specific wording documented in the [experience principles' implementation note](docs/ux/experience-principles.md#current-implementation-note). Direct per-entry aura context, prompt-library content, weekly summaries, and aura-evolution experiences are only partially implemented or remain future work; do not present them as complete user features without verifying the current route, UI, and data flow.

For a route-by-route view of the present web experience and known gaps, use [Core user journeys](docs/ux/core-user-journeys.md).

## Visual direction

The approved visual direction is [Prism Garden](docs/ux/prism-garden-visual-system.md): warm spa-like neutrals, tactile but readable surfaces, generous breathing room, and restrained jewel accents. The prism is an abstract identity mark, not a ritual object or spiritual instruction.

Color, emoji, hover, and motion must never be the only way to understand a state or action. Responsive and assistive-technology expectations are documented in [Responsive and accessibility behavior](docs/ux/responsive-accessibility.md).

## Technical shape

- **Backend:** .NET 9 and ASP.NET Core REST API
- **Frontend:** React 19, TypeScript, Vite, Redux Toolkit/RTK Query, Axios, and React Router
- **UI:** Material UI, Joy UI, Emotion, and Recharts
- **Authentication:** JWT bearer tokens with BCrypt password hashing
- **Development/FIT persistence:** SQLite through Dapper with forward-only SQL migrations
- **Development import/seeding:** committed JSON source data imported into the relational store
- **Weather:** Open-Meteo forecast and geocoding endpoints
- **Testing:** xUnit, Vitest, React Testing Library, ESLint, TypeScript builds, and launcher tests

Development and FIT/Staging use SQLite for users, moods, zodiac insights, and reflections. Production currently retains a mixed fallback—file repositories for users, moods, and zodiac insights while migration startup and reflections still use SQLite—so production storage and hosting require an explicit deployment decision.

## Repository map

- `AuraLogbook.Api/` — API controllers, services, repositories, models, configuration, and data sources
- `AuraLogbook.Api/Data/Database/Migrations/` — ordered relational schema migrations
- `AuraLogbook.Api.Tests/` — backend and database tests
- `aura-ui/` — React/Vite client and UI tests
- `docs/` — current technical and experience guidance
- `docs/wiki/` — preserved historical Wiki snapshots with original-source links
- `Scripts/` — development launcher, database utilities, and repository workflow checks

## Local development

Use the [root README](README.md) as the single source of truth for prerequisites, secrets, commands, ports, environment aliases, and troubleshooting. Do not copy setup commands or provider details from the historical Wiki snapshots.

## Direction and boundaries

The product direction is a modular, API-first personal journal that can support web and a future native SwiftUI client. The [SwiftUI shell adaptation plan](docs/ux/swiftui-shell-adaptation.md) records the shared product contract and native boundaries. Near-term work should strengthen the shared mood/reflection contracts, make pathway wording inclusive, apply Prism Garden consistently, and deliver honest visualizations based on data the user actually recorded.

Potential extensions include a reviewed reflection-prompt library, weekly aura summaries, per-entry aura context, accessible trend views, export, reminders, and user-selected tradition-specific modules. Each requires its own acceptance criteria, privacy review, and verified implementation; listing it here does not make it a current feature.

## Documentation map

Use the [documentation index](docs/README.md) to distinguish current guidance, operational references, resolved investigations, and historical Wiki source material.
