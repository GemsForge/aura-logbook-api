using AuraLogbook.Api.Data.Database;
using Microsoft.Data.Sqlite;

namespace AuraLogbook.Api.Tests;

public sealed class DatabaseMigrationTests
{
    [Fact]
    public void Initial_migration_creates_required_tables_and_can_be_reapplied()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        using var pragma = connection.CreateCommand();
        pragma.CommandText = "PRAGMA foreign_keys = ON;";
        pragma.ExecuteNonQuery();

        var migration = File.ReadAllText(Path.Combine(
            AppContext.BaseDirectory, "..", "..", "..", "..", "AuraLogbook.Api", "Data", "Database", "Migrations", "001_initial_schema.sql"));

        Execute(connection, migration);
        Execute(connection, migration);

        using var tables = connection.CreateCommand();
        tables.CommandText = "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('Users', 'MoodEntries', 'MoodEntryMoods', 'AuraColorDefinitions', 'ChakraDefinitions', 'SpiritualPathways', 'ZodiacSigns', 'InsightTemplates');";
        var names = new HashSet<string>(StringComparer.Ordinal);
        using var reader = tables.ExecuteReader();
        while (reader.Read())
            names.Add(reader.GetString(0));

        Assert.Equal(8, names.Count);
        Assert.Contains("Users", names);
        Assert.Contains("MoodEntries", names);
        Assert.Contains("MoodEntryMoods", names);
        Assert.Contains("AuraColorDefinitions", names);
        Assert.Contains("ChakraDefinitions", names);
        Assert.Contains("SpiritualPathways", names);
        Assert.Contains("ZodiacSigns", names);
        Assert.Contains("InsightTemplates", names);

        using var foreignKeys = connection.CreateCommand();
        foreignKeys.CommandText = "PRAGMA foreign_keys;";
        Assert.Equal(1L, foreignKeys.ExecuteScalar());
    }

    [Fact]
    public void Reference_constraints_reject_duplicate_insight_types()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        foreach (var file in Directory.EnumerateFiles(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "AuraLogbook.Api", "Data", "Database", "Migrations"), "*.sql").OrderBy(x => x))
            Execute(connection, File.ReadAllText(file));

        Execute(connection, "INSERT INTO InsightTemplates (ZodiacSignKey, InsightType, Title, Message) VALUES ('aries','boldAction','First','One.');");
        Assert.Throws<SqliteException>(() => Execute(connection, "INSERT INTO InsightTemplates (ZodiacSignKey, InsightType, Title, Message) VALUES ('aries','boldAction','Duplicate','Two.');"));
    }

    [Fact]
    public void User_reference_foreign_keys_reject_unknown_reference_values()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        Execute(connection, "PRAGMA foreign_keys = ON;");
        foreach (var file in Directory.EnumerateFiles(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "AuraLogbook.Api", "Data", "Database", "Migrations"), "*.sql").OrderBy(x => x))
            Execute(connection, File.ReadAllText(file));

        Assert.Throws<SqliteException>(() => Execute(connection, "INSERT INTO Users (Email, PasswordHash, AuraColor, SelectedPathway, CreatedAt, UpdatedAt) VALUES ('invalid@example.com','hash','not-a-color',0,'now','now');"));
    }

    /// <summary>#410: migration 035 stores only a bounded anchor digest and allows bookmarks without one.</summary>
    [Fact]
    public void Sacred_text_annotation_migration_adds_anchor_hash_and_enforces_its_length()
    {
        using var connection = MigrationTestDatabase.OpenAll();
        MigrationTestDatabase.Execute(connection, "INSERT INTO Users (Email, PasswordHash, CreatedAt, UpdatedAt) VALUES ('reader@example.test','hash','now','now');");
        Assert.Throws<SqliteException>(() => MigrationTestDatabase.Execute(connection, """
            INSERT INTO SacredTextAnnotations (UserId, Framework, SectionReference, SourceVersion, Language, Kind, StartOffset, EndOffset, AnchorHash, CreatedAt, UpdatedAt)
            VALUES (1, 'christian', 'Genesis 1', 'v1', 'en', 'highlight', 0, 1, 'short', 'now', 'now');
            """));
        MigrationTestDatabase.Execute(connection, """
            INSERT INTO SacredTextAnnotations (UserId, Framework, SectionReference, SourceVersion, Language, Kind, StartOffset, EndOffset, CreatedAt, UpdatedAt)
            VALUES (1, 'christian', 'Genesis 1', 'v1', 'en', 'bookmark', 0, 0, 'now', 'now');
            """);

        using var command = connection.CreateCommand();
        command.CommandText = "SELECT AnchorHash FROM SacredTextAnnotations WHERE Kind = 'bookmark';";
        Assert.Null(command.ExecuteScalar());
    }

    [Fact]
    public void Aura_reference_data_contains_the_supported_color_hex_values()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        foreach (var file in Directory.EnumerateFiles(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "AuraLogbook.Api", "Data", "Database", "Migrations"), "*.sql").OrderBy(x => x))
            Execute(connection, File.ReadAllText(file));

        using var command = connection.CreateCommand();
        command.CommandText = "SELECT AuraColorKey, BaseHex FROM AuraColorDefinitions WHERE IsActive = 1 ORDER BY AuraColorKey;";
        var actual = new Dictionary<string, string>(StringComparer.Ordinal);
        using var reader = command.ExecuteReader();
        while (reader.Read())
            actual.Add(reader.GetString(0), reader.GetString(1));

        var expected = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["blue"] = "#2196f3",
            ["gray"] = "#9e9e9e",
            ["green"] = "#4caf50",
            ["indigo"] = "#3f51b5",
            ["orange"] = "#ff9800",
            ["pink"] = "#e91e63",
            ["red"] = "#f44336",
            ["violet"] = "#9c27b0",
            ["yellow"] = "#fbc02d",
        };

        Assert.Equal(expected, actual);
    }

    private static void Execute(SqliteConnection connection, string sql)
    {
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }
}
