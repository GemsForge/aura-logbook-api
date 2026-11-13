using System.Text.Json;
using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using Dapper;

namespace AuraLogbook.Api.Repositories;

/// <summary>SQLite/Dapper persistence for private, structured pathway activity records.</summary>
public sealed class SqlitePathwayActivityRepository : IPathwayActivityRepository
{
    private readonly IDbConnectionFactory _factory;

    /// <summary>Creates the repository using the configured SQLite connection factory.</summary>
    public SqlitePathwayActivityRepository(IDbConnectionFactory factory) => _factory = factory;

    /// <inheritdoc />
    public async Task<List<PathwayActivity>> GetByUserAsync(int userId, string? pathway, string? moduleKey, string? activityType)
    {
        using var connection = _factory.CreateConnection();
        var rows = await connection.QueryAsync<ActivityRow>("""
            SELECT Id, UserId, Pathway, ModuleKey, ActivityType, OccurredOn, ContentJson, CreatedAt, UpdatedAt
            FROM PathwayActivities
            WHERE UserId = @userId
              AND (@pathway IS NULL OR Pathway = @pathway)
              AND (@moduleKey IS NULL OR ModuleKey = @moduleKey)
              AND (@activityType IS NULL OR ActivityType = @activityType)
            ORDER BY OccurredOn DESC, CreatedAt DESC;
            """, new { userId, pathway, moduleKey, activityType });
        return rows.Select(Map).ToList();
    }

    /// <inheritdoc />
    public async Task<PathwayActivity?> GetByIdAsync(int userId, int id)
    {
        using var connection = _factory.CreateConnection();
        var row = await connection.QuerySingleOrDefaultAsync<ActivityRow>("""
            SELECT Id, UserId, Pathway, ModuleKey, ActivityType, OccurredOn, ContentJson, CreatedAt, UpdatedAt
            FROM PathwayActivities WHERE UserId = @userId AND Id = @id;
            """, new { userId, id });
        return row is null ? null : Map(row);
    }

    /// <inheritdoc />
    public async Task<int> CreateAsync(PathwayActivity activity)
    {
        using var connection = _factory.CreateConnection();
        return await connection.ExecuteScalarAsync<int>("""
            INSERT INTO PathwayActivities (UserId, Pathway, ModuleKey, ActivityType, OccurredOn, ContentJson, CreatedAt, UpdatedAt)
            VALUES (@UserId, @Pathway, @ModuleKey, @ActivityType, @OccurredOn, @ContentJson, @CreatedAt, @UpdatedAt)
            RETURNING Id;
            """, Parameters(activity));
    }

    /// <inheritdoc />
    public async Task<bool> UpdateAsync(PathwayActivity activity)
    {
        using var connection = _factory.CreateConnection();
        return await connection.ExecuteAsync("""
            UPDATE PathwayActivities
            SET Pathway = @Pathway, ModuleKey = @ModuleKey, ActivityType = @ActivityType,
                OccurredOn = @OccurredOn, ContentJson = @ContentJson, UpdatedAt = @UpdatedAt
            WHERE UserId = @UserId AND Id = @Id;
            """, Parameters(activity)) == 1;
    }

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(int userId, int id)
    {
        using var connection = _factory.CreateConnection();
        return await connection.ExecuteAsync("DELETE FROM PathwayActivities WHERE UserId = @userId AND Id = @id", new { userId, id }) == 1;
    }

    /// <summary>Serializes the validated JSON payload and stores dates in ISO format.</summary>
    private static object Parameters(PathwayActivity activity) => new
    {
        activity.Id,
        activity.UserId,
        activity.Pathway,
        activity.ModuleKey,
        activity.ActivityType,
        OccurredOn = activity.OccurredOn.ToString("yyyy-MM-dd"),
        ContentJson = activity.Content.GetRawText(),
        activity.CreatedAt,
        activity.UpdatedAt
    };

    /// <summary>Converts the SQLite row into a detached JSON element safe beyond the reader scope.</summary>
    private static PathwayActivity Map(ActivityRow row)
    {
        // Clone detaches the element so the pooled document can be disposed immediately.
        using var content = JsonDocument.Parse(row.ContentJson);
        return new PathwayActivity
        {
            Id = row.Id,
            UserId = row.UserId,
            Pathway = row.Pathway,
            ModuleKey = row.ModuleKey,
            ActivityType = row.ActivityType,
            OccurredOn = DateOnly.Parse(row.OccurredOn),
            Content = content.RootElement.Clone(),
            CreatedAt = ParseUtc(row.CreatedAt),
            UpdatedAt = ParseUtc(row.UpdatedAt)
        };
    }

    /// <summary>Stored timestamps are UTC; restore that kind so reads serialize exactly like writes (with "Z").</summary>
    private static DateTime ParseUtc(string value) =>
        DateTime.Parse(value, System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal);

    private sealed class ActivityRow
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Pathway { get; set; } = "";
        public string ModuleKey { get; set; } = "";
        public string ActivityType { get; set; } = "";
        public string OccurredOn { get; set; } = "";
        public string ContentJson { get; set; } = "{}";
        public string CreatedAt { get; set; } = "";
        public string UpdatedAt { get; set; } = "";
    }
}
