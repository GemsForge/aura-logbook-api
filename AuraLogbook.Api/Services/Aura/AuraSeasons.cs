using AuraLogbook.Api.Models;

namespace AuraLogbook.Api.Services.Aura;

/// <summary>One named aura season (#346, spec §10): copy is a reflection, never an identity.</summary>
public sealed record AuraSeason(
    string Key,
    string Name,
    string OftenLinkedWith,
    IReadOnlyDictionary<SpiritualPathway, string> Prompts,
    string NextStep);

/// <summary>
/// Season catalogue and detection rules. A season is named only once a pattern holds: the same key is
/// dominant on at least <see cref="MinDominantDays"/> of the last <see cref="WindowDays"/> days, with at
/// least <see cref="MinLogs"/> mood logs in that window.
/// </summary>
public static class AuraSeasons
{
    public const int WindowDays = 7, MinDominantDays = 5, MinLogs = 4;

    private static AuraSeason S(string key, string name, string linked, string mindful, string energy, string faith, string next) =>
        new(key, name, linked, new Dictionary<SpiritualPathway, string>
        {
            [SpiritualPathway.Mindfulness] = mindful,
            [SpiritualPathway.Energy] = energy,
            [SpiritualPathway.Faith] = faith,
        }, next);

    /// <summary>All seasons, keyed by <see cref="AuraSeason.Key"/>.</summary>
    public static readonly IReadOnlyDictionary<string, AuraSeason> All = new[]
    {
        S("tide", "Steady Tide", "calm, consistency, trust",
            "What has been helping you stay steady?", "What rhythm in your days feels most aligned right now?", "Where have you felt held this week?",
            "Keep one small ritual that's working."),
        S("harbor", "Quiet Harbor", "rest, retreat, recovery",
            "What does rest look like for you today?", "What would let your energy refill?", "What would it mean to rest in grace today?",
            "Give yourself one unhurried pause."),
        S("growth", "New Growth", "renewal, balance, beginnings",
            "What is starting to grow in you?", "What new cycle are you stepping into?", "What is being renewed in you?",
            "Name one thing you'd like to nurture."),
        S("harvest", "Open Harvest", "gratitude, abundance, warmth",
            "What are you grateful for right now?", "Where is abundance showing up for you?", "What blessings are you noticing?",
            "Share a thank-you with someone."),
        S("kindling", "Kindling", "drive, courage, momentum",
            "Where is your energy wanting to go?", "What spark do you want to follow?", "Where are you being called to step forward?",
            "Choose one bold, small step."),
        S("weather", "Shifting Weather", "friction, change in motion",
            "What feels unsettled, and what would soften it?", "What change is moving through your energy?", "What would it look like to bring this to prayer?",
            "Be gentle with yourself while things move."),
        S("starlit", "Starlit", "vision, intuition, imagination",
            "What idea keeps returning to you?", "What is your intuition telling you?", "What are you sensing you're being led toward?",
            "Write down one thing you're imagining."),
        S("bloom", "Bloom", "spark, connection, aliveness",
            "Who or what is bringing you to life?", "Where do you feel most magnetic lately?", "Where have you felt joy as a gift?",
            "Reach out to someone you feel close to."),
        S("stillwater", "Still Water", "a mixed or muted stretch",
            "What do you notice when nothing feels loud?", "What is settling beneath the surface?", "What might stillness be making room for?",
            "Let a quiet day be enough."),
    }.ToDictionary(s => s.Key);

    /// <summary>
    /// Maps a daily aura to a season key from its OKLCH hue family and strength (spec §10).
    /// Returns null when there is no aura at all (no hue).
    /// </summary>
    public static string? KeyFor(double? hue, double strength)
    {
        if (hue is not { } h) return null;
        if (strength < 0.25) return "stillwater";
        var strong = strength >= 0.5;
        return h switch
        {
            < 45 or >= 345 => strong ? "kindling" : "weather", // red
            < 70 => strong ? "kindling" : "weather",           // orange
            < 110 => "harvest",                                 // gold
            < 165 => "growth",                                  // green
            < 262 => strong ? "tide" : "harbor",                // teal, blue
            < 290 => strong ? "starlit" : "harbor",             // indigo
            < 325 => "starlit",                                 // violet
            _ => "bloom",                                       // rose
        };
    }

    /// <summary>
    /// Returns the season key that holds as of the last day of <paramref name="dailyKeys"/> (oldest first,
    /// one per day), or null when no key is dominant enough or there are too few logs.
    /// </summary>
    public static string? Holding(IReadOnlyList<string?> dailyKeys, int logsInWindow)
    {
        if (logsInWindow < MinLogs) return null;
        var window = dailyKeys.TakeLast(WindowDays).Where(k => k is not null).GroupBy(k => k!)
            .OrderByDescending(g => g.Count()).FirstOrDefault();
        return window is not null && window.Count() >= MinDominantDays ? window.Key : null;
    }
}
