namespace AuraLogbook.Api.Repositories;

/// <summary>One stored season span (#346); <see cref="EndedOn"/> is null while it is the current season.</summary>
public sealed record AuraSeasonSpan(string SeasonKey, DateOnly StartedOn, DateOnly? EndedOn);

/// <summary>Persists each user's aura season history.</summary>
public interface IAuraSeasonRepository
{
    /// <summary>All spans for the user, oldest first.</summary>
    Task<IReadOnlyList<AuraSeasonSpan>> GetHistoryAsync(int userId);

    /// <summary>Closes any open season on <paramref name="startedOn"/> and opens <paramref name="seasonKey"/>.</summary>
    Task StartAsync(int userId, string seasonKey, DateOnly startedOn);

    /// <summary>Finds the most recent span so a stable current season is not reopened each day.</summary>
    Task<AuraSeasonSpan?> GetLatestAsync(int userId);
}
