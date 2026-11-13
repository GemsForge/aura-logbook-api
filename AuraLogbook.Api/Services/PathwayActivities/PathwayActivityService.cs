using System.Text.Json;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;

namespace AuraLogbook.Api.Services.PathwayActivities;

/// <summary>Enforces the pathway, module, activity, and payload contracts before persistence.</summary>
public sealed class PathwayActivityService : IPathwayActivityService
{
    private const int MaxContentLength = 5000;
    private static readonly IReadOnlyDictionary<string, IReadOnlySet<string>> Modules = new Dictionary<string, IReadOnlySet<string>>(StringComparer.Ordinal)
    {
        [SpiritualPathwayKeys.Mindfulness] = new HashSet<string>(StringComparer.Ordinal) { "mindfulness-guide", "practice-log" },
        [SpiritualPathwayKeys.Energy] = new HashSet<string>(StringComparer.Ordinal) { "daily-astrology", "chakra-reference" },
        [SpiritualPathwayKeys.Faith] = new HashSet<string>(StringComparer.Ordinal) { "faith-practice-check-in", "sacred-texts" }
    };

    private readonly IPathwayActivityRepository _repository;

    /// <summary>Creates the service with the pathway activity repository.</summary>
    public PathwayActivityService(IPathwayActivityRepository repository) => _repository = repository;

    /// <inheritdoc />
    public Task<List<PathwayActivity>> GetByUserAsync(int userId, string? pathway, string? moduleKey, string? activityType) =>
        _repository.GetByUserAsync(userId, pathway, moduleKey, activityType);

    /// <inheritdoc />
    public Task<PathwayActivity?> GetByIdAsync(int userId, int id) => _repository.GetByIdAsync(userId, id);

    /// <inheritdoc />
    public async Task<(bool Success, string Message, PathwayActivity? Activity)> CreateAsync(int userId, PathwayActivityRequest request)
    {
        var error = Validate(request);
        if (error is not null) return (false, error, null);
        var now = DateTime.UtcNow;
        var activity = Map(userId, request, now, now);
        activity.Id = await _repository.CreateAsync(activity);
        return (true, "Pathway activity saved.", activity);
    }

    /// <inheritdoc />
    public async Task<(bool Success, string Message)> UpdateAsync(int userId, int id, PathwayActivityRequest request)
    {
        var error = Validate(request);
        if (error is not null) return (false, error);
        var existing = await _repository.GetByIdAsync(userId, id);
        if (existing is null) return (false, "Pathway activity not found.");
        var updated = Map(userId, request, existing.CreatedAt, DateTime.UtcNow);
        updated.Id = id;
        return await _repository.UpdateAsync(updated)
            ? (true, "Pathway activity updated.")
            : (false, "Pathway activity not found.");
    }

    /// <inheritdoc />
    public Task<bool> DeleteAsync(int userId, int id) => _repository.DeleteAsync(userId, id);

    /// <summary>Ensures the activity module belongs to its pathway and its payload matches its activity type.</summary>
    private static string? Validate(PathwayActivityRequest request)
    {
        if (!Modules.TryGetValue(request.Pathway, out var modules) || !modules.Contains(request.ModuleKey))
            return "Choose a supported pathway module.";
        if (request.OccurredOn == default)
            return "Choose a date for the activity.";
        if (request.Content.ValueKind != JsonValueKind.Object || request.Content.GetRawText().Length > MaxContentLength)
            return "Provide a supported structured activity payload.";

        var properties = request.Content.EnumerateObject().Select(property => property.Name).ToHashSet(StringComparer.Ordinal);
        return request.ActivityType switch
        {
            "mindful-practice" when request.Pathway == SpiritualPathwayKeys.Mindfulness && request.ModuleKey == "practice-log"
                => ValidateMindfulPractice(request.Content, properties),
            "faith-practice-check-in" when request.Pathway == SpiritualPathwayKeys.Faith && request.ModuleKey == "faith-practice-check-in"
                => ValidateFaithCheckIn(request.Content, properties),
            "insight-feedback" => ValidateInsightFeedback(request.Pathway, request.Content, properties),
            _ => "Choose a supported pathway activity type."
        };
    }

