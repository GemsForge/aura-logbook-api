-- #345: a hue of its own for each authored mood combination. Pathway-independent (one hue per
-- MoodSetKey); the interpretation text stays per pathway in MoodCombinationInterpretations.
-- Hue is OKLCH degrees; ChromaFactor scales saturation like single moods; Weight (default 1.25)
-- lets meaningful pairs nudge the aura slightly more than single moods.
CREATE TABLE IF NOT EXISTS MoodCombinationHues (
    MoodSetKey TEXT PRIMARY KEY,
    Hue REAL NOT NULL CHECK (Hue >= 0 AND Hue < 360),
    ChromaFactor REAL NOT NULL CHECK (ChromaFactor > 0 AND ChromaFactor <= 1),
    Weight REAL NOT NULL DEFAULT 1.25 CHECK (Weight > 0)
);

INSERT INTO MoodCombinationHues (MoodSetKey, Hue, ChromaFactor) VALUES
    ('Empowered|Tense', 35, 0.9),
    ('Frustrated|Visionary', 330, 1.0),
    ('Abundant|Heavy', 70, 0.6),
    ('Flowing|Restless', 175, 0.7),
    ('Disconnected|Harmonious', 160, 0.5),
    ('Centered|Weary', 265, 0.5),
    ('Neutral|Visionary', 300, 0.6),
    ('Abundant|Charged', 15, 1.0),
    ('Disconnected|Tense', 250, 0.4),
    ('Frustrated|Restless', 40, 0.8),
    ('Harmonious|Scattered', 115, 0.7),
    ('Disconnected|Heavy|Restless', 280, 0.35),
    ('Empowered|Frustrated|Tense', 30, 0.95),
    ('Abundant|Flowing|Visionary', 200, 0.9),
    ('Centered|Empowered|Harmonious', 120, 0.9)
ON CONFLICT(MoodSetKey) DO UPDATE SET
    Hue = excluded.Hue,
    ChromaFactor = excluded.ChromaFactor;
