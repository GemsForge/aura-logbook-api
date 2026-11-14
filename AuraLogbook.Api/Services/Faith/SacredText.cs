using System.Net;
using System.Text;
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

/// <summary>One provider segment, with optional original-language text for paired RTL reading.</summary>
public sealed record SacredTextSegmentDto(string Reference, string Text, string? SourceText = null);

/// <summary>A navigable, provider-sourced section and the exact version metadata needed by annotations.</summary>
public sealed record SacredTextSectionDto(
    string Framework,
    string Reference,
    string Translation,
    string SourceVersion,
    string Attribution,
    string ReadingUrl,
    string TextLanguage,
    string TextDirection,
    string? SourceLanguage,
    string? SourceDirection,
    IReadOnlyList<SacredTextSegmentDto> Segments,
    string? PreviousReference = null,
    string? NextReference = null,
    string? SourceLicenseUrl = null);

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

    /// <summary>Returns one navigable section for the requested provider reference.</summary>
    /// <exception cref="HttpRequestException">The provider returned an error or an unusable response.</exception>
    Task<SacredTextSectionDto> GetSectionAsync(string reference, CancellationToken cancellationToken);
}

/// <summary>Provider settings. Keys stay server-side; nothing here is sent to clients.</summary>
public sealed class SacredTextOptions
{
    public const string SectionName = "SacredText";

