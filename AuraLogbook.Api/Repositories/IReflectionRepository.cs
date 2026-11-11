using AuraLogbook.Api.Models;

namespace AuraLogbook.Api.Repositories;

public interface IReflectionRepository
{
    /// <summary>Returns active prompts filtered by stable pathway, aura, and chakra keys.</summary>
    Task<IReadOnlyList<ReflectionPrompt>> GetActivePromptsAsync(
        string? pathwayKey,
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
