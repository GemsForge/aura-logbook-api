using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
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
    public Task<List<MoodEntry>> GetEntriesForUserAsync(int userId)
        => _moodRepo.GetAllByUserAsync(userId);

    /// <summary>
    /// Creates a new mood entry from client request.
    /// </summary>
    public async Task<(bool Success, string Message)> CreateMoodAsync(int userId, MoodEntryRequest dto)
    {
        var moodEntry = new MoodEntry
        {
            UserId = userId,
            Date = dto.Date,
            Moods = dto.Moods,
            Comment = dto.Comment,
            CreatedAt = DateTime.UtcNow
        };

        await _moodRepo.CreateAsync(moodEntry);
        return (true, "Mood entry recorded.");
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
}
