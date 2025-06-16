using AuraLogbook.Api.Models;

namespace AuraLogbook.Api.Repositories;

public interface IFileMoodRepository
{
    Task<List<MoodEntry>> GetAllByUserAsync(int userId);
    Task<int> CreateAsync(MoodEntry entry);
    Task<bool> DeleteAsync(int id);
    Task<MoodEntry?> GetByIdAsync(int id);
}
