using System.ComponentModel.DataAnnotations;

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
}
