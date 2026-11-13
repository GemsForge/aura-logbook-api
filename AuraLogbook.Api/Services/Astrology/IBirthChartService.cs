using AuraLogbook.Api.Models.Dto;

namespace AuraLogbook.Api.Services.Astrology;

/// <summary>Calculates natal chart data from birth details explicitly saved by the user.</summary>
public interface IBirthChartService
{
    /// <summary>Returns a chart or null when the provider is unavailable or the saved details are invalid.</summary>
    Task<NatalChartDto?> GetNatalChartAsync(DateOnly birthday, string birthTime, string birthPlace, CancellationToken cancellationToken);
}
