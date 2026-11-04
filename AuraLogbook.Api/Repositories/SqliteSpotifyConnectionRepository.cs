using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using Dapper;

namespace AuraLogbook.Api.Repositories;

/// <summary>Stores only encrypted Spotify credentials in the development SQLite database.</summary>
public sealed class SqliteSpotifyConnectionRepository : ISpotifyConnectionRepository
{
    private readonly IDbConnectionFactory _factory;
    public SqliteSpotifyConnectionRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<SpotifyConnectionRecord?> GetAsync(int userId)
    {
        using var connection = _factory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<SpotifyConnectionRecord>("SELECT UserId, SpotifyUserId, EncryptedAccessToken, EncryptedRefreshToken, ExpiresAt, CreatedAt, UpdatedAt FROM SpotifyConnections WHERE UserId=@userId", new { userId });
    }

    public async Task SaveAsync(SpotifyConnectionRecord connection)
    {
        using var db = _factory.CreateConnection();
        await db.ExecuteAsync("""
            INSERT INTO SpotifyConnections (UserId, SpotifyUserId, EncryptedAccessToken, EncryptedRefreshToken, ExpiresAt, CreatedAt, UpdatedAt)
            VALUES (@UserId,@SpotifyUserId,@EncryptedAccessToken,@EncryptedRefreshToken,@ExpiresAt,@CreatedAt,@UpdatedAt)
            ON CONFLICT(UserId) DO UPDATE SET SpotifyUserId=@SpotifyUserId, EncryptedAccessToken=@EncryptedAccessToken, EncryptedRefreshToken=@EncryptedRefreshToken, ExpiresAt=@ExpiresAt, UpdatedAt=@UpdatedAt;
            """, connection);
    }

    public async Task DeleteAsync(int userId)
    {
        using var db = _factory.CreateConnection();
        await db.ExecuteAsync("DELETE FROM SpotifyConnections WHERE UserId=@userId", new { userId });
    }

    /// <summary>Stores an authorization attempt without retaining the raw state or verifier.</summary>
    public async Task SaveAttemptAsync(SpotifyAuthorizationAttempt attempt)
    {
        using var db = _factory.CreateConnection();
        using var tx = db.BeginTransaction();
        await db.ExecuteAsync("DELETE FROM SpotifyAuthorizationAttempts WHERE ExpiresAt < @now OR UserId = @UserId", new { now = DateTime.UtcNow, attempt.UserId }, tx);
        await db.ExecuteAsync("INSERT INTO SpotifyAuthorizationAttempts (StateHash,UserId,EncryptedVerifier,RedirectUri,ExpiresAt) VALUES (@StateHash,@UserId,@EncryptedVerifier,@RedirectUri,@ExpiresAt)", attempt, tx);
        tx.Commit();
    }

    /// <summary>SQLite DELETE RETURNING ensures an authorization attempt is used only once.</summary>
    public async Task<SpotifyAuthorizationAttempt?> ConsumeAttemptAsync(string stateHash)
    {
        using var db = _factory.CreateConnection();
        return await db.QuerySingleOrDefaultAsync<SpotifyAuthorizationAttempt>("DELETE FROM SpotifyAuthorizationAttempts WHERE StateHash=@stateHash RETURNING StateHash,UserId,EncryptedVerifier,RedirectUri,ExpiresAt", new { stateHash });
    }
}
