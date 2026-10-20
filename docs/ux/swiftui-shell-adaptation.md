# SwiftUI shell adaptation plan

This note defines how Aura Logbook's current web experience can become a native iPhone experience without splitting the product into two different journeys. It is UX and architecture guidance for a future SwiftUI shell; it does not create an Xcode project or claim that the API is ready for public mobile use.

The iPhone app should be a native SwiftUI client of the shared Aura Logbook API. A `WKWebView` may be useful for a short-lived prototype, but it is not the target shell: an iPhone cannot use the Mac's `127.0.0.1` services, and wrapping the current responsive website would carry web navigation and accessibility behavior into a place where people expect native controls.

## Product contract shared by web and iPhone

Both clients must preserve the same:

- core journeys: sign in, notice the day, log a mood, optionally reflect, review history, and notice recorded patterns;
- inclusive pathways: Aura/color reflection, Mindfulness/everyday journaling, and user-defined Faith & Spirituality;
- optional, invitational interpretation described in the [experience principles](experience-principles.md);
- user-owned journal data, privacy boundaries, and server-enforced authorization;
- semantic Prism Garden tokens and restrained jewel accents from the [visual system](prism-garden-visual-system.md);
- distinctions between empty, loading, unavailable, offline, and successfully loaded states;
- API meanings, validation rules, date formats, and ownership rules.

The clients may arrange those capabilities differently. Native adaptation is not pixel matching.

## Information architecture

Use a native `TabView` as the signed-in iPhone shell:

| Tab | Purpose | Current web counterpart |
| --- | --- | --- |
| **Today** | Greeting, primary check-in, concise summary, recent context | Dashboard |
| **Log** | Focused mood and optional reflection flow | Log Mood |
| **Journal** | History, filtering, entry detail, edit, and delete | Mood History |
| **Profile** | Account, pathway, aura preferences, and settings | Dashboard profile/sidebar and Edit Profile |

Insights can begin as a section on Today or Journal. Give it a dedicated tab only when the implemented data is useful enough to justify a permanent destination. Weather, zodiac, and pathway material remain supporting context, not primary navigation.

Signed-out screens use a small `NavigationStack`: Welcome → Log in or Create account. After authentication, replace that stack with the tab shell rather than preserving web-style header links.

## Prism Garden: invariant and native adaptation

| Keep consistent | Adapt for iPhone |
| --- | --- |
| Warm canvas, ivory surfaces, calm spacing, readable ink colors, and rare jewel accents | Use semantic SwiftUI colors that respond to appearance and increased contrast; do not hard-code web CSS values in views. |
| Tiny abstract prism as a brand signature, not a belief symbol | Use it in the app icon, launch/empty moments, or a small brand position—not as a repeated control shape. |
| Editorial warmth in display headings and system-readable body copy | Use Dynamic Type text styles and system controls. A bundled display face is optional and must scale without clipping. |
| Color paired with names, symbols, and values | Expose selected state, labels, accessibility values, and chart summaries independent of hue. |
| Soft texture as atmosphere | Keep texture decorative, low contrast, and outside reading/control surfaces; respect Reduce Transparency. |
| Gentle, non-judgmental feedback | Use native alerts, confirmation dialogs, sheets, progress indicators, and haptics sparingly. |
| Comfortable rounded cards | Prefer native grouped sections and containers; do not turn every row into a floating web card. |

Use `NavigationStack`, `TabView`, `Form`, `List`, `ScrollView`, `sheet`, `confirmationDialog`, and native date/picker controls before building custom equivalents. Respect safe areas, Dynamic Type, VoiceOver, Switch Control, Reduce Motion, Reduce Transparency, increased contrast, and light/dark appearance. The iPhone shell should feel like Prism Garden living on iOS, not a desktop dashboard squeezed into a phone.

## Annotated journey translation

### Today / dashboard

| Order | Web at a wide viewport | Native iPhone shell |
| --- | --- | --- |
| 1. Orient | Sidebar/header plus greeting | `NavigationStack` title, compact greeting, Profile tab for account details |
| 2. Act | Add a prominent Log Mood action in page content | Primary “Log a mood” button or the persistent Log tab; no duplicate hamburger navigation |
| 3. Reflect | Primary reflection/check-in panel | One full-width section with large touch choices and an optional note |
| 4. Notice | Summary cards and charts | Short summary rows/cards, then a native, horizontally legible trend view with a text summary |
| 5. Context | Weather, pathway, or zodiac cards | Secondary sections after recorded data; independently retryable and easy to skip |
| 6. Return | Recent entries and link to history | Recent rows with native disclosure into Journal detail |

Phone reading flow:

```text
Today
├── Good morning + Log a mood
├── Optional check-in / reflection
├── Your recent pattern (recorded data only)
├── Recent entries
└── Optional context: pathway, weather, zodiac
```

Do not recreate the desktop side rail or a multi-column dashboard. Today must remain useful when weather or an optional interpretation service fails.

### Mood logging

| Step | Shared behavior | SwiftUI presentation |
| --- | --- | --- |
| Enter | Start from Today or Log | Log tab opens a focused `NavigationStack`; retain an unfinished local draft during the session |
| Date | Defaults to today and follows the same backdating rules | Native `DatePicker` with a clear label |
| Mood | At least one named mood is required | Large labeled choices with selected state that is not color-only; use a grid only when Dynamic Type still fits |
| Aura | A direct aura selection is distinct from a mood's color association | Optional named color picker and intensity control only when the API contract stores those values for the entry |
| Reflect | User-authored note and future pathway-aware prompt are optional | Expandable or subsequent section; always offer neutral wording and Skip |
| Save | Same validation and ownership rules as web | Disable only when the reason is clear; announce progress and errors; preserve the draft after recoverable failure |
| Complete | Entry is available in history and summaries | Confirmation with “View entry” and “Back to Today”; avoid celebratory pressure or streak-shaming |

