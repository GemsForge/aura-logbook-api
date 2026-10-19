# Prism Garden visual system

Prism Garden is Aura Logbook's calm, jewel-toned visual language. It uses a quiet garden-like foundation with small facets of rainbow color: distinctive enough to feel personal, while the abstract gems remain visual metaphors rather than spiritual instructions. It welcomes people using Aura/color reflection, mindfulness, or their own faith and spiritual practice.

This is a design system proposal for the web UI and future SwiftUI shell. It does not claim that the current application already implements these rules.

## Design principles

1. **Calm first, color as a facet.** Keep most surfaces neutral; reserve saturated hues for meaningful accents, charts, selected states, and small decorative details.
2. **A garden, not a crystal shop.** Pair simple faceted shapes with soft botanical curves or light. Avoid ritual objects, crystal-effect claims, or tradition-specific symbols.
3. **Reflection belongs to the user.** Aura and chakra language stays optional and interpretive. Use user-selected data and clearly label suggestions; do not imply diagnosis or unseen analysis.
4. **Color is never the only signal.** Pair hue with text, shape, icon, position, or a visible label.
5. **Simple to build and carry.** Prefer design tokens, platform-native typography, and standard layout primitives over custom animation or JavaScript-driven styling.

## Core tokens

These values are starting tokens, not mood meanings. Aura colors recorded in a journal remain user data; the brand palette below is only presentation. Use dark text on colored fills unless a verified contrast pair is specified.

| Token | Value | Use |
| --- | --- | --- |
| `garden.canvas` | `#F8F7F5` | App background; warm, low-contrast neutral |
| `garden.surface` | `#FFFFFF` | Cards, sheets, and input surfaces |
| `garden.surfaceSoft` | `#F1EDF3` | Quiet grouping, chips, and secondary panels |
| `garden.ink` | `#29262D` | Primary text and headings |
| `garden.inkMuted` | `#625D67` | Supporting text; retain readable contrast |
| `garden.line` | `#DED8E2` | Dividers, outlines, and card borders |
| `garden.focus` | `#375F9B` | Keyboard focus ring and high-priority interaction cue |
| `prism.berry` | `#B84E68` | Warm accent, selected markers |
| `prism.citrus` | `#B96A32` | Warm accent, small highlights |
| `prism.sun` | `#8A6900` | Golden accent; never use pale yellow for text |
| `prism.leaf` | `#39734F` | Green accent and positive-neutral data series |
| `prism.tide` | `#356E89` | Blue accent and informational data series |
| `prism.indigo` | `#545E9D` | Indigo accent and data series |
| `prism.orchid` | `#76558E` | Violet accent and data series |
| `prism.rose` | `#A94F78` | Pink accent and data series |

### CSS custom-property example

```css
:root {
  --garden-canvas: #f8f7f5;
  --garden-surface: #ffffff;
  --garden-surface-soft: #f1edf3;
  --garden-ink: #29262d;
  --garden-ink-muted: #625d67;
  --garden-line: #ded8e2;
  --garden-focus: #375f9b;

  --prism-berry: #b84e68;
  --prism-citrus: #b96a32;
  --prism-sun: #8a6900;
  --prism-leaf: #39734f;
  --prism-tide: #356e89;
  --prism-indigo: #545e9d;
  --prism-orchid: #76558e;
  --prism-rose: #a94f78;

  --garden-space-1: 0.25rem;
  --garden-space-2: 0.5rem;
  --garden-space-3: 0.75rem;
  --garden-space-4: 1rem;
  --garden-space-6: 1.5rem;
  --garden-space-8: 2rem;
  --garden-radius-card: 1rem;
  --garden-radius-control: 0.625rem;
  --garden-border-width: 1px;
}
```

For SwiftUI, map the same semantic names to `Color` and `CGFloat` constants. Keep token names semantic (`canvas`, `surface`, `ink`, `focus`) rather than embedding a specific component or framework in the name.

## Type, layout, and surfaces

- Use the platform system sans-serif by default. Establish a clear hierarchy with page title, section title, body, and supporting text; avoid decorative display fonts for journal content.
- Keep body text at a comfortable reading size (web target: 16 CSS px or larger) and line-height around 1.5. Let user text scaling work without clipping.
- Use a 4 px spacing base and the token scale above. Prefer consistent whitespace over extra borders and nested cards.
- Cards use a white surface, a subtle neutral border, and a 16 px corner radius. Use shadows sparingly; do not rely on shadow to distinguish interactive states.
- Buttons and fields use a 10 px corner radius, visible labels, and clear hover/focus/disabled states. Focus uses a 2–3 px ring with offset, not color-only fill changes.
- Facet motifs should be small, abstract, and optional. Use still shapes by default; if motion is later added, honor reduced-motion settings.

## Color, data, and accessibility

- Saturated prism colors are accents, not large page backgrounds. Keep the neutral canvas and surface dominant.
- Use the named `prism.*` hues consistently in charts, but pair each series with a legend label and, where practical, a marker shape or direct value label.
- Never encode a mood, status, or action solely through hue. Include text labels and accessible names.
- Use `garden.ink` on `garden.canvas`/`garden.surface` and `garden.inkMuted` for supporting copy. Do not assume white text is readable on every prism accent; verify each foreground/background pairing before shipping.
- Preserve visible keyboard focus, semantic headings, descriptive control labels, and responsive reflow at narrow widths and enlarged text.

## Representative dashboard concept

This composition applies the tokens without asserting new functionality. It uses only existing dashboard information: a greeting, optional selected pathway, mood summary, last-entry date, current weather, and mood history/chart. If an item has no data, use a calm empty state rather than inventing a personalized interpretation.

```text
┌────────────────────────────────────────────────────────────┐
│ Aura Logbook                                      Profile  │
├────────────────────────────────────────────────────────────┤
│ Good morning, Alex                                          │
│ A quiet, open welcome; optional pathway appears as a label │
│                                                            │
│ ┌────────────────────────────┐ ┌─────────────────────────┐ │
│ │ Your mood at a glance      │ │ Today's weather         │ │
│ │  [labeled aura marker]     │ │ [simple weather art]    │ │
│ │  Most frequent mood        │ │ temperature + location  │ │
│ └────────────────────────────┘ └─────────────────────────┘ │
│                                                            │
│ Mood over time                              Last entry date │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ labeled, accessible chart using restrained prism hues │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ Recent entries                                             │
│ date · mood label · optional user reflection               │
└────────────────────────────────────────────────────────────┘
```

On small screens, stack the two summary cards, keep the chart full-width, and move navigation into the established compact navigation pattern. Do not shrink chart labels below comfortable reading size to preserve a desktop layout.

The concept deliberately excludes fabricated “personalized insights.” Add one only when its data source and generation rule are implemented, and label interpretive content as optional reflection.

## Implementation boundary

This story defines and documents the visual system. Applying it throughout production screens, redesigning the dashboard into a profile-ready deliverable, and mapping the core journeys are follow-up work. That keeps this token system stable before individual screens adopt it.

## Reference

- [Inclusive experience principles](experience-principles.md)
- [Current dashboard implementation](../../aura-ui/src/pages/Dashboard.tsx)
- [Current Aura palette implementation](../../aura-ui/src/theme/auraTheme.ts)
