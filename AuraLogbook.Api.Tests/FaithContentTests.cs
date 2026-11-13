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
    public async Task Christian_passage_is_unavailable_without_a_server_side_key()
    {
        var handler = new StubHandler(HttpStatusCode.OK, "{}");

        Assert.Null(await Service(handler, new SacredTextOptions()).GetDailyAsync("christian", Day, CancellationToken.None));
        Assert.Equal(0, handler.Calls);
    }

    [Fact]
    public async Task Christian_passage_uses_api_bible_with_key_header_and_strips_markup()
    {
        var handler = new StubHandler(HttpStatusCode.OK,
            """{"data":{"content":"  <span>The LORD is my shepherd;</span> I shall not want.  ","copyright":"Public domain"}}""");
        var options = new SacredTextOptions { ApiBibleKey = "server-key", ApiBibleBibleId = "de4e12af7f28f599-02" };

        var passage = await Service(handler, options).GetDailyAsync("Christian", Day, CancellationToken.None);

        Assert.NotNull(passage);
        Assert.Equal("christian", passage.Framework);
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

    private static SacredTextService Service(StubHandler handler, SacredTextOptions settings)
    {
        var options = Options.Create(settings);
        var factory = new StubFactory(handler);
        return new SacredTextService(
            [new ApiBibleProvider(factory, options), new QuranProvider(factory, options), new SefariaProvider(factory, options)],
            new MemoryCache(new MemoryCacheOptions()), options);
    }

    private sealed class StubFactory(HttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler, disposeHandler: false);
    }

    private sealed class StubHandler(HttpStatusCode status, string body) : HttpMessageHandler
    {
        public int Calls { get; private set; }
        public HttpRequestMessage? LastRequest { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            LastRequest = request;
            return Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(body) });
        }
    }
}
