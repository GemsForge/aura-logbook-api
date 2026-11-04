-- Spotify user IDs come from the authenticated identity and Production users live in files.
-- Remove SQLite Users foreign keys while preserving existing OAuth attempts and connections.
CREATE TABLE SpotifyConnections_StorageMigration (
    UserId INTEGER PRIMARY KEY,
    SpotifyUserId TEXT NOT NULL,
    EncryptedAccessToken TEXT NOT NULL,
    EncryptedRefreshToken TEXT NOT NULL,
    ExpiresAt TEXT NOT NULL,
    CreatedAt TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL
);

INSERT INTO SpotifyConnections_StorageMigration
    (UserId, SpotifyUserId, EncryptedAccessToken, EncryptedRefreshToken, ExpiresAt, CreatedAt, UpdatedAt)
SELECT UserId, SpotifyUserId, EncryptedAccessToken, EncryptedRefreshToken, ExpiresAt, CreatedAt, UpdatedAt
FROM SpotifyConnections;

DROP TABLE SpotifyConnections;
ALTER TABLE SpotifyConnections_StorageMigration RENAME TO SpotifyConnections;

CREATE TABLE SpotifyAuthorizationAttempts_StorageMigration (
    StateHash TEXT NOT NULL PRIMARY KEY,
    UserId INTEGER NOT NULL,
    EncryptedVerifier TEXT NOT NULL,
    RedirectUri TEXT NOT NULL,
    ExpiresAt TEXT NOT NULL
);

INSERT INTO SpotifyAuthorizationAttempts_StorageMigration
    (StateHash, UserId, EncryptedVerifier, RedirectUri, ExpiresAt)
SELECT StateHash, UserId, EncryptedVerifier, RedirectUri, ExpiresAt
FROM SpotifyAuthorizationAttempts;

DROP TABLE SpotifyAuthorizationAttempts;
ALTER TABLE SpotifyAuthorizationAttempts_StorageMigration RENAME TO SpotifyAuthorizationAttempts;
