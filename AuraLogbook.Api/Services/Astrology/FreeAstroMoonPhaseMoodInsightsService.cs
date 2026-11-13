using System.Text.Json;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Services.Astrology;

/// <summary>Builds non-causal mood/phase counts using FreeAstroAPI's date-specific moon phase endpoint.</summary>
public sealed class FreeAstroMoonPhaseMoodInsightsService : IMoonPhaseMoodInsightsService
{
    private const string BaseUrl = "https://api.freeastroapi.com/api/v1/moon/phase";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromDays(365);
    private readonly HttpClient _http;
    private readonly IMoodService _moods;
    private readonly IMemoryCache _cache;
    private readonly FreeAstroApiOptions _options;
    private readonly ILogger<FreeAstroMoonPhaseMoodInsightsService> _logger;
    private readonly FreeAstroApiRequestPacer _requestPacer;

    /// <summary>Creates the provider-backed summary service with shared date caching and request pacing.</summary>
    public FreeAstroMoonPhaseMoodInsightsService(
        HttpClient http,
        IMoodService moods,
        IMemoryCache cache,
        FreeAstroApiRequestPacer requestPacer,
        IOptions<FreeAstroApiOptions> options,
        ILogger<FreeAstroMoonPhaseMoodInsightsService> logger)
    {
        _http = http;
        _moods = moods;
        _cache = cache;
        _requestPacer = requestPacer;
        _options = options.Value;
        _logger = logger;
        _http.Timeout = TimeSpan.FromSeconds(10);
    }

    /// <inheritdoc />
    public async Task<MoonPhaseMoodInsightsDto> GetInsightsAsync(int userId, DateOnly startDate, DateOnly endDate, CancellationToken cancellationToken)
    {
        var entries = await _moods.GetEntriesForUserAsync(
            userId,
            startDate.ToDateTime(TimeOnly.MinValue),
            endDate.ToDateTime(TimeOnly.MaxValue));
        var phases = new Dictionary<string, MutablePhaseCount>(StringComparer.OrdinalIgnoreCase);
        var entriesWithPhase = 0;
        var unresolvedDates = 0;

        foreach (var date in entries.Select(entry => entry.Date).Distinct().OrderByDescending(date => date))
        {
            cancellationToken.ThrowIfCancellationRequested();
            var phase = await GetPhaseAsync(date, cancellationToken);
            if (phase is null)
            {
                unresolvedDates++;
                continue;
            }

            var sameDateEntries = entries.Where(entry => entry.Date == date).ToArray();
            foreach (var entry in sameDateEntries)
            {
                entriesWithPhase++;
                if (!phases.TryGetValue(phase, out var counts)) phases[phase] = counts = new MutablePhaseCount();
                counts.EntryCount++;
                foreach (var mood in entry.Moods.Distinct(StringComparer.OrdinalIgnoreCase))
                    counts.MoodCounts[mood] = counts.MoodCounts.GetValueOrDefault(mood) + 1;
            }
        }

        return new MoonPhaseMoodInsightsDto(
            startDate,
            endDate,
            entries.Count,
            entriesWithPhase,
            unresolvedDates,
            phases.OrderByDescending(pair => pair.Value.EntryCount)
                .Select(pair => new MoonPhaseMoodCountDto(
                    pair.Key,
                    pair.Value.EntryCount,
                    pair.Value.MoodCounts.OrderByDescending(mood => mood.Value)
                        .ToDictionary(mood => mood.Key, mood => mood.Value, StringComparer.OrdinalIgnoreCase)))
                .ToArray());
    }

    /// <summary>Uses a global date cache and serializes cache misses to respect the provider's free-tier rate limit.</summary>
    private async Task<string?> GetPhaseAsync(DateOnly date, CancellationToken cancellationToken)
    {
        var cacheKey = $"freeastro-moon-phase:{date:yyyy-MM-dd}";
        if (_cache.TryGetValue(cacheKey, out string? cached)) return cached;
        if (string.IsNullOrWhiteSpace(_options.ApiKey)) return null;

        IAsyncDisposable? requestLease = null;
        try
        {
            if (_cache.TryGetValue(cacheKey, out cached)) return cached;
            requestLease = await _requestPacer.EnterAsync(cancellationToken);
            if (_cache.TryGetValue(cacheKey, out cached)) return cached;
            using var request = new HttpRequestMessage(HttpMethod.Get, $"{BaseUrl}?date={date:yyyy-MM-dd}T12:00:00&include_interpretation=false");
            request.Headers.Add("x-api-key", _options.ApiKey);
            using var response = await _http.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("FreeAstroAPI returned {StatusCode} for a moon phase date lookup.", (int)response.StatusCode);
                return null;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            if (!document.RootElement.TryGetProperty("phase", out var phaseElement) ||
                !phaseElement.TryGetProperty("name", out var nameElement) ||
                string.IsNullOrWhiteSpace(nameElement.GetString()))
                return null;

            var phaseName = nameElement.GetString()!;
            _cache.Set(cacheKey, phaseName, CacheDuration);
            return phaseName;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning("FreeAstroAPI timed out for a moon phase date lookup.");
            return null;
        }
        catch (HttpRequestException exception)
        {
            _logger.LogWarning(exception, "FreeAstroAPI could not provide a moon phase date lookup.");
            return null;
        }
        catch (JsonException exception)
        {
            _logger.LogWarning(exception, "FreeAstroAPI returned an invalid moon phase response.");
            return null;
        }
        finally
        {
            if (requestLease is not null)
                await requestLease.DisposeAsync();
        }
    }

    private sealed class MutablePhaseCount
    {
        public int EntryCount { get; set; }
        public Dictionary<string, int> MoodCounts { get; } = new(StringComparer.OrdinalIgnoreCase);
    }
}
