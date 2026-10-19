using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using Dapper;

namespace AuraLogbook.Api.Repositories;

public sealed class SqliteReflectionRepository(IDbConnectionFactory connectionFactory) : IReflectionRepository
{
    public async Task<IReadOnlyList<ReflectionPrompt>> GetActivePromptsAsync(
        int? pathwayKey,
        string? auraColorKey,
        string? chakraKey)
    {
        const string sql = """
            SELECT Id, PromptKey, PromptText, Category, PathwayKey, AuraColorKey, ChakraKey
            FROM ReflectionPrompts
            WHERE IsActive = 1
              AND (@PathwayKey IS NULL OR PathwayKey IS NULL OR PathwayKey = @PathwayKey)
              AND (@AuraColorKey IS NULL OR AuraColorKey IS NULL OR AuraColorKey = @AuraColorKey COLLATE NOCASE)
              AND (@ChakraKey IS NULL OR ChakraKey IS NULL OR ChakraKey = @ChakraKey COLLATE NOCASE)
            ORDER BY Category COLLATE NOCASE, PromptKey COLLATE NOCASE;
            """;

        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<ReflectionPrompt>(sql, new { PathwayKey = pathwayKey, AuraColorKey = auraColorKey, ChakraKey = chakraKey });
        return rows.AsList();
    }

    public async Task<IReadOnlyList<ReflectionResponse>> GetResponsesAsync(int userId, int? moodEntryId)
    {
        const string sql = """
            SELECT Id, PromptId, MoodEntryId, ResponseText, CreatedAt, UpdatedAt
            FROM ReflectionResponses
            WHERE UserId = @UserId
              AND (@MoodEntryId IS NULL OR MoodEntryId = @MoodEntryId)
            ORDER BY CreatedAt DESC, Id DESC;
            """;

        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<ReflectionResponse>(sql, new { UserId = userId, MoodEntryId = moodEntryId });
        return rows.AsList();
    }

    public async Task<ReflectionResponse?> GetResponseAsync(int userId, int responseId)
    {
        const string sql = """
            SELECT Id, PromptId, MoodEntryId, ResponseText, CreatedAt, UpdatedAt
            FROM ReflectionResponses
            WHERE UserId = @UserId AND Id = @ResponseId;
            """;

        using var connection = connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<ReflectionResponse>(sql, new { UserId = userId, ResponseId = responseId });
    }

    public async Task<ReflectionResponse?> CreateResponseAsync(
        int userId,
        int promptId,
        int moodEntryId,
        string responseText)
    {
        const string insertSql = """
            INSERT INTO ReflectionResponses (UserId, PromptId, MoodEntryId, ResponseText, CreatedAt, UpdatedAt)
            SELECT @UserId, @PromptId, @MoodEntryId, @ResponseText, @Now, @Now
            WHERE EXISTS (
                SELECT 1 FROM MoodEntries WHERE Id = @MoodEntryId AND UserId = @UserId
            )
              AND EXISTS (
                SELECT 1 FROM ReflectionPrompts WHERE Id = @PromptId AND IsActive = 1
            )
            RETURNING Id;
            """;

        using var connection = connectionFactory.CreateConnection();
        using var transaction = connection.BeginTransaction();
        var now = DateTime.UtcNow;
        var id = await connection.QuerySingleOrDefaultAsync<int?>(insertSql, new
        {
            UserId = userId,
            PromptId = promptId,
            MoodEntryId = moodEntryId,
            ResponseText = responseText.Trim(),
            Now = now.ToString("O")
        }, transaction);

        if (id is null)
        {
            transaction.Rollback();
            return null;
        }

        var response = await connection.QuerySingleAsync<ReflectionResponse>("""
            SELECT Id, PromptId, MoodEntryId, ResponseText, CreatedAt, UpdatedAt
            FROM ReflectionResponses WHERE Id = @Id AND UserId = @UserId;
            """, new { Id = id.Value, UserId = userId }, transaction);
        transaction.Commit();
        return response;
    }
}
