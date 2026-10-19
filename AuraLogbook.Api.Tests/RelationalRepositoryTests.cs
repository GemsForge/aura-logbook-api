using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.FileProviders;

namespace AuraLogbook.Api.Tests;

public sealed class RelationalRepositoryTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(Path.GetTempPath(), $"aura-test-{Guid.NewGuid():N}.db");
    private readonly SqliteConnectionFactory _factory;

    public RelationalRepositoryTests()
    {
        var connection = new SqliteConnection($"Data Source={_databasePath}");
        connection.Open();
        var migration = File.ReadAllText(Path.Combine("..", "..", "..", "..", "AuraLogbook.Api", "Data", "Database", "Migrations", "001_initial_schema.sql"));
        using var command = connection.CreateCommand();
        command.CommandText = migration;
        command.ExecuteNonQuery();
        connection.Dispose();
        _factory = new SqliteConnectionFactory(new TestOptions<DatabaseOptions>(new DatabaseOptions { ConnectionString = $"Data Source={_databasePath}" }));
        SeedReferenceData();
    }

    [Fact]
    public async Task User_repository_reads_seeded_user()
    {
        var repository = new SqliteUserRepository(_factory);
        var user = await repository.GetByEmailAsync("test@example.com");
        Assert.NotNull(user);
        Assert.Equal(7, user.Id);
        Assert.Equal("Test User", user.DisplayName);
    }

    [Fact]
    public async Task User_repository_persists_birthday_as_iso_date_for_create_and_update()
    {
        var repository = new SqliteUserRepository(_factory);
        var birthday = new DateOnly(1994, 9, 12);
        var user = new User
        {
            Email = "date-only@example.com",
            PasswordHash = "hash",
            DisplayName = "Date Only",
            Birthday = birthday,
            ZodiacSign = "Virgo",
            AuraColor = "green",
            AuraIntensity = 50,
        };

        user.Id = await repository.CreateAsync(user);

        Assert.Equal(birthday, (await repository.GetByIdAsync(user.Id))?.Birthday);
        Assert.Equal("1994-09-12", GetStoredBirthday(user.Id));

        user.Birthday = new DateOnly(2001, 2, 3);
        Assert.True(await repository.UpdateAsync(user));

        Assert.Equal(user.Birthday, (await repository.GetByIdAsync(user.Id))?.Birthday);
        Assert.Equal("2001-02-03", GetStoredBirthday(user.Id));
    }

    [Fact]
    public async Task User_service_registers_authenticates_and_updates_birthday_with_sqlite_repository()
    {
        var repository = new SqliteUserRepository(_factory);
        var service = new UserService(repository);
        var registration = new RegisterUserRequest
        {
            Email = "registration-date@example.com",
            Password = "StrongPassword123!",
            DisplayName = "Date Test",
            Birthday = new DateOnly(1994, 9, 12),
            AuraColor = "green",
            AuraIntensity = 50,
        };

        var registered = await service.RegisterAsync(registration);

        Assert.True(registered.Success);
        var user = await service.GetByEmailAsync(registration.Email);
        Assert.NotNull(user);
        Assert.Equal(registration.Birthday, user.Birthday);
        Assert.Equal("Virgo", user.ZodiacSign);
        Assert.Equal("virgo", GetStoredZodiacSign(user.Id));
        Assert.True(await service.AuthenticateAsync(registration.Email, registration.Password));

        var updatedBirthday = new DateOnly(2001, 2, 3);
        var updated = await service.UpdateUserAsync(new UpdateUserRequest
        {
            Id = user.Id,
            Email = user.Email,
            Birthday = updatedBirthday,
            DisplayName = user.DisplayName,
            AuraColor = user.AuraColor,
            AuraIntensity = user.AuraIntensity,
            SelectedPathway = user.SelectedPathway,
        });

        Assert.True(updated.Success);
        Assert.Equal(updatedBirthday, (await service.GetByIdAsync(user.Id))?.Birthday);
        Assert.Equal("2001-02-03", GetStoredBirthday(user.Id));
    }

    private string? GetStoredBirthday(int userId)
    {
        using var connection = _factory.CreateConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT Birthday FROM Users WHERE Id = @id";
        command.Parameters.AddWithValue("@id", userId);
        return command.ExecuteScalar() as string;
    }

    private string? GetStoredZodiacSign(int userId)
    {
        using var connection = _factory.CreateConnection();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT ZodiacSign FROM Users WHERE Id = @id";
        command.Parameters.AddWithValue("@id", userId);
        return command.ExecuteScalar() as string;
    }

    [Fact]
    public async Task Mood_repository_persists_and_reads_mood_pairs()
    {
        var repository = new SqliteMoodRepository(_factory);
        var id = await repository.CreateAsync(new MoodEntry { UserId = 7, Date = new DateOnly(2026, 10, 19), Moods = [MoodType.Centered, MoodType.Harmonious], Comment = "Integration test" });
        var entry = await repository.GetByIdAsync(id);
        Assert.NotNull(entry);
        Assert.Equal(2, entry.Moods.Count);
        Assert.Contains(MoodType.Centered, entry.Moods);
        Assert.Contains(MoodType.Harmonious, entry.Moods);
    }

    [Fact]
    public async Task Mood_repository_isolates_entries_by_user_and_supports_crud()
    {
        var repository = new SqliteMoodRepository(_factory);
        var ownId = await repository.CreateAsync(new MoodEntry { UserId = 7, Date = new DateOnly(2026, 10, 18), Moods = [MoodType.Centered] });
        await repository.CreateAsync(new MoodEntry { UserId = 8, Date = new DateOnly(2026, 10, 18), Moods = [MoodType.Weary] });

        var ownEntries = await repository.GetAllByUserAsync(7);
        Assert.Single(ownEntries);
        Assert.Equal(ownId, ownEntries[0].Id);

        var updated = ownEntries[0];
        updated.Comment = "Updated";
        updated.Moods = [MoodType.Harmonious];
        Assert.True(await repository.UpdateAsync(updated));

        var changed = await repository.GetByIdAsync(ownId);
        Assert.Equal("Updated", changed?.Comment);
        Assert.Equal([MoodType.Harmonious], changed?.Moods);
        Assert.True(await repository.DeleteAsync(ownId));
        Assert.Null(await repository.GetByIdAsync(ownId));
    }

    [Fact]
    public async Task Zodiac_repository_reads_seeded_insight()
    {
        using var command = _factory.CreateConnection().CreateCommand();
        command.CommandText = "INSERT INTO ZodiacSigns (SignKey, Description, Element) VALUES ('aries','Bold','fire'); INSERT INTO InsightTemplates (ZodiacSignKey, InsightType, Title, Message) VALUES ('aries','BoldAction','Act','Take a step.');";
        command.ExecuteNonQuery();
        var repository = new SqliteZodiacInsightsRepository(_factory);
        var zodiac = await repository.GetBySignAsync("aries");
        Assert.NotNull(zodiac);
        Assert.Single(zodiac.Insights);
        Assert.Equal("Take a step.", zodiac.Insights[0].Message);
    }

    private void SeedReferenceData()
    {
        using var connection = _factory.CreateConnection();
        connection.ExecuteNonQuery("INSERT INTO Users (Id,Email,PasswordHash,DisplayName,AuraColor,AuraIntensity,SelectedPathway,CreatedAt,UpdatedAt) VALUES (7,'test@example.com','hash','Test User','blue',50,0,'2026-10-19T00:00:00Z','2026-10-19T00:00:00Z'),(8,'other@example.com','hash','Other User','red',50,0,'2026-10-19T00:00:00Z','2026-10-19T00:00:00Z'); INSERT INTO MoodDefinitions (MoodKey,DisplayName) VALUES ('Centered','Centered'),('Harmonious','Harmonious'),('Weary','Weary');");
    }

    public void Dispose()
    {
        if (File.Exists(_databasePath)) File.Delete(_databasePath);
    }

    private sealed class TestOptions<T>(T value) : Microsoft.Extensions.Options.IOptions<T> where T : class
    {
        public T Value { get; } = value;
    }
}

file static class SqliteTestExtensions
{
    public static void ExecuteNonQuery(this SqliteConnection connection, string sql)
    {
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }
}
