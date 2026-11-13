using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Services.Faith;

/// <summary>
/// One passage for exactly one selected framework (#392). The API never returns passages from more
/// than one tradition, and only fields required for display and attribution.
/// </summary>
/// <param name="Framework">The framework key that was requested: <c>christian</c>, <c>muslim</c>, or <c>jewish</c>.</param>
/// <param name="Reference">Human-readable reference, e.g. <c>Psalms 23:1</c>.</param>
/// <param name="Text">Plain passage text with provider markup removed.</param>
/// <param name="Translation">Translation or version name shown with the text.</param>
/// <param name="Attribution">Provider and license attribution that must be displayed with the text.</param>
/// <param name="ReadingUrl">The provider's own reading page for this passage.</param>
public sealed record SacredPassageDto(string Framework, string Reference, string Text, string Translation, string Attribution, string ReadingUrl);

/// <summary>Supported framework keys. Matches the UI's faith tradition choices.</summary>
public static class FaithFrameworks
{
    public const string Christian = "christian";
    public const string Muslim = "muslim";
    public const string Jewish = "jewish";

    /// <summary>Normalizes a requested key; returns null for anything unsupported (including custom or neutral).</summary>
    public static string? Normalize(string? framework) => framework?.Trim().ToLowerInvariant() switch
    {
        Christian => Christian,
        Muslim => Muslim,
        Jewish => Jewish,
        _ => null,
    };
}

/// <summary>Fetches one daily passage for a single framework.</summary>
public interface ISacredTextProvider
{
    /// <summary>The framework this provider serves.</summary>
    string Framework { get; }

    /// <summary>Returns the passage for <paramref name="date"/>, or null when the provider is not configured.</summary>
    /// <exception cref="HttpRequestException">The provider returned an error or an unusable response.</exception>
    Task<SacredPassageDto?> GetDailyAsync(DateOnly date, CancellationToken cancellationToken);
}

/// <summary>Provider settings. Keys stay server-side; nothing here is sent to clients.</summary>
public sealed class SacredTextOptions
{
    public const string SectionName = "SacredText";

    /// <summary>
    /// Optional API.Bible key. When empty, the Christian passage comes from the public-domain
    /// World English Bible via bible-api.com, which needs no key or license agreement.
    /// </summary>
    public string? ApiBibleKey { get; set; }
    /// <summary>API.Bible Bible ID for a translation whose license permits display in this app.</summary>
    public string? ApiBibleBibleId { get; set; }
    public string ApiBibleBaseUrl { get; set; } = "https://api.scripture.api.bible/v1";
    public string QuranBaseUrl { get; set; } = "https://api.quran.com/api/v4";
    /// <summary>Quran.com translation resource ID (20 = Saheeh International).</summary>
    public int QuranTranslationId { get; set; } = 20;
    public string SefariaBaseUrl { get; set; } = "https://www.sefaria.org/api/v3";
    /// <summary>Sefaria version pinned to a public-domain translation (JPS 1917) so no non-commercial license applies.</summary>
    public string SefariaVersion { get; set; } = "english|The Holy Scriptures: A New Translation (JPS 1917)";
    /// <summary>Keyless public-domain Bible source used when no API.Bible key is configured.</summary>
    public string PublicDomainBibleBaseUrl { get; set; } = "https://bible-api.com";
    /// <summary>bible-api.com translation ID; <c>web</c> is the public-domain World English Bible.</summary>
    public string PublicDomainBibleTranslation { get; set; } = "web";
    /// <summary>How long a day's passage is cached, to respect provider rate limits.</summary>
    public TimeSpan CacheDuration { get; set; } = TimeSpan.FromHours(6);
}

/// <summary>Curated daily references. Short, widely read passages suited to a reflective daily view.</summary>
internal static class DailyReferences
{
    // API.Bible verse IDs (BOOK.CHAPTER.VERSE) with display references.
    public static readonly (string Id, string Display)[] Bible =
    [
        ("PSA.23.1", "Psalm 23:1"), ("PSA.46.10", "Psalm 46:10"), ("MAT.5.9", "Matthew 5:9"), ("ROM.12.12", "Romans 12:12"),
        ("PHP.4.8", "Philippians 4:8"), ("1CO.13.4", "1 Corinthians 13:4"), ("ISA.40.31", "Isaiah 40:31"), ("MIC.6.8", "Micah 6:8"),
    ];

    // Quran verse keys (SURAH:AYAH).
    public static readonly string[] Quran = ["2:286", "94:5", "13:28", "2:153", "93:3", "49:13", "39:53", "65:3"];

