using Microsoft.Data.Sqlite;

namespace AuraLogbook.Api.Tests;

/// <summary>Protects the database-backed mapping from each stable mood key to its approved illustration asset.</summary>
public sealed class MoodIllustrationMigrationTests
{
    private static readonly string[] MoodKeys =
    [
        "Empowered", "Centered", "Harmonious", "Flowing",
        "Weary", "Tense", "Frustrated", "Blocked",
        "Restless", "Disconnected", "Heavy", "Charged",
        "Scattered", "Abundant", "Visionary", "Neutral",
    ];

    [Fact]
    public void Migration_023_stores_the_approved_image_path_for_each_active_mood()
    {
        using var connection = MigrationTestDatabase.OpenAll();

        using var command = connection.CreateCommand();
        command.CommandText = "SELECT Icon FROM MoodDefinitions WHERE MoodKey = $key;";
        var keyParameter = command.Parameters.Add("$key", SqliteType.Text);
        foreach (var moodKey in MoodKeys)
        {
            keyParameter.Value = moodKey;
            Assert.Equal($"/mood-icons/{moodKey.ToLowerInvariant()}.png",
                command.ExecuteScalar()?.ToString());
        }
    }
}
