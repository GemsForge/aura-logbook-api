namespace AuraLogbook.Api.Models;

/// <summary>Defines the supported interface theme identifiers and legacy fallback.</summary>
public static class InterfaceThemeValues
{
    /// <summary>Default theme for new accounts and unsupported stored values.</summary>
    public const string Aurora = "Aurora";

    private static readonly HashSet<string> Supported = new(StringComparer.Ordinal)
    {
        Aurora, "Earth", "Ocean", "Sunset", "Amethyst", "Midnight"
    };

    /// <summary>Returns a supported theme; legacy Ivory, missing and unknown values resolve to Aurora.</summary>
    /// <param name="value">Persisted or requested theme identifier.</param>
    public static string Resolve(string? value) =>
        value is not null && Supported.Contains(value) ? value : Aurora;
}
