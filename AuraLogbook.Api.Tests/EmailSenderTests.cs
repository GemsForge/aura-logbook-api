using AuraLogbook.Api.Controllers;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services;
using AuraLogbook.Api.Services.Email;
using AuraLogbook.Api.Services.PasswordReset;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using Moq;

namespace AuraLogbook.Api.Tests;

/// <summary>
/// #335: production SMTP sender, per-environment sender registration, recovery enablement rules,
/// and token-free handling of provider failures.
/// </summary>
public sealed class EmailSenderTests
{
    private static readonly SmtpEmailOptions Smtp = new()
    {
        Host = "smtp.test", FromAddress = "no-reply@aura.test", FromName = "Aura Logbook",
    };

    [Fact]
    public async Task SmtpSender_BuildsPlainTextMessage_AndHandsItToTransport()
    {
        var transport = new Mock<ISmtpTransport>();
        MimeMessage? sent = null;
        transport.Setup(t => t.SendAsync(It.IsAny<MimeMessage>(), It.IsAny<SmtpEmailOptions>(), It.IsAny<CancellationToken>()))
            .Callback<MimeMessage, SmtpEmailOptions, CancellationToken>((m, _, _) => sent = m)
            .Returns(Task.CompletedTask);

        await new SmtpEmailSender(transport.Object, Options.Create(Smtp)).SendAsync("user@aura.test", "Subject", "Body text");

        Assert.NotNull(sent);
        Assert.Equal("no-reply@aura.test", sent!.From.Mailboxes.Single().Address);
        Assert.Equal("user@aura.test", sent.To.Mailboxes.Single().Address);
        Assert.Equal("Subject", sent.Subject);
        Assert.Equal("Body text", sent.TextBody);
        Assert.Null(sent.HtmlBody);
    }

    [Theory]
    [InlineData("Development", false, typeof(DevelopmentLogEmailSender), true)]
    [InlineData("Development", true, typeof(DevelopmentLogEmailSender), true)]
    [InlineData("Staging", true, typeof(SmtpEmailSender), true)]
    [InlineData("Production", true, typeof(SmtpEmailSender), true)]
    [InlineData("Staging", false, typeof(UnavailableEmailSender), false)]
    [InlineData("Production", false, typeof(UnavailableEmailSender), false)]
    public void Registration_PicksSenderPerEnvironment(string environment, bool smtpConfigured, Type expected, bool available)
    {
        var settings = new Dictionary<string, string?>();
        if (smtpConfigured)
        {
            settings["Email:Smtp:Host"] = "smtp.test";
            settings["Email:Smtp:Port"] = "2525";
            settings["Email:Smtp:FromAddress"] = "no-reply@aura.test";
        }
        var config = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        var env = Mock.Of<IHostEnvironment>(e => e.EnvironmentName == environment);
        var services = new ServiceCollection().AddLogging();

        Assert.Equal(available, services.AddAuraEmailSender(config, env));

        using var provider = services.BuildServiceProvider();
        Assert.IsType(expected, provider.GetRequiredService<IEmailSender>());
        if (smtpConfigured)
            Assert.Equal(2525, provider.GetRequiredService<IOptions<SmtpEmailOptions>>().Value.Port);
    }

    [Theory]
    [InlineData(true, true, "https://aura.test/reset-password", true)]
    [InlineData(true, true, "http://localhost:58407/reset-password", true)]
    [InlineData(false, true, "https://aura.test/reset-password", false)]
    [InlineData(true, false, "https://aura.test/reset-password", false)]
    [InlineData(true, true, "/reset-password", false)]
    [InlineData(true, true, "", false)]
    [InlineData(true, true, "ftp://aura.test/reset", false)]
    [InlineData(true, true, "https://aura.test/reset-password?src=mail", false)]
    [InlineData(true, true, "https://aura.test/#/reset-password", false)]
    public void Enablement_RequiresFlagSenderAndAbsoluteUrl(bool flag, bool sender, string url, bool expected) =>
        Assert.Equal(expected, PasswordResetOptions.IsEffectivelyEnabled(flag, sender, url));

    [Fact]
    public async Task SenderFailure_KeepsGenericResponse_AndLogsNoTokenOrLink()
    {
        var user = new User { Id = 7, Email = "user@aura.test" };
        var users = new Mock<IFileUserRepository>();
        users.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);
        var sender = new Mock<IEmailSender>();
        string? body = null;
        sender.Setup(s => s.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Callback<string, string, string, CancellationToken>((_, _, b, _) => body = b)
            .ThrowsAsync(new InvalidOperationException("relay refused message containing reset link"));
        var logger = new CapturingLogger<PasswordResetService>();
        var options = new PasswordResetOptions { Enabled = true, ResetUrlBase = "https://aura.test/reset-password" };
        var service = new PasswordResetService(users.Object, Mock.Of<IPasswordResetTokenRepository>(), sender.Object,
            new MemoryCache(new MemoryCacheOptions()), Options.Create(options), TimeProvider.System, logger);
        var controller = new AuthController(Mock.Of<IUserService>(), null!, service, Options.Create(options));

        var result = await controller.ForgotPassword(new ForgotPasswordRequest { Email = user.Email }, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(body);
        var token = body!.Split("token=")[1].Split('\n')[0];
        var error = Assert.Single(logger.Entries, e => e.Level == LogLevel.Error);
        Assert.DoesNotContain(token, error.Message);
        Assert.DoesNotContain("reset-password", error.Message);
        Assert.DoesNotContain("relay refused", error.Message);
        Assert.Null(error.Exception);
    }

    [Fact]
    public async Task SenderFailure_StoresNoToken_SoEarlierLinkSurvives()
    {
        var user = new User { Id = 7, Email = "user@aura.test" };
        var users = new Mock<IFileUserRepository>();
        users.Setup(r => r.GetByEmailAsync(user.Email)).ReturnsAsync(user);
        var tokens = new Mock<IPasswordResetTokenRepository>();
        var sender = new Mock<IEmailSender>();
        sender.Setup(s => s.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new IOException("relay down"));
        var service = new PasswordResetService(users.Object, tokens.Object, sender.Object,
            new MemoryCache(new MemoryCacheOptions()),
            Options.Create(new PasswordResetOptions { Enabled = true, ResetUrlBase = "https://aura.test/reset-password" }),
            TimeProvider.System, new CapturingLogger<PasswordResetService>());

        await service.RequestResetAsync(user.Email);

        tokens.Verify(t => t.IssueAsync(It.IsAny<PasswordResetToken>()), Times.Never);
    }

    private sealed class CapturingLogger<T> : ILogger<T>
    {
        public List<(LogLevel Level, string Message, Exception? Exception)> Entries { get; } = new();
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) =>
            Entries.Add((logLevel, formatter(state, exception), exception));
    }
}
