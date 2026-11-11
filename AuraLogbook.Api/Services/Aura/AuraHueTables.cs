using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;

namespace AuraLogbook.Api.Services.Aura;

/// <summary>
/// Hue weights behind the derived aura (#343, docs/ux/onboarding-aura-spec.md §3–6). Hues are
/// OKLCH degrees. Kept server-side so they can be tuned without a UI release.
/// </summary>
public static class AuraHueTables
{
    public const double Red = 29, Orange = 55, Gold = 85, Green = 145, Teal = 190, Blue = 250, Indigo = 275, Violet = 305, Rose = 350;

    /// <summary>Per question, the hue weights each pathway's answer contributes (spec §4; weights sum to 1).</summary>
    public static readonly IReadOnlyDictionary<(int Question, SpiritualPathway Pathway), (double Hue, double Weight)[]> Answers =
        new Dictionary<(int, SpiritualPathway), (double, double)[]>
        {
            [(1, SpiritualPathway.Mindfulness)] = [(Blue, .6), (Teal, .4)],
            [(1, SpiritualPathway.Energy)] = [(Violet, .6), (Indigo, .4)],
            [(1, SpiritualPathway.Faith)] = [(Gold, .7), (Rose, .3)],
            [(2, SpiritualPathway.Mindfulness)] = [(Teal, .6), (Green, .4)],
            [(2, SpiritualPathway.Energy)] = [(Violet, .5), (Orange, .5)],
            [(2, SpiritualPathway.Faith)] = [(Gold, .6), (Violet, .4)],
            [(3, SpiritualPathway.Mindfulness)] = [(Green, .6), (Blue, .4)],
            [(3, SpiritualPathway.Energy)] = [(Indigo, .6), (Violet, .4)],
            [(3, SpiritualPathway.Faith)] = [(Gold, .5), (Blue, .5)],
            [(4, SpiritualPathway.Mindfulness)] = [(Blue, .5), (Green, .5)],
            [(4, SpiritualPathway.Energy)] = [(Violet, .5), (Teal, .5)],
            [(4, SpiritualPathway.Faith)] = [(Rose, .5), (Gold, .5)],
            [(5, SpiritualPathway.Mindfulness)] = [(Teal, .7), (Blue, .3)],
            [(5, SpiritualPathway.Energy)] = [(Indigo, .5), (Orange, .5)],
            [(5, SpiritualPathway.Faith)] = [(Gold, .6), (Rose, .4)],
        };

    /// <summary>Weight of the onboarding color-moment tap.</summary>
    public const double ColorMomentWeight = 1.5;

    /// <summary>Mood → hue and chroma factor (spec §5). Neutral has no hue and only mutes the blend.</summary>
    public static readonly IReadOnlyDictionary<MoodType, (double? Hue, double Chroma)> Moods = new Dictionary<MoodType, (double?, double)>
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

    /// <summary>Zodiac element base hue for Astrology &amp; Energy (spec §6).</summary>
    public static readonly IReadOnlyDictionary<string, (string Element, double Hue)> ZodiacElement =
        new Dictionary<string, (string, double)>(StringComparer.OrdinalIgnoreCase)
        {
            ["Aries"] = ("Fire", 40), ["Leo"] = ("Fire", 40), ["Sagittarius"] = ("Fire", 40),
            ["Taurus"] = ("Earth", 130), ["Virgo"] = ("Earth", 130), ["Capricorn"] = ("Earth", 130),
            ["Gemini"] = ("Air", 95), ["Libra"] = ("Air", 95), ["Aquarius"] = ("Air", 95),
            ["Cancer"] = ("Water", 220), ["Scorpio"] = ("Water", 220), ["Pisces"] = ("Water", 220),
        };

    /// <summary>Share of the final blend given to the pathway base layer.</summary>
    public const double EnergyBaseShare = 0.30, FaithBaseShare = 0.25;
}
