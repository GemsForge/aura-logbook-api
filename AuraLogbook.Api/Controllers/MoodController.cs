using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[Authorize] // 👈 Requires a valid JWT to access any endpoint
[Route("api/[controller]")]
[ApiController]
public class MoodController : ControllerBase
{
    // Inject services/repositories here
    private readonly IMoodService _moodService;

    public MoodController(IMoodService moodService)
    {
        _moodService = moodService;
    }

    private int GetUserIdFromToken()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return userIdClaim != null && int.TryParse(userIdClaim.Value, out int id)
            ? id
            : throw new UnauthorizedAccessException("Invalid or missing user ID in token.");
    }

    [HttpGet]
    public async Task<IActionResult> GetUserMoods()
    {
        var userId = GetUserIdFromToken();
        var moods = await _moodService.GetEntriesForUserAsync(userId);
        return Ok(moods);
    }

    [HttpPost]
    public async Task<IActionResult> LogMood([FromBody] MoodEntryRequest moodRequest)
    {
        var userId = GetUserIdFromToken();
        var result = await _moodService.CreateMoodAsync(userId, moodRequest);
        return result.Success ? Ok(result.Message) : BadRequest(result.Message);
    }

    // READ: Get specific mood entry by ID
    [HttpGet("{id}")]
    public async Task<IActionResult> GetMoodById(int id)
    {
        var userId = GetUserIdFromToken();
        var mood = await _moodService.GetEntriesForUserAsync(userId);
        return mood is null ? NotFound("Mood entry not found.") : Ok(mood);
    }

       // DELETE: Remove mood entry
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMood(int id)
    {
        var userId = GetUserIdFromToken();
        var result = await _moodService.DeleteMoodAsync(userId, id);
        return result.Success ? Ok(result.Message) : NotFound(result.Message);
    }
}
