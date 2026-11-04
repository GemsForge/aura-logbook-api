namespace AuraLogbook.Api.Models;

/// <summary>Stores private file metadata and its opaque key in the relational database.</summary>
public sealed class MoodMediaAttachmentRecord
{
    /// <summary>Gets or sets the opaque attachment identifier.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>Gets or sets the owner user identifier from the authenticated request.</summary>
    public int UserId { get; set; }

    /// <summary>Gets or sets the mood entry identifier validated by the mood service.</summary>
    public int MoodEntryId { get; set; }

    /// <summary>Gets or sets the server-generated storage filename.</summary>
    public string StorageKey { get; set; } = string.Empty;

    /// <summary>Gets or sets the sanitized original filename shown in the UI.</summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>Gets or sets the detected image media type.</summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>Gets or sets the file size in bytes.</summary>
    public long ByteLength { get; set; }

    /// <summary>Gets or sets the UTC creation timestamp.</summary>
    public string CreatedAt { get; set; } = string.Empty;
}
