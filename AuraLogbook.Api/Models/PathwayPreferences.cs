namespace AuraLogbook.Api.Models;

/// <summary>
/// Optional modules selected for one primary pathway. Focus keys are validated against that
/// pathway so its navigation cannot expose modules from another framework.
/// </summary>
public sealed class PathwayPreferences
{
    /// <summary>Selected keys from <see cref="AllowedFocus"/> for the user's pathway.</summary>
    public List<string> Focus { get; set; } = [];

    /// <summary>Mindful Living check-in opener: <c>none</c>, <c>three-breaths</c> or <c>one-minute</c>.</summary>
    public string? CheckInOpener { get; set; }

    /// <summary>Whether the shared breathing timer appears in the selected pathway navigation.</summary>
    public bool BreathingEnabled { get; set; } = true;

    /// <summary>Optional broad tradition lens selected by the user, such as Christian, Muslim, Jewish, or custom.</summary>
    public string? FaithTradition { get; set; }

    /// <summary>True only when the user explicitly chooses to retain optional chart birth details.</summary>
    public bool SaveBirthDetails { get; set; }

    /// <summary>Optional local birth time for a deeper chart; retained only with explicit consent.</summary>
    public string? BirthTime { get; set; }

    /// <summary>Optional birthplace label for a deeper chart; retained only with explicit consent.</summary>
    public string? BirthPlace { get; set; }

    /// <summary>Focus keys each pathway's page offers.</summary>
    public static readonly IReadOnlyDictionary<SpiritualPathway, IReadOnlySet<string>> AllowedFocus =
        new Dictionary<SpiritualPathway, IReadOnlySet<string>>
        {
            [SpiritualPathway.Energy] = new HashSet<string> { "daily-astrology", "chakra-reference", "my-sign", "moon-phases", "chakras", "crystals" },
            [SpiritualPathway.Faith] = new HashSet<string> { "faith-practice-check-in", "sacred-texts", "word-of-day", "verse", "prayer", "reflection-question" },
            [SpiritualPathway.Mindfulness] = new HashSet<string> { "mindfulness-guide", "practice-log", "calm", "rest", "clarity", "gratitude", "self-kindness", "focus" },
        };

    /// <summary>Allowed Mindful Living check-in openers.</summary>
    public static readonly IReadOnlySet<string> AllowedOpeners = new HashSet<string> { "none", "three-breaths", "one-minute" };

    /// <summary>Mindful Living asks for one or two intentions.</summary>
    public const int MaxMindfulIntentions = 2;

    /// <summary>Returns a user-facing validation message for selected module keys, else null.</summary>
    public string? Validate(SpiritualPathway pathway)
    {
        // JSON "focus": null overrides the initializer; normalize so storage never sees null.
        Focus ??= [];
        if (!Enum.IsDefined(pathway))
            return "Choose a supported pathway.";
        if (!AllowedFocus.TryGetValue(pathway, out var allowed) || Focus.Any(f => !allowed.Contains(f)))
            return "Choose supported pathway modules.";
        if (Focus.Distinct().Count() != Focus.Count)
            return "Each choice can be selected only once.";
        // Onboarding rules (#341) still hold: up to two Mindful intentions (module toggles don't count)
        // and check-in openers remain a Mindful Living choice.
        if (pathway == SpiritualPathway.Mindfulness && Focus.Count(f => !ModuleKeys.Contains(f)) > MaxMindfulIntentions)
            return "Choose up to two intentions.";
        if (CheckInOpener is not null && (pathway != SpiritualPathway.Mindfulness || !AllowedOpeners.Contains(CheckInOpener)))
            return "Check-in openers are a Mindful Living choice: none, three-breaths or one-minute.";
        if (FaithTradition is { Length: > 40 } || FaithTradition is not null && !AllowedFaithTraditions.Contains(FaithTradition))
            return "Choose a supported faith tradition or custom wording.";
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

    /// <summary>Navigation module keys (#385), as opposed to onboarding intentions and topics.</summary>
    public static readonly IReadOnlySet<string> ModuleKeys = new HashSet<string>(StringComparer.Ordinal)
        { "mindfulness-guide", "practice-log", "daily-astrology", "chakra-reference", "faith-practice-check-in", "sacred-texts", "word-of-day" };

    /// <summary>Broad faith lenses; custom keeps a user's own language available.</summary>
    public static readonly IReadOnlySet<string> AllowedFaithTraditions = new HashSet<string>(StringComparer.Ordinal)
        { "christian", "muslim", "jewish", "other", "custom", "neutral" };
}
