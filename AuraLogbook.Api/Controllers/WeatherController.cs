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
        [FromQuery] string? country)
    {
        // Validate: either coords or city must be present
        if (!(lat.HasValue && lon.HasValue) && string.IsNullOrWhiteSpace(city))
            return BadRequest("Please provide either ?lat={lat}&lon={lon} or ?city={city} (with optional state and country).");

        try
        {
            var weather = await _ws.GetCurrentAsync(lat, lon, city, state, country);
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
