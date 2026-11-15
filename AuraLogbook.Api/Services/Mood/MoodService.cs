using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Models.Dto.Insights;
using AuraLogbook.Api.Repositories;
using System.Text.Json;
using AuraLogbook.Api.Services.ReferenceData;
using AuraLogbook.Api.Services.Spotify;

namespace AuraLogbook.Api.Services;

/// <summary>
/// Service class responsible for mood-related business logic.
/// </summary>
public class MoodService : IMoodService
{
    /// <summary>Shared optional context choices for universal mood logging.</summary>
    public static readonly IReadOnlySet<string> AllowedImpactTopics = new HashSet<string>(StringComparer.Ordinal)
    {
        "Health", "Fitness", "Self-care", "Hobbies", "Identity", "Spirituality", "Community", "Family", "Friends",
        "Partner", "Dating", "Task", "Work", "Education", "Travel", "Weather", "Current Events", "Money"
    };

    private readonly IFileMoodRepository _moodRepo;
    private readonly IReferenceDataValidator _referenceData;
    private readonly ISpotifyService? _spotify;
    private readonly ILogger<MoodService>? _logger;

    /// <summary>Creates the service; Spotify is optional so music capture is skipped where it isn't registered.</summary>
    public MoodService(IFileMoodRepository moodRepo, IReferenceDataValidator referenceData, ISpotifyService? spotify = null, ILogger<MoodService>? logger = null)
    {
        _moodRepo = moodRepo;
        _referenceData = referenceData;
        _spotify = spotify;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves all mood entries for a given user.
    /// </summary>
    public async Task<List<MoodEntry>> GetEntriesForUserAsync(int userId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var allMoods = await _moodRepo.GetAllByUserAsync(userId);

        if (startDate.HasValue)
        {
            var start = DateOnly.FromDateTime(startDate.Value);
            allMoods = allMoods.Where(m => m.Date >= start).ToList();
        }

        if (endDate.HasValue)
        {
            var end = DateOnly.FromDateTime(endDate.Value);
            allMoods = allMoods.Where(m => m.Date <= end).ToList();
        }

        return allMoods;
    }

    /// <inheritdoc />
    public async Task<MoodEntry?> GetEntryForUserAsync(int userId, int moodId)
    {
        var entry = await _moodRepo.GetByIdAsync(moodId);
        return entry?.UserId == userId ? entry : null;
    }

    /// <summary>
    /// Creates a mood entry and returns its identifier for private media uploads.
    /// </summary>
    public async Task<(bool Success, string Message, int EntryId)> CreateMoodAsync(int userId, MoodEntryRequest dto)
    {
        var occurrenceError = ValidateOccurrence(dto);
        if (occurrenceError is not null) return (false, occurrenceError, 0);
        var impactError = ValidateImpactTopics(dto.ImpactTopics);
        if (impactError is not null) return (false, impactError, 0);
        var reflectionError = ValidatePathwayReflection(dto.PathwayReflection);
        if (reflectionError is not null) return (false, reflectionError, 0);
        if (!await _referenceData.AreActiveMoodsAsync(dto.Moods))
            return (false, "Select one or more active moods.", 0);
        var moodEntry = new MoodEntry
        {
            UserId = userId,
            Date = dto.Date,
            OccurredAt = dto.OccurredAt,
            Moods = dto.Moods,
            Comment = dto.Comment,
            ImpactTopics = dto.ImpactTopics ?? [],
            PathwayReflection = dto.PathwayReflection,
            WeatherSnapshot = dto.Weather is null ? null : JsonSerializer.Serialize(new { description = dto.Weather.Description, iconCode = dto.Weather.IconCode, temperature = dto.Weather.Temperature, unit = dto.Weather.Unit }),
            MusicTrack = await CaptureMusicAsync(userId),
            CreatedAt = DateTime.UtcNow
        };

        var entryId = await _moodRepo.CreateAsync(moodEntry);
        return (true, "Mood entry recorded.", entryId);
    }

    /// <summary>
    /// Deletes a mood entry by ID, verifying user ownership.
    /// </summary>
    public async Task<(bool Success, string Message)> DeleteMoodAsync(int userId, int moodId)
    {
        var mood = await _moodRepo.GetByIdAsync(moodId);
        if (mood == null || mood.UserId != userId)
            return (false, "Mood entry not found or access denied.");

        var result = await _moodRepo.DeleteAsync(moodId);
        return result ? (true, "Mood entry deleted.") : (false, "Failed to delete mood.");
    }
    /// <summary>
    /// Updates a mood entry by ID, verifying user ownership.
    /// </summary>
    public async Task<(bool Success, string Message)> UpdateMoodAsync(int userId, int moodId, MoodEntryRequest dto)
    {
        var occurrenceError = ValidateOccurrence(dto);
        if (occurrenceError is not null) return (false, occurrenceError);
        var impactError = ValidateImpactTopics(dto.ImpactTopics);
        if (impactError is not null) return (false, impactError);
        var reflectionError = ValidatePathwayReflection(dto.PathwayReflection);
        if (reflectionError is not null) return (false, reflectionError);
        if (!await _referenceData.AreActiveMoodsAsync(dto.Moods))
            return (false, "Select one or more active moods.");
        var existing = await _moodRepo.GetByIdAsync(moodId);
        if (existing == null || existing.UserId != userId)
            return (false, "Mood entry not found or access denied.");

        var occurrence = dto.OccurredAt ?? existing.OccurredAt;
        // A date-only edit keeps the recorded wall clock and offset on the newly chosen journal day.
        // Validate the reconciled instant before changing the stored entry, including future-time guards.
        if (dto.OccurredAt is null && occurrence is { } saved && DateOnly.FromDateTime(saved.DateTime) != dto.Date)
        {
            try { occurrence = new DateTimeOffset(dto.Date.ToDateTime(TimeOnly.FromDateTime(saved.DateTime)), saved.Offset); }
            catch (ArgumentOutOfRangeException) { return (false, "The occurrence date and time are outside the supported range."); }
        }
        var reconciledError = ValidateOccurrence(new MoodEntryRequest { Date = dto.Date, OccurredAt = occurrence });
        if (reconciledError is not null) return (false, reconciledError);

        existing.Date = dto.Date;
        existing.OccurredAt = occurrence;
        existing.Moods = dto.Moods;
        existing.Comment = dto.Comment;
        if (dto.ImpactTopics is not null)
            existing.ImpactTopics = dto.ImpactTopics;
        // Older clients omit this field; preserve the historical invitation and response on those updates.
        if (dto.PathwayReflection is not null)
            existing.PathwayReflection = dto.PathwayReflection;

        var result = await _moodRepo.UpdateAsync(existing);
        return result ? (true, "Mood entry updated.") : (false, "Failed to update mood.");
    }

    /// <summary>Validates the user's local date against the supplied offset without converting it to the server's day.</summary>
    private static string? ValidateOccurrence(MoodEntryRequest request)
    {
        if (request.OccurredAt is not { } occurredAt) return null;
        if (DateOnly.FromDateTime(occurredAt.DateTime) != request.Date)
            return "The occurrence date and time must match the journal date.";
        if (occurredAt > DateTimeOffset.UtcNow)
            return "The occurrence date and time cannot be in the future.";
        return null;
    }

    /// <summary>Bounds the private snapshot and accepts only explicit responses for supported interpretive lenses.</summary>
    private static string? ValidatePathwayReflection(MoodPathwayReflection? reflection)
    {
        if (reflection is null) return null;
        if (string.IsNullOrWhiteSpace(reflection.SourceId) || reflection.SourceId.Length > 160 ||
            string.IsNullOrWhiteSpace(reflection.Text) || reflection.Text.Length > 1500 ||
            reflection.Pathway is not ("mindfulness" or "energy" or "faith") ||
            reflection.InsightType is not ("pathway-prompt" or "chakra-mood-pattern" or "mood-combination") ||
            reflection.Response is not ("resonates" or "maybe" or "not-for-me"))
            return "Choose a supported pathway reflection response.";
        return null;
    }

    /// <summary>Rejects unrecognized or repeated context labels while allowing an empty selection.</summary>
    private static string? ValidateImpactTopics(List<string>? topics)
    {
        if (topics is null) return null;
        if (topics.Count > AllowedImpactTopics.Count || topics.Any(topic => !AllowedImpactTopics.Contains(topic)))
            return "Choose supported impact topics.";
        return topics.Distinct(StringComparer.Ordinal).Count() == topics.Count
            ? null
            : "Each impact topic can be selected only once.";
    }

    /// <summary>
    /// Best-effort lookup of the track playing on the user's connected Spotify account. Users without a
    /// connection, nothing playing, or any Spotify failure yield null so a check-in never fails or waits long.
    /// </summary>
    private async Task<string?> CaptureMusicAsync(int userId)
    {
        if (_spotify is null) return null;
        try
        {
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(2));
            var playback = await _spotify.GetCurrentlyPlayingAsync(userId, timeout.Token);
            return playback is { IsPlaying: true } ? JsonSerializer.Serialize(new { name = playback.Name, artists = playback.Artists }) : null;
        }
        catch (Exception exception)
        {
            _logger?.LogDebug(exception, "Skipped music capture for a check-in.");
            return null;
        }
    }
}
