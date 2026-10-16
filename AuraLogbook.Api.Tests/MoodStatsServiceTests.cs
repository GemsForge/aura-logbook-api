using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services;
using Moq;

namespace AuraLogbook.Api.Tests;

public class MoodStatsServiceTests
{
    [Fact]
    public async Task DashboardSummary_returns_counts_frequency_and_current_streak()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var repo = new Mock<IFileMoodRepository>();
        repo.Setup(r => r.GetAllByUserAsync(7)).ReturnsAsync([new MoodEntry { UserId = 7, Date = today, Moods = [MoodType.Harmonious] }, new MoodEntry { UserId = 7, Date = today.AddDays(-1), Moods = [MoodType.Harmonious, MoodType.Neutral] }]);
        var summary = await new MoodStatsService(repo.Object).GetDashboardSummaryAsync(7);
        Assert.Equal(2, summary.TotalEntries);
        Assert.Equal(MoodType.Harmonious, summary.MostFrequentMood);
        Assert.Equal(2, summary.CurrentStreak);
        Assert.Equal(today, summary.LastEntryDate);
    }

    [Fact]
    public async Task DashboardSummary_is_empty_when_user_has_no_entries()
    {
        var repo = new Mock<IFileMoodRepository>();
        repo.Setup(r => r.GetAllByUserAsync(7)).ReturnsAsync([]);
        var summary = await new MoodStatsService(repo.Object).GetDashboardSummaryAsync(7);
        Assert.Equal(0, summary.TotalEntries);
        Assert.Null(summary.MostFrequentMood);
        Assert.Equal(0, summary.CurrentStreak);
        Assert.Null(summary.LastEntryDate);
    }
}
