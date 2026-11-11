using System.Globalization;
using AuraLogbook.Api.Data.Database;
using Dapper;

namespace AuraLogbook.Api.Repositories;

/// <summary>SQLite storage for <c>UserAuraSeasons</c> (migration 021).</summary>
public sealed class SqliteAuraSeasonRepository(IDbConnectionFactory factory) : IAuraSeasonRepository
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<AuraSeasonSpan>> GetHistoryAsync(int userId)
    {
        using var c = factory.CreateConnection();
        var rows = await c.QueryAsync<(string SeasonKey, string StartedOn, string? EndedOn)>(
            "SELECT SeasonKey, StartedOn, EndedOn FROM UserAuraSeasons WHERE UserId = @userId ORDER BY StartedOn, Id", new { userId });
        return rows.Select(r => new AuraSeasonSpan(r.SeasonKey, Parse(r.StartedOn), r.EndedOn is null ? null : Parse(r.EndedOn))).ToList();
    }

    /// <inheritdoc />
    public async Task StartAsync(int userId, string seasonKey, DateOnly startedOn)
    {
        using var c = factory.CreateConnection();
        c.Open();
        using var tx = c.BeginTransaction();
        var day = startedOn.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        // History spans are inclusive, so close the prior season the day before its successor starts.
        await c.ExecuteAsync("UPDATE UserAuraSeasons SET EndedOn = MAX(StartedOn, @endDay) WHERE UserId = @userId AND EndedOn IS NULL", new { userId, endDay = startedOn.AddDays(-1).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) }, tx);
        await c.ExecuteAsync("INSERT INTO UserAuraSeasons (UserId, SeasonKey, StartedOn) VALUES (@userId, @seasonKey, @day)", new { userId, seasonKey, day }, tx);
        tx.Commit();
    }

    /// <inheritdoc />
    public async Task<AuraSeasonSpan?> GetLatestAsync(int userId)
    {
        using var c = factory.CreateConnection();
        var row = await c.QuerySingleOrDefaultAsync<(string SeasonKey, string StartedOn, string? EndedOn)?>(
            "SELECT SeasonKey, StartedOn, EndedOn FROM UserAuraSeasons WHERE UserId = @userId ORDER BY StartedOn DESC, Id DESC LIMIT 1", new { userId });
        return row is null ? null : new AuraSeasonSpan(row.Value.SeasonKey, Parse(row.Value.StartedOn), row.Value.EndedOn is null ? null : Parse(row.Value.EndedOn));
    }

    private static DateOnly Parse(string value) => DateOnly.ParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture);
}
