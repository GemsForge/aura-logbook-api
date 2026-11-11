using AuraLogbook.Api.Services.ReferenceData;

namespace AuraLogbook.Api.Tests;

/// <summary>Permits stable test fixtures to exercise service behavior without a reference-data database.</summary>
internal sealed class TestReferenceDataValidator : IReferenceDataValidator
{
    public Task<bool> IsActivePathwayAsync(string key) => Task.FromResult(true);
    public Task<bool> IsActiveAuraAsync(string key) => Task.FromResult(true);
    public Task<bool> AreActiveMoodsAsync(IEnumerable<string> keys) => Task.FromResult(keys.Any());
}
