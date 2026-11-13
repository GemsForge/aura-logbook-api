# Embedded sacred-text reader

Status: requested experience and package recommendation, November 13, 2026.
The full reader is not implemented by the module visual refresh.

The [Core user journeys](core-user-journeys.md) remain the product source of truth.
This extends their Sacred Texts module and the [pathway recap data plan](pathway-recap-data-plan.md).

## Experience

The daily passage is an entry point to reading inside Aura. Its primary action
becomes **Read in Aura**; the publisher/source link remains available for attribution
and further study. Reading must not depend on opening another app.

- Christian: Bible; Muslim: Quran; Jewish: supported Jewish text. Fetch only the
  deliberately selected framework, language, and translation. With no supported
  framework, keep the general daily quote rather than assuming a scripture.
- Open at the daily passage, with surrounding verses/segments and chapter/section
  navigation. Use book/chapter controls for Bible text, surah/ayah for Quran, and
  the selected work's appropriate section labels for Jewish texts.
- Keep source content read-only. Provide text-size controls, comfortable spacing,
  a bookmark/resume position, and a compact toolbar that follows Aura's theme.
- Select text or use a verse/segment action menu to highlight, add a private note,
  copy a reference, or bookmark. The action menu provides a keyboard/touch option
  that does not require dragging a selection.
- Desktop: reading column with a notes panel. Mobile: reading first, notes in a
  sheet or separate view. Arabic/Hebrew source blocks need their own language and
  right-to-left direction; translations retain their correct direction.
- Notes/highlights persist across sessions, can be edited/deleted, and stay private.
  A saved note does not automatically become a journal entry. **Save to journal**
  stays explicit, and opening a chapter does not mean the user marked it as read.
- Export selected/all personal notes and references as Markdown/text or JSON;
  offer print/save-to-PDF as a reader action. Include quoted source text only
  where the chosen translation's display/export terms permit it.

## Package choices

| Candidate | What it supplies | Fit for Aura |
| --- | --- | --- |
| [Recogito React Text Annotator](https://github.com/recogito/text-annotator-js/tree/main/packages/text-annotator-react) | React annotation layer for rendered text, selection popups, annotation events/state; BSD-3-Clause. Its current package declares React 18/19 peers. | Recommended candidate for a small compatibility prototype. Aura still builds the reader shell, passage navigation, notes UI, authenticated persistence, and exports. |
| [React Reader](https://github.com/gerhardsletten/react-reader) | EPUB display via epub.js, navigation, reading position, font-size and highlighting examples. | Useful if Aura later distributes licensed EPUB books. Current sacred-text providers supply structured passages, so EPUB conversion would add unnecessary work for this experience. |
| [Tiptap Comments](https://tiptap.dev/docs/comments/getting-started/install) | Annotation/comment functionality within an editor; requires subscription/trial, private package access, and document-server integration. | A paid alternative if broader document editing/collaboration becomes a requirement. Those requirements exceed a private read-only scripture reader. |

Recommendation: build an Aura reader shell around the existing text APIs, evaluate
Recogito for text selection/annotation, and keep notes/export in Aura's own backend.
No reader package is installed or approved by this document. Package maintenance,
React 19 behavior, touch selection, keyboard alternatives, and right-to-left
behavior need a focused prototype before choosing the dependency.

## Data and API work

The present API returns a daily passage, not a navigable book library. Add
server-side chapter/section adapters for the existing providers using their
current documented contracts, preserving authentication, source/version metadata,
provider keys, attribution, rate limits, and permitted caching.

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

1. A daily passage opens inside Aura at the correct source location; navigation
   never mixes frameworks, languages, or translations.
2. Highlight and note creation/edit/deletion work by touch and keyboard, survive
   reload, and remain inaccessible to other users.
3. Translation changes preserve each annotation's original reference/version.
4. Exports include the user's selected notes and accurate references; failures do
   not lose edits. Source text export follows that version's permissions.
5. Check narrow phone/desktop, light/dark, text enlargement, screen-reader labels,
   RTL plus translations, empty content, provider failure, and save/retry errors.
6. Source links remain secondary. General-quote users are not shown a scripture
   reader or calls for an unselected framework.
