-- Single-use password reset tokens (#329). Only a SHA-256 hash of the raw token is stored.
-- UserId has no Users foreign key because Production users live in files (see 013).
CREATE TABLE IF NOT EXISTS PasswordResetTokens (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    UserId INTEGER NOT NULL,
    TokenHash TEXT NOT NULL UNIQUE,
    CreatedAt TEXT NOT NULL,
    ExpiresAt TEXT NOT NULL,
    UsedAt TEXT NULL
);

CREATE INDEX IF NOT EXISTS IX_PasswordResetTokens_UserId ON PasswordResetTokens (UserId);
