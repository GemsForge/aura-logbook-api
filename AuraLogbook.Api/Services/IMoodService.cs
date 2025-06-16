using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;

namespace AuraLogbook.Api.Services
{
    public interface IMoodService
    {
        Task<(bool Success, string Message)> CreateMoodAsync(int userId, MoodEntryRequest dto);
        Task<(bool Success, string Message)> DeleteMoodAsync(int userId, int moodId);
        Task<List<MoodEntry>> GetEntriesForUserAsync(int userId);
        Task<MoodDashboardSummary> GetDashboardSummaryAsync(int userId);
        Task<Dictionary<DateOnly, int>> GetMoodsByDateRangeAsync(int userId, int range);
        Task<List<MoodFrequencyResponse>> GetMoodBreakdownCountAsync(int userId);
        Task<List<MoodFrequencyResponse>> GetMoodBreakdownPercentageAsync(int userId);
    }
}