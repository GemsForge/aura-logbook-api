using AuraLogbook.Api.Models;

namespace AuraLogbook.Api.Repositories;

public interface IReflectionRepository
{
    Task<IReadOnlyList<ReflectionPrompt>> GetActivePromptsAsync(
        int? pathwayKey,
        string? auraColorKey,
        string? chakraKey);

    Task<IReadOnlyList<ReflectionResponse>> GetResponsesAsync(int userId, int? moodEntryId);

    Task<ReflectionResponse?> GetResponseAsync(int userId, int responseId);

    Task<ReflectionResponse?> CreateResponseAsync(
        int userId,
        int promptId,
        int moodEntryId,
        string responseText);
}
