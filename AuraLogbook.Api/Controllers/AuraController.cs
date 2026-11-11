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
public sealed class AuraController(IFileUserRepository users, IFileMoodRepository moods, IMoodCombinationRepository combinations) : ControllerBase
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
}
