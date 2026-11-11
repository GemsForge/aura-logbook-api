using MailKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace AuraLogbook.Api.Services.Email;

/// <summary>Delivers one prepared message over SMTP. Abstracted so tests never open a socket.</summary>
public interface ISmtpTransport
{
    Task SendAsync(MimeMessage message, SmtpEmailOptions options, CancellationToken cancellationToken);
}

/// <summary>MailKit transport: connects, authenticates when credentials exist, sends, disconnects.</summary>
public sealed class MailKitSmtpTransport : ISmtpTransport
{
    public async Task SendAsync(MimeMessage message, SmtpEmailOptions options, CancellationToken cancellationToken)
    {
        using var client = new SmtpClient();
        var security = options.UseImplicitTls ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;
        await client.ConnectAsync(options.Host, options.Port, security, cancellationToken);
        if (!string.IsNullOrEmpty(options.Username))
            await client.AuthenticateAsync(options.Username, options.Password, cancellationToken);
        await client.SendAsync(new SendRequest(message), cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }
}

/// <summary>
/// Production <see cref="IEmailSender"/> for Staging and Production (#335). Sends plain-text mail.
/// It never logs the body, which carries reset links; failures propagate to the caller, which
/// logs them without the message content.
/// </summary>
public sealed class SmtpEmailSender : IEmailSender
{
    private readonly ISmtpTransport _transport;
    private readonly SmtpEmailOptions _options;

    public SmtpEmailSender(ISmtpTransport transport, IOptions<SmtpEmailOptions> options)
    {
        _transport = transport;
        _options = options.Value;
    }

    /// <inheritdoc />
    public Task SendAsync(string toEmail, string subject, string body, CancellationToken cancellationToken = default)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.FromName, _options.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart("plain") { Text = body };
        return _transport.SendAsync(message, _options, cancellationToken);
    }
}
