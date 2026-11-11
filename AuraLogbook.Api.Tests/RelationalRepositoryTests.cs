using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Controllers;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services;
using AuraLogbook.Api.Services.ReferenceData;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.FileProviders;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

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

    /// <summary>All SQLite read paths return the saved independent mode, including a fresh repository after update.</summary>
    [Fact]
    public async Task Interface_mode_survives_sqlite_create_update_and_every_profile_read()
    {
        var repository = new SqliteUserRepository(_factory);
        var user = new User { Email = "mode-roundtrip@example.test", PasswordHash = "hash", AuraColor = "blue", AuraIntensity = 72, InterfaceTheme = "Ocean", InterfaceMode = "light" };
        user.Id = await repository.CreateAsync(user);
        Assert.Equal("light", (await repository.GetByIdAsync(user.Id))?.InterfaceMode);
        Assert.Equal("light", (await repository.GetByEmailAsync(user.Email))?.InterfaceMode);
        Assert.Equal("light", (await repository.GetAllAsync()).Single(item => item.Id == user.Id).InterfaceMode);
        Assert.Equal("light", (await repository.SearchAsync("mode-roundtrip")).Single().InterfaceMode);
        user.InterfaceMode = "dark";
        Assert.True(await repository.UpdateAsync(user));
        var reloaded = (await new SqliteUserRepository(_factory).GetByIdAsync(user.Id))!;
        Assert.Equal("dark", reloaded.InterfaceMode); Assert.Equal("Ocean", reloaded.InterfaceTheme);
        Assert.Equal("blue", reloaded.AuraColor); Assert.Equal(72, reloaded.AuraIntensity);
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

            var service = new UserService(new SqliteUserRepository(_factory), new TestReferenceDataValidator());
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
        Assert.Equal(SpiritualPathwayKeys.Mindfulness, user.SelectedPathway);
    }

    [Fact]
    public async Task Reference_data_configuration_returns_ordered_seeded_definitions_and_theme_data()
    {
        var response = await new ReferenceDataController(_factory).GetConfiguration();
        var configuration = Assert.IsType<ReferenceDataConfigurationDto>(Assert.IsType<OkObjectResult>(response.Result).Value);

        Assert.Equal(["mindfulness", "energy", "faith"], configuration.Pathways.Select(pathway => pathway.Key));
        Assert.Equal("blue", configuration.Auras.Single(aura => aura.Key == "blue").Key);
        Assert.Equal(10, configuration.Auras.Single(aura => aura.Key == "blue").Shades.Count);
        Assert.Contains(configuration.Moods, mood => mood.Key == "Centered" && mood.AuraColorKeys.Contains("yellow"));
        Assert.Contains(configuration.ThemeTokens, token => token.Key == "color.canvas");
        Assert.Contains(configuration.Graphics, graphic => graphic.Key == "avatar-1" && !string.IsNullOrWhiteSpace(graphic.AlternativeText));
        Assert.Contains(configuration.ZodiacSigns, sign => sign.Key == "virgo" && sign.Symbol == "♍");

        var compatibilityResponse = await new ReferenceDataController(_factory).GetPathways();
        var compatibilityBody = Assert.IsAssignableFrom<IEnumerable<dynamic>>(Assert.IsType<OkObjectResult>(compatibilityResponse).Value);
        Assert.Equal(3, compatibilityBody.Count());
    }

    [Fact]
    public async Task Reference_data_validator_accepts_active_keys_and_rejects_unknown_or_inactive_keys()
    {
        var validator = new SqliteReferenceDataValidator(_factory);

        Assert.True(await validator.IsActivePathwayAsync("mindfulness"));
        Assert.True(await validator.IsActiveAuraAsync("blue"));
        Assert.True(await validator.AreActiveMoodsAsync(["Centered", "Weary"]));
        Assert.False(await validator.IsActivePathwayAsync("unknown"));
        Assert.False(await validator.IsActiveAuraAsync("unknown"));
        Assert.False(await validator.AreActiveMoodsAsync(["Centered", "unknown"]));

        using var connection = _factory.CreateConnection();
        await connection.ExecuteAsync("UPDATE AuraColorDefinitions SET IsActive = 0 WHERE AuraColorKey = 'blue'");
        Assert.False(await validator.IsActiveAuraAsync("blue"));
    }

    [Fact]
    public async Task User_repository_translates_stable_pathways_to_legacy_integer_storage()
    {
        var repository = new SqliteUserRepository(_factory);
        var user = new User
        {
            Email = "stable-pathway@example.com", PasswordHash = "hash", DisplayName = "Stable Pathway",
            Birthday = new DateOnly(1994, 9, 12), ZodiacSign = "virgo", AuraColor = "green", AuraIntensity = 50,
            SelectedPathway = SpiritualPathwayKeys.Faith
        };

        user.Id = await repository.CreateAsync(user);
        Assert.Equal(2, GetStoredPathwayId(user.Id));
        Assert.Equal(SpiritualPathwayKeys.Faith, (await repository.GetByIdAsync(user.Id))?.SelectedPathway);
    }

    [Theory]
    [InlineData(0, SpiritualPathwayKeys.Mindfulness)]
    [InlineData(1, SpiritualPathwayKeys.Energy)]
    [InlineData(2, SpiritualPathwayKeys.Faith)]
    public void Legacy_json_pathway_ids_deserialize_to_stable_keys(int pathwayId, string stableKey)
    {
        var user = JsonSerializer.Deserialize<User>($"{{\"SelectedPathway\":{pathwayId}}}");

        Assert.NotNull(user);
        Assert.Equal(stableKey, user.SelectedPathway);
        Assert.Contains($"\"SelectedPathway\":\"{stableKey}\"", JsonSerializer.Serialize(user));
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
        var service = new UserService(repository, new SqliteReferenceDataValidator(_factory));
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

    private int GetStoredPathwayId(int userId)
    {
        using var connection = _factory.CreateConnection();
        return connection.ExecuteScalar<int>("SELECT SelectedPathway FROM Users WHERE Id = @userId", new { userId });
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
        var service = new MoodService(repository, new TestReferenceDataValidator());
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
        var service = new UserService(new SqliteUserRepository(_factory), new TestReferenceDataValidator());

        var registered = await service.RegisterAsync(new RegisterUserRequest { Email = "short@example.com", Password = "StrongPassword123!", DisplayName = "Alex" });

        Assert.True(registered.Success);
        var user = await service.GetByEmailAsync("short@example.com");
        Assert.NotNull(user);
        Assert.Null(user.Birthday);
        Assert.Equal(string.Empty, user.ZodiacSign);
        Assert.Equal(SpiritualPathwayKeys.Mindfulness, user.SelectedPathway);
        Assert.Null(user.OnboardingCompletedAt);
        Assert.True(user.AuraRevealsEnabled);
        Assert.Null(GetStoredBirthday(user.Id));
    }

    /// <summary>#341: a legacy client that still sends a pathway at registration is not sent to the quiz.</summary>
    [Fact]
    public async Task Legacy_registration_with_pathway_is_marked_onboarded()
    {
        var service = new UserService(new SqliteUserRepository(_factory), new TestReferenceDataValidator());

        await service.RegisterAsync(new RegisterUserRequest { Email = "legacy@example.com", Password = "StrongPassword123!", Birthday = new DateOnly(1994, 9, 12), SelectedPathway = SpiritualPathwayKeys.Faith });

        var user = await service.GetByEmailAsync("legacy@example.com");
        Assert.NotNull(user);
        Assert.Equal(SpiritualPathwayKeys.Faith, user.SelectedPathway);
        Assert.NotNull(user.OnboardingCompletedAt);
    }

    /// <summary>#341: onboarding stores pathway, birthday, hue and ordered answers, and marks completion.</summary>
    [Fact]
    public async Task Complete_onboarding_persists_result_and_marks_completion()
    {
        var service = new UserService(new SqliteUserRepository(_factory), new TestReferenceDataValidator());
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
        Assert.Equal(SpiritualPathwayKeys.Energy, saved.SelectedPathway);
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
        var service = new UserService(new SqliteUserRepository(_factory), new TestReferenceDataValidator());
        await service.RegisterAsync(new RegisterUserRequest { Email = "skip@example.com", Password = "StrongPassword123!" });
        var user = (await service.GetByEmailAsync("skip@example.com"))!;

        var result = await service.CompleteOnboardingAsync(user.Id, new OnboardingRequest());

        Assert.True(result.Success);
        var saved = (await service.GetByIdAsync(user.Id))!;
        Assert.Equal(SpiritualPathwayKeys.Mindfulness, saved.SelectedPathway);
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
        var service = new UserService(new SqliteUserRepository(_factory), new TestReferenceDataValidator());
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
        var service = new UserService(new SqliteUserRepository(_factory), new TestReferenceDataValidator());
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

    /// <summary>#341: JSON nulls for answers or focus are treated as empty instead of crashing.</summary>
    [Fact]
    public async Task Null_answers_and_focus_are_treated_as_empty()
    {
        var service = new UserService(new SqliteUserRepository(_factory), new TestReferenceDataValidator());
        await service.RegisterAsync(new RegisterUserRequest { Email = "nulls@example.com", Password = "StrongPassword123!" });
        var user = (await service.GetByEmailAsync("nulls@example.com"))!;

        var result = await service.CompleteOnboardingAsync(user.Id, new OnboardingRequest
        {
            Answers = null!,
            PathwayPreferences = new PathwayPreferences { Focus = null!, CheckInOpener = "none" },
        });

        Assert.True(result.Success, result.Message);
        var saved = (await service.GetByIdAsync(user.Id))!;
        Assert.Empty(saved.OnboardingAnswers);
        Assert.Empty(saved.PathwayPreferences!.Focus);
        Assert.Equal("none", saved.PathwayPreferences.CheckInOpener);
    }

    /// <summary>#341: a null entry inside the answers list is rejected with a message, not a crash.</summary>
    [Fact]
    public async Task Null_answer_entry_is_rejected()
    {
        var service = new UserService(new SqliteUserRepository(_factory), new TestReferenceDataValidator());
        await service.RegisterAsync(new RegisterUserRequest { Email = "null-entry@example.com", Password = "StrongPassword123!" });
        var user = (await service.GetByEmailAsync("null-entry@example.com"))!;

        var result = await service.CompleteOnboardingAsync(user.Id, new OnboardingRequest { Answers = [null!] });

        Assert.False(result.Success);
        Assert.Null((await service.GetByIdAsync(user.Id))!.OnboardingCompletedAt);
    }

    /// <summary>#344: the aura reveals toggle is saved when sent and kept when omitted.</summary>
    [Fact]
    public async Task Aura_reveals_toggle_is_saved_and_preserved()
    {
        var service = new UserService(new SqliteUserRepository(_factory), new TestReferenceDataValidator());
        await service.RegisterAsync(new RegisterUserRequest { Email = "reveals@example.com", Password = "StrongPassword123!" });
        var user = (await service.GetByEmailAsync("reveals@example.com"))!;

        await service.UpdateUserAsync(new UpdateUserRequest { Id = user.Id, Email = user.Email, AuraRevealsEnabled = false });
        Assert.False((await service.GetByIdAsync(user.Id))!.AuraRevealsEnabled);

        await service.UpdateUserAsync(new UpdateUserRequest { Id = user.Id, Email = user.Email, DisplayName = "Renamed" });
        Assert.False((await service.GetByIdAsync(user.Id))!.AuraRevealsEnabled);
    }

    /// <summary>#345: every authored combination in the curated source has a seeded hue.</summary>
    [Fact]
    public async Task Every_source_combination_has_a_seeded_hue()
    {
        var hues = await new SqliteMoodCombinationRepository(_factory).GetHuesAsync();
        var source = System.Text.Json.JsonDocument.Parse(File.ReadAllText(Path.Combine("..", "..", "..", "..", "aura-ui", "data", "aura_logbook_mood_combinations.json")));
        var records = source.RootElement.ValueKind == System.Text.Json.JsonValueKind.Array
            ? source.RootElement.EnumerateArray()
            : source.RootElement.EnumerateObject().First(p => p.Value.ValueKind == System.Text.Json.JsonValueKind.Array).Value.EnumerateArray();
        var keys = records.Select(r => MoodCombinationImporter.CreateMoodSetKey(
            r.GetProperty("moods").EnumerateArray().Select(m => m.GetString()!))).ToList();

        Assert.NotEmpty(keys);
        Assert.All(keys, k => Assert.True(hues.ContainsKey(k), $"no hue for {k}"));
    }

    /// <summary>#345: the interpretation lookup returns the combination's hue alongside the text.</summary>
    [Fact]
    public async Task Interpretation_includes_the_combination_hue()
    {
        using (var c = _factory.CreateConnection())
            c.ExecuteNonQuery("INSERT INTO MoodCombinationInterpretations (CombinationId, MoodSetKey, MoodsJson, PathwayKey, Interpretation) VALUES ('t1','Empowered|Tense','[\"Tense\",\"Empowered\"]',0,'Pressure into drive.');");

        var result = await new SqliteMoodCombinationRepository(_factory).GetAsync([MoodType.Tense, MoodType.Empowered], 0);

        Assert.Equal("Pressure into drive.", result!.Interpretation);
        Assert.Equal(35, result.Hue);
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
