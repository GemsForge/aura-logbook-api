using System.Net;
using System.Security.Claims;
using System.Text.Json;
using AuraLogbook.Api.Controllers;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services.Astrology;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace AuraLogbook.Api.Tests;

/// <summary>Verifies the selected chart provider, historical time mapping, normalized UI data, and consent gate.</summary>
public sealed class FreeAstrologyBirthChartTests
{
    private const string Geo = """[{"location_name":"New York City","complete_name":"New York City, New York, United States","country":"United States","administrative_zone_1":"New York","latitude":40.71,"longitude":-74.01,"timezone":"America/New_York","timezone_offset":-5},{"location_name":"New York Mills","complete_name":"New York Mills, New York, United States","country":"United States","administrative_zone_1":"New York","latitude":43.1,"longitude":-75.2,"timezone":"America/New_York"}]""";
    private const string Planets = """{"statusCode":200,"output":[{"planet":{"en":"Sun"},"zodiac_sign":{"name":{"en":"Cancer"}},"normDegree":12.5},{"planet":{"en":"Ascendant"},"zodiac_sign":{"name":{"en":"Libra"}},"normDegree":20}]}""";

    /// <summary>Uses only synthetic birth details and fake credentials; no external requests are made.</summary>
    private static FreeAstrologyBirthChartService Service(Handler handler, string key = "test-key") =>
        new(new HttpClient(handler), Options.Create(new FreeAstrologyApiOptions { ApiKey = key }),
            new MemoryCache(new MemoryCacheOptions()), new FreeAstrologyApiRequestPacer(), NullLogger<FreeAstrologyBirthChartService>.Instance);

    [Theory]
    [InlineData(1, -5)]
    [InlineData(7, -4)]
    public async Task Sends_selected_provider_key_maps_birth_date_offset_normalizes_and_caches(int month, double offset)
    {
        var handler = new Handler(Geo, Planets);
        var service = Service(handler);
        var birthday = new DateOnly(1998, month, 3);
        var result = await service.GetNatalChartAsync(birthday, "10:30", "New York, US", default);
        var repeat = await service.GetNatalChartAsync(birthday, "10:30", "New York, US", default);

        Assert.NotNull(result);
        Assert.Equal("FreeAstrologyAPI", result.Provider);
        Assert.Same(result, repeat);
        Assert.Equal(2, handler.Calls.Count);
        Assert.Equal("https://json.freeastrologyapi.com/geo-details", handler.Calls[0].Url);
        Assert.Equal("New York", handler.Calls[0].Body.GetProperty("location").GetString());
        Assert.Equal("https://json.freeastrologyapi.com/western/planets", handler.Calls[1].Url);
        Assert.All(handler.Calls, call => Assert.Equal("test-key", call.Key));
        var sent = handler.Calls[1].Body;
        Assert.Equal(1998, sent.GetProperty("year").GetInt32());
        Assert.Equal(month, sent.GetProperty("month").GetInt32());
        Assert.Equal(3, sent.GetProperty("date").GetInt32());
        Assert.Equal(10, sent.GetProperty("hours").GetInt32());
        Assert.Equal(30, sent.GetProperty("minutes").GetInt32());
        Assert.Equal(40.71, sent.GetProperty("latitude").GetDouble());
        Assert.Equal(-74.01, sent.GetProperty("longitude").GetDouble());
        Assert.Equal(offset, sent.GetProperty("timezone").GetDouble());
        Assert.Equal("tropical", sent.GetProperty("config").GetProperty("ayanamsha").GetString());
        var sun = result.Chart.GetProperty("placements")[0];
        Assert.Equal("Sun", sun.GetProperty("name").GetString());
        Assert.Equal("Cancer", sun.GetProperty("sign").GetString());
        Assert.Equal(12.5, sun.GetProperty("degree").GetDouble());
    }

    [Theory]
    [InlineData("", "10:30")]
    [InlineData("test-key", "not a time")]
    public async Task Missing_key_or_invalid_time_does_not_contact_provider(string key, string time)
    {
        var handler = new Handler(Geo, Planets);
        Assert.Null(await Service(handler, key).GetNatalChartAsync(new(1998, 7, 3), time, "New York, US", default));
        Assert.Empty(handler.Calls);
    }

