using Microsoft.Data.Sqlite;

namespace AuraLogbook.Api.Tests;

public sealed class WeeklyAuraSummaryMigrationTests
{
    [Fact]
    public void Complete_migration_chain_creates_weather_and_weekly_summary_tables()
    {
        using var connection = MigrationTestDatabase.OpenAll();

        Assert.Equal(1L, MigrationTestDatabase.Scalar(connection,
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'WeatherSnapshots';"));
        Assert.Equal(1L, MigrationTestDatabase.Scalar(connection,
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'WeeklyAuraSummaries';"));
        Assert.Equal(1L, MigrationTestDatabase.Scalar(connection,
            "SELECT COUNT(*) FROM pragma_table_info('MoodEntries') WHERE name = 'WeatherSnapshotId';"));
    }

    [Fact]
    public void Weekly_summary_enforces_unique_user_week_and_valid_references()
    {
        using var connection = MigrationTestDatabase.Open("001_initial_schema.sql", "007_weekly_aura_summaries.sql");
        MigrationTestDatabase.Execute(connection, "INSERT INTO ChakraDefinitions (ChakraKey, DisplayName, Description) VALUES ('throat','Throat','Expression.');");
        MigrationTestDatabase.Execute(connection, "INSERT INTO AuraColorDefinitions (AuraColorKey, DisplayName, ChakraKey, Description) VALUES ('blue','Blue','throat','Clear communication.');");
        MigrationTestDatabase.Execute(connection, "INSERT INTO Users (Id, Email, PasswordHash, CreatedAt, UpdatedAt) VALUES (1,'summary@example.com','hash','now','now');");

        MigrationTestDatabase.Execute(connection, "INSERT INTO WeeklyAuraSummaries (UserId, WeekStartDate, WeekEndDate, EntryCount, DominantAuraColorKey, DominantChakraKey, AverageAuraIntensity, ReflectiveSummary, GeneratedAt) VALUES (1,'2026-10-12','2026-10-18',4,'blue','throat',62.5,'A week of clear expression.','2026-10-19T12:00:00Z');");
        Assert.Equal(1L, MigrationTestDatabase.Scalar(connection, "SELECT COUNT(*) FROM WeeklyAuraSummaries WHERE UserId = 1 AND WeekStartDate = '2026-10-12' AND DominantAuraColorKey = 'blue' AND DominantChakraKey = 'throat';"));

        Assert.Throws<SqliteException>(() => MigrationTestDatabase.Execute(connection,
            "INSERT INTO WeeklyAuraSummaries (UserId, WeekStartDate, WeekEndDate, EntryCount) VALUES (1,'2026-10-12','2026-10-18',2);"));
        Assert.Throws<SqliteException>(() => MigrationTestDatabase.Execute(connection,
            "INSERT INTO WeeklyAuraSummaries (UserId, WeekStartDate, WeekEndDate, EntryCount, DominantAuraColorKey) VALUES (1,'2026-10-19','2026-10-25',1,'unknown');"));
        Assert.Throws<SqliteException>(() => MigrationTestDatabase.Execute(connection,
            "INSERT INTO WeeklyAuraSummaries (UserId, WeekStartDate, WeekEndDate, EntryCount) VALUES (1,'2026-10-26','2026-10-25',1);"));
        Assert.Throws<SqliteException>(() => MigrationTestDatabase.Execute(connection,
            "INSERT INTO WeeklyAuraSummaries (UserId, WeekStartDate, WeekEndDate, EntryCount, AverageAuraIntensity) VALUES (1,'2026-10-19','2026-10-25',1,101);"));

        MigrationTestDatabase.Execute(connection, "DELETE FROM Users WHERE Id = 1;");
        Assert.Equal(0L, MigrationTestDatabase.Scalar(connection, "SELECT COUNT(*) FROM WeeklyAuraSummaries;"));
    }
}
