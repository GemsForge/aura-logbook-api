# Pathway recap data plan

Status: proposed extension, November 13, 2026. This document plans durable recap
inputs; it does not change the database, background collection, or consent behavior.

The [Core user journeys](core-user-journeys.md) remain the product source of truth.
This plan extends their pathway experience and preserves explicit journal saving,
optional interpretation, and user control over whether a connection is meaningful.

## The outcome

A weekly or monthly recap should connect the user's recorded experiences,
practices, and optional reactions to the specific content they encountered. It
should be possible to explain where each statement came from without requesting
an old reading again or treating an interpretation as a diagnosis.

## Current implementation and gap

- `PathwayActivities` already stores private practice records, faith practice
  preferences, written reflections, and optional insight feedback.
- Written pathway reflections retain an insight type, prompt, and response.
  Feedback retains an insight type and response, but neither links to an immutable
  version of the exact provider reading or insight card.
- Daily horoscopes, date-level moon phases, and birth charts use process-memory
  caches. Those caches do not provide a durable history after a restart.
- Saving optional birth time and place currently authorizes retaining those
  profile fields. This plan does not silently extend that choice to retaining
  chart history or location-lookup responses.

## Relevant information by experience

| Experience | Candidate durable data | Recap value |
| --- | --- | --- |
| Daily Sign horoscope | Analysis type `daily-sign`, provider, sign, effective date, language, source identifier/version, theme, keywords, supporting insights, and the exact text shown when storage rights permit. Link optional user feedback and explicitly saved reflections to that snapshot. | Revisit a sign reading the user responded to and distinguish different daily readings of the same insight type. |
| Daily Personal horoscope | Private analysis type `daily-personal`, owner and birth-input version, effective date and time zone, provider/engine version, theme, keywords, selected transits, focus areas, displayed interpretation blocks, and the active-window/exact-hit references used in the card. | Revisit the specific personal reading and its timing alongside user-recorded moods/context and explicit feedback; do not treat a transit as a cause of a mood. |
| Birth chart | Private normalized planet/sign/degree placements, chart framework/settings, provider and calculation version, retrieval time, and an input-version fingerprint. Store a new version only when relevant inputs/settings change, under an explicit chart-history retention choice. | Reuse the chart as an interpretive reference and connect saved reflections to the version they used. A natal chart is stable reference context, not a daily-changing mood measure. |
| Moon and mood context | Date, phase identifier/name, observation timestamp, time-zone/date-bucketing rule, provider, and calculation version. Preserve the link between a mood entry's local date and that phase. | Recompute counts from actual mood entries and show coverage across phases without attributing moods to the moon. |
| Chakra reference and invitations | Chakra key/name, reference-content version, theme key, invitation text/version, and the exact mood-entry evidence and date range used. Link explicit feedback and saved reflections to that invitation. | Revisit grounding, expression, or other themes the user explored and whether that particular invitation resonated. Do not infer a blocked chakra from a mood. |
| Sacred texts and Word of the Day | Selected framework at the time, provider/source, passage reference, language, translation/version, and the wording of Aura's neutral prompt. Retain external text only under verified storage permissions; otherwise retain the reference and permitted attribution. Link explicit journal saves and practice check-ins. | Revisit passages and reflections the user chose to save, alongside their own recorded practices. Displaying a passage or opening a link does not establish that the user read it. |
| Mindful Living and shared breathing | Concept/skill key and content version; explicitly logged practice, date, duration where supplied, and optional note. A breathing session may contribute actual active duration, selected cadence, and an explicit completion/record action if session logging is introduced. | Summarize the practices the user recorded and their own reactions. Do not infer a completed session from a timer opening or count paused time as practice. |
| Shared mood log | Mood-entry IDs, recorded moods, impact topics, local dates/time-zone context, and current edit/delete state. | Keep work, family, health, and other user-selected context visible in every pathway recap. These are recorded context, not proven causes. |

## Daily Sign and Daily Personal response mapping

