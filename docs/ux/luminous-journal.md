# Luminous Journal

Luminous Journal is the expressive web direction introduced for the Aura Logbook redesign. It builds on the [Prism Garden reference](prism-garden-visual-system.md), with larger editorial typography, translucent surfaces, and atmosphere drawn from the user's selected aura color.

## Shared foundations

- `aura-ui/src/theme/prismGarden.ts` defines neutral canvas, surface, ink, spacing, and radius tokens.
- `aura-ui/src/theme/index.ts` applies the same aura selection to Material and Joy components. Profile intensity uses the product's 0–100 scale; legacy shade values are normalized.
- `aura-ui/src/index.css` defines shared page headings, eyebrow labels, translucent panels, dark feature panels, and decorative orbital artwork.
- The current Redux user supplies the theme so a saved profile selection updates the app immediately.

The canvas uses one selected hue over neutral foundations. Mood choices keep their own semantic colors and visible text labels. Decorative orbs carry no mood interpretation and do not replace controls.

## Page composition

| Area | Treatment and behavior |
| --- | --- |
| Navigation | Blurred header, top-right profile avatar, translucent desktop journal rail; mobile bottom navigation keeps Today, Log mood, Reflections, and Profile reachable while scrolling |
| Dashboard | Large greeting, summary metrics, today's saved reflection, dark pathway prompt, trend chart, recent reflections |
| Secondary dashboard column | Weather followed by Spotify and the current pathway; Spotify preserves its connection, refresh, and playlist actions |
| Mood logger | Circular mood arrangement on larger screens, two-column choices on narrow screens, rich reflection editor |
| History | Editorial heading, wrapping date filters, translucent entry cards, loading/error/empty states |
| Profile | Contrasting identity panel, aura preview, existing profile fields and save behavior |
| Public pages | Shared typography, orbital artwork, translucent authentication forms, clear recovery navigation |

Dashboard reflections come from mood-entry queries. Quotes come from the selected pathway's supplied content. Empty states invite logging without inventing entries or personalized insights.

Spotify playlist tiles appear three at a time in a native horizontal carousel. Touch, trackpad scrolling, keyboard focus, and previous/next arrows reach all loaded playlists. There is no autoplay, and reduced-motion preferences disable smooth scrolling. Outlines use a translucent aura tint with a soft glow. The entire tile is a single link, including its artwork and title, with a visible keyboard focus ring. Playlists without a Spotify URL remain informational tiles.

## Responsive and interaction checks

Keep content containers shrinkable, stack columns at narrow widths, and allow filters to wrap. Mood choices switch from absolute orbit positioning to normal grid flow on phones. The authenticated mobile shell reserves space for its fixed bottom navigation and device safe area so final content remains reachable. Keep visible labels, keyboard focus, and reduced-motion support when extending these styles.

Run the UI suite with the API base URL used by its request fixtures:

```bash
cd aura-ui
VITE_API_BASE_URL=http://127.0.0.1:5082/api npx vitest run
npm run build
```

Tests cover theme normalization, saved aura selection, dashboard content and actions, forms, and Spotify states. Browser checks supplement those tests; passing tests alone do not establish visual acceptance or an accessibility certification.
