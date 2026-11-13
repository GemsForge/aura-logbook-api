# Mood entry layout acceptance checklist

Reference: the approved two-column mood-log screenshot supplied November 13, 2026.
This focused change covers Log mood, its shared edit form, and the matching invitation
on Daily Astrology. See [Core user journeys](core-user-journeys.md#2-record-a-mood).

- Use the shared `CurrentAuraMark` in Today and mood entry, backed by the saved derived aura and its existing reveal preference. Shared `.aura-highlight` / `.aura-panel` surfaces use one subtle wash throughout journal and pathway views; selecting draft moods does not recalculate that color.
- Keep the existing application shell, navigation, theme tokens, mood catalog, illustrations and multi-selection behavior.
- Use the shared `MoodEntryFormFields` for create/edit; preserve React Hook Form/Yup validation and existing API/photo retry flow.
- Desktop uses two theme-backed, lightly rounded surfaces: the form on the left and optional reflection on the right. Small screens stack them without horizontal page overflow.
- Emotion choices form one horizontally scrollable row, leading with the existing positive/reflective moods, then configured aura-color order and alphabetical within each color group. Reuse the compact `MoodChoiceButton` from Today, including its 20px illustration and `aria-pressed` form selection; labeled previous/next icon controls have 44px targets. Checkbox-chip and action padding stays compact.
- Put all 18 existing impact topics in their own optional section; preserve the agreed labels and multi-selection.
- Keep the Markdown note editor compact (140px initial height). Place the photo icon and compact save action on the same bottom row.
- Match the Daily Astrology invitation using one shared source. Count actual matching mood days, never infer that a chakra caused a mood.
- `Resonates / Maybe / Not for me` are optional controlled choices. Save the selected response and invitation atomically with the mood; restore them on edit.
- New entries default to today and allow an earlier local journal date; future or invalid dates cannot be submitted. The API creation timestamp stays separate.
- Keep loading, errors, date editing, save failures, and photo retries usable. Do not attach a stale choice to replacement invitation text.
- Check 320, 768, 1024 and 1440px in Chromium, including scroll, overflow, identical invitation text and save payload. API persistence is separately verified against SQLite; browser provider responses are fixtures.

## Companion pathway views

The supplied astrology, chakra and breathing screenshots also guide these layout corrections:

- Daily Astrology: a simple serif page heading; horoscope and chart panels side by side on desktop; a full-width moon-count card and the shared mood invitation underneath. Stack on phones; preserve provider attribution, existing feedback and save behavior.
- Chakra reference: the existing human silhouette beside seven canonical center buttons; selected definition/themes and a short reference explanation beneath. Ignore duplicate legacy underscore aliases. Keep catalog terms/colors and existing explicit journal-save controls.
- Breathing: one centered frame with a short heading, animated orb, cadence selector and icon controls. Preserve 4/6 and 3/3 timing, pause/resume/reset, reduced motion and accessible labels.

## Review boundary

An independent reviewer checked the source against this checklist. Their cache-refresh
finding was corrected for both create and edit flows. A scratch-only calibration at
`$TMPDIR/aura-layout-check-u7alwfx_/MoodEntryFormFields.tsx` deliberately changed the
editor height from 140 to 320px; a separate reviewer identified that difference.
This single-file proof tested editor sizing in source, not rendering or contrast.
Browser checks separately exercise the real layouts with synthetic account/provider
responses; private persistence is tested against SQLite.
