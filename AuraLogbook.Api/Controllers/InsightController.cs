using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto.Insights;
using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AuraLogbook.Api.Controllers
{
    [ApiController]
    [Route("api/insights")]
    public class InsightController : ControllerBase
    {
        private readonly IFileZodiacInsightsRepository _zodiacRepo;
        private readonly IMoodStatsService _moodStats;
        private readonly IInsightTriggerService _trigger;
        private readonly IFileUserRepository _users;

        public InsightController(
            IFileZodiacInsightsRepository zodiacRepo,
            IMoodStatsService moodStats,
            IInsightTriggerService trigger,
            IFileUserRepository users)
        {
            _zodiacRepo = zodiacRepo;
            _moodStats = moodStats;
            _trigger = trigger;
            _users = users;
        }

        private int GetUserIdFromToken()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null || !int.TryParse(claim.Value, out var id))
                throw new UnauthorizedAccessException("Invalid or missing user ID.");
            return id;
        }

        /// <summary>
        /// Returns combined zodiac info, mood stats, and triggered insights for the current user.
        /// </summary>
        [HttpGet("zodiac")]
        public async Task<ActionResult<ZodiacInsightResponse>> GetZodiacInsights()
        {
            var userId = GetUserIdFromToken();
            var user = await _users.GetByIdAsync(userId);
            if (user == null) return NotFound("User not found.");

            // 1. Load zodiac sign details
            var signKey = user.ZodiacSign.ToLowerInvariant();
            var zodiac = await _zodiacRepo.GetBySignAsync(signKey);
            if (zodiac == null) return NotFound($"No zodiac data for sign '{signKey}'.");

            // 2. Load mood stats
            var stats = await _moodStats.GetDashboardSummaryAsync(userId);     // basic summary
            var fullStats = await _moodStats.GetStatsForUserAsync(userId);     // includes TopMoods

            // 3. Compute triggered insights
            var insights = await _trigger.GetTriggeredInsightsAsync(
                signKey,
                fullStats
            );

            // 4. Return everything in one DTO
            var response = new ZodiacInsightResponse
            {
                Sign = zodiac.Sign,
                Description = zodiac.Description,
                Element = zodiac.Element,

                // mood summary
                TotalEntries = stats.TotalEntries,
                MostFrequentMood = stats.MostFrequentMood,
                CurrentStreak = stats.CurrentStreak,
                LastEntryDate = stats.LastEntryDate,

                // mood-driven insights
                Insights = insights
            };

            return Ok(response);
        }
    }  
}