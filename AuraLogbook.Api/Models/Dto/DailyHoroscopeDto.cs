namespace AuraLogbook.Api.Models.Dto;

/// <summary>Provider-sourced daily horoscope with the sign and publication date identified.</summary>
public sealed record DailyHoroscopeDto(string Sign, DateOnly Date, string Text, string Provider);
