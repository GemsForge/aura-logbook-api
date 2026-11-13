using AuraLogbook.Api.Data.Database;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Tests;

/// <summary>#365: curated reflections are imported at startup, safely and idempotently.</summary>
public sealed class ReflectionStartupImporterTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(Path.GetTempPath(), $"aura-startup-reflections-{Guid.NewGuid():N}.sqlite");
    private readonly string _source = Path.GetFullPath(Path.Combine(
        AppContext.BaseDirectory, "..", "..", "..", "..", "aura-ui", "data", "aura_logbook_mood_combinations.json"));

    public ReflectionStartupImporterTests()
    {
        using var connection = Open();
        var migrations = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "AuraLogbook.Api", "Data", "Database", "Migrations"));
        foreach (var path in Directory.EnumerateFiles(migrations, "*.sql").OrderBy(p => p, StringComparer.Ordinal))
            Execute(connection, File.ReadAllText(path));
    }

    private ReflectionStartupImporter Importer(bool enabled = true, string? source = null) => new(
        new Factory(_databasePath),
        Options.Create(new DatabaseOptions { ImportReflectionsOnStartup = enabled, ReflectionsSourcePath = source ?? _source }),
        NullLogger<ReflectionStartupImporter>.Instance);

    [Fact]
    public async Task Fresh_start_imports_every_curated_reflection()
    {
        var result = await Importer().ImportAsync();

        Assert.NotNull(result);
        Assert.True(result.MatchesSource);
        Assert.Equal(result.Interpretations, Count());
        Assert.True(Count() > 0);
    }

    [Fact]
    public async Task Restart_is_idempotent()
    {
        var first = await Importer().ImportAsync();
        var second = await Importer().ImportAsync();

        Assert.Equal(first, second);
        Assert.Equal(first!.Interpretations, Count());
    }

    [Fact]
    public async Task Invalid_or_missing_source_keeps_existing_reflections()
    {
        var imported = (await Importer().ImportAsync())!.Interpretations;
        var invalid = Path.Combine(Path.GetTempPath(), $"aura-invalid-{Guid.NewGuid():N}.json");
        await File.WriteAllTextAsync(invalid, """{"combinations":[{"id":"x","moods":["Tense"],"results":{}}]}""");
        try
        {
            Assert.Null(await Importer(source: invalid).ImportAsync());
            Assert.Null(await Importer(source: Path.Combine(Path.GetTempPath(), "missing-reflections.json")).ImportAsync());
        }
        finally
        {
            File.Delete(invalid);
        }

        Assert.Equal(imported, Count());
    }

    [Fact]
    public async Task Disabled_setting_skips_the_import()
    {
        Assert.Null(await Importer(enabled: false).ImportAsync());
        Assert.Equal(0, Count());
    }

    [Fact]
    public void Default_source_path_is_shipped_with_the_api_build()
    {
        // The test project references the API, so the API's copied content lands in this output folder too.
        var shipped = Path.GetFullPath(new DatabaseOptions().ReflectionsSourcePath, AppContext.BaseDirectory);

        Assert.True(File.Exists(shipped), $"Expected the build to ship {shipped}.");
    }

    private long Count()
    {
        using var connection = Open();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM MoodCombinationInterpretations;";
        return Convert.ToInt64(command.ExecuteScalar());
    }

    private SqliteConnection Open()
    {
        var connection = new SqliteConnection($"Data Source={_databasePath}");
        connection.Open();
        Execute(connection, "PRAGMA foreign_keys = ON;");
        return connection;
    }

    private static void Execute(SqliteConnection connection, string sql)
    {
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }

    public void Dispose()
    {
        SqliteConnection.ClearAllPools();
        if (File.Exists(_databasePath)) File.Delete(_databasePath);
    }

    private sealed class Factory(string path) : IDbConnectionFactory
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
