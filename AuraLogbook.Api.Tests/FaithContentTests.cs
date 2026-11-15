using System.Net;
using AuraLogbook.Api.Services.Faith;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Tests;

/// <summary>#392: neutral Word of the Day and framework-gated sacred-text passages.</summary>
public sealed class FaithContentTests
{
    private static readonly DateOnly Day = new(2026, 11, 12);

    [Fact]
    public void Word_of_day_is_deterministic_and_needs_no_framework()
    {
        var first = WordOfDayCatalog.For(Day);

        Assert.Equal(first, WordOfDayCatalog.For(Day));
        Assert.Equal(Day, first.Date);
        Assert.False(string.IsNullOrWhiteSpace(first.Word));
        Assert.NotEqual(first.Word, WordOfDayCatalog.For(Day.AddDays(1)).Word);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("custom")]
    [InlineData("neutral")]
    [InlineData("hindu")]
    public async Task Unsupported_or_missing_framework_returns_no_passage_and_calls_no_provider(string? framework)
    {
        var handler = new StubHandler(HttpStatusCode.OK, "{}");
        var service = Service(handler, new SacredTextOptions());

        Assert.Null(await service.GetDailyAsync(framework, Day, CancellationToken.None));
        Assert.Equal(0, handler.Calls);
    }

    [Fact]
    public async Task Christian_passage_uses_public_domain_web_without_a_key()
    {
        var handler = new StubHandler(HttpStatusCode.OK,
            """{"reference":"Psalms 23:1","text":"Yahweh is my shepherd:\nI shall lack nothing.\n","translation_name":"World English Bible"}""");

        var passage = await Service(handler, new SacredTextOptions()).GetDailyAsync("christian", Day, CancellationToken.None);

        Assert.NotNull(passage);
        Assert.Equal("Yahweh is my shepherd: I shall lack nothing.", passage.Text);
        Assert.Contains("public domain", passage.Attribution);
        Assert.StartsWith("https://bible-api.com/", handler.LastRequest!.RequestUri!.ToString());
        Assert.Contains("translation=web", handler.LastRequest.RequestUri.Query);
        Assert.False(handler.LastRequest.Headers.Contains("api-key"));
    }

    [Fact]
    public async Task Christian_passage_uses_api_bible_with_key_header_and_strips_markup()
    {
        var handler = new StubHandler(HttpStatusCode.OK,
            """{"data":{"content":"  <span>The LORD is my shepherd;</span> I shall not want.  ","copyright":"Public domain"}}""");
        var options = new SacredTextOptions { ApiBibleKey = "server-key", ApiBibleBibleId = "de4e12af7f28f599-02", ApiBibleTranslationName = "Licensed Edition" };

        var passage = await Service(handler, options).GetDailyAsync("Christian", Day, CancellationToken.None);

        Assert.NotNull(passage);
        Assert.Equal("christian", passage.Framework);
        Assert.Equal("Licensed Edition", passage.Translation);
        Assert.Equal("The LORD is my shepherd; I shall not want.", passage.Text);
        Assert.Contains("API.Bible", passage.Attribution);
        Assert.Equal("server-key", handler.LastRequest!.Headers.GetValues("api-key").Single());
        Assert.Contains("/bibles/de4e12af7f28f599-02/verses/", handler.LastRequest.RequestUri!.ToString());
    }

    [Fact]
    public async Task Muslim_passage_uses_quran_com_and_removes_footnotes()
    {
        var handler = new StubHandler(HttpStatusCode.OK,
            """{"verse":{"verse_key":"94:5","translations":[{"text":"For indeed, with hardship <sup foot_note=1>1</sup>[will be] ease."}]}}""");

        var passage = await Service(handler, new SacredTextOptions()).GetDailyAsync("muslim", Day, CancellationToken.None);

        Assert.NotNull(passage);
        Assert.Equal("muslim", passage.Framework);
        Assert.Equal("For indeed, with hardship [will be] ease.", passage.Text);
        Assert.StartsWith("https://quran.com/", passage.ReadingUrl);
        Assert.Contains("translations=20", handler.LastRequest!.RequestUri!.Query);
    }

