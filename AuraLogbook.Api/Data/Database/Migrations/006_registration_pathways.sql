-- Pathway keys match the SpiritualPathway enum used by registration.
INSERT INTO SpiritualPathways (PathwayKey, DisplayName, Description) VALUES
    (0, 'Mindful Living', 'Calm, clarity, and self-awareness.'),
    (1, 'Astrology & Energy', 'For those drawn to star signs and energy.'),
    (2, 'Faith & Religion', 'For a journey guided by scripture and prayer.')
ON CONFLICT(PathwayKey) DO UPDATE SET
    DisplayName = excluded.DisplayName,
    Description = excluded.Description;
