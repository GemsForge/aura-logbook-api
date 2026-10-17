using AuraLogbook.Api.Services;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Text;

namespace AuraLogbook.Api.Tests;

public class WeatherServiceTests
{
    [Fact]
    public async Task GetCurrentAsync_formats_city_and_state_as_weatherbit_city_parameter()
    {
        Uri? requestUri = null;
        var client = new HttpClient(new StubHttpMessageHandler(request =>
        {
            requestUri = request.RequestUri;
            return new HttpResponseMessage(HttpStatusCode.BadRequest);
        }));
        var service = CreateService(client);

        await Assert.ThrowsAsync<HttpRequestException>(() =>
            service.GetCurrentAsync(null, null, "New York", "NY", "US"));

        Assert.NotNull(requestUri);
        var query = QueryHelpers.ParseQuery(requestUri!.Query);
        Assert.Equal("New York,NY", query["city"]);
        Assert.Equal("US", query["country"]);
        Assert.False(query.ContainsKey("state"));
    }

    [Fact]
    public async Task GetCurrentAsync_uses_invariant_coordinate_format()
    {
        Uri? requestUri = null;
        var client = new HttpClient(new StubHttpMessageHandler(request =>
        {
            requestUri = request.RequestUri;
            return new HttpResponseMessage(HttpStatusCode.BadRequest);
        }));
        var service = CreateService(client);

        await Assert.ThrowsAsync<HttpRequestException>(() =>
            service.GetCurrentAsync(40.7128, -74.006, null, null, null));

        Assert.NotNull(requestUri);
        var query = QueryHelpers.ParseQuery(requestUri!.Query);
        Assert.Equal("40.7128", query["lat"]);
        Assert.Equal("-74.006", query["lon"]);
    }

    private static WeatherService CreateService(HttpClient client)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Weatherbit:ApiKey"] = "test-key",
                ["Weatherbit:BaseUrl"] = "https://weather.example/v2.0/"
            })
            .Build();

        return new WeatherService(client, configuration);
    }

    private sealed class StubHttpMessageHandler(
        Func<HttpRequestMessage, HttpResponseMessage> send) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) => Task.FromResult(send(request));
    }
}
