using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services;
using AuraLogbook.Api.Services.ReferenceData;
using AuraLogbook.Api.Services.Spotify;
using AuraLogbookApi.Dtos;
using Moq;

namespace AuraLogbook.Api.Tests;

public class MoodServiceTests
{
    /// <summary>Captures the client's weather and the playing Spotify track so Insights can relate them to energy.</summary>
    [Fact]
    public async Task CreateMoodAsync_stores_weather_and_playing_track_snapshots()
    {
        MoodEntry? saved = null;
        var repo = new Mock<IFileMoodRepository>();
        repo.Setup(r => r.CreateAsync(It.IsAny<MoodEntry>())).Callback<MoodEntry>(e => saved = e).ReturnsAsync(1);
        var validator = new Mock<IReferenceDataValidator>();
        validator.Setup(v => v.AreActiveMoodsAsync(It.IsAny<IEnumerable<string>>())).ReturnsAsync(true);
        var spotify = new Mock<ISpotifyService>();
        spotify.Setup(s => s.GetCurrentlyPlayingAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync(new SpotifyPlayback("Song", "Artist", null, null, true));

        await new MoodService(repo.Object, validator.Object, spotify.Object).CreateMoodAsync(7, new MoodEntryRequest
        {
            Date = new DateOnly(2026, 1, 2), Moods = ["Centered"],
            Weather = new WeatherDto { Description = "clear sky", IconCode = "01d", Temperature = 59, Unit = "F" },
        });

        Assert.Contains("clear sky", saved!.WeatherSnapshot);
        Assert.Contains("Song", saved.MusicTrack);
    }

    /// <summary>A Spotify failure must never block a check-in; music is simply not captured.</summary>
    [Fact]
    public async Task CreateMoodAsync_saves_without_music_when_spotify_fails()
    {
        MoodEntry? saved = null;
        var repo = new Mock<IFileMoodRepository>();
        repo.Setup(r => r.CreateAsync(It.IsAny<MoodEntry>())).Callback<MoodEntry>(e => saved = e).ReturnsAsync(1);
        var validator = new Mock<IReferenceDataValidator>();
        validator.Setup(v => v.AreActiveMoodsAsync(It.IsAny<IEnumerable<string>>())).ReturnsAsync(true);
        var spotify = new Mock<ISpotifyService>();
        spotify.Setup(s => s.GetCurrentlyPlayingAsync(7, It.IsAny<CancellationToken>())).ThrowsAsync(new InvalidOperationException("not connected"));

        var result = await new MoodService(repo.Object, validator.Object, spotify.Object).CreateMoodAsync(7,
            new MoodEntryRequest { Date = new DateOnly(2026, 1, 2), Moods = ["Centered"] });

        Assert.True(result.Success);
        Assert.Null(saved!.MusicTrack);
        Assert.Null(saved.WeatherSnapshot);
    }

    [Fact]
    public async Task CreateMoodAsync_rejects_a_mood_key_that_is_not_active()
    {
        var repo = new Mock<IFileMoodRepository>();
        var validator = new Mock<IReferenceDataValidator>();
        validator.Setup(v => v.AreActiveMoodsAsync(It.IsAny<IEnumerable<string>>())).ReturnsAsync(false);

        var result = await new MoodService(repo.Object, validator.Object).CreateMoodAsync(7,
            new MoodEntryRequest { Date = new DateOnly(2026, 1, 2), Moods = ["unknown"] });

        Assert.False(result.Success);
        repo.Verify(r => r.CreateAsync(It.IsAny<MoodEntry>()), Times.Never);
    }

    [Fact]
    public async Task DeleteMoodAsync_rejects_another_users_entry()
    {
        var repo = new Mock<IFileMoodRepository>();
        repo.Setup(r => r.GetByIdAsync(42)).ReturnsAsync(new MoodEntry { Id = 42, UserId = 99 });
        var validator = new Mock<IReferenceDataValidator>();
        var result = await new MoodService(repo.Object, validator.Object).DeleteMoodAsync(7, 42);
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
        var validator = new Mock<IReferenceDataValidator>();
        validator.Setup(v => v.AreActiveMoodsAsync(It.IsAny<IEnumerable<string>>())).ReturnsAsync(true);
        var result = await new MoodService(repo.Object, validator.Object).UpdateMoodAsync(7, 42, new MoodEntryRequest { Date = new DateOnly(2026, 1, 2), Moods = [MoodType.Harmonious], Comment = "Updated" });
        Assert.True(result.Success);
        Assert.Equal(new DateOnly(2026, 1, 2), existing.Date);
        Assert.Equal("Updated", existing.Comment);
        repo.Verify(r => r.UpdateAsync(existing), Times.Once);
    }
}
