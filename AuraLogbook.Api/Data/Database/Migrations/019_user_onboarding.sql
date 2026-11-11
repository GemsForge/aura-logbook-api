-- #341: onboarding state captured after a short registration.
-- OnboardingCompletedAt: NULL until the user finishes (or skips) onboarding.
-- AuraRevealsEnabled: settings toggle for aura reveal copy; on by default.
-- OnboardingColorHue: optional hue (0-359) from the wordless color moment; an input to the derived aura, never a chosen color.
-- OnboardingAnswersJson: the pathway quiz answers as [{"questionNumber":1,"pathway":0}, ...].
ALTER TABLE Users ADD COLUMN OnboardingCompletedAt TEXT;
ALTER TABLE Users ADD COLUMN AuraRevealsEnabled INTEGER NOT NULL DEFAULT 1 CHECK (AuraRevealsEnabled IN (0, 1));
ALTER TABLE Users ADD COLUMN OnboardingColorHue INTEGER CHECK (OnboardingColorHue IS NULL OR OnboardingColorHue BETWEEN 0 AND 359);
ALTER TABLE Users ADD COLUMN OnboardingAnswersJson TEXT CHECK (OnboardingAnswersJson IS NULL OR json_valid(OnboardingAnswersJson));
-- PathwayPreferencesJson: choices from the pathway page, e.g. {"focus":["calm","clarity"],"checkInOpener":"three-breaths"}.
ALTER TABLE Users ADD COLUMN PathwayPreferencesJson TEXT CHECK (PathwayPreferencesJson IS NULL OR json_valid(PathwayPreferencesJson));

-- Existing accounts already chose a pathway at registration, so they are treated as onboarded
-- and are never redirected into the quiz.
UPDATE Users SET OnboardingCompletedAt = CreatedAt WHERE OnboardingCompletedAt IS NULL;
