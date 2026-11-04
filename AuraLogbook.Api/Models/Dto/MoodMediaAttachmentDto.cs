namespace AuraLogbook.Api.Models.Dto;

/// <summary>Describes an attachment without exposing its private filesystem location.</summary>
public sealed record MoodMediaAttachmentDto(
    string Id,
    int MoodEntryId,
    string FileName,
    string ContentType,
    long ByteLength,
    DateTime CreatedAt);