    /// <summary>
    /// Optional API.Bible key. Keep unset until the client tracks each displayed reading with FUMS;
    /// when empty, Christian text comes from the public-domain World English Bible via bible-api.com.
    /// </summary>
    public string? ApiBibleKey { get; set; }
    /// <summary>API.Bible Bible ID for a translation whose license permits display in this app; keep unset until FUMS tracks each displayed reading.</summary>
    public string? ApiBibleBibleId { get; set; }
    /// <summary>Human-readable API.Bible edition title shown to readers; falls back to the configured Bible ID when unset.</summary>
    public string? ApiBibleTranslationName { get; set; }
    public string ApiBibleBaseUrl { get; set; } = "https://api.scripture.api.bible/v1";
    /// <summary>Legacy public Quran.com endpoint retained for setups without Quran Foundation credentials.</summary>
    public string QuranBaseUrl { get; set; } = "https://api.quran.com/api/v4";
    /// <summary>Quran Foundation authenticated content API base URL.</summary>
    public string QuranContentApiBaseUrl { get; set; } = "https://apis.quran.foundation/content/api/v4";
    /// <summary>Quran Foundation OAuth service base URL.</summary>
    public string QuranOAuthBaseUrl { get; set; } = "https://oauth2.quran.foundation";
    /// <summary>Optional server-side Quran Foundation client ID.</summary>
    public string? QuranClientId { get; set; }
    /// <summary>Optional server-side Quran Foundation client secret.</summary>
    public string? QuranClientSecret { get; set; }
    /// <summary>Approved Quran Foundation OAuth scope used for content requests.</summary>
    public string QuranScope { get; set; } = "content";
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
        var translationName = string.IsNullOrWhiteSpace(o.ApiBibleTranslationName) ? o.ApiBibleBibleId : o.ApiBibleTranslationName.Trim();
        return new SacredPassageDto(Framework, display, text, translationName,
            string.IsNullOrWhiteSpace(copyright) ? "Scripture via API.Bible" : $"{copyright} Provided by API.Bible.",
            $"https://www.bible.com/search/bible?q={Uri.EscapeDataString(display)}");
    }

    /// <inheritdoc />
    public async Task<SacredTextSectionDto> GetSectionAsync(string reference, CancellationToken cancellationToken)
    {
        if (!SacredTextReferenceParser.TryParseBookChapter(reference, out var book, out var chapter))
            throw new ArgumentException("Provide a book and chapter reference.", nameof(reference));

        var o = options.Value;
        if (string.IsNullOrWhiteSpace(o.ApiBibleKey) || string.IsNullOrWhiteSpace(o.ApiBibleBibleId))
            return await GetPublicDomainSectionAsync(o, book, chapter, cancellationToken);

        var client = factory.CreateClient(nameof(ApiBibleProvider));
        using var booksRequest = new HttpRequestMessage(HttpMethod.Get,
            $"{o.ApiBibleBaseUrl.TrimEnd('/')}/bibles/{Uri.EscapeDataString(o.ApiBibleBibleId)}/books");
        booksRequest.Headers.Add("api-key", o.ApiBibleKey);
        var booksRoot = await ProviderText.GetJsonAsync(client, booksRequest, cancellationToken);
        if (!booksRoot.TryGetProperty("data", out var books) || books.ValueKind != JsonValueKind.Array)
            throw ProviderText.Unusable("API.Bible");
        var bookId = books.EnumerateArray()
            .FirstOrDefault(item => item.TryGetProperty("name", out var name)
                && string.Equals(name.GetString(), book, StringComparison.OrdinalIgnoreCase));
        if (bookId.ValueKind != JsonValueKind.Object || !bookId.TryGetProperty("id", out var id))
            throw new HttpRequestException("The selected Bible does not contain that book.", null, HttpStatusCode.NotFound);

        var bookIdentifier = id.GetString() ?? "";
        using var chaptersRequest = new HttpRequestMessage(HttpMethod.Get,
            $"{o.ApiBibleBaseUrl.TrimEnd('/')}/bibles/{Uri.EscapeDataString(o.ApiBibleBibleId)}/books/{Uri.EscapeDataString(bookIdentifier)}/chapters");
        chaptersRequest.Headers.Add("api-key", o.ApiBibleKey);
        var chaptersRoot = await ProviderText.GetJsonAsync(client, chaptersRequest, cancellationToken);
        var chapterItems = chaptersRoot.TryGetProperty("data", out var chapterData) && chapterData.ValueKind == JsonValueKind.Array
            ? chapterData.EnumerateArray().ToList() : [];
        var chapterIndex = chapterItems.FindIndex(item =>
            item.TryGetProperty("number", out var number) && int.TryParse(number.ToString(), out var chapterNumber) && chapterNumber == chapter);
        var previousReference = chapterIndex > 0 ? ApiBibleChapterReference(chapterItems[chapterIndex - 1]) : null;
        var nextReference = chapterIndex >= 0 && chapterIndex + 1 < chapterItems.Count ? ApiBibleChapterReference(chapterItems[chapterIndex + 1]) : null;

        var chapterId = $"{id.GetString()}.{chapter}";
        using var request = new HttpRequestMessage(HttpMethod.Get,
            $"{o.ApiBibleBaseUrl.TrimEnd('/')}/bibles/{Uri.EscapeDataString(o.ApiBibleBibleId)}/chapters/{Uri.EscapeDataString(chapterId)}?content-type=json&include-notes=false&include-titles=false&include-verse-numbers=true");
        request.Headers.Add("api-key", o.ApiBibleKey);
        var root = await ProviderText.GetJsonAsync(client, request, cancellationToken);
        if (!root.TryGetProperty("data", out var data) || !data.TryGetProperty("content", out var content))
            throw ProviderText.Unusable("API.Bible");
        var segments = SacredTextChapterParser.FromApiBibleJson(content);
        if (segments.Count == 0) throw ProviderText.Unusable("API.Bible");
        var display = data.TryGetProperty("reference", out var referenceValue) ? referenceValue.GetString() ?? $"{book} {chapter}" : $"{book} {chapter}";
        segments = segments.Select(segment => segment with { Reference = $"{display}:{segment.Reference}" }).ToList();
        var copyright = data.TryGetProperty("copyright", out var copyrightValue) ? ProviderText.Clean(copyrightValue.GetString() ?? "") : "";
        var attribution = string.IsNullOrWhiteSpace(copyright) ? "Scripture via API.Bible." : $"{copyright} Provided by API.Bible.";
        var bibleId = o.ApiBibleBibleId;
        var translationName = string.IsNullOrWhiteSpace(o.ApiBibleTranslationName) ? bibleId : o.ApiBibleTranslationName.Trim();
        var sourceUrl = $"https://www.bible.com/search/bible?q={Uri.EscapeDataString(display)}";
        return new SacredTextSectionDto(Framework, display, translationName, bibleId, attribution, sourceUrl,
            "en", "ltr", null, null, segments, previousReference, nextReference);
    }

    /// <summary>Reads the provider's canonical chapter reference from API.Bible chapter metadata.</summary>
    private static string? ApiBibleChapterReference(JsonElement chapter) =>
        chapter.TryGetProperty("reference", out var reference) && !string.IsNullOrWhiteSpace(reference.GetString())
            ? reference.GetString()
            : null;

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

    /// <summary>Loads a chapter from the keyless public-domain source when API.Bible is not configured.</summary>
    private async Task<SacredTextSectionDto> GetPublicDomainSectionAsync(SacredTextOptions o, string book, int chapter, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get,
            $"{o.PublicDomainBibleBaseUrl.TrimEnd('/')}/{Uri.EscapeDataString($"{book} {chapter}")}?translation={Uri.EscapeDataString(o.PublicDomainBibleTranslation)}");
        var root = await ProviderText.GetJsonAsync(factory.CreateClient(nameof(ApiBibleProvider)), request, cancellationToken);
        if (!root.TryGetProperty("verses", out var verses) || verses.ValueKind != JsonValueKind.Array)
            throw ProviderText.Unusable("bible-api.com");
        var segments = verses.EnumerateArray().Select(verse =>
        {
            var number = verse.TryGetProperty("verse", out var verseNumber) ? verseNumber.ToString() : "";
            var text = verse.TryGetProperty("text", out var verseText) ? ProviderText.Clean(verseText.GetString() ?? "") : "";
            return new SacredTextSegmentDto($"{book} {chapter}:{number}", text);
        }).Where(segment => segment.Text.Length > 0).ToList();
        if (segments.Count == 0) throw ProviderText.Unusable("bible-api.com");
        var translation = root.TryGetProperty("translation_name", out var name) ? name.GetString() ?? "World English Bible" : "World English Bible";
        var displayBook = root.TryGetProperty("reference", out var refValue) ? refValue.GetString() ?? $"{book} {chapter}" : $"{book} {chapter}";
        return new SacredTextSectionDto(Framework, displayBook, translation, o.PublicDomainBibleTranslation,
            $"{translation} (public domain), via bible-api.com.",
            $"https://www.bible.com/search/bible?q={Uri.EscapeDataString(displayBook)}",
            "en", "ltr", null, null, segments);
    }
}

