using AuraLogbookApi.Dtos;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace AuraLogbook.Api.Tests;

public class WeatherControllerTests
{
    [Fact]
    public async Task GetCurrentAsync_allows_city_without_optional_state_or_country()
    {
        var weather = new WeatherDto { Temperature = 68, Description = "Clear", IconCode = "c01d" };
        var service = new Mock<IWeatherService>();
        service.Setup(x => x.GetCurrentAsync(null, null, "Paris", null, null, null))
            .ReturnsAsync(weather);
        var controller = new WeatherController(service.Object, NullLogger<WeatherController>.Instance);

        var result = await controller.GetCurrent(null, null, "Paris", null, null);

        Assert.IsType<OkObjectResult>(result.Result);
        service.Verify(x => x.GetCurrentAsync(null, null, "Paris", null, null, null), Times.Once);
    }

    [Fact]
    public async Task GetCurrentAsync_rounds_coordinates_to_city_level_before_calling_the_provider()
    {
        var service = new Mock<IWeatherService>();
        service.Setup(x => x.GetCurrentAsync(It.IsAny<double?>(), It.IsAny<double?>(), null, null, null, "C"))
            .ReturnsAsync(new WeatherDto { Temperature = 20, Unit = "C" });
        var controller = new WeatherController(service.Object, NullLogger<WeatherController>.Instance);

        await controller.GetCurrent(33.748995, -84.387982, null, null, null, "C");

        // Two decimals (~1 km): precise device coordinates never reach the weather provider.
        service.Verify(x => x.GetCurrentAsync(33.75, -84.39, null, null, null, "C"), Times.Once);
    }

    [Fact]
    public async Task GetCurrentAsync_returns_generic_bad_gateway_for_provider_status_errors()
    {
        var service = new Mock<IWeatherService>();
        service.Setup(x => x.GetCurrentAsync(null, null, "Paris", null, null, null))
            .ThrowsAsync(new HttpRequestException("provider response", null, System.Net.HttpStatusCode.Forbidden));
        var controller = new WeatherController(service.Object, NullLogger<WeatherController>.Instance);

        var result = await controller.GetCurrent(null, null, "Paris", null, null);

        var response = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status502BadGateway, response.StatusCode);
        Assert.Equal("Error fetching current weather.", response.Value);
    }
}
