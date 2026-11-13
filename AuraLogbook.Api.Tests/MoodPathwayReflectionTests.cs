using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services;
using AuraLogbook.Api.Services.ReferenceData;
using Dapper;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;
using Moq;

namespace AuraLogbook.Api.Tests;

/// <summary>Protects atomic, private mood/reflection persistence and compatibility with older clients.</summary>
public sealed class MoodPathwayReflectionTests
{
    private static readonly MoodPathwayReflection Reflection = new("chakra:root:2026-11-13:3", "energy", "chakra-mood-pattern", "Would grounding feel meaningful today?", "resonates");

    [Fact]
    public async Task Reflection_round_trips_and_updates_with_its_mood_while_omitted_updates_preserve_it()
    {
        using var database = new TestDatabase();
        var service = database.Service;
        var created = await service.CreateMoodAsync(7, new MoodEntryRequest { Date = new(2026, 11, 13), Moods = ["Centered"], PathwayReflection = Reflection });
        Assert.True(created.Success);
        Assert.Equal(Reflection, (await service.GetEntryForUserAsync(7, created.EntryId))!.PathwayReflection);

        var update = new MoodEntryRequest { Date = new(2026, 11, 13), Moods = ["Centered"], PathwayReflection = Reflection with { Response = "maybe" } };
        Assert.True((await service.UpdateMoodAsync(7, created.EntryId, update)).Success);
        Assert.Equal("maybe", (await service.GetEntryForUserAsync(7, created.EntryId))!.PathwayReflection!.Response);
        update.PathwayReflection = null;
        update.Comment = "Edited note";
        Assert.True((await service.UpdateMoodAsync(7, created.EntryId, update)).Success);
        Assert.Equal("maybe", (await service.GetEntryForUserAsync(7, created.EntryId))!.PathwayReflection!.Response);
    }

    [Fact]
    public async Task Reflection_inherits_mood_ownership_and_is_removed_with_the_entry()
    {
        using var database = new TestDatabase();
        var created = await database.Service.CreateMoodAsync(7, new MoodEntryRequest { Date = new(2026, 11, 13), Moods = ["Centered"], PathwayReflection = Reflection });
        Assert.Null(await database.Service.GetEntryForUserAsync(8, created.EntryId));
        Assert.False((await database.Service.UpdateMoodAsync(8, created.EntryId, new MoodEntryRequest { Moods = ["Centered"], PathwayReflection = Reflection })).Success);
        Assert.True((await database.Service.DeleteMoodAsync(7, created.EntryId)).Success);
        Assert.Null(await database.Service.GetEntryForUserAsync(7, created.EntryId));
    }

    [Fact]
    public async Task Unanswered_entries_remain_valid_and_have_no_inferred_reflection()
    {
        using var database = new TestDatabase();
        var created = await database.Service.CreateMoodAsync(7, new MoodEntryRequest { Date = new(2026, 11, 13), Moods = ["Centered"] });
        Assert.True(created.Success);
        Assert.Null((await database.Service.GetEntryForUserAsync(7, created.EntryId))!.PathwayReflection);
    }

    [Theory]
    [InlineData("yes", "energy", "chakra-mood-pattern")]
    [InlineData("resonates", "other", "chakra-mood-pattern")]
    [InlineData("resonates", "energy", "diagnosis")]
    public async Task Unsupported_responses_are_rejected_before_any_write(string response, string pathway, string type)
    {
        var repo = new Mock<IFileMoodRepository>();
        var validator = new Mock<IReferenceDataValidator>();
        var service = new MoodService(repo.Object, validator.Object);
        var result = await service.CreateMoodAsync(7, new MoodEntryRequest { Moods = ["Centered"], PathwayReflection = Reflection with { Response = response, Pathway = pathway, InsightType = type } });
        Assert.False(result.Success);
        repo.VerifyNoOtherCalls();
    }

    /// <summary>Exercises the real repository and complete migrations against an isolated disposable SQLite file.</summary>
    private sealed class TestDatabase : IDisposable
    {
        private readonly string _path = Path.Combine(Path.GetTempPath(), $"aura-reflection-{Guid.NewGuid():N}.db");
        public MoodService Service { get; }

        public TestDatabase()
        {
            using var source = MigrationTestDatabase.OpenAll();
            using var target = new SqliteConnection($"Data Source={_path};Pooling=False");
            target.Open();
            source.BackupDatabase(target);
            target.Execute("INSERT INTO Users (Id,Email,PasswordHash,CreatedAt,UpdatedAt) VALUES (7,'sample@example.com','test','now','now')");
            var factory = new SqliteConnectionFactory(Options.Create(new DatabaseOptions { ConnectionString = $"Data Source={_path};Pooling=False" }));
            var validator = new Mock<IReferenceDataValidator>();
            validator.Setup(v => v.AreActiveMoodsAsync(It.IsAny<IEnumerable<string>>())).ReturnsAsync(true);
            Service = new MoodService(new SqliteMoodRepository(factory), validator.Object);
        }

        public void Dispose() => File.Delete(_path);
    }
}
