using Microsoft.Data.Sqlite;

namespace AuraLogbook.Api.Tests;

public sealed class WeatherSnapshotMigrationTests
{
    [Fact]
    public void Weather_snapshot_is_optional_and_can_be_linked_to_a_mood_entry()
    {
        using var connection = MigrationTestDatabase.Open("001_initial_schema.sql", "006_weather_snapshots.sql");
        MigrationTestDatabase.Execute(connection, "INSERT INTO Users (Id, Email, PasswordHash, CreatedAt, UpdatedAt) VALUES (1,'weather@example.com','hash','now','now');");

        MigrationTestDatabase.Execute(connection, "INSERT INTO MoodEntries (Id, UserId, EntryDate, CreatedAt, UpdatedAt) VALUES (1,1,'2026-10-19','now','now');");
        Assert.Null(MigrationTestDatabase.Scalar(connection, "SELECT WeatherSnapshotId FROM MoodEntries WHERE Id = 1;"));

        MigrationTestDatabase.Execute(connection, "INSERT INTO WeatherSnapshots (Id, Location, ObservedAt, Condition, Temperature, TemperatureUnit) VALUES (5,'Atlanta, GA, US','2026-10-19T12:00:00Z','Clear',72.5,'F');");
        MigrationTestDatabase.Execute(connection, "UPDATE MoodEntries SET WeatherSnapshotId = 5 WHERE Id = 1;");
        Assert.Equal(5L, MigrationTestDatabase.Scalar(connection, "SELECT WeatherSnapshotId FROM MoodEntries WHERE Id = 1;"));
        Assert.Equal("Atlanta, GA, US", MigrationTestDatabase.Scalar(connection, "SELECT Location FROM WeatherSnapshots WHERE Id = 5;"));

        MigrationTestDatabase.Execute(connection, "DELETE FROM WeatherSnapshots WHERE Id = 5;");
        Assert.Null(MigrationTestDatabase.Scalar(connection, "SELECT WeatherSnapshotId FROM MoodEntries WHERE Id = 1;"));
    }

    [Fact]
    public void Weather_snapshot_requires_location_observation_condition_and_temperature_unit()
    {
        using var connection = MigrationTestDatabase.Open("001_initial_schema.sql", "006_weather_snapshots.sql");

        Assert.Throws<SqliteException>(() => MigrationTestDatabase.Execute(connection,
            "INSERT INTO WeatherSnapshots (Location, ObservedAt, Condition, Temperature, TemperatureUnit) VALUES ('Atlanta','2026-10-19T12:00:00Z','Clear',72.5,'K');"));
    }
}
