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
using System.Text.Json;

namespace AuraLogbook.Api.Tests;

/// <summary>Protects occurrence-time offsets, local-day buckets, legacy compatibility, and immutable creation timestamps.</summary>
public sealed class MoodOccurrenceTimeTests
{
    [Theory]
    [InlineData("1998-01-01T23:30:00-08:00", "1998-01-01")]
    [InlineData("1998-01-02T00:30:00+14:00", "1998-01-02")]
    public async Task Offset_and_local_day_round_trip_even_when_UTC_is_a_different_day(string timestamp, string date)
    {
        using var database = new TestDatabase();
        var request = JsonSerializer.Deserialize<MoodEntryRequest>($$"""{"date":"{{date}}","occurredAt":"{{timestamp}}","moods":["Centered"]}""", new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
        var before = DateTime.UtcNow;
        var created = await database.Service.CreateMoodAsync(7, request);
        Assert.True(created.Success, created.Message);
        var saved = (await database.Service.GetEntryForUserAsync(7, created.EntryId))!;
        Assert.Equal(request.Date, saved.Date);
        Assert.Equal(request.OccurredAt, saved.OccurredAt);
        Assert.Equal(request.OccurredAt!.Value.Offset, saved.OccurredAt!.Value.Offset);
        Assert.InRange(saved.CreatedAt, before, DateTime.UtcNow);
    }

    [Fact]
    public async Task Updating_occurrence_time_does_not_rewrite_creation_and_omission_preserves_it()
    {
        using var database = new TestDatabase();
        var request = new MoodEntryRequest { Date = new(1998, 1, 1), OccurredAt = DateTimeOffset.Parse("1998-01-01T08:30:00-05:00"), Moods = ["Centered"] };
        var created = await database.Service.CreateMoodAsync(7, request);
        var auditTime = (await database.Service.GetEntryForUserAsync(7, created.EntryId))!.CreatedAt;
        request.Date = new(1998, 1, 2);
        request.OccurredAt = DateTimeOffset.Parse("1998-01-02T17:45:00+05:30");
        Assert.True((await database.Service.UpdateMoodAsync(7, created.EntryId, request)).Success);
        var changed = (await database.Service.GetEntryForUserAsync(7, created.EntryId))!;
        Assert.Equal(request.OccurredAt, changed.OccurredAt);
        Assert.Equal(request.OccurredAt.Value.Offset, changed.OccurredAt!.Value.Offset);
        Assert.Equal(auditTime, changed.CreatedAt);
        request.OccurredAt = null;
        request.Comment = "Edited with an older client";
        Assert.True((await database.Service.UpdateMoodAsync(7, created.EntryId, request)).Success);
        var olderClientUpdate = (await database.Service.GetEntryForUserAsync(7, created.EntryId))!;
        Assert.Equal(changed.OccurredAt, olderClientUpdate.OccurredAt);
        Assert.Equal(auditTime, olderClientUpdate.CreatedAt);
    }

    /// <summary>Date-only clients move the saved clock and offset to the selected day without changing audit time.</summary>
    [Theory]
    [InlineData("1998-01-01T23:30:00-08:00", "1998-01-02T23:30:00-08:00")]
    [InlineData("1998-01-01T00:30:00+14:00", "1998-01-02T00:30:00+14:00")]
    public async Task Date_only_update_reconciles_occurrence_and_allows_later_editor_save(string original, string expected)
    {
        using var database = new TestDatabase();
        var created = await database.Service.CreateMoodAsync(7, new MoodEntryRequest { Date = new(1998, 1, 1), OccurredAt = DateTimeOffset.Parse(original), Moods = ["Centered"] });
        var audit = (await database.Service.GetEntryForUserAsync(7, created.EntryId))!.CreatedAt;
        var update = new MoodEntryRequest { Date = new(1998, 1, 2), Moods = ["Centered"] };
        Assert.True((await database.Service.UpdateMoodAsync(7, created.EntryId, update)).Success);
        var saved = (await database.Service.GetEntryForUserAsync(7, created.EntryId))!;
        Assert.Equal(DateTimeOffset.Parse(expected), saved.OccurredAt);
        Assert.Equal(DateTimeOffset.Parse(expected).Offset, saved.OccurredAt!.Value.Offset);
        Assert.Equal(saved.Date, DateOnly.FromDateTime(saved.OccurredAt.Value.DateTime));
        Assert.Equal(audit, saved.CreatedAt);
        update.OccurredAt = saved.OccurredAt;
        update.Comment = "Later editor save";
        Assert.True((await database.Service.UpdateMoodAsync(7, created.EntryId, update)).Success);
    }

    /// <summary>Reconciliation cannot bypass validation or partially mutate a persisted entry.</summary>
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Date_only_update_rejects_a_future_reconciled_time_without_changing_the_entry(bool outsideTimestampRange)
    {
        using var database = new TestDatabase();
        var created = await database.Service.CreateMoodAsync(7, new MoodEntryRequest { Date = new(1998, 1, 1), OccurredAt = DateTimeOffset.Parse("1998-01-01T23:30:00-08:00"), Moods = ["Centered"] });
        var result = await database.Service.UpdateMoodAsync(7, created.EntryId, new MoodEntryRequest { Date = outsideTimestampRange ? DateOnly.MaxValue : DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2)), Moods = ["Centered"] });
        Assert.False(result.Success);
        var saved = (await database.Service.GetEntryForUserAsync(7, created.EntryId))!;
        Assert.Equal(new DateOnly(1998, 1, 1), saved.Date);
        Assert.Equal(DateTimeOffset.Parse("1998-01-01T23:30:00-08:00"), saved.OccurredAt);
    }

    [Fact]
    public async Task Legacy_requests_and_rows_keep_null_occurrence_times()
    {
        using var database = new TestDatabase();
        var request = new MoodEntryRequest { Date = new(1998, 1, 1), Moods = ["Centered"] };
        var created = await database.Service.CreateMoodAsync(7, request);
        Assert.True(created.Success);
        Assert.Null((await database.Service.GetEntryForUserAsync(7, created.EntryId))!.OccurredAt);
        Assert.True((await database.Service.UpdateMoodAsync(7, created.EntryId, request)).Success);
        Assert.Null((await database.Service.GetEntryForUserAsync(7, created.EntryId))!.OccurredAt);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Future_instants_and_mismatched_local_dates_are_rejected_before_writes(bool future)
    {
        var repository = new Mock<IFileMoodRepository>();
        var service = new MoodService(repository.Object, new Mock<IReferenceDataValidator>().Object);
        var occurredAt = future ? DateTimeOffset.UtcNow.AddDays(1) : DateTimeOffset.Parse("1998-01-01T23:30:00-08:00");
        var request = new MoodEntryRequest { Date = future ? DateOnly.FromDateTime(occurredAt.DateTime) : new(1998, 1, 2), OccurredAt = occurredAt, Moods = ["Centered"] };
        Assert.False((await service.CreateMoodAsync(7, request)).Success);
        Assert.False((await service.UpdateMoodAsync(7, 1, request)).Success);
        repository.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task File_storage_preserves_occurrence_offsets_and_legacy_nulls()
    {
        var path = Path.Combine(Path.GetTempPath(), $"aura-occurrence-{Guid.NewGuid():N}.json");
        try
        {
            var repository = new FileMoodRepository(Options.Create(new StorageSettings { MoodFilePath = path }));
            var original = new MoodEntry { UserId = 7, Date = new(1998, 1, 1), OccurredAt = DateTimeOffset.Parse("1998-01-01T23:30:00-08:00"), Moods = ["Centered"] };
            var id = await repository.CreateAsync(original);
            var saved = (await new FileMoodRepository(Options.Create(new StorageSettings { MoodFilePath = path })).GetByIdAsync(id))!;
            Assert.Equal(original.OccurredAt, saved.OccurredAt);
            Assert.Equal(original.OccurredAt!.Value.Offset, saved.OccurredAt!.Value.Offset);
            var legacyId = await repository.CreateAsync(new MoodEntry { UserId = 7, Date = new(1998, 1, 1), Moods = ["Centered"] });
            Assert.Null((await repository.GetByIdAsync(legacyId))!.OccurredAt);
        }
        finally { File.Delete(path); }
    }

    /// <summary>Uses all additive migrations with an isolated SQLite file and real mood repository.</summary>
    private sealed class TestDatabase : IDisposable
    {
        private readonly string _path = Path.Combine(Path.GetTempPath(), $"aura-occurrence-{Guid.NewGuid():N}.db");
        public MoodService Service { get; }
        public TestDatabase()
        {
            using var source = MigrationTestDatabase.OpenAll();
            using var target = new SqliteConnection($"Data Source={_path};Pooling=False");
            target.Open();
            source.BackupDatabase(target);
            target.Execute("INSERT INTO Users (Id,Email,PasswordHash,CreatedAt,UpdatedAt) VALUES (7,'sample@example.com','test','now','now')");
            var factory = new SqliteConnectionFactory(Options.Create(new DatabaseOptions { ConnectionString = $"Data Source={_path};Pooling=False" }));
            Service = new MoodService(new SqliteMoodRepository(factory), new TestReferenceDataValidator());
        }
        public void Dispose() => File.Delete(_path);
    }
}
