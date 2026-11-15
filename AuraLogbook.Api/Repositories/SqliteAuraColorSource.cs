using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Services.Aura;
using Dapper;

namespace AuraLogbook.Api.Repositories;

/// <summary>Loads the same active, alphabetically ordered primary association and 500 shade used by mood controls.</summary>
public sealed class SqliteAuraColorSource(IDbConnectionFactory connections) : IAuraColorSource
{
    /// <inheritdoc />
    public async Task<IReadOnlyDictionary<string, double?>> GetMoodHuesAsync()
    {
        using var connection = connections.CreateConnection();
        var rows = await connection.QueryAsync<ColorRow>("""
            SELECT mapping.MoodKey, COALESCE(shade.HexValue, aura.BaseHex) AS HexValue, aura.IsNeutral
            FROM MoodAuraMappings mapping
            INNER JOIN MoodDefinitions mood ON mood.MoodKey = mapping.MoodKey AND mood.IsActive = 1
            INNER JOIN AuraColorDefinitions aura ON aura.AuraColorKey = mapping.AuraColorKey AND aura.IsActive = 1
            LEFT JOIN AuraColorShades shade ON shade.AuraColorKey = aura.AuraColorKey AND shade.Shade = 500
            ORDER BY mapping.MoodKey, mapping.AuraColorKey;
            """);
        return rows.GroupBy(row => row.MoodKey, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group =>
            {
                var primary = group.First();
                return primary.IsNeutral != 0 ? null : PaletteHue.FromHex(primary.HexValue);
            }, StringComparer.Ordinal);
    }

    private sealed record ColorRow(string MoodKey, string HexValue, long IsNeutral);
}
