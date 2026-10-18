using AuraLogbookApi.Dtos;
using Microsoft.AspNetCore.WebUtilities;
using System.Globalization;
using System.Text.Json;

namespace AuraLogbook.Api.Services
{
    public class WeatherService(HttpClient http) : IWeatherService
    {
        private const string ForecastUrl = "https://api.open-meteo.com/v1/forecast";
        private const string GeocodingUrl = "https://geocoding-api.open-meteo.com/v1/search";
        private readonly HttpClient _http = http;

        public async Task<WeatherDto> GetCurrentAsync(
            double? lat,
            double? lon,
            string? city,
            string? state,
            string? country)
        {
            double latitude;
            double longitude;

            if (lat.HasValue && lon.HasValue)
            {
                latitude = lat.Value;
                longitude = lon.Value;
            }
            else if (!string.IsNullOrWhiteSpace(city))
            {
                (latitude, longitude) = await FindCoordinatesAsync(city, state, country);
            }
            else
            {
                throw new ArgumentException("Must provide either lat+lon or city (and optional state/country).");
            }

            var query = new Dictionary<string, string?>
            {
                ["latitude"] = latitude.ToString(CultureInfo.InvariantCulture),
                ["longitude"] = longitude.ToString(CultureInfo.InvariantCulture),
                ["current"] = "temperature_2m,weather_code,is_day",
                ["temperature_unit"] = "fahrenheit",
                ["timezone"] = "auto"
            };
            var url = QueryHelpers.AddQueryString(ForecastUrl, query);
            using var response = await _http.GetAsync(url);
            response.EnsureSuccessStatusCode();
            using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());

            if (!document.RootElement.TryGetProperty("current", out var current))
                throw new InvalidOperationException("Weather provider returned no current conditions.");

            var temperature = current.GetProperty("temperature_2m").GetDouble();
            var weatherCode = current.GetProperty("weather_code").GetInt32();
            var isDay = current.GetProperty("is_day").GetInt32() == 1;
            var (description, icon) = MapWeatherCode(weatherCode);

            return new WeatherDto
            {
                Temperature = temperature,
                Description = description,
                IconCode = icon + (isDay ? "d" : "n")
            };
        }

        private async Task<(double Latitude, double Longitude)> FindCoordinatesAsync(
            string city,
            string? state,
            string? country)
        {
            var name = string.IsNullOrWhiteSpace(state) ? city : $"{city}, {state}";
            var query = new Dictionary<string, string?>
            {
                ["name"] = name,
                ["count"] = "10",
                ["language"] = "en",
                ["format"] = "json"
            };
            if (!string.IsNullOrWhiteSpace(country))
                query["countryCode"] = country;

            using var response = await _http.GetAsync(QueryHelpers.AddQueryString(GeocodingUrl, query));
            response.EnsureSuccessStatusCode();
            using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());

            if (!document.RootElement.TryGetProperty("results", out var results) || results.GetArrayLength() == 0)
                throw new ArgumentException($"Could not find the location '{name}'.");

            var match = results.EnumerateArray().FirstOrDefault(result =>
                (string.IsNullOrWhiteSpace(country) ||
                 string.Equals(result.GetProperty("country_code").GetString(), country, StringComparison.OrdinalIgnoreCase)) &&
                (string.IsNullOrWhiteSpace(state) ||
                 string.Equals(result.TryGetProperty("admin1", out var admin1) ? admin1.GetString() : null,
                     state, StringComparison.OrdinalIgnoreCase)));

            if (match.ValueKind == JsonValueKind.Undefined)
                match = results[0];

            return (match.GetProperty("latitude").GetDouble(), match.GetProperty("longitude").GetDouble());
        }

        private static (string Description, string Icon) MapWeatherCode(int code) => code switch
        {
            0 => ("Clear sky", "c01"),
            1 => ("Mainly clear", "c02"),
            2 => ("Partly cloudy", "c03"),
            3 => ("Overcast", "c04"),
            45 or 48 => ("Fog", "f01"),
            51 => ("Light drizzle", "d01"),
            53 => ("Drizzle", "d02"),
            55 or 56 or 57 => ("Heavy or freezing drizzle", "d03"),
            61 => ("Light rain", "r01"),
            63 => ("Rain", "r02"),
            65 or 66 or 67 => ("Heavy or freezing rain", "r03"),
            71 => ("Light snow", "s01"),
            73 => ("Snow", "s02"),
            75 or 77 => ("Heavy snow", "s03"),
            80 => ("Light rain showers", "r04"),
            81 => ("Rain showers", "r05"),
            82 => ("Heavy rain showers", "r06"),
            85 => ("Light snow showers", "s05"),
            86 => ("Heavy snow showers", "s06"),
            95 => ("Thunderstorm", "t01"),
            96 or 99 => ("Thunderstorm with hail", "t02"),
            _ => ("Unknown conditions", "c04")
        };
    }
}
