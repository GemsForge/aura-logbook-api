using Microsoft.AspNetCore.Cors.Infrastructure;

namespace AuraLogbook.Api.Configuration;

/// <summary>Builds the API browser-origin policy from environment configuration.</summary>
public static class CorsOriginPolicy
{
    /// <summary>Reads <c>Cors:AllowedOrigins</c>, requiring at least one origin in Production.</summary>
    /// <param name="configuration">Application configuration providers, including Azure app settings.</param>
    /// <param name="environment">The active ASP.NET Core environment.</param>
    /// <returns>A default CORS policy that allows configured origins, methods, and headers.</returns>
    /// <exception cref="InvalidOperationException">Production has no configured allowed origins.</exception>
    public static CorsPolicy Create(IConfiguration configuration, IHostEnvironment environment)
    {
        var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        if (environment.IsProduction() && allowedOrigins.Length == 0)
            throw new InvalidOperationException(
                "Cors:AllowedOrigins must contain the deployed UI origin in Production. Configure Azure app settings such as Cors__AllowedOrigins__0.");

        return Create(allowedOrigins);
    }

    /// <summary>Builds a CORS policy for a fixed set of browser origins.</summary>
    /// <param name="allowedOrigins">Exact origins, including scheme and port when present.</param>
    /// <returns>A CORS policy that permits only the supplied origins.</returns>
    public static CorsPolicy Create(IEnumerable<string> allowedOrigins) => new CorsPolicyBuilder()
        .WithOrigins(allowedOrigins.ToArray())
        .AllowAnyMethod()
        .AllowAnyHeader()
        .Build();
}
