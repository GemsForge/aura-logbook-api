// Services/WeatherService.cs
using AuraLogbookApi.Dtos;
using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

public class WeatherService : IWeatherService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly string _baseUrl;

    public WeatherService(HttpClient http, IConfiguration cfg)
    {
        _http = http;
        _apiKey = cfg["Weatherbit:ApiKey"];
        _baseUrl = cfg["Weatherbit:BaseUrl"];
    }

    async Task<WeatherDto> IWeatherService.GetCurrentAsync(
        double? lat,
        double? lon,
        string city,
        string state,
        string country)
    {
        // Build base URL
        // After:
        var sb = new StringBuilder($"{_baseUrl}/current?key={_apiKey}&units=I");

        // Coordinates take precedence
        if (lat.HasValue && lon.HasValue)
        {
            sb.Append($"&lat={lat.Value}&lon={lon.Value}");
        }
        else if (!string.IsNullOrWhiteSpace(city))
        {
            sb.Append($"&city={Uri.EscapeDataString(city)}");
            if (!string.IsNullOrWhiteSpace(state))
                sb.Append($"&state={Uri.EscapeDataString(state)}");
            if (!string.IsNullOrWhiteSpace(country))
                sb.Append($"&country={Uri.EscapeDataString(country)}");
        }
        else
        {
            throw new ArgumentException("Must provide either lat+lon or city (and optional state/country).");
        }

        // Call Weatherbit
        var url = sb.ToString();
        var resp = await _http.GetFromJsonAsync<WeatherbitResponse>(url);
        var w = resp.Data.First();

        return new WeatherDto
        {
            Temperature = w.Temperature,
            Description = w.Weather.Description,
            IconCode = w.Weather.Icon
        };
    }
}
