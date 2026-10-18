using AuraLogbook.Api.Configuration;
using Microsoft.Extensions.Configuration;

namespace AuraLogbook.Api.Tests;

public class JwtSettingsTests
{
    [Fact]
    public void FromConfiguration_rejects_missing_signing_key()
    {
        var configuration = CreateConfiguration("");

        var exception = Assert.Throws<InvalidOperationException>(
            () => JwtSettings.FromConfiguration(configuration));

        Assert.Contains("Jwt:Key", exception.Message);
    }

    [Fact]
    public void FromConfiguration_rejects_short_signing_key()
    {
        var configuration = CreateConfiguration("too-short");

        Assert.Throws<InvalidOperationException>(
            () => JwtSettings.FromConfiguration(configuration));
    }

    [Fact]
    public void FromConfiguration_accepts_runtime_key_and_returns_validation_settings()
    {
        const string key = "a sufficiently long test-only signing key value";
        var configuration = CreateConfiguration(key);

        var settings = JwtSettings.FromConfiguration(configuration);

        Assert.Equal(key, System.Text.Encoding.UTF8.GetString(settings.SigningKeyBytes));
        Assert.Equal("AuraLogbook", settings.Issuer);
        Assert.Equal("AuraLogbookUsers", settings.Audience);
    }

    private static IConfiguration CreateConfiguration(string key) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = key,
                ["Jwt:Issuer"] = "AuraLogbook",
                ["Jwt:Audience"] = "AuraLogbookUsers"
            })
            .Build();
}
