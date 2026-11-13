using System.ComponentModel.DataAnnotations;
using AuraLogbookApi.Dtos;

namespace AuraLogbook.Api.Models.Dto;

public class MoodEntryRequest
{
    [Required(ErrorMessage = "At least one mood must be selected.")]
    [MinLength(1, ErrorMessage = "Select at least one mood.")]
    /// <summary>Gets or sets active mood keys selected for the entry.</summary>
    public List<string> Moods { get; set; } = new();

    [Required(ErrorMessage = "Date is required.")]
    public DateOnly Date { get; set; } = DateOnly.MaxValue;

    [StringLength(500, ErrorMessage = "Comment cannot exceed 500 characters.")]
    public string? Comment { get; set; }

    /// <summary>User-selected topics that had the biggest impact on this check-in; they are not treated as mood causes.</summary>
    public List<string>? ImpactTopics { get; set; }

    /// <summary>Optional current weather the client showed at check-in; stored as a snapshot for Insights patterns.</summary>
    public WeatherDto? Weather { get; set; }
}
