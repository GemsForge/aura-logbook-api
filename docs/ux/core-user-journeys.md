# Aura Logbook core user journeys

This map records the experience implemented in the current web app and separates it from the intended direction. It is a UX planning artifact for the Prism Garden dashboard work; it does not claim that every concept shown in the visual proposal already exists.

## Product-level path

```mermaid
flowchart LR
    A[Public home] --> B{Account}
    B -->|New user| C[Register and choose a pathway]
    B -->|Returning user| D[Log in]
    C --> D
    D --> E[Dashboard]
    E --> F[Log a mood]
    F --> G[Mood history]
    G --> H[Review dashboard patterns]
    H --> F
    G --> I[Edit or delete an entry]
    I --> G
```

Authenticated pages are protected: a signed-out visit to Dashboard, Log Mood, or Mood History redirects to Login. The public home CTA sends signed-out visitors to Login (registration is available in the top navigation) and signed-in users to Dashboard.

## Journey maps

### 1. First visit, account, and pathway

| Step | Current experience | Useful completion signal |
| --- | --- | --- |
| Discover | Public Home describes the product and offers “Start Your Aura Journey.” | User understands the product is for recording and exploring their own experience. |
| Create account | Register asks for email, password and confirmation, display name, birthday, and a pathway. Mindfulness is preselected; the current options are Mindfulness, Astrology & Energy, and Faith & Religion. | Validation is clear; registration success leads to Login. |
| Return | Login accepts email/password, hydrates the user session, then navigates to Dashboard. | Authenticated dashboard appears; session failure gives an error and leaves the user able to try again. |
| Personalize later | Profile card exposes Edit Profile, where pathway, aura preference, avatar, motto, and account details can be changed. | Saved preferences are reflected in the profile and theme. |

**Current boundary:** pathway selection is a profile preference and shapes optional check-in wording, daily thoughts, prompts, and interpretations. The mood-derived color itself follows recent check-ins; the pathway does not determine its hue. Current pathway labels and descriptions still need review against the inclusive experience principles before redesign copy is treated as final.

### 2. Record a mood

```mermaid
flowchart TD
    A[Dashboard or Log Mood navigation] --> B[Choose date]
    B --> C[Select one or more moods]
    C --> D[Optionally add a comment]
    D --> E{Valid entry?}
    E -->|No: date or mood missing| C
    E -->|Yes| F[Submit to API]
    F -->|Success| G[Success notice]
    G --> H[Mood History]
    F -->|Failure| I[Error notice; stay on form]
    I --> C
```

The compact date-and-time control sits inline at the top right beside New entry, replacing the static date/time text. New entries default to the current local minute and allow selecting an earlier journal date and time; future or invalid moments are rejected. Editing retains the selected occurrence and its original UTC offset. The API validates that its local date matches the day bucket, stores it separately from immutable CreatedAt, and preserves it when older clients omit the field. Timeline clocks and hour-based insights use occurredAt, falling back to CreatedAt for legacy entries. On desktop, the form has two columns: mood choices, impact topics, a compact note editor and photo/save actions on the left; an optional pathway reflection on the right. Phones stack these sections. Existing mood labels, illustrations and multi-selection remain unchanged, in a horizontally scrollable row with previous/next controls, leading with positive moods, then grouped by configured aura-color order and alphabetical within each group.

The impact question has its own section. The note editor remains optional and supports Markdown; the photo icon opens the existing private upload flow. A failed upload retries against the saved mood instead of creating a duplicate.

For Astrology & Energy, the optional invitation is shared with the Daily Astrology page. A chakra-pattern invitation requires matching entries on at least three distinct dates in the last two weeks; otherwise the selected pathway's daily prompt is used. Alex may select **Resonates**, **Maybe**, or **Not for me**. That explicit choice and the exact invitation save with the mood entry; leaving it unanswered saves no inferred response. Editing a mood restores its saved invitation and response. These are user-recorded connections, never diagnoses or claims of causation.

### 3. Review and manage mood history

| Step | Current experience | Important state or gap |
| --- | --- | --- |
| Open history | Use the authenticated sidebar’s Mood History link. | Initial list request runs when the page opens. |
| Narrow results | Choose optional start/end dates and select Filter. Future dates are disallowed; end date cannot precede start date. | No visible loading indicator is defined for filtering. |
| Read an entry | Each card shows date, mood tags, and any comment. | The current empty result is a blank list below the filters; there is no explicit first-entry invitation. |
| Edit | Choose Edit, update date/moods/comment in a modal, then save. | Success refreshes the list; failure is reported by a toast. |
| Delete | Choose Delete, confirm in a dialog, then remove the entry. | Success refreshes the list; failure is reported by a toast. Deletion is irreversible in the current UI. |

