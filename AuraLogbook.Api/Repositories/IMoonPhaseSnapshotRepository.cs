using AuraLogbook.Api.Models;

namespace AuraLogbook.Api.Repositories;

/// <summary>Stores provider moon details by calendar date so they are reused across users and deployments.</summary>
public interface IMoonPhaseSnapshotRepository
{
    /// <summary>Returns one stored moon snapshot, if the date has already been fetched.</summary>
    Task<MoonPhaseSnapshot?> GetAsync(DateOnly date, CancellationToken cancellationToken);

    /// <summary>Returns all stored snapshots in the inclusive date range.</summary>
    Task<IReadOnlyList<MoonPhaseSnapshot>> GetRangeAsync(DateOnly startDate, DateOnly endDate, CancellationToken cancellationToken);

    /// <summary>Inserts or replaces the provider result for its calendar date.</summary>
    Task SaveAsync(MoonPhaseSnapshot snapshot, CancellationToken cancellationToken);
}
