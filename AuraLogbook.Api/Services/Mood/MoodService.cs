using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Models.Dto.Insights;
using AuraLogbook.Api.Repositories;

namespace AuraLogbook.Api.Services;

/// <summary>
/// Service class responsible for mood-related business logic.
/// </summary>
public class MoodService : IMoodService
{
    private readonly IFileMoodRepository _moodRepo;

    public MoodService(IFileMoodRepository moodRepo)
    {
        _moodRepo = moodRepo;
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
        var moodEntry = new MoodEntry
        {
            UserId = userId,
            Date = dto.Date,
            Moods = dto.Moods,
            Comment = dto.Comment,
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
        var existing = await _moodRepo.GetByIdAsync(moodId);
        if (existing == null || existing.UserId != userId)
            return (false, "Mood entry not found or access denied.");

        existing.Date = dto.Date;
        existing.Moods = dto.Moods;
        existing.Comment = dto.Comment;

        var result = await _moodRepo.UpdateAsync(existing);
        return result ? (true, "Mood entry updated.") : (false, "Failed to update mood.");
    }
}
