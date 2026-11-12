using AuraLogbook.Api.Models.Enums;

namespace AuraLogbook.Api.Services.Aura;

/// <summary>
/// Mood hue weights behind the check-in-derived aura (#343, docs/ux/onboarding-aura-spec.md §5).
/// Hues are OKLCH degrees and remain server-side so they can be tuned without a UI release.
/// </summary>
public static class AuraHueTables
{
    public const double Red = 29, Orange = 55, Gold = 85, Green = 145, Teal = 190, Blue = 250, Indigo = 275, Violet = 305, Rose = 350;

    /// <summary>Mood → hue and chroma factor (spec §5). Neutral has no hue and only mutes the blend.</summary>
    public static readonly IReadOnlyDictionary<string, (double? Hue, double Chroma)> Moods = new Dictionary<string, (double?, double)>
    {
        [MoodType.Empowered] = (40, 1.0),
        [MoodType.Centered] = (Blue, 0.8),
        [MoodType.Harmonious] = (Green, 0.9),
        [MoodType.Flowing] = (Teal, 0.9),
        [MoodType.Weary] = (Indigo, 0.4),
        [MoodType.Tense] = (25, 0.7),
        [MoodType.Frustrated] = (Red, 0.9),
        [MoodType.Restless] = (60, 0.7),
        [MoodType.Disconnected] = (260, 0.3),
        [MoodType.Heavy] = (280, 0.4),
        [MoodType.Charged] = (Rose, 1.0),
        [MoodType.Scattered] = (95, 0.5),
        [MoodType.Abundant] = (Gold, 1.0),
        [MoodType.Visionary] = (Violet, 1.0),
        [MoodType.Neutral] = (null, 0.0),
    };
}
