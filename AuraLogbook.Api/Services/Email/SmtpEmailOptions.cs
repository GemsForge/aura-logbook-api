namespace AuraLogbook.Api.Services.Email;

/// <summary>
/// Configuration section <c>Email:Smtp</c> for the production sender (#335).
/// <see cref="Username"/> and <see cref="Password"/> are secrets: supply them through user secrets
/// or hosting environment variables (<c>Email__Smtp__Password</c>), never appsettings files.
/// </summary>
public sealed class SmtpEmailOptions
{
    public const string SectionName = "Email:Smtp";

    /// <summary>SMTP relay host, e.g. smtp.postmarkapp.com. Empty means no production sender.</summary>
    public string Host { get; set; } = "";

    /// <summary>Submission port; 587 with STARTTLS by default.</summary>
    public int Port { get; set; } = 587;

    /// <summary>When true use implicit TLS (port 465); otherwise require STARTTLS.</summary>
    public bool UseImplicitTls { get; set; }

    public string Username { get; set; } = "";
    public string Password { get; set; } = "";

    /// <summary>Verified sender address on an SPF/DKIM-configured domain.</summary>
    public string FromAddress { get; set; } = "";
    public string FromName { get; set; } = "Aura Logbook";

    /// <summary>True when the host and sender address are both set.</summary>
    public bool IsConfigured => !string.IsNullOrWhiteSpace(Host) && !string.IsNullOrWhiteSpace(FromAddress);
}