The two supplied provider response examples were reviewed on November 13, 2026.
The first is Daily Personal V3 and the second is Daily Sign V2. These are separate
analysis types within FreeAstroAPI. They do not change the selected FreeAstrologyAPI
provider for the stable natal-chart calculation.

Current runtime support is Daily Sign only. Daily Personal is a proposed extension
on the same Daily Astrology page, available after a deliberate choice to use birth
details for a personal daily reading. Saving birth details for a chart should not
silently start daily personal requests or send those details to a second provider.

| Response field | Proposed use |
| --- | --- |
| `data.sign`, `data.date`, language and time-zone settings | Identify the actual reading and its local day; preserve the resolved provider date instead of guessing it from the server clock. |
| `meta.generated_at`, engine name/version, settings/version | Record retrieval/generation provenance, calculation version, and interpretation-block setting. Request IDs are optional diagnostic metadata, not the stable snapshot identity. |
| `data.content.text` | Retain the Daily Sign wording actually shown, where permitted. The supplied Personal response has no `text` field, so it cannot use the existing text-only adapter unchanged. |
| `data.content.theme`, `keywords`, `supporting_insights` | Preserve supplied themes and any supporting text actually displayed, rather than inventing retrospective themes. |
| `data.astro.moon_sign`, `moon_phase`, `highlights` | Retain structured source context for the reading. Moon/mood aggregation still uses the chosen date-bucketing rule and phase observation timestamp. |
| `data.personal.transits_top` | Preserve transit/natal point/aspect keys and labels, exact timestamps, and any displayed `explanation` fields. These provide the source for the personal insight card. |
| `data.personal.focus_areas` | Optional provider-labeled reflection context. Do not store it as though the user selected the same impact topic in their mood entry. |
| `data.personal.active_windows`, `exact_hits`, `next_shift` | Keep the IDs/lookup keys, timestamps, labels, and boundaries used by the displayed card. Reuse an interval across dates rather than counting every daily appearance as a new event. |
| `data.personal.dominant_topics` | Context that may span the month. Keep its interval/category and deduplicate it across daily snapshots before a weekly/monthly recap. |
| `data.personal.day_context` | Alternate grouping of timing data. It overlaps the top-level personal arrays in the supplied response; normalize one canonical set rather than counting both copies. |
| `data.personal.insights_meta` | Track source/range and whether timeline, insights, and interpretation blocks were enabled. Provider fact/window counts are not user-activity counts. |
| `scores`, `score_factors`, `confidence_score`, `supportive_vs_challenging`, `lucky` | Exclude from the proposed first recap experience. These are provider-generated rankings/interpretations, not the user's measured health, emotions, relationship quality, certainty, or completed practices. They must not overwrite user-recorded mood or impact context. |

The supplied Personal response sets `include_interpretation_blocks` to false and
contains no transit explanations. The provider documents
`include_interpretation_blocks=true` for optional V3 explanations. If explanations
are requested but missing, show supported factual labels or an explicit unavailable
state; do not invent a written reading. Verify availability against the selected
provider account before implementation acceptance.

Use separate snapshot and feedback identities for `daily-sign` and `daily-personal`
so reacting to one does not silently change the other mode's recommendations.
An explicit user reaction must reference the exact reading/transit instance, not
only the broad `horoscope` category currently stored by the application.

Personal snapshot/cache identity includes owner, birth-input version, effective
date, target time zone, language, calculation version, and relevant options.
Daily Sign content may be shared by sign/date/language/version where permissions
allow; Daily Personal results must remain private to their owner. Fetch personal
readings on demand rather than backfilling past days with new API responses and
presenting them as readings the user previously encountered.

The screenshot's SVG design controls and hosted MCP configuration are separate
developer capabilities. The two daily readings use server-side REST calls; this
plan does not add SVG controls to the user experience or configure an MCP client.

Provider references:

