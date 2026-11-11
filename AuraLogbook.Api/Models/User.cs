using System.Text.Json.Serialization;

namespace AuraLogbook.Api.Models;

/// <summary>
/// Represents a registered user in the system.
/// </summary>
public class User
{
    /// <summary>
    /// Gets or sets the unique identifier for the user.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the user's email address.
    /// </summary>
    public string Email { get; set; } = default!;

    /// <summary>
    /// Gets or sets the bcrypt hash of the user's password.
    /// </summary>
    /// <remarks>
    /// Excluded from System.Text.Json so it can never appear in an API response, even if a
    /// <see cref="User"/> is returned by mistake. Dapper and the JSON seeder do not use
    /// System.Text.Json for this type, and <c>FileUserRepository</c> persists users through its
    /// own record type, so storage is unaffected.
    /// </remarks>
    [JsonIgnore]
    public string PasswordHash { get; set; } = default!;

    /// <summary>
    /// Gets or sets the UTC timestamp for when the user was created.
    /// </summary>
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString();

    /// <summary>
    /// Gets or sets the UTC timestamp for when the user was last updated.
    /// </summary>
    public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString();

    public string? DisplayName { get; set; }

    /// <summary>Optional since #341: registration no longer asks for it; onboarding may add it.</summary>
    public DateOnly? Birthday { get; set; }

    public string ZodiacSign { get; set; } = string.Empty;

    public string AuraColor { get; set; } = "blue";
    public int AuraIntensity { get; set; } = 50;
    public string? Avatar { get; set; }

    public string? Motto { get; set; }
    // public string Role { get; set; } = "User";
    /// <summary>Stable key for the user's selected pathway.</summary>
    [JsonConverter(typeof(LegacyPathwayKeyJsonConverter))]
    public string SelectedPathway { get; set; } = SpiritualPathwayKeys.Mindfulness;

    /// <summary>Saved interface appearance, independent of recorded aura color.</summary>
    public string InterfaceTheme { get; set; } = InterfaceThemeValues.Aurora;

    /// <summary>Where Today's weather comes from: Off (default), City, or Device. See <see cref="WeatherLocationValues"/>.</summary>
    public string WeatherLocationMode { get; set; } = WeatherLocationValues.Off;
    /// <summary>Typed city, used only when <see cref="WeatherLocationMode"/> is City.</summary>
    public string? WeatherCity { get; set; }
    /// <summary>Optional state or region for the typed city.</summary>
    public string? WeatherRegion { get; set; }
    /// <summary>Optional two-letter country code for the typed city.</summary>
    public string? WeatherCountry { get; set; }
    /// <summary>Temperature unit for weather: "F" (default) or "C".</summary>
    public string TemperatureUnit { get; set; } = WeatherLocationValues.Fahrenheit;
    /// <summary>When onboarding was completed or skipped (UTC, round-trip format); null while it is still pending.</summary>
    public string? OnboardingCompletedAt { get; set; }
    /// <summary>Whether aura reveal copy and accents are shown; users can turn this off in Settings.</summary>
    public bool AuraRevealsEnabled { get; set; } = true;
    /// <summary>Optional hue (0-359) from the onboarding color moment; an input to the derived aura.</summary>
    public int? OnboardingColorHue { get; set; }
    /// <summary>Pathway-quiz answers saved at onboarding; empty when the quiz was skipped.</summary>
    public List<OnboardingAnswer> OnboardingAnswers { get; set; } = [];
    /// <summary>Choices from the pathway page after the reveal; null until the user makes them.</summary>
    public PathwayPreferences? PathwayPreferences { get; set; }
}
