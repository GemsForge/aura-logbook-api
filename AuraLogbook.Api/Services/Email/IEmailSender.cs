namespace AuraLogbook.Api.Services.Email;

/// <summary>
/// Outbound email abstraction shared by account recovery (#329) and magic-link sign-in (#326).
/// Registered per environment by <see cref="EmailSenderRegistration"/>: a log sender in Development,
/// <see cref="SmtpEmailSender"/> elsewhere when configured.
/// </summary>
public interface IEmailSender
{
    Task SendAsync(string toEmail, string subject, string body, CancellationToken cancellationToken = default);
}
