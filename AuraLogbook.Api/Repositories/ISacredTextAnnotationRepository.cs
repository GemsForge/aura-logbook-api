using AuraLogbook.Api.Models;

namespace AuraLogbook.Api.Repositories;

/// <summary>Owner-scoped persistence contract for private sacred-text reader annotations.</summary>
public interface ISacredTextAnnotationRepository
{
    /// <summary>Lists annotations owned by one user, optionally scoped to a section.</summary>
    Task<List<SacredTextAnnotation>> GetByUserAsync(int userId, string framework, string? sectionReference);

    /// <summary>Loads one annotation only when it belongs to the authenticated owner.</summary>
    Task<SacredTextAnnotation?> GetByIdAsync(int userId, int id);

    /// <summary>Creates a private annotation and returns its database identifier.</summary>
    Task<int> CreateAsync(SacredTextAnnotation annotation);

    /// <summary>Replaces an annotation only when the authenticated owner matches.</summary>
    Task<bool> UpdateAsync(SacredTextAnnotation annotation);

    /// <summary>Deletes an annotation only when the authenticated owner matches.</summary>
    Task<bool> DeleteAsync(int userId, int id);
}
