# Onboarding & Derived Aura — Draft Spec

Status: draft for story planning. Aura interpretation stays optional and non-diagnostic:
copy says "often linked with…", never "you are…".

## Flow

Welcome → Create your space → Pathway quiz (words) → Birthday (optional) → Reveal (pathway) → Pathway page → Reminder

### Pathway pages (after Reveal, one per pathway, skippable)

What sets the pathways apart starts here:

| Pathway | Page | Captures |
|---|---|---|
| Astrology & Energy | **Your sky**: optional sun-sign and element context | Nudge topics: moon phases, my sign, chakras, crystals |
| Faith & Religion | **Your heart's season**: user-selected reflection and encouragement preferences | Daily encouragement choices: a verse, a short prayer, or a reflection question |
| Mindful Living | **What would you like to tend?** | 1–2 intentions (calm, rest, clarity, gratitude, self-kindness, focus) and a check-in opener (nothing, 3 breaths, 1 minute) |

Astrology & Energy without a birthday shows the sign step inline ("Add your birthday to see your sky") instead of the sign rows.

- Registration keeps email, password, display name. Birthday moves to the end of the quiz as an optional card.
- Theme stays user-controlled in Settings. Aura colors accents, tints and buttons only through text-safe tones.

## 1. Goals quiz

One question per screen, three cards, answer order shuffled. **Skip** at any point → Mindful Living.
Pathways: **M** Mindful Living, **E** Astrology & Energy, **F** Faith & Religion.

| # | Question | M | E | F |
|---|---|---|---|---|
| 1 | When a hard day hits, what helps most? | Slowing down and breathing through it | Knowing there's a bigger cycle or season at play | Praying, or handing it over to God |
| 2 | What would you like to work on? | Feeling calmer day to day | Understanding my energy and moods | Feeling closer to my Creator |
| 3 | When you reflect, you usually… | Notice what's happening in my body and mind | Wonder what the moon, stars or my aura are saying | Look for meaning or a message meant for me |
| 4 | A good check-in would leave you feeling… | Clear and grounded | In tune and aligned | Held and guided |
| 5 | What kind of daily nudge would you welcome? | A short mindful prompt | A cosmic or energy insight | A verse or a prayer |

Final optional card: "Want insights tied to your sign? Add your birthday." (Shown to all; used only by E.)

## 2. Pathway scoring

- Each answer = 1 point to its pathway. Unanswered questions score nothing.
- Top score wins. **Tie for first** → reveal shows both tied pathways; Alex taps one.
  Three-way tie (e.g., 1/1/1 after skips) → show all three.
- Zero answers / Skip → Mindful Living.
- Reveal copy: "You seem drawn to **{pathway}**" + "a little {runner-up} too" when runner-up > 0.
- Changeable anytime in Settings.

## 3. Hue anchors (OKLCH hue degrees)

| Anchor | Hue | Anchor | Hue |
|---|---|---|---|
| Red | 29 | Teal | 190 |
| Orange | 55 | Blue | 250 |
| Gold | 85 | Indigo | 275 |
| Green | 145 | Violet | 305 |
| | | Rose | 350 |

## 4. Quiz color

Quiz answers choose a reflection pathway; their colored answer markers are decorative and do not seed the aura. The onboarding color-moment step is removed so users do not choose the color that later appears as check-in-derived.

## 5. Mood → hue weights (ongoing check-ins)

Chroma factor scales how saturated the contribution is; low-energy moods mute the aura.

| Mood | Hue | Chroma factor |
|---|---|---|
| Empowered | Orange 40 | 1.0 |
| Centered | Blue 250 | 0.8 |
| Harmonious | Green 145 | 0.9 |
| Flowing | Teal 190 | 0.9 |
| Weary | Indigo 275 | 0.4 |
| Tense | Red 25 | 0.7 |
| Frustrated | Red 29 | 0.9 |
| Restless | Orange 60 | 0.7 |
| Disconnected | Blue 260 | 0.3 |
| Heavy | Indigo 280 | 0.4 |
| Charged | Rose 350 | 1.0 |
| Scattered | Gold 95 | 0.5 |
| Abundant | Gold 85 | 1.0 |
| Visionary | Violet 305 | 1.0 |
| Neutral | — (no hue) | lowers overall chroma only |

## 6. Pathway and color boundary

Pathway and onboarding choices personalize optional language, prompts, and reflection context. They do not set the aura hue. The visible aura is derived from recorded mood check-ins only.

## 7. Blending in OKLCH

Hue is circular, so blend as vectors, not averages:

```
for each input i: x += w_i * c_i * cos(h_i);  y += w_i * c_i * sin(h_i);  W += w_i
hue      = atan2(y, x)
strength = sqrt(x² + y²) / W          // 0..1; opposing hues cancel → muted
chroma   = 0.04 + 0.12 * strength     // keep it gentle
lightness= 0.72 (aura surface tone)
```

Inputs over time:
- **Mood logs**: each mood weight × chroma factor, decay half-life 7 days, window 30 days.
- `AuraIntensity` (0–100) = `strength` × 100, derived, not entered.

## 8. Text-safe tone derivation

From aura hue `h` and chroma `c`, derive tokens; never put the raw aura on text.