/// <summary>Quran text and translation from the Quran.com API (Quran Foundation). No key required for the public content API.</summary>
public sealed partial class QuranProvider(IHttpClientFactory factory, IOptions<SacredTextOptions> options, IMemoryCache cache) : ISacredTextProvider
{
    /// <summary>Compatibility constructor for direct tests that exercise the keyless legacy provider path.</summary>
    public QuranProvider(IHttpClientFactory factory, IOptions<SacredTextOptions> options)
        : this(factory, options, new MemoryCache(new MemoryCacheOptions())) { }

    public string Framework => FaithFrameworks.Muslim;

    public async Task<SacredPassageDto?> GetDailyAsync(DateOnly date, CancellationToken cancellationToken)
    {
        var o = options.Value;
        var key = DailyReferences.For(DailyReferences.Quran, date);
        var root = await GetJsonAsync(
            $"verses/by_key/{key}?translations={o.QuranTranslationId}&fields=verse_key", cancellationToken);
        if (!root.TryGetProperty("verse", out var verse) || !verse.TryGetProperty("translations", out var translations)
            || translations.GetArrayLength() == 0)
            throw ProviderText.Unusable("Quran.com");
        var text = ProviderText.Clean(translations[0].GetProperty("text").GetString() ?? "");
        if (text.Length == 0) throw ProviderText.Unusable("Quran.com");
        var (surah, ayah) = (key.Split(':')[0], key.Split(':')[1]);
        return new SacredPassageDto(Framework, $"Qur’an {key}", text, "Saheeh International",
            "Quran data provided by Quran.Foundation. Saheeh International translation via Quran.com.", $"https://quran.com/{surah}/{ayah}");
    }

