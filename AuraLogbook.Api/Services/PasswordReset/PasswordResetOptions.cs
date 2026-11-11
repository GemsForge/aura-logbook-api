namespace AuraLogbook.Api.Services.PasswordReset;

/// <summary>Configuration section <c>PasswordReset</c>.</summary>
public sealed class PasswordResetOptions
{
    public const string SectionName = "PasswordReset";

    /// <summary>
    /// Off by default. Enabled only in Development until a production <c>IEmailSender</c> exists;
    /// when false both endpoints return 404.
    /// </summary>
    public bool Enabled { get; set; }

    /// <summary>UI page that receives <c>?token=</c>, e.g. http://localhost:58407/reset-password.</summary>
    public string ResetUrlBase { get; set; } = "http://localhost:58407/reset-password";

    /// <summary>Token lifetime.</summary>
    public int TokenLifetimeMinutes { get; set; } = 30;

    /// <summary>Maximum reset emails per address per window; extra requests are silently dropped.</summary>
    public int MaxRequestsPerEmail { get; set; } = 3;

    /// <summary>Maximum forgot-password calls per client IP per window; extra calls get 429.</summary>
    public int MaxRequestsPerIp { get; set; } = 10;

    /// <summary>Rate-limit window shared by the per-email and per-IP limits.</summary>
    public int RateLimitWindowMinutes { get; set; } = 15;
}
