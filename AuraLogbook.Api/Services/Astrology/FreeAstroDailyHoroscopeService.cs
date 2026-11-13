using System.Text.Json;
using AuraLogbook.Api.Models.Dto;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Services.Astrology;

/// <summary>Loads and caches FreeAstroAPI daily sign readings without exposing provider credentials.</summary>
public sealed class FreeAstroDailyHoroscopeService : IDailyHoroscopeService
{
    private const string Endpoint = "https://api.freeastroapi.com/api/v2/horoscope/daily/sign";
    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;
    private readonly FreeAstroApiOptions _options;
    private readonly FreeAstroApiRequestPacer _pacer;
    private readonly ILogger<FreeAstroDailyHoroscopeService> _logger;

    /// <summary>Creates the provider adapter with shared caching and account-wide request pacing.</summary>
    public FreeAstroDailyHoroscopeService(
        HttpClient http,
        IMemoryCache cache,
        IOptions<FreeAstroApiOptions> options,
        FreeAstroApiRequestPacer pacer,
        ILogger<FreeAstroDailyHoroscopeService> logger)
    {
        _http = http;
        _cache = cache;
        _options = options.Value;
        _pacer = pacer;
        _logger = logger;
        _http.Timeout = TimeSpan.FromSeconds(10);
    }

    /// <inheritdoc />
    public async Task<DailyHoroscopeDto?> GetDailyAsync(string sign, CancellationToken cancellationToken)
    {
        var normalizedSign = sign.Trim().ToLowerInvariant();
        var cacheKey = $"freeastro-daily-horoscope:{DateOnly.FromDateTime(DateTime.UtcNow):yyyy-MM-dd}:{normalizedSign}";
        if (_cache.TryGetValue(cacheKey, out DailyHoroscopeDto? cached)) return cached;
        if (string.IsNullOrWhiteSpace(_options.ApiKey)) return null;

        IAsyncDisposable? requestLease = null;
        try
        {
            requestLease = await _pacer.EnterAsync(cancellationToken);
            if (_cache.TryGetValue(cacheKey, out cached)) return cached;

            using var request = new HttpRequestMessage(HttpMethod.Get,
                $"{Endpoint}?sign={Uri.EscapeDataString(normalizedSign)}&date=today");
            request.Headers.Add("x-api-key", _options.ApiKey);
            using var response = await _http.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("FreeAstroAPI returned {StatusCode} for a daily horoscope lookup.", (int)response.StatusCode);
                return null;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var text = ReadText(document.RootElement);
            if (string.IsNullOrWhiteSpace(text)) return null;

            var result = new DailyHoroscopeDto(normalizedSign, DateOnly.FromDateTime(DateTime.UtcNow), text, "FreeAstroAPI");
            _cache.Set(cacheKey, result, TimeSpan.FromHours(24));
            return result;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning("FreeAstroAPI timed out for a daily horoscope lookup.");
            return null;
        }
        catch (HttpRequestException exception)
        {
            _logger.LogWarning(exception, "FreeAstroAPI could not provide a daily horoscope.");
            return null;
        }
        catch (JsonException exception)
        {
            _logger.LogWarning(exception, "FreeAstroAPI returned an invalid daily horoscope response.");
            return null;
        }
        finally
        {
            if (requestLease is not null)
                await requestLease.DisposeAsync();
        }
    }

    /// <summary>Reads the documented text field while tolerating the provider's optional data envelope.</summary>
    private static string? ReadText(JsonElement root)
    {
        if (root.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object)
            root = data;
        if (root.TryGetProperty("content", out var content) && content.ValueKind == JsonValueKind.Object &&
            content.TryGetProperty("text", out var nestedText))
            return nestedText.GetString();
        return root.TryGetProperty("text", out var text) ? text.GetString() : null;
    }
}
