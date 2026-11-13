using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace AuraLogbook.Api.Models.Dto;

/// <summary>Typed envelope for private pathway activity records; content is validated by activity type.</summary>
public sealed class PathwayActivityRequest
{
    /// <summary>Selected stable pathway key.</summary>
    [Required, StringLength(32)]
    public string Pathway { get; set; } = string.Empty;

    /// <summary>Module key within the selected pathway.</summary>
    [Required, StringLength(64)]
    public string ModuleKey { get; set; } = string.Empty;

    /// <summary>Known lifecycle of the structured record.</summary>
    [Required, StringLength(48)]
    public string ActivityType { get; set; } = string.Empty;

    /// <summary>Date supplied by the user for the activity.</summary>
    [Required]
    public DateOnly OccurredOn { get; set; }

    /// <summary>Structured fields validated against the activity type before persistence.</summary>
    [Required]
    public JsonElement Content { get; set; }
}
