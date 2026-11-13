-- Restore the authored color associations from migration 010 only where placeholder copy remains.
-- Preserve customized descriptions, mood/color mappings, and all private user records.
UPDATE AuraColorDefinitions
SET Description = CASE AuraColorKey
    WHEN 'red' THEN 'Rooted, grounded energy for safety and survival.'
    WHEN 'orange' THEN 'Creative flow and emotional warmth.'
    WHEN 'yellow' THEN 'Personal power, confidence, and optimism.'
    WHEN 'green' THEN 'Compassion, growth, and harmony.'
    WHEN 'blue' THEN 'Expression, truth, and clear communication.'
    WHEN 'indigo' THEN 'Intuition, insight, and inner wisdom.'
    WHEN 'violet' THEN 'Spirituality, higher purpose, and connection.'
    WHEN 'gray' THEN 'Neutrality and grounding between states.'
    WHEN 'pink' THEN 'Warmth and heart-centered joy.'
    ELSE Description END
WHERE AuraColorKey IN ('red','orange','yellow','green','blue','indigo','violet','gray','pink')
  AND (TRIM(Description) = '' OR TRIM(Description) = DisplayName || ' reflective energy.' COLLATE NOCASE);
