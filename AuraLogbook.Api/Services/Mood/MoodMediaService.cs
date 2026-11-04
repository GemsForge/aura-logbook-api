using System.Text;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;

namespace AuraLogbook.Api.Services;

/// <summary>Enforces image limits, verifies signatures, and scopes private media to its mood owner.</summary>
public sealed class MoodMediaService : IMoodMediaService
{
    private const long MaximumFileBytes = 10 * 1024 * 1024;
    private const int MaximumAttachmentsPerMood = 10;
    private const int MaximumFileNameLength = 120;
    private readonly IMoodMediaRepository _repository;
    private readonly IMoodMediaFileStore _fileStore;
    private readonly IMoodService _moodService;
    private readonly ILogger<MoodMediaService> _logger;

    /// <summary>Creates the service with owner validation, relational metadata, and private file storage.</summary>
    public MoodMediaService(
        IMoodMediaRepository repository,
        IMoodMediaFileStore fileStore,
        IMoodService moodService,
        ILogger<MoodMediaService> logger)
    {
        _repository = repository;
        _fileStore = fileStore;
        _moodService = moodService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<MoodMediaAttachmentDto>> GetForMoodAsync(int userId, int moodEntryId, CancellationToken cancellationToken)
    {
        await EnsureMoodOwnershipAsync(userId, moodEntryId);
        cancellationToken.ThrowIfCancellationRequested();
        var records = await _repository.GetForMoodAsync(userId, moodEntryId);
        return records.Select(ToDto).ToArray();
    }

    /// <inheritdoc />
    public async Task<MoodMediaAttachmentDto> AddAsync(int userId, int moodEntryId, IFormFile file, CancellationToken cancellationToken)
    {
        await EnsureMoodOwnershipAsync(userId, moodEntryId);
        if (file.Length == 0)
            throw new MoodMediaException(MoodMediaFailure.EmptyFile, "Choose an image file to attach.");
        if (file.Length > MaximumFileBytes)
            throw new MoodMediaException(MoodMediaFailure.FileTooLarge, "Images must be 10 MB or smaller.");

        var existing = await _repository.GetForMoodAsync(userId, moodEntryId);
        if (existing.Count >= MaximumAttachmentsPerMood)
            throw new MoodMediaException(MoodMediaFailure.AttachmentLimitReached, "A mood entry can have up to 10 images.");

        await using var source = file.OpenReadStream();
        var contentType = await DetectImageTypeAsync(source, cancellationToken);
        source.Position = 0;
        var storageKey = await _fileStore.SaveAsync(source, contentType, cancellationToken);
        var record = new MoodMediaAttachmentRecord
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            MoodEntryId = moodEntryId,
            StorageKey = storageKey,
            FileName = SanitizeFileName(file.FileName),
            ContentType = contentType,
            ByteLength = file.Length,
            CreatedAt = DateTime.UtcNow.ToString("O")
        };

        try
        {
            await _repository.AddAsync(record);
            return ToDto(record);
        }
        catch
        {
            await _fileStore.DeleteAsync(storageKey, CancellationToken.None);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<(MoodMediaAttachmentDto Attachment, Stream Content)?> OpenAsync(int userId, int moodEntryId, string attachmentId, CancellationToken cancellationToken)
    {
        await EnsureMoodOwnershipAsync(userId, moodEntryId);
        cancellationToken.ThrowIfCancellationRequested();
        var record = await _repository.GetAsync(userId, moodEntryId, attachmentId);
        if (record is null)
            return null;
        var content = await _fileStore.OpenReadAsync(record.StorageKey, cancellationToken);
        return content is null ? null : (ToDto(record), content);
    }

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(int userId, int moodEntryId, string attachmentId, CancellationToken cancellationToken)
    {
        await EnsureMoodOwnershipAsync(userId, moodEntryId);
        cancellationToken.ThrowIfCancellationRequested();
        var record = await _repository.GetAsync(userId, moodEntryId, attachmentId);
        if (record is null)
            return false;

        await _fileStore.DeleteAsync(record.StorageKey, cancellationToken);
        return await _repository.DeleteAsync(userId, moodEntryId, attachmentId);
    }

    /// <inheritdoc />
    public async Task DeleteForMoodAsync(int userId, int moodEntryId, CancellationToken cancellationToken)
    {
        var records = await _repository.GetForMoodAsync(userId, moodEntryId);
        foreach (var record in records)
        {
            try
            {
                await _fileStore.DeleteAsync(record.StorageKey, cancellationToken);
                await _repository.DeleteAsync(userId, moodEntryId, record.Id);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Could not remove private media {AttachmentId} for deleted mood {MoodEntryId}", record.Id, moodEntryId);
            }
        }
    }

    private async Task EnsureMoodOwnershipAsync(int userId, int moodEntryId)
    {
        if (await _moodService.GetEntryForUserAsync(userId, moodEntryId) is null)
            throw new MoodMediaException(MoodMediaFailure.MoodNotFound, "Mood entry not found.");
    }

    private static async Task<string> DetectImageTypeAsync(Stream stream, CancellationToken cancellationToken)
    {
        var header = new byte[12];
        var total = 0;
        while (total < header.Length)
        {
            var read = await stream.ReadAsync(header.AsMemory(total), cancellationToken);
            if (read == 0)
                break;
            total += read;
        }

        if (total >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
            return "image/jpeg";
        if (total >= 8 && header.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }))
            return "image/png";
        if (total >= 12 && Encoding.ASCII.GetString(header, 0, 4) == "RIFF" && Encoding.ASCII.GetString(header, 8, 4) == "WEBP")
            return "image/webp";
        throw new MoodMediaException(MoodMediaFailure.UnsupportedImage, "Choose a JPEG, PNG, or WebP image.");
    }

    private static string SanitizeFileName(string fileName)
    {
        var leafName = Path.GetFileName(fileName.Replace('\\', '/'));
        var safeName = new string(leafName.Where(character => !char.IsControl(character) && !Path.GetInvalidFileNameChars().Contains(character)).ToArray()).Trim();
        if (string.IsNullOrWhiteSpace(safeName))
            safeName = "image";
        return safeName.Length <= MaximumFileNameLength ? safeName : safeName[^MaximumFileNameLength..];
    }

    private static MoodMediaAttachmentDto ToDto(MoodMediaAttachmentRecord record) => new(
        record.Id,
        record.MoodEntryId,
        record.FileName,
        record.ContentType,
        record.ByteLength,
        DateTime.Parse(record.CreatedAt, null, System.Globalization.DateTimeStyles.RoundtripKind));
}