### 4. Review patterns and decide what to do next

The current Dashboard’s displayed order is:

| Priority in current screen | Content | Purpose / data source |
| --- | --- | --- |
| Orientation | Time-based greeting and profile card/sidebar | Recognize the user and expose navigation, profile editing, and Log Mood. |
| Personal context | Selected pathway card and optional zodiac insight | Show the current pathway and profile-derived zodiac content. Zodiac content is not the same as a mood-derived reflection. |
| Overview | Total entries, most frequent mood, current streak, last-entry date | Quick summary from the authenticated mood dashboard endpoints. |
| Context | Current weather card | Supporting context; current page passes a fixed Atlanta location. It can independently show loading or “Unable to load weather.” |
| Trends | Mood Breakdown and Mood Entry Timeline | Mood frequency and entry counts by date; the timeline query requests the last 7 days. |

The user’s natural next action is to log a mood, but the current Dashboard does not give that action a prominent in-content call to action. Empty data falls back to zero/“N/A” values and empty charts; Last Entry shows “No entries yet.” The whole dashboard has a shared loading state for its primary queries. Errors for summary/chart/zodiac requests do not have dedicated page-level recovery messaging in the current component.

**Not currently implemented:** a weekly aura summary, aura history/intensity visualization, prompt library, response history, or a personalized interpretation derived from the user’s past entries. These should not be shown as live or data-driven features until implemented and verified.

## Proposed pathway-module experience

This is the target experience reviewed for the next pathway design. It extends the current profile preference and should not be read as implemented behavior.

This **Core User Journey** is the source-of-truth plan for the pathway milestone and its acceptance checks. Keep the milestone description and implementation aligned with this Markdown document.

### Profile selection and navigation

- Move pathway selection into **Edit Profile → My Pathway**. For the first release, select one primary pathway at a time and configure that pathway’s modules in the same profile step.
- Keep pathway settings out of the main logbook navigation. The signed-in user opens them from Profile settings.
- Keep the existing journal destinations in the main navigation. Beneath them, show one nested module group for the active pathway, styled like the existing nested pathway navigation concept. Include only enabled modules in that group.
- Use a shared module catalog and reusable navigation/module UI. Associate catalog modules with the pathway(s) that can offer them. Reuse a common pathway-activity/insight record where the fields and lifecycle align, with explicit pathway, module, activity type, and structured content; keep sensitive or structurally distinct profile data (such as saved birth details) in its appropriate profile record.

### Shared mood logging

All pathways retain the same mood-entry experience. Add the optional multi-select question **“What’s having the biggest impact on you?”** with these context topics: Health, Fitness, Self-care, Hobbies, Identity, Spirituality, Community, Family, Friends, Partner, Dating, Task, Work, Education, Travel, Weather, Current Events, and Money. Treat these as user-recorded context, not causes of a mood.

Breathing is available in each pathway as a shared module. Its dedicated view uses an expanding/contracting visual at a comfortable 4-second inhale and 6-second exhale cadence, with a 3/3 option, pause, and reduced-motion behavior.

### Pathway modules

