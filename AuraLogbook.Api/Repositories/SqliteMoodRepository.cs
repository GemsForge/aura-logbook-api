using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;
using Dapper;

namespace AuraLogbook.Api.Repositories;

public sealed class SqliteMoodRepository : IFileMoodRepository
{
    private readonly IDbConnectionFactory _factory;
    public SqliteMoodRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<List<MoodEntry>> GetAllByUserAsync(int userId)
    {
        using var c = _factory.CreateConnection();
        var rows = await c.QueryAsync<MoodRow>("SELECT * FROM MoodEntries WHERE UserId=@userId ORDER BY EntryDate DESC", new { userId });
        return await MapAsync(c, rows);
    }
    public async Task<MoodEntry?> GetByIdAsync(int id)
    {
        using var c = _factory.CreateConnection();
        var row = await c.QuerySingleOrDefaultAsync<MoodRow>("SELECT * FROM MoodEntries WHERE Id=@id", new { id });
        return row is null ? null : (await MapAsync(c, new[] { row })).Single();
    }
    public async Task<int> CreateAsync(MoodEntry entry)
    {
        using var c = _factory.CreateConnection(); using var tx = c.BeginTransaction();
        var id = await c.ExecuteScalarAsync<int>("INSERT INTO MoodEntries (UserId,EntryDate,Comment,AuraColor,AuraIntensity,ChakraKey,WeatherSnapshot,CreatedAt,UpdatedAt) VALUES (@UserId,@Date,@Comment,@AuraColor,@AuraIntensity,@ChakraKey,@WeatherSnapshot,@CreatedAt,@CreatedAt) RETURNING Id", Parameters(entry), tx);
        await ReplaceMoodsAsync(c, tx, id, entry.Moods);
        tx.Commit(); return id;
    }
    public async Task<bool> UpdateAsync(MoodEntry entry)
    {
        using var c = _factory.CreateConnection(); using var tx = c.BeginTransaction();
        var updated = await c.ExecuteAsync("UPDATE MoodEntries SET EntryDate=@Date,Comment=@Comment,AuraColor=@AuraColor,AuraIntensity=@AuraIntensity,ChakraKey=@ChakraKey,WeatherSnapshot=@WeatherSnapshot,UpdatedAt=@CreatedAt WHERE Id=@Id", Parameters(entry), tx) == 1;
        if (updated) await ReplaceMoodsAsync(c, tx, entry.Id, entry.Moods);
        if (updated) tx.Commit(); else tx.Rollback(); return updated;
    }
    private static object Parameters(MoodEntry entry) => new { entry.Id, entry.UserId, Date = entry.Date.ToString("yyyy-MM-dd"), entry.Comment, entry.AuraColor, entry.AuraIntensity, entry.ChakraKey, entry.WeatherSnapshot, entry.CreatedAt };
    public async Task<bool> DeleteAsync(int id) { using var c = _factory.CreateConnection(); return await c.ExecuteAsync("DELETE FROM MoodEntries WHERE Id=@id", new { id }) == 1; }

    private static async Task ReplaceMoodsAsync(System.Data.Common.DbConnection c, System.Data.Common.DbTransaction tx, int entryId, IEnumerable<MoodType> moods)
    {
        await c.ExecuteAsync("DELETE FROM MoodEntryMoods WHERE MoodEntryId=@entryId", new { entryId }, tx);
        foreach (var mood in moods.Distinct())
            await c.ExecuteAsync("INSERT INTO MoodEntryMoods (MoodEntryId, MoodKey) VALUES (@entryId,@moodKey)", new { entryId, moodKey = mood.ToString() }, tx);
    }

    private static async Task<List<MoodEntry>> MapAsync(System.Data.Common.DbConnection c, IEnumerable<MoodRow> rows)
    {
        var result = new List<MoodEntry>();
        foreach (var row in rows)
        {
            var moods = await c.QueryAsync<string>("SELECT MoodKey FROM MoodEntryMoods WHERE MoodEntryId=@id", new { id = row.Id });
            result.Add(new MoodEntry { Id = row.Id, UserId = row.UserId, Date = DateOnly.Parse(row.EntryDate), Comment = row.Comment, AuraColor = row.AuraColor, AuraIntensity = row.AuraIntensity, ChakraKey = row.ChakraKey, WeatherSnapshot = row.WeatherSnapshot, CreatedAt = DateTime.Parse(row.CreatedAt), Moods = moods.Select(Enum.Parse<MoodType>).ToList() });
        }
        return result;
    }
    private sealed class MoodRow { public int Id { get; set; } public int UserId { get; set; } public string EntryDate { get; set; } = ""; public string? Comment { get; set; } public string? AuraColor { get; set; } public int? AuraIntensity { get; set; } public string? ChakraKey { get; set; } public string? WeatherSnapshot { get; set; } public string CreatedAt { get; set; } = ""; }
}
    /// <summary>Initializes a mood repository backed by SQLite.</summary>
    /// <summary>Returns the mood entries belonging to a user.</summary>
    /// <summary>Returns a mood entry by identifier, including its mood pair records.</summary>
    /// <summary>Creates a mood entry and its related mood pairs in one transaction.</summary>
    /// <summary>Updates a mood entry and replaces its related mood pairs atomically.</summary>
    /// <summary>Deletes a mood entry and reports whether a row was removed.</summary>