    [Fact]
    public async Task Jewish_passage_uses_sefaria_and_carries_its_license()
    {
        var handler = new StubHandler(HttpStatusCode.OK,
            """{"versions":[{"text":["Her ways are pleasant ways,<br>And all her paths, peaceful."],"versionTitle":"JPS 1917","license":"Public Domain"}]}""");

        var passage = await Service(handler, new SacredTextOptions()).GetDailyAsync("jewish", Day, CancellationToken.None);

        Assert.NotNull(passage);
        Assert.Equal("jewish", passage.Framework);
        Assert.Equal("Her ways are pleasant ways, And all her paths, peaceful.", passage.Text);
        Assert.Equal("JPS 1917", passage.Translation);
        Assert.Contains("Public Domain", passage.Attribution);
        Assert.StartsWith("https://www.sefaria.org/", passage.ReadingUrl);
        Assert.Contains("JPS%201917", handler.LastRequest!.RequestUri!.AbsoluteUri);
    }

    [Fact]
    public async Task Provider_error_surfaces_as_http_failure_without_text()
    {
        var service = Service(new StubHandler(HttpStatusCode.TooManyRequests, "{}"), new SacredTextOptions());

        var error = await Assert.ThrowsAsync<HttpRequestException>(() => service.GetDailyAsync("jewish", Day, CancellationToken.None));
        Assert.Equal(HttpStatusCode.TooManyRequests, error.StatusCode);
    }

    [Fact]
    public async Task Daily_passage_is_cached_to_respect_rate_limits()
    {
        var handler = new StubHandler(HttpStatusCode.OK, """{"versions":[{"text":"Text","versionTitle":"V"}]}""");
        var service = Service(handler, new SacredTextOptions());

        await service.GetDailyAsync("jewish", Day, CancellationToken.None);
        await service.GetDailyAsync("jewish", Day, CancellationToken.None);

        Assert.Equal(1, handler.Calls);
    }

    /// <summary>#410: normalized equivalent section references reuse the successful cached section.</summary>
    [Fact]
    public async Task Sacred_text_section_is_cached_by_normalized_reference()
    {
        var handler = new StubHandler(HttpStatusCode.OK,
            """{"ref":"Genesis 1","prev":"Genesis","next":"Genesis 2","versions":[{"text":["Text"],"versionTitle":"JPS 1917","license":"Public Domain","language":"en"}]}""");
        var service = Service(handler, new SacredTextOptions());

        await service.GetSectionAsync("jewish", "Genesis 1", CancellationToken.None);
        await service.GetSectionAsync("JEWISH", " Genesis   1 ", CancellationToken.None);

        Assert.Equal(1, handler.Calls);
    }

    /// <summary>Resolves the daily reading's singular Psalm label against API.Bible's canonical Psalms book name.</summary>
    [Fact]
    public async Task Api_bible_section_resolves_daily_psalm_reference()
    {
        var handler = new StubHandler((request, _) =>
        {
            var body = request.RequestUri!.AbsolutePath.EndsWith("/books", StringComparison.Ordinal)
                ? """{"data":[{"id":"PSA","name":"Psalms","chapters":[{"bookId":"PSA","number":"23","reference":"Psalms 23"}]}]}"""
                : """{"data":{"content":[{"name":"verse","attrs":{"number":1},"items":[{"text":"The Lord is my shepherd."}]}],"reference":"Psalms 23"}}""";
            return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(body) };
        });
        var provider = new ApiBibleProvider(new StubFactory(handler), Options.Create(new SacredTextOptions
        {
            ApiBibleKey = "key",
            ApiBibleBibleId = "bible-id",
        }));

        var section = await provider.GetSectionAsync("Psalm 23:1", CancellationToken.None);

