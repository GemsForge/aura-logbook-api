# Daily Astrology experience

Status: planned expansion, November 13, 2026. This captures the requested richer
Astrology & Energy page; it does not describe all current runtime capabilities.

Source of truth: [Core user journeys](core-user-journeys.md). The
[pathway recap data plan](pathway-recap-data-plan.md) defines source snapshots,
private activity records, and outstanding retention decisions.

## User outcome

The user can understand their sign, read today's horoscope, explore lunar context
and their optional birth chart, and record whether they read and related to the
reading. Their own responses and mood logs provide evidence for later recaps.

## One page in pathway navigation

Keep the existing Daily Astrology destination within Astrology & Energy. It holds
the following experiences together; the sign wiki and birth chart do not require
separate navigation destinations. Breathing and Chakra & Color Reference remain
the pathway's other modules.

| Region | Content and behavior |
| --- | --- |
| Your sign | Name, recognizable artwork/symbol, zodiac framework, element, and a concise sign summary. Identify the Sun sign separately from optional Moon and Rising placements. |
| Horoscope of the day | Full Daily Sign reading, actual reading date, theme, keywords, and relevant supporting insights. An explicitly enabled Daily Personal mode adds personal transit explanations and timing. Identify which mode the user is reading and keep each mode's response/history separate. |
| Today's Moon | Current phase and Moon zodiac sign, each with a short explanation. Include illumination or timing only when supported by the source data. Show the user's natal Moon sign separately when full birth details make it available. If personal transit data provides a lunar connection, explain the actual reported connection rather than implying that a phase alone establishes personal alignment. |
| Reading check-in | A compact read checkbox and separate optional Yes/No resonance response tied to that exact reading. An optional written reflection retains the explicit Save to journal action. |
| About your sign | An expandable wiki containing the common symbol/name, approximate date range with boundary caveat, element, modality, ruling-planet association, common strengths, common challenges, and reflection prompts. Define unfamiliar terms and cite the editorial sources. Present typical characteristics as associations the user can accept or reject. |
| Your birth chart | Start with Sun, Moon, and Rising, each with a plain-language explanation and the calculated sign. Offer expandable explanations for other supported placements, with degree details secondary. Do not show unavailable Rising information as known or substitute a guessed birth time. Houses/aspects require their own verified calculation source before being shown. |
| Your patterns | Summarize deliberate reading check-ins, responses, saved reflections, and recorded mood/impact context. Link to fuller pathway metrics in Insights. Moon-phase mood comparisons show actual counts and coverage, without claiming causation. |

## Rich content with a compact interface

- Keep the sign identity and today's reading prominent. Use expandable detail for
  the wiki, glossary, and extended chart placements.
- Follow the existing Aura shell and selected interface theme. Use typography,
  spacing, and restrained dividers rather than repeated nested bordered cards.
- Keep buttons compact and use labeled icon actions where their meaning is clear.
  Reading explanations should be useful and specific; do not fill the page with
  repeated notices or raw provider JSON.
- Wiki definitions and sign/planet meanings belong in versioned reference data.
  They should not require a fresh external API call whenever the page opens.
- Stable birth-chart explanations require reviewed interpretive reference content
  in addition to calculation data. FreeAstrologyAPI planetary output alone does
  not supply the written insight. Daily Personal transit explanations are a
  separate dated experience from those stable chart interpretations.

## Two check-in fields

| Field | User-facing control | Stored meaning |
| --- | --- | --- |
| `hasRead` | "I read today's horoscope" checkbox | True after the user marks it read; false only after an explicit contrary response/correction; null before a response. Rendering the page never sets it to true, and an untouched checkbox is not evidence of false. |
| `resonated` | "Did it resonate?" — Yes / No | True, false, or null when unanswered. This optional response belongs to a reading marked as read. It is separate from reading completion. |

This binary horoscope check-in refines the earlier generic feedback proposal for
this specific experience. Other insight types retain their approved
Resonates / Maybe / Not for me controls. Historical generic "Maybe" feedback must
not be silently converted to No when this check-in is introduced.

Persist an owner-scoped record containing the reading snapshot ID, analysis type
(`daily-sign` or `daily-personal`), effective reading date, local date/time-zone
context, the two response fields, and action/update timestamps. The server must
validate the reading reference and owner. Save only intentional responses; no
journal draft is saved by checking the read box. Repeated visits restore the
existing response, and edits update it rather than creating duplicate counts.

A No response records that day's reaction; it must not hide the entire sign wiki,
chart, or future readings. Recommendation tuning stays within the same insight
type and analysis mode and does not reinterpret a response as a belief or health
assessment.

## Insights and recaps

- Count readings explicitly marked as read. Report unique reading days separately
  from the number of readings when both Sign and Personal modes were used.
- Show Yes/No resonance counts and a rate using only answered resonance responses.
  Unanswered does not mean No; missing check-ins do not establish unread days.
- Keep Sign and Personal metrics separate so the user can distinguish the two
  experiences.
- Relate source themes and lunar context to the user's recorded moods and impact
  topics as optional comparisons. Provider labels are not user-selected topics.
- Example recap: "You marked five readings as read. Three of your four resonance
  responses were Yes. Would you like to revisit a reading you connected with?"

## Implementation boundaries and acceptance

Current Daily Sign rendering and the calculated birth placements are a starting
point. The expanded wiki, lunar overview, curated chart interpretations, exact
reading snapshots, binary check-in, durable history, and associated metrics still
need implementation and verification.

Acceptance includes: correct sign/date/source display; separate current and natal
Moon context; no guessed missing placements; substantive sourced explanations;
check-in persistence after reload; no count inflation after edits; an unanswered
response excluded from rates; owner validation; and historical links to the exact
reading rather than a newly fetched replacement. Provider errors in one region
must not prevent the wiki, saved chart context, or other available content from
being used.
