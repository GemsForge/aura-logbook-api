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
        using var command = connection.CreateCommand();
        foreach (var migration in Directory.EnumerateFiles(Path.Combine("..", "..", "..", "..", "AuraLogbook.Api", "Data", "Database", "Migrations"), "*.sql").OrderBy(x => x))
        {
            command.CommandText = File.ReadAllText(migration);
            command.ExecuteNonQuery();
        }
        connection.Dispose();
        _factory = new SqliteConnectionFactory(new TestOptions<DatabaseOptions>(new DatabaseOptions { ConnectionString = $"Data Source={_databasePath}" }));
        SeedReferenceData();
    }

    /// <summary>
    /// #327: seeded users must still authenticate after <c>[JsonIgnore]</c> was added to
    /// <see cref="User.PasswordHash"/>, because the seeder reads its own record type.
    /// </summary>
    [Fact]
    public async Task Json_seeded_user_can_log_in_through_sqlite()
    {
        var contentRoot = Path.Combine(Path.GetTempPath(), $"aura-seed-{Guid.NewGuid():N}");
        Directory.CreateDirectory(Path.Combine(contentRoot, "Data"));
        try
        {
            var hash = BCrypt.Net.BCrypt.HashPassword("SeededPass1");
            await File.WriteAllTextAsync(Path.Combine(contentRoot, "Data", "users.json"), System.Text.Json.JsonSerializer.Serialize(new[]
            {
                new { Id = 500, Email = "seeded@example.test", PasswordHash = hash, AuraColor = "blue", AuraIntensity = 50, SelectedPathway = 0, CreatedAt = "2026-11-10T00:00:00Z", UpdatedAt = "2026-11-10T00:00:00Z" },
            }));
            var environment = new Moq.Mock<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();
            environment.SetupGet(e => e.ContentRootPath).Returns(contentRoot);

            await new AuraLogbook.Api.Data.Database.JsonUserSeeder(_factory, environment.Object, Microsoft.Extensions.Logging.Abstractions.NullLogger<AuraLogbook.Api.Data.Database.JsonUserSeeder>.Instance).SeedUsersAsync();

            var service = new UserService(new SqliteUserRepository(_factory));
            Assert.True(await service.AuthenticateAsync("seeded@example.test", "SeededPass1"));
        }
        finally
        {
            Directory.Delete(contentRoot, recursive: true);
        }
    }

    [Fact]
    public async Task User_repository_reads_seeded_user()
    {
        var repository = new SqliteUserRepository(_factory);
        var user = await repository.GetByEmailAsync("test@example.com");
        Assert.NotNull(user);
        Assert.Equal(7, user.Id);
        Assert.Equal("Test User", user.DisplayName);
        Assert.Equal("blue", user.AuraColor);
        Assert.Equal(50, user.AuraIntensity);
        Assert.Equal(InterfaceThemeValues.Aurora, user.InterfaceTheme);
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
        };

        var registered = await service.RegisterAsync(registration);

        Assert.True(registered.Success);
        var user = await service.GetByEmailAsync(registration.Email);
        Assert.NotNull(user);
        Assert.Equal(registration.Birthday, user.Birthday);
        Assert.Equal("Virgo", user.ZodiacSign);
        // #341: the aura is derived, not chosen at registration, so it starts at defaults.
        Assert.Equal("blue", user.AuraColor);
        Assert.Equal(50, user.AuraIntensity);
        Assert.Equal(InterfaceThemeValues.Aurora, user.InterfaceTheme);
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
            InterfaceTheme = "Midnight",
        });

        Assert.True(updated.Success);
        Assert.Equal(updatedBirthday, (await service.GetByIdAsync(user.Id))?.Birthday);
        Assert.Equal("2001-02-03", GetStoredBirthday(user.Id));
        Assert.Equal("Midnight", (await service.GetByIdAsync(user.Id))?.InterfaceTheme);

        // #331: a typed weather city and unit round-trip through SQLite; new users start Off.
        Assert.Equal(WeatherLocationValues.Off, user.WeatherLocationMode);
        var withCity = await service.UpdateUserAsync(new UpdateUserRequest
        {
            Id = user.Id, Email = user.Email, Birthday = updatedBirthday, DisplayName = user.DisplayName,
            AuraColor = user.AuraColor, AuraIntensity = user.AuraIntensity, SelectedPathway = user.SelectedPathway,
            WeatherLocationMode = "City", WeatherCity = "Lisbon", WeatherCountry = "pt", TemperatureUnit = "C",
        });
        Assert.True(withCity.Success);
        var saved = await service.GetByIdAsync(user.Id);
        Assert.Equal(("City", "Lisbon", "PT", "C"), (saved?.WeatherLocationMode, saved?.WeatherCity, saved?.WeatherCountry, saved?.TemperatureUnit));
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
    public async Task Mood_service_returns_the_created_entry_id_for_private_media_uploads()
    {
        var repository = new SqliteMoodRepository(_factory);
        var service = new MoodService(repository);
        var created = await service.CreateMoodAsync(7, new MoodEntryRequest
        {
            Date = new DateOnly(2026, 11, 10),
            Moods = [MoodType.Centered],
            Comment = "Photo flow test",
        });

        Assert.True(created.Success);
        Assert.True(created.EntryId > 0);
        var savedEntry = await service.GetEntryForUserAsync(7, created.EntryId);
        Assert.NotNull(savedEntry);
        Assert.Equal("Photo flow test", savedEntry.Comment);
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
        command.CommandText = "INSERT INTO InsightTemplates (ZodiacSignKey, InsightType, Title, Message) VALUES ('aries','BoldAction','Act','Take a step.');";
        command.ExecuteNonQuery();
        var repository = new SqliteZodiacInsightsRepository(_factory);
        var zodiac = await repository.GetBySignAsync("aries");
        Assert.NotNull(zodiac);
        Assert.Single(zodiac.Insights);
        Assert.Equal("Take a step.", zodiac.Insights[0].Message);
    }

    /// <summary>#341: a short registration (no birthday, no pathway) succeeds and leaves onboarding pending.</summary>
    [Fact]
    public async Task Short_registration_defaults_pathway_and_leaves_onboarding_pending()
    {
        var service = new UserService(new SqliteUserRepository(_factory));

        var registered = await service.RegisterAsync(new RegisterUserRequest { Email = "short@example.com", Password = "StrongPassword123!", DisplayName = "Alex" });

        Assert.True(registered.Success);
        var user = await service.GetByEmailAsync("short@example.com");
        Assert.NotNull(user);
        Assert.Null(user.Birthday);
        Assert.Equal(string.Empty, user.ZodiacSign);
        Assert.Equal(SpiritualPathway.Mindfulness, user.SelectedPathway);
        Assert.Null(user.OnboardingCompletedAt);
        Assert.True(user.AuraRevealsEnabled);
        Assert.Null(GetStoredBirthday(user.Id));
    }

    /// <summary>#341: a legacy client that still sends a pathway at registration is not sent to the quiz.</summary>
    [Fact]
    public async Task Legacy_registration_with_pathway_is_marked_onboarded()
    {
        var service = new UserService(new SqliteUserRepository(_factory));

        await service.RegisterAsync(new RegisterUserRequest { Email = "legacy@example.com", Password = "StrongPassword123!", Birthday = new DateOnly(1994, 9, 12), SelectedPathway = SpiritualPathway.Faith });

        var user = await service.GetByEmailAsync("legacy@example.com");
        Assert.NotNull(user);
        Assert.Equal(SpiritualPathway.Faith, user.SelectedPathway);
        Assert.NotNull(user.OnboardingCompletedAt);
    }

    /// <summary>#341: onboarding stores pathway, birthday, hue and ordered answers, and marks completion.</summary>
    [Fact]
    public async Task Complete_onboarding_persists_result_and_marks_completion()
    {
        var service = new UserService(new SqliteUserRepository(_factory));
        await service.RegisterAsync(new RegisterUserRequest { Email = "quiz@example.com", Password = "StrongPassword123!" });
        var user = (await service.GetByEmailAsync("quiz@example.com"))!;

        var result = await service.CompleteOnboardingAsync(user.Id, new OnboardingRequest
        {
            SelectedPathway = SpiritualPathway.Energy,
            Birthday = new DateOnly(1994, 9, 12),
            ColorMomentHue = 285,
            PathwayPreferences = new PathwayPreferences { Focus = ["moon-phases", "my-sign"] },
            Answers =
            [
                new OnboardingAnswer { QuestionNumber = 2, Pathway = SpiritualPathway.Energy },
                new OnboardingAnswer { QuestionNumber = 1, Pathway = SpiritualPathway.Mindfulness },
            ],
        });

        Assert.True(result.Success, result.Message);
        var saved = (await service.GetByIdAsync(user.Id))!;
        Assert.Equal(SpiritualPathway.Energy, saved.SelectedPathway);
        Assert.Equal(new DateOnly(1994, 9, 12), saved.Birthday);
        Assert.Equal("Virgo", saved.ZodiacSign);
        Assert.Equal(285, saved.OnboardingColorHue);
        Assert.Equal(["moon-phases", "my-sign"], saved.PathwayPreferences!.Focus);
        Assert.Null(saved.PathwayPreferences.CheckInOpener);
        Assert.Equal([1, 2], saved.OnboardingAnswers.Select(a => a.QuestionNumber));
        Assert.Equal(SpiritualPathway.Energy, saved.OnboardingAnswers[1].Pathway);
        Assert.NotNull(saved.OnboardingCompletedAt);
    }

    /// <summary>#341: skipping the quiz completes onboarding with Mindful Living and no answers.</summary>
    [Fact]
    public async Task Skipped_onboarding_defaults_to_mindfulness()
    {
        var service = new UserService(new SqliteUserRepository(_factory));
        await service.RegisterAsync(new RegisterUserRequest { Email = "skip@example.com", Password = "StrongPassword123!" });
        var user = (await service.GetByEmailAsync("skip@example.com"))!;

        var result = await service.CompleteOnboardingAsync(user.Id, new OnboardingRequest());

        Assert.True(result.Success);
        var saved = (await service.GetByIdAsync(user.Id))!;
        Assert.Equal(SpiritualPathway.Mindfulness, saved.SelectedPathway);
        Assert.Empty(saved.OnboardingAnswers);
        Assert.Null(saved.Birthday);
        Assert.NotNull(saved.OnboardingCompletedAt);
    }

    /// <summary>#341: invalid onboarding input is rejected and nothing is saved.</summary>
    [Theory]
    [InlineData("pathway")]
    [InlineData("duplicate")]
    [InlineData("question")]
    [InlineData("future")]
    [InlineData("hue")]
    [InlineData("foreign-focus")]
    [InlineData("too-many-intentions")]
    [InlineData("opener-off-pathway")]
    public async Task Invalid_onboarding_is_rejected(string problem)
    {
        var service = new UserService(new SqliteUserRepository(_factory));
        await service.RegisterAsync(new RegisterUserRequest { Email = $"bad-{problem}@example.com", Password = "StrongPassword123!" });
        var user = (await service.GetByEmailAsync($"bad-{problem}@example.com"))!;
        var request = new OnboardingRequest();
        switch (problem)
        {
            case "pathway": request.SelectedPathway = (SpiritualPathway)99; break;
            case "duplicate": request.Answers = [new() { QuestionNumber = 1 }, new() { QuestionNumber = 1 }]; break;
            case "question": request.Answers = [new() { QuestionNumber = 6 }]; break;
            case "future": request.Birthday = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(2); break;
            case "hue": request.ColorMomentHue = 360; break;
            case "foreign-focus": request.SelectedPathway = SpiritualPathway.Faith; request.PathwayPreferences = new() { Focus = ["crystals"] }; break;
            case "too-many-intentions": request.PathwayPreferences = new() { Focus = ["calm", "rest", "focus"] }; break;
            case "opener-off-pathway": request.SelectedPathway = SpiritualPathway.Energy; request.PathwayPreferences = new() { CheckInOpener = "one-minute" }; break;
        }

        var result = await service.CompleteOnboardingAsync(user.Id, request);

        Assert.False(result.Success);
        Assert.Null((await service.GetByIdAsync(user.Id))!.OnboardingCompletedAt);
    }

    /// <summary>#341: Mindful Living keeps its intentions and check-in opener through a round trip.</summary>
    [Fact]
    public async Task Mindful_pathway_preferences_round_trip()
    {
        var service = new UserService(new SqliteUserRepository(_factory));
        await service.RegisterAsync(new RegisterUserRequest { Email = "mindful@example.com", Password = "StrongPassword123!" });
        var user = (await service.GetByEmailAsync("mindful@example.com"))!;

        var result = await service.CompleteOnboardingAsync(user.Id, new OnboardingRequest
        {
            PathwayPreferences = new PathwayPreferences { Focus = ["calm", "clarity"], CheckInOpener = "three-breaths" },
        });

        Assert.True(result.Success, result.Message);
        var saved = (await service.GetByIdAsync(user.Id))!;
        Assert.Equal(["calm", "clarity"], saved.PathwayPreferences!.Focus);
        Assert.Equal("three-breaths", saved.PathwayPreferences.CheckInOpener);
    }

    /// <summary>#341: users that existed before migration 019 are treated as already onboarded.</summary>
    [Fact]
    public void Migration_019_marks_existing_users_onboarded()
    {
        var path = Path.Combine(Path.GetTempPath(), $"aura-019-{Guid.NewGuid():N}.db");
        try
        {
            using var connection = new SqliteConnection($"Data Source={path}");
            connection.Open();
            var migrations = Directory.EnumerateFiles(Path.Combine("..", "..", "..", "..", "AuraLogbook.Api", "Data", "Database", "Migrations"), "*.sql").OrderBy(x => x).ToList();
            foreach (var migration in migrations.Where(m => string.CompareOrdinal(Path.GetFileName(m), "019") < 0))
                connection.ExecuteNonQuery(File.ReadAllText(migration));
            connection.ExecuteNonQuery("INSERT INTO Users (Id,Email,PasswordHash,AuraColor,AuraIntensity,SelectedPathway,CreatedAt,UpdatedAt) VALUES (1,'old@example.com','hash','blue',50,2,'2025-01-01T00:00:00Z','2025-01-01T00:00:00Z');");
            foreach (var migration in migrations.Where(m => string.CompareOrdinal(Path.GetFileName(m), "019") >= 0))
                connection.ExecuteNonQuery(File.ReadAllText(migration));

            using var command = connection.CreateCommand();
            command.CommandText = "SELECT OnboardingCompletedAt || '|' || AuraRevealsEnabled FROM Users WHERE Id = 1";
            Assert.Equal("2025-01-01T00:00:00Z|1", command.ExecuteScalar() as string);
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            if (File.Exists(path)) File.Delete(path);
        }
    }

    private void SeedReferenceData()
    {
        using var connection = _factory.CreateConnection();
        connection.ExecuteNonQuery("INSERT INTO Users (Id,Email,PasswordHash,DisplayName,AuraColor,AuraIntensity,SelectedPathway,CreatedAt,UpdatedAt) VALUES (7,'test@example.com','hash','Test User','blue',50,0,'2026-10-19T00:00:00Z','2026-10-19T00:00:00Z'),(8,'other@example.com','hash','Other User','red',50,0,'2026-10-19T00:00:00Z','2026-10-19T00:00:00Z');");
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
