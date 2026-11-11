namespace AuraLogbook.Api.Services.Email;

/// <summary>
/// Development-only sender that writes the message to the log instead of delivering mail.
/// This is the one place a raw reset link may appear; never register it outside Development.
/// </summary>
public sealed class DevelopmentLogEmailSender : IEmailSender
{
    private readonly ILogger<DevelopmentLogEmailSender> _logger;
    public DevelopmentLogEmailSender(ILogger<DevelopmentLogEmailSender> logger) => _logger = logger;

    public Task SendAsync(string toEmail, string subject, string body, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[DEV EMAIL] To: {To} | Subject: {Subject}\n{Body}", toEmail, subject, body);
        return Task.CompletedTask;
    }
}
