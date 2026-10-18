using AuraLogbook.Api.Services;

namespace AuraLogbook.Api.Tests;

public class HttpsRedirectionPolicyTests
{
    [Fact]
    public void ShouldApply_DisablesRedirectionForDevelopmentHttpOnlyProfile()
    {
        Assert.False(HttpsRedirectionPolicy.ShouldApply(true, ["http://localhost:5082"]));
    }

    [Fact]
    public void ShouldApply_EnablesRedirectionWhenDevelopmentHasHttpsEndpoint()
    {
        Assert.True(HttpsRedirectionPolicy.ShouldApply(true, ["https://localhost:7082", "http://localhost:5082"]));
    }

    [Fact]
    public void ShouldApply_KeepsRedirectionEnabledOutsideDevelopment()
    {
        Assert.True(HttpsRedirectionPolicy.ShouldApply(false, ["http://localhost:5082"]));
    }
}
