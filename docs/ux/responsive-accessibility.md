# Aura Logbook responsive and accessibility behavior

This document defines the responsive and accessibility direction for the web experience and a future SwiftUI shell. It is a design specification and source review, not a claim of WCAG conformance or proof that the current UI already meets these expectations.

It complements [Core user journeys](core-user-journeys.md) and [Experience principles](experience-principles.md). Keep the Prism Garden direction warm and tactile—linen, limestone, oat, and restrained jewel accents—while ensuring the interface remains calm, inclusive, and practical. Decorative texture and color must never reduce legibility or imply a required spiritual belief.

## Experience goals

- Keep the next meaningful action and page purpose clear at every viewport.
- Preserve the same core capabilities across mobile and desktop; reflow rather than hide essential content.
- Support keyboard, touch, screen readers, browser zoom, and enlarged text.
- Treat color, icons, charts, motion, weather, and spiritual language as supplementary—not the sole way to understand or use the app.
- Keep reflection optional and user-directed; avoid pressure, streak-shaming, diagnostic language, or assumptions about belief.

## Responsive layout targets

Use these representative viewports during design and implementation review:

| Context | Reference viewport | Expected behavior |
| --- | --- | --- |
| Narrow phone | 320–390 CSS px wide, portrait | Single-column content; no page-level horizontal scrolling; controls wrap or stack; primary action remains visible in normal reading order. |
| Large phone / small tablet | 600–899 CSS px wide | Flexible one- or two-column cards only when each retains readable content and usable controls; chart labels and filters may wrap. |
| Desktop | 1280–1440 CSS px wide | A clear content max-width, stable navigation, balanced dashboard columns, and no oversized empty regions. |

These are review anchors, not new product breakpoints. Reuse the UI framework's existing breakpoints unless testing demonstrates a need to change them. Also test browser zoom to 200% and text-only enlargement where available. At 320 CSS px, content should reflow without requiring two-dimensional scrolling, except for content that is inherently two-dimensional; charts must still provide an equivalent linear/text alternative.

### Navigation and shared shell

- At wide widths, retain clear page navigation and the profile context without competing with the page's main task.
- At narrow widths, collapse or reflow navigation into a clearly named, keyboard-operable menu or compact navigation pattern. Do not simply shrink the current horizontal button row until labels collide or disappear.
- Keep the active destination visibly indicated and expose it semantically (for example, `aria-current="page"`).
- Ensure opening a menu moves focus appropriately; Escape closes it and returns focus to its trigger. A closed menu must not leave hidden links in the keyboard tab order.
- On small screens, keep profile details concise or collapsible so that the primary page content is not pushed far below the fold.
- Provide a skip link to the main content. Use one page-level `h1`, meaningful section headings, and semantic header, navigation, main, and footer landmarks.

### Dashboard

Recommended reading order at every size:

1. Page title and brief orientation.
2. A clear, non-judgmental “Log a mood” action.
3. Current recorded-data summary.
4. Mood trends and recent entries.
5. Optional supporting context such as weather or pathway reflection.

At phone widths, stack these sections in that order. Stat cards can become a single column; use two columns only if labels and values remain comfortably readable at enlarged text. Charts should use available width (no fixed-width overflow), retain adequate touch/hover affordances, and move below the summary rather than compressing the main action. Weather and optional interpretation remain secondary and may not imply a cause of the user's mood.

Empty, loading, and error states must be distinct. “No entries yet” is not an API failure. Where an independent widget fails, explain the limited failure and offer a retry when possible without hiding the rest of the dashboard.

### Mood logging and reflection

- Keep the form in a single column on narrow screens; arrange mood groups in additional columns only when there is enough space.
- Keep labels adjacent to their controls. Group related mood options with a visible heading and a programmatic group label.
- Mood selection must work by keyboard and touch, with a visible selected state that is not color-only.
- A color tooltip cannot be the only source of a mood's name or meaning. On touch, keyboard focus, and screen readers, the same optional information must be discoverable without hover.
- Associate validation text with its field, move or announce focus appropriately after submit, and preserve entered values after recoverable errors.
- Mark optional reflection text as optional. Make clear that users can save a short entry or skip interpretation; do not make spiritual content mandatory.

