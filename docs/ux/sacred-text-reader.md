# Embedded sacred-text reader

Status: implemented as an Aura route, updated November 14, 2026. This is a
standalone reader destination launched from the Faith & Religion reading card;
it is not a separate product or project.

The [Core user journeys](core-user-journeys.md) remain the product source of truth.
This extends their Sacred Texts module and the [pathway recap data plan](pathway-recap-data-plan.md).

## Experience

The reader's main utility is comfortable in-app reading with lightweight private
notes and bookmarks. The daily passage is its entry point. Its primary action
becomes **Read in Aura**; the publisher/source link remains available for attribution
and further study. Reading must not depend on opening another app.

Use the approved Prism Garden direction: warm, quiet surfaces, generous reading
space, and restrained jewel accents. Keep Aura's abstract prism identity visible
in the reader shell while giving the selected text the strongest visual emphasis.
The reader is a full in-app destination rather than an external publisher handoff.

- Christian: Bible; Muslim: Quran; Jewish: supported Jewish text. Fetch only the
  deliberately selected framework, language, and translation. With no supported
  framework, keep the general daily quote rather than assuming a scripture.
- Open at the daily passage, with surrounding verses/segments and chapter/section
  navigation. Use book/chapter controls for Bible text, surah/ayah for Quran, and
  the selected work's appropriate section labels for Jewish texts.
- Keep source content read-only. Provide text-size controls, comfortable spacing,
  a bookmark/resume position, and a compact toolbar that follows the selected Aura
  theme. Keep controls quiet and subordinate to the reading surface.
- Select text or use a verse/segment action menu to highlight, add a private note,
  copy a reference, or bookmark. The action menu provides a keyboard/touch option
  that does not require dragging a selection.
- Desktop: a centered reading column with a private-notes panel alongside it.
  Mobile: reading first, with notes opened in a sheet or separate view on demand.
  Arabic/Hebrew source blocks need their own language and right-to-left direction;
  translations retain their correct direction.
- Notes/highlights persist across sessions, can be edited/deleted, and stay private.
  A saved note does not automatically become a journal entry. **Save to journal**
  stays explicit, and opening a chapter does not mean the user marked it as read.
- Export selected/all personal notes and references as Markdown/text or JSON;
  offer print/save-to-PDF as a reader action. Include quoted source text only
  where the chosen translation's display/export terms permit it.

## Package choices

| Candidate | What it supplies | Fit for Aura |
| --- | --- | --- |
| [Recogito React Text Annotator](https://github.com/recogito/text-annotator-js/tree/main/packages/text-annotator-react) | React annotation layer for rendered text, selection popups, annotation events/state; BSD-3-Clause. | Integrated for text selection and version-bound highlights. Aura owns passage navigation, private notes, authenticated persistence, and exports. |
| [React Reader](https://github.com/gerhardsletten/react-reader) | EPUB display via epub.js, navigation, reading position, font-size and highlighting examples. | Useful if Aura later distributes licensed EPUB books. Current sacred-text providers supply structured passages, so EPUB conversion would add unnecessary work for this experience. |
| [Tiptap Comments](https://tiptap.dev/docs/comments/getting-started/install) | Annotation/comment functionality within an editor; requires subscription/trial, private package access, and document-server integration. | A paid alternative if broader document editing/collaboration becomes a requirement. Those requirements exceed a private read-only scripture reader. |

The reader is an Aura-owned experience. Recogito is an implementation detail that
can be replaced without changing the product boundary or private annotation API.

## Data and API work

The API serves navigable sections through the existing provider adapters. Requests
remain scoped to the explicitly selected framework; provider keys remain on the
server, and returned sections include source/version, language direction, and
attribution metadata.

Each annotation needs its owner, framework, provider, work/book identifier,
chapter/section and verse/segment identifiers, language, translation/version,
selected text/offset anchors where permitted, highlight style, optional note, and
created/updated timestamps. Bind highlights to the exact source version. Changing
translation must not silently move a highlight onto different wording.

Reading position, bookmarks, notes and deliberate reading check-ins have distinct
meanings. Do not derive practice or recap completion from a render or navigation
click. Reuse private pathway activity infrastructure where its validated contract
fits; add new typed contracts before saving new activity shapes.

## Acceptance and verification

For repeatable visual and accessibility reviews, use the
[Sacred text reader review checklist](sacred-text-reader-review-checklist.md).

1. A daily passage opens inside Aura at the correct source location; navigation
   never mixes frameworks, languages, or translations.
2. Highlight and note creation/edit/deletion work by text selection or the
   keyboard/touch segment controls, survive
   reload, and remain inaccessible to other users.
3. Translation changes preserve each annotation's original reference/version.
4. Exports include the user's selected notes and accurate references; failures do
   not lose edits. Source text export follows that version's permissions.
5. Responsive layout, theme tokens, enlarged text, screen-reader labels, RTL plus
   translations, empty content, provider failure, and save/retry states are
   implemented; full device, assistive-technology, and provider smoke review remains.
6. Source links remain secondary. General-quote users are not shown a scripture
   reader or calls for an unselected framework.
