# Pathway module presentation

This implementation follows the [Core User Journeys](core-user-journeys.md)
and the approved interactive pathway design. It is part of follow-up story
[#411](https://github.com/GemsForge/aura-logbook-api/issues/411).

## Shared behavior

- The saved interface theme supplies colors; the recorded aura supplies the
  existing surface highlight and under-glow. The design does not force Ocean.
- Page and section titles retain a distinct hierarchy within the compact app
  shell. Cards are reserved for featured content rather than every subsection.
- Optional writing starts behind **Add a reflection**. Opening the editor never
  saves a response; **Save to journal** retains the existing private activity
  contract. Failed requests leave the draft available to retry.
- Feedback remains optional and scoped to its insight type. Selected choices
  expose `aria-pressed` as well as visible selection styling.
- Mobile pathway destinations stay in document flow above the page. Only the
  core journal navigation remains fixed, with bottom clearance for the page.

## Pathway experiences

### Astrology & Energy

The sign and provider horoscope lead in one broad illustrated surface. The
existing twelve zodiac illustrations identify the user's actual sign; reference
descriptions remain available through **Explore [sign]**. Feedback and writing
are secondary to reading. Daily Astrology uses the shared pathway step shell:
the top moon-cycle strip selects a local date, while its open step shows the
phase, available illumination and Moon sign, the current daily horoscope, and
only exact Moon-sign matches in an explicitly saved birth chart. The final step
shows moods logged on the selected date, with an explicit mood action and the
existing non-causal note. Missing birthday skips the chart step and provides an
optional profile invitation; missing birth time/place leaves the chart optional.
The authenticated `/api/astrology/moon-cycle` response supplies the date range,
provider fields, and that user's day-level mood counts without storing data on
page view.

Recognized birth-chart placements are selectable, with the selected placement's
metadata and conventional interpretive role immediately below. The lunar module
uses the existing moon-phase artwork and phase discs, a compact date selector,
and recorded mood counts. Historical values are tied to their selected local
date and do not imply that the Moon caused a mood.

The chakra reference uses the existing seated-body artwork and chakra symbols.
Named controls change the selected center, its anatomical highlight, and its
definition/reflection. Anatomical markers are visual rather than overlapping
touch targets. Details retain the source definitions, Sanskrit terms, color and
element associations, and the contemporary theme/challenge lens.

### Mindful Living

The guide leads with an exercise invitation and **Begin practice**. Beginning or
finishing this local invitation does not create a completed-practice record.
Logging remains an explicit action. Everyday concepts and all existing DBT
skills remain browsable, each with its own explanation and practice invitation.

The existing landscape accompanies the invitation; the breathing artwork
supports the practice log. Optional log notes are disclosed on demand and are
revealed when editing an entry with a note.

### Faith & Religion

The chosen framework's passage is the reading surface's focus. The existing
open-book illustration accompanies supported readings; the olive branch
accompanies the general quote when no supported framework is selected.
Framework requests, attribution, and source links remain isolated to that
selection. An unavailable selected provider does not become a different text
or a general quote.

Returning users see their daily practice answers first. **Edit practices** opens
configuration without replacing or silently saving their choices. Notes are
optional and unanswered practices remain unanswered.

## Separate capabilities

The [embedded sacred-text reader](sacred-text-reader.md) is a separate Aura
destination tracked by story #410. This module view opens that in-app reader and
keeps publisher links secondary. The richer reading-specific check-in and durable
recap snapshots remain described in the [daily astrology experience](daily-astrology-experience.md)
and [recap data plan](pathway-recap-data-plan.md); opening a section does not
simulate practice completion or recap persistence.