    [Theory]
    [InlineData(2026, 3, 8, "02:30")]
    [InlineData(2026, 11, 1, "01:30")]
    public async Task Dst_gaps_and_overlaps_do_not_guess_a_birth_instant(int year, int month, int day, string time)
    {
        var handler = new Handler(Geo, Planets);
        Assert.Null(await Service(handler).GetNatalChartAsync(new(year, month, day), time, "New York, US", default));
        Assert.Single(handler.Calls);
    }

    [Theory]
    [InlineData("[]")]
    [InlineData("invalid json")]
    [InlineData("{\"statusCode\":429}")]
    [InlineData("{\"statusCode\":\"error\"}")]
    public async Task Invalid_or_empty_locations_fail_without_a_planet_lookup(string geo)
    {
        var handler = new Handler(geo, Planets);
        Assert.Null(await Service(handler).GetNatalChartAsync(new(1998, 7, 3), "10:30", "New York, US", default));
        Assert.Single(handler.Calls);
    }

    [Fact]
    public async Task Ambiguous_locations_fail_without_selecting_the_first_result()
    {
        var second = Geo.Replace("40.71", "41.71");
        var handler = new Handler(Geo[..^1] + "," + second[1..], Planets);
        Assert.Null(await Service(handler).GetNatalChartAsync(new(1998, 7, 3), "10:30", "New York, US", default));
        Assert.Single(handler.Calls);
    }

    /// <summary>Postal region abbreviations in saved profiles must resolve against US regions, not country aliases.</summary>
    [Theory]
    [InlineData("New York, NY")]
    [InlineData("New York, ny, US")]
    [InlineData("New York, New York, US")]
    public async Task Us_state_names_and_codes_resolve_the_saved_location(string birthplace)
    {
        var handler = new Handler(Geo, Planets);
        Assert.NotNull(await Service(handler).GetNatalChartAsync(new(1998, 7, 3), "10:30", birthplace, default));
        Assert.Equal(2, handler.Calls.Count);
        Assert.Equal(40.71, handler.Calls[1].Body.GetProperty("latitude").GetDouble());
    }

    /// <summary>CA can mean California or Canada; an explicit country disambiguates, otherwise do not guess.</summary>
    [Theory]
    [InlineData("New York, CA", null)]
    [InlineData("New York, CA, US", 40.71)]
    [InlineData("New York, California", 40.71)]
    [InlineData("New York, Canada", 41.71)]
    public async Task Country_state_code_collisions_require_one_distinct_location(string birthplace, double? latitude)
    {
        var california = Geo.Replace("\"administrative_zone_1\":\"New York\"", "\"administrative_zone_1\":\"California\"");
        var canada = Geo.Replace("United States", "Canada").Replace("40.71", "41.71")
            .Replace("\"administrative_zone_1\":\"New York\"", "\"administrative_zone_1\":\"Ontario\"");
        var handler = new Handler(california[..^1] + "," + canada[1..], Planets);
        var result = await Service(handler).GetNatalChartAsync(new(1998, 7, 3), "10:30", birthplace, default);
        if (latitude is null)
        {
            Assert.Null(result);
            Assert.Single(handler.Calls);
        }
        else
        {
            Assert.NotNull(result);
            Assert.Equal(latitude.Value, handler.Calls[1].Body.GetProperty("latitude").GetDouble());
        }
    }

    /// <summary>US postal aliases cannot match a similarly named region in another country.</summary>
    [Fact]
    public async Task Us_postal_aliases_do_not_expand_for_non_us_results()
    {
        var handler = new Handler(Geo.Replace("United States", "Canada"), Planets);
        Assert.Null(await Service(handler).GetNatalChartAsync(new(1998, 7, 3), "10:30", "New York, NY", default));
        Assert.Single(handler.Calls);
    }

    [Theory]
    [InlineData("[]")]
    [InlineData("{\"statusCode\":200,\"output\":[]}")]
    [InlineData("{\"statusCode\":429,\"output\":[]}")]
    public async Task Unusable_chart_responses_are_not_returned_as_success(string planets)
    {
        var handler = new Handler(Geo, planets);
        Assert.Null(await Service(handler).GetNatalChartAsync(new(1998, 7, 3), "10:30", "New York, US", default));
    }

    [Theory]
    [InlineData(HttpStatusCode.Unauthorized)]
    [InlineData(HttpStatusCode.TooManyRequests)]
    public async Task Provider_rejections_do_not_retry_or_spend_more_requests(HttpStatusCode status)
    {
        var handler = new Handler(Geo, Planets) { Status = status };
        Assert.Null(await Service(handler).GetNatalChartAsync(new(1998, 7, 3), "10:30", "New York, US", default));
        Assert.Single(handler.Calls);
    }

