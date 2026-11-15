namespace AuraLogbook.Api.Repositories;

/// <summary>Reads the active mood/color associations displayed by the reference-data UI.</summary>
public interface IAuraColorSource
{
    /// <summary>Returns each visible mood's primary palette hue; null denotes an explicitly neutral or achromatic color.</summary>
    Task<IReadOnlyDictionary<string, double?>> GetMoodHuesAsync();
}