    /// <inheritdoc />
    public async Task<SacredTextSectionDto> GetSectionAsync(string reference, CancellationToken cancellationToken)
    {
        if (!TryParseSectionReference(reference, out var chapter))
            throw new ArgumentException("Provide a Quran surah number from 1 through 114.", nameof(reference));

        var o = options.Value;
        var verses = new List<SacredTextSegmentDto>();
        var page = 1;
        var totalPages = 1;
        do
        {
            var root = await GetJsonAsync(
                $"verses/by_chapter/{chapter}?translations={o.QuranTranslationId}&fields=text_uthmani,verse_key&per_page=50&page={page}", cancellationToken);
            if (!root.TryGetProperty("verses", out var items) || items.ValueKind != JsonValueKind.Array)
                throw ProviderText.Unusable("Quran.com");
            foreach (var verse in items.EnumerateArray())
            {
                var key = verse.TryGetProperty("verse_key", out var verseKey) ? verseKey.GetString() ?? "" : "";
                var translated = verse.TryGetProperty("translations", out var translations) && translations.ValueKind == JsonValueKind.Array
                    ? translations.EnumerateArray().FirstOrDefault() : default;
                var text = translated.ValueKind == JsonValueKind.Object && translated.TryGetProperty("text", out var translatedText)
                    ? ProviderText.Clean(translatedText.GetString() ?? "") : "";
                var arabic = verse.TryGetProperty("text_uthmani", out var sourceText) ? sourceText.GetString() : null;
                if (key.Length > 0 && text.Length > 0)
                    verses.Add(new SacredTextSegmentDto($"Qur’an {key}", text, arabic));
            }
            if (root.TryGetProperty("pagination", out var pagination)
                && pagination.TryGetProperty("total_pages", out var pages) && pages.TryGetInt32(out var count))
                totalPages = Math.Max(1, count);
            page++;
        } while (page <= totalPages);

        if (verses.Count == 0) throw ProviderText.Unusable("Quran.com");
        return new SacredTextSectionDto(Framework, $"Qur’an {chapter}", "Saheeh International",
            $"quran.com:translation-{o.QuranTranslationId}:uthmani",
            "Quran data provided by Quran.Foundation. Saheeh International translation via Quran.com.", $"https://quran.com/{chapter}",
            "en", "ltr", "ar", "rtl", verses,
            chapter > 1 ? $"Qur’an {chapter - 1}" : null,
            chapter < 114 ? $"Qur’an {chapter + 1}" : null);
    }

    /// <summary>Parses and bounds one fully anchored Quran section reference.</summary>
    internal static bool TryParseSectionReference(string reference, out int chapter)
    {
        var match = QuranReferencePattern().Match(reference);
        chapter = match.Success && int.TryParse(match.Groups[1].Value, out var parsed) ? parsed : 0;
        return match.Success && chapter is >= 1 and <= 114;
    }

