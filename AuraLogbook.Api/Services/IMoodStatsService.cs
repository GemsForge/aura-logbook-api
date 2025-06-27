using AuraLogbook.Api.Models.Dto.Insights;

namespace AuraLogbook.Api.Services
{
    public interface IMoodStatsService
    {
        Task<MoodStatsDto> GetStatsForUserAsync(int userId);
        // In MoodService.cs, remove:
        public Task<MoodDashboardSummary> GetDashboardSummaryAsync(int userId);
        public Task<Dictionary<DateOnly, int>> GetMoodsByDateRangeAsync(int userId, int days);
        public Task<List<MoodFrequencyResponse>> GetMoodBreakdownCountAsync(int userId);
        public Task<List<MoodFrequencyResponse>> GetMoodBreakdownPercentageAsync(int userId);
    }
}