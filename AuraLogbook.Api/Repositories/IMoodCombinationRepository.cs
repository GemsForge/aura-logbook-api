using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;

namespace AuraLogbook.Api.Repositories;

/// <summary>Reads pathway interpretations for a selected set of moods.</summary>
public interface IMoodCombinationRepository
{
    /// <summary>Returns the matching interpretation, or null when the mood set is not authored.</summary>
    Task<MoodCombinationInterpretation?> GetAsync(IReadOnlyCollection<MoodType> moods, int pathwayKey);
}
