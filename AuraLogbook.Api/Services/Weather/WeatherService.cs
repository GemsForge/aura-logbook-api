// Services/WeatherService.cs
using AuraLogbookApi.Dtos;
using Microsoft.AspNetCore.WebUtilities;
using System.Globalization;

namespace AuraLogbook.Api.Services
{
    public class WeatherService : IWeatherService
    {
        private readonly HttpClient _http;
        private readonly string _apiKey;
        private readonly string _baseUrl;

        public WeatherService(HttpClient http, IConfiguration cfg)
        {
            _http = http;
            _apiKey = cfg["Weatherbit:ApiKey"]
                ?? throw new InvalidOperationException("Weatherbit:ApiKey is not configured.");
            _baseUrl = cfg["Weatherbit:BaseUrl"]
                ?? throw new InvalidOperationException("Weatherbit:BaseUrl is not configured.");
        }

        public async Task<WeatherDto> GetCurrentAsync(
            double? lat,
            double? lon,
            string? city,
            string? state,
            string? country)
        {
            var query = new Dictionary<string, string?>
            {
                ["key"] = _apiKey,
                ["units"] = "I"
            };

            // Coordinates take precedence
            if (lat.HasValue && lon.HasValue)
            {
                query["lat"] = lat.Value.ToString(CultureInfo.InvariantCulture);
                query["lon"] = lon.Value.ToString(CultureInfo.InvariantCulture);
            }
            else if (!string.IsNullOrWhiteSpace(city))
            {
                var cityLocation = string.IsNullOrWhiteSpace(state) ? city : $"{city},{state}";
                query["city"] = cityLocation;
                if (!string.IsNullOrWhiteSpace(country))
                    query["country"] = country;
            }
            else
            {
                throw new ArgumentException("Must provide either lat+lon or city (and optional state/country).");
            }

            var url = QueryHelpers.AddQueryString($"{_baseUrl.TrimEnd('/')}/current", query);
            using var response = await _http.GetAsync(url);
            response.EnsureSuccessStatusCode();
            var resp = await response.Content.ReadFromJsonAsync<WeatherbitResponse>()
                ?? throw new InvalidOperationException("Weather provider returned an empty response.");
            var w = resp.Data.FirstOrDefault()
                ?? throw new InvalidOperationException("Weather provider returned no observations.");

            return new WeatherDto
            {
                Temperature = w.Temperature,
                Description = w.Weather.Description,
                IconCode = w.Weather.Icon
            };
        }
    }
}
