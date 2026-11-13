using System.Security.Claims;
using AuraLogbook.Api.Controllers;
using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services.Aura;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;
using Moq;

namespace AuraLogbook.Api.Tests;

/// <summary>Exercises the real reference store so aura calculations follow the same colors as mood controls.</summary>
public sealed class AuraPaletteAlignmentTests
{
    private static readonly DateOnly Today = new(2026, 11, 13);

    [Theory]
    [InlineData("Empowered", 95, 115)]
    [InlineData("Centered", 95, 115)]
    [InlineData("Flowing", 50, 85)]
    [InlineData("Harmonious", 235, 265)]
    public async Task Each_mood_uses_its_visible_palette_family(string mood, double minimum, double maximum)
    {
        using var database = new PaletteDatabase();
        var hues = await database.Source.GetMoodHuesAsync();
        var result = AuraEngine.Compute(new User(), [Entry(0, mood)], Today, hues);
        Assert.InRange(result.Hue!.Value, minimum, maximum);
    }

    [Fact]
    public async Task Runtime_mapping_and_shade_changes_apply_without_a_second_hardcoded_color_table()
    {
        using var database = new PaletteDatabase();
        database.Update("UPDATE AuraColorShades SET HexValue='#f44336' WHERE AuraColorKey='yellow' AND Shade=500");
        Assert.InRange((await database.Source.GetMoodHuesAsync())["Centered"]!.Value, 20, 40);
        database.Update("DELETE FROM AuraColorShades WHERE AuraColorKey='yellow' AND Shade=500");
        Assert.Equal(PaletteHue.FromHex(database.Read("SELECT BaseHex FROM AuraColorDefinitions WHERE AuraColorKey='yellow'")), (await database.Source.GetMoodHuesAsync())["Centered"]);
        database.Update("UPDATE MoodAuraMappings SET AuraColorKey='orange' WHERE MoodKey='Centered'");
        Assert.InRange((await database.Source.GetMoodHuesAsync())["Centered"]!.Value, 50, 85);
    }

    [Fact]
    public async Task Primary_mapping_order_matches_the_reference_endpoint_and_inactive_colors_do_not_contribute()
    {
        using var database = new PaletteDatabase();
        database.Update("INSERT INTO MoodAuraMappings (MoodKey,AuraColorKey) VALUES ('Centered','blue')");
        // ReferenceDataController orders association keys alphabetically; blue precedes yellow.
        Assert.InRange((await database.Source.GetMoodHuesAsync())["Centered"]!.Value, 235, 265);
        database.Update("UPDATE AuraColorDefinitions SET IsActive=0 WHERE AuraColorKey='blue'");
        Assert.InRange((await database.Source.GetMoodHuesAsync())["Centered"]!.Value, 95, 115);
    }

    [Fact]
    public async Task Neutral_palette_colors_mute_without_assigning_a_hue()
    {
        using var database = new PaletteDatabase();
        var hues = await database.Source.GetMoodHuesAsync();
        Assert.Null(hues["Neutral"]);
        Assert.Null(hues["Weary"]);
        var alone = AuraEngine.Compute(new User(), [Entry(0, "Empowered")], Today, hues);
        var muted = AuraEngine.Compute(new User(), [Entry(0, "Empowered", "Neutral")], Today, hues);
        Assert.Equal(alone.Hue, muted.Hue);
        Assert.True(muted.Strength < alone.Strength);
    }

    [Fact]
    public async Task Configured_moods_without_code_constants_follow_their_visible_color()
    {
        using var database = new PaletteDatabase();
        var hues = await database.Source.GetMoodHuesAsync();
        // Blocked already exists in the database catalog but has no MoodType constant.
        var blocked = AuraEngine.Compute(new User(), [Entry(0, "Blocked")], Today, hues);
        Assert.InRange(blocked.Hue!.Value, 20, 40);
        database.Update("INSERT INTO MoodDefinitions (MoodKey,DisplayName) VALUES ('CustomMood','Custom mood'); INSERT INTO MoodAuraMappings (MoodKey,AuraColorKey) VALUES ('CustomMood','orange')");
        var custom = AuraEngine.Compute(new User(), [Entry(0, "CustomMood")], Today, await database.Source.GetMoodHuesAsync());
        Assert.InRange(custom.Hue!.Value, 50, 85);
    }

