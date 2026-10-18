using System.Text;

namespace AuraLogbook.Api.Configuration;

public sealed class JwtSettings
{
    private JwtSettings(string key, string issuer, string audience)
    {
        SigningKeyBytes = Encoding.UTF8.GetBytes(key);
        Issuer = issuer;
        Audience = audience;
    }

    public byte[] SigningKeyBytes { get; }
    public string Issuer { get; }
    public string Audience { get; }

    public static JwtSettings FromConfiguration(IConfiguration configuration)
    {
        var key = configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(key) || Encoding.UTF8.GetByteCount(key) < 32)
        {
            throw new InvalidOperationException(
                "Configuration 'Jwt:Key' must be supplied through user-secrets or deployment secrets and contain at least 32 UTF-8 bytes.");
        }

        var issuer = configuration["Jwt:Issuer"];
        var audience = configuration["Jwt:Audience"];
        if (string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(audience))
        {
            throw new InvalidOperationException(
                "Configuration 'Jwt:Issuer' and 'Jwt:Audience' must both be set.");
        }

        return new JwtSettings(key, issuer, audience);
    }
}
