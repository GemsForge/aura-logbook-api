// Controllers/WeatherController.cs
using AuraLogbookApi.Dtos;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class WeatherController : ControllerBase
{
    private readonly IWeatherService _ws;
    private readonly ILogger<WeatherController> _logger;

    public WeatherController(IWeatherService ws, ILogger<WeatherController> logger)
    {
        _ws = ws;
        _logger = logger;
    }

    [HttpGet("current")]
    public async Task<ActionResult<WeatherDto>> GetCurrent(
        [FromQuery] double? lat,
        [FromQuery] double? lon,
        [FromQuery] string? city,
        [FromQuery] string? state,
        [FromQuery] string? country,
        [FromQuery] string? unit = null)
    {
        // Validate: either coords or city must be present
        if (!(lat.HasValue && lon.HasValue) && string.IsNullOrWhiteSpace(city))
            return BadRequest("Please provide either ?lat={lat}&lon={lon} or ?city={city} (with optional state and country).");

        try
        {
            // #331: coordinates are rounded to city level before they reach the provider, even if a
            // client sends more precision. Neither form is logged or stored.
            var roundedLat = lat.HasValue ? AuraLogbook.Api.Models.WeatherLocationValues.RoundCoordinate(lat.Value) : (double?)null;
            var roundedLon = lon.HasValue ? AuraLogbook.Api.Models.WeatherLocationValues.RoundCoordinate(lon.Value) : (double?)null;
            var weather = await _ws.GetCurrentAsync(roundedLat, roundedLon, city, state, country, unit);
            return Ok(weather);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(
                "Weather provider request failed with HTTP status {StatusCode}.",
                ex.StatusCode);
            return StatusCode(502, "Error fetching current weather.");
        }
    }
}