    /// <summary>Validates the DBT/mindfulness practice fields and their bounds.</summary>
    private static string? ValidateMindfulPractice(JsonElement content, HashSet<string> properties)
    {
        if (!properties.IsSubsetOf(new HashSet<string>(StringComparer.Ordinal) { "practice", "durationMinutes", "note" })
            || !TryString(content, "practice", 100, required: true)
            || !TryString(content, "note", 500, required: false))
            return "Provide a practice name and an optional note.";
        if (content.TryGetProperty("durationMinutes", out var duration)
            && (duration.ValueKind != JsonValueKind.Number || !duration.TryGetInt32(out var minutes) || minutes is < 1 or > 1440))
            return "Practice duration must be between 1 and 1440 minutes.";
        return null;
    }

    /// <summary>Validates user-selected practice booleans and an optional private note.</summary>
    private static string? ValidateFaithCheckIn(JsonElement content, HashSet<string> properties)
    {
        var allowedProperties = new HashSet<string>(StringComparer.Ordinal) { "practices", "note" };
        var allowedPractices = new HashSet<string>(StringComparer.Ordinal) { "sacred-text-reading", "prayer", "contemplation", "worship-or-gathering", "gratitude", "service-or-care" };
        if (!properties.IsSubsetOf(allowedProperties) || !content.TryGetProperty("practices", out var practices)
            || practices.ValueKind != JsonValueKind.Object || !TryString(content, "note", 500, required: false))
            return "Provide selected faith practices and an optional note.";
        foreach (var practice in practices.EnumerateObject())
            if (!allowedPractices.Contains(practice.Name) || practice.Value.ValueKind is not (JsonValueKind.True or JsonValueKind.False))
                return "Choose supported faith practices with a did/didn't value.";
        return null;
    }

    /// <summary>Constrains feedback to a named insight type and one of the three optional responses.</summary>
    private static string? ValidateInsightFeedback(string pathway, JsonElement content, HashSet<string> properties)
    {
        var allowedTypes = pathway switch
        {
            SpiritualPathwayKeys.Mindfulness => new HashSet<string>(StringComparer.Ordinal) { "mindfulness-concept", "practice-pattern" },
            SpiritualPathwayKeys.Energy => new HashSet<string>(StringComparer.Ordinal) { "horoscope", "moon-phase", "chakra-theme", "chakra-mood-pattern", "aura-color", "birth-chart-placement" },
            SpiritualPathwayKeys.Faith => new HashSet<string>(StringComparer.Ordinal) { "faith-practice" },
            _ => new HashSet<string>(StringComparer.Ordinal)
        };
        if (properties.Count != 2 || !properties.SetEquals(["insightType", "response"])
            || !TryString(content, "insightType", 48, required: true, out var insightType)
            || !allowedTypes.Contains(insightType)
            || !TryString(content, "response", 16, required: true, out var response)
            || response is not ("resonates" or "maybe" or "not-for-me"))
            return "Choose a supported insight type and feedback response.";
        return null;
    }

    /// <summary>Reads a bounded optional or required string property from the structured payload.</summary>
    private static bool TryString(JsonElement content, string key, int maxLength, bool required) =>
        TryString(content, key, maxLength, required, out _);

    /// <summary>Reads a bounded string property and returns its value when valid.</summary>
    private static bool TryString(JsonElement content, string key, int maxLength, bool required, out string value)
    {
        value = "";
        if (!content.TryGetProperty(key, out var property)) return !required;
        if (property.ValueKind != JsonValueKind.String) return false;
        value = property.GetString() ?? "";
        return value.Length <= maxLength && (!required || !string.IsNullOrWhiteSpace(value));
    }

    /// <summary>Copies a validated request into a detached, owner-scoped record.</summary>
    private static PathwayActivity Map(int userId, PathwayActivityRequest request, DateTime createdAt, DateTime updatedAt) => new()
    {
        UserId = userId,
        Pathway = request.Pathway,
        ModuleKey = request.ModuleKey,
        ActivityType = request.ActivityType,
        OccurredOn = request.OccurredOn,
        Content = request.Content.Clone(),
        CreatedAt = createdAt,
        UpdatedAt = updatedAt
    };
}