| Pathway | Navigation modules and page content |
| --- | --- |
| **Mindful Living** | **Mindfulness Guide**: wiki-style concepts covering present-moment awareness, non-judgmental attitudes, and starting and maintaining a routine; an optional educational overview of DBT mindfulness skills. **Practice Log**: user-recorded mindfulness practice without scores or streak pressure. Shared Breathing. |
| **Astrology & Energy** | **Daily Astrology**: one page containing the daily horoscope, optional birth-chart reading, and moon-phase mood counts with an optional reflection. Use FreeAstroAPI for daily horoscope and moon-phase data, and **FreeAstrologyAPI** (`freeastrologyapi.com`) for birth-chart calculations, replacing Astrology-API.io. These are separate provider accounts. Birthday can support a sun-sign reading; ask for birth time and place only for a deeper chart, and persist those details only after an explicit “Save birth details” choice. Keep provider keys server-side (`FreeAstroApi__ApiKey` and `FreeAstrologyApi__ApiKey`). The authenticated `GET /api/astrology/birth-chart` provider adapter is gated by saved birth details and the selected Astrology & Energy pathway. The server resolves the saved place through FreeAstrologyAPI geocoding, requires an unambiguous location, calculates the historical birth-time UTC offset, and normalizes tropical planet/sign/degree placements for the existing page; it does not supply written natal reports or house assignments. The two initial provider calls share account-wide pacing and successful repeat charts use the cache; a live synthetic birth-chart request was verified on November 13, 2026, returning 22 normalized placements from the selected provider. This does not establish browser acceptance for each saved user profile. Successful natal chart responses are cached in process memory for up to 30 days using a one-way hash of the birth inputs; they are not persisted to disk or the application database. The current API implementation also caches FreeAstroAPI daily readings and date-level moon phases and shares a request pacer across provider calls. **Chakra & Color Reference**: a separate wiki-like page with an actual human silhouette, seven centers, common Sanskrit and English names, body locations, color associations, and interpretive themes. Chakra descriptions, color associations, modern psychological pairings, reflection prompts, mood-association keys, and symbol asset metadata are stored as database-backed reference data rather than duplicated in the UI. An optional pattern invitation can appear after an associated mood is logged on at least three distinct days in a rolling 14-day window; it reports co-occurrence and asks the user whether the connection feels meaningful. |
| **Faith & Religion** | **Sacred Texts / Daily Reading**: one illustrated reading card. A supported, explicitly selected framework gets its matching daily passage: Christian Bible, Muslim Quran, or Jewish texts. With no supported framework, show a date-stable general quote from Aura’s existing authored quote catalog, credited to Aura Logbook. Do not render a literal “Word of the Day” card. Request only the selected framework through `GET /api/faith/passage?framework=...`; no passage request or framework-specific links for the general quote. Identify the text version/source and matching reading destination. A selected provider’s failure stays an unavailable passage, not a substitution from another tradition. Written responses save only after **Save to journal**, then appear in Reflections for editing/deletion. Christian content defaults to public-domain World English Bible; Quran passages use Quran.com/Quran Foundation; Jewish readings use Sefaria’s daily schedule/configured version. Preserve translation licensing and attribution; API.Bible requires FUMS before enabling its key. The legacy word-of-day API remains compatible but is not used by this view. **Faith Practice Check-In**: choose and revise practices to track; record “Did / Didn’t today” only for selected practices, with an optional note. Save preferences as private `faith-practice-preferences` activities and check-ins separately. **Faith Practice Insights**: frequency/counts for selected practices (sacred reading, prayer/supplication, contemplation, worship/gathering, gratitude, service/care), without scores, streak pressure, or causal mood claims. Neutral terms by default. Shared Breathing. |

The module views use existing pathway illustrations and the shared aura underglow, compact controls, and few borders. Astrology pairs sign artwork and an expandable sign reference with the provider reading; selectable lunar phase illustrations expose actual mood counts rather than implying a current measurement or a cause. Mindful Living pairs its landscape with selectable concepts/DBT skills and a concrete practice step, plus a separate saved-practice timeline. Seven chakra reference rows retain their body locations, terms, colors, and symbols. The approved breathing orb and cadence stay shared across pathways.

Mindful Living’s guide and practice log are enabled for older profiles whose preferences are absent or contain only legacy intentions such as calm/rest. Explicit empty or individual module selections remain respected across Profile settings, desktop/mobile navigation, and route availability. Only one primary pathway is active.


### Pathway artwork

- Create a coordinated, individually usable set of **seven chakra illustrations** and **twelve zodiac-sign illustrations** for the Astrology & Energy pathway. The chakra set should complement the chakra wiki’s human body map and its center-specific names and color associations; the zodiac set should make each sign recognizable without depending on color alone.
- Match the existing Aura visual direction with polished, distinctive artwork rather than generic icons. Keep chakra and zodiac art pathway-specific and register every asset, intended use, and accessibility description in the asset manifest and preview contact sheet.
- The repository already contains seven chakra-symbol SVGs and shared Astrology & Energy moon/orbit/crystal artwork, and the twelve zodiac-sign illustrations now used by the sign reading. Review the current chakra symbols beside the new illustrations before replacing active references; preserve the existing source assets until the replacement set is accepted and integrated.

### Interpretation and content boundaries

