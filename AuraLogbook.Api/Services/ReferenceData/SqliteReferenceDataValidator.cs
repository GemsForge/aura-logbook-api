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
        var distinctKeys = keys.Where(key => !string.IsNullOrWhiteSpace(key)).Distinct(StringComparer.Ordinal).ToArray();
        if (distinctKeys.Length == 0) return false;
        using var connection = factory.CreateConnection();
        var activeCount = await connection.ExecuteScalarAsync<int>(
            "SELECT COUNT(DISTINCT MoodKey) FROM MoodDefinitions WHERE IsActive = 1 AND MoodKey IN @keys", new { keys = distinctKeys });
        return activeCount == distinctKeys.Length;
    }
}
