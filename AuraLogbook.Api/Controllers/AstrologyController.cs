using System.Security.Claims;
using AuraLogbook.Api.Services.Astrology;
using AuraLogbook.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Controllers;

/// <summary>Authenticated astrology summaries based only on the signed-in user's own saved data.</summary>
[Authorize]
[ApiController]
[Route("api/astrology")]
public sealed class AstrologyController : ControllerBase
{
    private readonly IMoonPhaseMoodInsightsService _moonInsights;
    private readonly IDailyHoroscopeService _dailyHoroscope;
    private readonly IFileUserRepository _users;
    private readonly FreeAstroApiOptions _options;

    /// <summary>Creates the astrology controller with the provider-backed mood-phase summary.</summary>
    public AstrologyController(
        IMoonPhaseMoodInsightsService moonInsights,
        IDailyHoroscopeService dailyHoroscope,
        IFileUserRepository users,
        IOptions<FreeAstroApiOptions> options)
    {
        _moonInsights = moonInsights;
        _dailyHoroscope = dailyHoroscope;
        _users = users;
        _options = options.Value;
    }

    /// <summary>Returns the signed-in user's daily sun-sign reading from the configured horoscope provider.</summary>
    [HttpGet("daily-horoscope")]
    public async Task<IActionResult> GetDailyHoroscope(CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
            return StatusCode(StatusCodes.Status503ServiceUnavailable, "Daily astrology is not configured.");

        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (claim is null || !int.TryParse(claim.Value, out var userId)) return Unauthorized();
        var user = await _users.GetByIdAsync(userId);
        if (user is null) return NotFound("User not found.");
        if (string.IsNullOrWhiteSpace(user.ZodiacSign)) return BadRequest("Add a birthday to your profile to get a sun-sign reading.");

        var result = await _dailyHoroscope.GetDailyAsync(user.ZodiacSign, cancellationToken);
        return result is null ? StatusCode(StatusCodes.Status502BadGateway, "The daily reading is unavailable right now.") : Ok(result);
    }

    /// <summary>Returns counts and mood selections grouped by reported lunar phase for a date range of up to 31 days.</summary>
    [HttpGet("moon-mood-counts")]
    public async Task<IActionResult> GetMoonMoodCounts(
        [FromQuery] DateOnly startDate,
        [FromQuery] DateOnly endDate,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
            return StatusCode(StatusCodes.Status503ServiceUnavailable, "Moon phase insights are not configured.");
        if (endDate < startDate || endDate.DayNumber - startDate.DayNumber > 30)
            return BadRequest("Choose a date range no longer than 31 days.");

        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (claim is null || !int.TryParse(claim.Value, out var userId))
            return Unauthorized();

        var result = await _moonInsights.GetInsightsAsync(userId, startDate, endDate, cancellationToken);
        return Ok(result);
    }
}