    // Sefaria references. Tanakh only, because the pinned public-domain JPS 1917 version covers the Tanakh.
    public static readonly (string Ref, string Display)[] Sefaria =
    [
        ("Psalms.23.1", "Psalms 23:1"), ("Psalms.121.1", "Psalms 121:1"), ("Micah.6.8", "Micah 6:8"), ("Psalms.118.24", "Psalms 118:24"),
        ("Proverbs.3.17", "Proverbs 3:17"), ("Psalms.34.15", "Psalms 34:15"), ("Ecclesiastes.3.1", "Ecclesiastes 3:1"), ("Isaiah.40.31", "Isaiah 40:31"),
    ];

    public static T For<T>(T[] items, DateOnly date) => items[date.DayNumber % items.Length];
}

internal static partial class ProviderText
{
    [GeneratedRegex("<sup[^>]*>.*?</sup>|<i class=\"footnote\">.*?</i>", RegexOptions.Singleline)]
    private static partial Regex Footnotes();

    [GeneratedRegex("<[^>]+>")]
    private static partial Regex Tags();

    /// <summary>
    /// Removes footnotes and HTML tags, decodes entities, and collapses whitespace. Tags become spaces so
    /// line breaks such as Sefaria's <c>&lt;br&gt;</c> never glue two lines together.
    /// </summary>
    public static string Clean(string value)
    {
        var text = Tags().Replace(Footnotes().Replace(value, ""), " ");
        text = Regex.Replace(WebUtility.HtmlDecode(text), @"\s+", " ").Trim();
        return Regex.Replace(text, @"\s+([,.;:!?])", "$1"); // no stray space before punctuation left by removed tags
    }

    public static async Task<JsonElement> GetJsonAsync(HttpClient client, HttpRequestMessage request, CancellationToken ct)
    {
        using var response = await client.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException($"Provider returned {(int)response.StatusCode}.", null, response.StatusCode);
        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
        return document.RootElement.Clone();
    }

    public static HttpRequestException Unusable(string provider) => new($"{provider} returned an unusable response.");
}

/// <summary>
/// Bible text. Uses API.Bible when a key and licensed Bible ID are configured; otherwise the
/// public-domain World English Bible from bible-api.com, so the Christian passage works with no key.
/// </summary>
public sealed class ApiBibleProvider(IHttpClientFactory factory, IOptions<SacredTextOptions> options) : ISacredTextProvider
{
    public string Framework => FaithFrameworks.Christian;

    public async Task<SacredPassageDto?> GetDailyAsync(DateOnly date, CancellationToken cancellationToken)
    {
        var o = options.Value;
        var (id, display) = DailyReferences.For(DailyReferences.Bible, date);
        if (string.IsNullOrWhiteSpace(o.ApiBibleKey) || string.IsNullOrWhiteSpace(o.ApiBibleBibleId))
            return await GetPublicDomainAsync(o, display, cancellationToken);
        using var request = new HttpRequestMessage(HttpMethod.Get,
            $"{o.ApiBibleBaseUrl.TrimEnd('/')}/bibles/{Uri.EscapeDataString(o.ApiBibleBibleId)}/verses/{id}?content-type=text&include-notes=false&include-titles=false&include-verse-numbers=false");
        request.Headers.Add("api-key", o.ApiBibleKey);
        var root = await ProviderText.GetJsonAsync(factory.CreateClient(nameof(ApiBibleProvider)), request, cancellationToken);
        if (!root.TryGetProperty("data", out var data) || !data.TryGetProperty("content", out var content))
            throw ProviderText.Unusable("API.Bible");
        var copyright = data.TryGetProperty("copyright", out var c) ? ProviderText.Clean(c.GetString() ?? "") : "";
        var text = ProviderText.Clean(content.GetString() ?? "");
        if (text.Length == 0) throw ProviderText.Unusable("API.Bible");
        return new SacredPassageDto(Framework, display, text, o.ApiBibleBibleId,
            string.IsNullOrWhiteSpace(copyright) ? "Scripture via API.Bible" : $"{copyright} Provided by API.Bible.",
            $"https://www.bible.com/search/bible?q={Uri.EscapeDataString(display)}");
    }

    /// <summary>Fetches the World English Bible (public domain) from bible-api.com; no key required.</summary>
    private async Task<SacredPassageDto> GetPublicDomainAsync(SacredTextOptions o, string display, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get,
            $"{o.PublicDomainBibleBaseUrl.TrimEnd('/')}/{Uri.EscapeDataString(display)}?translation={Uri.EscapeDataString(o.PublicDomainBibleTranslation)}");
        var root = await ProviderText.GetJsonAsync(factory.CreateClient(nameof(ApiBibleProvider)), request, cancellationToken);
        var text = root.TryGetProperty("text", out var t) ? ProviderText.Clean(t.GetString() ?? "") : "";
        if (text.Length == 0) throw ProviderText.Unusable("bible-api.com");
        var translation = root.TryGetProperty("translation_name", out var name) ? name.GetString() ?? "World English Bible" : "World English Bible";
        return new SacredPassageDto(Framework, display, text, translation,
            $"{translation} (public domain), via bible-api.com.",
            $"https://www.bible.com/search/bible?q={Uri.EscapeDataString(display)}");
    }
}

