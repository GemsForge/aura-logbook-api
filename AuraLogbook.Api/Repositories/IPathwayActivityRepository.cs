using AuraLogbook.Api.Models;

namespace AuraLogbook.Api.Repositories;

/// <summary>Persists pathway activity records with owner-scoped lookup and mutation methods.</summary>
public interface IPathwayActivityRepository
{
    /// <summary>Lists only the owner's records, optionally filtered by pathway, module, and type.</summary>
    Task<List<PathwayActivity>> GetByUserAsync(int userId, string? pathway, string? moduleKey, string? activityType);

    /// <summary>Gets one record only when it belongs to the supplied owner.</summary>
    Task<PathwayActivity?> GetByIdAsync(int userId, int id);

    /// <summary>Creates a pathway activity and returns its database identifier.</summary>
    Task<int> CreateAsync(PathwayActivity activity);

    /// <summary>Replaces a record only when it belongs to the supplied owner.</summary>
    Task<bool> UpdateAsync(PathwayActivity activity);

    /// <summary>Deletes a record only when it belongs to the supplied owner.</summary>
    Task<bool> DeleteAsync(int userId, int id);
}
