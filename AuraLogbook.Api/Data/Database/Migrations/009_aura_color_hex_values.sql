UPDATE AuraColorDefinitions
SET BaseHex = CASE AuraColorKey
    WHEN 'red' THEN '#f44336'
    WHEN 'orange' THEN '#ff9800'
    WHEN 'yellow' THEN '#fbc02d'
    WHEN 'green' THEN '#4caf50'
    WHEN 'blue' THEN '#2196f3'
    WHEN 'indigo' THEN '#3f51b5'
    WHEN 'violet' THEN '#9c27b0'
    WHEN 'gray' THEN '#9e9e9e'
    WHEN 'pink' THEN '#e91e63'
    ELSE BaseHex
END
WHERE AuraColorKey IN (
    'red', 'orange', 'yellow', 'green', 'blue',
    'indigo', 'violet', 'gray', 'pink'
);
