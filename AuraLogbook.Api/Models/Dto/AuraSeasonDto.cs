using AuraLogbook.Api.Models;

namespace AuraLogbook.Api.Models.Dto;

/// <summary>Named season reflection, returned only after its seven-day pattern holds.</summary>
public sealed record AuraSeasonDto(string Key, string Name, string OftenLinkedWith, string Prompt, string NextStep);

/// <summary>A single date span in a user's season history.</summary>
public sealed record AuraSeasonHistoryDto(string Key, string Name, DateOnly StartedOn, DateOnly? EndedOn);

/// <summary>Current season reveal and the user's previous named seasons.</summary>
public sealed record AuraSeasonResponseDto(AuraSeasonDto? Current, IReadOnlyList<AuraSeasonHistoryDto> History);
