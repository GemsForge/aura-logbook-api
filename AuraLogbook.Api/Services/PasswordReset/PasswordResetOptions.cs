namespace AuraLogbook.Api.Services.PasswordReset;

/// <summary>Configuration section <c>PasswordReset</c>.</summary>
public sealed class PasswordResetOptions
{
    public const string SectionName = "PasswordReset";

    /// <summary>
    /// Off by default. Effective only when an email sender is registered and
    /// <see cref="ResetUrlBase"/> is an absolute URL (see <see cref="IsEffectivelyEnabled"/>);
    /// when false both endpoints return 404.
    /// </summary>
    public bool Enabled { get; set; }

    /// <summary>
    /// UI page that receives <c>?token=</c>. Set per environment; the Development value matches the
    /// Vite dev server port (58407, <c>strictPort</c>).
    /// </summary>
    public string ResetUrlBase { get; set; } = "http://localhost:58407/reset-password";

    /// <summary>Token lifetime.</summary>
    public int TokenLifetimeMinutes { get; set; } = 30;

    /// <summary>Maximum reset emails per address per window; extra requests are silently dropped.</summary>
    public int MaxRequestsPerEmail { get; set; } = 3;

    /// <summary>Maximum forgot-password calls per client IP per window; extra calls get 429.</summary>
    public int MaxRequestsPerIp { get; set; } = 10;

    /// <summary>Rate-limit window shared by the per-email and per-IP limits.</summary>
    public int RateLimitWindowMinutes { get; set; } = 15;

    /// <summary>
    /// Enablement rule (#335): the flag is on, a real sender exists, and the reset link base is an
    /// absolute http(s) URL with no query or fragment, since the token is appended as
    /// <c>?token=</c>. Replaces the former Development-only guard.
    /// </summary>
    public static bool IsEffectivelyEnabled(bool configuredEnabled, bool senderAvailable, string? resetUrlBase) =>
        configuredEnabled && senderAvailable
        && Uri.TryCreate(resetUrlBase, UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp)
        && uri.Query.Length == 0 && uri.Fragment.Length == 0;
}
