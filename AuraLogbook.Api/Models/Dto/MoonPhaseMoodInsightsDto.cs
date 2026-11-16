namespace AuraLogbook.Api.Models.Dto;

/// <summary>Moon phase co-occurrences computed from the authenticated user's logged mood entries.</summary>
public sealed record MoonPhaseMoodInsightsDto(
    DateOnly StartDate,
    DateOnly EndDate,
    int MoodEntryCount,
    int EntriesWithPhaseData,
    int DatesWithoutPhaseData,
    IReadOnlyList<MoonPhaseMoodCountDto> Phases);

/// <summary>One phase's entry and selected-mood counts; counts do not imply a causal relationship.</summary>
public sealed record MoonPhaseMoodCountDto(
    string Phase,
    int EntryCount,
    IReadOnlyDictionary<string, int> MoodCounts);

/// <summary>Provider-reported lunar details and the signed-in user's mood counts for one local calendar date.</summary>
public sealed record MoonDayDto(
    DateOnly Date,
    string? Phase,
    decimal? Illumination,
    string? MoonSign,
    int EntryCount,
    IReadOnlyDictionary<string, int> MoodCounts);

/// <summary>Date-bounded moon and private mood details for the daily astrology path.</summary>
public sealed record MoonCycleDto(DateOnly StartDate, DateOnly EndDate, IReadOnlyList<MoonDayDto> Days)
{
    /// <summary>Indicates that missing historical moon details are still being loaded into the shared cache.</summary>
    public bool IsPrefetching { get; init; }
}
