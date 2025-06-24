// Controllers/WeatherController.cs
using AuraLogbookApi.Dtos;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class WeatherController : ControllerBase
{
    private readonly IWeatherService _ws;
    public WeatherController(IWeatherService ws) => _ws = ws;

    [HttpGet("current")]
    public async Task<ActionResult<WeatherDto>> GetCurrent(
        [FromQuery] double? lat,
        [FromQuery] double? lon,
        [FromQuery] string city,
        [FromQuery] string state,
        [FromQuery] string country)
    {
        // Validate: either coords or city must be present
        if (!(lat.HasValue && lon.HasValue) && string.IsNullOrWhiteSpace(city))
            return BadRequest("Please provide either ?lat={lat}&lon={lon} or ?city={city}&state={state}&country={country}");

        try
        {
            var weather = await _ws.GetCurrentAsync(lat, lon, city, state, country);
            return Ok(weather);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (HttpRequestException)
        {
            return StatusCode(502, "Error fetching data from Weatherbit.");
        }
    }
}
