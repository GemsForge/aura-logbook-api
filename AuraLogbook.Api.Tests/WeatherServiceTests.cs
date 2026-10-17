using AuraLogbook.Api.Services;
using Microsoft.AspNetCore.WebUtilities;
using System.Net;
using System.Text;

namespace AuraLogbook.Api.Tests;

public class WeatherServiceTests
{
    [Fact]
    public async Task GetCurrentAsync_uses_coordinates_and_maps_current_conditions()
    {
        Uri? requestUri = null;
        var client = new HttpClient(new StubHttpMessageHandler(request =>
        {
            requestUri = request.RequestUri;
            return JsonResponse("""{"current":{"temperature_2m":68.4,"weather_code":2,"is_day":1}}""");
        }));
        var service = new WeatherService(client);

        var weather = await service.GetCurrentAsync(40.7128, -74.006, null, null, null);

        Assert.NotNull(requestUri);
        var query = QueryHelpers.ParseQuery(requestUri!.Query);
        Assert.Equal("40.7128", query["latitude"]);
        Assert.Equal("-74.006", query["longitude"]);
        Assert.Equal("temperature_2m,weather_code,is_day", query["current"]);
        Assert.Equal("fahrenheit", query["temperature_unit"]);
        Assert.Equal(68.4, weather.Temperature);
        Assert.Equal("Partly cloudy", weather.Description);
        Assert.Equal("c03d", weather.IconCode);
    }

    [Fact]
    public async Task GetCurrentAsync_resolves_city_then_requests_forecast_with_night_icon()
    {
        var requestUris = new List<Uri?>();
        var client = new HttpClient(new StubHttpMessageHandler(request =>
        {
            requestUris.Add(request.RequestUri);
            if (request.RequestUri!.Host == "geocoding-api.open-meteo.com")
                return JsonResponse("""{"results":[{"name":"Paris","latitude":48.8566,"longitude":2.3522,"country_code":"FR","admin1":"Ile-de-France"}]}""");

            return JsonResponse("""{"current":{"temperature_2m":54,"weather_code":0,"is_day":0}}""");
        }));
        var service = new WeatherService(client);

        var weather = await service.GetCurrentAsync(null, null, "Paris", null, "FR");

        Assert.Equal(2, requestUris.Count);
        var locationQuery = QueryHelpers.ParseQuery(requestUris[0]!.Query);
        Assert.Equal("Paris", locationQuery["name"]);
        Assert.Equal("FR", locationQuery["countryCode"]);
        var forecastQuery = QueryHelpers.ParseQuery(requestUris[1]!.Query);
        Assert.Equal("48.8566", forecastQuery["latitude"]);
        Assert.Equal("2.3522", forecastQuery["longitude"]);
        Assert.Equal("Clear sky", weather.Description);
        Assert.Equal("c01n", weather.IconCode);
    }

    [Fact]
    public async Task GetCurrentAsync_throws_argument_exception_when_city_is_not_found()
    {
        var client = new HttpClient(new StubHttpMessageHandler(_ =>
            JsonResponse("{}")));
        var service = new WeatherService(client);

        var exception = await Assert.ThrowsAsync<ArgumentException>(() =>
            service.GetCurrentAsync(null, null, "Unknown Place", null, null));

        Assert.Contains("Unknown Place", exception.Message);
    }

    private static HttpResponseMessage JsonResponse(string json) => new(HttpStatusCode.OK)
    {
        Content = new StringContent(json, Encoding.UTF8, "application/json")
    };

    private sealed class StubHttpMessageHandler(
        Func<HttpRequestMessage, HttpResponseMessage> send) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) => Task.FromResult(send(request));
    }
}