- [Endpoint map](https://www.freeastroapi.com/llms.txt)
- [Daily Sign](https://www.freeastroapi.com/docs/western/daily-sign): `GET /api/v2/horoscope/daily/sign`
- [Daily Personal](https://www.freeastroapi.com/docs/western/daily-personal): `POST /api/v3/horoscope/daily/personal`

## Storage responsibilities

1. **Versioned shared content snapshots:** retain the selected public source fields
   needed to reconstruct the content shown, subject to provider permissions.
   Deduplicate using provider, source item, effective date, sign where applicable,
   language/translation, settings, and content hash. Never put personal chart inputs,
   user reactions, private journal text, or user-specific insights in a shared cache.
2. **Existing private pathway activities:** retain user actions in the established
   owner-scoped activity model. Add validated references to the exact snapshot or
   private insight instance and subject key (for example, a chakra key). Preserve
   insight type so feedback still tunes only that same type. Do not duplicate the
   full reading in each activity or save a journal draft without its save action.
3. **Private chart and generated-insight snapshots:** keep user-specific results
   owner-scoped and versioned. Public content may be referenced; personal evidence
   must stay private. Any new reference must be validated by the server so an
   activity cannot attach another user's chart, mood entry, or private insight.

Use an allow-list of normalized fields rather than keeping arbitrary raw provider
responses. Never retain API keys, request headers, account/billing metadata, raw
location-search result lists, or exception dumps as recap content. Runtime caches
can continue to reduce API usage alongside durable, versioned history.

## Timing and user meaning

- Provider content may be fetched before it is displayed. A fetch is not a view,
  a view is not a completed reading, and a completed reading does not imply agreement.
- Proposed first-release personal recap evidence: explicit feedback, saved
  reflections, mood logs, and deliberately recorded practices. Shared reference
  content may be retained independently, subject to provider terms.
- Whether to retain a private history of merely displayed readings remains an open
  product choice. No passive personal viewing history is introduced by this plan.
- Use separate effective dates, retrieval timestamps, display/action timestamps
  where relevant, and the user's local date/time-zone context. A historical recap
  uses the pathway/framework recorded with each activity rather than relabeling all
  past activity using today's profile selection.
- A missed check-in is unknown. An explicit "Didn't" is a recorded response.
  Feedback percentages use actual responses as their denominator; sparse mood
  coverage and missing phase lookups remain visible.

## Recap evidence and deletion

Every recap statement should identify its reporting period and supporting mood,
activity, snapshot, and rule/version references. Report counts and invitations
rather than diagnoses or causal claims. A sample pattern is: "You explored the
grounding theme three times and marked it Resonates twice. Does that connection
still feel meaningful?" A birth-chart reference should not be presented as a
measured change in the user's state.

Recompute factual aggregates from current source records. If recap text is saved,
keep its generation version and evidence references and refresh or invalidate it
when a supporting mood entry, reflection, practice, or feedback response is edited
or deleted. Removing a user's private data must also cover derived recap evidence
and private chart history; unrelated public reference content is separate.

## Decisions before implementation

- Confirm the first-release recap period and scope; weekly with monthly later is
  the proposed starting point.
- Confirm explicit-action evidence versus a personal history of displayed readings.
- Define the chart-history opt-in and what happens when it is withdrawn.
- Verify each provider/translation's storage permissions and choose retention
  periods for shared source snapshots, private snapshots, and saved recap text.
- Define minimum coverage and wording for each insight type and how incomplete
  data is shown.

## Verification expectations

- A restart does not erase approved recap inputs or change the content linked to
  an existing reflection; fetching the same source item does not duplicate history.
- Owner checks apply to every activity, chart, generated insight, and evidence link.
- API keys and unrelated raw fields are absent from persisted snapshot payloads.
- Historical pathway/framework and local-date context survive profile changes.
- Missing check-ins, sparse phase coverage, and unanswered feedback are not
  counted as negative responses or failed practices.
- Editing/deleting source records removes their contribution from future recaps.
- Provider errors create an unavailable state, not a fabricated reading or a
  completed-practice record.
