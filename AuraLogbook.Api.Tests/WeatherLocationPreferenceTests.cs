using System.Text.Json;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Tests;

/// <summary>
/// #331: the weather location preference defaults to Off, stores only a typed place, clears it
/// when location is turned off or switched to device, and survives reload in file storage.
/// </summary>
public sealed class WeatherLocationPreferenceTests : IDisposable
{
    private readonly string _filePath = Path.Combine(Path.GetTempPath(), $"aura-weather-users-{Guid.NewGuid():N}.json");

    public void Dispose()
    {
        if (File.Exists(_filePath)) File.Delete(_filePath);
    }

    [Theory]
    [InlineData(null, "Off")]
    [InlineData("City", "City")]
    [InlineData("Device", "Device")]
    [InlineData("Everywhere", "Off")]
    public void ResolveMode_defaults_unknown_values_to_off(string? stored, string expected) =>
        Assert.Equal(expected, WeatherLocationValues.ResolveMode(stored));

    [Theory]
    [InlineData(33.748995, 33.75)]
    [InlineData(-84.387982, -84.39)]
    [InlineData(51.505, 51.51)]
    public void RoundCoordinate_keeps_two_decimals(double precise, double rounded) =>
        Assert.Equal(rounded, WeatherLocationValues.RoundCoordinate(precise));

    [Fact]
    public async Task Legacy_file_user_is_off_and_a_typed_city_survives_reload()
    {
        await File.WriteAllTextAsync(_filePath, JsonSerializer.Serialize(new[] { new
        {
            Id = 3, Email = "legacy@example.test", PasswordHash = "hash", DisplayName = "Legacy",
            Birthday = new DateOnly(1990, 1, 1), ZodiacSign = "capricorn", AuraColor = "blue", AuraIntensity = 50,
        } }));
        var service = new UserService(Repository());

        var legacy = await service.GetByIdAsync(3);
        Assert.Equal(WeatherLocationValues.Off, legacy?.WeatherLocationMode);
        Assert.Null(legacy?.WeatherCity);
        Assert.Equal("F", legacy?.TemperatureUnit);

        var result = await service.UpdateUserAsync(Request(legacy!, "City", " Lisbon ", null, "pt", "C"));
        Assert.True(result.Success, result.Message);

        // A fresh repository instance reads the file again, as another device would see it.
        var reloaded = await new UserService(Repository()).GetByIdAsync(3);
        Assert.Equal(WeatherLocationValues.City, reloaded?.WeatherLocationMode);
        Assert.Equal("Lisbon", reloaded?.WeatherCity);
        Assert.Equal("PT", reloaded?.WeatherCountry);
        Assert.Equal("C", reloaded?.TemperatureUnit);
    }

    [Theory]
    [InlineData("Off")]
    [InlineData("Device")]
    public async Task Turning_off_or_switching_to_device_clears_the_saved_place(string mode)
    {
        await SeedFileUserAsync();
        var service = new UserService(Repository());
        var user = (await service.GetByIdAsync(1))!;
        Assert.True((await service.UpdateUserAsync(Request(user, "City", "Atlanta", "GA", "US", null))).Success);

        Assert.True((await service.UpdateUserAsync(Request(user, mode, "Ignored", "Ignored", "XX", null))).Success);

        var saved = await service.GetByIdAsync(1);
        Assert.Equal(mode, saved?.WeatherLocationMode);
        Assert.Null(saved?.WeatherCity);
        Assert.Null(saved?.WeatherRegion);
        Assert.Null(saved?.WeatherCountry);
    }

    [Fact]
    public async Task City_mode_requires_a_city()
    {
        await SeedFileUserAsync();
        var service = new UserService(Repository());
        var user = (await service.GetByIdAsync(1))!;

        var result = await service.UpdateUserAsync(Request(user, "City", "  ", null, null, null));

        Assert.False(result.Success);
        Assert.Equal(WeatherLocationValues.Off, (await service.GetByIdAsync(1))?.WeatherLocationMode);
    }

    [Fact]
    public async Task Omitting_the_mode_keeps_the_current_setting()
    {
        await SeedFileUserAsync();
        var service = new UserService(Repository());
        var user = (await service.GetByIdAsync(1))!;
        await service.UpdateUserAsync(Request(user, "City", "Oslo", null, "NO", null));

        Assert.True((await service.UpdateUserAsync(Request(user, null, null, null, null, null))).Success);

        Assert.Equal("Oslo", (await service.GetByIdAsync(1))?.WeatherCity);
    }

    [Fact]
    public void Migration_015_defaults_existing_rows_to_off_and_fahrenheit()
    {
        using var connection = MigrationTestDatabase.OpenAll();
        var columns = new Dictionary<string, string?>();
        using var command = connection.CreateCommand();
        command.CommandText = "PRAGMA table_info(Users);";
        using (var reader = command.ExecuteReader())
            while (reader.Read()) columns[reader.GetString(1)] = reader.IsDBNull(4) ? null : reader.GetString(4);

        Assert.Equal("'Off'", columns["WeatherLocationMode"]);
        Assert.Equal("'F'", columns["TemperatureUnit"]);
        Assert.Contains("WeatherCity", columns.Keys);
        Assert.Contains("WeatherRegion", columns.Keys);
        Assert.Contains("WeatherCountry", columns.Keys);
        // No column can hold device coordinates.
        Assert.DoesNotContain(columns.Keys, name => name.Contains("Lat", StringComparison.OrdinalIgnoreCase) || name.Contains("Lon", StringComparison.OrdinalIgnoreCase));
    }

    private FileUserRepository Repository() =>
        new(Options.Create(new StorageSettings { UserFilePath = _filePath }));

    private Task SeedFileUserAsync() => File.WriteAllTextAsync(_filePath, JsonSerializer.Serialize(new[] { new
    {
        Id = 1, Email = "weather@example.test", PasswordHash = "hash", DisplayName = "Weather",
        Birthday = new DateOnly(1992, 5, 5), ZodiacSign = "taurus", AuraColor = "blue", AuraIntensity = 50,
    } }));

    private static UpdateUserRequest Request(User user, string? mode, string? city, string? region, string? country, string? unit) => new()
    {
        Id = user.Id, Email = user.Email, Birthday = user.Birthday, DisplayName = user.DisplayName,
        AuraColor = user.AuraColor, AuraIntensity = user.AuraIntensity, SelectedPathway = user.SelectedPathway,
        WeatherLocationMode = mode, WeatherCity = city, WeatherRegion = region, WeatherCountry = country, TemperatureUnit = unit,
    };
}
