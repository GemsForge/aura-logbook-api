using System.Text.Json;
using AuraLogbook.Api.Models;

namespace AuraLogbook.Api.Repositories;

/// <summary>
/// Converts onboarding quiz answers to and from the <c>Users.OnboardingAnswersJson</c> column
/// (migration 019). Stored as camelCase JSON, e.g. <c>[{"questionNumber":1,"pathway":0}]</c>.
/// </summary>
internal static class OnboardingAnswersJson
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    /// <summary>Returns the JSON for <paramref name="answers"/>, or null when there are none.</summary>
    public static string? Serialize(IReadOnlyCollection<OnboardingAnswer>? answers) =>
        answers is null || answers.Count == 0 ? null : JsonSerializer.Serialize(answers, Options);

    /// <summary>Parses stored JSON; null, empty or unreadable values yield an empty list.</summary>
    public static List<OnboardingAnswer> Deserialize(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try { return JsonSerializer.Deserialize<List<OnboardingAnswer>>(json, Options) ?? []; }
        catch (JsonException) { return []; }
    }

    /// <summary>Returns the JSON for pathway-page preferences, or null when there are none.</summary>
    public static string? SerializePreferences(PathwayPreferences? preferences) =>
        preferences is null ? null : JsonSerializer.Serialize(preferences, Options);

    /// <summary>Parses stored pathway preferences; null or unreadable values yield null.</summary>
    public static PathwayPreferences? DeserializePreferences(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try { return JsonSerializer.Deserialize<PathwayPreferences>(json, Options); }
        catch (JsonException) { return null; }
    }
}
