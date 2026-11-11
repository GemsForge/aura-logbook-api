using AuraLogbook.Api.Services.Helpers;
using Microsoft.Extensions.Configuration;

namespace AuraLogbook.Api.Tests;

/// <summary>The JWT signing key comes only from secrets and must be long enough for HS256.</summary>
public sealed class JwtSigningKeyTests
{
    private static IConfiguration Config(string? key) =>
        new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["Jwt:Key"] = key }).Build();

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void MissingKey_ThrowsNamingTheSetting(string? key) =>
        Assert.Contains("Jwt:Key is not configured", Assert.Throws<InvalidOperationException>(() => JwtSigningKey.Read(Config(key))).Message);

    [Fact]
    public void ShortKey_ThrowsWithoutEchoingTheValue()
    {
        var ex = Assert.Throws<InvalidOperationException>(() => JwtSigningKey.Read(Config("too-short-secret")));
        Assert.DoesNotContain("too-short-secret", ex.Message);
    }

    [Fact]
    public void LongEnoughKey_ReturnsBytes() =>
        Assert.Equal(40, JwtSigningKey.Read(Config(new string('k', 40))).Length);
}
