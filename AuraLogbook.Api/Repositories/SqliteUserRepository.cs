using System.Globalization;
using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using Dapper;

namespace AuraLogbook.Api.Repositories;

public sealed class SqliteUserRepository : IFileUserRepository
{
    private readonly IDbConnectionFactory _factory;
    public SqliteUserRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<List<User>> GetAllAsync() { using var c = _factory.CreateConnection(); return (await c.QueryAsync<UserRow>("SELECT * FROM Users ORDER BY Id")).Select(Map).ToList(); }
    public async Task<User?> GetByEmailAsync(string email) { using var c = _factory.CreateConnection(); var row = await c.QuerySingleOrDefaultAsync<UserRow>("SELECT * FROM Users WHERE Email = @email", new { email }); return row is null ? null : Map(row); }
    public async Task<User?> GetByIdAsync(int id) { using var c = _factory.CreateConnection(); var row = await c.QuerySingleOrDefaultAsync<UserRow>("SELECT * FROM Users WHERE Id = @id", new { id }); return row is null ? null : Map(row); }
    public async Task<int> CreateAsync(User user)
    {
        using var c = _factory.CreateConnection();
        return await c.ExecuteScalarAsync<int>(
            "INSERT INTO Users (Email, PasswordHash, DisplayName, Birthday, ZodiacSign, AuraColor, AuraIntensity, Avatar, Motto, SelectedPathway, InterfaceTheme, WeatherLocationMode, WeatherCity, WeatherRegion, WeatherCountry, TemperatureUnit, OnboardingCompletedAt, AuraRevealsEnabled, OnboardingColorHue, OnboardingAnswersJson, PathwayPreferencesJson, CreatedAt, UpdatedAt) VALUES (@Email,@PasswordHash,@DisplayName,@Birthday,@ZodiacSign,@AuraColor,@AuraIntensity,@Avatar,@Motto,@SelectedPathway,@InterfaceTheme,@WeatherLocationMode,@WeatherCity,@WeatherRegion,@WeatherCountry,@TemperatureUnit,@OnboardingCompletedAt,@AuraRevealsEnabled,@OnboardingColorHue,@OnboardingAnswersJson,@PathwayPreferencesJson,@CreatedAt,@UpdatedAt) RETURNING Id",
            ToSqlParameters(user));
    }

    public async Task<bool> UpdateAsync(User user)
    {
        using var c = _factory.CreateConnection();
        return await c.ExecuteAsync(
            "UPDATE Users SET Email=@Email, PasswordHash=@PasswordHash, DisplayName=@DisplayName, Birthday=@Birthday, ZodiacSign=@ZodiacSign, AuraColor=@AuraColor, AuraIntensity=@AuraIntensity, Avatar=@Avatar, Motto=@Motto, SelectedPathway=@SelectedPathway, InterfaceTheme=@InterfaceTheme, WeatherLocationMode=@WeatherLocationMode, WeatherCity=@WeatherCity, WeatherRegion=@WeatherRegion, WeatherCountry=@WeatherCountry, TemperatureUnit=@TemperatureUnit, OnboardingCompletedAt=@OnboardingCompletedAt, AuraRevealsEnabled=@AuraRevealsEnabled, OnboardingColorHue=@OnboardingColorHue, OnboardingAnswersJson=@OnboardingAnswersJson, PathwayPreferencesJson=@PathwayPreferencesJson, UpdatedAt=@UpdatedAt WHERE Id=@Id",
            ToSqlParameters(user)) == 1;
    }

