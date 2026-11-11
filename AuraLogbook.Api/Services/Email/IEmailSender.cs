namespace AuraLogbook.Api.Services.Email;

/// <summary>
/// Outbound email abstraction shared by account recovery (#329) and magic-link sign-in (#326).
/// No production provider exists yet; only <see cref="DevelopmentLogEmailSender"/> is registered.
/// </summary>
public interface IEmailSender
{
    Task SendAsync(string toEmail, string subject, string body, CancellationToken cancellationToken = default);
}
