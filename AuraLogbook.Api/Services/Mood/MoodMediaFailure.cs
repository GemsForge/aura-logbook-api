namespace AuraLogbook.Api.Services;

/// <summary>Identifies expected failures while validating or locating private mood media.</summary>
public enum MoodMediaFailure
{
    MoodNotFound,
    AttachmentNotFound,
    EmptyFile,
    FileTooLarge,
    UnsupportedImage,
    AttachmentLimitReached
}

/// <summary>Represents a user-correctable private media operation failure.</summary>
public sealed class MoodMediaException(MoodMediaFailure failure, string message) : Exception(message)
{
    /// <summary>Gets the specific failure used by the HTTP controller.</summary>
    public MoodMediaFailure Failure { get; } = failure;
}