    /// <summary>Matches a complete optional-labeled surah reference with an optional verse suffix.</summary>
    [GeneratedRegex(@"^\s*(?:Qur[’']?an\s*)?(\d{1,3})(?::(\d{1,3}))?\s*$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex QuranReferencePattern();

    /// <summary>Uses OAuth-backed Quran Foundation requests when configured, with the legacy public API as a compatibility fallback.</summary>
    private async Task<JsonElement> GetJsonAsync(string path, CancellationToken cancellationToken)
    {
        var o = options.Value;
        var hasCredentials = !string.IsNullOrWhiteSpace(o.QuranClientId) && !string.IsNullOrWhiteSpace(o.QuranClientSecret);
        var client = factory.CreateClient(nameof(QuranProvider));
        for (var attempt = 0; attempt < 2; attempt++)
        {
            using var request = await CreateRequestAsync(o, path, hasCredentials, cancellationToken);
            try
            {
                return await ProviderText.GetJsonAsync(client, request, cancellationToken);
            }
            catch (HttpRequestException ex) when (hasCredentials && attempt == 0 && ex.StatusCode == HttpStatusCode.Unauthorized)
            {
                cache.Remove($"quran-access-token:{o.QuranClientId}");
            }
        }
        throw new HttpRequestException("Quran Foundation rejected the authenticated request.", null, HttpStatusCode.Unauthorized);
    }

    /// <summary>Builds a provider request without exposing credentials or tokens to the UI.</summary>
    private async Task<HttpRequestMessage> CreateRequestAsync(SacredTextOptions o, string path, bool hasCredentials, CancellationToken cancellationToken)
    {
        if (!hasCredentials)
            return new HttpRequestMessage(HttpMethod.Get, $"{o.QuranBaseUrl.TrimEnd('/')}/{path}");

        var token = await GetAccessTokenAsync(o, cancellationToken);
        var request = new HttpRequestMessage(HttpMethod.Get, $"{o.QuranContentApiBaseUrl.TrimEnd('/')}/{path}");
        request.Headers.Add("x-auth-token", token);
        request.Headers.Add("x-client-id", o.QuranClientId);
        return request;
    }

    /// <summary>Caches a client-credentials token only until shortly before its provider expiry.</summary>
    private async Task<string> GetAccessTokenAsync(SacredTextOptions o, CancellationToken cancellationToken)
    {
        var cacheKey = $"quran-access-token:{o.QuranClientId}";
        var token = await cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, $"{o.QuranOAuthBaseUrl.TrimEnd('/')}/oauth2/token");
            var credential = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{o.QuranClientId}:{o.QuranClientSecret}"));
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", credential);
            request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "client_credentials",
                ["scope"] = o.QuranScope
            });
            var root = await ProviderText.GetJsonAsync(factory.CreateClient(nameof(QuranProvider)), request, cancellationToken);
            if (!root.TryGetProperty("access_token", out var accessToken) || string.IsNullOrWhiteSpace(accessToken.GetString()))
                throw ProviderText.Unusable("Quran Foundation OAuth");
            var seconds = root.TryGetProperty("expires_in", out var expires) && expires.TryGetInt32(out var value) ? value : 300;
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(Math.Max(1, seconds - 60));
            return accessToken.GetString();
        });
        return token ?? throw ProviderText.Unusable("Quran Foundation OAuth");
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

    /// <inheritdoc />
    public async Task<SacredTextSectionDto> GetSectionAsync(string reference, CancellationToken cancellationToken)
    {
        if (!SacredTextReferenceParser.TryParseBookChapter(reference, out var book, out var chapter))
            throw new ArgumentException("Provide a Jewish text and section reference.", nameof(reference));
        var sectionReference = $"{book} {chapter}";
        var version = options.Value.SefariaVersion;
        using var request = new HttpRequestMessage(HttpMethod.Get,
            $"{options.Value.SefariaBaseUrl.TrimEnd('/')}/texts/{Uri.EscapeDataString(sectionReference)}?version={Uri.EscapeDataString(version)}&version=hebrew&return_format=text_only");
        var root = await ProviderText.GetJsonAsync(factory.CreateClient(nameof(SefariaProvider)), request, cancellationToken);
        if (!root.TryGetProperty("versions", out var versions) || versions.ValueKind != JsonValueKind.Array || versions.GetArrayLength() == 0)
            throw ProviderText.Unusable("Sefaria");
        var selected = versions.EnumerateArray().FirstOrDefault(item =>
            item.TryGetProperty("versionTitle", out var title)
            && string.Equals(title.GetString(), version.Split('|').Last(), StringComparison.Ordinal));
        if (selected.ValueKind != JsonValueKind.Object)
            selected = versions.EnumerateArray().FirstOrDefault(item => item.TryGetProperty("language", out var language)
                && language.GetString()?.StartsWith("en", StringComparison.OrdinalIgnoreCase) == true);
        if (selected.ValueKind != JsonValueKind.Object || !selected.TryGetProperty("text", out var textElement))
            throw ProviderText.Unusable("Sefaria");
        var source = versions.EnumerateArray().FirstOrDefault(item => item.TryGetProperty("language", out var language)
            && language.ValueKind == JsonValueKind.String
            && language.GetString()?.StartsWith("he", StringComparison.OrdinalIgnoreCase) == true
            && item.TryGetProperty("license", out var sourceLicense)
            && IsReusableSefariaLicense(sourceLicense.GetString()));
        var rawSegments = SacredTextChapterParser.FlattenSefariaText(textElement);
        List<string> sourceSegments = source.ValueKind == JsonValueKind.Object && source.TryGetProperty("text", out var sourceTextElement)
            ? SacredTextChapterParser.FlattenSefariaText(sourceTextElement)
            : new List<string>();
        var segments = rawSegments.Select((text, index) => new SacredTextSegmentDto(
                $"{sectionReference}:{index + 1}", ProviderText.Clean(text),
                index < sourceSegments.Count ? ProviderText.Clean(sourceSegments[index]) : null))
            .Where(segment => segment.Text.Length > 0).ToList();
        if (segments.Count == 0) throw ProviderText.Unusable("Sefaria");
        var versionTitle = selected.TryGetProperty("versionTitle", out var title) ? title.GetString() ?? "JPS 1917" : "JPS 1917";
        var license = selected.TryGetProperty("license", out var licenseElement) ? licenseElement.GetString() : null;
        var attribution = string.IsNullOrWhiteSpace(license) ? $"Text from Sefaria, {versionTitle}." : $"Text from Sefaria, {versionTitle}. License: {license}.";
        var display = root.TryGetProperty("ref", out var refElement) ? refElement.GetString() ?? sectionReference : sectionReference;
        var sourceVersionTitle = source.ValueKind == JsonValueKind.Object && source.TryGetProperty("versionTitle", out var sourceTitle)
            ? sourceTitle.GetString() ?? "Hebrew source" : "Hebrew source";
        var sourceLanguage = sourceSegments.Count > 0 ? "he" : null;
        var sourceDirection = sourceSegments.Count > 0 ? "rtl" : null;
        var sourceLicense = source.ValueKind == JsonValueKind.Object && source.TryGetProperty("license", out var sourceLicenseValue)
            ? sourceLicenseValue.GetString() : null;
        var sourceAttribution = sourceSegments.Count > 0
            ? $" Hebrew source: {sourceVersionTitle} ({sourceLicense})."
            : "";
        var sourceLicenseUrl = sourceSegments.Count > 0 ? GetLicenseUrl(source, sourceLicense) : null;
        return new SacredTextSectionDto(Framework, display, versionTitle, $"{version}|{versionTitle}|{sourceVersionTitle}", $"{attribution}{sourceAttribution}",
            $"https://www.sefaria.org/{Uri.EscapeDataString(sectionReference.Replace(' ', '.'))}", "en", "ltr", sourceLanguage, sourceDirection, segments,
            ProviderReference(root, "prev"), ProviderReference(root, "next"), sourceLicenseUrl);
    }

    /// <summary>Returns an optional adjacent reference only when Sefaria includes it in the response metadata.</summary>
    private static string? ProviderReference(JsonElement root, string property) =>
        root.TryGetProperty(property, out var reference) && reference.ValueKind == JsonValueKind.String
            ? reference.GetString()
            : null;

    /// <summary>Only displays exact normalized public-domain, CC0, CC-BY, or CC-BY-SA Sefaria license values; excludes NC, ND, and unknown terms.</summary>
    private static bool IsReusableSefariaLicense(string? license) => license?.Trim().ToUpperInvariant() is
        "PUBLIC DOMAIN" or "CC0" or "CC-BY" or "CC-BY-SA";

    /// <summary>Uses Sefaria's license deed metadata when present and the standard CC-BY-SA deed for that exact license otherwise.</summary>
    private static string? GetLicenseUrl(JsonElement version, string? license)
    {
        foreach (var name in new[] { "licenseUrl", "licenseURL", "license_url" })
            if (version.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String && Uri.TryCreate(value.GetString(), UriKind.Absolute, out _))
                return value.GetString();
        return string.Equals(license?.Trim(), "CC-BY-SA", StringComparison.OrdinalIgnoreCase)
            ? "https://creativecommons.org/licenses/by-sa/4.0/"
            : null;
    }
}

