# Aura Logbook Visual Asset Library

## Art direction

This revision follows the supplied concept sheet: luminous multi-petal lotus aura motifs, warm gold spark details, fine pink-to-violet gradients, rich twilight color, and illustrated cloud, forest, ocean, and mountain scenes. The approved logo reference is retained exactly and is not altered.

## Collections

- `aura-colors/` — ten independent transparent PNG lotus motifs: rose, coral, gold, green, blue, indigo, violet, peach, teal, and silver. These show the person’s recorded aura color and do not change with the interface theme.
- `backgrounds/` — six active families with light/dark banner pairs: Aurora, Earth, Ocean, Sunset, Amethyst, and Midnight. Original filenames and Ivory artwork are retained for compatibility.
- `feature-icons/` — seven editable gradient-line SVG marks: Journal, Mood, Aura, Insights, Weekly Summary, Calendar, and Settings. PNG exports are in `png/feature-icons/`.
- `data-visuals/` — editable aura distribution and trend chart examples with PNG exports in `png/data-visuals/`. Product UI must include labels and cues beyond color.
- `decorations/` — crescent, starburst, botanical sprig, olive branch, and a neutral aurora sweep. They contain no chakra or religion-specific symbolism.
- `pathways/mindful/` — breathing light and gentle landscape illustrations.
- `pathways/faith-religion/` — luminous open book and olive branch illustrations; no denomination-specific marks or hand gestures.
- `pathways/astrology-energy/` — crystals, moon phases, and orbit illustration. Seven optional chakra symbols are in its nested `chakra-symbols/` collection only.
- `brand/` — unmodified approved logo copies. Use the logo unchanged.
- `design-tokens/` — seven separate interface theme palettes plus aura color tokens.
- `previews/contact-sheet.png` — full library overview with paired light/dark backdrops; `previews/backdrops-contact-sheet.png` is the backdrop-only comparison. `previews/index.html` is a browsable, offline preview. Regenerate both PNGs with `node aura-ui/public/theme-assets/previews/render-preview.mjs` after installing the UI dependencies and Playwright Chromium. The six active theme families appear first; Ivory is labeled as a legacy compatibility asset.
- `asset-manifest.json` — each filename, collection, pathway visibility, format, and intended use.

## File formats and names

Use kebab-case filenames. Generated dimensional artwork is PNG so its painterly light and texture are preserved. Hand-authored marks, chakra symbols, and chart graphics have editable SVG masters and matching high-resolution PNG exports. Banner PNGs are full-bleed; preserve their aspect ratio and keep text clear of high-detail areas.

## Visibility and data boundaries

Only show `pathways/{selected-pathway}/` art for the active pathway. Chakra terminology and symbols belong exclusively to Astrology & Energy. Switching pathways changes pathway prompts and visible pathway art while preserving journal entries, mood history, identity, and the independently selected interface theme. Never change the recorded aura color when the theme changes. Aura and chakra associations are optional reflective symbolism, not medical or scientific claims.

## Accessibility

- Never communicate aura category, trend, or data value through color alone; include text labels, values, and patterns or icons where useful.
- Use empty alt text for purely ornamental art; describe meaningful illustrations briefly.
- Add accessible names and keyboard focus to surrounding controls, not decorative graphics.
- Verify text contrast against every theme; banners are artwork and should not sit directly under small text without a contrast surface.
- Respect reduced motion if any art is animated, and keep cropping responsive.

See `design-tokens/theme-palettes.json`, `design-tokens/tokens.css`, and `asset-manifest.json` for implementation details.

## Light banner companions

Seven regenerated PNG companions are in `backgrounds/banner-<theme>-light.png`. Every file is **1774 × 887 px (2:1)**, matching its existing reference. Each was generated from that reference to preserve scene framing and layered illustration detail. Ivory is a legacy compatibility asset; Story #359 migrates its appearance to Aurora light.

The original `banner-<theme>.png` files remain the existing references. The app chooses mode separately from family and aura color; account mode persists through the profile API and guest mode through browser storage. Use empty alt text when decorative, and provide an opaque surface or verified scrim behind small text and controls. Preserve the aspect ratio when scaling.

See [LIGHT-BANNER-PROMPTS.md](LIGHT-BANNER-PROMPTS.md) for the exact prompt set and generation method. The browsable preview includes the new companions.

Active variants use `banner-<theme>-light.png` and `banner-<theme>-dark.png`; original `banner-<theme>.png` names are requested only after a variant fails to load. The manifest contains 60 indexed assets, including the six explicit dark aliases.
