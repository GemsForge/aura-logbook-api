using System.Text;

namespace AuraLogbook.Api.Services.Helpers;

/// <summary>
/// Reads <c>Jwt:Key</c>, which is never committed: supply it through user secrets locally or
/// <c>Jwt__Key</c> in each deployed environment. Startup fails fast with a clear message rather
/// than signing tokens with a missing or weak key.
/// </summary>
public static class JwtSigningKey
{
    /// <summary>HMAC-SHA256 needs at least 256 bits of key material.</summary>
    public const int MinimumBytes = 32;

    /// <summary>Returns the key bytes, or throws when the key is absent or shorter than <see cref="MinimumBytes"/>.</summary>
    public static byte[] Require(IConfiguration configuration)
    {
        var key = configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(key))
            throw new InvalidOperationException(
                "Jwt:Key is not configured. Set it with 'dotnet user-secrets set \"Jwt:Key\" <value>' locally or the Jwt__Key environment variable when deployed.");
        var bytes = Encoding.UTF8.GetBytes(key);
        if (bytes.Length < MinimumBytes)
            throw new InvalidOperationException($"Jwt:Key must be at least {MinimumBytes} bytes.");
        return bytes;
    }
}
