using System.Text.Json;
using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;
using Dapper;

namespace AuraLogbook.Api.Repositories;

/// <summary>Loads the exact pathway interpretation for a canonical mood set from SQLite.</summary>
public sealed class SqliteMoodCombinationRepository(IDbConnectionFactory connectionFactory) : IMoodCombinationRepository
{
    /// <inheritdoc />
    public async Task<MoodCombinationInterpretation?> GetAsync(IReadOnlyCollection<MoodType> moods, int pathwayKey)
    {
        var moodSetKey = MoodCombinationImporter.CreateMoodSetKey(moods);
        const string sql = """
            SELECT CombinationId, MoodsJson, PathwayKey, Interpretation
            FROM MoodCombinationInterpretations
            WHERE MoodSetKey = @MoodSetKey AND PathwayKey = @PathwayKey AND IsActive = 1;
            """;
        using var connection = connectionFactory.CreateConnection();
        var row = await connection.QuerySingleOrDefaultAsync<MoodCombinationRow>(sql, new { MoodSetKey = moodSetKey, PathwayKey = pathwayKey });
        if (row is null) return null;
        var parsedMoods = JsonSerializer.Deserialize<string[]>(row.MoodsJson) ?? [];
        return new MoodCombinationInterpretation
        {
            CombinationId = row.CombinationId,
            Moods = parsedMoods,
            PathwayKey = checked((int)row.PathwayKey),
            Interpretation = row.Interpretation,
        };
    }

    private sealed record MoodCombinationRow(string CombinationId, string MoodsJson, long PathwayKey, string Interpretation);
}
