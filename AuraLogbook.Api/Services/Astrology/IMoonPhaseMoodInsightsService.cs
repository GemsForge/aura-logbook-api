using AuraLogbook.Api.Models.Dto;

namespace AuraLogbook.Api.Services.Astrology;

/// <summary>Maps private mood entries to provider-reported moon phases for descriptive summaries.</summary>
public interface IMoonPhaseMoodInsightsService
{
    /// <summary>Returns phase and mood counts for the supplied dates, noting dates the provider could not resolve.</summary>
    Task<MoonPhaseMoodInsightsDto> GetInsightsAsync(int userId, DateOnly startDate, DateOnly endDate, CancellationToken cancellationToken);

    /// <summary>Returns provider-reported lunar details and the user's mood counts for each date in the range.</summary>
    Task<MoonCycleDto> GetCycleAsync(int userId, DateOnly startDate, DateOnly endDate, CancellationToken cancellationToken);

    /// <summary>Loads one provider date into the shared cache for a background cycle refresh.</summary>
    Task PrefetchMoonAsync(DateOnly date, CancellationToken cancellationToken);
}
