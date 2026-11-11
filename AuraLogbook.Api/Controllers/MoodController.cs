using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Models.Dto.Insights;
using AuraLogbook.Api.Models.Enums;
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
    private readonly IMoodStatsService _moodStatsService;
    private readonly IMoodMediaService _moodMediaService;
    private readonly ILogger<MoodController> _logger;
    public MoodController(IMoodService moodService, IMoodStatsService moodStatsService, IMoodMediaService moodMediaService, ILogger<MoodController> logger)
    {
        _moodService = moodService;
        _moodStatsService = moodStatsService;
        _moodMediaService = moodMediaService;
        _logger = logger;
    }

    private int GetUserIdFromToken()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return userIdClaim != null && int.TryParse(userIdClaim.Value, out int id)
            ? id
            : throw new UnauthorizedAccessException("Invalid or missing user ID in token.");
    }

    [HttpGet]
    public async Task<IActionResult> GetUserMoods([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var userId = GetUserIdFromToken();
        var moods = await _moodService.GetEntriesForUserAsync(userId, startDate, endDate);
        return Ok(moods);
    }

    [HttpPost]
    [ProducesResponseType(typeof(MoodEntryCreatedResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> LogMood([FromBody] MoodEntryRequest moodRequest)
    {
        var userId = GetUserIdFromToken();
        var result = await _moodService.CreateMoodAsync(userId, moodRequest);
        if (!result.Success)
            return BadRequest(result.Message);

        var response = new MoodEntryCreatedResponse(result.EntryId, result.Message);
        return CreatedAtAction(nameof(GetMoodById), new { id = result.EntryId }, response);
    }

    /// <summary>Returns one mood entry only when it belongs to the authenticated user.</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetMoodById(int id)
    {
        var userId = GetUserIdFromToken();
        var mood = await _moodService.GetEntryForUserAsync(userId, id);
        return mood is null ? NotFound("Mood entry not found.") : Ok(mood);
    }

       // DELETE: Remove mood entry
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMood(int id)
    {
        var userId = GetUserIdFromToken();
        var result = await _moodService.DeleteMoodAsync(userId, id);
        if (result.Success)
        {
            // Media metadata has no SQL mood FK because Production still uses file-based mood storage.
            try
            {
                await _moodMediaService.DeleteForMoodAsync(userId, id, CancellationToken.None);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Could not finish private media cleanup for deleted mood {MoodEntryId}", id);
            }
        }
        return result.Success ? Ok(result.Message) : NotFound(result.Message);
    }

    // UPDATE: Update mood entry
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMood(int id, [FromBody] MoodEntryRequest moodRequest)
    {
        var userId = GetUserIdFromToken();
        var result = await _moodService.UpdateMoodAsync(userId, id, moodRequest);
        return result.Success ? Ok(result.Message) : BadRequest(result.Message);
    }

    [HttpGet("dashboard/summary")]
    public async Task<IActionResult> GetDashboardSummary()
    {
        var userId = GetUserIdFromToken();
        var summary = await _moodStatsService.GetDashboardSummaryAsync(userId);
        return Ok(summary);
    }

    [HttpGet("dashboard/moods-by-date")]
    public async Task<IActionResult> GetMoodsByDate([FromQuery] string range = "7d")
    {
        var userId = GetUserIdFromToken();
        if (!int.TryParse(range.TrimEnd('d', 'D'), out var days))
            return BadRequest("Invalid range format. Use values like 7d, 30d, etc.");

        var result = await _moodStatsService.GetMoodsByDateRangeAsync(userId, days);
        return Ok(result);
    }

    [HttpGet("dashboard/mood-breakdown")]
    public async Task<IActionResult> GetMoodBreakdown([FromQuery] bool percent = false)
    {
        var userId = GetUserIdFromToken();

        List<MoodFrequencyResponse> breakdown = percent
            ? await _moodStatsService.GetMoodBreakdownPercentageAsync(userId)
            : await _moodStatsService
            .GetMoodBreakdownCountAsync(userId);

        return Ok(breakdown);
    }


#if DEBUG
    [HttpPost("seed-test-data")]
    public async Task<IActionResult> SeedMoodData([FromQuery] int days = 30)
    {
        var userId = GetUserIdFromToken();
        var rand = new Random();
        var moodTypes = Enum.GetValues(typeof(MoodType)).Cast<MoodType>().ToList();

        for (int i = 0; i < days; i++)
        {
            var entry = new MoodEntryRequest
            {
                Date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-i)),
                Moods = moodTypes.OrderBy(_ => rand.Next()).Take(rand.Next(1, 4)).ToList(),
                Comment = "Seeded entry"
            };

            await _moodService.CreateMoodAsync(userId, entry);
        }

        return Ok($"Seeded {days} days of mood data for user {userId}.");
    }
#endif

}
