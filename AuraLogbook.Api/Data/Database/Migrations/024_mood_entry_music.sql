-- Track playing on the user's connected Spotify account when the check-in was saved (JSON: name, artists).
-- Null when Spotify is not connected, nothing was playing, or the lookup failed; used only for Insights patterns.
ALTER TABLE MoodEntries ADD COLUMN MusicTrack TEXT;
