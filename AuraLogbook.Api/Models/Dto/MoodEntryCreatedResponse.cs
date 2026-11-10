namespace AuraLogbook.Api.Models.Dto;

/// <summary>Returns the identifier required to attach private media to a newly created mood entry.</summary>
public sealed record MoodEntryCreatedResponse(int Id, string Message);
