using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Repositories;
using Microsoft.Data.Sqlite;

namespace AuraLogbook.Api.Tests;

/// <summary>Ensures inclusive season history spans do not overlap at a transition.</summary>
public sealed class AuraSeasonRepositoryTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(Path.GetTempPath(), $"aura-season-{Guid.NewGuid():N}.db");
    private readonly TestConnectionFactory _factory;

    public AuraSeasonRepositoryTests()
    {
        _factory = new TestConnectionFactory(_databasePath);
        using var connection = _factory.CreateConnection();
        var migrationDirectory = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "AuraLogbook.Api", "Data", "Database", "Migrations"));
        foreach (var path in Directory.EnumerateFiles(migrationDirectory, "*.sql").OrderBy(path => path, StringComparer.Ordinal))
            MigrationTestDatabase.Execute(connection, File.ReadAllText(path));
        MigrationTestDatabase.Execute(connection, "INSERT INTO Users (Id, Email, PasswordHash, CreatedAt, UpdatedAt) VALUES (41, 'test@example.com', 'hash', '2026-01-01', '2026-01-01');");
    }

    [Fact]
    public async Task Starting_a_new_season_ends_the_previous_on_the_day_before()
    {
        var repository = new SqliteAuraSeasonRepository(_factory);
        var firstDay = new DateOnly(2026, 2, 10);
        var nextDay = firstDay.AddDays(5);

        await repository.StartAsync(41, "harbor", firstDay);
        await repository.StartAsync(41, "tide", nextDay);

        var spans = await repository.GetHistoryAsync(41);
        Assert.Collection(spans,
            old => { Assert.Equal("harbor", old.SeasonKey); Assert.Equal(nextDay.AddDays(-1), old.EndedOn); },
            current => { Assert.Equal("tide", current.SeasonKey); Assert.Equal(nextDay, current.StartedOn); Assert.Null(current.EndedOn); });
    }

    public void Dispose()
    {
        SqliteConnection.ClearAllPools();
        if (File.Exists(_databasePath)) File.Delete(_databasePath);
    }

    private sealed class TestConnectionFactory(string path) : IDbConnectionFactory
    {
        public SqliteConnection CreateConnection()
        {
            var connection = new SqliteConnection($"Data Source={path}");
            connection.Open();
            MigrationTestDatabase.Execute(connection, "PRAGMA foreign_keys = ON;");
            return connection;
        }
    }
}
