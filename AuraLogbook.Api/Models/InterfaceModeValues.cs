namespace AuraLogbook.Api.Models;

/// <summary>Normalizes brightness independently of theme family and recorded aura data.</summary>
public static class InterfaceModeValues
{
    /// <summary>Legacy Ivory with no saved mode becomes light; all other missing or invalid values become dark.</summary>
    /// <param name="value">Saved or requested light/dark mode.</param>
    /// <param name="legacyTheme">Raw theme, before Ivory is normalized to Aurora.</param>
    public static string Resolve(string? value, string? legacyTheme = null) =>
        value is "light" or "dark" ? value : value is null && legacyTheme == "Ivory" ? "light" : "dark";
}
