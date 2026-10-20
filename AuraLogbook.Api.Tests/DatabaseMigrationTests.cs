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
