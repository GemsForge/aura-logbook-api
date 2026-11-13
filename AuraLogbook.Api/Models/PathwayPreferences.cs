namespace AuraLogbook.Api.Models;

/// <summary>
/// Choices from the pathway page shown after the onboarding reveal (#341/#342). What each pathway
/// offers differs, so <see cref="Focus"/> holds keys from that pathway's own set:
/// Astrology &amp; Energy nudge topics, Faith &amp; Religion encouragement types, or Mindful Living
/// intentions. <see cref="CheckInOpener"/> applies to Mindful Living only.
/// </summary>
public sealed class PathwayPreferences
{
    /// <summary>Selected keys from <see cref="AllowedFocus"/> for the user's pathway.</summary>
    public List<string> Focus { get; set; } = [];

    /// <summary>Mindful Living check-in opener: <c>none</c>, <c>three-breaths</c> or <c>one-minute</c>.</summary>
    public string? CheckInOpener { get; set; }

    /// <summary>True only when the user explicitly opts to retain birth time and birthplace for chart refreshes.</summary>
    public bool SaveBirthDetails { get; set; }

    /// <summary>Optional local birth time, retained only with explicit chart-detail consent.</summary>
    public string? BirthTime { get; set; }

    /// <summary>Optional birthplace label, retained only with explicit chart-detail consent.</summary>
    public string? BirthPlace { get; set; }

    /// <summary>Focus keys each pathway's page offers.</summary>
    public static readonly IReadOnlyDictionary<SpiritualPathway, IReadOnlySet<string>> AllowedFocus =
        new Dictionary<SpiritualPathway, IReadOnlySet<string>>
        {
            [SpiritualPathway.Energy] = new HashSet<string> { "daily-astrology", "moon-phases", "my-sign", "chakras", "crystals" },
            [SpiritualPathway.Faith] = new HashSet<string> { "verse", "prayer", "reflection-question" },
            [SpiritualPathway.Mindfulness] = new HashSet<string> { "calm", "rest", "clarity", "gratitude", "self-kindness", "focus" },
        };

    /// <summary>Allowed Mindful Living check-in openers.</summary>
    public static readonly IReadOnlySet<string> AllowedOpeners = new HashSet<string> { "none", "three-breaths", "one-minute" };

    /// <summary>Mindful Living asks for one or two intentions.</summary>
    public const int MaxMindfulIntentions = 2;

    /// <summary>Returns a user-facing message when these preferences do not fit <paramref name="pathway"/>, else null.</summary>
    public string? Validate(SpiritualPathway pathway)
    {
        // JSON "focus": null overrides the initializer; normalize so storage never sees null.
        Focus ??= [];
        if (!AllowedFocus.TryGetValue(pathway, out var allowed))
            return "Choose a supported pathway.";
        if (Focus.Any(f => !allowed.Contains(f)))
            return "Those choices don't belong to this pathway.";
        if (Focus.Distinct().Count() != Focus.Count)
            return "Each choice can be selected only once.";
        if (pathway == SpiritualPathway.Mindfulness && Focus.Count > MaxMindfulIntentions)
            return "Choose up to two intentions.";
        if (CheckInOpener is not null && (pathway != SpiritualPathway.Mindfulness || !AllowedOpeners.Contains(CheckInOpener)))
            return "Check-in openers are a Mindful Living choice: none, three-breaths or one-minute.";
        if (BirthTime is { Length: > 16 } || BirthPlace is { Length: > 160 })
            return "Birth details exceed the supported length.";
        if (SaveBirthDetails && pathway != SpiritualPathway.Energy)
            return "Saved birth details are available only for Astrology & Energy.";
        if (SaveBirthDetails && (string.IsNullOrWhiteSpace(BirthTime) || string.IsNullOrWhiteSpace(BirthPlace)))
            return "Provide both birth time and birthplace when choosing to save chart details.";
        if (!SaveBirthDetails && (BirthTime is not null || BirthPlace is not null))
            return "Choose to save birth details before providing them.";
        return null;
    }
}
