using AuraLogbook.Api.Models.Enums;

namespace AuraLogbook.Api.Services.Aura;

/// <summary>
/// Preserves the existing per-mood chroma attenuation. Mood hues themselves come from the displayed database palette.
/// Legacy hue anchors remain for optional liturgical reference code, never for deriving a mood aura.
/// </summary>
public static class AuraHueTables
{
    public const double Red = 29, Orange = 55, Gold = 85, Green = 145, Teal = 190, Blue = 250, Indigo = 275, Violet = 305, Rose = 350;

    /// <summary>Retains established attenuation; newly configured moods use an unattenuated factor until explicitly defined.</summary>
    public static double ChromaFor(string mood) => ChromaFactors.GetValueOrDefault(mood, 1.0);

    private static readonly IReadOnlyDictionary<string, double> ChromaFactors = new Dictionary<string, double>(StringComparer.Ordinal)
    {
        [MoodType.Empowered] = 1.0,
        [MoodType.Centered] = 0.8,
        [MoodType.Harmonious] = 0.9,
        [MoodType.Flowing] = 0.9,
        [MoodType.Weary] = 0.4,
        [MoodType.Tense] = 0.7,
        [MoodType.Frustrated] = 0.9,
        [MoodType.Restless] = 0.7,
        [MoodType.Disconnected] = 0.3,
        [MoodType.Heavy] = 0.4,
        [MoodType.Charged] = 1.0,
        [MoodType.Scattered] = 0.5,
        [MoodType.Abundant] = 1.0,
        [MoodType.Visionary] = 1.0,
        [MoodType.Neutral] = 0.0,
    };
}
