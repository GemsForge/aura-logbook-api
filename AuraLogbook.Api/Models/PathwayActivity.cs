using System.Text.Json;

namespace AuraLogbook.Api.Models;

/// <summary>One private, pathway-tagged activity or insight response owned by an Aura user.</summary>
public sealed class PathwayActivity
{
    /// <summary>Database identifier.</summary>
    public int Id { get; set; }

    /// <summary>Authenticated owner identifier.</summary>
    public int UserId { get; set; }

    /// <summary>Stable pathway key: mindfulness, energy, or faith.</summary>
    public string Pathway { get; set; } = "";

    /// <summary>Enabled pathway module key that owns the activity.</summary>
    public string ModuleKey { get; set; } = "";

    /// <summary>Typed activity lifecycle, such as practice, daily-check-in, or insight-feedback.</summary>
    public string ActivityType { get; set; } = "";

    /// <summary>Local calendar date on which the user recorded the activity.</summary>
    public DateOnly OccurredOn { get; set; }

    /// <summary>Validated structured content for the selected activity type.</summary>
    public JsonElement Content { get; set; }

    /// <summary>UTC creation time.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC last-update time.</summary>
    public DateTime UpdatedAt { get; set; }
}