- In Astrology & Energy, describe moon-phase results as counts or observed co-occurrences from the user’s own entries. Do not imply that a phase caused a mood.
- In Faith & Religion, if no supported framework is selected, show a general Aura-authored quote and hide framework-specific reading links; do not request a sacred passage. Selecting a framework reveals only its supported passage and matching reading link. Identify the text version/source and follow its display, attribution, caching, and licensing terms.
- In the chakra reference, include familiar contemporary psychological pairings as one explicitly labeled interpretive lens: survival/fear (Root), pleasure/guilt (Sacral), willpower/shame (Solar Plexus), love/grief (Heart), truth/lies (Throat), insight/illusion (Third Eye), and cosmic or spiritual connection/attachment (Crown). Pair these with the common names and body map, but do not describe them as universal or fixed traditional teachings, or diagnose a user’s state. Mood-linked chakra suggestions remain optional invitations; the user decides whether they are meaningful.
- Across every pathway, offer optional **Resonates / Maybe / Not for me** feedback. Use feedback only to tune future suggestions of the same insight type. Offer **Save to journal** for written reflections; do not save them without an explicit action. Saved pathway reflections use the private `pathway-reflection` activity type and appear in Reflections with edit and delete controls.
- Faith practice insights summarize only the user’s own opt-in daily check-ins. Do not infer belief, commitment, or spiritual wellbeing from a missed practice; offer optional feedback on a faith insight and tune only later faith-practice insights.

### Embedded sacred-text reader (requested extension)

The [embedded reader experience](sacred-text-reader.md) supersedes the earlier
link-out-only target for full readings. The daily card currently displays a
passage with source links; the full reader is still planned. Its primary action
should open the matching text inside Aura with chapter/section navigation,
highlights, private notes, bookmarks, text-size controls, and personal-note
exports. A custom Aura reader shell with a reusable annotation package is the
recommended direction; package selection and persistence contracts require a
focused prototype. Framework source matching and the general quote fallback
remain unchanged.

### Proposed recap history

The requested richer [Daily Astrology experience](daily-astrology-experience.md)
keeps sign identity, today's horoscope, current and natal Moon context, the sign
wiki, meaningful birth-chart explanations, and a reading check-in on one page.
The check-in records "I read today's horoscope" separately from optional Yes/No
resonance and contributes reading-specific counts to Insights and recaps. This
binary check-in applies to horoscope readings; other insight types retain their
existing three-choice feedback. Untouched responses remain unknown.

The [Pathway recap data plan](pathway-recap-data-plan.md) defines candidate durable
inputs for weekly/monthly pathway recaps: versioned source content, private user
activities linked to the exact reading or invitation, and shared mood/practice
context. This is a proposed extension; existing provider caches remain in memory
until retention, chart-history consent, and provider storage permissions are
settled. Explicit **Save to journal** behavior remains part of that plan.

The recap plan distinguishes FreeAstroAPI **Daily Sign** (currently integrated)
from the proposed **Daily Personal** reading based on birth details and transits.
Both belong on the same Daily Astrology page, with separate source snapshots and
feedback identities. Personal daily readings need an explicit choice to use birth
details and their own response mapping; they are not the stable natal chart.

### Milestone-level acceptance checks

1. Profile settings select one primary pathway and configure its modules; the navigation displays only enabled modules for that pathway under the nested pathway heading.
2. The mood logger accepts optional context topics across all pathways, and the shared breathing page visibly expands on inhale and contracts on exhale.
3. Astrology & Energy presents horoscope, birth chart, and moon-phase mood insights together; chart birth time/place remain optional and are saved only by explicit choice.
4. Mindful Living includes the wiki guide and separate practice log; Faith & Religion includes a single daily passage or general quote, a saved user-selected faith-practice list with check-in and frequency insights, and Sacred Text content/reading links gated by the selected supported framework.
5. The chakra reference uses a human silhouette and presents the seven-center terminology plus contemporary theme/challenge pairings as an optional interpretive lens.
6. Interpretive feedback is optional, non-diagnostic, and only tunes later suggestions of the same insight type. Written pathway reflections remain private and unsaved until the user taps **Save to journal**, then appear in Reflections with edit and delete controls.
7. The Astrology & Energy artwork set contains seven distinct chakra illustrations and twelve zodiac-sign illustrations, is registered in the asset manifest/contact sheet, and has been visually reviewed before any existing chakra symbols are retired.

## Cross-journey states to design for

