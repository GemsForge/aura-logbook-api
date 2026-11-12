using AuraLogbook.Api.Models;

namespace AuraLogbook.Api.Services.Mood;

/// <summary>Builds a pathway-aware reflection when a selected mood set has no curated exact match.</summary>
public static class MoodCombinationReflectionComposer
{
    private static readonly IReadOnlyDictionary<string, string> MoodNotes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        ["Empowered"] = "confidence and agency",
        ["Centered"] = "grounding and steadiness",
        ["Harmonious"] = "ease and connection",
        ["Flowing"] = "momentum and creative movement",
        ["Weary"] = "low energy and a need for gentleness",
        ["Tense"] = "pressure and alertness",
        ["Frustrated"] = "friction and a wish for change",
        ["Restless"] = "unsettled energy and searching",
        ["Disconnected"] = "distance and a wish for connection",
        ["Heavy"] = "emotional weight",
        ["Charged"] = "intensity and drive",
        ["Scattered"] = "many thoughts competing for attention",
        ["Abundant"] = "gratitude and a sense of plenty",
        ["Visionary"] = "hope and possibility",
        ["Neutral"] = "a quieter or in-between state",
    };

    /// <summary>Composes a non-diagnostic reflection for any validated set of two or three moods.</summary>
    /// <param name="moods">Canonical, distinct mood names selected by the user.</param>
    /// <param name="pathwayKey">The selected pathway's persisted key.</param>
    /// <returns>A generated interpretation with no combination-specific color.</returns>
    public static MoodCombinationInterpretation Compose(IReadOnlyCollection<string> moods, int pathwayKey)
    {
        var orderedMoods = moods.Order(StringComparer.Ordinal).ToArray();
        var notes = orderedMoods.Select(mood => MoodNotes.TryGetValue(mood, out var note) ? note : mood.ToLowerInvariant());
        var sharedExperience = string.Join(", ", notes);
        var interpretation = pathwayKey switch
        {
            (int)SpiritualPathway.Mindfulness => $"This mix brings together {sharedExperience}. You can make room for each feeling without needing to resolve them all at once. What would help you meet this moment with care?",
            (int)SpiritualPathway.Energy => $"This mix brings together {sharedExperience}. Notice how these experiences sit alongside one another, and choose a pace or practice that feels supportive to you.",
            (int)SpiritualPathway.Faith => $"This mix brings together {sharedExperience}. You can bring the whole of this moment into your own spiritual practice, if that feels helpful, and take one gentle next step.",
            _ => throw new ArgumentOutOfRangeException(nameof(pathwayKey), "The pathway key must identify a supported pathway."),
        };

        return new MoodCombinationInterpretation
        {
            CombinationId = $"composed-{string.Join('-', orderedMoods.Select(mood => mood.ToLowerInvariant()))}",
            Moods = orderedMoods,
            PathwayKey = pathwayKey,
            Interpretation = interpretation,
        };
    }
}
