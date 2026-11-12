-- Point each active mood definition at its approved UI illustration without changing mood keys or aura mappings.
UPDATE MoodDefinitions
SET Icon = '/mood-icons/' || lower(MoodKey) || '.png'
WHERE MoodKey IN (
    'Empowered', 'Centered', 'Harmonious', 'Flowing',
    'Weary', 'Tense', 'Frustrated', 'Blocked',
    'Restless', 'Disconnected', 'Heavy', 'Charged',
    'Scattered', 'Abundant', 'Visionary', 'Neutral'
);
