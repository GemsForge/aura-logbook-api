using System.Security.Claims;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Services.PathwayActivities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuraLogbook.Api.Controllers;

/// <summary>Authenticated CRUD endpoints for private pathway activities and insight feedback.</summary>
[Authorize]
[ApiController]
[Route("api/pathway-activities")]
public sealed class PathwayActivitiesController : ControllerBase
{
    private readonly IPathwayActivityService _service;

    /// <summary>Creates the controller with the pathway activity service.</summary>
    public PathwayActivitiesController(IPathwayActivityService service) => _service = service;

    /// <summary>Lists the signed-in user's pathway activities with optional filters.</summary>
    [HttpGet]
    public async Task<IActionResult> GetMine([FromQuery] string? pathway, [FromQuery] string? moduleKey, [FromQuery] string? activityType) =>
        Ok(await _service.GetByUserAsync(GetUserId(), pathway, moduleKey, activityType));

    /// <summary>Reads one activity only when it belongs to the signed-in user.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var activity = await _service.GetByIdAsync(GetUserId(), id);
        return activity is null ? NotFound("Pathway activity not found.") : Ok(activity);
    }

    /// <summary>Creates a validated practice, check-in, or insight-feedback record for the signed-in user.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PathwayActivityRequest request)
    {
        var result = await _service.CreateAsync(GetUserId(), request);
        return result.Success ? CreatedAtAction(nameof(GetById), new { id = result.Activity!.Id }, result.Activity) : BadRequest(result.Message);
    }

    /// <summary>Replaces an owner-scoped record after validating the pathway-specific content.</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] PathwayActivityRequest request)
    {
        var result = await _service.UpdateAsync(GetUserId(), id, request);
        return result.Success ? NoContent() : result.Message == "Pathway activity not found." ? NotFound(result.Message) : BadRequest(result.Message);
    }

    /// <summary>Deletes an activity only when it belongs to the signed-in user.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => await _service.DeleteAsync(GetUserId(), id)
        ? NoContent()
        : NotFound("Pathway activity not found.");

    /// <summary>Resolves the authenticated account identifier from the validated JWT claims.</summary>
    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && int.TryParse(claim.Value, out var id)
            ? id
            : throw new UnauthorizedAccessException("Invalid or missing user ID in token.");
    }
}