/// <summary>Quran text and translation from the Quran.com API (Quran Foundation). No key required for the public content API.</summary>
public sealed class QuranProvider(IHttpClientFactory factory, IOptions<SacredTextOptions> options) : ISacredTextProvider
{
    public string Framework => FaithFrameworks.Muslim;

    public async Task<SacredPassageDto?> GetDailyAsync(DateOnly date, CancellationToken cancellationToken)
    {
        var o = options.Value;
        var key = DailyReferences.For(DailyReferences.Quran, date);
        using var request = new HttpRequestMessage(HttpMethod.Get,
            $"{o.QuranBaseUrl.TrimEnd('/')}/verses/by_key/{key}?translations={o.QuranTranslationId}&fields=verse_key");
        var root = await ProviderText.GetJsonAsync(factory.CreateClient(nameof(QuranProvider)), request, cancellationToken);
        if (!root.TryGetProperty("verse", out var verse) || !verse.TryGetProperty("translations", out var translations)
            || translations.GetArrayLength() == 0)
            throw ProviderText.Unusable("Quran.com");
        var text = ProviderText.Clean(translations[0].GetProperty("text").GetString() ?? "");
        if (text.Length == 0) throw ProviderText.Unusable("Quran.com");
        var (surah, ayah) = (key.Split(':')[0], key.Split(':')[1]);
        return new SacredPassageDto(Framework, $"Qur’an {key}", text, "Saheeh International",
            "Translation via Quran.com (Quran Foundation).", $"https://quran.com/{surah}/{ayah}");
    }
}

/// <summary>Jewish texts from Sefaria. Keyless; the English version and its license are returned with the text.</summary>
public sealed class SefariaProvider(IHttpClientFactory factory, IOptions<SacredTextOptions> options) : ISacredTextProvider
{
    public string Framework => FaithFrameworks.Jewish;

    public async Task<SacredPassageDto?> GetDailyAsync(DateOnly date, CancellationToken cancellationToken)
    {
        var (reference, display) = DailyReferences.For(DailyReferences.Sefaria, date);
        using var request = new HttpRequestMessage(HttpMethod.Get,
            $"{options.Value.SefariaBaseUrl.TrimEnd('/')}/texts/{reference}?version={Uri.EscapeDataString(options.Value.SefariaVersion)}");
        var root = await ProviderText.GetJsonAsync(factory.CreateClient(nameof(SefariaProvider)), request, cancellationToken);
        if (!root.TryGetProperty("versions", out var versions) || versions.GetArrayLength() == 0)
            throw ProviderText.Unusable("Sefaria");
        var version = versions[0];
        var raw = version.GetProperty("text");
        var text = ProviderText.Clean(raw.ValueKind == JsonValueKind.Array
            ? string.Join(" ", raw.EnumerateArray().Select(t => t.ValueKind == JsonValueKind.String ? t.GetString() : ""))
            : raw.GetString() ?? "");
        if (text.Length == 0) throw ProviderText.Unusable("Sefaria");
        var title = version.TryGetProperty("versionTitle", out var vt) ? vt.GetString() ?? "English" : "English";
        var license = version.TryGetProperty("license", out var lic) ? lic.GetString() : null;
        return new SacredPassageDto(Framework, display, text, title,
            string.IsNullOrWhiteSpace(license) ? "Text via Sefaria." : $"Text via Sefaria. License: {license}.",
            $"https://www.sefaria.org/{reference}");
    }
}

/// <summary>Routes a request to the one provider for the selected framework and caches each day's passage.</summary>
public sealed class SacredTextService(IEnumerable<ISacredTextProvider> providers, IMemoryCache cache, IOptions<SacredTextOptions> options)
{
    private readonly Dictionary<string, ISacredTextProvider> _providers = providers.ToDictionary(p => p.Framework);

    /// <summary>
    /// Returns the passage for one supported framework, or null when the framework is unsupported or its
    /// provider is not configured. Never falls back to another tradition.
    /// </summary>
    public async Task<SacredPassageDto?> GetDailyAsync(string? framework, DateOnly date, CancellationToken cancellationToken)
    {
        var key = FaithFrameworks.Normalize(framework);
        if (key is null || !_providers.TryGetValue(key, out var provider)) return null;
        var cacheKey = $"sacred-text:{key}:{date:yyyy-MM-dd}";
        if (cache.TryGetValue(cacheKey, out SacredPassageDto? cached)) return cached;
        var passage = await provider.GetDailyAsync(date, cancellationToken);
        if (passage is not null) cache.Set(cacheKey, passage, options.Value.CacheDuration);
        return passage;
    }
}