    [Fact]
    public async Task Older_combination_hues_cannot_override_the_visible_colors_used_by_the_current_endpoint()
    {
        using var database = new PaletteDatabase();
        var entries = new List<MoodEntry> { new() { Date = DateOnly.FromDateTime(DateTime.UtcNow), Moods = ["Centered", "Empowered", "Harmonious"] } };
        var users = new Mock<IFileUserRepository>();
        users.Setup(repo => repo.GetByIdAsync(41)).ReturnsAsync(new User { Id = 41 });
        var moods = new Mock<IFileMoodRepository>();
        moods.Setup(repo => repo.GetAllByUserAsync(41)).ReturnsAsync(entries);
        var controller = new AuraController(users.Object, moods.Object, database.Source, Mock.Of<IAuraSeasonRepository>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "41")], "test")) } },
        };
        var before = Assert.IsType<AuraDto>(Assert.IsType<OkObjectResult>((await controller.GetCurrent()).Result).Value);
        Assert.NotNull(before.Hue);
        database.Update("UPDATE MoodCombinationHues SET Hue=250,ChromaFactor=1,Weight=100 WHERE MoodSetKey='Centered|Empowered|Harmonious'");
        var after = Assert.IsType<AuraDto>(Assert.IsType<OkObjectResult>((await controller.GetCurrent()).Result).Value);
        Assert.Equal(before.Hue, after.Hue);
        Assert.Equal(before.Strength, after.Strength);
    }

    [Fact]
    public async Task Representative_recent_mixed_logs_shift_toward_the_visible_yellow_and_orange_inputs()
    {
        using var database = new PaletteDatabase();
        var entries = new[]
        {
            Entry(2, "Empowered", "Harmonious", "Visionary"), Entry(1, "Centered"), Entry(1, "Harmonious"),
            Entry(1, "Flowing", "Visionary"), Entry(0, "Restless", "Weary"),
            Entry(0, "Empowered", "Flowing"), Entry(0, "Centered", "Empowered", "Flowing"),
        };
        var aura = AuraEngine.Compute(new User(), entries, Today, await database.Source.GetMoodHuesAsync());
        Assert.Equal(74.0, aura.Hue);
        Assert.Equal(0.0852, aura.Chroma);
        Assert.Equal(0.3765, aura.Strength);
    }

    [Theory]
    [InlineData("#ffeb3b", 95, 115)]
    [InlineData("#ff9800", 50, 85)]
    [InlineData("#2196f3", 235, 265)]
    public void Palette_conversion_uses_the_displayed_srgb_hue(string hex, double minimum, double maximum) =>
        Assert.InRange(PaletteHue.FromHex(hex)!.Value, minimum, maximum);

    [Fact]
    public void Achromatic_colors_have_no_hue_and_invalid_reference_hex_is_rejected()
    {
        Assert.Null(PaletteHue.FromHex("#9e9e9e"));
        Assert.Throws<InvalidOperationException>(() => PaletteHue.FromHex("#nothex"));
    }

    private static MoodEntry Entry(int age, params string[] moods) => new() { UserId = 41, Date = Today.AddDays(-age), Moods = moods.ToList() };

    /// <summary>Isolated real SQLite reference data; test edits never affect the running application.</summary>
    private sealed class PaletteDatabase : IDisposable
    {
        private readonly string _path = Path.Combine(Path.GetTempPath(), $"aura-palette-{Guid.NewGuid():N}.db");
        public IAuraColorSource Source { get; }
        public PaletteDatabase()
        {
            using var seed = MigrationTestDatabase.OpenAll();
            using var target = new SqliteConnection($"Data Source={_path};Pooling=False");
            target.Open();
            seed.BackupDatabase(target);
            Source = new SqliteAuraColorSource(new SqliteConnectionFactory(Options.Create(new DatabaseOptions { ConnectionString = $"Data Source={_path};Pooling=False" })));
        }
        public void Update(string sql)
        {
            using var connection = new SqliteConnection($"Data Source={_path};Pooling=False");
            connection.Open();
            connection.Execute(sql);
        }
        public string Read(string sql)
        {
            using var connection = new SqliteConnection($"Data Source={_path};Pooling=False");
            connection.Open();
            return connection.QuerySingle<string>(sql);
        }
        public void Dispose() => File.Delete(_path);
    }
}
