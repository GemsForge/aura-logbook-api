using AuraLogbook.Api.Models.Dto;

namespace AuraLogbook.Api.Services;

/// <summary>Validates mood ownership and coordinates private image metadata with file storage.</summary>
public interface IMoodMediaService
{
    /// <summary>Lists only the requesting user's attachments for an owned mood entry.</summary>
    Task<IReadOnlyList<MoodMediaAttachmentDto>> GetForMoodAsync(int userId, int moodEntryId, CancellationToken cancellationToken);

    /// <summary>Validates and privately stores an image for an owned mood entry.</summary>
    Task<MoodMediaAttachmentDto> AddAsync(int userId, int moodEntryId, IFormFile file, CancellationToken cancellationToken);

    /// <summary>Opens an attachment only when the owner, mood entry, and attachment identifier match.</summary>
    Task<(MoodMediaAttachmentDto Attachment, Stream Content)?> OpenAsync(int userId, int moodEntryId, string attachmentId, CancellationToken cancellationToken);

    /// <summary>Deletes one owned attachment and its private file.</summary>
    Task<bool> DeleteAsync(int userId, int moodEntryId, string attachmentId, CancellationToken cancellationToken);

    /// <summary>Removes attachment metadata and files after the owned mood entry is deleted.</summary>
    Task DeleteForMoodAsync(int userId, int moodEntryId, CancellationToken cancellationToken);
}
