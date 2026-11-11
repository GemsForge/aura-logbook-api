using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services.Aura;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuraLogbook.Api.Controllers;

/// <summary>Serves the signed-in user's derived aura (#343).</summary>
[ApiController]
[Authorize]
[Route("api/aura")]
public sealed class AuraController(IFileUserRepository users, IFileMoodRepository moods, IMoodCombinationRepository combinations, IAuraSeasonRepository seasons) : ControllerBase
{
    /// <summary>
    /// Computes the current aura from onboarding answers, recent mood logs (with authored mood-combination
    /// hues, #345) and the pathway base layer.
    /// Computed on read, so it always reflects the latest check-ins.
    /// </summary>
    /// <response code="200">The aura tone and its contributors.</response>
    [HttpGet("current")]
    public async Task<ActionResult<AuraDto>> GetCurrent()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
        if (claim is null || !int.TryParse(claim.Value, out var userId))
            return Unauthorized("Could not extract user ID from token.");

        var user = await users.GetByIdAsync(userId);
        if (user is null) return NotFound("User not found.");

        var entries = await moods.GetAllByUserAsync(userId);
        var hues = await combinations.GetHuesAsync();
        return Ok(AuraEngine.Compute(user, entries, DateOnly.FromDateTime(DateTime.UtcNow), hues));
    }

    /// <summary>Returns the held named season and its history, updating history when a new pattern holds.</summary>
    [HttpGet("seasons")]
    public async Task<ActionResult<AuraSeasonResponseDto>> GetSeasons()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
        if (claim is null || !int.TryParse(claim.Value, out var userId)) return Unauthorized("Could not extract user ID from token.");
        var user = await users.GetByIdAsync(userId);
        if (user is null) return NotFound("User not found.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var entries = await moods.GetAllByUserAsync(userId);
        var dailyKeys = Enumerable.Range(0, AuraSeasons.WindowDays)
            .Select(offset => today.AddDays(-offset))
            .Select(day =>
            {
                var dayEntries = entries.Where(entry => entry.Date == day).ToList();
                if (dayEntries.Count == 0) return null;
                var aura = AuraEngine.Compute(user, dayEntries, day, null);
                return AuraSeasons.KeyFor(aura.Hue, aura.Strength);
            })
            .Reverse().ToList();
        var logs = entries.Count(entry => entry.Date <= today && today.DayNumber - entry.Date.DayNumber < AuraSeasons.WindowDays);
        var held = AuraSeasons.Holding(dailyKeys, logs);
        var latest = user.AuraRevealsEnabled ? await seasons.GetLatestAsync(userId) : null;
        if (user.AuraRevealsEnabled && held is not null && latest?.SeasonKey != held)
            await seasons.StartAsync(userId, held, today);

        var pathway = user.SelectedPathway;
        var history = user.AuraRevealsEnabled ? await seasons.GetHistoryAsync(userId) : [];
        var currentKey = held ?? latest?.SeasonKey;
        var current = user.AuraRevealsEnabled && currentKey is not null ? AuraSeasons.All[currentKey] : null;
        return Ok(new AuraSeasonResponseDto(
            current is null ? null : new AuraSeasonDto(current.Key, current.Name, current.OftenLinkedWith, current.Prompts[pathway], current.NextStep),
            history.Select(span => new AuraSeasonHistoryDto(span.SeasonKey, AuraSeasons.All[span.SeasonKey].Name, span.StartedOn, span.EndedOn)).ToList()));
    }
}
