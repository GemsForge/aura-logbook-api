namespace AuraLogbook.Api.Models;

/// <summary>
/// Supported weather-location preferences (#331). Location is off by default; a typed city is
/// stored as text, and device location is never stored, only used in the browser per request.
/// </summary>
public static class WeatherLocationValues
{
    /// <summary>No location is requested or sent; Today shows a quiet prompt instead of weather.</summary>
    public const string Off = "Off";
    /// <summary>Weather comes from the city, region and country the user typed.</summary>
    public const string City = "City";
    /// <summary>Weather comes from the browser's location, rounded to city level before it is sent.</summary>
    public const string Device = "Device";

    /// <summary>Fahrenheit, the default for new and existing users.</summary>
    public const string Fahrenheit = "F";
    /// <summary>Celsius.</summary>
    public const string Celsius = "C";

    /// <summary>Two decimal places is roughly 1 km: enough for local weather, too coarse to identify a home.</summary>
    public const int CoordinatePrecision = 2;

    /// <summary>Returns a supported mode, or <see cref="Off"/> for missing or unknown values.</summary>
    public static string ResolveMode(string? value) => value switch
    {
        City => City,
        Device => Device,
        _ => Off,
    };

    /// <summary>Returns "C" or "F", defaulting to Fahrenheit.</summary>
    public static string ResolveUnit(string? value) =>
        string.Equals(value, Celsius, StringComparison.OrdinalIgnoreCase) ? Celsius : Fahrenheit;

    /// <summary>Rounds a latitude or longitude to city level so precise positions never reach the provider.</summary>
    public static double RoundCoordinate(double value) =>
        Math.Round(value, CoordinatePrecision, MidpointRounding.AwayFromZero);

    /// <summary>Trims optional text and turns blank values into null.</summary>
    public static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
