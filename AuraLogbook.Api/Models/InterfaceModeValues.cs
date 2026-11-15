namespace AuraLogbook.Api.Models;

/// <summary>Normalizes brightness independently of theme family and recorded aura data.</summary>
public static class InterfaceModeValues
{
    /// <summary>Default for new accounts and absent or unsupported preferences: follow the device's appearance (#425).</summary>
    public const string Default = "system";

    /// <summary>
    /// Honors an explicit mode; missing or unsupported values follow system appearance, except legacy
    /// Ivory accounts, whose palette became Aurora's light palette and so stay light.
    /// </summary>
    /// <param name="value">Saved light/dark override or system-following preference; the client resolves device appearance.</param>
    /// <param name="legacyTheme">The stored theme family; legacy Ivory keeps its light brightness.</param>
    public static string Resolve(string? value, string? legacyTheme = null) =>
        value is "light" or "dark" or "system" ? value : legacyTheme == "Ivory" ? "light" : Default;
}
