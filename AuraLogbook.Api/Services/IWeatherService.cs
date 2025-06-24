// Services/IWeatherService.cs
using AuraLogbookApi.Dtos;
using System.Threading.Tasks;

public interface IWeatherService
{
    /// <summary>
    /// Fetches current weather either by coordinates or by city/state/country.
    /// </summary>
    /// <param name="lat">Latitude in degrees. Required if lon is provided.</param>
    /// <param name="lon">Longitude in degrees. Required if lat is provided.</param>
    /// <param name="city">City name. Required if lat/lon are not provided.</param>
    /// <param name="state">State code (e.g. 'GA'). Optional, only used if city is provided.</param>
    /// <param name="country">Country code (e.g. 'US'). Optional, only used if city is provided.</param>
    Task<WeatherDto> GetCurrentAsync(
        double? lat = null,
        double? lon = null,
        string? city = null,
        string? state = null,
        string? country = null);
}

