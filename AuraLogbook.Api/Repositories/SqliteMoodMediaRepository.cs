using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using Dapper;

namespace AuraLogbook.Api.Repositories;

/// <summary>Reads and writes private mood-media metadata with explicit user scoping.</summary>
public sealed class SqliteMoodMediaRepository : IMoodMediaRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    /// <summary>Creates a repository using the configured SQLite connection factory.</summary>
    public SqliteMoodMediaRepository(IDbConnectionFactory connectionFactory) => _connectionFactory = connectionFactory;

    /// <inheritdoc />
    public async Task<IReadOnlyList<MoodMediaAttachmentRecord>> GetForMoodAsync(int userId, int moodEntryId)
    {
        using var connection = _connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<MoodMediaAttachmentRecord>("""
            SELECT Id, UserId, MoodEntryId, StorageKey, FileName, ContentType, ByteLength, CreatedAt
            FROM MoodMediaAttachments
            WHERE UserId = @userId AND MoodEntryId = @moodEntryId
            ORDER BY CreatedAt, Id;
            """, new { userId, moodEntryId });
        return rows.AsList();
    }

    /// <inheritdoc />
    public async Task<MoodMediaAttachmentRecord?> GetAsync(int userId, int moodEntryId, string attachmentId)
    {
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<MoodMediaAttachmentRecord>("""
            SELECT Id, UserId, MoodEntryId, StorageKey, FileName, ContentType, ByteLength, CreatedAt
            FROM MoodMediaAttachments
            WHERE UserId = @userId AND MoodEntryId = @moodEntryId AND Id = @attachmentId;
            """, new { userId, moodEntryId, attachmentId });
    }

    /// <inheritdoc />
    public async Task AddAsync(MoodMediaAttachmentRecord attachment)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync("""
            INSERT INTO MoodMediaAttachments (Id, UserId, MoodEntryId, StorageKey, FileName, ContentType, ByteLength, CreatedAt)
            VALUES (@Id, @UserId, @MoodEntryId, @StorageKey, @FileName, @ContentType, @ByteLength, @CreatedAt);
            """, attachment);
    }

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(int userId, int moodEntryId, string attachmentId)
    {
        using var connection = _connectionFactory.CreateConnection();
        return await connection.ExecuteAsync("""
            DELETE FROM MoodMediaAttachments
            WHERE UserId = @userId AND MoodEntryId = @moodEntryId AND Id = @attachmentId;
            """, new { userId, moodEntryId, attachmentId }) == 1;
    }
}
