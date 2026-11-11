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
            SELECT i.CombinationId, i.MoodsJson, i.PathwayKey, i.Interpretation, h.Hue
            FROM MoodCombinationInterpretations i
            LEFT JOIN MoodCombinationHues h ON h.MoodSetKey = i.MoodSetKey
            WHERE i.MoodSetKey = @MoodSetKey AND i.PathwayKey = @PathwayKey AND i.IsActive = 1;
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
            Hue = row.Hue,
        };
    }

    /// <inheritdoc />
    public async Task<IReadOnlyDictionary<string, CombinationHue>> GetHuesAsync()
    {
        using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<(string MoodSetKey, double Hue, double ChromaFactor, double Weight)>(
            "SELECT MoodSetKey, Hue, ChromaFactor, Weight FROM MoodCombinationHues;");
        return rows.ToDictionary(r => r.MoodSetKey, r => new CombinationHue(r.Hue, r.ChromaFactor, r.Weight));
    }

    private sealed record MoodCombinationRow(string CombinationId, string MoodsJson, long PathwayKey, string Interpretation, double? Hue);
}
