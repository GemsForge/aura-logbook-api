using AuraLogbook.Api.Data.Database;
using Dapper;

namespace AuraLogbook.Api.Services.ReferenceData;

/// <summary>Validates client-provided keys against active SQLite definitions.</summary>
public sealed class SqliteReferenceDataValidator(IDbConnectionFactory factory) : IReferenceDataValidator
{
    public async Task<bool> IsActivePathwayAsync(string key)
    {
        using var connection = factory.CreateConnection();
        return await connection.ExecuteScalarAsync<bool>(
            "SELECT EXISTS(SELECT 1 FROM SpiritualPathways WHERE StableKey = @key AND IsActive = 1)", new { key });
    }

    public async Task<bool> IsActiveAuraAsync(string key)
    {
        using var connection = factory.CreateConnection();
        return await connection.ExecuteScalarAsync<bool>(
            "SELECT EXISTS(SELECT 1 FROM AuraColorDefinitions WHERE AuraColorKey = @key AND IsActive = 1)", new { key });
    }

    public async Task<bool> AreActiveMoodsAsync(IEnumerable<string> keys)
    {
        // Blank keys are rejected rather than skipped because callers persist the submitted list as-is.
        var submitted = keys.ToArray();
        if (submitted.Length == 0 || submitted.Any(string.IsNullOrWhiteSpace)) return false;
        var distinctKeys = submitted.Distinct(StringComparer.Ordinal).ToArray();
        using var connection = factory.CreateConnection();
        var activeCount = await connection.ExecuteScalarAsync<int>(
            "SELECT COUNT(DISTINCT MoodKey) FROM MoodDefinitions WHERE IsActive = 1 AND MoodKey IN @keys", new { keys = distinctKeys });
        return activeCount == distinctKeys.Length;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<string>?> ResolveActiveMoodKeysAsync(IReadOnlyList<string> keys)
    {
        using var connection = factory.CreateConnection();
        var active = (await connection.QueryAsync<string>("SELECT MoodKey FROM MoodDefinitions WHERE IsActive = 1"))
            .ToDictionary(key => key, StringComparer.OrdinalIgnoreCase);
        var resolved = new List<string>(keys.Count);
        foreach (var key in keys)
        {
            if (string.IsNullOrWhiteSpace(key) || !active.TryGetValue(key.Trim(), out var canonical)) return null;
            resolved.Add(canonical);
        }
        return resolved;
    }
}
