using System.Security.Claims;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Services.Astrology;
using AuraLogbook.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Controllers;

/// <summary>Serves an optional natal chart only for users who saved the required birth details.</summary>
[Authorize]
[ApiController]
[Route("api/astrology")]
public sealed class BirthChartController : ControllerBase
{
    private readonly IBirthChartService _birthChart;
    private readonly IFileUserRepository _users;
    private readonly AstrologyApiOptions _options;

    /// <summary>Creates the authenticated chart endpoint with the saved-profile and provider services.</summary>
    public BirthChartController(
        IBirthChartService birthChart,
        IFileUserRepository users,
        IOptions<AstrologyApiOptions> options)
    {
        _birthChart = birthChart;
        _users = users;
        _options = options.Value;
    }

    /// <summary>Returns a chart only when Astrology &amp; Energy and explicit birth-detail saving are active.</summary>
    [HttpGet("birth-chart")]
    public async Task<IActionResult> GetBirthChart(CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
            return StatusCode(StatusCodes.Status503ServiceUnavailable, "Birth chart readings are not configured.");

        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (claim is null || !int.TryParse(claim.Value, out var userId)) return Unauthorized();
        var user = await _users.GetByIdAsync(userId);
        if (user is null) return NotFound("User not found.");

        var preferences = user.PathwayPreferences;
        if (user.SelectedPathway != SpiritualPathwayKeys.Energy ||
            preferences is null || !preferences.Focus.Contains("daily-astrology"))
            return NotFound();
        if (!preferences.SaveBirthDetails || string.IsNullOrWhiteSpace(preferences.BirthTime) ||
            string.IsNullOrWhiteSpace(preferences.BirthPlace) || user.Birthday is null)
            return BadRequest("Save your birth time and birthplace in Profile settings to request a deeper chart.");

        var chart = await _birthChart.GetNatalChartAsync(user.Birthday.Value, preferences.BirthTime, preferences.BirthPlace, cancellationToken);
        return chart is null
            ? StatusCode(StatusCodes.Status502BadGateway, "The birth chart is unavailable right now.")
            : Ok(chart);
    }
}
