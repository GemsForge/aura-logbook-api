using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;

namespace AuraLogbook.Api.Services.Aura;

/// <summary>
/// Derives a user's aura (#343) from recent mood logs, blended as hue vectors in OKLCH.
/// Profile, onboarding, and pathway choices do not set the color. The calculation is pure and
/// deterministic for a given <c>today</c>, so it is unit-testable without storage.
/// </summary>
public static class AuraEngine
{
    /// <summary>Mood influence halves every this many days.</summary>
    public const double HalfLifeDays = 7;
    /// <summary>Mood entries older than this are ignored.</summary>
    public const int WindowDays = 30;
    /// <summary>Surface lightness for the aura tone (spec §7).</summary>
    public const double Lightness = 0.72;

    private sealed class Blend
    {
        public double X, Y, Weight;
        public void Add(double hue, double weight, double chroma = 1)
        {
            var r = hue * Math.PI / 180;
            X += Math.Cos(r) * weight * chroma;
            Y += Math.Sin(r) * weight * chroma;
            Weight += weight;
        }
    }

    /// <summary>Most recent mood combinations named in the contributors list.</summary>
    public const int MaxCombinationContributors = 3;

    /// <summary>Computes a mood-derived aura as of <paramref name="today"/>; <paramref name="user"/> is retained for API compatibility.</summary>
    /// <param name="combinationHues">Authored combination hues (#345); a matching entry uses its combination hue
    /// instead of the individual mood hues.</param>
    public static AuraDto Compute(User user, IEnumerable<MoodEntry> moods, DateOnly today, IReadOnlyDictionary<string, CombinationHue>? combinationHues = null)
    {
        var blend = new Blend();
        var contributors = new List<string>();

        // Mood logs from the last WindowDays, newest weighted most.
        var recent = moods.Where(m => m.Date <= today && today.DayNumber - m.Date.DayNumber < WindowDays).ToList();
        var counts = new Dictionary<string, int>(StringComparer.Ordinal);
        var combinationLines = new List<string>();
        foreach (var entry in recent.OrderByDescending(e => e.Date))
        {
            var decay = Decay(today.DayNumber - entry.Date.DayNumber);
            foreach (var mood in entry.Moods) counts[mood] = counts.GetValueOrDefault(mood) + 1;

            var distinct = entry.Moods.Distinct().ToList();
            if (distinct.Count is 2 or 3 && combinationHues is not null
                && combinationHues.TryGetValue(MoodCombinationImporter.CreateMoodSetKey(distinct), out var combo))
            {
                blend.Add(combo.Hue, combo.Weight * decay, combo.ChromaFactor);
                if (combinationLines.Count < MaxCombinationContributors)
                    combinationLines.Add($"{string.Join(" + ", distinct)} on {entry.Date.DayOfWeek}");
                continue;
            }

            foreach (var mood in entry.Moods)
            {
                var (hue, chroma) = AuraHueTables.Moods[mood];
                if (hue is { } h) blend.Add(h, decay, chroma);
                else blend.Weight += decay; // Neutral mutes the blend without moving the hue.
            }
        }
        if (recent.Count > 0)
        {
            var top = counts.OrderByDescending(kv => kv.Value).ThenBy(kv => kv.Key).First().Key;
            contributors.Add($"{recent.Count} check-in{(recent.Count == 1 ? "" : "s")} in the last {WindowDays} days, mostly {top}");
            contributors.AddRange(combinationLines);
        }

        // A check-in is the only source of hue; profile, onboarding, and pathway values never tint it.
        var x = blend.Weight > 0 ? blend.X / blend.Weight : 0;
        var y = blend.Weight > 0 ? blend.Y / blend.Weight : 0;

        var strength = Math.Clamp(Math.Sqrt(x * x + y * y), 0, 1);
        if (strength < 1e-6)
            return new AuraDto { Hue = null, Chroma = 0.04, Lightness = Lightness, Strength = 0, Intensity = 0, Contributors = contributors };

        var hueDegrees = (Math.Atan2(y, x) * 180 / Math.PI + 360) % 360;
        return new AuraDto
        {
            Hue = Math.Round(hueDegrees, 1),
            Chroma = Math.Round(0.04 + 0.12 * strength, 4),
            Lightness = Lightness,
            Strength = Math.Round(strength, 4),
            Intensity = (int)Math.Round(strength * 100),
            Contributors = contributors,
        };
    }

    /// <summary>Exponential decay factor for an age in days (1 at age 0, 0.5 at <see cref="HalfLifeDays"/>).</summary>
    public static double Decay(double ageDays) => Math.Pow(0.5, Math.Max(0, ageDays) / HalfLifeDays);

}
