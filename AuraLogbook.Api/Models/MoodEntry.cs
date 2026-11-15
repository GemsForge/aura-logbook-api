namespace AuraLogbook.Api.Models;
public class MoodEntry
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateOnly Date { get; set; }
    /// <summary>User-selected occurrence instant and original UTC offset; null for legacy entries without an occurrence time.</summary>
    public DateTimeOffset? OccurredAt { get; set; }
    /// <summary>Gets or sets database-defined mood keys recorded for this entry.</summary>
    public List<string> Moods { get; set; } = new();
    public string? Comment { get; set; }
    /// <summary>Context topics the user chose as impactful for this entry, without causal interpretation.</summary>
    public List<string> ImpactTopics { get; set; } = [];
    /// <summary>Optional snapshot of the pathway invitation and explicit response recorded with this entry.</summary>
    public MoodPathwayReflection? PathwayReflection { get; set; }
    public string? AuraColor { get; set; }
    public int? AuraIntensity { get; set; }
    public string? ChakraKey { get; set; }
    public string? WeatherSnapshot { get; set; }
    /// <summary>JSON snapshot of the Spotify track playing at check-in, or null when none was captured.</summary>
    public string? MusicTrack { get; set; }
    /// <summary>Number of private photos attached to the entry; read-only, computed when entries are listed.</summary>
    public int PhotoCount { get; set; }
    /// <summary>Immutable server creation timestamp; changing the journal date/time does not rewrite this audit value.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
