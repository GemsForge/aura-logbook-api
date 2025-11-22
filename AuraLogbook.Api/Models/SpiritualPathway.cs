namespace AuraLogbook.Api.Models;
public enum SpiritualPathway
{
    Mindfulness,
    Energy,
    Faith
}

/// <summary>
/// Provides display name mappings for spiritual pathway enums.
/// 
/// Maps internal enum values to user-friendly display names for UI presentation.
/// Supports three spiritual pathways:
/// - Mindfulness: "Mindful Living" - Calm, clarity, and self-awareness through meditation and journaling
/// - Energy: "Astrology & Energy" - Astrology, chakras, and energy color reflection
/// - Faith: "Christian Faith" - Scripture-inspired prompts, prayers, and Bible verses
/// 
/// Usage:
///   string displayName = SpiritualPathwayDisplay.GetDisplayName(SpiritualPathway.Mindfulness);
///   // Returns: "Mindful Living"
/// </summary>
public static class SpiritualPathwayDisplay
{
    /// <summary>
    /// Dictionary mapping SpiritualPathway enum values to their display names.
    /// Provides a centralized source of truth for UI presentation across the application.
    /// </summary>
    private static readonly Dictionary<SpiritualPathway, string> _displayNames = new()
{
    { SpiritualPathway.Mindfulness, "Mindful Living" },
    { SpiritualPathway.Energy, "Astrology & Energy" },
    { SpiritualPathway.Faith, "Faith & Religion" }
};

    /// <summary>
    /// Retrieves the display name for a given spiritual pathway.
    /// </summary>
    /// <param name="pathway">The SpiritualPathway enum value</param>
    /// <returns>
    /// The user-friendly display name if found in the dictionary;
    /// otherwise returns the enum name as a string fallback.
    /// </returns>
    public static string GetDisplayName(SpiritualPathway pathway)
        => _displayNames.TryGetValue(pathway, out var name) ? name : pathway.ToString();
}