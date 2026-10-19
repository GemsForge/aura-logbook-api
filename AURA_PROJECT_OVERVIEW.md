# Aura Logbook Project Overview

## Purpose of the project

Aura Logbook is a full-stack mood-tracking and journaling application. Its purpose is to help people record how they feel, represent their current mood or energy through aura colors, recognize emotional patterns, and deepen self-awareness through guided reflection.

The project is more than a mood analytics tool: it is an energetic journal that combines practical mood tracking with optional holistic and spiritual frameworks. Aura and chakra interpretations are offered as reflective tools, not medical or scientific assessments.

## Project soul and guiding principles

Aura Logbook is intended to help people understand themselves more deeply without forcing a worldview onto them. Its foundation is emotional awareness; its pathways provide optional ways to interpret and explore personal experience.

The project’s depth comes from bringing together:

- Personal emotional language
- Guided but non-prescriptive reflection
- Aura and chakra symbolism
- Culturally specific spiritual pathways
- Privacy, accessibility, and user agency
- Clear boundaries between reflection, tradition, and established fact

Every feature should support more honest, respectful, and meaningful self-reflection while preserving the user’s freedom to define their own experience. This principle should guide the product architecture, content, user experience, data model, and future pathway expansion.

The long-term product model is:

1. Shared emotional-awareness tools
2. A user-selected interpretive pathway
3. Optional cultural or spiritual modules
4. Transparent explanations and source context
5. Personalized reflection based on the user’s own language and history

The project should remain empowering rather than prescriptive. It must not use spiritual language to diagnose illness, predict danger, or assign moral value. It should support users who are spiritual, questioning, nonreligious, interfaith, or undecided, while treating aura, chakra, astrology, and faith-based content with appropriate cultural care.

## Technical stack

- Backend: .NET 9 and ASP.NET Core REST API
- Frontend: React 19, TypeScript, and Vite
- State and data access: Redux Toolkit, RTK Query, Axios, and React Router
- UI: Material UI, Joy UI, Emotion, and Tailwind CSS tooling
- Charts: Recharts
- Authentication: JWT bearer tokens with BCrypt password hashing
- Testing: .NET tests, Vitest, React Testing Library, ESLint, TypeScript builds, and startup tests

## Repository structure

- `AuraLogbook.Api/` — ASP.NET Core API, controllers, services, repositories, models, DTOs, and local data
- `aura-ui/` — React/Vite client application
- `AuraLogbook.Api.Tests/` — backend tests
- `docs/wiki/` — preserved documentation snapshots and product concepts
- `Scripts/` — development launcher and workflow utilities

## Core capabilities

- User registration, login, profile management, and JWT-protected routes
- Mood entry management and dashboard summaries
- Aura-color selection for representing current mood or energy
- Chakra-associated mood and aura reflection
- Zodiac-based insights
- Current-weather lookup through Open-Meteo
- Dashboard views for recent entries, trends, and summaries

## Experience implementation checklist

| Feature | Description | Implementation |
|---|---|:---:|
| Mood logging | Select moods, add comments, and manage mood entries through the UI | [x] |
| Aura selection | Choose an aura color associated with the current mood or energy | [x] |
| Chakra context | Show chakra associations and meanings for aura colors | [x] |
| Aura intensity | Store and use aura intensity in profile data and theming | [x] |
| Aura-based styling | Adapt the UI theme to the selected aura color and intensity | [x] |
| Mindfulness pathway | Select Mindfulness as the user’s reflection pathway | [x] |
| Astrology & Energy pathway | Select the energy pathway and view zodiac-related insights | [x] |
| Faith & Religion pathway | Select the faith pathway as a profile preference | [x] |
| Dashboard summaries | Show mood totals, streaks, breakdowns, date-based trends, weather, and zodiac insights | [x] |
| Chakra journaling prompts | Provide reflection prompts tailored to chakra or aura selection | [ ] |
| Weekly aura summaries | Summarize dominant aura colors and energy patterns by week | [ ] |
| Aura evolution charts | Visualize aura-color or aura-intensity changes over time | [ ] |
| Birth-chart widget | Display a user-specific birth-chart experience | [ ] |
| Bible verses, prayer, and gratitude tools | Provide faith-specific scripture, prayer, and gratitude features | [ ] |

The checklist reflects the current UI evidence. A checked item may be implemented at the model, API, or UI level; it does not necessarily mean the experience is complete in every pathway or presentation.

## Spiritual pathways

Spiritual pathways let users choose the primary perspective that guides their reflections. The selected pathway is stored on the user profile and can shape the language, prompts, and insights presented by the application.

### Mindfulness

Mindfulness emphasizes calm, clarity, presence, and self-awareness. It supports journaling, meditation, mindful observation, and practical reflection without requiring spiritual beliefs.

### Astrology & Energy

Astrology & Energy is for users drawn to zodiac signs, aura colors, chakras, intuition, energetic patterns, and spiritual affirmations. It provides the most direct connection to the project’s aura-centered and chakra-aligned features.

### Faith & Religion

Faith & Religion supports reflection guided by Christian faith, including scripture, prayer, gratitude, and faith-based encouragement.

All pathways share the core mood-tracking, aura selection, journaling, dashboard, profile, and summary features. The pathway is an interpretive layer and an extension point for pathway-specific prompts and content.

## Aura selection

Aura selection allows a user to choose a color that represents their current mood, energy, or inner state. Each color is associated with a common holistic interpretation and a chakra theme, giving the user a simple vocabulary for reflection.

- **Red** — Root chakra; grounding, safety, and stability
- **Orange** — Sacral chakra; creativity, vitality, and emotional flow
- **Yellow** — Solar plexus chakra; optimism, confidence, and personal power
- **Green** — Heart chakra; compassion, balance, and connection
- **Blue** — Throat chakra; communication and authentic expression
- **Indigo** — Third-eye chakra; intuition, insight, and perception
- **Violet or purple** — Crown chakra; spirituality and higher reflection

Aura selection can support chakra-aligned journaling prompts, aura-based mood insights, weekly summaries, and visualizations of emotional or energetic patterns over time. The system should empower personal awareness without presenting aura meanings as objective diagnoses or universal facts.

## Current persistence and architecture

The current API uses file-backed JSON repositories for users, moods, and zodiac insights during local development. The codebase is organized into controllers, services, repositories, models, and DTOs so storage and business logic can evolve independently. Earlier architecture documentation describes a SQLite/Dapper direction; that documentation is historical and should not be treated as the current persistence implementation without reconciliation.

## Local development

Prerequisites are the .NET 9 SDK, Node.js 20 or newer, and npm. From the repository root:

```bash
dotnet restore AuraLogbook.sln
npm ci --prefix aura-ui
npm run dev
```

By default, the combined launcher starts the UI at `http://localhost:58407`, the API at `http://localhost:5082/api`, and Swagger at `http://localhost:5082/swagger` in development. A private JWT signing key must be configured with .NET user secrets before local registration or login.

## Project direction

The intended direction is a modular, API-first energetic journal that balances spiritual reflection with clear, empowering self-awareness. Likely extension areas include aura intensity, chakra-aligned prompts, weekly aura summaries, aura evolution charts, CSV export, reminders, streaks, and a personalized aura-insights engine.
