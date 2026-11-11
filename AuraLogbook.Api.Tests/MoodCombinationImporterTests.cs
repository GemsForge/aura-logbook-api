using System.Text.Json;
using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Repositories;
using Microsoft.Data.Sqlite;

namespace AuraLogbook.Api.Tests;

/// <summary>Protects validation, transactional import, exact reconciliation, and lookup of mood combinations.</summary>
public sealed class MoodCombinationImporterTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(Path.GetTempPath(), $"aura-mood-combinations-{Guid.NewGuid():N}.sqlite");
    private readonly string _sourcePath = Path.GetFullPath(Path.Combine(
        AppContext.BaseDirectory, "..", "..", "..", "..", "aura-ui", "data", "aura_logbook_mood_combinations.json"));
    private readonly string _migrationDirectory = Path.GetFullPath(Path.Combine(
        AppContext.BaseDirectory, "..", "..", "..", "..", "AuraLogbook.Api", "Data", "Database", "Migrations"));

    /// <summary>Imports all pathway interpretations, reconciles exact content, and matches mood order independently.</summary>
    [Fact]
    public async Task Import_reconciles_source_and_repository_matches_selected_pathway()
    {
        await using (var connection = OpenMigratedDatabase())
        {
            var sourceBytes = await File.ReadAllBytesAsync(_sourcePath);
            Assert.Equal(15, MoodCombinationImporter.ValidateSource(sourceBytes));

            var first = await MoodCombinationImporter.ImportAsync(connection, _sourcePath);
            var second = await MoodCombinationImporter.ImportAsync(connection, _sourcePath);
            Assert.Equal(15, first.Combinations);
            Assert.Equal(45, first.Interpretations);
            Assert.Equal(45, first.StoredInterpretations);
            Assert.True(first.MatchesSource);
            Assert.Equal(0, first.Mismatches);
            Assert.Equal(first, second);
        }

        using var source = JsonDocument.Parse(await File.ReadAllTextAsync(_sourcePath));
        var item = source.RootElement.GetProperty("combinations")[0];
        var expectedMoods = item.GetProperty("moods").EnumerateArray()
            .Select(value => value.GetString()!).ToArray();
        var expectedText = item.GetProperty("results").GetProperty("mindful").GetString();
        var actual = await new SqliteMoodCombinationRepository(new TestConnectionFactory(_databasePath))
            .GetAsync(expectedMoods.Reverse().ToArray(), pathwayKey: 0);

        Assert.NotNull(actual);
        Assert.Equal(item.GetProperty("id").GetString(), actual.CombinationId);
        Assert.Equal(expectedText, actual.Interpretation);
        Assert.Equal(0, actual.PathwayKey);
        Assert.Equal(0L, Scalar("SELECT COUNT(*) FROM pragma_foreign_key_check;"));
    }

    /// <summary>Rejects reordered duplicate mood sets before any combination rows are changed.</summary>
    [Fact]
    public async Task Import_rejects_duplicate_mood_sets_before_database_changes()
    {
        const string source = """
            {"combinations":[
              {"id":"first","moods":["Restless","Disconnected"],"results":{"mindful":"a","astrology-energy":"b","faith-religion":"c"}},
              {"id":"second","moods":["Disconnected","Restless"],"results":{"mindful":"a","astrology-energy":"b","faith-religion":"c"}}
            ]}
            """;
        await using var connection = OpenMigratedDatabase();

        var exception = Assert.Throws<InvalidDataException>(() =>
            MoodCombinationImporter.ValidateSource(System.Text.Encoding.UTF8.GetBytes(source)));

        Assert.Contains("duplicate mood sets", exception.Message, StringComparison.Ordinal);
        Assert.Equal(0L, Scalar(connection, "SELECT COUNT(*) FROM MoodCombinationInterpretations;"));
    }

    /// <summary>Rolls mood-combination rows back with the caller's full-import transaction.</summary>
    [Fact]
    public async Task Import_uses_the_callers_transaction()
    {
        await using var connection = OpenMigratedDatabase();
        await using var transaction = (SqliteTransaction)await connection.BeginTransactionAsync();

        var result = await MoodCombinationImporter.ImportAsync(
            connection, await File.ReadAllBytesAsync(_sourcePath), transaction);
        Assert.Equal(45, result.StoredInterpretations);
        await transaction.RollbackAsync();

        Assert.Equal(0L, Scalar(connection, "SELECT COUNT(*) FROM MoodCombinationInterpretations;"));
    }

    public void Dispose()
    {
        SqliteConnection.ClearAllPools();
        if (File.Exists(_databasePath)) File.Delete(_databasePath);
    }

    private SqliteConnection OpenMigratedDatabase()
    {
        var connection = new SqliteConnection($"Data Source={_databasePath}");
        connection.Open();
        using (var foreignKeys = connection.CreateCommand())
        {
            foreignKeys.CommandText = "PRAGMA foreign_keys = ON;";
            foreignKeys.ExecuteNonQuery();
        }
        foreach (var migration in Directory.EnumerateFiles(_migrationDirectory, "*.sql").OrderBy(path => path, StringComparer.Ordinal))
        {
            using var command = connection.CreateCommand();
            command.CommandText = File.ReadAllText(migration);
            command.ExecuteNonQuery();
        }
        return connection;
    }

    private long Scalar(string sql)
    {
        using var connection = new SqliteConnection($"Data Source={_databasePath}");
        connection.Open();
        return Scalar(connection, sql);
    }

    private static long Scalar(SqliteConnection connection, string sql)
    {
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        return Convert.ToInt64(command.ExecuteScalar());
    }

    private sealed class TestConnectionFactory(string path) : IDbConnectionFactory
    {
        public SqliteConnection CreateConnection()
        {
            var connection = new SqliteConnection($"Data Source={path}");
            connection.Open();
            using var command = connection.CreateCommand();
            command.CommandText = "PRAGMA foreign_keys = ON;";
            command.ExecuteNonQuery();
            return connection;
        }
    }
}
