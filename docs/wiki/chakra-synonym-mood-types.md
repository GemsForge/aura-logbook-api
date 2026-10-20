# 🔮 AuraLog — Chakra‐Synonym Mood Types

> Local copy of the [GitHub Wiki page](https://github.com/GemsForge/aura-logbook-api/wiki/%F0%9F%94%AE-AuraLog-%E2%80%94-Chakra%E2%80%90Synonym-Mood-Types). Last edited on GitHub: June 23, 2025. Retrieved October 18, 2026. Preserved as a dated snapshot; mood labels and spiritual framing below are not current guidance. See the current [inclusive experience principles](../ux/experience-principles.md) and [core user journeys](../ux/core-user-journeys.md).

This wiki page documents the chakra-inspired mood types then used across the AuraLogbook frontend and backend. By replacing generic emotion names with chakra-synonym labels, each mood becomes more intuitive—hinting at energetic imbalances and guiding reflection.

## Table of Contents

- [New MoodType Definitions](#new-moodtype-definitions)
- [Aura & Chakra Overview](#aura--chakra-overview)
- [Why Chakra-Synonym Labels?](#why-chakra-synonym-labels)
- [Integration Notes](#integration-notes)

## New MoodType Definitions

| Label | Original | Chakra | Aura Meaning |
| --- | --- | --- | --- |
| Empowered | Joyful | Solar Plexus | Personal power, confidence, creativity |
| Centered | Content | Heart | Inner balance, compassion, emotional harmony |
| Harmonious | Peaceful | Throat | Clear expression, calm communication |
| Flowing | Motivated | Sacral | Creative flow, inspiration, adaptability |
| Weary | Tired | Root | Low energy, need for rest, grounding recharge |
| Tense | Stressed | Root | Survival tension, fight-or-flight activation |
| Blocked | Frustrated | Solar Plexus | Stuck energy, obstacles to personal power |
| Restless | Anxious | Third Eye | Overactive mind, scattered focus, intuition test |
| Disconnected | Lonely | Heart | Closed-off emotions, need for self-love |
| Heavy | Sad | Heart/Throat | Emotional weight, need for release |
| Charged | Angry | Solar Plexus | Assertive drive, heated energy |
| Scattered | Overwhelmed | Root | Fractured grounding, too many demands |
| Abundant | Grateful | Solar Plexus | Appreciation, flow of generosity |
| Visionary | Hopeful | Crown | Big-picture optimism, spiritual insight |
| Neutral | Meh | All-Chakras | Energy reset, neutrality before next cycle |

## Aura & Chakra Overview

- **Root (Muladhara):** Stability, grounding, basic needs.
- **Sacral (Svadhisthana):** Creativity, pleasure, emotional flow.
- **Solar Plexus (Manipura):** Personal power, confidence, will.
- **Heart (Anahata):** Love, compassion, emotional balance.
- **Throat (Vishuddha):** Communication, self-expression, clarity.
- **Third Eye (Ajna):** Intuition, insight, mental focus.
- **Crown (Sahasrara):** Vision, higher purpose, spiritual connection.

By aligning each mood to its primary chakra, each label hints at the underlying energy center and suggests reflection or rebalancing practices.

## Why Chakra-Synonym Labels?

1. **Intuitive & Descriptive** — Using everyday English synonyms (e.g., “Weary” instead of “Tired”) conveys energetic qualities clearly.
2. **Reflection Prompts** — Each label maps to a journaling question, for example:
   - **Blocked:** “What’s creating resistance in my personal power today?”
   - **Flowing:** “Where did creativity ignite in my day?”
3. **Balance of Spiritual & Scientific** — Labels remain clear for all users yet gently reference chakra concepts—bridging self-awareness with usability.

## Integration Notes

### TypeScript & API

Update the `MoodType` union in `schema/MoodType.ts` and any related API contracts to use the new labels.

### UI & Icons

Ensure `MoodIcons` mapping, tooltips, and any visual accents reflect the new chakra-synonym names.

### Documentation

Revise README, developer guides, and comments to link back to this wiki for full context.

```ts
// Example: MoodType union
type MoodType =
  | "Empowered"
  | "Centered"
  | "Harmonious"
  | "Flowing"
  | "Weary"
  | "Tense"
  | "Blocked"
  | "Restless"
  | "Disconnected"
  | "Heavy"
  | "Charged"
  | "Scattered"
  | "Abundant"
  | "Visionary"
  | "Neutral";
```
