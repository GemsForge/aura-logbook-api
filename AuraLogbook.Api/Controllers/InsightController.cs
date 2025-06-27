using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AuraLogbook.Api.Controllers
{
    // Controllers/InsightController.cs
    [ApiController]
    [Route("api/insights")]
    public class InsightController : ControllerBase
    {
        private readonly IAstrologyService _astro;
        private readonly MoodStatsService _moodStats;
        private readonly IFileUserRepository _users;

        public InsightController(
            IAstrologyService astro,
            MoodStatsService moodStats,
            IFileUserRepository users)
        {
            _astro = astro;
            _moodStats = moodStats;
            _users = users;
        }
        private int GetUserIdFromToken()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null && int.TryParse(userIdClaim.Value, out int id)
                ? id
                : throw new UnauthorizedAccessException("Invalid or missing user ID in token.");
        }

        [HttpGet("astro-mood")]
        public async Task<ActionResult<AstroMoodInsightDto>> GetAstroMoodInsight()
        {
            var userId = GetUserIdFromToken();          // from JWT context
            var user = await _users.GetByIdAsync(userId);

            // 1) free daily from horoscopefree
            var daily = await _astro.GetDailyHoroscopeAsync(user.ZodiacSign);

            // 2) mood stats
            var stats = await _moodStats.GetStatsForUserAsync(userId);

            return Ok(new AstroMoodInsightDto(
                Sign: daily.Sign,
                Horoscope: daily.Horoscope,
                TotalEntries: stats.TotalEntries,
                PositiveCount: stats.PositiveCount,
                NegativeCount: stats.NegativeCount,
                MostFrequentMood: stats.MostFrequentMood.ToString()
            ));
        }
}

    public record AstroMoodInsightDto(
        string Sign,
        string Horoscope,
        int TotalEntries,
        int PositiveCount,
        int NegativeCount,
        string MostFrequentMood
    );
}