### Mood history and entry actions

- Stack the start date, end date, and Filter controls at narrow widths (or use a deliberate two-row layout); never let the filter button be clipped or pushed offscreen.
- Preserve a logical tab sequence from filters through entries. Entry actions must have descriptive accessible names that identify the action and, where needed, the entry date.
- Long user-authored comments must wrap without clipping or forcing horizontal page scroll.
- Give empty results, loading, and request failure separate messages. Preserve the current filter context when the user edits or returns from an entry.

### Text, contrast, focus, and input

- Target WCAG 2.2 Level AA for implemented web screens; this document is a target, not a conformance certification.
- Normal text should meet at least 4.5:1 contrast against its actual surface; large text at least 3:1. Essential component boundaries and visual state indicators should meet applicable non-text contrast expectations.
- Do not put small text over textured or photographic backgrounds unless a sufficiently opaque, tested surface preserves contrast.
- Do not use a light aura swatch as text or as the only selected/focus indicator. Pair hues with names, symbols, patterns, or explicit labels and provide a readable neutral surface.
- Every interactive element must be reachable and operable by keyboard, have a persistent visible focus indicator, and follow a logical reading/tab order. Focus must not be obscured by sticky headers, dialogs, or overlays.
- Use persistent labels; placeholders are examples, not labels. Maintain readable line lengths and allow user text to wrap and scale without truncation.
- Prefer touch targets of at least 44 by 44 CSS px with adequate spacing. Never fall below WCAG 2.2 AA minimum target-size requirements where the criterion applies.
- Dialogs must have an accessible name, contain focus while open, close by the expected keyboard interaction where safe, and return focus to the invoking control.

### Charts, icons, and non-text content

- Give each chart a visible title and a concise text summary of what data it represents and its time range.
- Provide an accessible data alternative (for example, a compact table or list) that exposes the values and categories without requiring color discrimination, pointer hover, or chart navigation.
- Label axes and units; distinguish series using more than hue when multiple series are present. Do not imply prediction, causation, or personalized analysis unless that is what the data and feature actually provide.
- Hide purely decorative facets, botanical textures, and jewel illustrations from assistive technology. Give informative weather imagery meaningful alternative text; if the weather condition is already stated in adjacent text, mark the image decorative to avoid repetition.
- Ensure emoji are not the only label for a mood or action. Avoid exposing decorative emoji as noisy repeated screen-reader content.

### Motion and feedback

- Respect `prefers-reduced-motion`; remove non-essential transitions and animated chart effects when requested.
- Do not use flashing, pulsing, or motion-only alerts. Provide a stable text/state alternative for changes.
- Announce save, filter, and error results through an appropriate status or alert region without unexpectedly moving focus.
- Avoid auto-dismissing important errors before users can read them; provide a persistent way to recover.

## Static review of current implementation

Reviewed the current `master` sources for AppLayout, NavBar, Sidebar, Dashboard, MoodEntryFormFields, MoodHistory, and the two dashboard chart components. This is source-level review, not a rendered viewport or assistive-technology test.

| Area | Existing behavior observed | Responsive/accessibility follow-up |
| --- | --- | --- |
| Shared shell | AppLayout switches from one column to a 3/9-column layout at the framework's medium breakpoint. On small screens, profile/sidebar appear before page content. NavBar keeps all navigation buttons in a horizontal row. | Check the real narrow-width order and header fit; consider compact profile context and a keyboard-accessible collapsed navigation. |
| Dashboard cards | Summary cards use one column at the smallest breakpoint and two columns from small screens. | Check long names, dates, and 200% text; preserve the page action and logical reading order. |
| Dashboard charts | MoodPieChart and MoodTimelineChart each declare a 400 by 400 pixel wrapper. The pie legend and chart labels exist, but an equivalent non-visual data summary is not evident in these components. | Make charts fluid; add/verify a screen-reader and non-color alternative; inspect labels and touch behavior at narrow widths. |
| Mood form | Mood groups use one column at the smallest breakpoint and three columns from the small breakpoint. Mood checkboxes have text labels; color meanings are presented through a tooltip. | Verify tooltip access without hover; ensure groups, errors, focus, and expanded text remain usable at phone width and with assistive technology. |
| Mood history | Date filters and Filter button are in one flex row; entry edit/delete buttons have accessible names. | The filter row has no explicit wrapping rule in this component; verify it at narrow widths and enlarged text. Confirm comment wrapping and focus restoration after dialogs. |

