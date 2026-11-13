using System.Text.Json;
using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services.PathwayActivities;
using Microsoft.Data.Sqlite;

namespace AuraLogbook.Api.Tests;

/// <summary>#389: typed validation and owner scoping for shared pathway activity records.</summary>
public sealed class PathwayActivityTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(Path.GetTempPath(), $"aura-pathway-activities-{Guid.NewGuid():N}.sqlite");
    private readonly PathwayActivityService _service;

    public PathwayActivityTests()
    {
        using (var connection = new SqliteConnection($"Data Source={_databasePath}"))
        {
            connection.Open();
            MigrationTestDatabase.Execute(connection, "PRAGMA foreign_keys = ON;");
            var migrations = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "AuraLogbook.Api", "Data", "Database", "Migrations"));
            foreach (var path in Directory.EnumerateFiles(migrations, "*.sql").OrderBy(p => p, StringComparer.Ordinal))
                MigrationTestDatabase.Execute(connection, File.ReadAllText(path));
            MigrationTestDatabase.Execute(connection, """
                INSERT INTO Users (Id, Email, PasswordHash, AuraColor, AuraIntensity, SelectedPathway, CreatedAt, UpdatedAt) VALUES
                  (1, 'owner@example.test', 'h', 'blue', 50, 0, '2026-01-01', '2026-01-01'),
                  (2, 'other@example.test', 'h', 'blue', 50, 0, '2026-01-01', '2026-01-01');
                """);
        }
        _service = new PathwayActivityService(new SqlitePathwayActivityRepository(new FileFactory(_databasePath)));
    }

    private static PathwayActivityRequest Request(string pathway, string module, string type, string content) => new()
    {
        Pathway = pathway, ModuleKey = module, ActivityType = type, OccurredOn = new DateOnly(2026, 11, 12),
        Content = JsonDocument.Parse(content).RootElement.Clone(),
    };

    private static PathwayActivityRequest Practice(string content = """{"practice":"Observe","durationMinutes":5,"note":"calm"}""") =>
        Request("mindfulness", "practice-log", "mindful-practice", content);

    [Fact]
    public async Task Saves_and_reads_back_a_mindful_practice_with_its_pathway_context()
    {
        var created = await _service.CreateAsync(1, Practice());

        Assert.True(created.Success, created.Message);
        var stored = await _service.GetByIdAsync(1, created.Activity!.Id);
        Assert.NotNull(stored);
        Assert.Equal(("mindfulness", "practice-log", "mindful-practice"), (stored.Pathway, stored.ModuleKey, stored.ActivityType));
        Assert.Equal("Observe", stored.Content.GetProperty("practice").GetString());
        Assert.Equal(DateTimeKind.Utc, stored.CreatedAt.Kind);
    }

    [Fact]
    public async Task Records_are_scoped_to_their_owner()
    {
        var created = await _service.CreateAsync(1, Practice());

        Assert.Null(await _service.GetByIdAsync(2, created.Activity!.Id));
        Assert.Empty(await _service.GetByUserAsync(2, null, null, null));
        Assert.False(await _service.DeleteAsync(2, created.Activity.Id));
        Assert.False((await _service.UpdateAsync(2, created.Activity.Id, Practice())).Success);
        Assert.Single(await _service.GetByUserAsync(1, "mindfulness", null, null));
    }

    [Theory]
    [InlineData("energy", "practice-log", "mindful-practice", """{"practice":"Observe"}""")]                // module from another pathway
    [InlineData("mindfulness", "unknown-module", "mindful-practice", """{"practice":"Observe"}""")]        // unknown module
    [InlineData("mindfulness", "practice-log", "streak", """{"practice":"Observe"}""")]                   // unknown activity type
    [InlineData("mindfulness", "practice-log", "mindful-practice", """{"practice":"Observe","extra":1}""")] // unexpected field
    [InlineData("mindfulness", "practice-log", "mindful-practice", """{"practice":"Observe","durationMinutes":0}""")]
    [InlineData("mindfulness", "practice-log", "mindful-practice", """["not","an","object"]""")]
    [InlineData("faith", "faith-practice-check-in", "faith-practice-check-in", """{"practices":{"astrology":true}}""")]
    [InlineData("energy", "daily-astrology", "insight-feedback", """{"insightType":"faith-practice","response":"maybe"}""")]
    [InlineData("energy", "daily-astrology", "insight-feedback", """{"insightType":"horoscope","response":"love it"}""")]
    public async Task Rejects_malformed_or_mismatched_payloads(string pathway, string module, string type, string content)
    {
        var result = await _service.CreateAsync(1, Request(pathway, module, type, content));

        Assert.False(result.Success);
        Assert.Empty(await _service.GetByUserAsync(1, null, null, null));
    }

    [Fact]
    public async Task Accepts_faith_check_in_and_insight_feedback()
    {
        Assert.True((await _service.CreateAsync(1, Request("faith", "faith-practice-check-in", "faith-practice-check-in",
            """{"practices":{"prayer":true,"gratitude":false},"note":"short"}"""))).Success);
        Assert.True((await _service.CreateAsync(1, Request("energy", "daily-astrology", "insight-feedback",
            """{"insightType":"horoscope","response":"not-for-me"}"""))).Success);

        Assert.Single(await _service.GetByUserAsync(1, null, null, "insight-feedback"));
    }

    [Fact]
    public async Task Deleting_the_account_deletes_its_activities()
    {
        await _service.CreateAsync(1, Practice());
        using (var connection = new FileFactory(_databasePath).CreateConnection())
            MigrationTestDatabase.Execute(connection, "DELETE FROM Users WHERE Id = 1;");

        Assert.Empty(await _service.GetByUserAsync(1, null, null, null));
    }

    public void Dispose()
    {
        SqliteConnection.ClearAllPools();
        if (File.Exists(_databasePath)) File.Delete(_databasePath);
    }

    private sealed class FileFactory(string path) : IDbConnectionFactory
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
