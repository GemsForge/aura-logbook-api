namespace AuraLogbook.Api.Services.Email;

/// <summary>
/// Placeholder registered when no sender is configured outside Development. Features that send
/// mail stay disabled in that case, so this is never expected to be called.
/// </summary>
public sealed class UnavailableEmailSender : IEmailSender
{
    public Task SendAsync(string toEmail, string subject, string body, CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException("No email sender is configured for this environment.");
}