/// <summary>Parses the bounded user-facing section references used by the reader controls.</summary>
internal static class SacredTextReferenceParser
{
    private static readonly System.Text.RegularExpressions.Regex BookChapterPattern = new(
        @"^\s*(?<book>[\p{L}\p{N}][\p{L}\p{N} .'-]{0,80}?)\s+(?<chapter>\d{1,3})(?:(?:[:.]\d{1,3})(?:[-–]\d{1,3})?)?\s*$",
        System.Text.RegularExpressions.RegexOptions.Compiled | System.Text.RegularExpressions.RegexOptions.CultureInvariant);

    /// <summary>Accepts a book/section with optional verse suffix and returns the chapter identity.</summary>
    public static bool TryParseBookChapter(string reference, out string book, out int chapter)
    {
        var match = BookChapterPattern.Match(reference);
        book = match.Success ? match.Groups["book"].Value.Trim() : "";
        chapter = match.Success && int.TryParse(match.Groups["chapter"].Value, out var value) ? value : 0;
        return match.Success && chapter is > 0 and <= 999;
    }

    /// <summary>Checks that a provider segment is nested beneath the exact section book and chapter.</summary>
    public static bool SegmentBelongsToSection(string sectionReference, string segmentReference)
    {
        var normalizedSection = Regex.Replace(sectionReference.Trim(), @"\s+", " ");
        var normalizedSegment = Regex.Replace(segmentReference.Trim(), @"\s+", " ");
        return normalizedSegment.StartsWith($"{normalizedSection}:", StringComparison.OrdinalIgnoreCase)
            || normalizedSegment.StartsWith($"{normalizedSection}.", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>Canonicalizes Quran references into a surah number for section cache keys.</summary>
    public static bool TryParseQuranSection(string reference, out int chapter) => QuranProvider.TryParseSectionReference(reference, out chapter);
}

/// <summary>Converts provider section structures into stable verse/segment anchors.</summary>
internal static class SacredTextChapterParser
{
    /// <summary>Reads API.Bible JSON blocks, preserving the provider's verse identifiers and text.</summary>
    public static List<SacredTextSegmentDto> FromApiBibleJson(JsonElement content)
    {
        var fragments = new SortedDictionary<int, string>();
        ReadApiBibleItems(content, 0, fragments);
        return fragments.Where(item => item.Value.Length > 0)
            .Select(item => new SacredTextSegmentDto($"{item.Key}", item.Value.Trim())).ToList();
    }

    /// <summary>Flattens a Sefaria section's one- or two-dimensional text array to segment strings.</summary>
    public static List<string> FlattenSefariaText(JsonElement text)
    {
        var result = new List<string>();
        Flatten(text, result);
        return result;
    }

    /// <summary>Recursively collects API.Bible verse text while preserving provider verse identifiers.</summary>
    private static void ReadApiBibleItems(JsonElement element, int currentVerse, SortedDictionary<int, string> fragments)
    {
        if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray()) ReadApiBibleItems(item, currentVerse, fragments);
            return;
        }
        if (element.ValueKind != JsonValueKind.Object) return;
        if (element.TryGetProperty("name", out var name) && name.ValueKind == JsonValueKind.String && name.GetString() == "verse"
            && element.TryGetProperty("attrs", out var attrs) && attrs.TryGetProperty("number", out var number)
            && int.TryParse(number.ToString(), out var verseNumber))
        {
            ReadApiBibleItems(element.TryGetProperty("items", out var markerItems) ? markerItems : default, verseNumber, fragments);
            return;
        }
        if (element.TryGetProperty("text", out var text) && text.ValueKind == JsonValueKind.String)
        {
            var verse = currentVerse;
            if (element.TryGetProperty("attrs", out var textAttrs) && textAttrs.TryGetProperty("verseId", out var verseId))
            {
                var parts = (verseId.GetString() ?? "").Split('.');
                if (parts.Length > 0 && int.TryParse(parts[^1], out var idVerse)) verse = idVerse;
            }
            if (verse > 0)
            {
                var fragment = ProviderText.Clean(text.GetString() ?? "");
                if (fragment.Length > 0)
                    fragments[verse] = fragments.TryGetValue(verse, out var current) ? $"{current} {fragment}" : fragment;
            }
        }
        if (element.TryGetProperty("items", out var children)) ReadApiBibleItems(children, currentVerse, fragments);
    }

