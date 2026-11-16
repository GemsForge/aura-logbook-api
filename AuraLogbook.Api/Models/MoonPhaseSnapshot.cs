namespace AuraLogbook.Api.Models;

/// <summary>Provider-reported moon details shared by date and persisted across API restarts.</summary>
public sealed record MoonPhaseSnapshot(DateOnly Date, string? Phase, decimal? Illumination, string? MoonSign);