VoiceOver should announce each mood's name, selected state, and any optional aura association. Tooltips and hover behavior from the web do not carry to touch; meanings belong in accessible help text or a detail sheet.

## Native shell boundaries

### The shell owns

- Apple navigation, scene lifecycle, safe areas, appearance, accessibility preferences, and app state transitions;
- secure session storage in Keychain, logout cleanup, and authentication recovery;
- API configuration, request execution with `URLSession`, decoding, cancellation, retry decisions, and offline messaging;
- native view state and presentation for loading, empty, error, and saved outcomes;
- privacy-sensitive permission prompts only when a feature truly needs them.

### The API owns

- credentials and authentication decisions, token issuance/validation, and user identity;
- journal ownership and authorization for every read or mutation;
- validation and canonical data contracts;
- prompt filtering, summaries, interpretations, and other business rules intended to remain consistent across clients;
- external provider secrets and weather/provider calls.

The app bundle must contain no JWT signing key, database credential, or provider secret. A bearer token returned by the current login API belongs in Keychain—not `UserDefaults`. Client-side filtering is never an authorization boundary.

## Technical shape

Start with these replaceable modules rather than one global application object:

```text
AuraLogbookApp
├── AppShell             Tab and navigation coordination
├── Session              authentication state and Keychain token access
├── APIClient            URLSession transport, decoding, typed errors
├── Features
│   ├── Today
│   ├── MoodLog
│   ├── Journal
│   └── Profile
├── Models               API request/response types and date coding
└── DesignSystem         semantic colors, spacing, typography, components
```

Keep view state feature-scoped. Depend on small protocols for API and token access so previews and tests can use deterministic fakes. Generate or hand-maintain Swift DTOs from a versioned OpenAPI contract; do not copy TypeScript models by sight. Document one date/time convention before writing decoders.

Use build configuration (`.xcconfig` or equivalent) for the API base URL:

- local Simulator testing may use a reachable Mac host and development HTTP exception only when deliberately configured;
- physical-device development needs a LAN-reachable development API or, preferably, a development HTTPS environment;
- TestFlight and production builds require a stable HTTPS endpoint accepted by App Transport Security;
- no shipped configuration may assume `localhost`, because that means the phone itself.

Unlike the GemLife macOS host, the iPhone app should not launch or supervise the API or web UI. Those services run elsewhere. Reuse GemLife's lessons about explicit configuration, bounded retry, clear service status, secure server-side authorization, and provider-adaptable authentication—not its local WebView process topology.

## Readiness dependencies

Before feature implementation begins, confirm:

1. **Reachable API:** a development HTTPS environment (or deliberate device-testing setup) and a production hosting plan.
2. **Stable contract:** OpenAPI describes auth, profile, reference data, mood, reflection, dashboard, weather, and error responses; compatibility/versioning expectations are written down.
3. **Mobile-safe auth:** login/register work over HTTPS; token lifetime, refresh or reauthentication behavior, logout, revocation, and password recovery are defined. The current unprotected password-reset shape is not production-ready.
4. **Consistent data:** canonical ISO date/time encoding, nullable fields, enums/reference IDs, pagination/filtering, and user-facing error contracts are explicit.
5. **Reference data:** aura colors, moods, chakras, and pathways come from API/reference contracts so web and native clients do not drift.
6. **Privacy:** journal-data retention/deletion, analytics policy, privacy disclosure, and permission needs are decided before distribution.
7. **Apple delivery:** bundle identifier, signing team, app icon, supported iOS version, TestFlight/App Store ownership, and release environments are assigned when implementation starts.

Current local API and Swagger are enough for contract exploration and Simulator prototypes, but not for an iPhone away from the development Mac.

## Delivery slices after this planning story

1. **Contract and hosting readiness:** publish a mobile-safe development API, harden auth/recovery, and establish an OpenAPI compatibility check.
2. **Native foundation:** create the Xcode project, semantic design tokens, API client, Keychain session, app shell, previews, and test fakes.
3. **Account and core journal:** implement welcome/login/register, Today, mood logging, journal history/detail, and profile using the shared contracts.
4. **Reflection and insights:** add prompts, accessible trends, summaries, and optional pathway context only as supported by real API data.
5. **Device hardening:** exercise offline/error recovery, Dynamic Type, VoiceOver, appearance/contrast settings, performance, privacy disclosures, and TestFlight feedback.

Each slice should be its own bounded issue and PR. Do not combine the entire native app into one implementation story.

## Verification for #219

Review the following two walkthroughs against this note, the [core user journeys](core-user-journeys.md), and the [responsive/accessibility direction](responsive-accessibility.md):

1. **Dashboard/Today:** signed-in orientation → Log a mood → recorded summary → recent entries → optional context. Confirm the order and meaning remain the same while navigation and layout become native.
2. **Mood logging:** date → named mood selection → optional aura/reflection → validation/save → history/detail. Confirm the same data and recovery behavior, with no hover-only or color-only interaction.

For both walkthroughs, verify that all three pathways can use the same core flow, neutral language is always available, spiritual content is optional, and no step depends on a desktop side rail, fixed-width card, hover tooltip, browser storage, or local Mac service.

## Out of scope

- creating the Xcode project or Swift source;
- reproducing every current web screen or visual detail;
- embedding the production web app in `WKWebView`;
- choosing App Store marketing, subscriptions, analytics, or push-notification behavior;
- claiming mobile readiness before HTTPS hosting, production auth, privacy, device, and accessibility verification exist.
