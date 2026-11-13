-- A user-selected occurrence time is separate from the immutable server creation timestamp.
-- Keep legacy rows null: their display/metrics fallback remains CreatedAt, without inventing a time.
ALTER TABLE MoodEntries ADD COLUMN OccurredAt TEXT;