| Token | Use | Light theme | Dark theme |
|---|---|---|---|
| `--aura-tint` | backgrounds, calendar cells | L .95, C c×.3 | L .25, C c×.4 |
| `--aura-surface` | orb, cards | L .72, C c | L .60, C c |
| `--aura-accent` | button fill | L .55, C c | L .70, C c |
| `--aura-on-accent` | button text | white or near-black, whichever passes | same rule |
| `--aura-text` | links, emphasis | start L .45, step L −.03 until ≥ 4.5:1 | start L .80, step +.03 until ≥ 4.5:1 |

Rules: text pairs ≥ 4.5:1 (WCAG AA); UI/non-text ≥ 3:1. Clamp chroma to the sRGB gamut
before checking. Contrast checks run in unit tests over all 360 hues × both themes.

## 9. Pathway language

| Pathway | Frame | Example reflection after check-ins |
|---|---|---|
| Mindful Living | Grounded reflection on recent check-ins | "Your recent check-ins are leaning **soft blue**. What does that color bring to mind?" |
| Astrology & Energy | Optional aura or chakra symbolism | "Your check-in color is leaning **violet**. If it resonates, explore it alongside your sign." |
| Faith & Religion | User-defined values and beliefs | "Your recent check-ins are leaning **gold**. What beliefs or values help you meet this moment?" |

## 10. Aura seasons (named archetypes)

A season is a named pattern, not an identity. It appears only once a pattern **holds**:
the same season key is dominant on ≥ 5 of the last 7 days, with ≥ 4 mood logs in that window.
It stays until a different season holds; between seasons Alex sees "Your aura is shifting…".

Season key = daily aura hue family + strength (from §7).

| Key | Hue family | Strength | Name | Often linked with… |
|---|---|---|---|---|
| tide | Blue / Teal | ≥ .5 | **Steady Tide** | calm, consistency, trust |
| harbor | Blue / Indigo | < .5 | **Quiet Harbor** | rest, retreat, recovery |
| growth | Green | any | **New Growth** | renewal, balance, beginnings |
| harvest | Gold | ≥ .5 | **Open Harvest** | gratitude, abundance, warmth |
| kindling | Orange / Red | ≥ .5 | **Kindling** | drive, courage, momentum |
| weather | Red / Orange | < .5 | **Shifting Weather** | friction, change in motion |
| starlit | Violet | any | **Starlit** | vision, intuition, imagination |
| bloom | Rose | any | **Bloom** | spark, connection, aliveness |
| stillwater | any | < .25 | **Still Water** | a mixed or muted stretch |

Pathway framing (same key, different voice):
- Mindful Living: "You've been in a **Steady Tide** stretch: a tone often linked with calm."
- Astrology & Energy: "Your aura has settled into a **Steady Tide** season."
- Faith & Religion: "Your heart has been in a **Steady Tide** season, often linked with trust."

Each season ships with: one reflection prompt per pathway and one gentle next step.
Season history is shown on the calendar as ribbons spanning the days it held.

## 11. Mood-combination hue nuance

Builds on `MoodCombinationInterpretations` (migration 018). When a check-in's selected moods
match a `MoodSetKey`, the combination replaces the individual mood hues for that entry:

- New reference table `MoodCombinationHues (MoodSetKey PK, Hue, ChromaFactor, Weight)` —
  pathway-independent, so one hue per combination; interpretation text stays per pathway.
- Default when no hue row exists: blend the individual moods (§5), so unseeded combos still work.
- The check-in confirmation shows the combination's **hue swatch + its existing pathway
  interpretation together**, e.g. Tense + Visionary → electric violet-red (≈ 330, chroma 1.0)
  with the pathway's reflective insight.
- Weight 1.25 vs single moods, so meaningful pairs nudge the aura a bit more.
- "Why this color?" lists them: "Tense + Visionary on Tuesday".

## 12. Color presentation

The onboarding orb is decorative and does not preview or set the user's aura. The aura color appears in the app after mood check-ins have contributed to its calculation.

- **Drift:** 2–3 radial gradients orbit slowly, hues ±15° around the aura hue (12–20 s loop).
- **Breathe:** scale 0.97 ↔ 1.03 and lightness ±.03; period follows strength
  (strong aura ≈ 4 s, muted ≈ 7 s — calmer when quieter).
- **Color update:** apply the latest mood-derived hue to the app's aura accents after a check-in.
- **Combination moment:** brief shimmer in the combination hue after check-in.
- Implementation: CSS custom properties driven from the derived aura response; canvas only if needed.
- **`prefers-reduced-motion`:** static gradient, no breathing, instant transitions.
- Decorative: `aria-hidden`; the reveal text carries the meaning.

## Guardrails

- **Why this color?** sheet: show the current color swatch and list the mood check-ins that contributed to it.
- **Aura reveals** toggle in Settings (off → neutral theme accents, no reveal copy).
- Color meanings are our own copy; no third-party color-test mappings.

## Data impact

- `RegisterUserRequest`: Birthday and SelectedPathway become optional; AuraColor/AuraIntensity removed as inputs.
- User: `OnboardingCompletedAt`, `AuraRevealsEnabled`.
- New: onboarding answers (question, chosen pathway), computed aura snapshot (hue, chroma, strength, computedAt).
- New: `AuraSeasons` reference (key, name, prompts per pathway, next step), user season history
  (key, startedOn, endedOn), `MoodCombinationHues` keyed by `MoodSetKey`.
- Hue tables live in reference data so weights can be tuned without a UI deploy.
