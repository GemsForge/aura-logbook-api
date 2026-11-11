namespace AuraLogbook.Api.Models;

/// <summary>Normalizes brightness independently of theme family and recorded aura data.</summary>
public static class InterfaceModeValues
{
    /// <summary>Default brightness for new accounts and absent or unsupported preferences.</summary>
    public const string Default = "light";

    /// <summary>Honors an explicit mode; missing or unsupported values use light in every family.</summary>
    /// <param name="value">Saved or requested light/dark mode.</param>
    /// <param name="legacyTheme">Retained for compatibility; every family now shares the light default.</param>
    public static string Resolve(string? value, string? legacyTheme = null) =>
        value is "light" or "dark" ? value : Default;
}
