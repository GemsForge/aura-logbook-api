using System.ComponentModel.DataAnnotations;

namespace AuraLogbook.Api.Models.Dto;

public sealed class CreateReflectionResponseRequest
{
    [Range(1, int.MaxValue)]
    public int PromptId { get; set; }

    [Range(1, int.MaxValue)]
    public int MoodEntryId { get; set; }

    [Required]
    [StringLength(2000, MinimumLength = 1)]
    public string ResponseText { get; set; } = string.Empty;
}