    private static object ToSqlParameters(User user) => new
    {
        user.Id,
        user.Email,
        user.PasswordHash,
        user.DisplayName,
        Birthday = user.Birthday?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
        // ZodiacSign references ZodiacSigns; a user without a birthday stores NULL, not "".
        ZodiacSign = string.IsNullOrWhiteSpace(user.ZodiacSign) ? null : user.ZodiacSign.ToLowerInvariant(),
        user.AuraColor,
        user.AuraIntensity,
        user.Avatar,
        user.Motto,
        user.SelectedPathway,
        InterfaceTheme = InterfaceThemeValues.Resolve(user.InterfaceTheme),
        WeatherLocationMode = WeatherLocationValues.ResolveMode(user.WeatherLocationMode),
        user.WeatherCity,
        user.WeatherRegion,
        user.WeatherCountry,
        TemperatureUnit = WeatherLocationValues.ResolveUnit(user.TemperatureUnit),
        user.OnboardingCompletedAt,
        AuraRevealsEnabled = user.AuraRevealsEnabled ? 1 : 0,
        user.OnboardingColorHue,
        OnboardingAnswersJson = OnboardingAnswersJson.Serialize(user.OnboardingAnswers),
        PathwayPreferencesJson = OnboardingAnswersJson.SerializePreferences(user.PathwayPreferences),
        user.CreatedAt,
        user.UpdatedAt,
    };
    public async Task<bool> DeleteAsync(int id) { using var c = _factory.CreateConnection(); return await c.ExecuteAsync("DELETE FROM Users WHERE Id=@id", new { id }) == 1; }
    public async Task<List<User>> SearchAsync(string query) { using var c = _factory.CreateConnection(); return (await c.QueryAsync<UserRow>("SELECT * FROM Users WHERE Email LIKE @query OR DisplayName LIKE @query ORDER BY Id", new { query = $"%{query}%" })).Select(Map).ToList(); }
    public async Task ClearAsync() { using var c = _factory.CreateConnection(); await c.ExecuteAsync("DELETE FROM Users"); }

    private static User Map(UserRow row) => new()
    {
        Id = row.Id, Email = row.Email, PasswordHash = row.PasswordHash, DisplayName = row.DisplayName,
        Birthday = DateOnly.TryParse(row.Birthday, CultureInfo.InvariantCulture, out var birthday) ? birthday : null,
        ZodiacSign = row.ZodiacSign is null ? string.Empty : CultureInfo.InvariantCulture.TextInfo.ToTitleCase(row.ZodiacSign),
        AuraColor = row.AuraColor, AuraIntensity = row.AuraIntensity,
        // Older rows can contain a null or unsupported value; normalize them on every read.
        InterfaceTheme = InterfaceThemeValues.Resolve(row.InterfaceTheme),
        WeatherLocationMode = WeatherLocationValues.ResolveMode(row.WeatherLocationMode),
        WeatherCity = row.WeatherCity, WeatherRegion = row.WeatherRegion, WeatherCountry = row.WeatherCountry,
        TemperatureUnit = WeatherLocationValues.ResolveUnit(row.TemperatureUnit),
        Avatar = row.Avatar, Motto = row.Motto, SelectedPathway = (SpiritualPathway)row.SelectedPathway,
        OnboardingCompletedAt = row.OnboardingCompletedAt, AuraRevealsEnabled = row.AuraRevealsEnabled != 0,
        OnboardingColorHue = row.OnboardingColorHue, OnboardingAnswers = OnboardingAnswersJson.Deserialize(row.OnboardingAnswersJson),
        PathwayPreferences = OnboardingAnswersJson.DeserializePreferences(row.PathwayPreferencesJson),
        CreatedAt = row.CreatedAt, UpdatedAt = row.UpdatedAt
    };

    private sealed class UserRow
    {
        public int Id { get; set; } public string Email { get; set; } = ""; public string PasswordHash { get; set; } = "";
        public string? DisplayName { get; set; } public string? Birthday { get; set; } public string? ZodiacSign { get; set; }
        public string AuraColor { get; set; } = "blue"; public int AuraIntensity { get; set; } public string? Avatar { get; set; }
        public string? Motto { get; set; } public int SelectedPathway { get; set; } public string? InterfaceTheme { get; set; }
        public string? WeatherLocationMode { get; set; } public string? WeatherCity { get; set; } public string? WeatherRegion { get; set; } public string? WeatherCountry { get; set; } public string? TemperatureUnit { get; set; }
        public string? OnboardingCompletedAt { get; set; } public int AuraRevealsEnabled { get; set; } = 1; public int? OnboardingColorHue { get; set; } public string? OnboardingAnswersJson { get; set; } public string? PathwayPreferencesJson { get; set; }
        public string CreatedAt { get; set; } = ""; public string UpdatedAt { get; set; } = "";
    }
}
    /// <summary>Initializes a user repository backed by SQLite.</summary>
    /// <summary>Returns all users ordered by identifier.</summary>
    /// <summary>Returns the user with the specified email, if it exists.</summary>
    /// <summary>Returns the user with the specified identifier, if it exists.</summary>
    /// <summary>Creates a user and returns its generated identifier.</summary>
    /// <summary>Updates an existing user and reports whether a row was changed.</summary>
    /// <summary>Deletes a user and reports whether a row was removed.</summary>
    /// <summary>Returns users whose email or display name contains the query.</summary>
    /// <summary>Removes all users from the repository.</summary>
