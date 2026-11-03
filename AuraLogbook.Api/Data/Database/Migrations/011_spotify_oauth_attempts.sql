-- Pending attempts survive API restarts and are consumed atomically before code exchange.
CREATE TABLE IF NOT EXISTS SpotifyAuthorizationAttempts (
    StateHash TEXT PRIMARY KEY,
    UserId INTEGER NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    EncryptedVerifier TEXT NOT NULL,
    RedirectUri TEXT NOT NULL,
    ExpiresAt TEXT NOT NULL
);
