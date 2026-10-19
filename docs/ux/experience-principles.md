# Aura Logbook Experience Principles

These principles guide product language and UX decisions for Aura Logbook. They describe the intended experience; they are not a claim that every current screen already follows it.

## Product promise

Aura Logbook is a personal journal for noticing moods, reflecting on experience, and finding patterns that matter to the person recording them. It should support different worldviews without treating one spiritual or religious tradition as the default.

The app offers reflection, not diagnosis. Aura colors and chakra associations are optional meaning-making frameworks—not proven medical, psychological, or scientific assessments. Users decide what their entries mean.

## Pathways

The core journaling experience is available to everyone. A selected pathway can shape optional language, examples, and prompts; it must not gate mood logging, history, or basic insights.

### Aura — color reflection

- Use color as a gentle way to notice or describe a mood, energy, or personal association.
- Present color meanings as invitations (“What does blue bring to mind for you?”), not universal truths (“Blue means you are …”).
- Do not infer a user's mood, health, personality, or spiritual state from color alone.
- Keep color understandable with labels, symbols, and text; color must not be the only carrier of meaning.

### Mindfulness — everyday journaling

- Center practical reflection, present-moment awareness, and the user's own words.
- Use grounded, nonjudgmental language. Do not assume the user meditates, follows a religion, or wants spiritual interpretation.
- Offer simple prompts about feelings, context, needs, and what the user noticed.

### Faith & spirituality — user-defined belief

- Welcome belief in a higher power and spiritual practice without assuming a specific religion, scripture, or name for that power.
- Make prayer, scripture, and tradition-specific material opt-in and explicit; never present one religion's content as universal.
- Offer a neutral reflection alternative wherever spiritual wording appears.
- Let the user's own terms and practices lead; avoid presenting the app as an authority on faith.

## Shared language and behavior

- Be warm, curious, and empowering. Prefer questions over prescriptions.
- Say “might,” “can,” and “if this resonates” for interpretations. Avoid certainty, diagnosis, promises of healing, or instructions to correct a spiritual imbalance.
- Make spiritual interpretations optional and easy to skip. Do not make engagement depend on choosing a spiritual pathway.
- Distinguish recorded facts from generated or interpretive observations. Never imply an insight is data-driven unless the relevant user data was actually analyzed.
- Respect privacy and user agency: users choose what to record and how much to share.

Examples:

| Prefer | Avoid |
| --- | --- |
| “What color feels closest to your mood today?” | “Your aura proves you are anxious.” |
| “Would a mindful or spiritual reflection feel helpful?” | “You should meditate/pray to restore balance.” |
| “If chakra language is meaningful to you, you can explore this association.” | “This chakra is blocked and causing your feelings.” |
| “Would you like a faith-based prompt, a neutral prompt, or no prompt?” | Assuming a scripture, prayer, or religious tradition is welcome. |

## Prism Garden visual language

Prism Garden uses color, light, and faceted forms as a visual metaphor for the many facets of a person's inner life. The jewel motif is decorative and expressive; it does not prescribe a belief or spiritual practice.

- Favor abstract refraction, soft color transitions, botanical forms, and simple geometric facets.
- Avoid presenting gems as ritual objects, promising crystal effects, or using symbols that imply a specific occult or religious practice.
- Pair saturated rainbow accents with calm neutral surfaces so the interface remains readable and welcoming.
- Keep the visual system simple enough to implement in the current web UI and adapt to a future SwiftUI shell.

## Current implementation note

The current UI exposes `Mindfulness`, `Astrology & Energy`, and `Faith & Religion`; the API display mapping also uses `Faith & Religion`, and its comments still describe a Christian-specific experience. The marketing feature list also mentions “chakra imbalances” and “restore inner balance,” which sound more certain than the reflective, non-diagnostic framing defined here. The mood-entry form currently groups choices by aura color and shows color meanings in tooltips; the dashboard can show the selected pathway and zodiac insights. These are observations about the current code, not the target language in this document. The intended direction is the three inclusive experiences above: Aura/color reflection, mindfulness/journaling, and user-defined faith/spirituality. Align existing labels, descriptions, and claims in focused implementation work before treating this guidance as fully reflected in the UI.

Relevant current references:

- [Pathway selector](../../aura-ui/src/components/MyPathwaySelector.tsx)
- [Pathway descriptions](../../aura-ui/src/features/auth/models/SpiritualPathway.ts)
- [API pathway display names](../../AuraLogbook.Api/Models/SpiritualPathway.cs)
- [Mood-entry form](../../aura-ui/src/components/MoodEntryFormFields.tsx)
- [Dashboard](../../aura-ui/src/pages/Dashboard.tsx)
- [Current feature-list copy](../../aura-ui/src/components/home/AuraFeatures.ts)
- [Historical spiritual-pathways Wiki snapshot](../wiki/spiritual-pathways.md)

## Review checklist

Before shipping a screen, prompt, or visualization, ask:

1. Can someone use this without choosing a religious or spiritual interpretation?
2. Does any belief-specific content clearly identify its tradition and remain optional?
3. Are aura or chakra interpretations framed as reflective possibilities rather than fact or treatment?
4. Does the jewel/rainbow visual read as welcoming design rather than an instruction to practice a belief?
5. Can users understand the information without relying on color alone?
