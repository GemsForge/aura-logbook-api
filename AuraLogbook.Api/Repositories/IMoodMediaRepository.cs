using AuraLogbook.Api.Models;

namespace AuraLogbook.Api.Repositories;

/// <summary>Persists private attachment metadata partitioned by owner and mood entry.</summary>
public interface IMoodMediaRepository
{
    /// <summary>Returns attachments for one owner's mood entry in creation order.</summary>
    Task<IReadOnlyList<MoodMediaAttachmentRecord>> GetForMoodAsync(int userId, int moodEntryId);

    /// <summary>Finds an attachment only when its owner and mood entry both match.</summary>
    Task<MoodMediaAttachmentRecord?> GetAsync(int userId, int moodEntryId, string attachmentId);

    /// <summary>Creates an attachment metadata record.</summary>
    Task AddAsync(MoodMediaAttachmentRecord attachment);

    /// <summary>Deletes one attachment metadata record within its ownership scope.</summary>
    Task<bool> DeleteAsync(int userId, int moodEntryId, string attachmentId);
}
