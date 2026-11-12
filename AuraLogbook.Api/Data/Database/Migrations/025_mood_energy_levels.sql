-- Energy level (1 = low, 5 = high) positions each mood on the Insights aura ribbon and drives average energy.
-- It describes activation, never whether a mood is good or bad: Tense and Restless are high-energy, not "worse".
ALTER TABLE MoodDefinitions ADD COLUMN EnergyLevel INTEGER NOT NULL DEFAULT 3 CHECK (EnergyLevel BETWEEN 1 AND 5);
UPDATE MoodDefinitions SET EnergyLevel = 1 WHERE MoodKey IN ('Weary', 'Heavy');
UPDATE MoodDefinitions SET EnergyLevel = 2 WHERE MoodKey IN ('Disconnected');
UPDATE MoodDefinitions SET EnergyLevel = 3 WHERE MoodKey IN ('Centered', 'Neutral', 'Harmonious');
UPDATE MoodDefinitions SET EnergyLevel = 4 WHERE MoodKey IN ('Flowing', 'Visionary', 'Abundant', 'Restless', 'Tense', 'Frustrated', 'Scattered');
UPDATE MoodDefinitions SET EnergyLevel = 5 WHERE MoodKey IN ('Empowered', 'Charged');