The current code's responsive properties are useful foundations, but they do not by themselves establish that content remains usable at every target size. Record actual rendering and assistive-technology results in implementation stories.

## Follow-up implementation work to record

These are candidate implementation slices surfaced by this review; they are not delivered by this guidance document:

1. Make shared navigation/profile context usable on narrow screens and at enlarged text.
2. Replace fixed chart dimensions with fluid sizing and add accessible data summaries.
3. Reflow mood-history filters and verify mood form/history behavior at narrow widths.
4. Audit labels, validation announcements, keyboard focus, dialogs, contrast, and reduced-motion behavior across core journeys.
5. Perform and record browser zoom, keyboard-only, and screen-reader smoke checks on the dashboard, mood form, and history.

## Verification checklist for implementation

For each core screen, test 320 px and 390 px phone widths, a tablet-width layout, and a 1280 px or wider desktop layout. Repeat at 200% browser zoom.

- No page-level horizontal scrolling; no clipped labels, values, navigation, or actions.
- Primary action and page heading occur early in the reading order.
- Keyboard-only users can reach every control, see focus, operate menus/dialogs, and return focus after closing a dialog.
- Screen-reader users can identify landmarks, headings, field labels/errors, selected moods, chart purpose/data alternatives, and save/filter/error feedback.
- Contrast is checked on final surfaces, including textured backgrounds, selected states, focus rings, and disabled states.
- Color, emoji, hover, and motion are never the only way to understand meaning or state.
- Reduced-motion preference is honored.
- Empty, loading, and service-error states remain distinguishable and have useful next actions.

A successful component test suite alone does not verify these properties. Record browser/viewport and assistive-technology checks separately, and create bounded implementation stories for any failures found.


## Manual review run — 2026-10-20

This run supplements the source-level review above. It is a limited manual spot check, not a complete acceptance pass.

| Screen / check | Result | Evidence and limits |
| --- | --- | --- |
| Registration at 320 × 800 CSS px | **Failed** | The supplied browser screenshot shows a horizontal scrollbar and clipped content: the navigation row extends beyond the viewport and the registration form/pathway panel are wider than the available page width. This violates the narrow-phone no-horizontal-scroll requirement. |
| Registration at 390 × 844 CSS px | Partial pass | The isolated branch UI rendered and the visible registration content fit in the captured viewport. This does not override the 320px failure or establish full-page behavior. |
| Login at 1280 × 900 CSS px | Partial pass | The login screen rendered at desktop width. Authenticated dashboard and history screens were not visually reviewed in this run. |
| Keyboard focus | **Needs follow-up** | The browser accessibility snapshot exposed labels for email/password/display name and pathway controls. Keyboard focus moved from the brand control to Home, but no clearly visible focus indicator was apparent in the captured state. A full keyboard-only journey was not completed. |
| Heading and landmarks | **Needs follow-up** | The registration title is exposed as an h3, rather than the page-level h1 specified above. A complete semantic landmark audit was not performed. |
| Screen reader, 200% zoom, contrast | Not tested | No VoiceOver or equivalent screen-reader run, 200% zoom run, or measured contrast audit was completed. |
| Automated UI checks | Passed | 91 UI tests passed with the local API base URL configured. The production build completed (with a chunk-size advisory); lint reported no errors and three warnings. These checks do not prove responsive/accessibility conformance. |

The API was not running during this isolated UI review, so authenticated dashboard and history behavior could not be validated end to end. The 320px registration failure is a concrete implementation defect and should be tracked/fixed in a dedicated implementation story before this responsive experience is considered complete. Also follow up on the visible keyboard focus and page heading/landmark structure. Do not treat the untested checks in this table as passed.
