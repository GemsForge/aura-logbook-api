using AuraLogbook.Api.Models.Dto;

namespace AuraLogbook.Api.Services.Astrology;

/// <summary>Maps private mood entries to provider-reported moon phases for descriptive summaries.</summary>
public interface IMoonPhaseMoodInsightsService
{
    /// <summary>Returns phase and mood counts for the supplied dates, noting dates the provider could not resolve.</summary>
    Task<MoonPhaseMoodInsightsDto> GetInsightsAsync(int userId, DateOnly startDate, DateOnly endDate, CancellationToken cancellationToken);
}
