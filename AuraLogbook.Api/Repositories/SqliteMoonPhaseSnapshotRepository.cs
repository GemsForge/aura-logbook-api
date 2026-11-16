using System.Globalization;
using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using Dapper;

namespace AuraLogbook.Api.Repositories;

/// <summary>SQLite storage for provider moon details keyed by local calendar date (migration 036).</summary>
public sealed class SqliteMoonPhaseSnapshotRepository(IDbConnectionFactory factory) : IMoonPhaseSnapshotRepository
{
    /// <inheritdoc />
    public async Task<MoonPhaseSnapshot?> GetAsync(DateOnly date, CancellationToken cancellationToken)
    {
        using var db = factory.CreateConnection();
        var row = await db.QuerySingleOrDefaultAsync<SnapshotRow>(new CommandDefinition(
            "SELECT Date, Phase, Illumination, MoonSign FROM MoonPhaseSnapshots WHERE Date = @Date",
            new { Date = FormatDate(date) }, cancellationToken: cancellationToken));
        return row is null ? null : ToSnapshot(row);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<MoonPhaseSnapshot>> GetRangeAsync(
        DateOnly startDate,
        DateOnly endDate,
        CancellationToken cancellationToken)
    {
        using var db = factory.CreateConnection();
        var rows = await db.QueryAsync<SnapshotRow>(new CommandDefinition(
            "SELECT Date, Phase, Illumination, MoonSign FROM MoonPhaseSnapshots WHERE Date >= @StartDate AND Date <= @EndDate",
            new { StartDate = FormatDate(startDate), EndDate = FormatDate(endDate) }, cancellationToken: cancellationToken));
        return rows.Select(ToSnapshot).ToArray();
    }

    /// <inheritdoc />
    public async Task SaveAsync(MoonPhaseSnapshot snapshot, CancellationToken cancellationToken)
    {
        using var db = factory.CreateConnection();
        await db.ExecuteAsync(new CommandDefinition(
            """
            INSERT INTO MoonPhaseSnapshots (Date, Phase, Illumination, MoonSign)
            VALUES (@Date, @Phase, @Illumination, @MoonSign)
            ON CONFLICT(Date) DO UPDATE SET
                Phase = COALESCE(excluded.Phase, MoonPhaseSnapshots.Phase),
                Illumination = COALESCE(excluded.Illumination, MoonPhaseSnapshots.Illumination),
                MoonSign = COALESCE(excluded.MoonSign, MoonPhaseSnapshots.MoonSign);
            """,
            new
            {
                Date = FormatDate(snapshot.Date),
                snapshot.Phase,
                snapshot.Illumination,
                snapshot.MoonSign,
            }, cancellationToken: cancellationToken));
    }

    private static string FormatDate(DateOnly date) => date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

    private static MoonPhaseSnapshot ToSnapshot(SnapshotRow row) => new(
        DateOnly.ParseExact(row.Date, "yyyy-MM-dd", CultureInfo.InvariantCulture),
        row.Phase,
        row.Illumination,
        row.MoonSign);

    private sealed class SnapshotRow
    {
        public string Date { get; set; } = "";
        public string? Phase { get; set; }
        public decimal? Illumination { get; set; }
        public string? MoonSign { get; set; }
    }
}
