using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto.Insights;
using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Repositories;

namespace AuraLogbook.Api.Services
{
    // Services/MoodStatsService.cs
    public class MoodStatsService : IMoodStatsService
    {
        private readonly IFileMoodRepository _moodRepo;

        public MoodStatsService(IFileMoodRepository moodRepo)
        {
            _moodRepo = moodRepo;
        }

        /// <summary>
        /// Returns a dashboard summary with mood statistics for the authenticated user.
        /// </summary>
        public async Task<MoodDashboardSummary> GetDashboardSummaryAsync(int userId)
        {
            var moods = await _moodRepo.GetAllByUserAsync(userId);
            if (!moods.Any())
                return new MoodDashboardSummary(); // returns default/empty stats

            var mostFrequent = moods
                .SelectMany(m => m.Moods)
                .GroupBy(m => m)
                .OrderByDescending(g => g.Count())
                .FirstOrDefault()?.Key;

            var streak = CalculateStreak(moods);
            var lastLogged = moods.OrderByDescending(m => m.Date).FirstOrDefault()?.Date;

            return new MoodDashboardSummary
            {
                TotalEntries = moods.Count,
                MostFrequentMood = mostFrequent,
                CurrentStreak = streak,
                LastEntryDate = lastLogged
            };
        }

        /// <summary>
        /// Retrieves mood counts per day for a specified date range.
        /// </summary>
        /// <param name="userId">The authenticated user's ID.</param>
        /// <param name="range">The number of days to look back (e.g., 7, 30).</param>
        /// <returns>A dictionary mapping dates to the number of mood entries.</returns>
        public async Task<Dictionary<DateOnly, int>> GetMoodsByDateRangeAsync(int userId, int range)
        {
            var allEntries = await _moodRepo.GetAllByUserAsync(userId);
            var startDate = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(-range + 1));

            return allEntries
                .Where(e => e.Date >= startDate)
                .GroupBy(e => e.Date)
                .ToDictionary(g => g.Key, g => g.Count());
        }

        /// <summary>
        /// Calculates the current mood streak based on consecutive days with entries.
        /// </summary>
        private int CalculateStreak(List<MoodEntry> entries)
        {
            var orderedDates = entries
                .Select(e => e.Date)
                .Distinct()
                .OrderByDescending(d => d)
                .ToList();

            if (!orderedDates.Any())
                return 0;

            int streak = 1;
            var today = DateOnly.FromDateTime(DateTime.UtcNow);


            for (int i = 1; i < orderedDates.Count; i++)
            {
                if (orderedDates[i - 1].DayNumber - orderedDates[i].DayNumber == 1)
                    streak++;
                else
                    break;
            }

            return orderedDates.First() == today ? streak : 0;
        }


        /// <summary>
        /// Returns the count of each mood type for the given user.
        /// </summary>
        public async Task<List<MoodFrequencyResponse>> GetMoodBreakdownCountAsync(int userId)
        {
            var allEntries = await _moodRepo.GetAllByUserAsync(userId);

            return allEntries
           .SelectMany(m => m.Moods)
            .GroupBy(m => m)
            .Select(g => new MoodFrequencyResponse
            {
                Mood = g.Key,
                Count = g.Count()
            })
            .ToList();
        }


        /// <summary>
        /// Returns the percentage breakdown of each mood type for the given user.
        /// </summary>
        public async Task<List<MoodFrequencyResponse>> GetMoodBreakdownPercentageAsync(int userId)
        {
            var moods = await _moodRepo.GetAllByUserAsync(userId);
            var flat = moods.SelectMany(m => m.Moods).ToList();

            int total = flat.Count;
            if (total == 0) return new();

            return flat
                .GroupBy(m => m)
                .Select(g => new MoodFrequencyResponse
                {
                    Mood = g.Key,
                    Percent = Math.Round((double)g.Count() / total * 100, 2)
                })
                .ToList();
        }

        public async Task<MoodStatsDto> GetStatsForUserAsync(int userId)
        {
            var entries = await _moodRepo.GetAllByUserAsync(userId);
            var flat = entries.SelectMany(e => e.Moods).ToList();

            int total = flat.Count;
            var positive = entries.Count(e => e.Moods.Contains(MoodType.Abundant)
                                             || e.Moods.Contains(MoodType.Harmonious));
            var negative = total - positive;

            // frequency ranking
            var freqGroups = flat
                .GroupBy(m => m)
                .OrderByDescending(g => g.Count())
                .ToList();

            var mostFreq = freqGroups.FirstOrDefault()?.Key ?? MoodType.Neutral;
            var topMoods = freqGroups.Select(g => g.Key).ToList();

            return new MoodStatsDto(
                TotalEntries: total,
                PositiveCount: positive,
                NegativeCount: negative,
                MostFrequentMood: mostFreq,
                TopMoods: topMoods
            );
        }
    }

        public record MoodStatsDto(
        int TotalEntries,
        int PositiveCount,
        int NegativeCount,
        MoodType MostFrequentMood,
        List<MoodType> TopMoods
    );

}
