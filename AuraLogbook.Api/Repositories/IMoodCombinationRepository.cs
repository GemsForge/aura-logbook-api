using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;

namespace AuraLogbook.Api.Repositories;

/// <summary>Reads pathway interpretations for a selected set of moods.</summary>
public interface IMoodCombinationRepository
{
    /// <summary>Returns the matching interpretation, or null when the mood set is not authored.</summary>
    Task<MoodCombinationInterpretation?> GetAsync(IReadOnlyCollection<MoodType> moods, int pathwayKey);

    /// <summary>Authored combination hues (#345) keyed by canonical MoodSetKey.</summary>
    Task<IReadOnlyDictionary<string, CombinationHue>> GetHuesAsync();
}

/// <summary>Hue, chroma factor and blend weight authored for one mood combination (#345).</summary>
public sealed record CombinationHue(double Hue, double ChromaFactor, double Weight);
