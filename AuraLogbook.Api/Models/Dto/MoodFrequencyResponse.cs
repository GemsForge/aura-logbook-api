using AuraLogbook.Api.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace AuraLogbook.Api.Models.Dto;

/// <summary>
/// Represents the frequency of a mood, either as a raw count or percentage (but not both).
/// </summary>
public class MoodFrequencyResponse : IValidatableObject
{
    /// <summary>
    /// The mood type (e.g., Happy, Anxious, etc.).
    /// </summary>
    public MoodType Mood { get; set; }

    /// <summary>
    /// The number of times this mood occurred. Must not be set if Percent is used.
    /// </summary>
    public int? Count { get; set; }

    /// <summary>
    /// The percentage this mood represents. Must not be set if Count is used.
    /// </summary>
    public double? Percent { get; set; }

    /// <summary>
    /// Ensures only one of Count or Percent is provided.
    /// </summary>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var hasCount = Count.HasValue;
        var hasPercent = Percent.HasValue;

        if (hasCount == hasPercent)
        {
            yield return new ValidationResult(
                "Exactly one of 'Count' or 'Percent' must be set.",
                new[] { nameof(Count), nameof(Percent) });
        }
    }
}
