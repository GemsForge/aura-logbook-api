CREATE UNIQUE INDEX IF NOT EXISTS UX_InsightTemplates_ZodiacSignKey_InsightType
    ON InsightTemplates(ZodiacSignKey, InsightType);

CREATE INDEX IF NOT EXISTS IX_MoodAuraMappings_AuraColorKey
    ON MoodAuraMappings(AuraColorKey);
