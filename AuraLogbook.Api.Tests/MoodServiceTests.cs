using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services;
using Moq;

namespace AuraLogbook.Api.Tests;

public class MoodServiceTests
{
    [Fact]
    public async Task DeleteMoodAsync_rejects_another_users_entry()
    {
        var repo = new Mock<IFileMoodRepository>();
        repo.Setup(r => r.GetByIdAsync(42)).ReturnsAsync(new MoodEntry { Id = 42, UserId = 99 });
        var result = await new MoodService(repo.Object).DeleteMoodAsync(7, 42);
        Assert.False(result.Success);
        Assert.Contains("access denied", result.Message);
        repo.Verify(r => r.DeleteAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task UpdateMoodAsync_updates_an_entry_owned_by_user()
    {
        var existing = new MoodEntry { Id = 42, UserId = 7, Date = new DateOnly(2026, 1, 1) };
        var repo = new Mock<IFileMoodRepository>();
        repo.Setup(r => r.GetByIdAsync(42)).ReturnsAsync(existing);
        repo.Setup(r => r.UpdateAsync(existing)).ReturnsAsync(true);
        var result = await new MoodService(repo.Object).UpdateMoodAsync(7, 42, new MoodEntryRequest { Date = new DateOnly(2026, 1, 2), Moods = [MoodType.Harmonious], Comment = "Updated" });
        Assert.True(result.Success);
        Assert.Equal(new DateOnly(2026, 1, 2), existing.Date);
        Assert.Equal("Updated", existing.Comment);
        repo.Verify(r => r.UpdateAsync(existing), Times.Once);
    }
}
