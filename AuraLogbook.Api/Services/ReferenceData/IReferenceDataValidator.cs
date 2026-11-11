namespace AuraLogbook.Api.Services.ReferenceData;

/// <summary>Checks submitted stable keys against active database reference data.</summary>
public interface IReferenceDataValidator
{
    /// <summary>Reports whether the pathway key is currently available for new selections.</summary>
    Task<bool> IsActivePathwayAsync(string key);

    /// <summary>Reports whether the aura key is currently available for new selections.</summary>
    Task<bool> IsActiveAuraAsync(string key);

    /// <summary>Requires every submitted mood key to exist and remain active.</summary>
    Task<bool> AreActiveMoodsAsync(IEnumerable<string> keys);
}
