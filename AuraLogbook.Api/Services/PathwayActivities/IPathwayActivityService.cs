using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;

namespace AuraLogbook.Api.Services.PathwayActivities;

/// <summary>Validates and coordinates authenticated pathway activity records.</summary>
public interface IPathwayActivityService
{
    /// <summary>Returns records owned by the user, with optional pathway/module/type filters.</summary>
    Task<List<PathwayActivity>> GetByUserAsync(int userId, string? pathway, string? moduleKey, string? activityType);

    /// <summary>Returns one owner-scoped record, or null when it does not exist for that user.</summary>
    Task<PathwayActivity?> GetByIdAsync(int userId, int id);

    /// <summary>Validates and creates a typed pathway activity.</summary>
    Task<(bool Success, string Message, PathwayActivity? Activity)> CreateAsync(int userId, PathwayActivityRequest request);

    /// <summary>Validates and updates a typed owner-scoped activity.</summary>
    Task<(bool Success, string Message)> UpdateAsync(int userId, int id, PathwayActivityRequest request);

    /// <summary>Deletes a record only when it belongs to the user.</summary>
    Task<bool> DeleteAsync(int userId, int id);
}
