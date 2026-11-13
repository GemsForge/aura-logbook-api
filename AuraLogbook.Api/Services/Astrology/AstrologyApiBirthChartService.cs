using System.Globalization;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using AuraLogbook.Api.Models.Dto;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Services.Astrology;

/// <summary>Calls Astrology-API.io from the server and briefly caches charts by a one-way input key.</summary>
public sealed class AstrologyApiBirthChartService : IBirthChartService
{
    private const string Endpoint = "https://api.astrology-api.io/api/v3/charts/natal";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _http;
    private readonly AstrologyApiOptions _options;
    private readonly IMemoryCache _cache;
    private readonly ILogger<AstrologyApiBirthChartService> _logger;

    /// <summary>Creates a bounded-timeout provider adapter with an in-memory cache for repeat views.</summary>
    public AstrologyApiBirthChartService(
        HttpClient http,
        IOptions<AstrologyApiOptions> options,
        IMemoryCache cache,
        ILogger<AstrologyApiBirthChartService> logger)
    {
        _http = http;
        _options = options.Value;
        _cache = cache;
        _logger = logger;
        _http.Timeout = TimeSpan.FromSeconds(15);
    }

    /// <inheritdoc />
    public async Task<NatalChartDto?> GetNatalChartAsync(DateOnly birthday, string birthTime, string birthPlace, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey) ||
            !TimeOnly.TryParseExact(birthTime, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var time) ||
            string.IsNullOrWhiteSpace(birthPlace))
            return null;

        var cacheKey = CreateCacheKey(birthday, time, birthPlace);
        if (_cache.TryGetValue(cacheKey, out NatalChartDto? cached)) return cached;

        var location = ReadBirthLocation(birthPlace);
        var birthData = new Dictionary<string, object>
        {
            ["year"] = birthday.Year,
            ["month"] = birthday.Month,
            ["day"] = birthday.Day,
            ["hour"] = time.Hour,
            ["minute"] = time.Minute,
            ["city"] = location.City
        };
        if (location.CountryCode is not null) birthData["country_code"] = location.CountryCode;

        var requestBody = new
        {
            subject = new { birth_data = birthData },
            options = new
            {
                house_system = "P",
                active_points = new[] { "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Ascendant", "North Node" }
            }
        };

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, Endpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody, JsonOptions), Encoding.UTF8, "application/json");
            using var response = await _http.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Astrology-API.io returned {StatusCode} for a natal chart request.", (int)response.StatusCode);
                return null;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var payload = document.RootElement.TryGetProperty("data", out var data) ? data : document.RootElement;
            var result = new NatalChartDto("Astrology-API.io", DateTimeOffset.UtcNow, payload.Clone());
            _cache.Set(cacheKey, result, TimeSpan.FromDays(30));
            return result;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning("Astrology-API.io timed out for a natal chart request.");
            return null;
        }
        catch (HttpRequestException exception)
        {
            _logger.LogWarning(exception, "Astrology-API.io could not provide a natal chart.");
            return null;
        }
        catch (JsonException exception)
        {
            _logger.LogWarning(exception, "Astrology-API.io returned an invalid natal chart response.");
            return null;
        }
    }

    /// <summary>Hashes chart inputs so sensitive birth details are not exposed in cache keys.</summary>
    private static string CreateCacheKey(DateOnly birthday, TimeOnly time, string birthPlace)
    {
        var input = $"{birthday:yyyy-MM-dd}|{time:HH:mm}|{birthPlace.Trim().ToUpperInvariant()}";
        return $"astrology:natal:{Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(input)))}";
    }

    /// <summary>Separates an optional trailing country code from the user's saved city and region.</summary>
    private static (string City, string? CountryCode) ReadBirthLocation(string birthPlace)
    {
        var parts = birthPlace.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length > 1 && parts[^1].Length == 2 && parts[^1].All(char.IsLetter))
            return (string.Join(", ", parts[..^1]), parts[^1].ToUpperInvariant());
        return (birthPlace.Trim(), null);
    }
}
