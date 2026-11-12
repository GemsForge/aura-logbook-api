using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Models.Dto.Insights;
using AuraLogbook.Api.Repositories;
using System.Text.Json;
using AuraLogbook.Api.Services.ReferenceData;
using AuraLogbook.Api.Services.Spotify;

namespace AuraLogbook.Api.Services;

/// <summary>
/// Service class responsible for mood-related business logic.
/// </summary>
public class MoodService : IMoodService
{
    private readonly IFileMoodRepository _moodRepo;
    private readonly IReferenceDataValidator _referenceData;
    private readonly ISpotifyService? _spotify;
    private readonly ILogger<MoodService>? _logger;

    /// <summary>Creates the service; Spotify is optional so music capture is skipped where it isn't registered.</summary>
    public MoodService(IFileMoodRepository moodRepo, IReferenceDataValidator referenceData, ISpotifyService? spotify = null, ILogger<MoodService>? logger = null)
    {
        _moodRepo = moodRepo;
        _referenceData = referenceData;
        _spotify = spotify;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves all mood entries for a given user.
    /// </summary>
    public async Task<List<MoodEntry>> GetEntriesForUserAsync(int userId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var allMoods = await _moodRepo.GetAllByUserAsync(userId);

        if (startDate.HasValue)
        {
            var start = DateOnly.FromDateTime(startDate.Value);
            allMoods = allMoods.Where(m => m.Date >= start).ToList();
        }

        if (endDate.HasValue)
        {
            var end = DateOnly.FromDateTime(endDate.Value);
            allMoods = allMoods.Where(m => m.Date <= end).ToList();
        }

        return allMoods;
    }

    /// <inheritdoc />
    public async Task<MoodEntry?> GetEntryForUserAsync(int userId, int moodId)
    {
        var entry = await _moodRepo.GetByIdAsync(moodId);
        return entry?.UserId == userId ? entry : null;
    }

    /// <summary>
    /// Creates a mood entry and returns its identifier for private media uploads.
    /// </summary>
    public async Task<(bool Success, string Message, int EntryId)> CreateMoodAsync(int userId, MoodEntryRequest dto)
    {
        if (!await _referenceData.AreActiveMoodsAsync(dto.Moods))
            return (false, "Select one or more active moods.", 0);
        var moodEntry = new MoodEntry
        {
            UserId = userId,
            Date = dto.Date,
            Moods = dto.Moods,
            Comment = dto.Comment,
            WeatherSnapshot = dto.Weather is null ? null : JsonSerializer.Serialize(new { description = dto.Weather.Description, iconCode = dto.Weather.IconCode, temperature = dto.Weather.Temperature, unit = dto.Weather.Unit }),
            MusicTrack = await CaptureMusicAsync(userId),
            CreatedAt = DateTime.UtcNow
        };

        var entryId = await _moodRepo.CreateAsync(moodEntry);
        return (true, "Mood entry recorded.", entryId);
    }

    /// <summary>
    /// Deletes a mood entry by ID, verifying user ownership.
    /// </summary>
    public async Task<(bool Success, string Message)> DeleteMoodAsync(int userId, int moodId)
    {
        var mood = await _moodRepo.GetByIdAsync(moodId);
        if (mood == null || mood.UserId != userId)
            return (false, "Mood entry not found or access denied.");

        var result = await _moodRepo.DeleteAsync(moodId);
        return result ? (true, "Mood entry deleted.") : (false, "Failed to delete mood.");
    }
    /// <summary>
    /// Updates a mood entry by ID, verifying user ownership.
    /// </summary>
    public async Task<(bool Success, string Message)> UpdateMoodAsync(int userId, int moodId, MoodEntryRequest dto)
    {
        if (!await _referenceData.AreActiveMoodsAsync(dto.Moods))
            return (false, "Select one or more active moods.");
        var existing = await _moodRepo.GetByIdAsync(moodId);
        if (existing == null || existing.UserId != userId)
            return (false, "Mood entry not found or access denied.");

        existing.Date = dto.Date;
        existing.Moods = dto.Moods;
        existing.Comment = dto.Comment;

        var result = await _moodRepo.UpdateAsync(existing);
        return result ? (true, "Mood entry updated.") : (false, "Failed to update mood.");
    }

    /// <summary>
    /// Best-effort lookup of the track playing on the user's connected Spotify account. Users without a
    /// connection, nothing playing, or any Spotify failure yield null so a check-in never fails or waits long.
    /// </summary>
    private async Task<string?> CaptureMusicAsync(int userId)
    {
        if (_spotify is null) return null;
        try
        {
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(2));
            var playback = await _spotify.GetCurrentlyPlayingAsync(userId, timeout.Token);
            return playback is { IsPlaying: true } ? JsonSerializer.Serialize(new { name = playback.Name, artists = playback.Artists }) : null;
        }
        catch (Exception exception)
        {
            _logger?.LogDebug(exception, "Skipped music capture for a check-in.");
            return null;
        }
    }
}