        Assert.Equal("Psalms 23", section.Reference);
        Assert.Equal("PSA.23", handler.LastRequest!.RequestUri!.Segments[^1].TrimEnd('/'));
        Assert.Equal("Psalms 23:1", section.Segments[0].Reference);
    }

    /// <summary>Sefaria's adjacent section references are returned without synthesizing provider navigation.</summary>
    [Fact]
    public async Task Sefaria_section_exposes_provider_previous_and_next_references()
    {
        var handler = new StubHandler(HttpStatusCode.OK,
            """{"ref":"Genesis 1","prev":"Genesis","next":"Genesis 2","versions":[{"text":["Text"],"versionTitle":"JPS 1917","license":"Public Domain","language":"en"}]}""");

        var section = await new SefariaProvider(new StubFactory(handler), Options.Create(new SacredTextOptions()))
            .GetSectionAsync("Genesis 1", CancellationToken.None);

        Assert.Equal("Genesis", section.PreviousReference);
        Assert.Equal("Genesis 2", section.NextReference);
    }

    /// <summary>API.Bible adjacent chapters are taken from its chapter-list references.</summary>
    [Fact]
    public async Task Api_bible_section_exposes_adjacent_chapter_metadata()
    {
        var handler = new StubHandler((request, _) =>
        {
            var path = request.RequestUri!.AbsolutePath;
            var body = path.EndsWith("/books", StringComparison.Ordinal)
                ? """{"data":[{"id":"GEN","name":"Genesis","chapters":[{"bookId":"GEN","number":"1","reference":"Genesis 1"},{"bookId":"GEN","number":"2","reference":"Genesis 2"},{"bookId":"GEN","number":"3","reference":"Genesis 3"}]}]}"""
                : """{"data":{"content":[{"name":"verse","attrs":{"number":1},"items":[{"text":"Text"}]}],"reference":"Genesis 2","copyright":"Public"}}""";
            return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(body) };
        });
        var options = Options.Create(new SacredTextOptions { ApiBibleKey = "key", ApiBibleBibleId = "bible-id" });

        var section = await new ApiBibleProvider(new StubFactory(handler), options)
            .GetSectionAsync("Genesis 2", CancellationToken.None);

        Assert.Equal("Genesis 1", section.PreviousReference);
        Assert.Equal("Genesis 3", section.NextReference);
    }

    /// <summary>Displays CC-BY-SA Hebrew with RTL metadata and explicit version, license, and deed attribution.</summary>
    [Theory]
    [InlineData("CC-BY-SA")]
    [InlineData("CC-BY")]
    public async Task Sefaria_reuses_approved_hebrew_licenses_with_attribution(string license)
    {
        var section = await SefariaSectionWithLicense(license);

        Assert.Equal("English wording", section.Segments[0].Text);
        Assert.Equal("he", section.SourceLanguage);
        Assert.Equal("rtl", section.SourceDirection);
        Assert.Contains("Hebrew Masorah Edition", section.Attribution);
        Assert.Contains(license, section.Attribution);
        if (license == "CC-BY-SA")
            Assert.Equal("https://creativecommons.org/licenses/by-sa/4.0/", section.SourceLicenseUrl);
    }

    /// <summary>Excludes exact NC, empty, and missing license metadata while preserving the English passage.</summary>
    [Theory]
    [InlineData("CC-BY-NC")]
    [InlineData("CC-BY-NC-SA")]
    [InlineData("")]
    [InlineData(null)]
    public async Task Sefaria_excludes_unapproved_hebrew_licenses(string? license)
    {
        var section = await SefariaSectionWithLicense(license);

        Assert.Equal("English wording", section.Segments[0].Text);
        Assert.All(section.Segments, segment => Assert.Null(segment.SourceText));
        Assert.Null(section.SourceLanguage);
        Assert.Null(section.SourceDirection);
    }

    /// <summary>Framework and section identity remain independent cache dimensions.</summary>
    [Fact]
    public async Task Sacred_text_sections_do_not_share_cache_entries_between_frameworks_or_references()
    {
        const string response = """{"reference":"Genesis 1","translation_name":"WEB","verses":[{"verse":1,"text":"Text"}],"ref":"Genesis 1","versions":[{"text":["Text"],"versionTitle":"JPS 1917","license":"Public Domain","language":"en"}]}""";
        var handler = new StubHandler(HttpStatusCode.OK, response);
        var service = Service(handler, new SacredTextOptions());

        await service.GetSectionAsync("christian", "Genesis 1", CancellationToken.None);
        await service.GetSectionAsync("christian", "Genesis 2", CancellationToken.None);
        await service.GetSectionAsync("jewish", "Genesis 1", CancellationToken.None);

        Assert.Equal(3, handler.Calls);
    }

    /// <summary>A provider failure is never retained in the in-memory section cache.</summary>
    [Fact]
    public async Task Failed_sacred_text_sections_are_not_cached()
    {
        const string response = """{"ref":"Genesis 1","versions":[{"text":["Text"],"versionTitle":"JPS 1917","license":"Public Domain","language":"en"}]}""";
        var handler = new StubHandler((_, calls) => new HttpResponseMessage(calls == 1
            ? HttpStatusCode.ServiceUnavailable : HttpStatusCode.OK) { Content = new StringContent(response) });
        var service = Service(handler, new SacredTextOptions());

        await Assert.ThrowsAsync<HttpRequestException>(() => service.GetSectionAsync("jewish", "Genesis 1", CancellationToken.None));
        Assert.NotNull(await service.GetSectionAsync("jewish", "Genesis 1", CancellationToken.None));

        Assert.Equal(2, handler.Calls);

    }

    /// <summary>#410: Quran section parsing accepts only complete, bounded surah references.</summary>
    [Theory]
    [InlineData("2", "Qur’an 2", "Qur’an 1", "Qur’an 3")]
    [InlineData("Qur’an 2:255", "Qur’an 2", "Qur’an 1", "Qur’an 3")]
    [InlineData("114", "Qur’an 114", "Qur’an 113", null)]
    [InlineData("1", "Qur’an 1", null, "Qur’an 2")]
    public async Task Quran_section_accepts_valid_anchored_references(string reference, string expectedSection, string? previousReference, string? nextReference)
    {
        var handler = new StubHandler(HttpStatusCode.OK,
            """{"verses":[{"verse_key":"2:1","translations":[{"text":"Text"}],"text_uthmani":"ع"}],"pagination":{"total_pages":1}}""");
        var provider = new QuranProvider(new StubFactory(handler), Options.Create(new SacredTextOptions()));

        var section = await provider.GetSectionAsync(reference, CancellationToken.None);

        Assert.Equal(expectedSection, section.Reference);
        Assert.Equal(previousReference, section.PreviousReference);
        Assert.Equal(nextReference, section.NextReference);
    }

    /// <summary>Malformed or out-of-range Quran identifiers are rejected before any provider request.</summary>
    [Theory]
    [InlineData("0")]
    [InlineData("115")]
    [InlineData("1000")]
    [InlineData("Genesis 1")]
    [InlineData("")]
    public async Task Quran_section_rejects_invalid_anchored_references(string reference)
    {
        var handler = new StubHandler(HttpStatusCode.OK, "{}");
        var provider = new QuranProvider(new StubFactory(handler), Options.Create(new SacredTextOptions()));

        await Assert.ThrowsAsync<ArgumentException>(() => provider.GetSectionAsync(reference, CancellationToken.None));
        Assert.Equal(0, handler.Calls);
    }

    private static SacredTextService Service(StubHandler handler, SacredTextOptions settings)
    {
        var options = Options.Create(settings);
        var factory = new StubFactory(handler);
        return new SacredTextService(
            [new ApiBibleProvider(factory, options), new QuranProvider(factory, options), new SefariaProvider(factory, options)],
            new MemoryCache(new MemoryCacheOptions()), options);
    }

    private static async Task<SacredTextSectionDto> SefariaSectionWithLicense(string? license)
    {
        var englishVersion = new Dictionary<string, object>
        {
            ["text"] = new[] { "English wording" },
            ["versionTitle"] = "The Holy Scriptures: A New Translation (JPS 1917)",
            ["license"] = "Public Domain",
            ["language"] = "en",
        };
        var hebrewVersion = new Dictionary<string, object>
        {
            ["text"] = new[] { "עברית" },
            ["versionTitle"] = "Hebrew Masorah Edition",
            ["language"] = "he",
        };
        if (license is not null) hebrewVersion["license"] = license;
        var body = System.Text.Json.JsonSerializer.Serialize(new Dictionary<string, object>
        {
            ["ref"] = "Genesis 1",
            ["versions"] = new[] { englishVersion, hebrewVersion },
        });
        return await new SefariaProvider(new StubFactory(new StubHandler(HttpStatusCode.OK, body)), Options.Create(new SacredTextOptions()))
            .GetSectionAsync("Genesis 1", CancellationToken.None);
    }

    private sealed class StubFactory(HttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler, disposeHandler: false);
    }

    private sealed class StubHandler(HttpStatusCode status, string body) : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, int, HttpResponseMessage>? _responseFactory;

        public StubHandler(Func<HttpRequestMessage, int, HttpResponseMessage> responseFactory) : this(HttpStatusCode.OK, "") => _responseFactory = responseFactory;

        public int Calls { get; private set; }
        public HttpRequestMessage? LastRequest { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            LastRequest = request;
            return Task.FromResult(_responseFactory?.Invoke(request, Calls) ?? new HttpResponseMessage(status) { Content = new StringContent(body) });
        }
    }
}
