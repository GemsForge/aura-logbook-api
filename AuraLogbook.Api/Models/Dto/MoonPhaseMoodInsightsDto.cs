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
