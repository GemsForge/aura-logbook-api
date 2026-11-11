using System.Text;

namespace AuraLogbook.Api.Services.Helpers;

/// <summary>
/// Reads the JWT signing key from configuration. The key is a secret and is never committed:
/// supply <c>Jwt:Key</c> through user secrets locally or <c>Jwt__Key</c> in deployments.
/// </summary>
public static class JwtSigningKey
{
    /// <summary>HS256 needs at least 256 bits of key material.</summary>
    public const int MinimumBytes = 32;

    /// <summary>
    /// Returns the configured key bytes, or throws at startup with a message that names the setting
    /// (never the value) when it is missing or shorter than <see cref="MinimumBytes"/>.
    /// </summary>
    public static byte[] Read(IConfiguration configuration)
    {
        var key = configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(key))
            throw new InvalidOperationException(
                "Jwt:Key is not configured. Set it with dotnet user-secrets locally or the Jwt__Key environment variable in deployments.");
        var bytes = Encoding.UTF8.GetBytes(key);
        if (bytes.Length < MinimumBytes)
            throw new InvalidOperationException($"Jwt:Key must be at least {MinimumBytes} bytes.");
        return bytes;
    }
}
