using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Repositories;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.FileProviders;

namespace AuraLogbook.Api.Tests;

public sealed class RelationalRepositoryTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(Path.GetTempPath(), $"aura-test-{Guid.NewGuid():N}.db");
    private readonly SqliteConnectionFactory _factory;

    public RelationalRepositoryTests()
    {
        var connection = new SqliteConnection($"Data Source={_databasePath}");
        connection.Open();
        var migration = File.ReadAllText(Path.Combine("..", "..", "..", "..", "AuraLogbook.Api", "Data", "Database", "Migrations", "001_initial_schema.sql"));
        using var command = connection.CreateCommand();
        command.CommandText = migration;
        command.ExecuteNonQuery();
        connection.Dispose();
        _factory = new SqliteConnectionFactory(new TestOptions<DatabaseOptions>(new DatabaseOptions { ConnectionString = $"Data Source={_databasePath}" }));
        SeedReferenceData();
    }

    [Fact]
    public async Task User_repository_reads_seeded_user()
    {
        var repository = new SqliteUserRepository(_factory);
        var user = await repository.GetByEmailAsync("test@example.com");
        Assert.NotNull(user);
        Assert.Equal(7, user.Id);
        Assert.Equal("Test User", user.DisplayName);
    }

    [Fact]
    public async Task User_birthday_round_trips_for_insert_update_and_missing_value()
    {
        var previousCulture = System.Globalization.CultureInfo.CurrentCulture;
        try
        {
            System.Globalization.CultureInfo.CurrentCulture = new("fr-FR");
            var repository = new SqliteUserRepository(_factory);
            var user = new User { Email = "birthday@example.com", PasswordHash = "hash", Birthday = new DateOnly(2000, 2, 29), AuraIntensity = 50 };
            user.Id = await repository.CreateAsync(user);
            Assert.Equal(user.Birthday, (await repository.GetByIdAsync(user.Id))!.Birthday);
            using var connection = _factory.CreateConnection();
            using var command = connection.CreateCommand();
            command.CommandText = "SELECT Birthday FROM Users WHERE Id = $id";
            command.Parameters.AddWithValue("$id", user.Id);
            Assert.Equal("2000-02-29", command.ExecuteScalar());
            user.Birthday = new DateOnly(1995, 12, 31);
            Assert.True(await repository.UpdateAsync(user));
            Assert.Equal(user.Birthday, (await repository.GetByIdAsync(user.Id))!.Birthday);
            Assert.Equal("1995-12-31", command.ExecuteScalar());
            user.Birthday = default;
            Assert.True(await repository.UpdateAsync(user));
            Assert.Equal(DBNull.Value, command.ExecuteScalar());
            Assert.Equal(default, (await repository.GetByIdAsync(user.Id))!.Birthday);
        }
        finally { System.Globalization.CultureInfo.CurrentCulture = previousCulture; }
    }

    [Fact]
    public async Task Mood_repository_persists_and_reads_mood_pairs()
    {
        var repository = new SqliteMoodRepository(_factory);
        var id = await repository.CreateAsync(new MoodEntry { UserId = 7, Date = new DateOnly(2026, 10, 19), Moods = [MoodType.Centered, MoodType.Harmonious], Comment = "Integration test" });
        var entry = await repository.GetByIdAsync(id);
        Assert.NotNull(entry);
        Assert.Equal(2, entry.Moods.Count);
        Assert.Contains(MoodType.Centered, entry.Moods);
        Assert.Contains(MoodType.Harmonious, entry.Moods);
    }

    [Fact]
    public async Task Mood_repository_isolates_entries_by_user_and_supports_crud()
    {
        var repository = new SqliteMoodRepository(_factory);
        var ownId = await repository.CreateAsync(new MoodEntry { UserId = 7, Date = new DateOnly(2026, 10, 18), Moods = [MoodType.Centered] });
        await repository.CreateAsync(new MoodEntry { UserId = 8, Date = new DateOnly(2026, 10, 18), Moods = [MoodType.Weary] });

        var ownEntries = await repository.GetAllByUserAsync(7);
        Assert.Single(ownEntries);
        Assert.Equal(ownId, ownEntries[0].Id);

        var updated = ownEntries[0];
        updated.Comment = "Updated";
        updated.Moods = [MoodType.Harmonious];
        Assert.True(await repository.UpdateAsync(updated));

        var changed = await repository.GetByIdAsync(ownId);
        Assert.Equal("Updated", changed?.Comment);
        Assert.Equal([MoodType.Harmonious], changed?.Moods);
        Assert.True(await repository.DeleteAsync(ownId));
        Assert.Null(await repository.GetByIdAsync(ownId));
    }

    [Fact]
    public async Task Zodiac_repository_reads_seeded_insight()
    {
        using var command = _factory.CreateConnection().CreateCommand();
        command.CommandText = "INSERT INTO ZodiacSigns (SignKey, Description, Element) VALUES ('aries','Bold','fire'); INSERT INTO InsightTemplates (ZodiacSignKey, InsightType, Title, Message) VALUES ('aries','BoldAction','Act','Take a step.');";
        command.ExecuteNonQuery();
        var repository = new SqliteZodiacInsightsRepository(_factory);
        var zodiac = await repository.GetBySignAsync("aries");
        Assert.NotNull(zodiac);
        Assert.Single(zodiac.Insights);
        Assert.Equal("Take a step.", zodiac.Insights[0].Message);
    }

    private void SeedReferenceData()
    {
        using var connection = _factory.CreateConnection();
        connection.ExecuteNonQuery("INSERT INTO Users (Id,Email,PasswordHash,DisplayName,AuraColor,AuraIntensity,SelectedPathway,CreatedAt,UpdatedAt) VALUES (7,'test@example.com','hash','Test User','blue',50,0,'2026-10-19T00:00:00Z','2026-10-19T00:00:00Z'),(8,'other@example.com','hash','Other User','red',50,0,'2026-10-19T00:00:00Z','2026-10-19T00:00:00Z'); INSERT INTO MoodDefinitions (MoodKey,DisplayName) VALUES ('Centered','Centered'),('Harmonious','Harmonious'),('Weary','Weary');");
    }

    public void Dispose()
    {
        if (File.Exists(_databasePath)) File.Delete(_databasePath);
    }

    private sealed class TestOptions<T>(T value) : Microsoft.Extensions.Options.IOptions<T> where T : class
    {
        public T Value { get; } = value;
    }
}

file static class SqliteTestExtensions
{
    public static void ExecuteNonQuery(this SqliteConnection connection, string sql)
    {
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }
}
