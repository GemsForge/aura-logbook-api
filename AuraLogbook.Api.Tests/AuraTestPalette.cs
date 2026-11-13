using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Services.Aura;

namespace AuraLogbook.Api.Tests;

/// <summary>Visible baseline catalog colors for pure-engine tests; repository tests separately exercise mutable database definitions.</summary>
internal static class AuraTestPalette
{
    public static readonly IReadOnlyDictionary<string, double?> Visible = new Dictionary<string, double?>
    {
        [MoodType.Empowered] = PaletteHue.FromHex("#ffeb3b"),
        [MoodType.Centered] = PaletteHue.FromHex("#ffeb3b"),
        [MoodType.Harmonious] = PaletteHue.FromHex("#2196f3"),
        [MoodType.Flowing] = PaletteHue.FromHex("#ff9800"),
        [MoodType.Weary] = null,
        [MoodType.Tense] = PaletteHue.FromHex("#f44336"),
        [MoodType.Frustrated] = PaletteHue.FromHex("#f44336"),
        [MoodType.Restless] = PaletteHue.FromHex("#3f51b5"),
        [MoodType.Disconnected] = PaletteHue.FromHex("#3f51b5"),
        [MoodType.Heavy] = PaletteHue.FromHex("#2196f3"),
        [MoodType.Charged] = PaletteHue.FromHex("#f44336"),
        [MoodType.Scattered] = PaletteHue.FromHex("#9c27b0"),
        [MoodType.Abundant] = PaletteHue.FromHex("#4caf50"),
        [MoodType.Visionary] = PaletteHue.FromHex("#e91e63"),
        [MoodType.Neutral] = null,
    };
}
