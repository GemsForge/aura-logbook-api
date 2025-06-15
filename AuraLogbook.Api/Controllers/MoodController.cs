using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize] // 👈 Requires a valid JWT to access any endpoint
[Route("api/[controller]")]
[ApiController]
public class MoodController : ControllerBase
{
    // Inject services/repositories here

    [HttpGet]
    public IActionResult GetUserMoods()
    {
        // Extract user ID from token if needed:
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        // Use the ID to fetch user-specific mood data
        return Ok($"Fetching moods for user {userId}");
    }

    [HttpPost]
    public IActionResult LogMood([FromBody] string mood)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        // Save mood entry associated with userId
        return Ok($"Mood '{mood}' logged for user {userId}");
    }
}
