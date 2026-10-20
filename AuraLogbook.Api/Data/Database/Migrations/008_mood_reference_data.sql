INSERT INTO MoodDefinitions (MoodKey, DisplayName) VALUES
    ('Empowered', 'Empowered'),
    ('Centered', 'Centered'),
    ('Harmonious', 'Harmonious'),
    ('Flowing', 'Flowing'),
    ('Weary', 'Weary'),
    ('Tense', 'Tense'),
    ('Frustrated', 'Frustrated'),
    ('Restless', 'Restless'),
    ('Disconnected', 'Disconnected'),
    ('Heavy', 'Heavy'),
    ('Charged', 'Charged'),
    ('Scattered', 'Scattered'),
    ('Abundant', 'Abundant'),
    ('Visionary', 'Visionary'),
    ('Neutral', 'Neutral')
ON CONFLICT(MoodKey) DO UPDATE SET
    DisplayName = excluded.DisplayName,
    IsActive = 1;
