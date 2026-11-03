CREATE TABLE IF NOT EXISTS SpotifyConnections (
    UserId INTEGER PRIMARY KEY,
    SpotifyUserId TEXT NOT NULL,
    EncryptedAccessToken TEXT NOT NULL,
    EncryptedRefreshToken TEXT NOT NULL,
    ExpiresAt TEXT NOT NULL,
    CreatedAt TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);
