"""Generates the Astrology & Energy chakra and zodiac illustration sets (#391).

Run from the repository root:  python3 aura-ui/public/theme-assets/pathways/astrology-energy/generate-pathway-artwork.py
Then export PNGs and the contact sheet: node aura-ui/public/theme-assets/previews/render-pathway-artwork.mjs

Design rules:
- Chakra illustrations use the traditional petal counts and inner forms, so each center is identifiable
  by shape as well as color. Existing chakra-symbols/ SVGs are left untouched until replacements are approved.
- Zodiac medallions carry the sign glyph, the sign name, and an element mark, so no sign depends on color alone.
- Every SVG has <title>/<desc> for accessibility; descriptions are reflective, never diagnostic.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CHAKRA_DIR = ROOT / "chakra-illustrations"
ZODIAC_DIR = ROOT / "zodiac-illustrations"
MANIFEST = ROOT.parents[1] / "asset-manifest.json"

GOLD = "#E8D19B"
INK = "#3B2A4A"

# key, display name, Sanskrit name, petals, color, deep color, inner form, body location, theme
CHAKRAS = [
    ("root", "Root", "Muladhara", 4, "#D9574B", "#9E3A33", "square", "base of the spine", "grounding and safety"),
    ("sacral", "Sacral", "Svadhisthana", 6, "#EE8F43", "#B9652A", "crescent", "lower abdomen", "creativity and flow"),
    ("solar-plexus", "Solar Plexus", "Manipura", 10, "#E9BE3C", "#A9861E", "triangle", "upper abdomen", "confidence and will"),
    ("heart", "Heart", "Anahata", 12, "#67A584", "#3F7A5C", "hexagram", "center of the chest", "compassion and connection"),
    ("throat", "Throat", "Vishuddha", 16, "#4C93C9", "#2E6A97", "circle-in-triangle", "throat", "expression and truth"),
    ("third-eye", "Third Eye", "Ajna", 2, "#5E64B8", "#3D4287", "eye", "between the brows", "insight and intuition"),
    ("crown", "Crown", "Sahasrara", 24, "#9C6BC4", "#6E4592", "radiant", "top of the head", "meaning and spiritual connection"),
]

ELEMENT_COLORS = {"Fire": "#E07A4F", "Earth": "#7E9B5A", "Air": "#7FA7C9", "Water": "#5B7FC4"}
# key, name, date range, element, glyph path (drawn in a 256 box, centered on 128,128)
ZODIAC = [
    ("aries", "Aries", "Mar 21 – Apr 19", "Fire",
     "M128 172V116M128 116C122 84 84 80 84 106C84 121 97 124 103 115M128 116C134 84 172 80 172 106C172 121 159 124 153 115"),
    ("taurus", "Taurus", "Apr 20 – May 20", "Earth",
     "M84 86C92 116 164 116 172 86M128 112a28 28 0 1 0 0.1 0Z"),
    ("gemini", "Gemini", "May 21 – Jun 20", "Air",
     "M90 86Q128 100 166 86M90 170Q128 156 166 170M112 95V161M144 95V161"),
    ("cancer", "Cancer", "Jun 21 – Jul 22", "Water",
     "M100 98a12 12 0 1 0 0.1 0ZM100 98C130 82 160 92 172 112M156 158a12 12 0 1 0 0.1 0ZM156 158C126 174 96 164 84 144"),
    ("leo", "Leo", "Jul 23 – Aug 22", "Fire",
     "M100 128a16 16 0 1 0 0.1 0ZM116 144C116 110 112 92 132 84C156 76 172 96 160 118C150 136 148 156 160 168C166 174 174 172 178 166"),
    ("virgo", "Virgo", "Aug 23 – Sep 22", "Earth",
     "M84 104V168M84 112C84 96 106 96 106 112V168M106 112C106 96 128 96 128 112V158C128 176 152 176 158 158C164 138 140 132 134 150C130 162 138 176 152 182"),
    ("libra", "Libra", "Sep 23 – Oct 22", "Air",
     "M84 172H172M84 148H108C98 108 158 108 148 148H172"),
    ("scorpio", "Scorpio", "Oct 23 – Nov 21", "Water",
     "M84 104V166M84 112C84 96 106 96 106 112V166M106 112C106 96 128 96 128 112V158C128 172 142 174 158 164L168 158M154 150L170 156L162 172"),
    ("sagittarius", "Sagittarius", "Nov 22 – Dec 21", "Fire",
     "M92 168L166 94M134 92H168V126M106 122L138 154"),
    ("capricorn", "Capricorn", "Dec 22 – Jan 19", "Earth",
     "M84 98L100 160L114 104C118 88 142 92 140 120C138 146 128 166 150 172C170 176 176 150 160 144C144 138 134 156 146 168"),
    ("aquarius", "Aquarius", "Jan 20 – Feb 18", "Air",
     "M84 116L100 102L116 116L132 102L148 116L164 102L174 111M84 152L100 138L116 152L132 138L148 152L164 138L174 147"),
    ("pisces", "Pisces", "Feb 19 – Mar 20", "Water",
     "M96 84C124 104 124 152 96 172M160 84C132 104 132 152 160 172M100 128H156"),
]


def defs(color: str, deep: str) -> str:
    """Shared halo, petal gradient, and soft shadow, matching the existing chakra-symbols style."""
    return (
        '<defs>'
        '<radialGradient id="halo"><stop stop-color="#fff" stop-opacity=".92"/><stop offset=".55" stop-color="#F6E6C7" stop-opacity=".45"/>'
        '<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
        f'<linearGradient id="petal" x1="0" y1="0" x2="0" y2="1"><stop stop-color="{color}" stop-opacity=".95"/>'
        f'<stop offset="1" stop-color="{deep}"/></linearGradient>'
        '<filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur in="SourceAlpha" stdDeviation="4"/>'
        '<feOffset dy="4"/><feComponentTransfer><feFuncA type="linear" slope=".17"/></feComponentTransfer>'
        '<feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
        '</defs>'
    )


def svg(title: str, desc: str, body: str, width: int = 256, height: int = 256) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" '
        f'role="img" aria-labelledby="title desc"><title id="title">{title}</title><desc id="desc">{desc}</desc>{body}</svg>\n'
    )


def lotus(petals: int, color: str, base: float = 54, length: float = 56) -> str:
    """A ring of pointed petals rooted under the center disc, so every petal visibly attaches to it.

    Few-petal centers get broad petals; many-petal centers get slender ones so each count stays legible.
    """
    width = max(5.0, min(30.0, 2 * math.pi * (base + length / 2) / petals * 0.42))
    base_y, tip_y = 128 - base, 128 - base - length
    parts = []
    for i in range(petals):
        parts.append(
            f'<path transform="rotate({360 / petals * i:.2f} 128 128)" d="M128 {base_y}'
            f'C{128 - width * 1.4:.1f} {base_y - length * 0.35:.1f} {128 - width * 0.7:.1f} {tip_y + length * 0.25:.1f} 128 {tip_y}'
            f'C{128 + width * 0.7:.1f} {tip_y + length * 0.25:.1f} {128 + width * 1.4:.1f} {base_y - length * 0.35:.1f} 128 {base_y}Z" '
            f'fill="url(#petal)" stroke="{GOLD}" stroke-width="1.5" stroke-opacity=".8"/>'
        )
    return "".join(parts)


def inner_form(form: str, color: str) -> str:
    """The yantra shape at each center, drawn in cream on the chakra color."""
    cream = "#FFF8EC"
    if form == "square":
        return f'<rect x="96" y="96" width="64" height="64" rx="4" fill="none" stroke="{cream}" stroke-width="5"/><path d="M128 108v40m-20-20h40" stroke="{cream}" stroke-width="4" stroke-linecap="round"/>'
    if form == "crescent":
        return f'<path d="M94 116a36 36 0 0 0 68 0a40 40 0 0 1-68 0Z" fill="{cream}"/>'
    if form == "triangle":
        return f'<path d="M92 108H164L128 166Z" fill="none" stroke="{cream}" stroke-width="5" stroke-linejoin="round"/>'
    if form == "hexagram":
        return (f'<path d="M128 90L162 148H94Z" fill="none" stroke="{cream}" stroke-width="4.5" stroke-linejoin="round"/>'
                f'<path d="M128 166L94 108H162Z" fill="none" stroke="{cream}" stroke-width="4.5" stroke-linejoin="round"/>')
    if form == "circle-in-triangle":
        return (f'<path d="M90 102H166L128 168Z" fill="none" stroke="{cream}" stroke-width="4.5" stroke-linejoin="round"/>'
                f'<circle cx="128" cy="124" r="15" fill="{cream}"/>')
    if form == "eye":
        return (f'<path d="M86 128Q128 92 170 128Q128 164 86 128Z" fill="none" stroke="{cream}" stroke-width="5"/>'
                f'<circle cx="128" cy="128" r="13" fill="{cream}"/>')
    # radiant crown: concentric rings and a central point of light
    return (f'<circle cx="128" cy="128" r="34" fill="none" stroke="{cream}" stroke-width="4"/>'
            f'<circle cx="128" cy="128" r="20" fill="none" stroke="{cream}" stroke-width="3" opacity=".8"/>'
            f'<circle cx="128" cy="128" r="8" fill="{cream}"/>')


def chakra_svg(key, name, sanskrit, petals, color, deep, form, location, theme) -> str:
    petal_text = "a thousand-petal lotus, shown as a radiant ring" if key == "crown" else f"a {petals}-petal lotus"
    desc = (f"{name} ({sanskrit}) illustration: {petal_text} with a {form.replace('-', ' ')} at its center, "
            f"associated with the {location} and themes of {theme}. Optional reflective artwork for Astrology &amp; Energy.")
    body = (defs(color, deep)
            + '<circle cx="128" cy="128" r="122" fill="url(#halo)"/>'
            + f'<g filter="url(#shadow)">{lotus(petals, color)}'
            + f'<circle cx="128" cy="128" r="62" fill="url(#petal)" stroke="{GOLD}" stroke-width="3"/>'
            + inner_form(form, color) + '</g>')
    return svg(f"{name} chakra · {sanskrit}", desc, body)


def element_mark(element: str) -> str:
    """Small element sign above the glyph, so element is readable without color."""
    c = ELEMENT_COLORS[element]
    if element == "Fire":
        return f'<path d="M128 34C138 46 140 52 134 60C140 58 142 54 142 50C148 60 144 72 128 72C112 72 108 60 116 50C118 56 122 58 124 58C118 50 120 42 128 34Z" fill="{c}"/>'
    if element == "Earth":
        return f'<circle cx="128" cy="53" r="17" fill="none" stroke="{c}" stroke-width="4"/><path d="M113 53H143M128 38V68" stroke="{c}" stroke-width="3"/>'
    if element == "Air":
        return f'<path d="M108 46Q118 38 128 46T148 46M108 60Q118 52 128 60T148 60" fill="none" stroke="{c}" stroke-width="4" stroke-linecap="round"/>'
    return f'<path d="M128 34C138 48 146 56 146 64A18 18 0 0 1 110 64C110 56 118 48 128 34Z" fill="{c}"/>'


def zodiac_svg(key, name, dates, element, glyph) -> str:
    c = ELEMENT_COLORS[element]
    desc = (f"{name} zodiac medallion: the {name} glyph with the sign name and a {element.lower()} element mark. "
            f"Dates {dates}. Recognizable by glyph and label, not color alone. Optional artwork for Astrology &amp; Energy.")
    body = (defs(c, INK)
            + '<circle cx="128" cy="128" r="122" fill="url(#halo)"/>'
            + f'<g filter="url(#shadow)"><circle cx="128" cy="128" r="104" fill="#FFFBF3" stroke="{GOLD}" stroke-width="4"/>'
            + f'<circle cx="128" cy="128" r="94" fill="none" stroke="{c}" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round"/>'
            + element_mark(element)
            + f'<g transform="translate(128 132) scale(.62) translate(-128 -128)"><path d="{glyph}" fill="none" stroke="{INK}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/></g>'
            # Long names (Sagittarius, Capricorn) shrink so the label always stays inside the medallion.
            + f'<text x="128" y="200" text-anchor="middle" font-family="Georgia, \'Times New Roman\', serif" '
              f'font-size="{18 if len(name) <= 7 else 15 if len(name) <= 9 else 13}" letter-spacing="1.5" fill="{INK}">{name.upper()}</text>'
            + '</g>')
    return svg(f"{name} · {element}", desc, body)


def silhouette_svg() -> str:
    """Front-facing seated figure with the seven centers on the midline, for the chakra reference page."""
    ys = {"crown": 34, "third-eye": 66, "throat": 104, "heart": 150, "solar-plexus": 186, "sacral": 216, "root": 244}
    body = (
        '<defs><linearGradient id="skin" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#F3E7F7"/><stop offset="1" stop-color="#DCC8E6"/></linearGradient></defs>'
        '<g fill="url(#skin)" stroke="#B79CC8" stroke-width="2">'
        '<ellipse cx="128" cy="62" rx="27" ry="31"/>'
        '<path d="M116 90H140V104C170 108 190 120 194 150L202 214C204 226 196 232 188 228L172 206L170 236'
        'C196 244 230 252 236 268C240 280 228 290 210 288L128 282L46 288C28 290 16 280 20 268C26 252 60 244 86 236'
        'L84 206L68 228C60 232 52 226 54 214L62 150C66 120 86 108 116 104Z"/>'
        '</g>'
    )
    centers = "".join(
        f'<circle cx="128" cy="{ys[key]}" r="11" fill="{color}" stroke="#FFF8EC" stroke-width="3"/>'
        for key, _n, _s, _p, color, *_ in CHAKRAS
    )
    desc = ("Seated human silhouette facing forward with seven marked centers along the midline, from the base of the spine "
            "to the top of the head, for the optional chakra reference.")
    return svg("Chakra body map", desc, body + centers, 256, 300)


def manifest_entries() -> list[dict]:
    entries = []
    for key, name, sanskrit, petals, *_rest in CHAKRAS:
        entries.append({
            "filename": f"pathways/astrology-energy/chakra-illustrations/chakra-{key}.svg",
            "name": f"Chakra {name} Illustration",
            "collection": "chakra-illustrations",
            "pathway_visibility": "astrology-energy",
            "kind": "optional-illustration",
            "format": ["SVG", "PNG"],
            "intended_use": f"{name} ({sanskrit}) card artwork on the chakra reference; optional reflective art for Astrology & Energy only.",
            "png_export": f"png/pathways/astrology-energy/chakra-illustrations/chakra-{key}.png",
        })
    entries.append({
        "filename": "pathways/astrology-energy/chakra-illustrations/chakra-body-map.svg",
        "name": "Chakra Body Map",
        "collection": "chakra-illustrations",
        "pathway_visibility": "astrology-energy",
        "kind": "reference-diagram",
        "format": ["SVG", "PNG"],
        "intended_use": "Human silhouette for the chakra reference page, marking the seven centers.",
        "png_export": "png/pathways/astrology-energy/chakra-illustrations/chakra-body-map.png",
    })
    for key, name, dates, element, _glyph in ZODIAC:
        entries.append({
            "filename": f"pathways/astrology-energy/zodiac-illustrations/zodiac-{key}.svg",
            "name": f"Zodiac {name}",
            "collection": "zodiac-illustrations",
            "pathway_visibility": "astrology-energy",
            "kind": "optional-illustration",
            "format": ["SVG", "PNG"],
            "intended_use": f"{name} ({dates}, {element}) sign artwork for daily astrology and profile zodiac content in Astrology & Energy.",
            "png_export": f"png/pathways/astrology-energy/zodiac-illustrations/zodiac-{key}.png",
        })
    return entries


def main() -> None:
    CHAKRA_DIR.mkdir(exist_ok=True)
    ZODIAC_DIR.mkdir(exist_ok=True)
    for chakra in CHAKRAS:
        (CHAKRA_DIR / f"chakra-{chakra[0]}.svg").write_text(chakra_svg(*chakra), encoding="utf-8")
    (CHAKRA_DIR / "chakra-body-map.svg").write_text(silhouette_svg(), encoding="utf-8")
    for sign in ZODIAC:
        (ZODIAC_DIR / f"zodiac-{sign[0]}.svg").write_text(zodiac_svg(*sign), encoding="utf-8")

    # Register assets idempotently: replace this generator's collections, keep everything else as-is.
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    ours = {"chakra-illustrations", "zodiac-illustrations"}
    manifest["assets"] = [a for a in manifest["assets"] if a.get("collection") not in ours] + manifest_entries()
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(CHAKRAS) + 1} chakra and {len(ZODIAC)} zodiac SVGs; manifest now lists {len(manifest['assets'])} assets.")


if __name__ == "__main__":
    main()
