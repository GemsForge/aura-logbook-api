using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using AuraLogbook.Api.Models.Dto;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Services.Astrology;

/// <summary>Resolves a saved birthplace and calculates tropical placements using FreeAstrologyAPI.</summary>
public sealed class FreeAstrologyBirthChartService : IBirthChartService
{
    private const string BaseUrl = "https://json.freeastrologyapi.com/";
    private readonly HttpClient _http;
    private readonly FreeAstrologyApiOptions _options;
    private readonly IMemoryCache _cache;
    private readonly FreeAstrologyApiRequestPacer _pacer;
    private readonly ILogger<FreeAstrologyBirthChartService> _logger;

    /// <summary>Uses a server-only key, bounded requests, shared rate pacing, and private in-memory chart caching.</summary>
    public FreeAstrologyBirthChartService(HttpClient http, IOptions<FreeAstrologyApiOptions> options,
        IMemoryCache cache, FreeAstrologyApiRequestPacer pacer, ILogger<FreeAstrologyBirthChartService> logger)
    {
        _http = http;
        _options = options.Value;
        _cache = cache;
        _pacer = pacer;
        _logger = logger;
        _http.Timeout = TimeSpan.FromSeconds(15);
    }

    /// <inheritdoc />
    public async Task<NatalChartDto?> GetNatalChartAsync(DateOnly birthday, string birthTime, string birthPlace, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey) || string.IsNullOrWhiteSpace(birthPlace) ||
            !TimeOnly.TryParseExact(birthTime, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var time))
            return null;

        var input = $"{birthday:yyyy-MM-dd}|{time:HH:mm}|{birthPlace.Trim().ToUpperInvariant()}";
        var cacheKey = $"freeastrology:natal:v1:{Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(input)))}";
        if (_cache.TryGetValue(cacheKey, out NatalChartDto? cached)) return cached;

        try
        {
            var geo = await PostAsync("geo-details", new { location = birthPlace.Trim() }, cancellationToken);
            var location = geo is { } places ? ReadLocation(places, birthPlace) : null;
            if (location is null) return null;

            // Use the offset on the birth date, including historical DST, rather than today's offset.
            var zone = TimeZoneInfo.FindSystemTimeZoneById(location.TimeZone);
            var localBirth = birthday.ToDateTime(time, DateTimeKind.Unspecified);
            if (zone.IsInvalidTime(localBirth) || zone.IsAmbiguousTime(localBirth)) return null;

            var payload = await PostAsync("western/planets", new
            {
                year = birthday.Year, month = birthday.Month, date = birthday.Day,
                hours = time.Hour, minutes = time.Minute, seconds = 0,
                latitude = location.Latitude, longitude = location.Longitude,
                timezone = zone.GetUtcOffset(localBirth).TotalHours,
                config = new { observation_point = "geocentric", ayanamsha = "tropical", language = "en" }
            }, cancellationToken);
            if (payload is null || payload.Value.ValueKind != JsonValueKind.Object ||
                !payload.Value.TryGetProperty("output", out var output) || output.ValueKind != JsonValueKind.Array)
                return null;

            // Normalize the provider's localized labels into the existing UI placement contract.
            var placements = new List<Placement>();
            foreach (var item in output.EnumerateArray())
            {
                var name = ReadLocalized(item, "planet");
                if (name is null || !item.TryGetProperty("zodiac_sign", out var zodiac)) continue;
                var sign = ReadLocalized(zodiac, "name");
                if (sign is null || !TryNumber(item, "normDegree", out var degree) || degree < 0 || degree >= 30) continue;
                placements.Add(new Placement(name, sign, degree));
            }
            if (placements.Count == 0) return null;

            var chart = JsonSerializer.SerializeToElement(new { placements }, new JsonSerializerOptions(JsonSerializerDefaults.Web));
            var result = new NatalChartDto("FreeAstrologyAPI", DateTimeOffset.UtcNow, chart);
            _cache.Set(cacheKey, result, TimeSpan.FromDays(30));
            return result;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning("FreeAstrologyAPI timed out for a birth-chart request.");
        }
        catch (HttpRequestException)
        {
            // Do not log request bodies, keys, or saved birth details on provider failures.
            _logger.LogWarning("FreeAstrologyAPI could not provide a birth chart.");
        }
        catch (JsonException)
        {
            _logger.LogWarning("FreeAstrologyAPI returned an invalid birth-chart response.");
        }
        catch (TimeZoneNotFoundException)
        {
            _logger.LogWarning("The birth location's time zone could not be resolved.");
        }
        catch (InvalidTimeZoneException)
        {
            _logger.LogWarning("The birth location's time-zone rules are unavailable.");
        }
        return null;
    }

    /// <summary>Posts to a fixed provider endpoint, honoring pacing and both HTTP and payload error statuses.</summary>
    private async Task<JsonElement?> PostAsync(string endpoint, object body, CancellationToken cancellationToken)
    {
        await using var lease = await _pacer.EnterAsync(cancellationToken);
        using var request = new HttpRequestMessage(HttpMethod.Post, BaseUrl + endpoint);
        request.Headers.Add("x-api-key", _options.ApiKey);
        request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
        using var response = await _http.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("FreeAstrologyAPI returned {StatusCode} for {Endpoint}.", (int)response.StatusCode, endpoint);
            return null;
        }
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var root = document.RootElement;
        if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("statusCode", out var status) &&
            (status.ValueKind != JsonValueKind.Number || !status.TryGetInt32(out var code) || code != 200)) return null;
        return root.Clone();
    }

    /// <summary>Requires a single matching city/region/country; never silently picks among ambiguous places.</summary>
    private static BirthLocation? ReadLocation(JsonElement places, string birthPlace)
    {
        if (places.ValueKind != JsonValueKind.Array) return null;
        var parts = birthPlace.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0) return null;
        var terms = new List<string[]> { new[] { parts[0] } };
        foreach (var part in parts.Skip(1))
        {
            var aliases = new List<string> { part };
            if (part.Length == 2)
            {
                try { aliases.Add(new RegionInfo(part.ToUpperInvariant()).EnglishName); }
                catch (ArgumentException) { /* An unknown region remains a literal match. */ }
            }
            terms.Add(aliases.ToArray());
        }

        var matches = new List<BirthLocation>();
        foreach (var place in places.EnumerateArray())
        {
            if (place.ValueKind != JsonValueKind.Object) continue;
            var names = new[] { "location_name", "complete_name", "country", "administrative_zone_1", "administrative_zone_2" }
                .Select(key => ReadString(place, key)).Where(value => value is not null)
                .SelectMany(value => value!.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)).ToArray();
            if (!terms.All(aliases => aliases.Any(alias => names.Contains(alias, StringComparer.OrdinalIgnoreCase)))) continue;
            if (!TryNumber(place, "latitude", out var lat) || Math.Abs(lat) > 90 ||
                !TryNumber(place, "longitude", out var lon) || Math.Abs(lon) > 180 ||
                ReadString(place, "timezone") is not { Length: > 0 } zone) continue;
            matches.Add(new BirthLocation(lat, lon, zone));
        }
        var distinct = matches.Distinct().ToArray();
        return distinct.Length == 1 ? distinct[0] : null;
    }

    /// <summary>Reads an English label from the documented localized response objects.</summary>
    private static string? ReadLocalized(JsonElement parent, string key) =>
        parent.ValueKind == JsonValueKind.Object && parent.TryGetProperty(key, out var label) ? ReadString(label, "en") : null;

    /// <summary>Reads a nonblank string only from a JSON object.</summary>
    private static string? ReadString(JsonElement parent, string key) =>
        parent.ValueKind == JsonValueKind.Object && parent.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String &&
        !string.IsNullOrWhiteSpace(value.GetString()) ? value.GetString() : null;

    /// <summary>Rejects missing, nonnumeric, and nonfinite provider coordinates or degrees.</summary>
    private static bool TryNumber(JsonElement parent, string key, out double number)
    {
        number = 0;
        return parent.ValueKind == JsonValueKind.Object && parent.TryGetProperty(key, out var value) &&
            value.ValueKind == JsonValueKind.Number && value.TryGetDouble(out number) && double.IsFinite(number);
    }

    private sealed record BirthLocation(double Latitude, double Longitude, string TimeZone);
    private sealed record Placement(string Name, string Sign, double Degree);
}
