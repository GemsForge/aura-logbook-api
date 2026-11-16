-- Provider results are shared by date and remain available across app restarts and deployments.
CREATE TABLE IF NOT EXISTS MoonPhaseSnapshots (
    Date TEXT NOT NULL PRIMARY KEY CHECK (length(Date) = 10),
    Phase TEXT NULL,
    Illumination REAL NULL,
    MoonSign TEXT NULL
);