    [Fact]
    public async Task Caller_cancellation_propagates()
    {
        var handler = new Handler(Geo, Planets);
        using var cancelled = new CancellationTokenSource();
        cancelled.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => Service(handler).GetNatalChartAsync(new(1998, 7, 3), "10:30", "New York, US", cancelled.Token));
        Assert.Empty(handler.Calls);
    }

    [Fact]
    public async Task Controller_requires_explicit_saved_details_before_contacting_selected_provider()
    {
        var charts = new Mock<IBirthChartService>();
        var users = new Mock<IFileUserRepository>();
        users.Setup(u => u.GetByIdAsync(7)).ReturnsAsync(new User
        {
            Id = 7, SelectedPathway = SpiritualPathwayKeys.Energy, Birthday = new(1998, 7, 3),
            PathwayPreferences = new() { Focus = ["daily-astrology"], SaveBirthDetails = false }
        });
        var controller = new BirthChartController(charts.Object, users.Object, Options.Create(new FreeAstrologyApiOptions { ApiKey = "test-key" }))
        {
            ControllerContext = new() { HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "7")], "test")) } }
        };
        Assert.IsType<BadRequestObjectResult>(await controller.GetBirthChart(default));
        charts.VerifyNoOtherCalls();
    }

    /// <summary>Retained profile details do not authorize provider calls after the user changes pathway.</summary>
    [Theory]
    [InlineData(SpiritualPathwayKeys.Faith)]
    [InlineData(SpiritualPathwayKeys.Mindfulness)]
    public async Task Controller_does_not_use_retained_birth_details_outside_energy(string pathway)
    {
        var charts = new Mock<IBirthChartService>();
        var users = new Mock<IFileUserRepository>();
        users.Setup(u => u.GetByIdAsync(7)).ReturnsAsync(new User
        {
            Id = 7, SelectedPathway = pathway, Birthday = new(1998, 7, 3),
            PathwayPreferences = new() { Focus = ["daily-astrology"], SaveBirthDetails = true, BirthTime = "10:30", BirthPlace = "New York, US" }
        });
        var controller = new BirthChartController(charts.Object, users.Object, Options.Create(new FreeAstrologyApiOptions { ApiKey = "test-key" }))
        {
            ControllerContext = new() { HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "7")], "test")) } }
        };
        Assert.IsType<NotFoundResult>(await controller.GetBirthChart(default));
        charts.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Controller_returns_selected_provider_chart_for_opted_in_user()
    {
        var handler = new Handler(Geo, Planets);
        var users = new Mock<IFileUserRepository>();
        users.Setup(u => u.GetByIdAsync(7)).ReturnsAsync(new User
        {
            Id = 7, SelectedPathway = SpiritualPathwayKeys.Energy, Birthday = new(1998, 7, 3),
            PathwayPreferences = new() { Focus = ["daily-astrology"], SaveBirthDetails = true, BirthTime = "10:30", BirthPlace = "New York, US" }
        });
        var controller = new BirthChartController(Service(handler), users.Object, Options.Create(new FreeAstrologyApiOptions { ApiKey = "test-key" }))
        {
            ControllerContext = new() { HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "7")], "test")) } }
        };
        var response = Assert.IsType<OkObjectResult>(await controller.GetBirthChart(default));
        var chart = Assert.IsType<AuraLogbook.Api.Models.Dto.NatalChartDto>(response.Value);
        Assert.Equal("FreeAstrologyAPI", chart.Provider);
        Assert.Equal("Cancer", chart.Chart.GetProperty("placements")[0].GetProperty("sign").GetString());
        Assert.Equal(2, handler.Calls.Count);
    }

    /// <summary>Records sanitized requests against documented response fixtures without accessing any live account.</summary>
    private sealed class Handler(string geo, string planets) : HttpMessageHandler
    {
        public List<(string Url, string Key, JsonElement Body)> Calls { get; } = [];
        public HttpStatusCode Status { get; init; } = HttpStatusCode.OK;

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            using var body = JsonDocument.Parse(await request.Content!.ReadAsStringAsync(cancellationToken));
            Calls.Add((request.RequestUri!.AbsoluteUri, request.Headers.GetValues("x-api-key").Single(), body.RootElement.Clone()));
            return new HttpResponseMessage(Status) { Content = new StringContent(request.RequestUri.AbsolutePath == "/geo-details" ? geo : planets) };
        }
    }
}
