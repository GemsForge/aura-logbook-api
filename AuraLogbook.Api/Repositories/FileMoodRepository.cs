using AuraLogbook.Api.Models;
using AuraLogbook.Api.Repositories.Base;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Repositories;

/// <summary>
/// Repository for managing mood entries using file-based JSON storage.
/// </summary>
public class FileMoodRepository : FileRepositoryBase<MoodEntry>, IFileMoodRepository
{
   
    public FileMoodRepository(IOptions<StorageSettings> options) : base(options.Value.MoodFilePath) { }


    /// <summary>
    /// Retrieves all mood entries for a specific user.Descending date order.
    /// </summary>
    public async Task<List<MoodEntry>> GetAllByUserAsync(int userId)
    {
        var allEntries = await LoadAllAsync();
        return allEntries
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.Date)
            .ToList();
    }

    /// <summary>
    /// Creates a new mood entry.
    /// </summary>
    public async Task<int> CreateAsync(MoodEntry entry)
    {
        var entries = await LoadAllAsync();
        entry.Id = entries.Count > 0 ? entries.Max(e => e.Id) + 1 : 1;
        entries.Add(entry);
        await WriteToFileAsync(entries);
        return entry.Id;
    }

    /// <summary>
    /// Deletes a mood entry by its ID.
    /// </summary>
    public async Task<bool> DeleteAsync(int id)
    {
        var entries = await LoadAllAsync();
        var removed = entries.RemoveAll(e => e.Id == id) > 0;
        if (removed)
            await WriteToFileAsync(entries);
        return removed;
    }

    /// <summary>
    /// Retrieves a mood entry by ID.
    /// </summary>
    public async Task<MoodEntry?> GetByIdAsync(int id)
    {
        var entries = await LoadAllAsync();
        return entries.FirstOrDefault(e => e.Id == id);
    }
}
