using System.Net;
using System.Security.Claims;
using AuraLogbook.Api.Controllers;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services;
using AuraLogbook.Api.Services.Astrology;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace AuraLogbook.Api.Tests;

/// <summary>#373: FreeAstroAPI daily sign reading and moon-phase mood counts, without real provider calls.</summary>
public sealed class AstrologyServicesTests
{
    private static readonly IOptions<FreeAstroApiOptions> Keyed = Options.Create(new FreeAstroApiOptions { ApiKey = "server-key" });

    private static FreeAstroDailyHoroscopeService Horoscope(StubHandler handler, IOptions<FreeAstroApiOptions>? options = null) =>
        new(new HttpClient(handler), new MemoryCache(new MemoryCacheOptions()), options ?? Keyed, new FreeAstroApiRequestPacer(),
            NullLogger<FreeAstroDailyHoroscopeService>.Instance);

    [Fact]
    public async Task Daily_horoscope_reads_nested_text_sends_key_header_and_caches()
    {
        var handler = new StubHandler(_ => (HttpStatusCode.OK, """{"data":{"content":{"text":"A calm day for steady plans."}}}"""));
        var service = Horoscope(handler);

        var first = await service.GetDailyAsync(" Virgo ", CancellationToken.None);
        var second = await service.GetDailyAsync("virgo", CancellationToken.None);

        Assert.NotNull(first);
        Assert.Equal("virgo", first.Sign);
        Assert.Equal("A calm day for steady plans.", first.Text);
        Assert.Equal(first, second);
        Assert.Equal(1, handler.Calls);
        Assert.Equal("server-key", handler.Requests[0].Headers.GetValues("x-api-key").Single());
        Assert.Contains("sign=virgo", handler.Requests[0].RequestUri!.Query);
    }

    [Theory]
    [InlineData(HttpStatusCode.TooManyRequests, "{}")]
    [InlineData(HttpStatusCode.OK, "not json")]
    [InlineData(HttpStatusCode.OK, """{"data":{}}""")]
    public async Task Daily_horoscope_returns_null_on_provider_problems(HttpStatusCode status, string body)
    {
        Assert.Null(await Horoscope(new StubHandler(_ => (status, body))).GetDailyAsync("leo", CancellationToken.None));
    }

    [Fact]
    public async Task Daily_horoscope_makes_no_call_without_a_key()
    {
        var handler = new StubHandler(_ => (HttpStatusCode.OK, """{"text":"x"}"""));

        Assert.Null(await Horoscope(handler, Options.Create(new FreeAstroApiOptions())).GetDailyAsync("leo", CancellationToken.None));
        Assert.Equal(0, handler.Calls);
    }

    [Fact]
    public async Task Moon_phase_counts_group_entries_by_phase_and_report_unresolved_dates()
    {
        var day1 = new DateOnly(2026, 11, 1);
        var day2 = new DateOnly(2026, 11, 2);
        var day3 = new DateOnly(2026, 11, 3);
        var moods = new Mock<IMoodService>();
        moods.Setup(m => m.GetEntriesForUserAsync(7, It.IsAny<DateTime?>(), It.IsAny<DateTime?>())).ReturnsAsync(
        [
            new MoodEntry { UserId = 7, Date = day1, Moods = ["Centered", "Tense"] },
            new MoodEntry { UserId = 7, Date = day1, Moods = ["Centered"] },
            new MoodEntry { UserId = 7, Date = day2, Moods = ["Weary"] },
            new MoodEntry { UserId = 7, Date = day3, Moods = ["Flowing"] },
        ]);
        // Day 1 and 2 share a phase; day 3's lookup fails and is counted as unresolved, not guessed.
        var handler = new StubHandler(request => request.RequestUri!.Query.Contains("2026-11-03")
            ? (HttpStatusCode.ServiceUnavailable, "{}")
            : (HttpStatusCode.OK, """{"phase":{"name":"Waning Crescent"}}"""));
        var service = new FreeAstroMoonPhaseMoodInsightsService(new HttpClient(handler), moods.Object,
            new MemoryCache(new MemoryCacheOptions()), new FreeAstroApiRequestPacer(), Keyed,
            NullLogger<FreeAstroMoonPhaseMoodInsightsService>.Instance);

        var result = await service.GetInsightsAsync(7, day1, day3, CancellationToken.None);

        Assert.Equal(4, result.MoodEntryCount);
        Assert.Equal(3, result.EntriesWithPhaseData);
        Assert.Equal(1, result.DatesWithoutPhaseData);
        var phase = Assert.Single(result.Phases);
        Assert.Equal("Waning Crescent", phase.Phase);
        Assert.Equal(3, phase.EntryCount);
        Assert.Equal(2, phase.MoodCounts["Centered"]);
        Assert.Equal(1, phase.MoodCounts["Weary"]);
    }

    [Fact]
    public async Task Controller_rejects_ranges_over_31_days_and_reports_missing_configuration()
    {
        var keyed = Controller(Keyed);
        var tooLong = await keyed.GetMoonMoodCounts(new DateOnly(2026, 1, 1), new DateOnly(2026, 2, 1), CancellationToken.None);
        var reversed = await keyed.GetMoonMoodCounts(new DateOnly(2026, 2, 1), new DateOnly(2026, 1, 1), CancellationToken.None);
        var unconfigured = await Controller(Options.Create(new FreeAstroApiOptions())).GetDailyHoroscope(CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(tooLong);
        Assert.IsType<BadRequestObjectResult>(reversed);
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, Assert.IsType<ObjectResult>(unconfigured).StatusCode);
    }

    [Fact]
    public async Task Controller_asks_for_a_birthday_before_a_sun_sign_reading()
    {
        var users = new Mock<IFileUserRepository>();
        users.Setup(u => u.GetByIdAsync(7)).ReturnsAsync(new User { Id = 7, ZodiacSign = "" });

        var result = await Controller(Keyed, users.Object).GetDailyHoroscope(CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    private static AstrologyController Controller(IOptions<FreeAstroApiOptions> options, IFileUserRepository? users = null) =>
        new(Mock.Of<IMoonPhaseMoodInsightsService>(), Mock.Of<IDailyHoroscopeService>(), users ?? Mock.Of<IFileUserRepository>(), options)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "7")], "test")),
                },
            },
        };

    private sealed class StubHandler(Func<HttpRequestMessage, (HttpStatusCode Status, string Body)> respond) : HttpMessageHandler
    {
        public List<HttpRequestMessage> Requests { get; } = [];
        public int Calls => Requests.Count;

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add(request);
            var (status, body) = respond(request);
            return Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(body) });
        }
    }
}
