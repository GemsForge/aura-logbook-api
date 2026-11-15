# Sacred text reader UI review checklist

Use this checklist for future visual, consistency, and accessibility reviews of
the in-app reader. It records the November 14, 2026 source reviews and the
remaining runtime checks. A checked item means the reviewer inspected it in the
current implementation; it does not certify WCAG conformance.

## Review basis

- Page: `aura-ui/src/pages/SacredTextReader.tsx` and its imported reader
  components and stylesheets.
- Nearby reference: `aura-ui/src/pages/Pathways.tsx`, particularly its page
  heading and pathway content.
- The reader is the only reader page found in the app. Treat it as a standalone
  page kind; do not turn one page's choices into project-wide conventions.
- The prior review checklist was provisional and had not been independently
  reviewed. Use this file as the persistent review checklist, and revise it
  when product decisions or the UI change.
- Project guidance: `docs/ux/responsive-accessibility.md` targets WCAG 2.2 AA,
  prefers 44 by 44 CSS-pixel touch targets, requires keyboard operation and
  visible focus, and calls for labeled dialogs with focus containment and
  return. That document is a target, not a conformance certification.

## Checklist

### Page frame and orientation

- [ ] Open the reader through the normal authenticated route. Confirm the
  shared shell skip link, one main landmark, page header, and one page-level
  `h1` in the expected reading order.
- [ ] Check the selected-framework state and the unsupported/missing-framework
  fallback. The fallback currently has a back link, `h1`, and status message;
  compare whether it needs the short orientation line used on Pathways.
- [ ] Check the heading at phone, tablet, desktop, and 200% zoom. The reader's
  `signed-in-content` heading is affected by the global 1.5rem desktop rule;
  Pathways opts into a responsive 1.8–2.6rem title scale. Confirm whether the
  difference is intended and whether the title remains prominent.
- [ ] When navigation loads a section, confirm the focused heading has a
  visible focus indicator. The reader currently programmatically focuses an
  `h1` styled with `outline: none`; the global focus selector covers controls
  and links, not that heading.
- [ ] Confirm the document title identifies the reader in the browser and
  assistive-technology page list. The HTML shell currently has the generic
  title “Aura Logbook”; no page-specific title was found in the reviewed
  implementation.

### Navigation and controls

- [ ] Confirm book/work, chapter, surah, and segment controls have persistent
  labels and useful instructions; placeholders must remain examples, not
  labels.
- [ ] Compare the top and footer previous/next controls. The top controls use
  “chapter” in their accessible names while footer labels say “section”; keep
  the wording clear and consistent for the selected framework.
- [ ] Inspect every small button, field, selector, checkbox, and popup action.
  Joy `sm` controls have a 32px default minimum height; Aura prefers 44px touch
  targets. Measure actual hit areas and spacing, including at narrow widths,
  and check applicable WCAG 2.2 AA 2.5.8 minimum target sizing.
- [ ] Operate chapter navigation, text sizing, bookmark/resume, copy-reference,
  segment actions, and retries with keyboard only. Confirm focus remains
  visible and follows a logical reading order.

### Source and reading surface

- [ ] Confirm source attribution and the publisher link identify their purpose
  and destination. The current link label is “Publisher source”; check whether
  naming the provider gives users clearer context. When a Hebrew license deed
  URL is supplied with the selected source version, confirm the reader exposes
  that exact URL and does not synthesize one.
- [ ] Confirm section, translation/version, and individual segment references
  are available to sighted and screen-reader users, including during
  selection and export.
- [ ] Check language and direction for each source and translation run. Test
  Arabic/Hebrew RTL content paired with its translation and verify punctuation,
  reference order, selection offsets, and annotations remain associated with
  the correct segment.
- [ ] Check text-size controls and browser text enlargement together. Reading
  text should wrap without clipping, overlap, or two-dimensional page scroll.
- [ ] Review highlight and focus contrast in every available theme and color
  mode on the actual rendered reading surface. In particular, measure the
  translucent Recogito highlight over each text/background pair; token tests
  alone do not establish the composed overlay's contrast.

### Annotation actions and feedback

- [ ] Create, edit, and remove a highlight, note, and bookmark through both
  selection actions and the segment controls. Confirm keyboard/touch paths do
  not require dragging a text selection.
- [ ] Verify Recogito selection and its popup by keyboard, touch, mouse, and
  screen reader. Source inspection did not prove the library's interaction
  behavior.
- [ ] Confirm save, delete, retry, loading, and error feedback is announced
  without losing the user's note or moving focus unexpectedly. Include failed
  annotation loads and failed mutations.
- [ ] Confirm saved annotations remain private, use the correct source version
  and segment reference, and store segment-relative offsets with a lowercase
  SHA-256 digest of the cleaned selected text. Reopen changed provider text and
  confirm mismatched or unverifiable anchors are omitted from the reading
  surface while remaining available in the private notes list with feedback.
- [ ] Confirm journal reflection remains optional and separate from notes and
  bookmarks; a reader visit must not imply a completed reading.

### Notes panel, exports, and dialog

- [ ] At desktop widths, confirm the notes panel remains readable beside the
  text and its sticky position does not obscure focus or content.
- [ ] At phone widths, confirm the reading comes first, the notes panel is
  reachable through its toggle, and opening it does not strand focus or hide
  controls. Check 320px, 390px, tablet, desktop, and 200% zoom.
- [ ] Confirm selection checkboxes have usable target areas and clear names;
  selected/all Markdown and JSON exports contain the expected references and
  notes, and print/PDF remains readable.
- [ ] Open the note dialog from each entry point. Confirm its name and
  description, textarea label, validation/error feedback, keyboard containment,
  Escape behavior where safe, and focus return to the invoking control.
- [ ] Check icon-only and decorative content: meaningful icons need names;
  decorative artwork should remain hidden from assistive technology.

## Prior review findings to recheck

- The heading-weight calibration plant changed the reader title from weight
  500 to 700. The independent calibration reviewer identified that difference
  against the provisional checklist. The actual reader title uses weight 500,
  matching the nearby Pathways title weight; the outstanding title difference
  is its effective size at desktop.
- An accessibility review previously called out nested `main` landmarks. A
  separate source recheck corrected that: the normal signed-in shell renders
  one `main`; the other `main` is only in the onboarding-only branch, which
  returns before the normal shell. Do not report nested mains for the reader
  unless the shell changes.
- Reviews were source-only. They did not run tests, build the app, render
  viewports, connect to providers, or use browser accessibility tools or a
  screen reader. Do not treat unchecked items above as passed.

## Review record

When using this checklist, add a dated review note with the page/commit checked,
states and viewports compared, findings, what could not be evaluated, and the
reviewer's cost (files opened and searches run). If WCAG 2.2 AA is measured,
state which criteria were checked and that the rest were not assessed.

### 2026-11-14 — #410 reader contract follow-up

- Checked the saved-annotation canvas, reader page, API types, and checklist
  against the current #413 worktree. Saved anchors now use segment-relative
  offsets and are restored only after their lowercase SHA-256 matches the
  current cleaned segment text. Skipped anchors produce an announced warning.
- The create-note path supplies the selected block's segment reference. The
  reader exposes a source license URL only when the API returns one.
- `npm run build` passed. Review was source-only; viewport, keyboard, screen
  reader, contrast, RTL selection, dialogs, and print behavior were not checked.
- Cost: inspected the reader page and annotation canvas diffs, the reader
  checklist, and ran `git diff --check` plus the production UI build.
