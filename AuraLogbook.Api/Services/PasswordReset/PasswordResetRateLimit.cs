using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace AuraLogbook.Api.Services.PasswordReset;

/// <summary>Per-client-IP fixed-window limiter applied to the recovery endpoints.</summary>
public static class PasswordResetRateLimit
{
    public const string PolicyName = "password-reset";

    /// <summary>Registers the policy; rejected calls receive 429 Too Many Requests.</summary>
    public static IServiceCollection AddPasswordResetRateLimit(this IServiceCollection services, PasswordResetOptions options)
    {
        return services.AddRateLimiter(limiter =>
        {
            limiter.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            limiter.AddPolicy(PolicyName, context => RateLimitPartition.GetFixedWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = options.MaxRequestsPerIp,
                    Window = TimeSpan.FromMinutes(options.RateLimitWindowMinutes),
                    QueueLimit = 0,
                }));
        });
    }
}
