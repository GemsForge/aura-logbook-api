using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuraLogbook.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/reflections")]
public sealed class ReflectionController(IReflectionRepository repository) : ControllerBase
{
    [HttpGet("prompts")]
    public async Task<IActionResult> GetPrompts(
        [FromQuery] int? pathwayKey,
        [FromQuery] string? auraColorKey,
        [FromQuery] string? chakraKey)
    {
        if (pathwayKey is not null && !Enum.IsDefined(typeof(SpiritualPathway), pathwayKey.Value))
            return BadRequest("Unknown pathway key.");

        var prompts = await repository.GetActivePromptsAsync(pathwayKey, auraColorKey, chakraKey);
        return Ok(prompts);
    }

    [HttpGet("responses")]
    public async Task<IActionResult> GetResponses([FromQuery] int? moodEntryId)
    {
        if (!TryGetAuthenticatedUserId(out var userId))
            return Unauthorized();

        var responses = await repository.GetResponsesAsync(userId, moodEntryId);
        return Ok(responses);
    }

    [HttpGet("responses/{id:int}")]
    public async Task<IActionResult> GetResponse(int id)
    {
        if (!TryGetAuthenticatedUserId(out var userId))
            return Unauthorized();

        var response = await repository.GetResponseAsync(userId, id);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpPost("responses")]
    public async Task<IActionResult> CreateResponse([FromBody] CreateReflectionResponseRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ResponseText))
            return BadRequest("Response text is required.");

        if (!TryGetAuthenticatedUserId(out var userId))
            return Unauthorized();

        var response = await repository.CreateResponseAsync(
            userId, request.PromptId, request.MoodEntryId, request.ResponseText);
        if (response is null)
            return NotFound("An active prompt and a mood entry owned by the current user are required.");

        return CreatedAtAction(nameof(GetResponse), new { id = response.Id }, response);
    }

    private bool TryGetAuthenticatedUserId(out int userId)
    {
        userId = 0;
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
        return claim is not null && int.TryParse(claim.Value, out userId);
    }
}