    /// <summary>Recursively flattens Sefaria's nested text arrays without transforming source strings.</summary>
    private static void Flatten(JsonElement value, List<string> result)
    {
        if (value.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in value.EnumerateArray()) Flatten(item, result);
        }
        else if (value.ValueKind == JsonValueKind.String)
        {
            result.Add(value.GetString() ?? "");
        }
    }
}

/// <summary>Routes a request to the one provider for the selected framework and caches each day's passage.</summary>
public sealed class SacredTextService(IEnumerable<ISacredTextProvider> providers, IMemoryCache cache, IOptions<SacredTextOptions> options)
{
    private readonly Dictionary<string, ISacredTextProvider> _providers = providers.ToDictionary(p => p.Framework);

    /// <summary>Resolves only the provider for the explicitly selected supported framework.</summary>
    public ISacredTextProvider? GetProvider(string? framework)
    {
        var key = FaithFrameworks.Normalize(framework);
        return key is not null && _providers.TryGetValue(key, out var provider) ? provider : null;
    }

    /// <summary>Gets and caches one successful section for exactly the selected framework and configured source version.</summary>
    public async Task<SacredTextSectionDto?> GetSectionAsync(string? framework, string reference, CancellationToken cancellationToken)
    {
        var key = FaithFrameworks.Normalize(framework);
        if (key is null || !_providers.TryGetValue(key, out var provider)) return null;
        var sectionReference = NormalizeSectionReference(key, reference);
        var configuredVersion = key switch
        {
            FaithFrameworks.Christian => !string.IsNullOrWhiteSpace(options.Value.ApiBibleKey) && !string.IsNullOrWhiteSpace(options.Value.ApiBibleBibleId)
                ? $"api-bible:{options.Value.ApiBibleBibleId}" : $"bible-api:{options.Value.PublicDomainBibleTranslation}",
            FaithFrameworks.Muslim => $"quran:{options.Value.QuranTranslationId}:uthmani",
            FaithFrameworks.Jewish => $"sefaria:{options.Value.SefariaVersion}:hebrew",
            _ => "",
        };
        var cacheKey = $"sacred-section:{key}:{configuredVersion}:{sectionReference}";
        if (cache.TryGetValue(cacheKey, out SacredTextSectionDto? cached)) return cached;
        var section = await provider.GetSectionAsync(reference, cancellationToken);
        cache.Set(cacheKey, section, options.Value.CacheDuration);
        return section;
    }

    /// <summary>Canonicalizes section-only references so equivalent links reuse one cache entry.</summary>
    private static string NormalizeSectionReference(string framework, string reference)
    {
        if (framework == FaithFrameworks.Muslim && SacredTextReferenceParser.TryParseQuranSection(reference, out var chapter))
            return chapter.ToString(System.Globalization.CultureInfo.InvariantCulture);
        if (SacredTextReferenceParser.TryParseBookChapter(reference, out var book, out var bookChapter))
            return $"{book.ToUpperInvariant()} {bookChapter}";
        return Regex.Replace(reference.Trim(), @"\s+", " ").ToUpperInvariant();
    }

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