| State | Current behavior | UX direction for the redesign |
| --- | --- | --- |
| Signed out | Protected routes redirect to Login. | Preserve the intended destination when practical; make registration easy to find. |
| Form validation | Inline messages identify invalid/missing values; API failures use toast notices. | Keep errors next to the field or action and explain how to recover. |
| Empty journal | Dashboard reports “No entries yet”; history has no explicit empty-state panel. | Offer one gentle, non-judgmental first-entry action; avoid implying the user is behind. |
| Network/service error | Weather has an inline error; mood form/history use toast notices; dashboard data errors may look like zero/empty values. | Distinguish “no data yet” from “could not load”; offer retry where appropriate. |
| Optional interpretation | Pathway and aura language appear in profile/dashboard and mood-color tooltips. | Keep core journaling usable without spiritual framing; make interpretations invitational and clearly optional. |
| Sensitive reflection | Comments are user-authored mood-entry text. | Keep ownership, privacy, and control visible; do not imply entries are public or analyzed unless true. |

## Dashboard hierarchy for the next concept

Recommended order for design exploration—not a claim about current implementation:

1. **Arrive and orient:** a warm greeting with a small, clear “Log a mood” action.
2. **Reflect now:** mood check-in and optional user-authored note; pathway language remains optional.
3. **Notice patterns:** a compact, honest summary and one legible trend visualization based only on recorded data.
4. **Supporting context:** weather and zodiac/pathway content are secondary, skippable, and never presented as causes of a mood.
5. **Return to the journal:** recent entries with a route to full history.

The next design story (#217) can turn this hierarchy into the profile-ready dashboard concept. Responsive/accessibility decisions belong to #218, and the [SwiftUI shell adaptation plan](swiftui-shell-adaptation.md) documents #219.

## Open UX questions and assumptions

- Should choosing a pathway remain part of account creation, or should users be able to skip it and select one later? The current form requires a pathway and defaults to Mindfulness.
- Should the primary check-in record the user’s aura color/intensity directly, or only the selected mood(s) and their mapped color association? These are distinct data semantics.
- What does a “current streak” mean when users can backdate entries? Confirm the rule before giving it prominent motivational weight.
- Should weather be personalized to a user-selected location, hidden, or opt-in? The current Dashboard uses Atlanta as a fixed location.
- What should be shown when one dashboard service fails while others succeed? Current loading/error behavior is inconsistent across widgets.
- What is the first-entry and no-results history experience? Both should invite without pressure.
- What language should replace current “Astrology & Energy” and “Faith & Religion” labels to match the agreed Aura, Mindfulness, and user-defined Faith/Spirituality pathways?

## Evidence and verification

This map was checked against the current route definitions, screen/components, API calls, and UI tests:

- [`router.tsx`](../../aura-ui/src/router.tsx) and [`ProtectedRoute.tsx`](../../aura-ui/src/routes/ProtectedRoute.tsx)
- [`Home.tsx`](../../aura-ui/src/pages/Home.tsx), [`Register.tsx`](../../aura-ui/src/pages/Register.tsx), and [`Login.tsx`](../../aura-ui/src/pages/Login.tsx)
- [`MoodEntryForm.tsx`](../../aura-ui/src/components/MoodEntryForm.tsx) and [`MoodEntryFormFields.tsx`](../../aura-ui/src/components/MoodEntryFormFields.tsx)
- [`MoodHistory.tsx`](../../aura-ui/src/components/history/MoodHistory.tsx) and [`MoodCard.tsx`](../../aura-ui/src/components/history/MoodCard.tsx)
- [`Dashboard.tsx`](../../aura-ui/src/pages/Dashboard.tsx), [`WeatherCard.tsx`](../../aura-ui/src/components/weather/WeatherCard.tsx), and [`moodApi.ts`](../../aura-ui/src/store/moodApi.ts)
- Focused UI tests: `aura-ui/src/pages/tests/{Dashboard,MoodEntryForm,MoodHistory,RegisterForm,LoginForm}.test.tsx` and `aura-ui/src/routes/ProtectedRoute.test.tsx`.

The tests render screens with mocked services; they confirm component behavior, not a live end-to-end session. For a live walkthrough, use a local account and verify: signed-out route protection; registration/login; one valid and one invalid mood submission; history filtering/edit/delete; zero-entry dashboard; and weather/API failure recovery. Do not use real personal journal content as test data.
