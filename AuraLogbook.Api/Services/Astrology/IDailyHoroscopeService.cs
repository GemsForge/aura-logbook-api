using AuraLogbook.Api.Models.Dto;

namespace AuraLogbook.Api.Services.Astrology;

/// <summary>Retrieves a daily horoscope for a supported Western zodiac sign.</summary>
public interface IDailyHoroscopeService
{
    /// <summary>Gets the provider's current daily reading for the supplied sign.</summary>
    Task<DailyHoroscopeDto?> GetDailyAsync(string sign, CancellationToken cancellationToken);
}
