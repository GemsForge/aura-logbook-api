# Private mood media attachments

The History cards support private photo attachments for saved mood entries. The separate **Gallery** view gathers those images across entries in a responsive grid. Selecting an image opens a lightbox with its mood, date, optional reflection, and delete action. The browser resizes and converts selected photos to JPEG before upload so large phone originals fit the API's 10 MB file limit. A maximum of 10 attachments is allowed per mood entry.

## User flow

1. While logging a mood, choose one or more local photos before saving. The browser downsamples large photos to a maximum 2400-pixel edge and compresses them as JPEG before sending them.
2. Review each private preview and filename; remove any selected photo before saving if needed.
3. Save the mood entry first. The UI then uploads each prepared image to the authenticated private-media endpoint using the new mood entry ID.
4. If some uploads fail, the mood and reflection stay saved. Choose **Retry failed photos** to retry only the remaining images without creating another mood entry.
5. The History card displays its private previews and filenames. Use its existing **Add photo** and remove controls to manage images later.

In **Gallery**, choose an existing mood entry before uploading one or more photos. The gallery shows private images in a responsive grid. Open a photo to see its entry mood and date along the bottom, with an optional reflection clamped to two lines. The lightbox delete action removes the attachment from that entry.

The browser requests image bytes through the authenticated API and keeps them in temporary object URLs. The API does not return a public media URL.

## Storage and privacy

- Migration `012_private_mood_media.sql` adds owner-scoped metadata to SQLite.
- Image bytes are stored under `Storage:PrivateMediaPath`, which defaults to `Data/private-media` and must remain outside `wwwroot`.
- Filenames on disk are random server-generated keys. The original filename is sanitized and used only as display metadata.
- Upload validation checks the image signature and accepts only JPEG, PNG, or WebP. The UI converts browser-decodable selections, including HEIC/HEIF where supported by the browser, into JPEG; SVG and other active or unsupported formats are rejected.
- List, upload, preview, and delete operations require a bearer token and verify that the mood entry belongs to the authenticated user.
- Deleting a mood entry also removes its media files and metadata. Cleanup failures are written to the API log for follow-up.
- Content responses use `Cache-Control: private, no-store` and `X-Content-Type-Options: nosniff`.

Production currently uses file-based mood records while attachment metadata uses SQLite. The migration therefore does not declare a database foreign key to `MoodEntries`; the API enforces ownership. Hosted deployments must configure a persistent private media directory and ensure that the SQLite database and private files are backed up together.

## API routes

All routes below require the authenticated user's bearer token:

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/Mood/{moodEntryId}/attachments` | List attachment metadata for an owned mood entry |
| `POST` | `/api/Mood/{moodEntryId}/attachments` | Upload one multipart image in the `file` field |
| `GET` | `/api/Mood/{moodEntryId}/attachments/{attachmentId}/content` | Stream an owned image privately |
| `DELETE` | `/api/Mood/{moodEntryId}/attachments/{attachmentId}` | Delete the image and its metadata |

Configure the private directory with an environment-specific setting such as `Storage__PrivateMediaPath` or a .NET user secret. Do not place it under `wwwroot` or commit credentials in configuration.
