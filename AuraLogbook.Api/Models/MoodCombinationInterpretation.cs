namespace AuraLogbook.Api.Models;

/// <summary>A pathway-specific interpretation for one supported selected-mood combination.</summary>
public sealed class MoodCombinationInterpretation
{
    /// <summary>Gets or sets the stable identifier from the source content.</summary>
    public string CombinationId { get; set; } = string.Empty;

    /// <summary>Gets or sets the canonical mood names represented by this combination.</summary>
    public IReadOnlyList<string> Moods { get; set; } = [];

    /// <summary>Gets or sets the persisted spiritual pathway key.</summary>
    public int PathwayKey { get; set; }

    /// <summary>Gets or sets the reflection text for the selected pathway.</summary>
    public string Interpretation { get; set; } = string.Empty;
}
