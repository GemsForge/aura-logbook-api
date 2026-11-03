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
}
